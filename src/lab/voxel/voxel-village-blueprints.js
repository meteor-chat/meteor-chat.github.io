import { BLOCK } from "./voxel-blocks.js";

function addBlock(list, x, y, z, id) {
    list.push({ dx: x, dy: y, dz: z, id });
}

export function buildFountain(ox, oy, oz) {
    const list = [];
    for (let dx = -3; dx <= 3; dx += 1) {
        for (let dz = -3; dz <= 3; dz += 1) {
            const edge = Math.abs(dx) === 3 || Math.abs(dz) === 3;
            addBlock(list, ox + dx, oy - 1, oz + dz, BLOCK.STONE);
            if (edge) {
                addBlock(list, ox + dx, oy, oz + dz, BLOCK.STONE);
            } else {
                addBlock(list, ox + dx, oy, oz + dz, BLOCK.WATER);
            }
        }
    }
    for (let y = 0; y <= 3; y += 1) {
        addBlock(list, ox, oy + y, oz, BLOCK.STONE);
    }
    addBlock(list, ox, oy + 4, oz, BLOCK.WATER);
    for (const cx of [-3, 3]) {
        for (const cz of [-3, 3]) {
            addBlock(list, ox + cx, oy + 1, oz + cz, BLOCK.STONE);
            addBlock(list, ox + cx, oy + 2, oz + cz, BLOCK.TORCH);
        }
    }
    return list;
}

export function buildCottage(ox, oy, oz, w = 6, d = 6, chimney = true) {
    const list = [];
    for (let x = 0; x < w; x += 1) {
        for (let z = 0; z < d; z += 1) {
            addBlock(list, ox + x, oy, oz + z, BLOCK.WOOD);
        }
    }
    for (let y = 1; y <= 3; y += 1) {
        for (let x = 0; x < w; x += 1) {
            for (let z = 0; z < d; z += 1) {
                const isEdgeX = x === 0 || x === w - 1;
                const isEdgeZ = z === 0 || z === d - 1;
                if (!isEdgeX && !isEdgeZ) continue;
                const isCorner = isEdgeX && isEdgeZ;
                let id = BLOCK.SNOW;
                if (isCorner) {
                    id = BLOCK.WOOD;
                } else if (y === 2 && ((isEdgeX && z === 2) || (isEdgeZ && x === 2))) {
                    id = BLOCK.GLASS;
                }
                if (z === 0 && x === Math.floor(w / 2) && (y === 1 || y === 2)) {
                    id = BLOCK.AIR;
                }
                addBlock(list, ox + x, oy + y, oz + z, id);
            }
        }
    }
    for (let x = 0; x < w; x += 1) {
        for (let z = 0; z < d; z += 1) {
            if (x === 0 || x === w - 1 || z === 0 || z === d - 1) {
                addBlock(list, ox + x, oy + 4, oz + z, BLOCK.WOOD);
            }
        }
    }
    addBlock(list, ox + Math.floor(w / 2), oy + 3, oz + Math.floor(d / 2), BLOCK.TORCH);
    for (let step = 0; step <= 2; step += 1) {
        const ry = oy + 4 + step;
        const minZ = oz - 1 + step;
        const maxZ = oz + d - step;
        for (let x = -1; x <= w; x += 1) {
            const rx = ox + x;
            if (step === 2) {
                for (let z = minZ; z <= maxZ; z += 1) {
                    addBlock(list, rx, ry, z, BLOCK.WOOD);
                }
            } else {
                addBlock(list, rx, ry, minZ, BLOCK.WOOD);
                addBlock(list, rx, ry, maxZ, BLOCK.WOOD);
            }
        }
    }
    for (let step = 0; step < 2; step += 1) {
        const ry = oy + 5 + step;
        const minZ = oz + 1 + step;
        const maxZ = oz + d - 2 - step;
        for (const edgeX of [ox, ox + w - 1]) {
            for (let z = minZ; z <= maxZ; z += 1) {
                addBlock(list, edgeX, ry, z, BLOCK.SNOW);
            }
        }
    }
    if (chimney) {
        const cx = ox + w - 1;
        const cz = oz + Math.floor(d / 2);
        for (let y = 0; y <= 7; y += 1) {
            addBlock(list, cx, oy + y, cz, BLOCK.STONE);
        }
        addBlock(list, cx, oy + 8, cz, BLOCK.TORCH);
    }
    return list;
}

