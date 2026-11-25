import {
    BLOCK,
    CHUNK_HEIGHT,
    CHUNK_SIZE,
    SEA_LEVEL,
    chunkIndex,
    isFluid,
    isSolid
} from "./voxel-blocks.js";
import { fbm2, fbm3, hash2, noise3, ridged2 } from "./voxel-noise.js";
import { applyVillageToColumn, getNearbyVillages } from "./voxel-village-gen.js";

const VILLAGE_CLEAR_PAD = 32;

const SAFE_GROUND_BLOCKS = new Set([
    BLOCK.GRASS,
    BLOCK.DIRT,
    BLOCK.SAND,
    BLOCK.SNOW,
    BLOCK.STONE,
    BLOCK.COBBLESTONE,
    BLOCK.STONE_BRICK,
    BLOCK.WOOD_PLANKS
]);

export function sampleColumnMeta(wx, wz, seed) {
    const warpX = fbm2(wx * 0.008, wz * 0.008, 2, seed + 11) * 14;
    const warpZ = fbm2(wx * 0.008 + 71.3, wz * 0.008 - 31.7, 2, seed + 23) * 14;
    const x = wx + warpX;
    const z = wz + warpZ;
    const cont = fbm2(x * 0.011, z * 0.011, 4, seed + 101);
    const ridge = ridged2(x * 0.014, z * 0.014, 3, seed + 211);
    const temp = fbm2(wx * 0.006, wz * 0.006, 2, seed + 307);
    const humid = fbm2(wx * 0.006 + 50, wz * 0.006 - 20, 2, seed + 409);

    let height = 34 + cont * 22 + Math.pow(ridge, 1.55) * 32;
    if (cont < 0.38) {
        height -= (0.38 - cont) * 44;
    }
    const surfaceY = Math.max(8, Math.min(CHUNK_HEIGHT - 18, Math.round(height)));

    let biome = "grass";
    if (surfaceY > 68 || temp < 0.34) biome = "snow";
    else if (temp > 0.63 && humid < 0.48) biome = "desert";
    return { surfaceY, biome, temp, humid };
}

export function sampleBiomeTint(wx, wz, seed = 2026) {
    const temp = fbm2(wx * 0.006, wz * 0.006, 2, seed + 307);
    const humid = fbm2(wx * 0.006 + 50, wz * 0.006 - 20, 2, seed + 409);
    const warmth = Math.max(0, Math.min(15, Math.round(temp * 15)));
    const moisture = Math.max(0, Math.min(15, Math.round(humid * 15)));
    return (warmth & 15) | ((moisture & 15) << 4);
}

export function sampleColumnTints(cx, cz, seed = 2026) {
    const tints = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE);
    const baseX = cx * CHUNK_SIZE;
    const baseZ = cz * CHUNK_SIZE;
    for (let lz = 0; lz < CHUNK_SIZE; lz += 1) {
        const wz = baseZ + lz;
        for (let lx = 0; lx < CHUNK_SIZE; lx += 1) {
            tints[lx + (lz << 4)] = sampleBiomeTint(baseX + lx, wz, seed);
        }
    }
    return tints;
}

function setBlockSafe(blocks, x, y, z, id) {
    if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT) return;
    blocks[chunkIndex(x, y, z)] = id;
}

function setLeafSafe(blocks, x, y, z) {
    if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE || y <= 0 || y >= CHUNK_HEIGHT) return;
    const idx = chunkIndex(x, y, z);
    if (blocks[idx] === BLOCK.AIR) blocks[idx] = BLOCK.LEAVES;
}

function isTreeRoot(wx, wz, seed) {
    const h = hash2(wx, wz, seed + 1777);
    if (h >= 0.026) return false;
    for (let dz = -2; dz <= 2; dz += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
            if (dx === 0 && dz === 0) continue;
            const nh = hash2(wx + dx, wz + dz, seed + 1777);
            if (nh < h || (nh === h && (dx < 0 || (dx === 0 && dz < 0)))) return false;
        }
    }
    return true;
}

function placeOakTree(blocks, tx, baseY, tz, wx, wz, seed) {
    const trunkH = 4 + Math.floor(hash2(wx, wz, seed + 1889) * 3);
    for (let dy = 0; dy < trunkH; dy += 1) {
        setBlockSafe(blocks, tx, baseY + dy, tz, BLOCK.WOOD);
    }
    const top = baseY + trunkH;
    for (let dy = -2; dy <= 1; dy += 1) {
        const radius = dy === 1 ? 1 : 2;
        for (let dx = -radius; dx <= radius; dx += 1) {
            for (let dz = -radius; dz <= radius; dz += 1) {
                if (Math.abs(dx) === 2 && Math.abs(dz) === 2) {
                    const cornerHash = hash2(wx + dx * 3, wz + dz * 5 + dy * 7, seed + 1993);
                    if (dy === 0 || cornerHash < 0.55) continue;
                }
                setLeafSafe(blocks, tx + dx, top + dy, tz + dz);
            }
        }
    }
    setLeafSafe(blocks, tx, top + 1, tz);
}

