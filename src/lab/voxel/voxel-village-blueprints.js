import { BLOCK } from "./voxel-blocks.js";

function addBlock(list, x, y, z, id) {
    list.push({ dx: x, dy: y, dz: z, id });
}

export function buildFountain(ox, oy, oz) {
    const list = [];
    for (let dx = -3; dx <= 3; dx += 1) {
        for (let dz = -3; dz <= 3; dz += 1) {
            const edge = Math.abs(dx) === 3 || Math.abs(dz) === 3;
            addBlock(list, ox + dx, oy - 1, oz + dz, BLOCK.COBBLESTONE);
            if (edge) {
                addBlock(list, ox + dx, oy, oz + dz, BLOCK.STONE_BRICK);
            } else {
                addBlock(list, ox + dx, oy, oz + dz, BLOCK.WATER);
            }
        }
    }
    for (let y = 0; y <= 3; y += 1) {
        addBlock(list, ox, oy + y, oz, BLOCK.STONE_BRICK);
    }
    addBlock(list, ox, oy + 4, oz, BLOCK.TORCH);
    for (const cx of [-3, 3]) {
        for (const cz of [-3, 3]) {
            addBlock(list, ox + cx, oy + 1, oz + cz, BLOCK.STONE_BRICK);
            addBlock(list, ox + cx, oy + 2, oz + cz, BLOCK.TORCH);
        }
    }
    return list;
}

