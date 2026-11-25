import { BLOCK, CHUNK_HEIGHT, CHUNK_SIZE, SEA_LEVEL, chunkIndex } from "./voxel-blocks.js";
import { buildArchBridge, buildCottage, buildFarm, buildFountain, buildLamp, buildTower, buildWindmill } from "./voxel-village-blueprints.js";
import { sampleColumnMeta } from "./voxel-world-gen.js";

const STARTER_VX = 36;
const STARTER_VZ = 36;
const VILLAGE_RADIUS = 32;
const PLAN_CACHE_LIMIT = 32;
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
        id === BLOCK.COAL_ORE ||
        id === BLOCK.GOLD_ORE ||
        id === BLOCK.BEDROCK
    );
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
            if (v.vx + VILLAGE_RADIUS >= minX && v.vx - VILLAGE_RADIUS <= maxX &&
                v.vz + VILLAGE_RADIUS >= minZ && v.vz - VILLAGE_RADIUS <= maxZ) {
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

    const meta = sampleColumnMeta(vx, vz, seed);
    const baseY = Math.max(SEA_LEVEL + 2, meta.surfaceY);
    const blocks = [];
    const clearZones = [];
    const foundationZones = [];

    const fountain = buildFountain(vx, baseY, vz);
    blocks.push(...fountain);
    clearZones.push({ x0: vx - 3, z0: vz - 3, x1: vx + 3, z1: vz + 3, y0: baseY + 1, y1: baseY + 6 });
    foundationZones.push({ x0: vx - 3, z0: vz - 3, x1: vx + 3, z1: vz + 3, floorY: baseY - 1 });

    const cottages = [
        { x: vx - 15, z: vz - 15, w: 6, d: 6, chimney: true, door: "south" },
        { x: vx + 9, z: vz - 15, w: 7, d: 6, chimney: true, door: "south" },
        { x: vx + 9, z: vz + 9, w: 6, d: 6, chimney: true, door: "north" }
    ];
    for (const c of cottages) {
        blocks.push(...buildCottage(c.x, baseY, c.z, c.w, c.d, c.chimney, c.door));
        clearZones.push({ x0: c.x - 1, z0: c.z - 1, x1: c.x + c.w, z1: c.z + c.d, y0: baseY + 1, y1: baseY + 9 });
        foundationZones.push({ x0: c.x, z0: c.z, x1: c.x + c.w - 1, z1: c.z + c.d - 1, floorY: baseY });
    }

    blocks.push(...buildWindmill(vx - 16, baseY, vz + 9));
    clearZones.push({ x0: vx - 18, z0: vz + 7, x1: vx - 10, z1: vz + 15, y0: baseY + 1, y1: baseY + 15 });
    foundationZones.push({ x0: vx - 18, z0: vz + 9, x1: vx - 12, z1: vz + 13, floorY: baseY });

    blocks.push(...buildTower(vx + 13, baseY, vz - 8));
    clearZones.push({ x0: vx + 11, z0: vz - 9, x1: vx + 19, z1: vz - 2, y0: baseY + 1, y1: baseY + 17 });
    foundationZones.push({ x0: vx + 13, z0: vz - 8, x1: vx + 17, z1: vz - 4, floorY: baseY });

    blocks.push(...buildFarm(vx - 16, baseY, vz - 9, 6, 6));
    clearZones.push({ x0: vx - 16, z0: vz - 9, x1: vx - 9, z1: vz - 3, y0: baseY + 1, y1: baseY + 5 });
    foundationZones.push({ x0: vx - 16, z0: vz - 9, x1: vx - 10, z1: vz - 4, floorY: baseY - 1 });

    blocks.push(...buildArchBridge(vx, baseY, vz - 25, 7));
    clearZones.push({ x0: vx - 2, z0: vz - 25, x1: vx + 2, z1: vz - 19, y0: baseY + 1, y1: baseY + 5 });

    for (let z = vz - 18; z <= vz + 18; z += 1) {
        if (z >= vz - 3 && z <= vz + 3) continue;
        for (let dx = -1; dx <= 1; dx += 1) {
            const blkId = dx === 0 ? BLOCK.COBBLESTONE : BLOCK.STONE_BRICK;
            blocks.push({ dx: vx + dx, dy: baseY, dz: z, id: blkId });
        }
    }
    clearZones.push({ x0: vx - 1, z0: vz - 18, x1: vx + 1, z1: vz + 18, y0: baseY + 1, y1: baseY + 5 });
    foundationZones.push({ x0: vx - 1, z0: vz - 18, x1: vx + 1, z1: vz + 18, floorY: baseY });

    for (let x = vx - 18; x <= vx + 18; x += 1) {
        if (x >= vx - 3 && x <= vx + 3) continue;
        for (let dz = -1; dz <= 1; dz += 1) {
            const blkId = dz === 0 ? BLOCK.COBBLESTONE : BLOCK.STONE_BRICK;
            blocks.push({ dx: x, dy: baseY, dz: vz + dz, id: blkId });
        }
    }
    clearZones.push({ x0: vx - 18, z0: vz - 1, x1: vx + 18, z1: vz + 1, y0: baseY + 1, y1: baseY + 5 });
    foundationZones.push({ x0: vx - 18, z0: vz - 1, x1: vx + 18, z1: vz + 1, floorY: baseY });

    const lamps = [
        [vx - 4, vz - 4], [vx + 4, vz - 4], [vx - 4, vz + 4], [vx + 4, vz + 4],
        [vx - 2, vz - 17], [vx + 2, vz + 17], [vx - 17, vz - 2], [vx + 17, vz + 2]
    ];
    for (const [lx, lz] of lamps) {
        blocks.push({ dx: lx, dy: baseY, dz: lz, id: BLOCK.STONE_BRICK });
        blocks.push(...buildLamp(lx, baseY, lz));
        clearZones.push({ x0: lx, z0: lz, x1: lx, z1: lz, y0: baseY + 1, y1: baseY + 5 });
        foundationZones.push({ x0: lx, z0: lz, x1: lx, z1: lz, floorY: baseY });
    }

    const plan = { vx, vz, baseY, blocks, clearZones, foundationZones };
    if (planCache.size >= PLAN_CACHE_LIMIT) {
        const firstKey = planCache.keys().next().value;
        planCache.delete(firstKey);
    }
    planCache.set(key, plan);
    return plan;
}