function placeCactus(blocks, lx, baseY, lz, wx, wz, seed) {
    const h = 2 + Math.floor(hash2(wx, wz, seed + 2953) * 3);
    for (let dy = 0; dy < h; dy += 1) {
        setBlockSafe(blocks, lx, baseY + dy, lz, BLOCK.CACTUS);
    }
}

function isInVillageList(villages, wx, wz) {
    for (const v of villages) {
        if (Math.abs(wx - v.vx) <= VILLAGE_CLEAR_PAD && Math.abs(wz - v.vz) <= VILLAGE_CLEAR_PAD) {
            return true;
        }
    }
    return false;
}

export function generateColumn(cx, cz, seed = 2026) {
    const blocks = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
    const light = new Uint8Array(blocks.length);
    const surfaces = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE);
    const biomes = new Array(CHUNK_SIZE * CHUNK_SIZE);
    const baseX = cx * CHUNK_SIZE;
    const baseZ = cz * CHUNK_SIZE;

    for (let lz = 0; lz < CHUNK_SIZE; lz += 1) {
        const wz = baseZ + lz;
        for (let lx = 0; lx < CHUNK_SIZE; lx += 1) {
            const wx = baseX + lx;
            const meta = sampleColumnMeta(wx, wz, seed);
            const surf = meta.surfaceY;
            const colOff = lx + (lz << 4);
            surfaces[colOff] = surf;
            biomes[colOff] = meta.biome;

            for (let y = 0; y <= surf; y += 1) {
                let id = BLOCK.STONE;
                if (y <= 1) {
                    id = BLOCK.BEDROCK;
                } else if (y === surf) {
                    if (surf <= SEA_LEVEL + 1 && meta.biome !== "snow") id = BLOCK.SAND;
                    else if (meta.biome === "desert") id = BLOCK.SAND;
                    else if (meta.biome === "snow") id = BLOCK.SNOW;
                    else id = BLOCK.GRASS;
                } else if (y >= surf - 3) {
                    if (meta.biome === "desert" || surf <= SEA_LEVEL + 1) id = BLOCK.SAND;
                    else id = BLOCK.DIRT;
                } else {
                    const ore = noise3(wx * 0.16, y * 0.16, wz * 0.16, seed + 613);
                    if (y < 26 && ore > 0.78) id = BLOCK.GOLD_ORE;
                    else if (ore < 0.22) id = BLOCK.COAL_ORE;
                }

                if (y > 2 && y < surf - 2) {
                    const caveA = fbm3(wx * 0.045, y * 0.055, wz * 0.045, 2, seed + 881);
                    const caveB = noise3(wx * 0.07 + 30, y * 0.07, wz * 0.07 - 30, seed + 997);
                    const depthBias = y < 18 ? 0.04 : 0;
                    if (caveA > 0.67 - depthBias || Math.abs(caveB - 0.5) < 0.045) {
                        id = y <= 10 ? BLOCK.LAVA : BLOCK.AIR;
                    }
                } else if (y >= surf - 2 && y <= surf && surf > SEA_LEVEL + 4) {
                    const caveMouth = fbm3(wx * 0.045, y * 0.055, wz * 0.045, 2, seed + 881);
                    if (caveMouth > 0.73) {
                        id = BLOCK.AIR;
                    }
                }
                blocks[chunkIndex(lx, y, lz)] = id;
            }

            if (surf < SEA_LEVEL) {
                for (let y = surf + 1; y <= SEA_LEVEL; y += 1) {
                    blocks[chunkIndex(lx, y, lz)] = BLOCK.WATER;
                }
            }
        }
    }

    applyVillageToColumn(blocks, cx, cz, seed);

    const villages = getNearbyVillages(baseX - 4, baseZ - 4, baseX + CHUNK_SIZE + 3, baseZ + CHUNK_SIZE + 3, seed);

    for (let lz = -2; lz <= CHUNK_SIZE + 1; lz += 1) {
        const wz = baseZ + lz;
        for (let lx = -2; lx <= CHUNK_SIZE + 1; lx += 1) {
            const wx = baseX + lx;
            if (!isTreeRoot(wx, wz, seed)) continue;
            if (isInVillageList(villages, wx, wz)) continue;
            const inChunk = lx >= 0 && lx < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE;
            let surf;
            let biome;
            if (inChunk) {
                const off = lx + (lz << 4);
                surf = surfaces[off];
                biome = biomes[off];
                if (blocks[chunkIndex(lx, surf, lz)] !== BLOCK.GRASS) continue;
            } else {
                const meta = sampleColumnMeta(wx, wz, seed);
                surf = meta.surfaceY;
                biome = meta.biome;
            }
            if (biome !== "grass" || surf <= SEA_LEVEL + 1 || surf > CHUNK_HEIGHT - 12) continue;
            placeOakTree(blocks, lx, surf + 1, lz, wx, wz, seed);
        }
    }

    for (let lz = 0; lz < CHUNK_SIZE; lz += 1) {
        const wz = baseZ + lz;
        for (let lx = 0; lx < CHUNK_SIZE; lx += 1) {
            const wx = baseX + lx;
            if (isInVillageList(villages, wx, wz)) continue;
            const off = lx + (lz << 4);
            const surf = surfaces[off];
            const biome = biomes[off];
            if (surf <= SEA_LEVEL + 1 || surf > CHUNK_HEIGHT - 10) continue;
            const topId = blocks[chunkIndex(lx, surf, lz)];
            if (blocks[chunkIndex(lx, surf + 1, lz)] !== BLOCK.AIR) continue;
            if (biome === "grass" && topId === BLOCK.GRASS) {
                const fr = hash2(wx, wz, seed + 2503);
                if (fr < 0.14) blocks[chunkIndex(lx, surf + 1, lz)] = BLOCK.TALL_GRASS;
                else if (fr < 0.155) blocks[chunkIndex(lx, surf + 1, lz)] = BLOCK.FLOWER_RED;
                else if (fr < 0.17) blocks[chunkIndex(lx, surf + 1, lz)] = BLOCK.FLOWER_YELLOW;
            } else if (biome === "desert" && topId === BLOCK.SAND) {
                const cr = hash2(wx, wz, seed + 2909);
                if (cr < 0.015) {
                    let clash = false;
                    for (let dz = -1; dz <= 1 && !clash; dz += 1) {
                        for (let dx = -1; dx <= 1; dx += 1) {
                            if (dx === 0 && dz === 0) continue;
                            if (hash2(wx + dx, wz + dz, seed + 2909) < cr) {
                                clash = true;
                                break;
                            }
                        }
                    }
                    if (!clash) placeCactus(blocks, lx, surf + 1, lz, wx, wz, seed);
                }
            }
        }
    }

    return { cx, cz, blocks, light };
}

