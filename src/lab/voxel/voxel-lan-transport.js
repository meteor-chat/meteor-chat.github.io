import { generatePeerId, inspectConnectionPath } from "./voxel-lan-net.js";

const DEFAULT_ICE_SERVERS = [
    {
        urls: [
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302",
            "stun:stun.cloudflare.com:3478"
        ]
    }
];

const ICE_FALLBACK_MS = 4500;
const PING_INTERVAL_MS = 2500;
const MAX_STATE_BUFFER = 32768;
const OFFLINE_PREFIX = "VOX1:";

export function encodeOfflineSignal(payload) {
    const json = JSON.stringify(payload);
    const bytes = new globalThis.TextEncoder().encode(json);
    let bin = "";
    for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
    return `${OFFLINE_PREFIX}${globalThis.btoa(bin)}`;
}

export function decodeOfflineSignal(code) {
    if (typeof code !== "string") return null;
    const trimmed = code.trim();
    if (!trimmed.startsWith(OFFLINE_PREFIX)) return null;
    try {
        const bin = globalThis.atob(trimmed.slice(OFFLINE_PREFIX.length));
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
        return JSON.parse(new globalThis.TextDecoder().decode(bytes));
    } catch {
        return null;
    }
}

function waitForIceGather(pc, timeoutMs = 2400) {
    if (pc.iceGatheringState === "complete") return Promise.resolve();
    return new Promise((resolve) => {
        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            globalThis.clearTimeout(timer);
            pc.removeEventListener("icegatheringstatechange", onChange);
            resolve();
        };
        const onChange = () => {
            if (pc.iceGatheringState === "complete") finish();
        };
        const timer = globalThis.setTimeout(finish, timeoutMs);
        pc.addEventListener("icegatheringstatechange", onChange);
    });
}

