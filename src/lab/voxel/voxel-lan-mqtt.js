export const DEFAULT_MQTT_BROKERS = [
    "wss://broker.emqx.io:8084/mqtt",
    "wss://broker.hivemq.com:8884/mqtt",
    "wss://test.mosquitto.org:8081"
];

export const LOCAL_BUS_CHANNEL = "meteor-voxel-lan-v1";
const KEEPALIVE_SEC = 25;
const CONNECT_TIMEOUT_MS = 5000;

const textEncoder = new globalThis.TextEncoder();
const textDecoder = new globalThis.TextDecoder();

export function encodeVarInt(value) {
    let x = Math.max(0, value | 0);
    const out = [];
    do {
        let digit = x % 128;
        x = Math.floor(x / 128);
        if (x > 0) digit |= 0x80;
        out.push(digit);
    } while (x > 0);
    return out;
}

export function decodeVarInt(bytes, offset) {
    let mult = 1;
    let value = 0;
    let pos = offset;
    for (let i = 0; i < 4; i += 1) {
        if (pos >= bytes.length) return null;
        const encoded = bytes[pos];
        pos += 1;
        value += (encoded & 127) * mult;
        if ((encoded & 128) === 0) return { value, nextOffset: pos };
        mult *= 128;
    }
    return null;
}

function encodeUtf8Field(str) {
    const raw = textEncoder.encode(String(str));
    const out = new Uint8Array(2 + raw.length);
    out[0] = (raw.length >> 8) & 0xff;
    out[1] = raw.length & 0xff;
    out.set(raw, 2);
    return out;
}

function concatBytes(chunks) {
    let total = 0;
    for (const c of chunks) total += c.length;
    const out = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
        out.set(c, offset);
        offset += c.length;
    }
    return out;
}

function buildPacket(headerByte, bodyChunks) {
    const body = concatBytes(bodyChunks);
    const remLen = Uint8Array.from(encodeVarInt(body.length));
    const head = new Uint8Array([headerByte]);
    return concatBytes([head, remLen, body]);
}

export function encodeConnect({ clientId, keepAlive = KEEPALIVE_SEC, willTopic = "", willMessage = "", willRetain = false }) {
    const hasWill = Boolean(willTopic);
    let flags = 0x02;
    if (hasWill) {
        flags |= 0x04;
        if (willRetain) flags |= 0x20;
    }
    const varHeader = new Uint8Array([
        0x00, 0x04, 0x4d, 0x51, 0x54, 0x54,
        0x04,
        flags,
        (keepAlive >> 8) & 0xff,
        keepAlive & 0xff
    ]);
    const chunks = [varHeader, encodeUtf8Field(clientId)];
    if (hasWill) {
        chunks.push(encodeUtf8Field(willTopic));
        chunks.push(encodeUtf8Field(willMessage));
    }
    return buildPacket(0x10, chunks);
}

export function encodeSubscribe(packetId, topic) {
    const pid = new Uint8Array([(packetId >> 8) & 0xff, packetId & 0xff]);
    const qos = new Uint8Array([0x00]);
    return buildPacket(0x82, [pid, encodeUtf8Field(topic), qos]);
}

export function encodeUnsubscribe(packetId, topic) {
    const pid = new Uint8Array([(packetId >> 8) & 0xff, packetId & 0xff]);
    return buildPacket(0xa2, [pid, encodeUtf8Field(topic)]);
}

export function encodePublish(topic, payload, retain = false) {
    const rawPayload = typeof payload === "string" ? textEncoder.encode(payload) : payload;
    const header = retain ? 0x31 : 0x30;
    return buildPacket(header, [encodeUtf8Field(topic), rawPayload]);
}

export function encodePingReq() {
    return new Uint8Array([0xc0, 0x00]);
}

export function encodeDisconnect() {
    return new Uint8Array([0xe0, 0x00]);
}

