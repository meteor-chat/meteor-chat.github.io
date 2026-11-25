import { CHUNK_HEIGHT, CHUNK_SIZE, SUB_COUNT } from "./voxel-blocks.js";
import { propagateColumnLight } from "./voxel-light.js";
import { meshSubchunk } from "./voxel-mesher.js";
import { generateColumn, sampleColumnTints } from "./voxel-world-gen.js";

const PAD_W = CHUNK_SIZE + 2;

function padIndex(lx, ly, lz) {
    return (lx + 1) + (lz + 1) * PAD_W + ly * PAD_W * PAD_W;
}

function buildMeshesFromPadded(cx, cz, seed, padBlocks, padLight, subMask) {
    const tints = sampleColumnTints(cx, cz, seed);
    const getBlock = (x, y, z) => {
        if (y < 0 || y >= CHUNK_HEIGHT || x < -1 || x > CHUNK_SIZE || z < -1 || z > CHUNK_SIZE) return 0;
        return padBlocks[padIndex(x, y, z)];
    };
    const getLight = (x, y, z) => {
        if (y < 0 || y >= CHUNK_HEIGHT) return 240;
        if (x < -1 || x > CHUNK_SIZE || z < -1 || z > CHUNK_SIZE) return 240;
        return padLight[padIndex(x, y, z)];
    };
    const getTint = (lx, lz) => tints[(lx & 15) + ((lz & 15) << 4)];

    const subs = [];
    const transfers = [];
    for (let sy = 0; sy < SUB_COUNT; sy += 1) {
        if ((subMask & (1 << sy)) === 0) continue;
        const { opaque, cutout, translucent, bounds } = meshSubchunk(sy, getBlock, getLight, getTint);
        subs.push({ sy, opaque, cutout, translucent, bounds });
        if (opaque.byteLength > 0) transfers.push(opaque.buffer);
        if (cutout.byteLength > 0) transfers.push(cutout.buffer);
        if (translucent.byteLength > 0) transfers.push(translucent.buffer);
    }
    return { subs, transfers };
}

self.onmessage = (e) => {
    const msg = e.data;
    if (msg.type === "generate") {
        const col = generateColumn(msg.cx, msg.cz, msg.seed);
        propagateColumnLight(col.blocks, col.light);
        self.postMessage(
            {
                type: "generated",
                cx: msg.cx,
                cz: msg.cz,
                blocks: col.blocks,
                light: col.light
            },
            [col.blocks.buffer, col.light.buffer]
        );
        return;
    }

    if (msg.type === "mesh") {
        const { cx, cz, seed, subMask, padBlocks, padLight, seq, colId } = msg;
        const { subs, transfers } = buildMeshesFromPadded(cx, cz, seed ?? 2026, padBlocks, padLight, subMask);
        self.postMessage({ type: "meshed", cx, cz, subs, seq, colId }, transfers);
    }
};
