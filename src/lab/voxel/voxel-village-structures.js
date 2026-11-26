import { BLOCK, SEA_LEVEL } from "./voxel-blocks.js";

function mapDir(ox, oz, w, d, dir, lx, lz) {
    if (dir === "north") return [ox + (w - 1 - lx), oz + (d - 1 - lz)];
    if (dir === "east") return [ox + lz, oz + (w - 1 - lx)];
    if (dir === "west") return [ox + (d - 1 - lz), oz + lx];
    return [ox + lx, oz + lz];
}

export function rotatedFootprint(ox, oz, w, d, dir) {
    const rw = dir === "east" || dir === "west" ? d : w;
    const rd = dir === "east" || dir === "west" ? w : d;
    return { x0: ox, z0: oz, x1: ox + rw - 1, z1: oz + rd - 1, rw, rd };
}

function makePlacer(list, ox, oy, oz, w, d, dir) {
    return (lx, dy, lz, id) => {
        const [wx, wz] = mapDir(ox, oz, w, d, dir, lx, lz);
        list.push({ dx: wx, dy: oy + dy, dz: wz, id });
    };
}

function stoneMix(x, y, z, mossyBias) {
    const h = ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
    const r = (h % 100) / 100;
    if (r < mossyBias) return BLOCK.MOSSY_COBBLE;
    if (r > 0.84) return BLOCK.STONE_BRICK;
    return BLOCK.COBBLESTONE;
}

export function buildTimberHouse(ox, oy, oz, opts = {}) {
    const w = opts.w || 6;
    const d = opts.d || 6;
    const dir = opts.dir || "south";
    const roofBlock = opts.roofBlock || BLOCK.WOOD_PLANKS;
    const wallBlock = opts.wallBlock || BLOCK.WOOD_PLANKS;
    const wallH = opts.wallH || 3;
    const hasChimney = opts.chimney !== false;
    const blocks = [];
    const put = makePlacer(blocks, ox, oy, oz, w, d, dir);
    const doorX = Math.floor(w / 2);
    const midZ = Math.floor(d / 2);

    for (let x = 0; x < w; x += 1) {
        for (let z = 0; z < d; z += 1) {
            const edge = x === 0 || x === w - 1 || z === 0 || z === d - 1;
            put(x, 0, z, edge ? stoneMix(ox + x, oy, oz + z, 0.25) : BLOCK.WOOD_PLANKS);
        }
    }

    for (let y = 1; y <= wallH; y += 1) {
        for (let x = 0; x < w; x += 1) {
            for (let z = 0; z < d; z += 1) {
                const edgeX = x === 0 || x === w - 1;
                const edgeZ = z === 0 || z === d - 1;
                if (!edgeX && !edgeZ) continue;
                const corner = edgeX && edgeZ;
                if (z === d - 1 && x === doorX && (y === 1 || y === 2)) {
                    put(x, y, z, BLOCK.AIR);
                    continue;
                }
                if (corner) {
                    put(x, y, z, BLOCK.WOOD);
                    continue;
                }
                if (y === 1) {
                    put(x, y, z, stoneMix(ox + x, oy + y, oz + z, 0.18));
                    continue;
                }
                const isSideWin = y === 2 && edgeX && (z === midZ || (d >= 7 && (z === 2 || z === d - 3)));
                const isFrontBackWin = y === 2 && edgeZ && (
                    (z === 0 && (x === doorX || (w >= 7 && (x === 2 || x === w - 3)))) ||
                    (z === d - 1 && w >= 6 && (x === 1 || x === w - 2))
                );
                if (isSideWin || isFrontBackWin) {
                    put(x, y, z, BLOCK.GLASS);
                } else {
                    put(x, y, z, wallBlock);
                }
            }
        }
    }

    const beamY = wallH + 1;
    for (let x = 0; x < w; x += 1) {
        for (let z = 0; z < d; z += 1) {
            if (x === 0 || x === w - 1 || z === 0 || z === d - 1) {
                put(x, beamY, z, BLOCK.WOOD);
            }
        }
    }

    put(1, 1, 1, BLOCK.BARREL);
    put(w - 2, 1, 1, BLOCK.WOOD_PLANKS);
    put(w - 2, 2, 1, BLOCK.TORCH);
    put(1, 2, d - 2, BLOCK.TORCH);
    put(doorX, 0, d, BLOCK.COBBLESTONE);
    if (doorX + 1 < w - 1) {
        put(doorX + 1, 3, d, BLOCK.LANTERN);
    }

    const roofSteps = Math.max(2, Math.floor((d + 1) / 2));
    for (let step = 0; step <= roofSteps; step += 1) {
        const ry = beamY + step;
        const minZ = -1 + step;
        const maxZ = d - step;
        if (minZ > maxZ) break;
        for (let x = -1; x <= w; x += 1) {
            const isGableTrim = x === -1 || x === w;
            const mat = isGableTrim && roofBlock === BLOCK.WOOD_PLANKS ? BLOCK.WOOD : roofBlock;
            if (step === roofSteps || maxZ - minZ <= 1) {
                for (let z = minZ; z <= maxZ; z += 1) {
                    put(x, ry, z, mat);
                }
            } else {
                put(x, ry, minZ, mat);
                put(x, ry, maxZ, mat);
            }
        }
        if (step >= 1 && minZ + 1 <= maxZ - 1) {
            for (const gx of [0, w - 1]) {
                for (let z = minZ + 1; z <= maxZ - 1; z += 1) {
                    const isAtticWin = step === 1 && z === midZ && d >= 6;
                    put(gx, ry, z, isAtticWin ? BLOCK.GLASS : wallBlock);
                }
            }
        }
    }

    let chimney = null;
    if (hasChimney) {
        const cx = 0;
        const cz = Math.max(1, midZ - 1);
        const topY = beamY + roofSteps + 2;
        for (let y = 0; y <= topY; y += 1) {
            put(cx, y, cz, stoneMix(ox + cx, oy + y, oz + cz, 0.12));
        }
        const [wx, wz] = mapDir(ox, oz, w, d, dir, cx, cz);
        chimney = { x: wx, y: oy + topY + 1, z: wz };
    }

    const [dx, dz] = mapDir(ox, oz, w, d, dir, doorX, d);
    return {
        blocks,
        footprint: rotatedFootprint(ox, oz, w, d, dir),
        door: { x: dx, y: oy + 1, z: dz },
        chimney,
        roofTopY: oy + beamY + roofSteps + 2
    };
}