export function isVillageArea(wx, wz, seed) {
    const villages = getNearbyVillages(wx, wz, wx, wz, seed);
    for (const v of villages) {
        if (Math.hypot(wx - v.vx, wz - v.vz) <= VILLAGE_RADIUS) return true;
    }
    return false;
}

export function applyVillageToColumn(blocks, cx, cz, seed) {
    const minX = cx * CHUNK_SIZE;
    const maxX = minX + CHUNK_SIZE - 1;
    const minZ = cz * CHUNK_SIZE;
    const maxZ = minZ + CHUNK_SIZE - 1;

    const villages = getNearbyVillages(minX, minZ, maxX, maxZ, seed);
    if (villages.length === 0) return;

    for (const v of villages) {
        const plan = getVillagePlan(v.vx, v.vz, seed);

        for (const zone of plan.foundationZones) {
            const zx0 = Math.max(minX, zone.x0);
            const zx1 = Math.min(maxX, zone.x1);
            const zz0 = Math.max(minZ, zone.z0);
            const zz1 = Math.min(maxZ, zone.z1);
            const startY = Math.max(1, zone.floorY - 1);
            for (let wx = zx0; wx <= zx1; wx += 1) {
                const lx = wx - minX;
                for (let wz = zz0; wz <= zz1; wz += 1) {
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
                            blocks[chunkIndex(lx, y, lz)] = BLOCK.STONE_BRICK;
                        }
                    }
                }
            }
        }

        for (const zone of plan.clearZones) {
            const zx0 = Math.max(minX, zone.x0);
            const zx1 = Math.min(maxX, zone.x1);
            const zz0 = Math.max(minZ, zone.z0);
            const zz1 = Math.min(maxZ, zone.z1);
            for (let wx = zx0; wx <= zx1; wx += 1) {
                const lx = wx - minX;
                for (let wz = zz0; wz <= zz1; wz += 1) {
                    const lz = wz - minZ;
                    for (let y = zone.y0; y <= zone.y1; y += 1) {
                        if (y >= 0 && y < CHUNK_HEIGHT) {
                            blocks[chunkIndex(lx, y, lz)] = BLOCK.AIR;
                        }
                    }
                }
            }
        }

        for (const blk of plan.blocks) {
            if (blk.dx >= minX && blk.dx <= maxX && blk.dz >= minZ && blk.dz <= maxZ) {
                const lx = blk.dx - minX;
                const lz = blk.dz - minZ;
                const y = blk.dy;
                if (y >= 0 && y < CHUNK_HEIGHT) {
                    blocks[chunkIndex(lx, y, lz)] = blk.id;
                }
            }
        }
    }
}
