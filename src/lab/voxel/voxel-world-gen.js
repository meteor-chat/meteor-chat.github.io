import { BLOCK, CHUNK_HEIGHT, CHUNK_SIZE, SEA_LEVEL, chunkIndex } from "./voxel-blocks.js";
import { fbm2, fbm3, mulberry32, noise3, ridged2 } from "./voxel-noise.js";

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

function setBlockSafe(blocks, x, y, z, id) {
    if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT) return;
    blocks[chunkIndex(x, y, z)] = id;
}

function placeOakTree(blocks, tx, baseY, tz, rng) {
    const trunkH = 4 + Math.floor(rng() * 3);
    for (let dy = 0; dy < trunkH; dy += 1) {
        setBlockSafe(blocks, tx, baseY + dy, tz, BLOCK.WOOD);
    }
    const top = baseY + trunkH;
    for (let dy = -2; dy <= 1; dy += 1) {
        const radius = dy === 1 ? 1 : 2;
        for (let dx = -radius; dx <= radius; dx += 1) {
            for (let dz = -radius; dz <= radius; dz += 1) {
                if (Math.abs(dx) === 2 && Math.abs(dz) === 2 && (dy === 0 || rng() < 0.55)) continue;
                const ax = tx + dx;
                const ay = top + dy;
                const az = tz + dz;
                if (ay > 0 && ay < CHUNK_HEIGHT && blocks[chunkIndex(ax, ay, az)] === BLOCK.AIR) {
                    blocks[chunkIndex(ax, ay, az)] = BLOCK.LEAVES;
                }
            }
        }
    }
    setBlockSafe(blocks, tx, top + 1, tz, BLOCK.LEAVES);
}

function placeCactus(blocks, cx, baseY, cz, rng) {
    const h = 2 + Math.floor(rng() * 3);
    for (let dy = 0; dy < h; dy += 1) {
        setBlockSafe(blocks, cx, baseY + dy, cz, BLOCK.CACTUS);
    }
}

export function generateColumn(cx, cz, seed = 2026) {
    const blocks = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
    const light = new Uint8Array(blocks.length);
    const rng = mulberry32((cx * 73856093) ^ (cz * 19349663) ^ seed);
    const surfaces = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE);
    const biomes = [];

    for (let lz = 0; lz < CHUNK_SIZE; lz += 1) {
        for (let lx = 0; lx < CHUNK_SIZE; lx += 1) {
            const wx = cx * CHUNK_SIZE + lx;
            const wz = cz * CHUNK_SIZE + lz;
            const meta = sampleColumnMeta(wx, wz, seed);
            const surf = meta.surfaceY;
            surfaces[lx + (lz << 4)] = surf;
            biomes.push(meta.biome);

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

    for (let lz = 2; lz <= CHUNK_SIZE - 3; lz += 1) {
        for (let lx = 2; lx <= CHUNK_SIZE - 3; lx += 1) {
            const surf = surfaces[lx + (lz << 4)];
            const biome = biomes[lx + (lz << 4)];
            const topId = blocks[chunkIndex(lx, surf, lz)];
            if (surf <= SEA_LEVEL + 1 || surf > CHUNK_HEIGHT - 12) continue;
            const r = rng();
            if (biome === "grass" && topId === BLOCK.GRASS && r < 0.032) {
                placeOakTree(blocks, lx, surf + 1, lz, rng);
            } else if (biome === "desert" && topId === BLOCK.SAND && r < 0.016) {
                placeCactus(blocks, lx, surf + 1, lz, rng);
            }
        }
    }

    return { cx, cz, blocks, light };
}

export function getSpawnHeight(wx, wz, seed = 2026) {
    const meta = sampleColumnMeta(wx, wz, seed);
    return Math.max(SEA_LEVEL + 2, meta.surfaceY + 3);
}
