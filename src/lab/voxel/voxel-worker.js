import { CHUNK_HEIGHT, CHUNK_SIZE, SUB_COUNT } from "./voxel-blocks.js";
import { propagateColumnLight } from "./voxel-light.js";
import { meshSubchunk } from "./voxel-mesher.js";
import { generateColumn } from "./voxel-world-gen.js";

const PAD_W = CHUNK_SIZE + 2;

function padIndex(lx, ly, lz) {
    return (lx + 1) + (lz + 1) * PAD_W + ly * PAD_W * PAD_W;
}

function buildMeshesFromPadded(padBlocks, padLight, subMask) {
    const getBlock = (x, y, z) => {
        if (y < 0 || y >= CHUNK_HEIGHT || x < -1 || x > CHUNK_SIZE || z < -1 || z > CHUNK_SIZE) return 0;
        return padBlocks[padIndex(x, y, z)];
    };
    const getLight = (x, y, z) => {
        if (y < 0 || y >= CHUNK_HEIGHT) return 240;
        if (x < -1 || x > CHUNK_SIZE || z < -1 || z > CHUNK_SIZE) return 240;
        return padLight[padIndex(x, y, z)];
    };

    const subs = [];
    const transfers = [];
    for (let sy = 0; sy < SUB_COUNT; sy += 1) {
        if ((subMask & (1 << sy)) === 0) continue;
        const { opaque, translucent } = meshSubchunk(sy, getBlock, getLight);
        subs.push({ sy, opaque, translucent });
        if (opaque.byteLength > 0) transfers.push(opaque.buffer);
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
        const { cx, cz, subMask, padBlocks, padLight } = msg;
        const { subs, transfers } = buildMeshesFromPadded(padBlocks, padLight, subMask);
        self.postMessage({ type: "meshed", cx, cz, subs }, transfers);
    }
};
