import { describe, it, expect } from "vitest";
import {
    computeNetworkId,
    detectNetworkFingerprint,
    extractSrflxIpv4,
    generateRoomCode,
    isValidPublicIpv4,
    normalizeRoomCode,
    sha256HexSync
} from "../src/lab/voxel/voxel-lan-net.js";
import {
    createLanSignaling,
    decodeVarInt,
    encodeConnect,
    encodePingReq,
    encodePublish,
    encodeSubscribe,
    encodeVarInt,
    parseMqttPackets,
    topicMatchesFilter
} from "../src/lab/voxel/voxel-lan-mqtt.js";
import { decodeOfflineSignal, encodeOfflineSignal } from "../src/lab/voxel/voxel-lan-transport.js";

function createFakeBroadcastClass() {
    const channels = new Map();
    return class FakeBroadcastChannel {
        constructor(name) {
            this.name = name;
            this.onmessage = null;
            if (!channels.has(name)) channels.set(name, new Set());
            channels.get(name).add(this);
        }
        postMessage(data) {
            const set = channels.get(this.name);
            if (!set) return;
            for (const peer of set) {
                if (peer !== this && peer.onmessage) peer.onmessage({ data });
            }
        }
        close() {
            const set = channels.get(this.name);
            if (set) set.delete(this);
        }
    };
}

describe("Voxel LAN network fingerprint & room codes", () => {
    it("produces deterministic SHA-256 network IDs without leaking raw IPv4", async () => {
        expect(sha256HexSync("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
        const idA = await computeNetworkId("114.124.210.45");
        const idB = await computeNetworkId("114.124.210.45");
        const idC = await computeNetworkId("114.124.210.46");
        expect(idA).toHaveLength(20);
        expect(idA).toBe(idB);
        expect(idA).not.toBe(idC);
        expect(idA).not.toContain("114");
    });

    it("validates public IPv4 addresses and extracts STUN srflx candidates", () => {
        expect(isValidPublicIpv4("203.0.113.10")).toBe(true);
        expect(isValidPublicIpv4("192.168.1.5")).toBe(false);
        expect(isValidPublicIpv4("10.0.0.1")).toBe(false);
        expect(isValidPublicIpv4("172.20.10.2")).toBe(false);
        expect(isValidPublicIpv4("127.0.0.1")).toBe(false);

        const srflx = "candidate:2 1 udp 1686052607 180.244.12.99 54321 typ srflx raddr 0.0.0.0 rport 0";
        const host = "candidate:1 1 udp 2122260223 192.168.1.12 50000 typ host";
        expect(extractSrflxIpv4(srflx)).toBe("180.244.12.99");
        expect(extractSrflxIpv4(host)).toBeNull();
    });

    it("detects same-network ID via STUN and falls back cleanly to HTTP or offline", async () => {
        class MockRtc {
            constructor() {
                this.onicecandidate = null;
            }
            createDataChannel() {}
            createOffer() { return Promise.resolve({ type: "offer", sdp: "v=0" }); }
            setLocalDescription() {
                if (this.onicecandidate) {
                    this.onicecandidate({
                        candidate: { candidate: "candidate:1 1 udp 100 182.1.22.44 40000 typ srflx raddr 0.0.0.0 rport 0" }
                    });
                }
                return Promise.resolve();
            }
            close() {}
        }
        const viaStun = await detectNetworkFingerprint({ RtcImpl: MockRtc, allowHttpFallback: false });
        expect(viaStun.mode).toBe("lan");
        expect(viaStun.source).toBe("stun");
        expect(viaStun.netId).toHaveLength(20);

        const viaHttp = await detectNetworkFingerprint({
            RtcImpl: null,
            fetchImpl: async () => ({ ok: true, json: async () => ({ ip: "182.1.22.44" }) })
        });
        expect(viaHttp.source).toBe("http");
        expect(viaHttp.netId).toBe(viaStun.netId);

        const offline = await detectNetworkFingerprint({ RtcImpl: null, allowHttpFallback: false });
        expect(offline.mode).toBe("offline");
        expect(offline.netId).toBe("local-only");
    });

    it("normalizes room codes and round-trips offline SDP signals", () => {
        const code = generateRoomCode(() => 0.25);
        expect(code).toHaveLength(4);
        expect(normalizeRoomCode("a1-0o k7")).toBe("AK7");
        const enc = encodeOfflineSignal({ kind: "offer", from: "pl_1", sdp: { type: "offer", sdp: "v=0" } });
        expect(enc.startsWith("VOX1:")).toBe(true);
        expect(decodeOfflineSignal(enc).from).toBe("pl_1");
        expect(decodeOfflineSignal("invalid")).toBeNull();
    });
});

describe("Voxel LAN MQTT 3.1.1 codec & local BroadcastChannel bus", () => {
    it("encodes and parses CONNECT, SUBSCRIBE, retained PUBLISH, PINGREQ, and multi-byte lengths", () => {
        for (const n of [0, 127, 128, 16383, 16384]) {
            const bytes = Uint8Array.from(encodeVarInt(n));
            expect(decodeVarInt(bytes, 0).value).toBe(n);
        }
        const conn = encodeConnect({ clientId: "mv_1", willTopic: "a/b", willMessage: "", willRetain: true });
        expect(conn[0]).toBe(0x10);
        const sub = encodeSubscribe(7, "meteor-voxel-lan/v1/+/lobby/+");
        expect(sub[0]).toBe(0x82);
        expect(encodePingReq()).toEqual(new Uint8Array([0xc0, 0x00]));

        const pub1 = encodePublish("lan/net1/lobby/r1", JSON.stringify({ ok: true }), true);
        const pub2 = encodePublish("lan/net1/lobby/r2", "hello", false);
        const connack = new Uint8Array([0x20, 0x02, 0x00, 0x00]);
        const stream = new Uint8Array(connack.length + pub1.length + pub2.length);
        stream.set(connack, 0);
        stream.set(pub1, connack.length);
        stream.set(pub2, connack.length + pub1.length);

        const res = parseMqttPackets(stream);
        expect(res.remaining.length).toBe(0);
        expect(res.packets).toHaveLength(3);
        expect(res.packets[0]).toEqual({ type: "connack", returnCode: 0 });
        expect(res.packets[1].topic).toBe("lan/net1/lobby/r1");
        expect(res.packets[1].retain).toBe(true);
        expect(res.packets[2].payload).toBe("hello");
    });

    it("matches MQTT wildcards and mirrors retained beacons across tabs via BroadcastChannel", () => {
        expect(topicMatchesFilter("a/+/c", "a/b/c")).toBe(true);
        expect(topicMatchesFilter("a/+/c", "a/b/d")).toBe(false);
        expect(topicMatchesFilter("a/#", "a/b/c/d")).toBe(true);

        const FakeBc = createFakeBroadcastClass();
        const sigA = createLanSignaling({ clientId: "tab_a", WebSocketImpl: null, BroadcastChannelImpl: FakeBc, localBusName: "test-bus" });
        const sigB = createLanSignaling({ clientId: "tab_b", WebSocketImpl: null, BroadcastChannelImpl: FakeBc, localBusName: "test-bus" });

        const received = [];
        sigA.publish("lan/x/lobby/room1", { hostName: "Alex" }, { retain: true });
        sigB.subscribe("lan/x/lobby/+", (topic, payload) => received.push({ topic, payload }));

        expect(received).toHaveLength(1);
        expect(received[0].payload.hostName).toBe("Alex");

        sigA.destroy();
        sigB.destroy();
    });
});