export function parseMqttPackets(buffer) {
    const packets = [];
    let offset = 0;
    while (offset < buffer.length) {
        const header = buffer[offset];
        const lenInfo = decodeVarInt(buffer, offset + 1);
        if (!lenInfo) break;
        const bodyStart = lenInfo.nextOffset;
        const packetEnd = bodyStart + lenInfo.value;
        if (packetEnd > buffer.length) break;

        const type = (header >> 4) & 0x0f;
        const qos = (header >> 1) & 0x03;
        const retain = (header & 0x01) === 1;

        if (type === 2 && lenInfo.value >= 2) {
            packets.push({ type: "connack", returnCode: buffer[bodyStart + 1] });
        } else if (type === 3 && lenInfo.value >= 2) {
            const topicLen = (buffer[bodyStart] << 8) | buffer[bodyStart + 1];
            const topicEnd = bodyStart + 2 + topicLen;
            if (topicEnd <= packetEnd) {
                const topic = textDecoder.decode(buffer.subarray(bodyStart + 2, topicEnd));
                const payloadStart = qos > 0 ? topicEnd + 2 : topicEnd;
                const payload = payloadStart <= packetEnd
                    ? textDecoder.decode(buffer.subarray(payloadStart, packetEnd))
                    : "";
                packets.push({ type: "publish", topic, payload, retain });
            }
        } else if (type === 9) {
            packets.push({ type: "suback" });
        } else if (type === 13) {
            packets.push({ type: "pingresp" });
        }
        offset = packetEnd;
    }
    return { packets, remaining: buffer.subarray(offset) };
}

export function topicMatchesFilter(filter, topic) {
    if (filter === topic) return true;
    const fParts = filter.split("/");
    const tParts = topic.split("/");
    for (let i = 0; i < fParts.length; i += 1) {
        const f = fParts[i];
        if (f === "#") return true;
        if (i >= tParts.length) return false;
        if (f !== "+" && f !== tParts[i]) return false;
    }
    return fParts.length === tParts.length;
}

