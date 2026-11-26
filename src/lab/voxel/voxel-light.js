import { CHUNK_HEIGHT, CHUNK_SIZE, SUB_SIZE, chunkIndex, getEmissiveLight, isOpaque, isWaterlogged, BLOCK } from "./voxel-blocks.js";

const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

function inBounds(lx, ly, lz) {
    return lx >= 0 && lx < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE && ly >= 0 && ly < CHUNK_HEIGHT;
}

function sunDrop(id, isDown, curSun) {
    if (id === BLOCK.WATER || id === BLOCK.LEAVES || isWaterlogged(id)) return 2;
    if (isDown && curSun === 15) return 0;
    return 1;
}

function markCellWithBorders(markSubDirty, cx, cz, lx, y, lz) {
    const sy = Math.floor(y / SUB_SIZE);
    markSubDirty(cx, sy, cz);
    const ly = y - sy * SUB_SIZE;
    if (ly === 0) markSubDirty(cx, sy - 1, cz);
    if (ly === SUB_SIZE - 1) markSubDirty(cx, sy + 1, cz);
    if (lx === 0) markSubDirty(cx - 1, sy, cz);
    if (lx === CHUNK_SIZE - 1) markSubDirty(cx + 1, sy, cz);
    if (lz === 0) markSubDirty(cx, sy, cz - 1);
    if (lz === CHUNK_SIZE - 1) markSubDirty(cx, sy, cz + 1);
}