export function buildCottage(ox, oy, oz, w = 6, d = 6, chimney = true, doorSide = "south") {
    const list = [];
    const doorX = Math.floor(w / 2);
    const doorZ = Math.floor(d / 2);

    for (let x = 0; x < w; x += 1) {
        for (let z = 0; z < d; z += 1) {
            const isEdge = x === 0 || x === w - 1 || z === 0 || z === d - 1;
            addBlock(list, ox + x, oy, oz + z, isEdge ? BLOCK.STONE_BRICK : BLOCK.WOOD_PLANKS);
        }
    }

    for (let y = 1; y <= 3; y += 1) {
        for (let x = 0; x < w; x += 1) {
            for (let z = 0; z < d; z += 1) {
                const isEdgeX = x === 0 || x === w - 1;
                const isEdgeZ = z === 0 || z === d - 1;
                if (!isEdgeX && !isEdgeZ) continue;
                const isCorner = isEdgeX && isEdgeZ;
                const isDoor =
                    (y === 1 || y === 2) &&
                    ((doorSide === "north" && z === 0 && x === doorX) ||
                        (doorSide === "south" && z === d - 1 && x === doorX) ||
                        (doorSide === "west" && x === 0 && z === doorZ) ||
                        (doorSide === "east" && x === w - 1 && z === doorZ));
                if (isDoor) {
                    addBlock(list, ox + x, oy + y, oz + z, BLOCK.AIR);
                    continue;
                }
                let id = BLOCK.PLASTER;
                if (isCorner) {
                    id = BLOCK.WOOD;
                } else if (y === 2 && ((isEdgeX && z === doorZ) || (isEdgeZ && x === doorX))) {
                    id = BLOCK.GLASS;
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

    addBlock(list, ox + 1, oy + 1, oz + 1, BLOCK.WOOD);
    addBlock(list, ox + 1, oy + 2, oz + 1, BLOCK.TORCH);
    addBlock(list, ox + w - 2, oy + 1, oz + d - 2, BLOCK.WOOD);
    addBlock(list, ox + w - 2, oy + 2, oz + d - 2, BLOCK.TORCH);

    for (let step = 0; step <= 2; step += 1) {
        const ry = oy + 4 + step;
        const minZ = oz - 1 + step;
        const maxZ = oz + d - step;
        for (let x = -1; x <= w; x += 1) {
            const rx = ox + x;
            if (step === 2) {
                for (let z = minZ; z <= maxZ; z += 1) {
                    addBlock(list, rx, ry, z, BLOCK.ROOF_RED);
                }
            } else {
                addBlock(list, rx, ry, minZ, BLOCK.ROOF_RED);
                addBlock(list, rx, ry, maxZ, BLOCK.ROOF_RED);
            }
        }
    }

    for (const edgeX of [ox, ox + w - 1]) {
        for (let z = oz + 1; z <= oz + d - 2; z += 1) {
            addBlock(list, edgeX, oy + 5, z, BLOCK.PLASTER);
        }
    }

    if (chimney) {
        const cx = doorSide === "east" ? ox : ox + w - 1;
        const cz = oz + Math.floor(d / 2);
        for (let y = 0; y <= 7; y += 1) {
            addBlock(list, cx, oy + y, cz, BLOCK.COBBLESTONE);
        }
        addBlock(list, cx, oy + 8, cz, BLOCK.TORCH);
    }
    return list;
}

export function buildWindmill(ox, oy, oz) {
    const list = [];
    const size = 5;
    for (let x = 0; x < size; x += 1) {
        for (let z = 0; z < size; z += 1) {
            addBlock(list, ox + x, oy, oz + z, BLOCK.COBBLESTONE);
        }
    }
    for (let y = 1; y <= 4; y += 1) {
        for (let x = 0; x < size; x += 1) {
            for (let z = 0; z < size; z += 1) {
                const edge = x === 0 || x === size - 1 || z === 0 || z === size - 1;
                if (!edge) continue;
                if (z === 0 && x === 2 && (y === 1 || y === 2)) {
                    addBlock(list, ox + x, oy + y, oz + z, BLOCK.AIR);
                } else {
                    addBlock(list, ox + x, oy + y, oz + z, BLOCK.STONE_BRICK);
                }
            }
        }
    }
    for (let x = 1; x < size - 1; x += 1) {
        for (let z = 1; z < size - 1; z += 1) {
            if (x === 1 && z === 1) continue;
            addBlock(list, ox + x, oy + 5, oz + z, BLOCK.WOOD_PLANKS);
        }
    }
    addBlock(list, ox + 3, oy + 1, oz + 3, BLOCK.WOOD);
    addBlock(list, ox + 3, oy + 2, oz + 3, BLOCK.TORCH);
    for (let y = 5; y <= 9; y += 1) {
        for (let x = 0; x < size; x += 1) {
            for (let z = 0; z < size; z += 1) {
                const isEdgeX = x === 0 || x === size - 1;
                const isEdgeZ = z === 0 || z === size - 1;
                if (!isEdgeX && !isEdgeZ) continue;
                const isCorner = isEdgeX && isEdgeZ;
                let id = BLOCK.PLASTER;
                if (isCorner) {
                    id = BLOCK.WOOD;
                } else if (y === 7 && (x === 2 || z === 2)) {
                    id = BLOCK.GLASS;
                }
                addBlock(list, ox + x, oy + y, oz + z, id);
            }
        }
    }
    for (let x = 0; x < size; x += 1) {
        for (let z = 0; z < size; z += 1) {
            addBlock(list, ox + x, oy + 10, oz + z, BLOCK.ROOF_RED);
        }
    }
    for (let x = 1; x < size - 1; x += 1) {
        for (let z = 1; z < size - 1; z += 1) {
            addBlock(list, ox + x, oy + 11, oz + z, BLOCK.ROOF_RED);
        }
    }
    addBlock(list, ox + 2, oy + 12, oz + 2, BLOCK.ROOF_RED);
    addBlock(list, ox + 2, oy + 13, oz + 2, BLOCK.TORCH);
    const hx = ox + 2;
    const hy = oy + 8;
    const hz = oz - 1;
    addBlock(list, hx, hy, hz, BLOCK.WOOD);
    for (let d = 1; d <= 4; d += 1) {
        addBlock(list, hx + d, hy, hz, BLOCK.WOOD_PLANKS);
        addBlock(list, hx - d, hy, hz, BLOCK.WOOD_PLANKS);
        addBlock(list, hx, hy + d, hz, BLOCK.WOOD_PLANKS);
        addBlock(list, hx, hy - d, hz, BLOCK.WOOD_PLANKS);
    }
    for (const [bx, bz] of [[ox - 1, oz + 1], [ox - 1, oz + 2], [ox - 2, oz + 1]]) {
        addBlock(list, bx, oy, bz, BLOCK.COBBLESTONE);
        addBlock(list, bx, oy + 1, bz, BLOCK.HAY_BALE);
    }
    addBlock(list, ox - 1, oy + 2, oz + 1, BLOCK.HAY_BALE);
    return list;
}

export function buildTower(ox, oy, oz) {
    const list = [];
    const size = 5;
    for (let x = 0; x < size; x += 1) {
        for (let z = 0; z < size; z += 1) {
            addBlock(list, ox + x, oy, oz + z, BLOCK.STONE_BRICK);
        }
    }
    for (let y = 1; y <= 8; y += 1) {
        for (let x = 0; x < size; x += 1) {
            for (let z = 0; z < size; z += 1) {
                const isEdgeX = x === 0 || x === size - 1;
                const isEdgeZ = z === 0 || z === size - 1;
                if (!isEdgeX && !isEdgeZ) continue;
                let id = BLOCK.STONE_BRICK;
                if ((y === 3 || y === 6) && (x === 2 || z === 2)) {
                    id = BLOCK.GLASS;
                }
                if (x === 0 && z === 2 && (y === 1 || y === 2)) {
                    id = BLOCK.AIR;
                }
                addBlock(list, ox + x, oy + y, oz + z, id);
            }
        }
    }
    for (let x = 1; x < size - 1; x += 1) {
        for (let z = 1; z < size - 1; z += 1) {
            if (x === 3 && z === 3) continue;
            addBlock(list, ox + x, oy + 4, oz + z, BLOCK.WOOD_PLANKS);
            addBlock(list, ox + x, oy + 9, oz + z, BLOCK.WOOD_PLANKS);
        }
    }
    addBlock(list, ox + 3, oy + 1, oz + 1, BLOCK.WOOD);
    addBlock(list, ox + 3, oy + 2, oz + 1, BLOCK.TORCH);
    for (let x = -1; x <= size; x += 1) {
        for (let z = -1; z <= size; z += 1) {
            const edge = x === -1 || x === size || z === -1 || z === size;
            if (edge) {
                addBlock(list, ox + x, oy + 9, oz + z, BLOCK.WOOD_PLANKS);
            }
        }
    }
    for (let y = 10; y <= 12; y += 1) {
        for (const cx of [ox, ox + size - 1]) {
            for (const cz of [oz, oz + size - 1]) {
                addBlock(list, cx, oy + y, cz, BLOCK.STONE_BRICK);
            }
        }
    }
    addBlock(list, ox + 2, oy + 10, oz + 2, BLOCK.STONE_BRICK);
    addBlock(list, ox + 2, oy + 11, oz + 2, BLOCK.TORCH);
    for (let x = 0; x < size; x += 1) {
        for (let z = 0; z < size; z += 1) {
            addBlock(list, ox + x, oy + 13, oz + z, BLOCK.ROOF_GREEN);
        }
    }
    for (let x = 1; x < size - 1; x += 1) {
        for (let z = 1; z < size - 1; z += 1) {
            addBlock(list, ox + x, oy + 14, oz + z, BLOCK.ROOF_GREEN);
        }
    }
    addBlock(list, ox + 2, oy + 15, oz + 2, BLOCK.ROOF_GREEN);
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
                addBlock(list, ox + x, oy, oz + z, BLOCK.STONE_BRICK);
            } else if (x === canalX) {
                addBlock(list, ox + x, oy - 1, oz + z, BLOCK.DIRT);
                addBlock(list, ox + x, oy, oz + z, BLOCK.WATER);
            } else {
                addBlock(list, ox + x, oy - 1, oz + z, BLOCK.DIRT);
                addBlock(list, ox + x, oy, oz + z, BLOCK.DIRT);
                addBlock(list, ox + x, oy + 1, oz + z, BLOCK.WHEAT);
            }
        }
    }
    for (const [lx, lz] of [[0, 0], [w - 1, d - 1]]) {
        addBlock(list, ox + lx, oy + 1, oz + lz, BLOCK.STONE_BRICK);
        addBlock(list, ox + lx, oy + 2, oz + lz, BLOCK.WOOD);
        addBlock(list, ox + lx, oy + 3, oz + lz, BLOCK.TORCH);
    }
    addBlock(list, ox + w, oy, oz + 1, BLOCK.COBBLESTONE);
    addBlock(list, ox + w, oy + 1, oz + 1, BLOCK.HAY_BALE);
    addBlock(list, ox + w, oy, oz + 2, BLOCK.COBBLESTONE);
    addBlock(list, ox + w, oy + 1, oz + 2, BLOCK.HAY_BALE);
    return list;
}

export function buildArchBridge(ox, oy, oz, length = 7) {
    const list = [];
    for (let step = 0; step < length; step += 1) {
        const bz = oz + step;
        const archLift = Math.round(Math.sin((step / (length - 1)) * Math.PI) * 1.5);
        const y = oy + archLift;
        for (let dx = -1; dx <= 1; dx += 1) {
            addBlock(list, ox + dx, y, bz, dx === 0 ? BLOCK.COBBLESTONE : BLOCK.STONE_BRICK);
            addBlock(list, ox + dx, y - 1, bz, BLOCK.STONE_BRICK);
        }
        addBlock(list, ox - 2, y, bz, BLOCK.STONE_BRICK);
        addBlock(list, ox - 2, y + 1, bz, BLOCK.STONE_BRICK);
        addBlock(list, ox + 2, y, bz, BLOCK.STONE_BRICK);
        addBlock(list, ox + 2, y + 1, bz, BLOCK.STONE_BRICK);
    }
    return list;
}

export function buildLamp(ox, oy, oz) {
    return [
        { dx: ox, dy: oy + 1, dz: oz, id: BLOCK.STONE_BRICK },
        { dx: ox, dy: oy + 2, dz: oz, id: BLOCK.WOOD },
        { dx: ox, dy: oy + 3, dz: oz, id: BLOCK.WOOD },
        { dx: ox, dy: oy + 4, dz: oz, id: BLOCK.TORCH }
    ];
}