export function getSpawnHeight(wx, wz, seed = 2026) {
    const meta = sampleColumnMeta(wx, wz, seed);
    return Math.max(SEA_LEVEL + 2, meta.surfaceY + 3);
}

function isSafeSpawnColumn(world, bx, bz) {
    for (let y = CHUNK_HEIGHT - 5; y >= SEA_LEVEL; y -= 1) {
        const g = world.getBlock(bx, y, bz);
        if (g === BLOCK.AIR || g === BLOCK.LEAVES || g === BLOCK.WOOD) continue;
        if (!SAFE_GROUND_BLOCKS.has(g)) return -1;
        const a1 = world.getBlock(bx, y + 1, bz);
        const a2 = world.getBlock(bx, y + 2, bz);
        if (isSolid(a1) || isFluid(a1) || isSolid(a2) || isFluid(a2)) return -1;
        if (
            world.getBlock(bx + 1, y + 1, bz) === BLOCK.LAVA ||
            world.getBlock(bx - 1, y + 1, bz) === BLOCK.LAVA ||
            world.getBlock(bx, y + 1, bz + 1) === BLOCK.LAVA ||
            world.getBlock(bx, y + 1, bz - 1) === BLOCK.LAVA
        ) {
            return -1;
        }
        return y;
    }
    return -1;
}

export function findSafeSpawn(world, wx, wz, seed = 2026) {
    const sx = Math.floor(wx);
    const sz = Math.floor(wz);
    for (let radius = 0; radius <= 12; radius += 1) {
        for (let dz = -radius; dz <= radius; dz += 1) {
            for (let dx = -radius; dx <= radius; dx += 1) {
                if (radius > 0 && Math.abs(dx) !== radius && Math.abs(dz) !== radius) continue;
                const bx = sx + dx;
                const bz = sz + dz;
                const gy = isSafeSpawnColumn(world, bx, bz);
                if (gy >= 0) {
                    return [bx + 0.5, gy + 1.02, bz + 0.5];
                }
            }
        }
    }
    return [wx, getSpawnHeight(wx, wz, seed), wz];
}
