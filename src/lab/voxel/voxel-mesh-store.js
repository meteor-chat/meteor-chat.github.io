import { CHUNK_SIZE, SUB_COUNT, SUB_SIZE } from "./voxel-blocks.js";
import { isBoxInFrustum } from "./voxel-camera.js";

const DEFAULT_MAX_UPLOADS = 8;
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024;

export function createMeshStore(gl, options = {}) {
    const maxUploads = options.maxUploadsPerFrame ?? DEFAULT_MAX_UPLOADS;
    const maxBytes = options.maxBytesPerFrame ?? DEFAULT_MAX_BYTES;
    const entries = new Map();
    const pending = new Map();
    let revision = 0;

    const keyOf = (cx, sy, cz) => `${cx},${sy},${cz}`;

    const releaseSlot = (slot) => {
        if (!slot) return;
        gl.deleteVertexArray(slot.vao);
        gl.deleteBuffer(slot.buf);
    };

    const fillSlot = (slot, data) => {
        if (data.length === 0) {
            releaseSlot(slot);
            return null;
        }
        const target = slot || { vao: gl.createVertexArray(), buf: gl.createBuffer(), count: 0 };
        gl.bindVertexArray(target.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, target.buf);
        if (!slot) {
            gl.enableVertexAttribArray(0);
            gl.vertexAttribIPointer(0, 2, gl.UNSIGNED_INT, 8, 0);
        }
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
        gl.bindVertexArray(null);
        target.count = data.length >>> 1;
        return target;
    };

    const releaseEntry = (entry) => {
        if (!entry) return;
        releaseSlot(entry.opq);
        releaseSlot(entry.trn);
    };

    const applyUpload = (job) => {
        revision += 1;
        const key = keyOf(job.cx, job.sy, job.cz);
        const prev = entries.get(key);
        const opq = fillSlot(prev ? prev.opq : null, job.opaque);
        const trn = fillSlot(prev ? prev.trn : null, job.translucent);
        if (!opq && !trn) {
            entries.delete(key);
            return;
        }
        const ox = job.cx * CHUNK_SIZE;
        const oy = job.sy * SUB_SIZE;
        const oz = job.cz * CHUNK_SIZE;
        entries.set(key, {
            origin: [ox, oy, oz],
            center: [ox + CHUNK_SIZE / 2, oy + SUB_SIZE / 2, oz + CHUNK_SIZE / 2],
            box: [ox, oy, oz, ox + CHUNK_SIZE, oy + SUB_SIZE, oz + CHUNK_SIZE],
            dist2: 0,
            opq,
            trn
        });
    };

    const queue = (cx, cz, subs, urgent = false) => {
        for (const sub of subs) {
            const key = keyOf(cx, sub.sy, cz);
            pending.delete(key);
            const job = { cx, cz, sy: sub.sy, opaque: sub.opaque, translucent: sub.translucent };
            if (urgent) applyUpload(job);
            else pending.set(key, job);
        }
    };

    const flush = (unlimited = false) => {
        let uploads = 0;
        let bytes = 0;
        for (const [key, job] of pending) {
            if (!unlimited && (uploads >= maxUploads || (uploads > 0 && bytes >= maxBytes))) break;
            pending.delete(key);
            applyUpload(job);
            uploads += 1;
            bytes += job.opaque.byteLength + job.translucent.byteLength;
        }
        return { uploads, bytes, remaining: pending.size };
    };

    const unloadColumn = (cx, cz) => {
        revision += 1;
        for (let sy = 0; sy < SUB_COUNT; sy += 1) {
            const key = keyOf(cx, sy, cz);
            pending.delete(key);
            releaseEntry(entries.get(key));
            entries.delete(key);
        }
    };

    const collectVisible = (planes, eye) => {
        const visible = [];
        let culled = 0;
        for (const entry of entries.values()) {
            const b = entry.box;
            if (!isBoxInFrustum(planes, b[0], b[1], b[2], b[3], b[4], b[5])) {
                culled += 1;
                continue;
            }
            const dx = entry.center[0] - eye[0];
            const dy = entry.center[1] - eye[1];
            const dz = entry.center[2] - eye[2];
            entry.dist2 = dx * dx + dy * dy + dz * dz;
            visible.push(entry);
        }
        visible.sort((a, b) => a.dist2 - b.dist2);
        const opaque = visible.filter((e) => e.opq);
        const translucent = visible.filter((e) => e.trn).reverse();
        return { opaque, translucent, culled };
    };

    const collectOpaque = (planes) => {
        const list = [];
        for (const entry of entries.values()) {
            const b = entry.box;
            if (entry.opq && isBoxInFrustum(planes, b[0], b[1], b[2], b[3], b[4], b[5])) list.push(entry);
        }
        return list;
    };

    const reset = () => {
        entries.clear();
        pending.clear();
    };

    const release = () => {
        for (const entry of entries.values()) releaseEntry(entry);
        entries.clear();
        pending.clear();
    };

    return {
        queue,
        flush,
        unloadColumn,
        collectVisible,
        collectOpaque,
        version: () => revision,
        release,
        reset,
        size: () => entries.size,
        pendingCount: () => pending.size,
        has: (cx, sy, cz) => entries.has(keyOf(cx, sy, cz))
    };
}