export function propagateColumnLight(blocks, light) {
    light.fill(0);
    const sunQueue = [];
    const blockQueue = [];
    const topSolid = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE);

    for (let lz = 0; lz < CHUNK_SIZE; lz += 1) {
        for (let lx = 0; lx < CHUNK_SIZE; lx += 1) {
            let sun = 15;
            let hitCover = 0;
            for (let ly = CHUNK_HEIGHT - 1; ly >= 0; ly -= 1) {
                const idx = chunkIndex(lx, ly, lz);
                const id = blocks[idx];
                if (isOpaque(id)) {
                    if (!hitCover) hitCover = ly;
                    sun = 0;
                } else {
                    if (id === BLOCK.WATER || id === BLOCK.LEAVES || isWaterlogged(id)) {
                        if (!hitCover) hitCover = ly;
                        sun = Math.max(0, sun - 2);
                    } else if (sun < 15 && sun > 0) {
                        sun = Math.max(0, sun - 1);
                    }
                    if (sun > 0) {
                        light[idx] = (light[idx] & 15) | (sun << 4);
                    }
                }
                const emit = getEmissiveLight(id);
                if (emit > 0) {
                    light[idx] = (light[idx] & 240) | emit;
                    blockQueue.push(idx);
                }
            }
            topSolid[lx + (lz << 4)] = hitCover;
        }
    }

    for (let lz = 0; lz < CHUNK_SIZE; lz += 1) {
        for (let lx = 0; lx < CHUNK_SIZE; lx += 1) {
            let maxNb = topSolid[lx + (lz << 4)];
            if (lx > 0) maxNb = Math.max(maxNb, topSolid[lx - 1 + (lz << 4)]);
            if (lx < CHUNK_SIZE - 1) maxNb = Math.max(maxNb, topSolid[lx + 1 + (lz << 4)]);
            if (lz > 0) maxNb = Math.max(maxNb, topSolid[lx + ((lz - 1) << 4)]);
            if (lz < CHUNK_SIZE - 1) maxNb = Math.max(maxNb, topSolid[lx + ((lz + 1) << 4)]);
            const ceiling = Math.min(CHUNK_HEIGHT - 1, maxNb + 1);
            for (let ly = 0; ly <= ceiling; ly += 1) {
                const idx = chunkIndex(lx, ly, lz);
                if (((light[idx] >> 4) & 15) > 1) sunQueue.push(idx);
            }
        }
    }

    let head = 0;
    while (head < sunQueue.length) {
        const idx = sunQueue[head++];
        const curSun = (light[idx] >> 4) & 15;
        if (curSun <= 1) continue;
        const lx = idx & 15;
        const lz = (idx >> 4) & 15;
        const ly = idx >> 8;
        for (let d = 0; d < 6; d += 1) {
            const nx = lx + DIRS[d][0];
            const ny = ly + DIRS[d][1];
            const nz = lz + DIRS[d][2];
            if (!inBounds(nx, ny, nz)) continue;
            const nIdx = chunkIndex(nx, ny, nz);
            const nid = blocks[nIdx];
            if (isOpaque(nid)) continue;
            const nextSun = curSun - sunDrop(nid, d === 3, curSun);
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
            const nx = lx + DIRS[d][0];
            const ny = ly + DIRS[d][1];
            const nz = lz + DIRS[d][2];
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

export function stitchColumnLight(getCol, markSubDirty, cx, cz) {
    const col = getCol(cx, cz);
    if (!col) return;
    const sunQ = [];
    const blkQ = [];
    const baseX = cx * CHUNK_SIZE;
    const baseZ = cz * CHUNK_SIZE;

    const readCell = (x, y, z) => {
        if (y < 0 || y >= CHUNK_HEIGHT) return null;
        const ncx = Math.floor(x / CHUNK_SIZE);
        const ncz = Math.floor(z / CHUNK_SIZE);
        const c = getCol(ncx, ncz);
        if (!c) return null;
        const lx = x - ncx * CHUNK_SIZE;
        const lz = z - ncz * CHUNK_SIZE;
        return { col: c, cx: ncx, cz: ncz, lx, lz, idx: chunkIndex(lx, y, lz) };
    };

    const seedBorder = (ax, ay, az, bx, by, bz) => {
        const a = readCell(ax, ay, az);
        const b = readCell(bx, by, bz);
        if (!a || !b) return;
        const aId = a.col.blocks[a.idx];
        const bId = b.col.blocks[b.idx];
        const aSun = (a.col.light[a.idx] >> 4) & 15;
        const bSun = (b.col.light[b.idx] >> 4) & 15;
        if (!isOpaque(bId) && aSun - sunDrop(bId, false, aSun) > bSun) sunQ.push(ax, ay, az);
        if (!isOpaque(aId) && bSun - sunDrop(aId, false, bSun) > aSun) sunQ.push(bx, by, bz);
        const aBlk = a.col.light[a.idx] & 15;
        const bBlk = b.col.light[b.idx] & 15;
        if (!isOpaque(bId) && aBlk - 1 > bBlk) blkQ.push(ax, ay, az);
        if (!isOpaque(aId) && bBlk - 1 > aBlk) blkQ.push(bx, by, bz);
    };

    const edges = [
        [cx - 1, cz, 0, -1, true],
        [cx + 1, cz, CHUNK_SIZE - 1, CHUNK_SIZE, true],
        [cx, cz - 1, 0, -1, false],
        [cx, cz + 1, CHUNK_SIZE - 1, CHUNK_SIZE, false]
    ];
    for (const [ncx, ncz, inner, outer, isX] of edges) {
        if (!getCol(ncx, ncz)) continue;
        for (let y = 1; y < CHUNK_HEIGHT - 1; y += 1) {
            for (let t = 0; t < CHUNK_SIZE; t += 1) {
                if (isX) seedBorder(baseX + inner, y, baseZ + t, baseX + outer, y, baseZ + t);
                else seedBorder(baseX + t, y, baseZ + inner, baseX + t, y, baseZ + outer);
            }
        }
    }

    const flood = (queue, isSun) => {
        let head = 0;
        while (head < queue.length) {
            const ax = queue[head++];
            const ay = queue[head++];
            const az = queue[head++];
            const cur = readCell(ax, ay, az);
            if (!cur) continue;
            const cVal = isSun ? (cur.col.light[cur.idx] >> 4) & 15 : cur.col.light[cur.idx] & 15;
            if (cVal <= 1) continue;
            for (let d = 0; d < 6; d += 1) {
                const nx = ax + DIRS[d][0];
                const ny = ay + DIRS[d][1];
                const nz = az + DIRS[d][2];
                const nb = readCell(nx, ny, nz);
                if (!nb) continue;
                const nid = nb.col.blocks[nb.idx];
                if (isOpaque(nid)) continue;
                const drop = isSun ? sunDrop(nid, d === 3, cVal) : 1;
                const nextV = cVal - drop;
                const curNb = isSun ? (nb.col.light[nb.idx] >> 4) & 15 : nb.col.light[nb.idx] & 15;
                if (nextV > curNb) {
                    if (isSun) nb.col.light[nb.idx] = (nb.col.light[nb.idx] & 15) | (nextV << 4);
                    else nb.col.light[nb.idx] = (nb.col.light[nb.idx] & 240) | nextV;
                    markCellWithBorders(markSubDirty, nb.cx, nb.cz, nb.lx, ny, nb.lz);
                    queue.push(nx, ny, nz);
                }
            }
        }
    };

    if (sunQ.length > 0) flood(sunQ, true);
    if (blkQ.length > 0) flood(blkQ, false);
}

export function updateWorldLight(getCol, markSubDirty, wx, wy, wz, oldId, newId) {
    if (wy < 0 || wy >= CHUNK_HEIGHT) return;

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

    const runChannel = (isSun) => {
        const addQ = [];
        const remQ = [];
        const getL = (cell) => (isSun ? (cell.col.light[cell.idx] >> 4) & 15 : cell.col.light[cell.idx] & 15);
        const setL = (cell, y, val) => {
            if (isSun) cell.col.light[cell.idx] = (cell.col.light[cell.idx] & 15) | (val << 4);
            else cell.col.light[cell.idx] = (cell.col.light[cell.idx] & 240) | val;
            markCellWithBorders(markSubDirty, cell.cx, cell.cz, cell.lx, y, cell.lz);
        };

        const center = readCell(wx, wy, wz);
        if (!center) return;
        const curVal = getL(center);

        if (isSun) {
            const oldAtten = isOpaque(oldId) ? 16 : oldId === BLOCK.WATER || oldId === BLOCK.LEAVES || isWaterlogged(oldId) ? 2 : 0;
            const newAtten = isOpaque(newId) ? 16 : newId === BLOCK.WATER || newId === BLOCK.LEAVES || isWaterlogged(newId) ? 2 : 0;
            if (newAtten > oldAtten && curVal > 0) {
                remQ.push([wx, wy, wz, curVal]);
                setL(center, wy, 0);
            }
            if (!isOpaque(newId)) {
                const above = readCell(wx, wy + 1, wz);
                const topSun = wy === CHUNK_HEIGHT - 1 ? 15 : above ? getL(above) : 0;
                const seed = Math.max(0, topSun - sunDrop(newId, true, topSun));
                if (seed > getL(center)) {
                    setL(center, wy, seed);
                    addQ.push([wx, wy, wz]);
                }
                for (let d = 0; d < 6; d += 1) {
                    const nb = readCell(wx + DIRS[d][0], wy + DIRS[d][1], wz + DIRS[d][2]);
                    if (nb && getL(nb) > 1) addQ.push([wx + DIRS[d][0], wy + DIRS[d][1], wz + DIRS[d][2]]);
                }
            }
        } else {
            const oldEmit = getEmissiveLight(oldId);
            const newEmit = getEmissiveLight(newId);
            if ((oldEmit > 0 && newEmit < oldEmit) || (isOpaque(newId) && curVal > 0)) {
                remQ.push([wx, wy, wz, curVal]);
                setL(center, wy, 0);
            }
            if (newEmit > 0) {
                setL(center, wy, newEmit);
                addQ.push([wx, wy, wz]);
            } else if (!isOpaque(newId)) {
                for (let d = 0; d < 6; d += 1) {
                    const nb = readCell(wx + DIRS[d][0], wy + DIRS[d][1], wz + DIRS[d][2]);
                    if (nb && getL(nb) > 1) addQ.push([wx + DIRS[d][0], wy + DIRS[d][1], wz + DIRS[d][2]]);
                }
            }
        }

        let rHead = 0;
        while (rHead < remQ.length) {
            const [rx, ry, rz, rVal] = remQ[rHead++];
            for (let d = 0; d < 6; d += 1) {
                const nx = rx + DIRS[d][0];
                const ny = ry + DIRS[d][1];
                const nz = rz + DIRS[d][2];
                const nb = readCell(nx, ny, nz);
                if (!nb) continue;
                const nVal = getL(nb);
                if (nVal === 0) continue;
                const nbEmit = !isSun ? getEmissiveLight(nb.col.blocks[nb.idx]) : 0;
                if (nbEmit > 0) {
                    if (nVal < nbEmit) setL(nb, ny, nbEmit);
                    addQ.push([nx, ny, nz]);
                    continue;
                }
                if (nVal < rVal || (isSun && d === 3 && rVal === 15 && nVal === 15)) {
                    setL(nb, ny, 0);
                    remQ.push([nx, ny, nz, nVal]);
                } else if (nVal >= rVal) {
                    addQ.push([nx, ny, nz]);
                }
            }
        }

        if (!isSun) {
            const cEmit = getEmissiveLight(newId);
            if (cEmit > 0 && getL(center) < cEmit) {
                setL(center, wy, cEmit);
                addQ.push([wx, wy, wz]);
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
                const nx = ax + DIRS[d][0];
                const ny = ay + DIRS[d][1];
                const nz = az + DIRS[d][2];
                const nb = readCell(nx, ny, nz);
                if (!nb) continue;
                const nid = nb.col.blocks[nb.idx];
                if (isOpaque(nid)) continue;
                const drop = isSun ? sunDrop(nid, d === 3, cVal) : 1;
                const nextV = cVal - drop;
                if (nextV > getL(nb)) {
                    setL(nb, ny, nextV);
                    addQ.push([nx, ny, nz]);
                }
            }
        }
    };

    runChannel(true);
    runChannel(false);
}