export function createLanSignaling(opts = {}) {
    const brokers = opts.brokers || DEFAULT_MQTT_BROKERS;
    const clientId = opts.clientId || `mv_${Math.random().toString(36).slice(2, 12)}`;
    const WsImpl = opts.WebSocketImpl !== undefined ? opts.WebSocketImpl : globalThis.WebSocket;
    const BcImpl = opts.BroadcastChannelImpl !== undefined ? opts.BroadcastChannelImpl : globalThis.BroadcastChannel;
    const localBusName = opts.localBusName || LOCAL_BUS_CHANNEL;

    const handlers = new Map();
    const statusListeners = new Set();
    const seenIds = new Set();
    const seenQueue = [];
    const retainedLocal = new Map();

    let ws = null;
    let bc = null;
    let rxBuf = new Uint8Array(0);
    let brokerIdx = 0;
    let packetId = 1;
    let connected = false;
    let connecting = false;
    let destroyed = false;
    let activeBroker = "";
    let pingTimer = null;
    let reconnectTimer = null;
    let connectTimer = null;
    let willConfig = null;

    const notifyStatus = () => {
        const snap = { connected, brokerUrl: activeBroker, localReady: Boolean(bc) };
        for (const fn of statusListeners) fn(snap);
    };

    const rememberMid = (mid) => {
        if (!mid) return false;
        if (seenIds.has(mid)) return true;
        seenIds.add(mid);
        seenQueue.push(mid);
        if (seenQueue.length > 256) {
            const old = seenQueue.shift();
            seenIds.delete(old);
        }
        return false;
    };

    const dispatchIncoming = (topic, rawPayload, meta = {}) => {
        let payload = rawPayload;
        let mid = null;
        if (typeof rawPayload === "string" && rawPayload.startsWith("{")) {
            try {
                const parsed = JSON.parse(rawPayload);
                if (parsed && parsed._mid) mid = parsed._mid;
                payload = parsed;
            } catch {
                payload = rawPayload;
            }
        }
        const matched = [];
        for (const [filter, set] of handlers.entries()) {
            if (!topicMatchesFilter(filter, topic)) continue;
            for (const fn of set) matched.push(fn);
        }
        if (matched.length === 0) return;
        if (!meta.retain && mid && rememberMid(mid)) return;
        for (const fn of matched) fn(topic, payload, meta);
    };

    if (typeof BcImpl === "function") {
        try {
            bc = new BcImpl(localBusName);
            bc.onmessage = (ev) => {
                const d = ev && ev.data;
                if (!d || d.sender === clientId) return;
                if (d.kind === "pub" && typeof d.topic === "string") {
                    if (d.retain) {
                        if (d.payload === "") retainedLocal.delete(d.topic);
                        else retainedLocal.set(d.topic, d.payload);
                    }
                    dispatchIncoming(d.topic, d.payload, { via: "local", retain: Boolean(d.retain) });
                } else if (d.kind === "sync-req" && typeof d.filter === "string") {
                    for (const [t, p] of retainedLocal.entries()) {
                        if (topicMatchesFilter(d.filter, t)) {
                            bc.postMessage({ kind: "pub", sender: clientId, topic: t, payload: p, retain: true });
                        }
                    }
                }
            };
        } catch {
            bc = null;
        }
    }

    const sendRaw = (bytes) => {
        if (!ws || ws.readyState !== 1) return false;
        try {
            ws.send(bytes);
            return true;
        } catch {
            return false;
        }
    };

    const clearTimers = () => {
        if (pingTimer) {
            globalThis.clearInterval(pingTimer);
            pingTimer = null;
        }
        if (connectTimer) {
            globalThis.clearTimeout(connectTimer);
            connectTimer = null;
        }
        if (reconnectTimer) {
            globalThis.clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
    };

    const closeSocket = () => {
        clearTimers();
        connected = false;
        connecting = false;
        if (ws) {
            try {
                ws.onopen = null;
                ws.onmessage = null;
                ws.onerror = null;
                ws.onclose = null;
                if (ws.readyState === 1) ws.send(encodeDisconnect());
                ws.close();
            } catch {
                ws = null;
            }
            ws = null;
        }
        rxBuf = new Uint8Array(0);
    };

    const scheduleReconnect = () => {
        if (destroyed || reconnectTimer || brokers.length === 0) return;
        brokerIdx = (brokerIdx + 1) % brokers.length;
        reconnectTimer = globalThis.setTimeout(() => {
            reconnectTimer = null;
            connect();
        }, 1600);
    };

    const resubscribeAll = () => {
        for (const filter of handlers.keys()) {
            packetId = (packetId % 65000) + 1;
            sendRaw(encodeSubscribe(packetId, filter));
        }
    };

    const connect = () => {
        if (destroyed || connecting || connected) return;
        if (typeof WsImpl !== "function" || brokers.length === 0) {
            notifyStatus();
            return;
        }
        connecting = true;
        const url = brokers[brokerIdx % brokers.length];
        activeBroker = url;
        try {
            ws = new WsImpl(url, "mqtt");
            ws.binaryType = "arraybuffer";
        } catch {
            connecting = false;
            scheduleReconnect();
            notifyStatus();
            return;
        }

        connectTimer = globalThis.setTimeout(() => {
            if (!connected && !destroyed) {
                closeSocket();
                scheduleReconnect();
                notifyStatus();
            }
        }, CONNECT_TIMEOUT_MS);

        ws.onopen = () => {
            if (destroyed) return;
            const pkt = encodeConnect({
                clientId,
                keepAlive: KEEPALIVE_SEC,
                willTopic: willConfig ? willConfig.topic : "",
                willMessage: willConfig ? willConfig.message : "",
                willRetain: willConfig ? Boolean(willConfig.retain) : false
            });
            sendRaw(pkt);
        };

        ws.onmessage = (ev) => {
            if (destroyed || !ev) return;
            const chunk = ev.data instanceof ArrayBuffer
                ? new Uint8Array(ev.data)
                : ev.data instanceof Uint8Array
                    ? ev.data
                    : null;
            if (!chunk) return;
            rxBuf = concatBytes([rxBuf, chunk]);
            const parsed = parseMqttPackets(rxBuf);
            rxBuf = parsed.remaining;
            for (const pkt of parsed.packets) {
                if (pkt.type === "connack") {
                    if (connectTimer) {
                        globalThis.clearTimeout(connectTimer);
                        connectTimer = null;
                    }
                    if (pkt.returnCode === 0) {
                        connecting = false;
                        connected = true;
                        resubscribeAll();
                        pingTimer = globalThis.setInterval(() => sendRaw(encodePingReq()), (KEEPALIVE_SEC - 4) * 1000);
                        notifyStatus();
                    } else {
                        closeSocket();
                        scheduleReconnect();
                        notifyStatus();
                    }
                } else if (pkt.type === "publish") {
                    dispatchIncoming(pkt.topic, pkt.payload, { via: "mqtt", retain: pkt.retain });
                }
            }
        };

        ws.onerror = () => {
            if (destroyed) return;
            closeSocket();
            scheduleReconnect();
            notifyStatus();
        };

        ws.onclose = () => {
            if (destroyed) return;
            const wasConnected = connected;
            closeSocket();
            if (wasConnected) notifyStatus();
            scheduleReconnect();
        };
    };

    const subscribe = (filter, handler) => {
        let set = handlers.get(filter);
        const isNew = !set;
        if (!set) {
            set = new Set();
            handlers.set(filter, set);
        }
        set.add(handler);
        if (isNew && connected) {
            packetId = (packetId % 65000) + 1;
            sendRaw(encodeSubscribe(packetId, filter));
        }
        if (bc) {
            try {
                bc.postMessage({ kind: "sync-req", sender: clientId, filter });
            } catch {
                return () => {};
            }
        }
        return () => {
            const cur = handlers.get(filter);
            if (!cur) return;
            cur.delete(handler);
            if (cur.size === 0) {
                handlers.delete(filter);
                if (connected) {
                    packetId = (packetId % 65000) + 1;
                    sendRaw(encodeUnsubscribe(packetId, filter));
                }
            }
        };
    };

    const publish = (topic, payload, options = {}) => {
        const retain = Boolean(options.retain);
        let serialized = "";
        if (typeof payload === "string") {
            serialized = payload;
        } else if (payload && typeof payload === "object") {
            const mid = options.dedup === false ? undefined : `${clientId}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
            const body = mid ? { ...payload, _mid: mid } : payload;
            if (mid) rememberMid(mid);
            serialized = JSON.stringify(body);
        }
        if (bc) {
            if (retain) {
                if (serialized === "") retainedLocal.delete(topic);
                else retainedLocal.set(topic, serialized);
            }
            try {
                bc.postMessage({ kind: "pub", sender: clientId, topic, payload: serialized, retain });
            } catch {
                return false;
            }
        }
        if (options.localOnly) return Boolean(bc);
        if (!connected) return Boolean(bc);
        return sendRaw(encodePublish(topic, serialized, retain));
    };

    const setWill = (cfg) => {
        willConfig = cfg && cfg.topic ? { topic: cfg.topic, message: cfg.message || "", retain: Boolean(cfg.retain) } : null;
        if (connected) {
            closeSocket();
            connect();
        }
    };

    const onStatus = (fn) => {
        statusListeners.add(fn);
        fn({ connected, brokerUrl: activeBroker, localReady: Boolean(bc) });
        return () => statusListeners.delete(fn);
    };

    const destroy = () => {
        destroyed = true;
        if (willConfig && willConfig.topic) {
            publish(willConfig.topic, willConfig.message || "", { retain: willConfig.retain });
        }
        closeSocket();
        if (bc) {
            try {
                bc.close();
            } catch {
                bc = null;
            }
            bc = null;
        }
        handlers.clear();
        statusListeners.clear();
        retainedLocal.clear();
    };

    return {
        clientId,
        connect,
        subscribe,
        publish,
        setWill,
        onStatus,
        getStatus: () => ({ connected, brokerUrl: activeBroker, localReady: Boolean(bc) }),
        destroy
    };
}