export function createLanTransport(opts) {
    const {
        signaling,
        roomPrefix,
        localPeerId,
        iceServers = DEFAULT_ICE_SERVERS,
        iceFallbackMs = ICE_FALLBACK_MS,
        RtcImpl = globalThis.RTCPeerConnection,
        onPeerReady = null,
        onPeerClosed = null,
        onMessage = null,
        onPeerStats = null
    } = opts;

    const peers = new Map();
    const cleanups = [];
    let destroyed = false;

    const sigTopic = (peerId) => `${roomPrefix}/sig/${peerId}`;
    const relayTopic = (peerId) => `${roomPrefix}/relay/${peerId}`;

    const emitReady = (peer, mode) => {
        const prev = peer.mode;
        peer.mode = mode;
        if (peer.fallbackTimer) {
            globalThis.clearTimeout(peer.fallbackTimer);
            peer.fallbackTimer = null;
        }
        if (!peer.readyFired) {
            peer.readyFired = true;
            if (onPeerReady) onPeerReady(peer.id, mode);
        } else if (prev !== mode && onPeerStats) {
            onPeerStats(peer.id, { path: mode, rttMs: peer.rttMs });
        }
    };

    const activateRelayFallback = (peer, notifyRemote) => {
        if (destroyed || peer.closed || peer.offlineOnly) return;
        if (peer.mode === "lan-direct" || peer.mode === "p2p-stun") return;
        if (notifyRemote && signaling) {
            signaling.publish(relayTopic(peer.id), { t: "_relay_open", from: localPeerId });
        }
        emitReady(peer, "relay");
    };

    const handleInboundPayload = (peerId, raw) => {
        if (destroyed) return;
        let msg = raw;
        if (typeof raw === "string") {
            try {
                msg = JSON.parse(raw);
            } catch {
                return;
            }
        }
        if (!msg || typeof msg !== "object") return;
        const peer = peers.get(peerId);
        if (!peer || peer.closed) return;

        if (msg.t === "_ping") {
            sendReliable(peerId, { t: "_pong", ts: msg.ts });
            return;
        }
        if (msg.t === "_pong" && typeof msg.ts === "number") {
            peer.rttMs = Math.max(1, Math.round(Date.now() - msg.ts));
            if (onPeerStats) onPeerStats(peerId, { path: peer.mode, rttMs: peer.rttMs });
            return;
        }
        if (msg.t === "_relay_open") {
            activateRelayFallback(peer, false);
            return;
        }
        if (onMessage) onMessage(peerId, msg);
    };

    const bindDataChannel = (peer, channel) => {
        const isState = channel.label === "state";
        if (isState) peer.stateCh = channel;
        else peer.eventsCh = channel;

        channel.onopen = async () => {
            if (destroyed || peer.closed) return;
            if (peer.eventsCh && peer.eventsCh.readyState === "open") {
                const info = await inspectConnectionPath(peer.pc);
                const resolvedMode = info.path === "lan-direct" ? "lan-direct" : "p2p-stun";
                if (typeof info.rttMs === "number") peer.rttMs = info.rttMs;
                emitReady(peer, resolvedMode);
            }
        };

        channel.onmessage = (ev) => {
            handleInboundPayload(peer.id, ev.data);
        };

        channel.onclose = () => {
            if (destroyed || peer.closed) return;
            if (peer.mode !== "relay" && peer.eventsCh === channel) {
                disconnectPeer(peer.id);
            }
        };
    };

    const ensurePeer = (remotePeerId, config = {}) => {
        if (peers.has(remotePeerId)) return peers.get(remotePeerId);
        const peer = {
            id: remotePeerId,
            pc: null,
            eventsCh: null,
            stateCh: null,
            mode: "connecting",
            rttMs: null,
            readyFired: false,
            closed: false,
            offlineOnly: Boolean(config.offlineOnly),
            pendingCandidates: [],
            fallbackTimer: null
        };
        peers.set(remotePeerId, peer);

        if (typeof RtcImpl === "function") {
            try {
                const pc = new RtcImpl({ iceServers: peer.offlineOnly ? [] : iceServers });
                peer.pc = pc;
                pc.ondatachannel = (ev) => bindDataChannel(peer, ev.channel);
                pc.onicecandidate = (ev) => {
                    if (peer.offlineOnly || !ev.candidate || !signaling) return;
                    signaling.publish(sigTopic(remotePeerId), {
                        t: "ice",
                        from: localPeerId,
                        cand: ev.candidate.toJSON ? ev.candidate.toJSON() : ev.candidate
                    });
                };
                pc.oniceconnectionstatechange = () => {
                    if (destroyed || peer.closed) return;
                    const st = pc.iceConnectionState;
                    if (st === "failed" || st === "disconnected") {
                        if (!peer.offlineOnly && signaling) {
                            activateRelayFallback(peer, true);
                        } else if (st === "failed") {
                            disconnectPeer(remotePeerId);
                        }
                    }
                };
            } catch {
                peer.pc = null;
            }
        }

        if (!peer.offlineOnly && signaling) {
            if (!peer.pc) {
                peer.fallbackTimer = globalThis.setTimeout(() => activateRelayFallback(peer, true), 40);
            } else {
                peer.fallbackTimer = globalThis.setTimeout(() => activateRelayFallback(peer, true), iceFallbackMs);
            }
        }
        return peer;
    };

    const flushPendingIce = async (peer) => {
        if (!peer.pc || !peer.pc.remoteDescription) return;
        while (peer.pendingCandidates.length > 0) {
            const c = peer.pendingCandidates.shift();
            try {
                await peer.pc.addIceCandidate(c);
            } catch {
                continue;
            }
        }
    };

    const connectToPeer = async (remotePeerId, { initiator = true } = {}) => {
        if (destroyed || !remotePeerId || remotePeerId === localPeerId) return;
        const peer = ensurePeer(remotePeerId);
        if (!peer.pc) {
            activateRelayFallback(peer, true);
            return;
        }
        if (!initiator) return;
        try {
            const evCh = peer.pc.createDataChannel("events", { ordered: true });
            const stCh = peer.pc.createDataChannel("state", { ordered: false, maxRetransmits: 0 });
            bindDataChannel(peer, evCh);
            bindDataChannel(peer, stCh);
            const offer = await peer.pc.createOffer();
            await peer.pc.setLocalDescription(offer);
            if (signaling) {
                signaling.publish(sigTopic(remotePeerId), {
                    t: "offer",
                    from: localPeerId,
                    sdp: offer
                });
            }
        } catch {
            activateRelayFallback(peer, true);
        }
    };

    const handleSignal = async (msg) => {
        if (destroyed || !msg || !msg.from || msg.from === localPeerId) return;
        const peer = ensurePeer(msg.from);
        if (!peer.pc) {
            activateRelayFallback(peer, true);
            return;
        }
        try {
            if (msg.t === "offer" && msg.sdp) {
                await peer.pc.setRemoteDescription(msg.sdp);
                await flushPendingIce(peer);
                const answer = await peer.pc.createAnswer();
                await peer.pc.setLocalDescription(answer);
                if (signaling) {
                    signaling.publish(sigTopic(msg.from), {
                        t: "answer",
                        from: localPeerId,
                        sdp: answer
                    });
                }
            } else if (msg.t === "answer" && msg.sdp) {
                await peer.pc.setRemoteDescription(msg.sdp);
                await flushPendingIce(peer);
            } else if (msg.t === "ice" && msg.cand) {
                if (peer.pc.remoteDescription) {
                    await peer.pc.addIceCandidate(msg.cand);
                } else {
                    peer.pendingCandidates.push(msg.cand);
                }
            }
        } catch {
            activateRelayFallback(peer, true);
        }
    };

    if (signaling && roomPrefix) {
        cleanups.push(signaling.subscribe(sigTopic(localPeerId), (_topic, payload) => {
            handleSignal(payload);
        }));
        cleanups.push(signaling.subscribe(relayTopic(localPeerId), (_topic, payload) => {
            if (!payload || !payload.from || payload.from === localPeerId) return;
            ensurePeer(payload.from);
            handleInboundPayload(payload.from, payload.body !== undefined ? payload.body : payload);
        }));
    }

    const sendReliable = (peerId, payload) => {
        const peer = peers.get(peerId);
        if (!peer || peer.closed) return false;
        const text = typeof payload === "string" ? payload : JSON.stringify(payload);
        if (peer.eventsCh && peer.eventsCh.readyState === "open") {
            try {
                peer.eventsCh.send(text);
                return true;
            } catch {
                return false;
            }
        }
        if (peer.mode === "relay" && signaling) {
            return signaling.publish(relayTopic(peerId), { from: localPeerId, body: payload });
        }
        return false;
    };

    const sendState = (peerId, payload) => {
        const peer = peers.get(peerId);
        if (!peer || peer.closed) return false;
        const text = typeof payload === "string" ? payload : JSON.stringify(payload);
        if (peer.stateCh && peer.stateCh.readyState === "open") {
            if ((peer.stateCh.bufferedAmount || 0) > MAX_STATE_BUFFER) return false;
            try {
                peer.stateCh.send(text);
                return true;
            } catch {
                return false;
            }
        }
        if (peer.eventsCh && peer.eventsCh.readyState === "open") {
            if ((peer.eventsCh.bufferedAmount || 0) > MAX_STATE_BUFFER) return false;
            try {
                peer.eventsCh.send(text);
                return true;
            } catch {
                return false;
            }
        }
        if (peer.mode === "relay" && signaling) {
            return signaling.publish(relayTopic(peerId), { from: localPeerId, body: payload }, { dedup: false });
        }
        return false;
    };

    const broadcastReliable = (payload, excludePeerId = null) => {
        for (const id of peers.keys()) {
            if (id !== excludePeerId) sendReliable(id, payload);
        }
    };

    const broadcastState = (payload, excludePeerId = null) => {
        for (const id of peers.keys()) {
            if (id !== excludePeerId) sendState(id, payload);
        }
    };

    const disconnectPeer = (peerId) => {
        const peer = peers.get(peerId);
        if (!peer || peer.closed) return;
        peer.closed = true;
        if (peer.fallbackTimer) {
            globalThis.clearTimeout(peer.fallbackTimer);
            peer.fallbackTimer = null;
        }
        try {
            if (peer.eventsCh) peer.eventsCh.close();
            if (peer.stateCh) peer.stateCh.close();
            if (peer.pc) peer.pc.close();
        } catch {
            peer.pc = null;
        }
        peers.delete(peerId);
        if (onPeerClosed) onPeerClosed(peerId);
    };

    const createOfflineOffer = async () => {
        const peerId = generatePeerId("off");
        const peer = ensurePeer(peerId, { offlineOnly: true });
        if (!peer.pc) throw new Error("WebRTC unavailable");
        const evCh = peer.pc.createDataChannel("events", { ordered: true });
        const stCh = peer.pc.createDataChannel("state", { ordered: false, maxRetransmits: 0 });
        bindDataChannel(peer, evCh);
        bindDataChannel(peer, stCh);
        const offer = await peer.pc.createOffer();
        await peer.pc.setLocalDescription(offer);
        await waitForIceGather(peer.pc);
        const code = encodeOfflineSignal({ kind: "offer", from: localPeerId, sdp: peer.pc.localDescription });
        return { peerId, code };
    };

    const acceptOfflineOffer = async (code) => {
        const parsed = decodeOfflineSignal(code);
        if (!parsed || parsed.kind !== "offer" || !parsed.sdp) {
            throw new Error("Invalid offline offer code");
        }
        const peerId = parsed.from || generatePeerId("host");
        const peer = ensurePeer(peerId, { offlineOnly: true });
        if (!peer.pc) throw new Error("WebRTC unavailable");
        await peer.pc.setRemoteDescription(parsed.sdp);
        const answer = await peer.pc.createAnswer();
        await peer.pc.setLocalDescription(answer);
        await waitForIceGather(peer.pc);
        const answerCode = encodeOfflineSignal({ kind: "answer", from: localPeerId, sdp: peer.pc.localDescription });
        return { peerId, answerCode };
    };

    const acceptOfflineAnswer = async (peerId, answerCode) => {
        const parsed = decodeOfflineSignal(answerCode);
        if (!parsed || parsed.kind !== "answer" || !parsed.sdp) {
            throw new Error("Invalid offline answer code");
        }
        const peer = peers.get(peerId);
        if (!peer || !peer.pc) throw new Error("Offline offer expired");
        await peer.pc.setRemoteDescription(parsed.sdp);
    };

    const pingTimer = globalThis.setInterval(() => {
        if (destroyed) return;
        const now = Date.now();
        for (const [id, peer] of peers.entries()) {
            if (!peer.readyFired || peer.closed) continue;
            sendReliable(id, { t: "_ping", ts: now });
            if (peer.pc && peer.mode !== "relay") {
                inspectConnectionPath(peer.pc).then((info) => {
                    if (destroyed || peer.closed) return;
                    if (info.path === "lan-direct" || info.path === "p2p-stun") {
                        peer.mode = info.path;
                    }
                    if (typeof info.rttMs === "number") peer.rttMs = info.rttMs;
                    if (onPeerStats) onPeerStats(id, { path: peer.mode, rttMs: peer.rttMs });
                });
            }
        }
    }, PING_INTERVAL_MS);

    const getPeerInfo = (peerId) => {
        const peer = peers.get(peerId);
        if (!peer) return null;
        return { id: peer.id, path: peer.mode, rttMs: peer.rttMs, ready: peer.readyFired };
    };

    const destroy = () => {
        destroyed = true;
        globalThis.clearInterval(pingTimer);
        for (const fn of cleanups) fn();
        cleanups.length = 0;
        for (const id of Array.from(peers.keys())) disconnectPeer(id);
    };

    return {
        connectToPeer,
        sendReliable,
        sendState,
        broadcastReliable,
        broadcastState,
        disconnectPeer,
        createOfflineOffer,
        acceptOfflineOffer,
        acceptOfflineAnswer,
        getPeerInfo,
        getPeerCount: () => peers.size,
        destroy
    };
}
