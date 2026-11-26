import { BLOCK, CHUNK_HEIGHT, CHUNK_SIZE, SEA_LEVEL, chunkIndex } from "./voxel-blocks.js";
import { buildVillageLayout, TOWN_RADIUS } from "./voxel-village-layout.js";
import { sampleColumnMeta } from "./voxel-world-gen.js";

const STARTER_VX = 36;
const STARTER_VZ = 36;
const VILLAGE_RADIUS = TOWN_RADIUS + 4;
const PLAN_CACHE_LIMIT = 24;
const planCache = new Map();

function hash2(x, z, seed) {
    let h = (x * 374761393) ^ (z * 668265263) ^ seed;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (h ^ (h >>> 16)) >>> 0;
}

function isFoundationStop(id) {
    return (
        id === BLOCK.STONE ||
        id === BLOCK.DIRT ||
        id === BLOCK.GRASS ||
        id === BLOCK.SAND ||
        id === BLOCK.SNOW ||
        id === BLOCK.COBBLESTONE ||
        id === BLOCK.MOSSY_COBBLE ||
        id === BLOCK.COAL_ORE ||
        id === BLOCK.GOLD_ORE ||
        id === BLOCK.BEDROCK
    );
}

function foundationMaterial(wx, y, wz, style) {
    if (style === "brick") return BLOCK.STONE_BRICK;
    const h = ((wx * 73856093) ^ (y * 19349663) ^ (wz * 83492791)) >>> 0;
    const r = h % 100;
    if (r < 22) return BLOCK.MOSSY_COBBLE;
    if (r > 86) return BLOCK.STONE_BRICK;
    return BLOCK.COBBLESTONE;
}

export function getVillageCenter(regionX, regionZ, seed) {
    if (regionX === 0 && regionZ === 0) {
        return { vx: STARTER_VX, vz: STARTER_VZ };
    }
    const h = hash2(regionX, regionZ, seed);
    const offsetX = 4 + ((h >>> 0) % 16);
    const offsetZ = 4 + ((h >>> 8) % 16);
    const vx = (regionX * 24 + offsetX) * CHUNK_SIZE;
    const vz = (regionZ * 24 + offsetZ) * CHUNK_SIZE;
    const meta = sampleColumnMeta(vx, vz, seed);
    if (meta.biome !== "grass" || meta.surfaceY <= SEA_LEVEL + 2) return null;
    return { vx, vz };
}

export function getNearbyVillages(minX, minZ, maxX, maxZ, seed) {
    const minRegX = Math.floor((minX - VILLAGE_RADIUS) / (24 * CHUNK_SIZE));
    const maxRegX = Math.floor((maxX + VILLAGE_RADIUS) / (24 * CHUNK_SIZE));
    const minRegZ = Math.floor((minZ - VILLAGE_RADIUS) / (24 * CHUNK_SIZE));
    const maxRegZ = Math.floor((maxZ + VILLAGE_RADIUS) / (24 * CHUNK_SIZE));
    const list = [];
    for (let rx = minRegX; rx <= maxRegX; rx += 1) {
        for (let rz = minRegZ; rz <= maxRegZ; rz += 1) {
            const v = getVillageCenter(rx, rz, seed);
            if (!v) continue;
            if (
                v.vx + VILLAGE_RADIUS >= minX &&
                v.vx - VILLAGE_RADIUS <= maxX &&
                v.vz + VILLAGE_RADIUS >= minZ &&
                v.vz - VILLAGE_RADIUS <= maxZ
            ) {
                list.push(v);
            }
        }
    }
    return list;
}

export function getVillagePlan(vx, vz, seed) {
    const key = `${seed}:${vx}:${vz}`;
    const cached = planCache.get(key);
    if (cached) return cached;

    const plan = buildVillageLayout(vx, vz, seed, sampleColumnMeta);
    if (planCache.size >= PLAN_CACHE_LIMIT) {
        const firstKey = planCache.keys().next().value;
        planCache.delete(firstKey);
    }
    planCache.set(key, plan);
    return plan;
}

export function getVillageMeta(vx, vz, seed) {
    const plan = getVillagePlan(vx, vz, seed);
    return {
        vx: plan.vx,
        vz: plan.vz,
        baseY: plan.baseY,
        radius: plan.radius,
        pois: plan.pois,
        chimneys: plan.chimneys,
        buildings: plan.buildings
    };
}