export function buildTownhouse(ox, oy, oz, opts = {}) {
    const w = opts.w || 7;
    const d = opts.d || 7;
    const dir = opts.dir || "south";
    const roofBlock = opts.roofBlock || BLOCK.WOOD_PLANKS;
    const blocks = [];
    const put = makePlacer(blocks, ox, oy, oz, w, d, dir);
    const doorX = Math.floor(w / 2);
    const midZ = Math.floor(d / 2);

    for (let x = 0; x < w; x += 1) {
        for (let z = 0; z < d; z += 1) {
            const edge = x === 0 || x === w - 1 || z === 0 || z === d - 1;
            put(x, 0, z, edge ? stoneMix(ox + x, oy, oz + z, 0.22) : BLOCK.WOOD_PLANKS);
        }
    }

    for (let y = 1; y <= 3; y += 1) {
        for (let x = 0; x < w; x += 1) {
            for (let z = 0; z < d; z += 1) {
                const edgeX = x === 0 || x === w - 1;
                const edgeZ = z === 0 || z === d - 1;
                if (!edgeX && !edgeZ) continue;
                if (z === d - 1 && x === doorX && (y === 1 || y === 2)) {
                    put(x, y, z, BLOCK.AIR);
                    continue;
                }
                if (edgeX && edgeZ) {
                    put(x, y, z, BLOCK.WOOD);
                } else if (y === 2 && ((edgeX && (z === 2 || z === d - 3)) || (edgeZ && (x === 1 || x === w - 2)))) {
                    put(x, y, z, BLOCK.GLASS);
                } else {
                    put(x, y, z, stoneMix(ox + x, oy + y, oz + z, 0.16));
                }
            }
        }
    }

    for (let x = 0; x < w; x += 1) {
        for (let z = 0; z < d; z += 1) {
            const edge = x === 0 || x === w - 1 || z === 0 || z === d - 1;
            if (!edge && x === 1 && z === 1) continue;
            put(x, 4, z, edge ? BLOCK.WOOD : BLOCK.WOOD_PLANKS);
        }
    }

    for (let y = 5; y <= 7; y += 1) {
        for (let x = 0; x < w; x += 1) {
            for (let z = 0; z < d; z += 1) {
                const edgeX = x === 0 || x === w - 1;
                const edgeZ = z === 0 || z === d - 1;
                if (!edgeX && !edgeZ) continue;
                if (edgeX && edgeZ) {
                    put(x, y, z, BLOCK.WOOD);
                } else if (y === 6 && ((edgeX && (z === 2 || z === d - 3)) || (edgeZ && (x === 2 || x === w - 3)))) {
                    put(x, y, z, BLOCK.GLASS);
                } else {
                    put(x, y, z, BLOCK.PLASTER);
                }
            }
        }
    }

    for (let x = 0; x < w; x += 1) {
        for (let z = 0; z < d; z += 1) {
            if (x === 0 || x === w - 1 || z === 0 || z === d - 1) {
                put(x, 8, z, BLOCK.WOOD);
            }
        }
    }

    put(w - 2, 1, 1, BLOCK.BARREL);
    put(w - 2, 2, 1, BLOCK.BARREL);
    put(1, 3, d - 2, BLOCK.LANTERN);
    put(w - 2, 6, d - 2, BLOCK.TORCH);
    put(1, 6, 2, BLOCK.TORCH);
    put(doorX, 0, d, BLOCK.STONE_BRICK);
    put(doorX, 4, d, BLOCK.WOOD);
    put(doorX, 3, d, BLOCK.LANTERN);

    const roofSteps = 3;
    for (let step = 0; step <= roofSteps; step += 1) {
        const ry = 8 + step;
        const minZ = -1 + step;
        const maxZ = d - step;
        for (let x = -1; x <= w; x += 1) {
            const isTrim = x === -1 || x === w;
            const mat = isTrim && roofBlock === BLOCK.WOOD_PLANKS ? BLOCK.WOOD : roofBlock;
            if (step === roofSteps || maxZ - minZ <= 1) {
                for (let z = minZ; z <= maxZ; z += 1) put(x, ry, z, mat);
            } else {
                put(x, ry, minZ, mat);
                put(x, ry, maxZ, mat);
            }
        }
        if (step >= 1 && minZ + 1 <= maxZ - 1) {
            for (const gx of [0, w - 1]) {
                for (let z = minZ + 1; z <= maxZ - 1; z += 1) {
                    put(gx, ry, z, step === 1 && z === midZ ? BLOCK.GLASS : BLOCK.PLASTER);
                }
            }
        }
    }

    const cx = w - 1;
    const cz = 1;
    for (let y = 0; y <= 13; y += 1) {
        put(cx, y, cz, stoneMix(ox + cx, oy + y, oz + cz, 0.1));
    }
    const [chimX, chimZ] = mapDir(ox, oz, w, d, dir, cx, cz);
    const [dx, dz] = mapDir(ox, oz, w, d, dir, doorX, d);
    return {
        blocks,
        footprint: rotatedFootprint(ox, oz, w, d, dir),
        door: { x: dx, y: oy + 1, z: dz },
        chimney: { x: chimX, y: oy + 14, z: chimZ },
        roofTopY: oy + 14
    };
}

