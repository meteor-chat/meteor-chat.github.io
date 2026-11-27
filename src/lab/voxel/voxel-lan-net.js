const DEFAULT_STUN_URLS = [
    "stun:stun.l.google.com:19302",
    "stun:stun1.l.google.com:19302",
    "stun:stun.cloudflare.com:3478"
];
const ROOM_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
const HASH_SALT = "meteor-voxel-lan-v1:";

const SHA_K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);

function rotr(x, n) {
    return (x >>> n) | (x << (32 - n));
}

export function sha256HexSync(text) {
    const encoder = new globalThis.TextEncoder();
    const msg = encoder.encode(String(text));
    const bitLen = msg.length * 8;
    const totalLen = Math.ceil((msg.length + 9) / 64) * 64;
    const buf = new Uint8Array(totalLen);
    buf.set(msg);
    buf[msg.length] = 0x80;
    const view = new DataView(buf.buffer);
    view.setUint32(totalLen - 8, Math.floor(bitLen / 0x100000000), false);
    view.setUint32(totalLen - 4, bitLen >>> 0, false);

    let h0 = 0x6a09e667;
    let h1 = 0xbb67ae85;
    let h2 = 0x3c6ef372;
    let h3 = 0xa54ff53a;
    let h4 = 0x510e527f;
    let h5 = 0x9b05688c;
    let h6 = 0x1f83d9ab;
    let h7 = 0x5be0cd19;
    const w = new Uint32Array(64);

    for (let off = 0; off < totalLen; off += 64) {
        for (let i = 0; i < 16; i += 1) {
            w[i] = view.getUint32(off + i * 4, false);
        }
        for (let i = 16; i < 64; i += 1) {
            const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
            const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
            w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
        }
        let a = h0;
        let b = h1;
        let c = h2;
        let d = h3;
        let e = h4;
        let f = h5;
        let g = h6;
        let h = h7;
        for (let i = 0; i < 64; i += 1) {
            const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
            const ch = (e & f) ^ (~e & g);
            const t1 = (h + S1 + ch + SHA_K[i] + w[i]) >>> 0;
            const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const t2 = (S0 + maj) >>> 0;
            h = g;
            g = f;
            f = e;
            e = (d + t1) >>> 0;
            d = c;
            c = b;
            b = a;
            a = (t1 + t2) >>> 0;
        }
        h0 = (h0 + a) >>> 0;
        h1 = (h1 + b) >>> 0;
        h2 = (h2 + c) >>> 0;
        h3 = (h3 + d) >>> 0;
        h4 = (h4 + e) >>> 0;
        h5 = (h5 + f) >>> 0;
        h6 = (h6 + g) >>> 0;
        h7 = (h7 + h) >>> 0;
    }

    const parts = [h0, h1, h2, h3, h4, h5, h6, h7];
    return parts.map((v) => v.toString(16).padStart(8, "0")).join("");
}

export async function sha256Hex(text) {
    const subtle = globalThis.crypto && globalThis.crypto.subtle;
    if (subtle && typeof subtle.digest === "function") {
        try {
            const bytes = new globalThis.TextEncoder().encode(String(text));
            const digest = await subtle.digest("SHA-256", bytes);
            const arr = new Uint8Array(digest);
            let hex = "";
            for (let i = 0; i < arr.length; i += 1) {
                hex += arr[i].toString(16).padStart(2, "0");
            }
            return hex;
        } catch {
            return sha256HexSync(text);
        }
    }
    return sha256HexSync(text);
}

export function isValidPublicIpv4(ip) {
    if (typeof ip !== "string") return false;
    const m = IPV4_RE.exec(ip.trim());
    if (!m) return false;
    const o1 = Number(m[1]);
    const o2 = Number(m[2]);
    const o3 = Number(m[3]);
    const o4 = Number(m[4]);
    if (o1 > 255 || o2 > 255 || o3 > 255 || o4 > 255) return false;
    if (o1 === 0 || o1 === 127) return false;
    if (o1 === 10) return false;
    if (o1 === 172 && o2 >= 16 && o2 <= 31) return false;
    if (o1 === 192 && o2 === 168) return false;
    if (o1 === 169 && o2 === 254) return false;
    return true;
}

export function extractSrflxIpv4(candidateStr) {
    if (typeof candidateStr !== "string") return null;
    if (!candidateStr.includes("typ srflx")) return null;
    const tokens = candidateStr.trim().split(/\s+/);
    if (tokens.length < 8) return null;
    const ip = tokens[4];
    return isValidPublicIpv4(ip) ? ip : null;
}

export async function computeNetworkId(ipv4) {
    if (!ipv4 || typeof ipv4 !== "string") return null;
    const hex = await sha256Hex(`${HASH_SALT}${ipv4.trim()}`);
    return hex.slice(0, 20);
}

