import { CHUNK_HEIGHT, CHUNK_SIZE, chunkIndex, getEmissiveLight, isOpaque, BLOCK } from "./voxel-blocks.js";

function inBounds(lx, ly, lz) {
    return lx >= 0 && lx < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE && ly >= 0 && ly < CHUNK_HEIGHT;
}

export function propagateColumnLight(blocks, light) {
    light.fill(0);
    const sunQueue = [];
    const blockQueue = [];

    for (let lz = 0; lz < CHUNK_SIZE; lz += 1) {
        for (let lx = 0; lx < CHUNK_SIZE; lx += 1) {
            let sun = 15;
            for (let ly = CHUNK_HEIGHT - 1; ly >= 0; ly -= 1) {
                const idx = chunkIndex(lx, ly, lz);
                const id = blocks[idx];
                if (isOpaque(id)) {
                    sun = 0;
                } else {
                    if (id === BLOCK.WATER || id === BLOCK.LEAVES) sun = Math.max(0, sun - 2);
                    if (sun > 0) {
                        light[idx] = (light[idx] & 15) | (sun << 4);
                        if (sun > 1) sunQueue.push(idx);
                    }
                }
                const emit = getEmissiveLight(id);
                if (emit > 0) {
                    light[idx] = (light[idx] & 240) | emit;
                    blockQueue.push(idx);
                }
            }
        }
    }

    const dirs = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    let head = 0;
    while (head < sunQueue.length) {
        const idx = sunQueue[head++];
        const curSun = (light[idx] >> 4) & 15;
        if (curSun <= 1) continue;
        const lx = idx & 15;
        const lz = (idx >> 4) & 15;
        const ly = idx >> 8;
        for (let d = 0; d < 6; d += 1) {
            const nx = lx + dirs[d][0];
            const ny = ly + dirs[d][1];
            const nz = lz + dirs[d][2];
            if (!inBounds(nx, ny, nz)) continue;
            const nIdx = chunkIndex(nx, ny, nz);
            const nid = blocks[nIdx];
            if (isOpaque(nid)) continue;
            const drop = d === 3 && curSun === 15 && nid === BLOCK.AIR ? 0 : nid === BLOCK.WATER || nid === BLOCK.LEAVES ? 2 : 1;
            const nextSun = curSun - drop;
            if (nextSun > ((light[nIdx] >> 4) & 15)) {
                light[nIdx] = (light[nIdx] & 15) | (nextSun << 4);
                sunQueue.push(nIdx);
            }
        }
    }

    head = 0;
    while (head < blockQueue.length) {
        const idx = blockQueue[head++];
        const curBlk = light[idx] & 15;
        if (curBlk <= 1) continue;
        const lx = idx & 15;
        const lz = (idx >> 4) & 15;
        const ly = idx >> 8;
        for (let d = 0; d < 6; d += 1) {
            const nx = lx + dirs[d][0];
            const ny = ly + dirs[d][1];
            const nz = lz + dirs[d][2];
            if (!inBounds(nx, ny, nz)) continue;
            const nIdx = chunkIndex(nx, ny, nz);
            if (isOpaque(blocks[nIdx])) continue;
            const nextBlk = curBlk - 1;
            if (nextBlk > (light[nIdx] & 15)) {
                light[nIdx] = (light[nIdx] & 240) | nextBlk;
                blockQueue.push(nIdx);
            }
        }
    }
}