export function buildChurch(ox, oy, oz, dir = "south") {
    const w = 7;
    const d = 9;
    const blocks = [];
    const put = makePlacer(blocks, ox, oy, oz, w, d, dir);

    for (let x = 0; x < w; x += 1) {
        for (let z = 0; z < d; z += 1) {
            const edge = x === 0 || x === w - 1 || z === 0 || z === d - 1;
            put(x, 0, z, edge ? stoneMix(ox + x, oy, oz + z, 0.25) : BLOCK.STONE_BRICK);
        }
    }

    for (let y = 1; y <= 5; y += 1) {
        for (let x = 0; x < w; x += 1) {
            for (let z = 0; z < 5; z += 1) {
                const edgeX = x === 0 || x === w - 1;
                const edgeZ = z === 0;
                if (!edgeX && !edgeZ) continue;
                const win = (y === 2 || y === 3) && ((edgeX && z === 2) || (edgeZ && x === 3));
                put(x, y, z, win ? BLOCK.GLASS : stoneMix(ox + x, oy + y, oz + z, 0.2));
            }
        }
    }

    for (let step = 0; step <= 2; step += 1) {
        for (let x = step; x <= w - 1 - step; x += 1) {
            for (let z = 0; z < 5; z += 1) {
                if (x === step || x === w - 1 - step || step === 2) {
                    put(x, 6 + step, z, BLOCK.STONE_BRICK);
                }
            }
        }
    }

    for (let y = 1; y <= 14; y += 1) {
        for (let x = 1; x <= 5; x += 1) {
            for (let z = 4; z <= 8; z += 1) {
                const edgeX = x === 1 || x === 5;
                const edgeZ = z === 4 || z === 8;
                if (!edgeX && !edgeZ) continue;
                if (z === 8 && x === 3 && (y === 1 || y === 2)) {
                    put(x, y, z, BLOCK.AIR);
                    continue;
                }
                if (z === 4 && x === 3 && (y === 1 || y === 2)) {
                    put(x, y, z, BLOCK.AIR);
                    continue;
                }
                const corner = edgeX && edgeZ;
                const belfry = (y === 11 || y === 12) && !corner && (x === 3 || z === 6);
                if (belfry) {
                    put(x, y, z, BLOCK.AIR);
                    continue;
                }
                const slit = (y === 5 || y === 6 || y === 8 || y === 9) && !corner && (x === 3 || z === 6);
                if (slit) {
                    put(x, y, z, BLOCK.GLASS);
                } else if (corner) {
                    put(x, y, z, BLOCK.STONE_BRICK);
                } else {
                    put(x, y, z, stoneMix(ox + x, oy + y, oz + z, 0.22));
                }
            }
        }
    }

    for (let x = 2; x <= 4; x += 1) {
        for (let z = 5; z <= 7; z += 1) {
            put(x, 10, z, BLOCK.WOOD_PLANKS);
            put(x, 14, z, BLOCK.STONE_BRICK);
        }
    }
    put(3, 13, 6, BLOCK.LANTERN);
    put(3, 4, 2, BLOCK.LANTERN);
    put(3, 1, 1, BLOCK.STONE_BRICK);
    put(3, 2, 1, BLOCK.TORCH);

    for (let x = 1; x <= 5; x += 1) {
        for (let z = 4; z <= 8; z += 1) {
            const edge = x === 1 || x === 5 || z === 4 || z === 8;
            if (!edge) continue;
            const crenel = (x + z) % 2 === 0;
            if (crenel) put(x, 15, z, BLOCK.STONE_BRICK);
        }
    }

    put(3, 0, d, BLOCK.STONE_BRICK);
    put(2, 3, d, BLOCK.LANTERN);
    const [dx, dz] = mapDir(ox, oz, w, d, dir, 3, d);
    return {
        blocks,
        footprint: rotatedFootprint(ox, oz, w, d, dir),
        door: { x: dx, y: oy + 1, z: dz },
        chimney: null,
        roofTopY: oy + 16
    };
}