export function probeStunIpv4(opts = {}) {
    const Rtc = opts.RtcImpl || globalThis.RTCPeerConnection;
    const stunUrls = opts.stunUrls || DEFAULT_STUN_URLS;
    const timeoutMs = opts.timeoutMs ?? 2200;
    if (typeof Rtc !== "function") return Promise.resolve(null);

    return new Promise((resolve) => {
        let done = false;
        let pc = null;
        let timer = null;
        const finish = (ip) => {
            if (done) return;
            done = true;
            if (timer) globalThis.clearTimeout(timer);
            if (pc) {
                try {
                    pc.onicecandidate = null;
                    pc.close();
                } catch {
                    pc = null;
                }
            }
            resolve(ip || null);
        };
        try {
            pc = new Rtc({ iceServers: [{ urls: stunUrls }] });
            pc.createDataChannel("lan-probe");
            pc.onicecandidate = (e) => {
                if (!e || !e.candidate) {
                    finish(null);
                    return;
                }
                const ip = extractSrflxIpv4(e.candidate.candidate || "");
                if (ip) finish(ip);
            };
            timer = globalThis.setTimeout(() => finish(null), timeoutMs);
            pc.createOffer()
                .then((offer) => pc.setLocalDescription(offer))
                .catch(() => finish(null));
        } catch {
            finish(null);
        }
    });
}

export async function probeHttpIpv4(opts = {}) {
    const fetchFn = opts.fetchImpl || globalThis.fetch;
    const timeoutMs = opts.timeoutMs ?? 2400;
    if (typeof fetchFn !== "function") return null;
    const controller = typeof globalThis.AbortController === "function" ? new globalThis.AbortController() : null;
    const timer = controller ? globalThis.setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
        const res = await fetchFn("https://ipwho.is/", {
            method: "GET",
            signal: controller ? controller.signal : undefined
        });
        if (!res || !res.ok) return null;
        const json = await res.json();
        const ip = json && typeof json.ip === "string" ? json.ip.trim() : null;
        return isValidPublicIpv4(ip) ? ip : null;
    } catch {
        return null;
    } finally {
        if (timer) globalThis.clearTimeout(timer);
    }
}

export async function detectNetworkFingerprint(opts = {}) {
    let ipv4 = await probeStunIpv4(opts);
    let source = ipv4 ? "stun" : "none";
    if (!ipv4 && opts.allowHttpFallback !== false) {
        ipv4 = await probeHttpIpv4(opts);
        if (ipv4) source = "http";
    }
    if (!ipv4) {
        return { netId: "local-only", mode: "offline", source: "none" };
    }
    const netId = await computeNetworkId(ipv4);
    return { netId, mode: "lan", source };
}

export function generateRoomCode(rng = Math.random) {
    let out = "";
    for (let i = 0; i < 4; i += 1) {
        const idx = Math.floor(rng() * ROOM_ALPHABET.length) % ROOM_ALPHABET.length;
        out += ROOM_ALPHABET[idx];
    }
    return out;
}

export function normalizeRoomCode(raw) {
    if (typeof raw !== "string") return "";
    return raw.toUpperCase().replace(/[^2-9A-HJ-NP-Z]/g, "").slice(0, 4);
}

export function generatePeerId(prefix = "p", rng = Math.random) {
    const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
    let id = `${prefix}_`;
    for (let i = 0; i < 8; i += 1) {
        id += chars[Math.floor(rng() * chars.length) % chars.length];
    }
    return id;
}

export async function inspectConnectionPath(pc) {
    if (!pc || typeof pc.getStats !== "function") {
        return { path: "connecting", rttMs: null, isHostPair: false };
    }
    try {
        const report = await pc.getStats();
        let activePair = null;
        const locals = new Map();
        const remotes = new Map();
        report.forEach((stat) => {
            if (stat.type === "local-candidate") locals.set(stat.id, stat);
            else if (stat.type === "remote-candidate") remotes.set(stat.id, stat);
            else if (stat.type === "candidate-pair" && (stat.nominated || stat.selected || stat.state === "succeeded")) {
                if (!activePair || stat.nominated || stat.selected) activePair = stat;
            }
        });
        if (!activePair) return { path: "connecting", rttMs: null, isHostPair: false };
        const lc = locals.get(activePair.localCandidateId);
        const rc = remotes.get(activePair.remoteCandidateId);
        const lt = lc ? lc.candidateType : "";
        const rt = rc ? rc.candidateType : "";
        const isHostPair = lt === "host" && rt === "host";
        const rttMs = Number.isFinite(activePair.currentRoundTripTime)
            ? Math.max(1, Math.round(activePair.currentRoundTripTime * 1000))
            : null;
        if (isHostPair) return { path: "lan-direct", rttMs, isHostPair: true };
        if (lt === "relay" || rt === "relay") return { path: "relay", rttMs, isHostPair: false };
        return { path: "p2p-stun", rttMs, isHostPair: false };
    } catch {
        return { path: "connecting", rttMs: null, isHostPair: false };
    }
}
