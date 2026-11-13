import { CHUNK_HEIGHT, CHUNK_SIZE, SUB_COUNT } from "./voxel-blocks.js";

export const PAD_W = CHUNK_SIZE + 2;
const PAD_LAYER = PAD_W * PAD_W;
const MISSING_LIGHT = 240;

let columnCounter = 0;

function axisSpan(offset) {
    if (offset < 0) return { start: -1, count: 1, source: CHUNK_SIZE - 1 };
    if (offset > 0) return { start: CHUNK_SIZE, count: 1, source: 0 };
    return { start: 0, count: CHUNK_SIZE, source: 0 };
}

export function buildPaddedBuffers(getColumn, cx, cz) {
    const padBlocks = new Uint8Array(PAD_LAYER * CHUNK_HEIGHT);
    const padLight = new Uint8Array(PAD_LAYER * CHUNK_HEIGHT).fill(MISSING_LIGHT);
    for (let oz = -1; oz <= 1; oz += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
            const col = getColumn(cx + ox, cz + oz);
            if (!col) continue;
            const xs = axisSpan(ox);
            const zs = axisSpan(oz);
            for (let y = 0; y < CHUNK_HEIGHT; y += 1) {
                for (let dz = 0; dz < zs.count; dz += 1) {
                    const src = xs.source + ((zs.source + dz) << 4) + (y << 8);
                    const dst = xs.start + 1 + (zs.start + dz + 1) * PAD_W + y * PAD_LAYER;
                    padBlocks.set(col.blocks.subarray(src, src + xs.count), dst);
                    padLight.set(col.light.subarray(src, src + xs.count), dst);
                }
            }
        }
    }
    return { padBlocks, padLight };
}

export function makeColumn(cx, cz, blocks, light) {
    columnCounter += 1;
    return { id: columnCounter, cx, cz, blocks, light, subSeq: new Int32Array(SUB_COUNT) };
}

export function acceptMeshMessages(messages, getColumn) {
    const accepted = [];
    for (const msg of messages) {
        const col = getColumn(msg.cx, msg.cz);
        if (!col || col.id !== msg.colId) continue;
        const subs = msg.subs.filter((sub) => {
            if (msg.seq < col.subSeq[sub.sy]) return false;
            col.subSeq[sub.sy] = msg.seq;
            return true;
        });
        if (subs.length > 0) accepted.push({ cx: msg.cx, cz: msg.cz, subs });
    }
    return accepted;
}

export function orderDirtyColumns(dirtySubs, pcx, pcz) {
    const list = [];
    for (const [key, mask] of dirtySubs) {
        const [cxStr, czStr] = key.split(",");
        const cx = Number(cxStr);
        const cz = Number(czStr);
        const dx = cx - pcx;
        const dz = cz - pcz;
        list.push({ key, mask, cx, cz, d2: dx * dx + dz * dz });
    }
    return list.sort((a, b) => a.d2 - b.d2);
}

const NEIGHBOR_STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function isAwaitingNeighbor(columns, cx, cz, center, radius) {
    for (const [dx, dz] of NEIGHBOR_STEPS) {
        const nx = cx + dx;
        const nz = cz + dz;
        const inView = Math.abs(nx - center.cx) <= radius && Math.abs(nz - center.cz) <= radius;
        if (inView && !columns.has(`${nx},${nz}`)) return true;
    }
    return false;
}

export function isBeyondRadius(cx, cz, center, radius) {
    return Math.abs(cx - center.cx) > radius || Math.abs(cz - center.cz) > radius;
}