export function buildBlacksmith(ox, oy, oz, dir = "south") {
    const w = 8;
    const d = 7;
    const blocks = [];
    const put = makePlacer(blocks, ox, oy, oz, w, d, dir);

    for (let x = 0; x < w; x += 1) {
        for (let z = 0; z < d; z += 1) {
            put(x, 0, z, x < 4 ? stoneMix(ox + x, oy, oz + z, 0.14) : BLOCK.WOOD_PLANKS);
        }
    }

    for (let y = 1; y <= 3; y += 1) {
        for (let x = 4; x < w; x += 1) {
            for (let z = 0; z < d; z += 1) {
                const edgeX = x === 4 || x === w - 1;
                const edgeZ = z === 0 || z === d - 1;
                if (!edgeX && !edgeZ) continue;
                if (z === d - 1 && x === 5 && (y === 1 || y === 2)) {
                    put(x, y, z, BLOCK.AIR);
                    continue;
                }
                if (edgeX && edgeZ) {
                    put(x, y, z, BLOCK.WOOD);
                } else if (y === 2 && ((edgeX && z === 3) || (z === 0 && x === 6))) {
                    put(x, y, z, BLOCK.GLASS);
                } else if (y === 1) {
                    put(x, y, z, stoneMix(ox + x, oy + y, oz + z, 0.15));
                } else {
                    put(x, y, z, BLOCK.WOOD_PLANKS);
                }
            }
        }
    }

    for (let y = 1; y <= 3; y += 1) {
        put(0, y, d - 1, BLOCK.WOOD);
        put(0, y, 0, BLOCK.COBBLESTONE);
        for (let x = 0; x <= 3; x += 1) {
            put(x, y, 0, stoneMix(ox + x, oy + y, oz, 0.14));
        }
        for (let z = 0; z <= 3; z += 1) {
            put(0, y, z, stoneMix(ox, oy + y, oz + z, 0.14));
        }
    }

    put(1, 1, 1, BLOCK.LAVA);
    put(2, 1, 1, BLOCK.LAVA);
    put(1, 1, 2, BLOCK.STONE_BRICK);
    put(2, 1, 2, BLOCK.STONE_BRICK);
    put(3, 1, 1, BLOCK.STONE_BRICK);
    put(3, 1, 2, BLOCK.STONE_BRICK);
    put(1, 1, 4, BLOCK.STONE_BRICK);
    put(3, 1, 5, BLOCK.BARREL);
    put(6, 1, 1, BLOCK.BARREL);
    put(6, 2, 1, BLOCK.TORCH);
    put(2, 3, d - 1, BLOCK.LANTERN);

    for (let x = 0; x < w; x += 1) {
        for (let z = 0; z < d; z += 1) {
            put(x, 4, z, BLOCK.STONE_BRICK);
        }
    }
    for (let x = 1; x < w - 1; x += 1) {
        for (let z = 1; z < d - 1; z += 1) {
            put(x, 5, z, BLOCK.COBBLESTONE);
        }
    }

    for (let y = 1; y <= 8; y += 1) {
        put(1, y, 0, stoneMix(ox + 1, oy + y, oz, 0.1));
        put(2, y, 0, stoneMix(ox + 2, oy + y, oz, 0.1));
    }

    put(2, 0, d, BLOCK.COBBLESTONE);
    put(5, 0, d, BLOCK.COBBLESTONE);
    const [chimX, chimZ] = mapDir(ox, oz, w, d, dir, 1, 0);
    const [dx, dz] = mapDir(ox, oz, w, d, dir, 3, d);
    return {
        blocks,
        footprint: rotatedFootprint(ox, oz, w, d, dir),
        door: { x: dx, y: oy + 1, z: dz },
        chimney: { x: chimX, y: oy + 9, z: chimZ, isForge: true },
        roofTopY: oy + 9
    };
}

