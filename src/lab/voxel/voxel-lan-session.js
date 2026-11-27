import { BLOCK, CHUNK_HEIGHT, isSolid } from "./voxel-blocks.js";
import { createLanSignaling } from "./voxel-lan-mqtt.js";
import {
    detectNetworkFingerprint,
    generatePeerId,
    generateRoomCode,
    normalizeRoomCode
} from "./voxel-lan-net.js";
import { createLanTransport } from "./voxel-lan-transport.js";
import { groundBelow } from "./voxel-mob-system.js";
import { PLAYER_H, PLAYER_HW } from "./voxel-physics.js";
import { MAX_REMOTE_PLAYERS, PLAYER_OUTFITS } from "./voxel-player-model.js";

const TOPIC_ROOT = "meteor-voxel-lan/v1";
const LOBBY_BEACON_MS = 5000;
const LOBBY_TTL_MS = 16000;
const STATE_SEND_INTERVAL = 0.05;
const MOB_SYNC_INTERVAL = 0.2;
const MAX_CHAT_HISTORY = 40;
const MAX_CHAT_LEN = 180;
const MAX_NAME_LEN = 18;
const CODE_LOOKUP_TIMEOUT_MS = 4500;
const JOIN_TIMEOUT_MS = 6500;

function sanitizeName(raw, fallback = "Player") {
    if (typeof raw !== "string") return fallback;
    const clean = raw.replace(/[\r\n\t<>]/g, "").trim().slice(0, MAX_NAME_LEN);
    return clean || fallback;
}

function sanitizeChat(raw) {
    if (typeof raw !== "string") return "";
    return raw.replace(/[\r\n\t]/g, " ").trim().slice(0, MAX_CHAT_LEN);
}

function sanitizeOutfit(raw) {
    for (const o of PLAYER_OUTFITS) {
        if (o.id === raw) return o.id;
    }
    return PLAYER_OUTFITS[0].id;
}

function lerpAngle(a, b, t) {
    let diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return a + diff * t;
}

function overlapsPlayerBox(x, y, z, pos) {
    return (
        x < pos[0] + PLAYER_HW &&
        x + 1 > pos[0] - PLAYER_HW &&
        y < pos[1] + PLAYER_H &&
        y + 1 > pos[1] &&
        z < pos[2] + PLAYER_HW &&
        z + 1 > pos[2] - PLAYER_HW
    );
}

function makeRemoteEntity(id, name, outfit, pos, yaw = 0, pitch = 0) {
    const safePos = Array.isArray(pos) && pos.length === 3 ? [...pos] : [8, 52, 8];
    return {
        id,
        kind: "player",
        name: sanitizeName(name, "Friend"),
        variant: sanitizeOutfit(outfit),
        pos: [...safePos],
        targetPos: [...safePos],
        yaw,
        targetYaw: yaw,
        pitch,
        targetPitch: pitch,
        hw: PLAYER_HW,
        h: PLAYER_H,
        heldBlockId: BLOCK.GRASS,
        sky: 1,
        blk: 0,
        groundY: safePos[1],
        phaseSeed: (id.charCodeAt(id.length - 1) || 1) * 0.7,
        anim: { phase: 0, moving: 0, swing: 0, sneaking: false, flying: false },
        path: "connecting",
        rttMs: null
    };
}

