import { describe, it, expect, afterEach } from "vitest";
import { BLOCK } from "../src/lab/voxel/voxel-blocks.js";
import { createLanSignaling } from "../src/lab/voxel/voxel-lan-mqtt.js";
import { createLanSession } from "../src/lab/voxel/voxel-lan-session.js";
import { createVoxelWorld } from "../src/lab/voxel/voxel-world.js";

function createMemoryBusClass() {
    const map = new Map();
    return class MemBus {
        constructor(name) {
            this.name = name;
            this.onmessage = null;
            if (!map.has(name)) map.set(name, new Set());
            map.get(name).add(this);
        }
        postMessage(data) {
            for (const peer of map.get(this.name) || []) {
                if (peer !== this && peer.onmessage) peer.onmessage({ data });
            }
        }
        close() {
            const set = map.get(this.name);
            if (set) set.delete(this);
        }
    };
}

const flush = (ms = 80) => new Promise((r) => setTimeout(r, ms));

describe("Voxel LAN multiplayer session & world synchronization", () => {
    const cleanups = [];

    afterEach(() => {
        while (cleanups.length > 0) cleanups.pop()();
    });

    it("discovers host on same network, falls back to relay when WebRTC absent, syncs edits without corrupting guest save, and chats", async () => {
        const Bus = createMemoryBusClass();
        const busName = `lan-sim-${Date.now()}`;

        const hostWorld = createVoxelWorld({ seed: 2026, viewRadius: 2, useWorker: false });
        hostWorld.warmAreaSync(8, 8, 1);
        hostWorld.setBlock(8, 60, 8, BLOCK.GOLD_ORE);
        cleanups.push(() => hostWorld.destroy());

        const guestWorld = createVoxelWorld({ seed: 2026, viewRadius: 2, useWorker: false });
        guestWorld.warmAreaSync(8, 8, 1);
        guestWorld.setBlock(9, 60, 9, BLOCK.LANTERN);
        cleanups.push(() => guestWorld.destroy());

        const hostPlayer = { pos: [8, 52, 8], yaw: 0.4, pitch: -0.1, sneaking: false, flyMode: false };
        const guestPlayer = { pos: [10, 52, 10], yaw: 1.2, pitch: 0.05, sneaking: false, flyMode: false };
        const guestEnv = { timeOfDay: 0.28, autoCycle: false, rain: false };

        const hostSig = createLanSignaling({ clientId: "host_1", WebSocketImpl: null, BroadcastChannelImpl: Bus, localBusName: busName });
        const guestSig = createLanSignaling({ clientId: "guest_1", WebSocketImpl: null, BroadcastChannelImpl: Bus, localBusName: busName });

        const host = createLanSession({
            localPeerId: "host_1",
            playerName: "HostAlex",
            signaling: hostSig,
            RtcImpl: null,
            detectNetworkFingerprint: async () => ({ netId: "abc1234567890abcdef1", mode: "lan", source: "stun" }),
            hooks: {
                getLocalPlayer: () => hostPlayer,
                getWorldSnapshot: () => ({
                    seed: hostWorld.getSeed(),
                    timeOfDay: 0.62,
                    autoCycle: false,
                    rain: true,
                    spawnPos: [...hostPlayer.pos],
                    edits: hostWorld.getStorage().exportEdits()
                }),
                onRemoteBlock: (x, y, z, id, _by, persist) => hostWorld.setBlockRemote(x, y, z, id, persist)
            }
        });
        cleanups.push(() => host.destroy());

        const guest = createLanSession({
            localPeerId: "guest_1",
            playerName: "FriendBudi",
            signaling: guestSig,
            RtcImpl: null,
            detectNetworkFingerprint: async () => ({ netId: "abc1234567890abcdef1", mode: "lan", source: "stun" }),
            hooks: {
                getLocalPlayer: () => guestPlayer,
                onWorldSync: (sync) => {
                    guestWorld.applyGuestWorld({ seed: sync.seed, edits: sync.edits, centerPos: sync.spawnPos, warmRadius: 1 });
                    guestEnv.timeOfDay = sync.timeOfDay;
                    guestEnv.rain = sync.rain;
                },
                onLeaveGuestWorld: () => {
                    guestWorld.restoreLocalWorld([8, 52, 8], 1);
                },
                onRemoteBlock: (x, y, z, id) => guestWorld.setBlockRemote(x, y, z, id, true),
                onEnvSync: (env) => {
                    guestEnv.timeOfDay = env.timeOfDay;
                    guestEnv.rain = env.rain;
                }
            }
        });
        cleanups.push(() => guest.destroy());

        const room = await host.hostWorld({ playerName: "HostAlex", strictSameNet: true });
        await guest.startScan();
        await flush(60);

        const found = guest.getSnapshot().discoveredRooms;
        expect(found).toHaveLength(1);
        expect(found[0].roomId).toBe(room.roomId);

        await guest.joinRoom(found[0], { playerName: "FriendBudi" });
        await flush(120);

        expect(guest.getRole()).toBe("guest");
        expect(host.getSnapshot().peers).toHaveLength(1);
        expect(host.getSnapshot().peers[0].path).toBe("relay");

        expect(guestWorld.getBlock(8, 60, 8)).toBe(BLOCK.GOLD_ORE);
        expect(guestWorld.getBlock(9, 60, 9)).not.toBe(BLOCK.LANTERN);
        expect(guestEnv.timeOfDay).toBeCloseTo(0.62, 2);
        expect(guestEnv.rain).toBe(true);

        guest.sendLocalBlockChange(11, 61, 11, BLOCK.TORCH);
        guest.sendLocalBlockChange(11, 62, 11, BLOCK.BEDROCK);
        host.sendLocalBlockChange(12, 61, 12, BLOCK.GLASS);
        host.sendEnvSync(0.88, false, false);
        guest.sendChat("Hello from WiFi!");
        await flush(60);

        expect(hostWorld.getBlock(11, 61, 11)).toBe(BLOCK.TORCH);
        expect(hostWorld.getBlock(11, 62, 11)).not.toBe(BLOCK.BEDROCK);
        expect(guestWorld.getBlock(12, 61, 12)).toBe(BLOCK.GLASS);
        expect(guestEnv.timeOfDay).toBeCloseTo(0.88, 2);
        expect(host.getSnapshot().chat.some((m) => m.text === "Hello from WiFi!")).toBe(true);

        guest.update(0.06, guestPlayer, BLOCK.TORCH, guestWorld);
        await flush(40);
        host.update(0.05, hostPlayer, BLOCK.GRASS, hostWorld);
        const remote = host.getRemotePlayerEntities()[0];
        expect(remote.heldBlockId).toBe(BLOCK.TORCH);

        guest.leaveSession();
        await flush(40);
        expect(guest.getRole()).toBe("idle");
        expect(guestWorld.getStorage().isGuestMode()).toBe(false);
        expect(guestWorld.getBlock(9, 60, 9)).toBe(BLOCK.LANTERN);
    });

    it("rejects mismatched network when Strict Same Network is ON unless using 4-char Room Code", async () => {
        const topics = new Map();
        const makeNetSig = (id) => ({
            clientId: id,
            connect() {},
            setWill() {},
            onStatus(fn) { fn({ connected: true, brokerUrl: "mem", localReady: false }); return () => {}; },
            getStatus() { return { connected: true, brokerUrl: "mem", localReady: false }; },
            subscribe(filter, handler) {
                if (!topics.has(filter)) topics.set(filter, new Set());
                topics.get(filter).add(handler);
                return () => topics.get(filter).delete(handler);
            },
            publish(topic, payload) {
                for (const [f, set] of topics.entries()) {
                    if (f === topic || (f.endsWith("/+") && topic.startsWith(f.slice(0, -1)))) {
                        for (const fn of set) fn(topic, payload, { via: "mqtt" });
                    }
                }
            },
            destroy() {}
        });

        const host = createLanSession({
            localPeerId: "h_strict",
            signaling: makeNetSig("h_strict"),
            RtcImpl: null,
            detectNetworkFingerprint: async () => ({ netId: "wifi_a_hash_12345678", mode: "lan", source: "stun" }),
            hooks: { getWorldSnapshot: () => ({ seed: 2026, timeOfDay: 0.28, autoCycle: false, rain: false, spawnPos: [8, 52, 8], edits: [] }) }
        });
        cleanups.push(() => host.destroy());

        const outsider = createLanSession({
            localPeerId: "g_other",
            signaling: makeNetSig("g_other"),
            RtcImpl: null,
            detectNetworkFingerprint: async () => ({ netId: "wifi_b_hash_87654321", mode: "lan", source: "stun" })
        });
        cleanups.push(() => outsider.destroy());

        const room = await host.hostWorld({ playerName: "Host", strictSameNet: true });
        await outsider.joinRoom(room, { playerName: "Outsider", viaCode: false });
        await flush(40);

        expect(outsider.getRole()).toBe("idle");
        expect(outsider.getSnapshot().error).toContain("Different network");

        await outsider.joinRoom(room, { playerName: "Outsider", viaCode: true, roomCode: room.roomCode });
        await flush(120);
        expect(outsider.getRole()).toBe("guest");
    });
});