export function isVillageArea(wx, wz, seed) {
    const villages = getNearbyVillages(wx, wz, wx, wz, seed);
    for (const v of villages) {
        if (Math.hypot(wx - v.vx, wz - v.vz) <= VILLAGE_RADIUS) return true;
    }
    return false;
}

export function isPlansOccupied(plans, wx, wz, pad = 1) {
    for (let i = 0; i < plans.length; i += 1) {
        const plan = plans[i];
        const gx0 = wx - pad - plan.gridOriginX;
        const gz0 = wz - pad - plan.gridOriginZ;
        const gx1 = wx + pad - plan.gridOriginX;
        const gz1 = wz + pad - plan.gridOriginZ;
        if (gx1 < 0 || gz1 < 0 || gx0 >= plan.gridSize || gz0 >= plan.gridSize) continue;
        const xStart = gx0 > 0 ? gx0 : 0;
        const zStart = gz0 > 0 ? gz0 : 0;
        const xEnd = gx1 < plan.gridSize - 1 ? gx1 : plan.gridSize - 1;
        const zEnd = gz1 < plan.gridSize - 1 ? gz1 : plan.gridSize - 1;
        for (let gz = zStart; gz <= zEnd; gz += 1) {
            const row = gz * plan.gridSize;
            for (let gx = xStart; gx <= xEnd; gx += 1) {
                const cell = plan.occ[gx + row];
                if (cell === 1 || cell === 2) return true;
            }
        }
    }
    return false;
}

export function isVillageOccupied(wx, wz, seed, pad = 1) {
    const villages = getNearbyVillages(wx - pad, wz - pad, wx + pad, wz + pad, seed);
    if (villages.length === 0) return false;
    const plans = villages.map((v) => getVillagePlan(v.vx, v.vz, seed));
    return isPlansOccupied(plans, wx, wz, pad);
}

export function applyVillageToColumn(blocks, cx, cz, seed) {
    const minX = cx * CHUNK_SIZE;
    const maxX = minX + CHUNK_SIZE - 1;
    const minZ = cz * CHUNK_SIZE;
    const maxZ = minZ + CHUNK_SIZE - 1;

    const villages = getNearbyVillages(minX, minZ, maxX, maxZ, seed);
    if (villages.length === 0) return;

    const bucketKey = `${cx},${cz}`;
    for (const v of villages) {
        const plan = getVillagePlan(v.vx, v.vz, seed);
        const bucket = plan.chunkBuckets.get(bucketKey);
        if (!bucket) continue;

        for (const zone of bucket.foundations) {
            const startY = Math.max(1, zone.floorY - 1);
            for (let wx = zone.x0; wx <= zone.x1; wx += 1) {
                const lx = wx - minX;
                for (let wz = zone.z0; wz <= zone.z1; wz += 1) {
                    const lz = wz - minZ;
                    let groundY = 1;
                    for (let y = startY; y >= 1; y -= 1) {
                        if (isFoundationStop(blocks[chunkIndex(lx, y, lz)])) {
                            groundY = y;
                            break;
                        }
                    }
                    if (groundY < zone.floorY - 1) {
                        for (let y = groundY + 1; y < zone.floorY; y += 1) {
                            blocks[chunkIndex(lx, y, lz)] = foundationMaterial(wx, y, wz, zone.style);
                        }
                    }
                }
            }
        }

        for (const zone of bucket.clears) {
            const y0 = Math.max(1, zone.y0);
            const y1 = Math.min(CHUNK_HEIGHT - 1, zone.y1);
            for (let wx = zone.x0; wx <= zone.x1; wx += 1) {
                const lx = wx - minX;
                for (let wz = zone.z0; wz <= zone.z1; wz += 1) {
                    const lz = wz - minZ;
                    for (let y = y0; y <= y1; y += 1) {
                        blocks[chunkIndex(lx, y, lz)] = BLOCK.AIR;
                    }
                }
            }
        }

        for (const blk of bucket.blocks) {
            const y = blk.dy;
            if (y >= 0 && y < CHUNK_HEIGHT) {
                blocks[chunkIndex(blk.dx - minX, y, blk.dz - minZ)] = blk.id;
            }
        }
    }
}