export function createLanSession(opts = {}) {
    const localPeerId = opts.localPeerId || generatePeerId("pl");
    const signaling = opts.signaling || createLanSignaling({ clientId: localPeerId, ...opts.signalingOpts });
    const detectNet = opts.detectNetworkFingerprint || detectNetworkFingerprint;
    const hooks = opts.hooks || {};

    let role = "idle";
    let netInfo = { netId: "local-only", mode: "detecting", source: "none" };
    let netReadyPromise = null;
    let signalingStatus = signaling.getStatus();
    let localProfile = {
        name: sanitizeName(opts.playerName, "Explorer"),
        outfit: sanitizeOutfit(opts.outfit)
    };

    let roomMeta = null;
    let hostPeerId = null;
    let transport = null;
    let beaconTimer = null;
    let joinTimeout = null;
    let pruneTimer = null;
    let stateAcc = 0;
    let mobAcc = 0;
    let pendingSwing = false;
    let lastError = "";
    let destroyed = false;

    const discoveredRooms = new Map();
    const pendingJoiners = new Map();
    const remotePlayers = new Map();
    const syncedMobs = [];
    const chatMessages = [];
    const listeners = new Set();
    const sessionCleanups = [];
    const scanCleanups = [];

    const lobbyTopic = (netId, roomId) => `${TOPIC_ROOT}/${netId}/lobby/${roomId}`;
    const lobbyFilter = (netId) => `${TOPIC_ROOT}/${netId}/lobby/+`;
    const codeTopic = (code) => `${TOPIC_ROOT}/code/${code}`;
    const roomPrefix = (roomId) => `${TOPIC_ROOT}/room/${roomId}`;
    const joinTopic = (roomId) => `${TOPIC_ROOT}/room/${roomId}/join`;

    function getSnapshot() {
        const peers = [];
        for (const rp of remotePlayers.values()) {
            peers.push({
                id: rp.id,
                name: rp.name,
                outfit: rp.variant,
                path: rp.path,
                rttMs: rp.rttMs
            });
        }
        return {
            localPeerId,
            role,
            profile: { ...localProfile },
            netInfo: { ...netInfo },
            signaling: { ...signalingStatus },
            room: roomMeta ? { ...roomMeta } : null,
            discoveredRooms: Array.from(discoveredRooms.values()).sort((a, b) => b.lastSeen - a.lastSeen),
            peers,
            playerCount: role === "idle" ? 1 : remotePlayers.size + 1,
            chat: chatMessages.slice(-20),
            error: lastError
        };
    }

    const emitChange = () => {
        if (destroyed) return;
        const snap = getSnapshot();
        for (const fn of listeners) fn(snap);
    };

    const pushChat = (entry) => {
        chatMessages.push({
            id: `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
            ts: Date.now(),
            ...entry
        });
        while (chatMessages.length > MAX_CHAT_HISTORY) chatMessages.shift();
        emitChange();
    };

    const setError = (msg) => {
        lastError = msg || "";
        emitChange();
    };

    const unsubStatus = signaling.onStatus((st) => {
        signalingStatus = st;
        emitChange();
    });

    const ensureNetwork = () => {
        if (!netReadyPromise) {
            netReadyPromise = Promise.resolve(detectNet(opts.netOpts || {})).then((info) => {
                if (destroyed) return info;
                netInfo = info || { netId: "local-only", mode: "offline", source: "none" };
                emitChange();
                return netInfo;
            });
        }
        return netReadyPromise;
    };

    const stopScan = () => {
        for (const fn of scanCleanups) fn();
        scanCleanups.length = 0;
        if (pruneTimer) {
            globalThis.clearInterval(pruneTimer);
            pruneTimer = null;
        }
    };

    const handleLobbyBeacon = (topic, payload, meta) => {
        const parts = topic.split("/");
        const roomId = parts[parts.length - 1];
        if (!roomId) return;
        if (!payload || payload === "" || typeof payload !== "object") {
            if (discoveredRooms.delete(roomId)) emitChange();
            return;
        }
        if (payload.hostPeerId === localPeerId) return;
        if (!payload.roomId || !payload.hostPeerId) return;
        discoveredRooms.set(roomId, {
            roomId: payload.roomId,
            roomCode: payload.roomCode || "",
            hostPeerId: payload.hostPeerId,
            hostName: sanitizeName(payload.hostName, "Host"),
            worldName: sanitizeName(payload.worldName, "Voxel World"),
            seed: Number.isFinite(payload.seed) ? payload.seed : 2026,
            playerCount: Number(payload.playerCount) || 1,
            maxPlayers: Number(payload.maxPlayers) || MAX_REMOTE_PLAYERS,
            netId: payload.netId || "local-only",
            strictSameNet: payload.strictSameNet !== false,
            viaLocal: Boolean(meta && meta.via === "local"),
            lastSeen: Date.now()
        });
        emitChange();
    };

    const startScan = async () => {
        if (destroyed) return;
        signaling.connect();
        const info = await ensureNetwork();
        if (destroyed) return;
        stopScan();
        const filters = new Set([lobbyFilter(info.netId), lobbyFilter("local-only")]);
        for (const f of filters) {
            scanCleanups.push(signaling.subscribe(f, handleLobbyBeacon));
        }
        pruneTimer = globalThis.setInterval(() => {
            const now = Date.now();
            let changed = false;
            for (const [id, r] of discoveredRooms.entries()) {
                if (now - r.lastSeen > LOBBY_TTL_MS) {
                    discoveredRooms.delete(id);
                    changed = true;
                }
            }
            if (changed) emitChange();
        }, 4000);
        emitChange();
    };

    const refreshNetwork = async () => {
        netReadyPromise = null;
        netInfo = { netId: "local-only", mode: "detecting", source: "none" };
        emitChange();
        await startScan();
        return netInfo;
    };

    const clearSessionResources = () => {
        if (beaconTimer) {
            globalThis.clearInterval(beaconTimer);
            beaconTimer = null;
        }
        if (joinTimeout) {
            globalThis.clearTimeout(joinTimeout);
            joinTimeout = null;
        }
        for (const fn of sessionCleanups) fn();
        sessionCleanups.length = 0;
        if (role === "host" && roomMeta) {
            signaling.publish(lobbyTopic(roomMeta.netId, roomMeta.roomId), "", { retain: true });
            if (roomMeta.roomCode) {
                signaling.publish(codeTopic(roomMeta.roomCode), "", { retain: true });
            }
            signaling.setWill(null);
        }
        if (transport) {
            transport.destroy();
            transport = null;
        }
        pendingJoiners.clear();
        remotePlayers.clear();
        syncedMobs.length = 0;
        roomMeta = null;
        hostPeerId = null;
    };

    const leaveSession = (reason = "") => {
        const prevRole = role;
        clearSessionResources();
        role = "idle";
        if (prevRole === "guest" && hooks.onLeaveGuestWorld) {
            hooks.onLeaveGuestWorld();
        }
        if (reason) {
            pushChat({ system: true, text: reason });
        } else if (prevRole !== "idle") {
            pushChat({ system: true, text: "Disconnected from LAN session." });
        }
        emitChange();
    };

    const buildRosterList = () => {
        const list = [];
        const localPos = hooks.getLocalPlayer ? hooks.getLocalPlayer().pos : [8, 52, 8];
        list.push({
            id: localPeerId,
            name: localProfile.name,
            outfit: localProfile.outfit,
            pos: [...localPos]
        });
        for (const rp of remotePlayers.values()) {
            list.push({
                id: rp.id,
                name: rp.name,
                outfit: rp.variant,
                pos: [...rp.pos]
            });
        }
        return list;
    };

    const publishHostBeacon = () => {
        if (role !== "host" || !roomMeta) return;
        const payload = {
            roomId: roomMeta.roomId,
            roomCode: roomMeta.roomCode,
            hostPeerId: localPeerId,
            hostName: localProfile.name,
            worldName: roomMeta.worldName,
            seed: roomMeta.seed,
            playerCount: remotePlayers.size + 1,
            maxPlayers: roomMeta.maxPlayers,
            netId: roomMeta.netId,
            strictSameNet: roomMeta.strictSameNet,
            ts: Date.now()
        };
        signaling.publish(lobbyTopic(roomMeta.netId, roomMeta.roomId), payload, { retain: true });
        if (roomMeta.roomCode) {
            signaling.publish(codeTopic(roomMeta.roomCode), payload, { retain: true });
        }
    };

    const sendWorldSyncTo = (peerId) => {
        if (!transport || !hooks.getWorldSnapshot) return;
        const snap = hooks.getWorldSnapshot();
        transport.sendReliable(peerId, {
            t: "world_sync",
            seed: snap.seed,
            timeOfDay: snap.timeOfDay,
            autoCycle: snap.autoCycle,
            rain: snap.rain,
            spawnPos: snap.spawnPos,
            hostId: localPeerId,
            hostName: localProfile.name,
            hostOutfit: localProfile.outfit,
            edits: snap.edits || [],
            players: buildRosterList()
        });
    };

    const applyRemoteBlockOnHost = (fromPeerId, msg) => {
        const x = Math.floor(msg.x);
        const y = Math.floor(msg.y);
        const z = Math.floor(msg.z);
        const id = msg.id | 0;
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return;
        if (y <= 1 || y >= CHUNK_HEIGHT || id < 0 || id === BLOCK.BEDROCK) return;
        if (isSolid(id)) {
            const lp = hooks.getLocalPlayer ? hooks.getLocalPlayer() : null;
            if (lp && overlapsPlayerBox(x, y, z, lp.pos)) return;
            for (const rp of remotePlayers.values()) {
                if (overlapsPlayerBox(x, y, z, rp.pos)) return;
            }
        }
        const ok = hooks.onRemoteBlock ? hooks.onRemoteBlock(x, y, z, id, fromPeerId, true) : false;
        if (ok && transport) {
            transport.broadcastReliable({ t: "block_set", x, y, z, id, by: fromPeerId }, fromPeerId);
        }
    };

    const handleHostMessage = (peerId, msg) => {
        const rp = remotePlayers.get(peerId);
        if (msg.t === "hello") {
            if (rp) {
                rp.name = sanitizeName(msg.name, rp.name);
                rp.variant = sanitizeOutfit(msg.outfit);
                emitChange();
            }
            return;
        }
        if (msg.t === "state" && rp) {
            if (Array.isArray(msg.p) && msg.p.length === 3) {
                rp.targetPos[0] = msg.p[0];
                rp.targetPos[1] = msg.p[1];
                rp.targetPos[2] = msg.p[2];
            }
            if (Number.isFinite(msg.y)) rp.targetYaw = msg.y;
            if (Number.isFinite(msg.pt)) rp.targetPitch = msg.pt;
            if (Number.isInteger(msg.h)) rp.heldBlockId = msg.h;
            if (typeof msg.sn === "boolean") rp.anim.sneaking = msg.sn;
            if (typeof msg.fl === "boolean") rp.anim.flying = msg.fl;
            if (msg.sw) rp.anim.swing = 1;
            if (transport) {
                transport.broadcastState({ ...msg, id: peerId }, peerId);
            }
            return;
        }
        if (msg.t === "block_set") {
            applyRemoteBlockOnHost(peerId, msg);
            return;
        }
        if (msg.t === "chat") {
            const text = sanitizeChat(msg.text);
            if (!text) return;
            const senderName = rp ? rp.name : "Friend";
            const packet = { t: "chat", from: peerId, name: senderName, text };
            pushChat({ from: peerId, name: senderName, text });
            if (transport) transport.broadcastReliable(packet, peerId);
        }
    };

    const handleGuestMessage = (_peerId, msg) => {
        if (msg.t === "world_sync") {
            if (joinTimeout) {
                globalThis.clearTimeout(joinTimeout);
                joinTimeout = null;
            }
            role = "guest";
            lastError = "";
            remotePlayers.clear();
            const roster = Array.isArray(msg.players) ? msg.players : [];
            for (const entry of roster) {
                if (!entry || entry.id === localPeerId) continue;
                remotePlayers.set(entry.id, makeRemoteEntity(entry.id, entry.name, entry.outfit, entry.pos));
            }
            if (!remotePlayers.has(msg.hostId) && msg.hostId && msg.hostId !== localPeerId) {
                remotePlayers.set(
                    msg.hostId,
                    makeRemoteEntity(msg.hostId, msg.hostName, msg.hostOutfit, msg.spawnPos)
                );
            }
            if (hooks.onWorldSync) hooks.onWorldSync(msg);
            pushChat({ system: true, text: `Joined ${sanitizeName(msg.hostName, "Host")}'s world.` });
            emitChange();
            return;
        }
        if (msg.t === "peer_join" && msg.id && msg.id !== localPeerId) {
            remotePlayers.set(msg.id, makeRemoteEntity(msg.id, msg.name, msg.outfit, msg.pos));
            pushChat({ system: true, text: `${sanitizeName(msg.name, "Friend")} joined.` });
            emitChange();
            return;
        }
        if (msg.t === "peer_leave" && msg.id) {
            const left = remotePlayers.get(msg.id);
            if (left) {
                remotePlayers.delete(msg.id);
                pushChat({ system: true, text: `${left.name} left.` });
                emitChange();
            }
            return;
        }
        if (msg.t === "state" && msg.id && msg.id !== localPeerId) {
            let rp = remotePlayers.get(msg.id);
            if (!rp) {
                rp = makeRemoteEntity(msg.id, msg.name || "Friend", msg.outfit, msg.p);
                remotePlayers.set(msg.id, rp);
            }
            if (Array.isArray(msg.p) && msg.p.length === 3) {
                rp.targetPos[0] = msg.p[0];
                rp.targetPos[1] = msg.p[1];
                rp.targetPos[2] = msg.p[2];
            }
            if (Number.isFinite(msg.y)) rp.targetYaw = msg.y;
            if (Number.isFinite(msg.pt)) rp.targetPitch = msg.pt;
            if (Number.isInteger(msg.h)) rp.heldBlockId = msg.h;
            if (typeof msg.sn === "boolean") rp.anim.sneaking = msg.sn;
            if (typeof msg.fl === "boolean") rp.anim.flying = msg.fl;
            if (msg.sw) rp.anim.swing = 1;
            return;
        }
        if (msg.t === "block_set") {
            if (hooks.onRemoteBlock) hooks.onRemoteBlock(msg.x, msg.y, msg.z, msg.id, msg.by || hostPeerId, false);
            return;
        }
        if (msg.t === "block_batch" && Array.isArray(msg.list)) {
            if (hooks.onRemoteBlock) {
                for (const item of msg.list) {
                    hooks.onRemoteBlock(item[0], item[1], item[2], item[3], hostPeerId, false);
                }
            }
            return;
        }
        if (msg.t === "env_sync") {
            if (hooks.onEnvSync) hooks.onEnvSync(msg);
            return;
        }
        if (msg.t === "mob_sync" && Array.isArray(msg.mobs)) {
            syncedMobs.length = 0;
            for (const m of msg.mobs) {
                syncedMobs.push({
                    kind: m[0],
                    variant: m[1],
                    pos: [m[2], m[3], m[4]],
                    yaw: m[5],
                    groundY: m[3],
                    sky: 1,
                    blk: 0,
                    hw: m[0] === "golem" ? 0.58 : m[0] === "chicken" ? 0.25 : 0.34,
                    h: m[0] === "golem" ? 2.6 : m[0] === "villager" ? 1.85 : 0.72,
                    anim: { phase: m[6] || 0, moving: m[7] || 0 }
                });
            }
            return;
        }
        if (msg.t === "chat") {
            const text = sanitizeChat(msg.text);
            if (text) pushChat({ from: msg.from, name: sanitizeName(msg.name, "Friend"), text });
            return;
        }
        if (msg.t === "kicked") {
            leaveSession(msg.reason || "Removed by host.");
        }
    };

    const hostWorld = async (hostOpts = {}) => {
        if (destroyed) return null;
        clearSessionResources();
        lastError = "";
        signaling.connect();
        const info = await ensureNetwork();
        if (destroyed) return null;

        if (hostOpts.playerName) localProfile.name = sanitizeName(hostOpts.playerName, localProfile.name);
        if (hostOpts.outfit) localProfile.outfit = sanitizeOutfit(hostOpts.outfit);

        const roomId = generatePeerId("rm");
        const roomCode = hostOpts.roomCode ? normalizeRoomCode(hostOpts.roomCode) : generateRoomCode();
        const snap = hooks.getWorldSnapshot ? hooks.getWorldSnapshot() : { seed: 2026 };
        const strictSameNet = hostOpts.strictSameNet !== false;
        const maxPlayers = Math.max(2, Math.min(MAX_REMOTE_PLAYERS, hostOpts.maxPlayers || MAX_REMOTE_PLAYERS));

        roomMeta = {
            roomId,
            roomCode,
            hostPeerId: localPeerId,
            worldName: sanitizeName(hostOpts.worldName, `${localProfile.name}'s World`),
            seed: snap.seed ?? 2026,
            netId: info.netId,
            strictSameNet,
            maxPlayers
        };
        role = "host";

        transport = createLanTransport({
            signaling,
            roomPrefix: roomPrefix(roomId),
            localPeerId,
            RtcImpl: opts.RtcImpl,
            iceFallbackMs: opts.iceFallbackMs,
            onPeerReady: (peerId, path) => {
                const pending = pendingJoiners.get(peerId) || { name: "Friend", outfit: PLAYER_OUTFITS[1].id };
                pendingJoiners.delete(peerId);
                const lp = hooks.getLocalPlayer ? hooks.getLocalPlayer() : { pos: [8, 52, 8] };
                const spawnNear = [lp.pos[0] + 1.6, lp.pos[1], lp.pos[2] + 1.6];
                const rp = makeRemoteEntity(peerId, pending.name, pending.outfit, spawnNear);
                rp.path = path;
                remotePlayers.set(peerId, rp);
                sendWorldSyncTo(peerId);
                transport.broadcastReliable(
                    { t: "peer_join", id: peerId, name: rp.name, outfit: rp.variant, pos: spawnNear },
                    peerId
                );
                publishHostBeacon();
                pushChat({ system: true, text: `${rp.name} joined (${path === "lan-direct" ? "Direct LAN" : path}).` });
                emitChange();
            },
            onPeerClosed: (peerId) => {
                const left = remotePlayers.get(peerId);
                if (!left) return;
                remotePlayers.delete(peerId);
                if (transport) transport.broadcastReliable({ t: "peer_leave", id: peerId });
                publishHostBeacon();
                pushChat({ system: true, text: `${left.name} left.` });
                emitChange();
            },
            onMessage: handleHostMessage,
            onPeerStats: (peerId, stats) => {
                const rp = remotePlayers.get(peerId);
                if (!rp) return;
                rp.path = stats.path;
                rp.rttMs = stats.rttMs;
                emitChange();
            }
        });

        sessionCleanups.push(signaling.subscribe(joinTopic(roomId), (_topic, msg, meta) => {
            if (!msg || msg.t !== "join-req" || !msg.from || msg.from === localPeerId) return;
            if (remotePlayers.size + 1 >= roomMeta.maxPlayers) {
                signaling.publish(joinTopic(roomId), { t: "join-reject", to: msg.from, reason: "World is full." });
                return;
            }
            const viaLocal = Boolean(meta && meta.via === "local");
            const sameNet = msg.netId === roomMeta.netId;
            const allowedCode = Boolean(msg.viaCode && normalizeRoomCode(msg.roomCode) === roomMeta.roomCode);
            if (roomMeta.strictSameNet && !viaLocal && !sameNet && !allowedCode) {
                signaling.publish(joinTopic(roomId), {
                    t: "join-reject",
                    to: msg.from,
                    reason: "Different network. Connect to the same WiFi/hotspot or enter the Room Code."
                });
                return;
            }
            pendingJoiners.set(msg.from, {
                name: sanitizeName(msg.name, "Friend"),
                outfit: sanitizeOutfit(msg.outfit)
            });
            signaling.publish(joinTopic(roomId), {
                t: "join-accept",
                to: msg.from,
                roomId,
                hostPeerId: localPeerId
            });
            transport.connectToPeer(msg.from, { initiator: false });
        }));

        signaling.setWill({ topic: lobbyTopic(info.netId, roomId), message: "", retain: true });
        publishHostBeacon();
        beaconTimer = globalThis.setInterval(publishHostBeacon, LOBBY_BEACON_MS);
        pushChat({ system: true, text: `Hosting on LAN (Code: ${roomCode}).` });
        emitChange();
        return roomMeta;
    };

    const joinRoom = async (targetRoom, joinOpts = {}) => {
        if (destroyed || !targetRoom || !targetRoom.roomId || !targetRoom.hostPeerId) return false;
        clearSessionResources();
        lastError = "";
        signaling.connect();
        const info = await ensureNetwork();
        if (destroyed) return false;

        if (joinOpts.playerName) localProfile.name = sanitizeName(joinOpts.playerName, localProfile.name);
        if (joinOpts.outfit) localProfile.outfit = sanitizeOutfit(joinOpts.outfit);

        role = "joining";
        hostPeerId = targetRoom.hostPeerId;
        roomMeta = { ...targetRoom };

        transport = createLanTransport({
            signaling,
            roomPrefix: roomPrefix(targetRoom.roomId),
            localPeerId,
            RtcImpl: opts.RtcImpl,
            iceFallbackMs: opts.iceFallbackMs,
            onPeerReady: (peerId, path) => {
                if (peerId !== hostPeerId) return;
                const hostEnt = remotePlayers.get(hostPeerId);
                if (hostEnt) hostEnt.path = path;
                transport.sendReliable(hostPeerId, {
                    t: "hello",
                    name: localProfile.name,
                    outfit: localProfile.outfit
                });
                emitChange();
            },
            onPeerClosed: (peerId) => {
                if (peerId === hostPeerId && role !== "idle") {
                    leaveSession("Host closed the world.");
                }
            },
            onMessage: handleGuestMessage,
            onPeerStats: (peerId, stats) => {
                const rp = remotePlayers.get(peerId);
                if (rp) {
                    rp.path = stats.path;
                    rp.rttMs = stats.rttMs;
                    emitChange();
                }
            }
        });

        sessionCleanups.push(signaling.subscribe(joinTopic(targetRoom.roomId), (_topic, msg) => {
            if (!msg || msg.to !== localPeerId) return;
            if (msg.t === "join-reject") {
                const reason = msg.reason || "Join rejected by host.";
                clearSessionResources();
                role = "idle";
                setError(reason);
                return;
            }
            if (msg.t === "join-accept") {
                transport.connectToPeer(hostPeerId, { initiator: true });
            }
        }));

        signaling.publish(joinTopic(targetRoom.roomId), {
            t: "join-req",
            from: localPeerId,
            name: localProfile.name,
            outfit: localProfile.outfit,
            netId: info.netId,
            viaCode: Boolean(joinOpts.viaCode),
            roomCode: joinOpts.roomCode || targetRoom.roomCode || ""
        });

        joinTimeout = globalThis.setTimeout(() => {
            if (role === "joining") {
                clearSessionResources();
                role = "idle";
                setError("Could not reach host on this network. Check WiFi/hotspot or try Offline Direct.");
            }
        }, JOIN_TIMEOUT_MS);

        emitChange();
        return true;
    };

    const joinByCode = (rawCode, joinOpts = {}) => {
        const code = normalizeRoomCode(rawCode);
        if (code.length !== 4) {
            setError("Enter a valid 4-character room code.");
            return Promise.resolve(false);
        }
        for (const r of discoveredRooms.values()) {
            if (r.roomCode === code) {
                return joinRoom(r, { ...joinOpts, viaCode: true, roomCode: code });
            }
        }
        signaling.connect();
        lastError = "";
        role = "joining";
        emitChange();
        return new Promise((resolve) => {
            let done = false;
            const finish = (ok, err) => {
                if (done) return;
                done = true;
                globalThis.clearTimeout(timer);
                unsub();
                if (!ok) {
                    role = "idle";
                    setError(err || `No active room found for code ${code}.`);
                }
                resolve(ok);
            };
            const unsub = signaling.subscribe(codeTopic(code), (_topic, payload) => {
                if (!payload || typeof payload !== "object" || !payload.roomId) return;
                finish(true);
                joinRoom(payload, { ...joinOpts, viaCode: true, roomCode: code });
            });
            const timer = globalThis.setTimeout(() => finish(false), CODE_LOOKUP_TIMEOUT_MS);
        });
    };

    const createOfflineHostOffer = async (hostOpts = {}) => {
        if (role !== "host") {
            await hostWorld({ ...hostOpts, strictSameNet: false });
        }
        if (!transport) throw new Error("Host transport not initialized");
        return transport.createOfflineOffer();
    };

    const joinOfflineOffer = async (offerCode, joinOpts = {}) => {
        clearSessionResources();
        lastError = "";
        if (joinOpts.playerName) localProfile.name = sanitizeName(joinOpts.playerName, localProfile.name);
        if (joinOpts.outfit) localProfile.outfit = sanitizeOutfit(joinOpts.outfit);
        role = "joining";
        transport = createLanTransport({
            signaling: null,
            roomPrefix: "",
            localPeerId,
            RtcImpl: opts.RtcImpl,
            onPeerReady: (peerId) => {
                hostPeerId = peerId;
                transport.sendReliable(peerId, { t: "hello", name: localProfile.name, outfit: localProfile.outfit });
                emitChange();
            },
            onPeerClosed: () => {
                if (role !== "idle") leaveSession("Offline host disconnected.");
            },
            onMessage: handleGuestMessage,
            onPeerStats: (peerId, stats) => {
                const rp = remotePlayers.get(peerId);
                if (rp) {
                    rp.path = stats.path;
                    rp.rttMs = stats.rttMs;
                    emitChange();
                }
            }
        });
        const res = await transport.acceptOfflineOffer(offerCode);
        hostPeerId = res.peerId;
        emitChange();
        return res;
    };

    const completeOfflineOffer = async (peerId, answerCode) => {
        if (!transport) throw new Error("No active offline offer");
        await transport.acceptOfflineAnswer(peerId, answerCode);
    };

    const kickPeer = (peerId) => {
        if (role !== "host" || !transport || !remotePlayers.has(peerId)) return;
        transport.sendReliable(peerId, { t: "kicked", reason: "You were removed by the host." });
        transport.disconnectPeer(peerId);
    };

    const sendChat = (rawText) => {
        const text = sanitizeChat(rawText);
        if (!text || (role !== "host" && role !== "guest") || !transport) return false;
        const packet = { t: "chat", from: localPeerId, name: localProfile.name, text };
        pushChat({ from: localPeerId, name: localProfile.name, text, self: true });
        if (role === "host") transport.broadcastReliable(packet);
        else if (hostPeerId) transport.sendReliable(hostPeerId, packet);
        return true;
    };

    const sendLocalBlockChange = (x, y, z, id) => {
        if (!transport || (role !== "host" && role !== "guest")) return;
        const packet = { t: "block_set", x: Math.floor(x), y: Math.floor(y), z: Math.floor(z), id: id | 0, by: localPeerId };
        if (role === "host") transport.broadcastReliable(packet);
        else if (hostPeerId) transport.sendReliable(hostPeerId, packet);
    };

    const sendDynamicBlockBatch = (list) => {
        if (role !== "host" || !transport || !list || list.length === 0) return;
        transport.broadcastReliable({ t: "block_batch", list });
    };

    const sendEnvSync = (timeOfDay, autoCycle, rain) => {
        if (role !== "host" || !transport) return;
        transport.broadcastReliable({ t: "env_sync", timeOfDay, autoCycle: Boolean(autoCycle), rain: Boolean(rain) });
    };

    const triggerLocalSwing = () => {
        pendingSwing = true;
    };

    const setProfile = (name, outfit) => {
        if (name !== undefined) localProfile.name = sanitizeName(name, localProfile.name);
        if (outfit !== undefined) localProfile.outfit = sanitizeOutfit(outfit);
        if (role === "host") publishHostBeacon();
        emitChange();
    };

    const setStrictSameNet = (strict) => {
        if (roomMeta && role === "host") {
            roomMeta.strictSameNet = Boolean(strict);
            publishHostBeacon();
            emitChange();
        }
    };

    const update = (dt, localPlayer, heldBlockId, world, localMobs = []) => {
        if (role === "idle" || destroyed) return;
        const smooth = Math.min(1, dt * 14);
        for (const rp of remotePlayers.values()) {
            const dx = rp.targetPos[0] - rp.pos[0];
            const dy = rp.targetPos[1] - rp.pos[1];
            const dz = rp.targetPos[2] - rp.pos[2];
            const distSq = dx * dx + dy * dy + dz * dz;
            if (distSq > 64) {
                rp.pos[0] = rp.targetPos[0];
                rp.pos[1] = rp.targetPos[1];
                rp.pos[2] = rp.targetPos[2];
            } else {
                rp.pos[0] += dx * smooth;
                rp.pos[1] += dy * smooth;
                rp.pos[2] += dz * smooth;
            }
            const horiz = Math.hypot(dx, dz);
            const movingTarget = horiz > 0.025 ? 1 : 0;
            rp.anim.moving += (movingTarget - rp.anim.moving) * Math.min(1, dt * 10);
            if (rp.anim.moving > 0.05) rp.anim.phase += dt * 9.5;
            if (rp.anim.swing > 0) rp.anim.swing = Math.max(0, rp.anim.swing - dt * 4.5);
            rp.yaw = lerpAngle(rp.yaw, rp.targetYaw, smooth);
            rp.pitch += (rp.targetPitch - rp.pitch) * smooth;
            if (world) {
                const lb = world.getLight(rp.pos[0], rp.pos[1] + 0.9, rp.pos[2]);
                rp.sky = ((lb >> 4) & 15) / 15;
                rp.blk = (lb & 15) / 15;
                rp.groundY = groundBelow(rp.pos, world.getBlock);
            }
        }

        if (!transport || !localPlayer) return;
        stateAcc += dt;
        if (stateAcc >= STATE_SEND_INTERVAL) {
            stateAcc = 0;
            const packet = {
                t: "state",
                id: localPeerId,
                name: localProfile.name,
                outfit: localProfile.outfit,
                p: [
                    Math.round(localPlayer.pos[0] * 100) / 100,
                    Math.round(localPlayer.pos[1] * 100) / 100,
                    Math.round(localPlayer.pos[2] * 100) / 100
                ],
                y: Math.round(localPlayer.yaw * 1000) / 1000,
                pt: Math.round(localPlayer.pitch * 1000) / 1000,
                h: heldBlockId | 0,
                sn: Boolean(localPlayer.sneaking),
                fl: Boolean(localPlayer.flyMode),
                sw: pendingSwing
            };
            pendingSwing = false;
            if (role === "host") transport.broadcastState(packet);
            else if (role === "guest" && hostPeerId) transport.sendState(hostPeerId, packet);
        }

        if (role === "host" && remotePlayers.size > 0 && localMobs.length > 0) {
            mobAcc += dt;
            if (mobAcc >= MOB_SYNC_INTERVAL) {
                mobAcc = 0;
                const compact = [];
                for (const m of localMobs) {
                    if (compact.length >= 28) break;
                    compact.push([
                        m.kind,
                        m.variant || "",
                        Math.round(m.pos[0] * 20) / 20,
                        Math.round(m.pos[1] * 20) / 20,
                        Math.round(m.pos[2] * 20) / 20,
                        Math.round((m.yaw || 0) * 100) / 100,
                        Math.round(((m.anim && m.anim.phase) || 0) * 10) / 10,
                        Math.round(((m.anim && m.anim.moving) || 0) * 10) / 10
                    ]);
                }
                transport.broadcastState({ t: "mob_sync", mobs: compact });
            }
        }
    };

    const onChange = (fn) => {
        listeners.add(fn);
        fn(getSnapshot());
        return () => listeners.delete(fn);
    };

    const destroy = () => {
        destroyed = true;
        stopScan();
        clearSessionResources();
        unsubStatus();
        signaling.destroy();
        listeners.clear();
    };

    return {
        localPeerId,
        startScan,
        stopScan,
        refreshNetwork,
        hostWorld,
        joinRoom,
        joinByCode,
        createOfflineHostOffer,
        joinOfflineOffer,
        completeOfflineOffer,
        leaveSession,
        kickPeer,
        sendChat,
        sendLocalBlockChange,
        sendDynamicBlockBatch,
        sendEnvSync,
        triggerLocalSwing,
        setProfile,
        setStrictSameNet,
        update,
        getSnapshot,
        onChange,
        getRole: () => role,
        isConnected: () => role === "host" || role === "guest",
        getRemotePlayerEntities: () => Array.from(remotePlayers.values()),
        getSyncedMobs: () => (role === "guest" ? syncedMobs : []),
        destroy
    };
}