export function buildTower(ox, oy, oz) {
    const list = [];
    const size = 5;
    for (let x = 0; x < size; x += 1) {
        for (let z = 0; z < size; z += 1) {
            addBlock(list, ox + x, oy, oz + z, BLOCK.STONE);
        }
    }
    for (let y = 1; y <= 8; y += 1) {
        for (let x = 0; x < size; x += 1) {
            for (let z = 0; z < size; z += 1) {
                const isEdgeX = x === 0 || x === size - 1;
                const isEdgeZ = z === 0 || z === size - 1;
                if (!isEdgeX && !isEdgeZ) continue;
                let id = BLOCK.STONE;
                if ((y === 3 || y === 6) && (x === 2 || z === 2)) {
                    id = BLOCK.GLASS;
                }
                if (z === 0 && x === 2 && (y === 1 || y === 2)) {
                    id = BLOCK.AIR;
                }
                addBlock(list, ox + x, oy + y, oz + z, id);
            }
        }
    }
    for (let x = -1; x <= size; x += 1) {
        for (let z = -1; z <= size; z += 1) {
            if (x === -1 || x === size || z === -1 || z === size) {
                addBlock(list, ox + x, oy + 9, oz + z, BLOCK.WOOD);
            }
        }
    }
    for (let y = 10; y <= 12; y += 1) {
        for (const cx of [ox, ox + size - 1]) {
            for (const cz of [oz, oz + size - 1]) {
                addBlock(list, cx, oy + y, cz, BLOCK.STONE);
            }
        }
    }
    addBlock(list, ox + 2, oy + 11, oz + 2, BLOCK.TORCH);
    for (let x = 0; x < size; x += 1) {
        for (let z = 0; z < size; z += 1) {
            addBlock(list, ox + x, oy + 13, oz + z, BLOCK.STONE);
        }
    }
    for (let x = 1; x < size - 1; x += 1) {
        for (let z = 1; z < size - 1; z += 1) {
            addBlock(list, ox + x, oy + 14, oz + z, BLOCK.WOOD);
        }
    }
    addBlock(list, ox + 2, oy + 15, oz + 2, BLOCK.WOOD);
    addBlock(list, ox + 2, oy + 16, oz + 2, BLOCK.TORCH);
    return list;
}

export function buildFarm(ox, oy, oz, w = 6, d = 7) {
    const list = [];
    const canalX = Math.floor(w / 2);
    for (let x = 0; x < w; x += 1) {
        for (let z = 0; z < d; z += 1) {
            const edge = x === 0 || x === w - 1 || z === 0 || z === d - 1;
            if (edge) {
                addBlock(list, ox + x, oy, oz + z, BLOCK.WOOD);
            } else if (x === canalX) {
                addBlock(list, ox + x, oy - 1, oz + z, BLOCK.DIRT);
                addBlock(list, ox + x, oy, oz + z, BLOCK.WATER);
            } else {
                addBlock(list, ox + x, oy - 1, oz + z, BLOCK.DIRT);
                addBlock(list, ox + x, oy, oz + z, BLOCK.DIRT);
                addBlock(list, ox + x, oy + 1, oz + z, BLOCK.LEAVES);
            }
        }
    }
    for (const [lx, lz] of [[0, 0], [w - 1, d - 1]]) {
        addBlock(list, ox + lx, oy + 1, oz + lz, BLOCK.WOOD);
        addBlock(list, ox + lx, oy + 2, oz + lz, BLOCK.WOOD);
        addBlock(list, ox + lx, oy + 3, oz + lz, BLOCK.TORCH);
    }
    return list;
}

export function buildLamp(ox, oy, oz) {
    return [
        { dx: ox, dy: oy + 1, dz: oz, id: BLOCK.WOOD },
        { dx: ox, dy: oy + 2, dz: oz, id: BLOCK.WOOD },
        { dx: ox, dy: oy + 3, dz: oz, id: BLOCK.WOOD },
        { dx: ox, dy: oy + 4, dz: oz, id: BLOCK.TORCH }
    ];
}
