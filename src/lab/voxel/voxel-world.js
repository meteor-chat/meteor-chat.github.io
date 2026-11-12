import { BLOCK, CHUNK_HEIGHT, CHUNK_SIZE, SUB_COUNT, SUB_SIZE, chunkIndex } from "./voxel-blocks.js";
import { propagateColumnLight, updateWorldLight } from "./voxel-light.js";
import { meshSubchunk } from "./voxel-mesher.js";
import { generateColumn } from "./voxel-world-gen.js";

const PAD_W = CHUNK_SIZE + 2;

export function createVoxelWorld(options = {}) {
    const seed = options.seed ?? 2026;
    const viewRadius = options.viewRadius ?? 3;
    const columns = new Map();
    const pendingGen = new Set();
    const dirtySubs = new Map();
    const meshResults = [];
    let worker = null;

    if (typeof Worker !== "undefined" && options.useWorker !== false) {
        try {
            worker = new Worker(new URL("./voxel-worker.js", import.meta.url), { type: "module" });
            worker.onmessage = (e) => handleWorkerMsg(e.data);
        } catch {
            worker = null;
        }
    }

    const colKey = (cx, cz) => `${cx},${cz}`;

    const markSubDirty = (cx, sy, cz) => {
        if (sy < 0 || sy >= SUB_COUNT) return;
        const k = colKey(cx, cz);
        if (!columns.has(k)) return;
        dirtySubs.set(k, (dirtySubs.get(k) || 0) | (1 << sy));
    };

    const markColumnAllDirty = (cx, cz) => {
        const k = colKey(cx, cz);
        if (!columns.has(k)) return;
        dirtySubs.set(k, (dirtySubs.get(k) || 0) | 255);
    };

    function handleWorkerMsg(msg) {
        const k = colKey(msg.cx, msg.cz);
        if (msg.type === "generated") {
            pendingGen.delete(k);
            columns.set(k, { cx: msg.cx, cz: msg.cz, blocks: msg.blocks, light: msg.light });
            markColumnAllDirty(msg.cx, msg.cz);
            markColumnAllDirty(msg.cx + 1, msg.cz);
            markColumnAllDirty(msg.cx - 1, msg.cz);
            markColumnAllDirty(msg.cx, msg.cz + 1);
            markColumnAllDirty(msg.cx, msg.cz - 1);
        } else if (msg.type === "meshed") {
            meshResults.push(msg);
        }
    }

    const getColumn = (cx, cz) => columns.get(colKey(cx, cz)) || null;

    const getBlock = (wx, wy, wz) => {
        const y = Math.floor(wy);
        if (y < 0 || y >= CHUNK_HEIGHT) return BLOCK.AIR;
        const x = Math.floor(wx);
        const z = Math.floor(wz);
        const cx = Math.floor(x / CHUNK_SIZE);
        const cz = Math.floor(z / CHUNK_SIZE);
        const col = getColumn(cx, cz);
        if (!col) return BLOCK.AIR;
        return col.blocks[chunkIndex(x - cx * CHUNK_SIZE, y, z - cz * CHUNK_SIZE)];
    };

    const getLight = (wx, wy, wz) => {
        const y = Math.floor(wy);
        if (y < 0 || y >= CHUNK_HEIGHT) return 240;
        const x = Math.floor(wx);
        const z = Math.floor(wz);
        const cx = Math.floor(x / CHUNK_SIZE);
        const cz = Math.floor(z / CHUNK_SIZE);
        const col = getColumn(cx, cz);
        if (!col) return 240;
        return col.light[chunkIndex(x - cx * CHUNK_SIZE, y, z - cz * CHUNK_SIZE)];
    };

    const buildPaddedBuffers = (cx, cz) => {
        const padBlocks = new Uint8Array(PAD_W * CHUNK_HEIGHT * PAD_W);
        const padLight = new Uint8Array(PAD_W * CHUNK_HEIGHT * PAD_W);
        const baseX = cx * CHUNK_SIZE;
        const baseZ = cz * CHUNK_SIZE;
        for (let y = 0; y < CHUNK_HEIGHT; y += 1) {
            const yOff = y * PAD_W * PAD_W;
            for (let dz = -1; dz <= CHUNK_SIZE; dz += 1) {
                const zOff = (dz + 1) * PAD_W + yOff;
                for (let dx = -1; dx <= CHUNK_SIZE; dx += 1) {
                    const pIdx = dx + 1 + zOff;
                    padBlocks[pIdx] = getBlock(baseX + dx, y, baseZ + dz);
                    padLight[pIdx] = getLight(baseX + dx, y, baseZ + dz);
                }
            }
        }
        return { padBlocks, padLight };
    };

    const meshColumnSync = (cx, cz, subMask) => {
        const col = getColumn(cx, cz);
        if (!col) return;
        const baseX = cx * CHUNK_SIZE;
        const baseZ = cz * CHUNK_SIZE;
        const gBlock = (lx, ly, lz) => {
            if (lx >= 0 && lx < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE && ly >= 0 && ly < CHUNK_HEIGHT) {
                return col.blocks[chunkIndex(lx, ly, lz)];
            }
            return getBlock(baseX + lx, ly, baseZ + lz);
        };
        const gLight = (lx, ly, lz) => {
            if (lx >= 0 && lx < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE && ly >= 0 && ly < CHUNK_HEIGHT) {
                return col.light[chunkIndex(lx, ly, lz)];
            }
            return getLight(baseX + lx, ly, lz);
        };
        const subs = [];
        for (let sy = 0; sy < SUB_COUNT; sy += 1) {
            if ((subMask & (1 << sy)) === 0) continue;
            subs.push({ sy, ...meshSubchunk(sy, gBlock, gLight) });
        }
        meshResults.push({ cx, cz, subs });
    };

    const setBlock = (wx, wy, wz, id) => {
        const x = Math.floor(wx);
        const y = Math.floor(wy);
        const z = Math.floor(wz);
        if (y <= 1 || y >= CHUNK_HEIGHT) return false;
        const cx = Math.floor(x / CHUNK_SIZE);
        const cz = Math.floor(z / CHUNK_SIZE);
        const col = getColumn(cx, cz);
        if (!col) return false;
        const lx = x - cx * CHUNK_SIZE;
        const lz = z - cz * CHUNK_SIZE;
        const idx = chunkIndex(lx, y, lz);
        const oldId = col.blocks[idx];
        if (oldId === id) return false;
        col.blocks[idx] = id;
        updateWorldLight(getColumn, markSubDirty, x, y, z, oldId, id);
        const sy = Math.floor(y / SUB_SIZE);
        markSubDirty(cx, sy, cz);
        if (y % SUB_SIZE === 0) markSubDirty(cx, sy - 1, cz);
        if (y % SUB_SIZE === SUB_SIZE - 1) markSubDirty(cx, sy + 1, cz);
        if (lx === 0) markSubDirty(cx - 1, sy, cz);
        if (lx === CHUNK_SIZE - 1) markSubDirty(cx + 1, sy, cz);
        if (lz === 0) markSubDirty(cx, sy, cz - 1);
        if (lz === CHUNK_SIZE - 1) markSubDirty(cx, sy, cz + 1);
        const k = colKey(cx, cz);
        const mask = dirtySubs.get(k);
        if (mask) {
            dirtySubs.delete(k);
            meshColumnSync(cx, cz, mask);
        }
        return true;
    };

    const updateAround = (px, pz) => {
        const pcx = Math.floor(px / CHUNK_SIZE);
        const pcz = Math.floor(pz / CHUNK_SIZE);
        const needed = [];
        for (let dz = -viewRadius; dz <= viewRadius; dz += 1) {
            for (let dx = -viewRadius; dx <= viewRadius; dx += 1) {
                const cx = pcx + dx;
                const cz = pcz + dz;
                const k = colKey(cx, cz);
                if (!columns.has(k) && !pendingGen.has(k)) {
                    needed.push({ cx, cz, k, d2: dx * dx + dz * dz });
                }
            }
        }
        needed.sort((a, b) => a.d2 - b.d2);
        const genBudget = worker ? 4 : 2;
        for (let i = 0; i < Math.min(needed.length, genBudget); i += 1) {
            const { cx, cz, k } = needed[i];
            if (worker) {
                pendingGen.add(k);
                worker.postMessage({ type: "generate", cx, cz, seed });
            } else {
                const col = generateColumn(cx, cz, seed);
                propagateColumnLight(col.blocks, col.light);
                columns.set(k, col);
                markColumnAllDirty(cx, cz);
                markColumnAllDirty(cx + 1, cz);
                markColumnAllDirty(cx - 1, cz);
                markColumnAllDirty(cx, cz + 1);
                markColumnAllDirty(cx, cz - 1);
            }
        }

        const unloaded = [];
        for (const [k, col] of columns.entries()) {
            if (Math.abs(col.cx - pcx) > viewRadius + 2 || Math.abs(col.cz - pcz) > viewRadius + 2) {
                columns.delete(k);
                dirtySubs.delete(k);
                unloaded.push({ cx: col.cx, cz: col.cz });
            }
        }

        let meshBudget = worker ? 6 : 3;
        for (const [k, subMask] of dirtySubs.entries()) {
            if (meshBudget <= 0) break;
            dirtySubs.delete(k);
            const [cxStr, czStr] = k.split(",");
            const cx = Number(cxStr);
            const cz = Number(czStr);
            if (worker) {
                const { padBlocks, padLight } = buildPaddedBuffers(cx, cz);
                worker.postMessage(
                    { type: "mesh", cx, cz, subMask, padBlocks, padLight },
                    [padBlocks.buffer, padLight.buffer]
                );
            } else {
                meshColumnSync(cx, cz, subMask);
            }
            meshBudget -= 1;
        }
        return unloaded;
    };

    const consumeMeshes = () => meshResults.splice(0, meshResults.length);

    const warmAreaSync = (px, pz, radius = 1) => {
        const pcx = Math.floor(px / CHUNK_SIZE);
        const pcz = Math.floor(pz / CHUNK_SIZE);
        for (let dz = -radius; dz <= radius; dz += 1) {
            for (let dx = -radius; dx <= radius; dx += 1) {
                const cx = pcx + dx;
                const cz = pcz + dz;
                const k = colKey(cx, cz);
                if (!columns.has(k)) {
                    const col = generateColumn(cx, cz, seed);
                    propagateColumnLight(col.blocks, col.light);
                    columns.set(k, col);
                }
            }
        }
        for (let dz = -radius; dz <= radius; dz += 1) {
            for (let dx = -radius; dx <= radius; dx += 1) {
                meshColumnSync(pcx + dx, pcz + dz, 255);
            }
        }
    };

    const destroy = () => {
        if (worker) {
            worker.terminate();
            worker = null;
        }
    };

    return {
        getBlock,
        getLight,
        getColumn,
        setBlock,
        updateAround,
        consumeMeshes,
        warmAreaSync,
        getColumnCount: () => columns.size,
        destroy
    };
}