export function updateWorldLight(getCol, markSubDirty, wx, wy, wz, oldId, newId) {
    if (wy < 0 || wy >= CHUNK_HEIGHT) return;
    const dirs = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

    const readCell = (x, y, z) => {
        if (y < 0 || y >= CHUNK_HEIGHT) return null;
        const cx = Math.floor(x / CHUNK_SIZE);
        const cz = Math.floor(z / CHUNK_SIZE);
        const col = getCol(cx, cz);
        if (!col) return null;
        const lx = x - cx * CHUNK_SIZE;
        const lz = z - cz * CHUNK_SIZE;
        const idx = chunkIndex(lx, y, lz);
        return { col, cx, cz, lx, lz, idx };
    };

    const writeLightVal = (cell, val, isSun) => {
        if (isSun) cell.col.light[cell.idx] = (cell.col.light[cell.idx] & 15) | (val << 4);
        else cell.col.light[cell.idx] = (cell.col.light[cell.idx] & 240) | val;
        markSubDirty(cell.cx, Math.floor(wy / 16), cell.cz);
    };

    const runChannel = (isSun) => {
        const addQ = [];
        const remQ = [];
        const getL = (cell) => (isSun ? (cell.col.light[cell.idx] >> 4) & 15 : cell.col.light[cell.idx] & 15);
        const setL = (cell, y, val) => {
            if (isSun) cell.col.light[cell.idx] = (cell.col.light[cell.idx] & 15) | (val << 4);
            else cell.col.light[cell.idx] = (cell.col.light[cell.idx] & 240) | val;
            markSubDirty(cell.cx, Math.floor(y / 16), cell.cz);
        };

        const center = readCell(wx, wy, wz);
        if (!center) return;
        const curVal = getL(center);

        if (isSun) {
            if (isOpaque(newId) && curVal > 0) {
                remQ.push([wx, wy, wz, curVal]);
                setL(center, wy, 0);
            } else if (!isOpaque(newId) && isOpaque(oldId)) {
                const above = readCell(wx, wy + 1, wz);
                const topSun = wy === CHUNK_HEIGHT - 1 ? 15 : above ? getL(above) : 0;
                const seed = topSun === 15 && newId === BLOCK.AIR ? 15 : Math.max(0, topSun - 1);
                if (seed > curVal) {
                    setL(center, wy, seed);
                    addQ.push([wx, wy, wz]);
                }
                for (let d = 0; d < 6; d += 1) {
                    const nb = readCell(wx + dirs[d][0], wy + dirs[d][1], wz + dirs[d][2]);
                    if (nb && getL(nb) > 1) addQ.push([wx + dirs[d][0], wy + dirs[d][1], wz + dirs[d][2]]);
                }
            }
        } else {
            const oldEmit = getEmissiveLight(oldId);
            const newEmit = getEmissiveLight(newId);
            if (oldEmit > 0 && newEmit < oldEmit) {
                remQ.push([wx, wy, wz, curVal]);
                setL(center, wy, 0);
            } else if (isOpaque(newId) && curVal > 0) {
                remQ.push([wx, wy, wz, curVal]);
                setL(center, wy, 0);
            }
            if (newEmit > 0) {
                setL(center, wy, newEmit);
                addQ.push([wx, wy, wz]);
            } else if (!isOpaque(newId)) {
                for (let d = 0; d < 6; d += 1) {
                    const nb = readCell(wx + dirs[d][0], wy + dirs[d][1], wz + dirs[d][2]);
                    if (nb && getL(nb) > 1) addQ.push([wx + dirs[d][0], wy + dirs[d][1], wz + dirs[d][2]]);
                }
            }
        }

        let rHead = 0;
        while (rHead < remQ.length) {
            const [rx, ry, rz, rVal] = remQ[rHead++];
            for (let d = 0; d < 6; d += 1) {
                const nx = rx + dirs[d][0];
                const ny = ry + dirs[d][1];
                const nz = rz + dirs[d][2];
                const nb = readCell(nx, ny, nz);
                if (!nb) continue;
                const nVal = getL(nb);
                if (nVal !== 0 && (nVal < rVal || (isSun && d === 3 && rVal === 15 && nVal === 15))) {
                    setL(nb, ny, 0);
                    remQ.push([nx, ny, nz, nVal]);
                } else if (nVal >= rVal) {
                    addQ.push([nx, ny, nz]);
                }
            }
        }

        let aHead = 0;
        while (aHead < addQ.length) {
            const [ax, ay, az] = addQ[aHead++];
            const cur = readCell(ax, ay, az);
            if (!cur) continue;
            const cVal = getL(cur);
            if (cVal <= 1) continue;
            for (let d = 0; d < 6; d += 1) {
                const nx = ax + dirs[d][0];
                const ny = ay + dirs[d][1];
                const nz = az + dirs[d][2];
                const nb = readCell(nx, ny, nz);
                if (!nb) continue;
                const nid = nb.col.blocks[nb.idx];
                if (isOpaque(nid)) continue;
                const drop = isSun && d === 3 && cVal === 15 && nid === BLOCK.AIR ? 0 : nid === BLOCK.WATER || nid === BLOCK.LEAVES ? 2 : 1;
                const nextV = cVal - drop;
                if (nextV > getL(nb)) {
                    setL(nb, ny, nextV);
                    addQ.push([nx, ny, nz]);
                }
            }
        }
        void writeLightVal;
    };

    runChannel(true);
    runChannel(false);
}
