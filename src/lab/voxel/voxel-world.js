import {
    BLOCK,
    CHUNK_HEIGHT,
    CHUNK_SIZE,
    SUB_COUNT,
    SUB_SIZE,
    chunkIndex,
    isCrossPlant,
    isGravityBlock,
    isSolid,
    isTorch
} from "./voxel-blocks.js";
import { propagateColumnLight, stitchColumnLight, updateWorldLight } from "./voxel-light.js";
import { meshSubchunk } from "./voxel-mesher.js";
import { createWorldStorage } from "./voxel-storage.js";
import { generateColumn, sampleColumnTints } from "./voxel-world-gen.js";
import {
    acceptMeshMessages,
    buildPaddedBuffers,
    isAwaitingNeighbor,
    isBeyondRadius,
    makeColumn,
    orderDirtyColumns
} from "./voxel-world-stream.js";

const MAX_INFLIGHT_GEN = 8;
const MAX_INFLIGHT_MESH = 12;
const WATER_MAX_FLOW = 5;
const DYNAMIC_INTERVAL = 0.12;
const DYNAMIC_MAX_OPS = 28;

export function createVoxelWorld(options = {}) {
    const seed = options.seed ?? 2026;
    let viewRadius = options.viewRadius ?? 6;
    const columns = new Map();
    const pendingGen = new Set();
    const dirtySubs = new Map();
    const meshResults = [];
    const activeBlocks = new Set();
    const waterFlow = new Map();
    const center = { cx: 0, cz: 0 };
    const storage = createWorldStorage(seed);
    let seqCounter = 0;
    let inFlightMesh = 0;
    let dynAcc = 0;
    let worker = null;

    const colKey = (cx, cz) => `${cx},${cz}`;
    const cellKey = (x, y, z) => `${x},${y},${z}`;

    const disableWorker = () => {
        if (worker) {
            try {
                worker.terminate();
            } catch {
                worker = null;
            }
            worker = null;
        }
        pendingGen.clear();
        inFlightMesh = 0;
    };

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

    const markColumnAndNeighborsDirty = (cx, cz) => {
        for (let dz = -1; dz <= 1; dz += 1) {
            for (let dx = -1; dx <= 1; dx += 1) {
                markColumnAllDirty(cx + dx, cz + dz);
            }
        }
    };

    const getColumn = (cx, cz) => columns.get(colKey(cx, cz)) || null;
    const isColumnLoaded = (cx, cz) => columns.has(colKey(cx, cz));

    const installColumn = (cx, cz, blocks, light) => {
        const k = colKey(cx, cz);
        if (columns.has(k)) return;
        if (storage.applyColumnEdits(cx, cz, blocks)) {
            propagateColumnLight(blocks, light);
        }
        columns.set(k, makeColumn(cx, cz, blocks, light));
        stitchColumnLight(getColumn, markSubDirty, cx, cz);
        markColumnAndNeighborsDirty(cx, cz);
    };

    function handleWorkerMsg(msg) {
        if (!msg || typeof msg !== "object") return;
        const k = colKey(msg.cx, msg.cz);
        if (msg.type === "generated") {
            pendingGen.delete(k);
            if (isBeyondRadius(msg.cx, msg.cz, center, viewRadius + 2)) return;
            installColumn(msg.cx, msg.cz, msg.blocks, msg.light);
        } else if (msg.type === "meshed") {
            inFlightMesh = Math.max(0, inFlightMesh - 1);
            if (isBeyondRadius(msg.cx, msg.cz, center, viewRadius + 2)) return;
            meshResults.push(msg);
        }
    }

    if (typeof Worker !== "undefined" && options.useWorker !== false) {
        try {
            worker = new Worker(new URL("./voxel-worker.js", import.meta.url), { type: "module" });
            worker.onmessage = (e) => handleWorkerMsg(e.data);
            worker.onerror = () => disableWorker();
            worker.onmessageerror = () => disableWorker();
        } catch {
            worker = null;
        }
    }

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

    const meshColumnSync = (cx, cz, subMask) => {
        const col = getColumn(cx, cz);
        if (!col) return;
        const baseX = cx * CHUNK_SIZE;
        const baseZ = cz * CHUNK_SIZE;
        const tints = sampleColumnTints(cx, cz, seed);
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
            return getLight(baseX + lx, ly, baseZ + lz);
        };
        const gTint = (lx, lz) => tints[(lx & 15) + ((lz & 15) << 4)];
        const subs = [];
        for (let sy = 0; sy < SUB_COUNT; sy += 1) {
            if ((subMask & (1 << sy)) === 0) continue;
            subs.push({ sy, ...meshSubchunk(sy, gBlock, gLight, gTint) });
        }
        seqCounter += 1;
        meshResults.push({ cx, cz, subs, seq: seqCounter, colId: col.id });
    };

    const queueDynamic = (x, y, z) => {
        if (y <= 1 || y >= CHUNK_HEIGHT - 1) return;
        activeBlocks.add(cellKey(x, y, z));
    };

    const queueDynamicNeighborhood = (x, y, z) => {
        queueDynamic(x, y, z);
        queueDynamic(x, y + 1, z);
        queueDynamic(x, y - 1, z);
        queueDynamic(x + 1, y, z);
        queueDynamic(x - 1, y, z);
        queueDynamic(x, y, z + 1);
        queueDynamic(x, y, z - 1);
    };

    const setBlockInternal = (wx, wy, wz, id, persist, flowDepth) => {
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
        if (persist) storage.recordEdit(cx, cz, idx, id);
        if (id === BLOCK.WATER) {
            waterFlow.set(cellKey(x, y, z), flowDepth);
        } else {
            waterFlow.delete(cellKey(x, y, z));
        }

        updateWorldLight(getColumn, markSubDirty, x, y, z, oldId, id);

        const sy = Math.floor(y / SUB_SIZE);
        const yMin = y % SUB_SIZE === 0 ? sy - 1 : sy;
        const yMax = y % SUB_SIZE === SUB_SIZE - 1 ? sy + 1 : sy;
        const dxRange = lx === 0 ? [-1, 0] : lx === CHUNK_SIZE - 1 ? [0, 1] : [0];
        const dzRange = lz === 0 ? [-1, 0] : lz === CHUNK_SIZE - 1 ? [0, 1] : [0];
        const touchedCols = [];

        for (const dcz of dzRange) {
            for (const dcx of dxRange) {
                const tcx = cx + dcx;
                const tcz = cz + dcz;
                for (let tsy = yMin; tsy <= yMax; tsy += 1) {
                    markSubDirty(tcx, tsy, tcz);
                }
                touchedCols.push([tcx, tcz]);
            }
        }

        const primaryKey = colKey(cx, cz);
        const primaryMask = dirtySubs.get(primaryKey);
        if (primaryMask) {
            dirtySubs.delete(primaryKey);
            meshColumnSync(cx, cz, primaryMask);
        }
        for (const [tcx, tcz] of touchedCols) {
            if (tcx === cx && tcz === cz) continue;
            const tk = colKey(tcx, tcz);
            const tMask = dirtySubs.get(tk);
            if (tMask) {
                dirtySubs.delete(tk);
                meshColumnSync(tcx, tcz, tMask);
            }
        }

        queueDynamicNeighborhood(x, y, z);
        return true;
    };

    const setBlock = (wx, wy, wz, id) => {
        const flowDepth = id === BLOCK.WATER ? WATER_MAX_FLOW : 0;
        return setBlockInternal(wx, wy, wz, id, true, flowDepth);
    };

    const stepDynamic = (dt) => {
        if (activeBlocks.size === 0) return;
        dynAcc += dt;
        if (dynAcc < DYNAMIC_INTERVAL) return;
        dynAcc = Math.min(dynAcc - DYNAMIC_INTERVAL, DYNAMIC_INTERVAL);

        const batch = [];
        for (const k of activeBlocks) {
            batch.push(k);
            activeBlocks.delete(k);
            if (batch.length >= DYNAMIC_MAX_OPS) break;
        }

        for (const k of batch) {
            const parts = k.split(",");
            const x = Number(parts[0]);
            const y = Number(parts[1]);
            const z = Number(parts[2]);
            const id = getBlock(x, y, z);
            if (id === BLOCK.AIR) continue;

            if (isGravityBlock(id)) {
                const below = getBlock(x, y - 1, z);
                if (below === BLOCK.AIR || below === BLOCK.WATER || isCrossPlant(below)) {
                    setBlockInternal(x, y, z, BLOCK.AIR, true, 0);
                    setBlockInternal(x, y - 1, z, id, true, 0);
                }
                continue;
            }

            if (isTorch(id) || isCrossPlant(id)) {
                const below = getBlock(x, y - 1, z);
                if (!isSolid(below)) {
                    setBlockInternal(x, y, z, BLOCK.AIR, true, 0);
                }
                continue;
            }

            if (id === BLOCK.WATER) {
                const depth = waterFlow.get(k) || 0;
                if (depth <= 0) continue;
                const below = getBlock(x, y - 1, z);
                if (below === BLOCK.AIR || isCrossPlant(below)) {
                    setBlockInternal(x, y - 1, z, BLOCK.WATER, true, WATER_MAX_FLOW);
                } else if (isSolid(below) && depth > 1) {
                    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
                    for (const [dx, dz] of dirs) {
                        const nb = getBlock(x + dx, y, z + dz);
                        if (nb === BLOCK.AIR || isCrossPlant(nb)) {
                            setBlockInternal(x + dx, y, z + dz, BLOCK.WATER, true, depth - 1);
                        }
                    }
                }
            }
        }
    };

    const updateAround = (px, pz) => {
        const pcx = Math.floor(px / CHUNK_SIZE);
        const pcz = Math.floor(pz / CHUNK_SIZE);
        center.cx = pcx;
        center.cz = pcz;
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
        const genRoom = worker ? Math.max(0, MAX_INFLIGHT_GEN - pendingGen.size) : 2;
        const genBudget = Math.min(worker ? 4 : 2, genRoom);
        for (let i = 0; i < Math.min(needed.length, genBudget); i += 1) {
            const { cx, cz, k } = needed[i];
            if (worker) {
                pendingGen.add(k);
                worker.postMessage({ type: "generate", cx, cz, seed });
            } else {
                const col = generateColumn(cx, cz, seed);
                propagateColumnLight(col.blocks, col.light);
                installColumn(cx, cz, col.blocks, col.light);
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

        const meshRoom = worker ? Math.max(0, MAX_INFLIGHT_MESH - inFlightMesh) : 3;
        let meshBudget = Math.min(worker ? 6 : 3, meshRoom);
        for (const job of orderDirtyColumns(dirtySubs, pcx, pcz)) {
            if (meshBudget <= 0) break;
            if (isAwaitingNeighbor(columns, job.cx, job.cz, center, viewRadius)) continue;
            dirtySubs.delete(job.key);
            if (worker) {
                const col = getColumn(job.cx, job.cz);
                if (!col) continue;
                const { padBlocks, padLight } = buildPaddedBuffers(getColumn, job.cx, job.cz);
                seqCounter += 1;
                inFlightMesh += 1;
                worker.postMessage(
                    {
                        type: "mesh",
                        cx: job.cx,
                        cz: job.cz,
                        seed,
                        subMask: job.mask,
                        padBlocks,
                        padLight,
                        seq: seqCounter,
                        colId: col.id
                    },
                    [padBlocks.buffer, padLight.buffer]
                );
            } else {
                meshColumnSync(job.cx, job.cz, job.mask);
            }
            meshBudget -= 1;
        }
        return unloaded;
    };

    const consumeMeshes = () => acceptMeshMessages(meshResults.splice(0, meshResults.length), getColumn);

    const remeshAll = () => {
        for (const col of columns.values()) markColumnAllDirty(col.cx, col.cz);
    };

    const warmAreaSync = (px, pz, radius = 1) => {
        const pcx = Math.floor(px / CHUNK_SIZE);
        const pcz = Math.floor(pz / CHUNK_SIZE);
        center.cx = pcx;
        center.cz = pcz;
        for (let dz = -radius; dz <= radius; dz += 1) {
            for (let dx = -radius; dx <= radius; dx += 1) {
                const cx = pcx + dx;
                const cz = pcz + dz;
                const k = colKey(cx, cz);
                if (!columns.has(k)) {
                    const col = generateColumn(cx, cz, seed);
                    storage.applyColumnEdits(cx, cz, col.blocks);
                    propagateColumnLight(col.blocks, col.light);
                    columns.set(k, makeColumn(cx, cz, col.blocks, col.light));
                }
            }
        }
        for (let dz = -radius; dz <= radius; dz += 1) {
            for (let dx = -radius; dx <= radius; dx += 1) {
                stitchColumnLight(getColumn, markSubDirty, pcx + dx, pcz + dz);
            }
        }
        for (let dz = -radius; dz <= radius; dz += 1) {
            for (let dx = -radius; dx <= radius; dx += 1) {
                dirtySubs.delete(colKey(pcx + dx, pcz + dz));
                meshColumnSync(pcx + dx, pcz + dz, 255);
            }
        }
    };

    const hydrateStorage = async () => {
        const loadedCols = await storage.loadAll();
        for (const k of loadedCols) {
            const col = columns.get(k);
            if (!col) continue;
            if (storage.applyColumnEdits(col.cx, col.cz, col.blocks)) {
                propagateColumnLight(col.blocks, col.light);
                stitchColumnLight(getColumn, markSubDirty, col.cx, col.cz);
                markColumnAndNeighborsDirty(col.cx, col.cz);
            }
        }
        return loadedCols.length;
    };

    const resetEdits = async () => {
        await storage.clearAll();
        activeBlocks.clear();
        waterFlow.clear();
        const existing = Array.from(columns.values()).map((c) => [c.cx, c.cz]);
        columns.clear();
        dirtySubs.clear();
        pendingGen.clear();
        for (const [cx, cz] of existing) {
            const col = generateColumn(cx, cz, seed);
            propagateColumnLight(col.blocks, col.light);
            columns.set(colKey(cx, cz), makeColumn(cx, cz, col.blocks, col.light));
        }
        for (const [cx, cz] of existing) {
            stitchColumnLight(getColumn, markSubDirty, cx, cz);
            markColumnAllDirty(cx, cz);
        }
    };

    const destroy = () => {
        disableWorker();
        storage.destroy();
        columns.clear();
        dirtySubs.clear();
        meshResults.length = 0;
        activeBlocks.clear();
        waterFlow.clear();
    };

    return {
        getBlock,
        getLight,
        getColumn,
        isColumnLoaded,
        setBlock,
        stepDynamic,
        updateAround,
        consumeMeshes,
        remeshAll,
        warmAreaSync,
        hydrateStorage,
        resetEdits,
        getStorage: () => storage,
        getColumnCount: () => columns.size,
        setViewRadius: (r) => { viewRadius = Math.max(2, Math.min(16, Math.floor(r))); },
        getViewRadius: () => viewRadius,
        destroy
    };
}