export function buildMarketStall(ox, oy, oz, dir = "south", awningBlock = BLOCK.ROOF_RED) {
    const w = 5;
    const d = 3;
    const blocks = [];
    const put = makePlacer(blocks, ox, oy, oz, w, d, dir);

    for (let x = 0; x < w; x += 1) {
        for (let z = 0; z < d; z += 1) {
            put(x, 0, z, BLOCK.COBBLESTONE);
        }
    }
    for (const px of [0, w - 1]) {
        for (const pz of [0, d - 1]) {
            put(px, 1, pz, BLOCK.WOOD);
            put(px, 2, pz, BLOCK.WOOD);
            put(px, 3, pz, BLOCK.WOOD);
        }
    }
    for (let x = 1; x <= w - 2; x += 1) {
        put(x, 1, 1, BLOCK.WOOD_PLANKS);
    }
    put(1, 1, 0, BLOCK.BARREL);
    put(w - 2, 1, 0, BLOCK.HAY_BALE);
    put(2, 3, 1, BLOCK.LANTERN);

    for (let x = 0; x < w; x += 1) {
        const stripe = x % 2 === 0 ? awningBlock : BLOCK.PLASTER;
        put(x, 4, 0, stripe);
        put(x, 4, 1, stripe);
        put(x, 3, d - 1, stripe);
    }

    const [dx, dz] = mapDir(ox, oz, w, d, dir, 2, d);
    return {
        blocks,
        footprint: rotatedFootprint(ox, oz, w, d, dir),
        door: { x: dx, y: oy + 1, z: dz },
        chimney: null,
        roofTopY: oy + 5
    };
}

export function buildTerracedFarm(ox, oy, oz, w = 7, d = 6, dir = "south") {
    const blocks = [];
    const put = makePlacer(blocks, ox, oy, oz, w, d, dir);
    const canalX = Math.floor(w / 2);

    for (let x = 0; x < w; x += 1) {
        for (let z = 0; z < d; z += 1) {
            const edge = x === 0 || x === w - 1 || z === 0 || z === d - 1;
            if (edge) {
                put(x, 0, z, x === 0 || x === w - 1 ? BLOCK.WOOD : BLOCK.STONE_BRICK);
            } else if (x === canalX) {
                put(x, -1, z, BLOCK.DIRT);
                put(x, 0, z, BLOCK.WATER);
            } else {
                put(x, -1, z, BLOCK.DIRT);
                put(x, 0, z, BLOCK.DIRT);
                put(x, 1, z, BLOCK.WHEAT);
            }
        }
    }
    put(0, 1, 0, BLOCK.WOOD);
    put(0, 2, 0, BLOCK.WOOD);
    put(0, 3, 0, BLOCK.LANTERN);
    put(w - 1, 1, d - 1, BLOCK.HAY_BALE);
    put(w - 1, 1, d - 2, BLOCK.BARREL);
    const [dx, dz] = mapDir(ox, oz, w, d, dir, canalX, d);
    return {
        blocks,
        footprint: rotatedFootprint(ox, oz, w, d, dir),
        door: { x: dx, y: oy + 1, z: dz },
        chimney: null,
        roofTopY: oy + 4
    };
}

export function buildHarborPier(ox, oz, dir, length, sampleGround) {
    const w = 3;
    const d = length;
    const deckY = SEA_LEVEL + 1;
    const blocks = [];
    const put = makePlacer(blocks, ox, deckY, oz, w, d, dir);

    for (let z = 0; z < d; z += 1) {
        for (let x = 0; x < w; x += 1) {
            put(x, 0, z, BLOCK.WOOD_PLANKS);
        }
        if (z % 4 === 0 || z === d - 1) {
            for (const px of [0, w - 1]) {
                const [wx, wz] = mapDir(ox, oz, w, d, dir, px, z);
                const ground = Math.max(SEA_LEVEL - 10, sampleGround(wx, wz));
                for (let y = ground; y <= deckY; y += 1) {
                    blocks.push({ dx: wx, dy: y, dz: wz, id: BLOCK.WOOD });
                }
            }
        }
    }

    put(0, 1, 2, BLOCK.BARREL);
    put(0, 1, 3, BLOCK.BARREL);
    put(w - 1, 1, Math.floor(d / 2), BLOCK.WOOD);
    put(w - 1, 2, Math.floor(d / 2), BLOCK.WOOD);
    put(w - 1, 3, Math.floor(d / 2), BLOCK.LANTERN);
    put(0, 1, d - 1, BLOCK.WOOD);
    put(0, 2, d - 1, BLOCK.WOOD);
    put(0, 3, d - 1, BLOCK.LANTERN);

    if (d >= 8) {
        const boatZ = d - 4;
        for (let bz = boatZ; bz <= boatZ + 3; bz += 1) {
            put(w + 1, -1, bz, BLOCK.WOOD_PLANKS);
            put(w + 2, -1, bz, BLOCK.WOOD_PLANKS);
            put(w + 3, -1, bz, BLOCK.WOOD_PLANKS);
            const edgeZ = bz === boatZ || bz === boatZ + 3;
            put(w + 1, 0, bz, BLOCK.WOOD);
            put(w + 3, 0, bz, BLOCK.WOOD);
            if (edgeZ) put(w + 2, 0, bz, BLOCK.WOOD);
        }
        put(w + 2, 1, boatZ, BLOCK.LANTERN);
    }

    const [tx, tz] = mapDir(ox, oz, w, d, dir, 1, d - 2);
    return {
        blocks,
        footprint: rotatedFootprint(ox, oz, w, d, dir),
        door: { x: tx, y: deckY + 1, z: tz },
        chimney: null,
        roofTopY: deckY + 4
    };
}

export function buildLanternPost(ox, oy, oz) {
    return [
        { dx: ox, dy: oy + 1, dz: oz, id: BLOCK.STONE_BRICK },
        { dx: ox, dy: oy + 2, dz: oz, id: BLOCK.WOOD },
        { dx: ox, dy: oy + 3, dz: oz, id: BLOCK.WOOD },
        { dx: ox, dy: oy + 4, dz: oz, id: BLOCK.WOOD_PLANKS },
        { dx: ox + 1, dy: oy + 4, dz: oz, id: BLOCK.WOOD_PLANKS },
        { dx: ox + 1, dy: oy + 3, dz: oz, id: BLOCK.LANTERN }
    ];
}
