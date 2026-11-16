import { BLOCK, CHUNK_HEIGHT, CHUNK_SIZE, SEA_LEVEL, chunkIndex } from "./voxel-blocks.js";
import { buildArchBridge, buildCottage, buildFarm, buildFountain, buildLamp, buildTower, buildWindmill } from "./voxel-village-blueprints.js";
import { sampleColumnMeta } from "./voxel-world-gen.js";

const STARTER_VX = 36;
const STARTER_VZ = 36;
const VILLAGE_RADIUS = 32;

function hash2(x, z, seed) {
    let h = (x * 374761393) ^ (z * 668265263) ^ seed;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (h ^ (h >>> 16)) >>> 0;
}

export function getVillageCenter(regionX, regionZ, seed) {
    if (regionX === 0 && regionZ === 0) {
        return { vx: STARTER_VX, vz: STARTER_VZ };
    }
    const h = hash2(regionX, regionZ, seed);
    const offsetX = 4 + (h % 16);
    const offsetZ = 4 + ((h >> 8) % 16);
    const vx = (regionX * 24 + offsetX) * CHUNK_SIZE;
    const vz = (regionZ * 24 + offsetZ) * CHUNK_SIZE;
    const meta = sampleColumnMeta(vx, vz, seed);
    if (meta.biome !== "grass" || meta.surfaceY <= SEA_LEVEL + 2) return null;
    return { vx, vz };
}

function getNearbyVillages(minX, minZ, maxX, maxZ, seed) {
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

function getVillagePlan(vx, vz, seed) {
    const meta = sampleColumnMeta(vx, vz, seed);
    const baseY = Math.max(SEA_LEVEL + 2, meta.surfaceY);
    const blocks = [];
    const clearZones = [];

    const fountain = buildFountain(vx, baseY, vz);
    blocks.push(...fountain);
    clearZones.push({ x0: vx - 3, z0: vz - 3, x1: vx + 3, z1: vz + 3, y0: baseY + 1, y1: baseY + 5 });

    const cottages = [
        { x: vx - 15, z: vz - 15, w: 6, d: 6, chimney: true },
        { x: vx + 9, z: vz - 15, w: 7, d: 6, chimney: true },
        { x: vx + 9, z: vz + 9, w: 6, d: 6, chimney: true }
    ];
    for (const c of cottages) {
        blocks.push(...buildCottage(c.x, baseY, c.z, c.w, c.d, c.chimney));
        clearZones.push({ x0: c.x, z0: c.z, x1: c.x + c.w - 1, z1: c.z + c.d - 1, y0: baseY + 1, y1: baseY + 7 });
    }

    blocks.push(...buildWindmill(vx - 16, baseY, vz + 9));
    clearZones.push({ x0: vx - 18, z0: vz + 7, x1: vx - 10, z1: vz + 15, y0: baseY + 1, y1: baseY + 14 });

    blocks.push(...buildTower(vx + 14, baseY, vz - 5));
    clearZones.push({ x0: vx + 14, z0: vz - 5, x1: vx + 18, z1: vz - 1, y0: baseY + 1, y1: baseY + 16 });

    blocks.push(...buildFarm(vx - 16, baseY, vz - 5, 6, 7));
    clearZones.push({ x0: vx - 16, z0: vz - 5, x1: vx - 10, z1: vz + 1, y0: baseY + 1, y1: baseY + 4 });

    blocks.push(...buildArchBridge(vx, baseY, vz - 25, 7));
    clearZones.push({ x0: vx - 2, z0: vz - 25, x1: vx + 2, z1: vz - 19, y0: baseY + 1, y1: baseY + 4 });

    for (let z = vz - 18; z <= vz + 18; z += 1) {
        if (z >= vz - 3 && z <= vz + 3) continue;
        for (let dx = -1; dx <= 1; dx += 1) {
            const blkId = dx === 0 ? BLOCK.COBBLESTONE : BLOCK.STONE_BRICK;
            blocks.push({ dx: vx + dx, dy: baseY, dz: z, id: blkId });
        }
    }
    for (let x = vx - 18; x <= vx + 18; x += 1) {
        if (x >= vx - 3 && x <= vx + 3) continue;
        for (let dz = -1; dz <= 1; dz += 1) {
            const blkId = dz === 0 ? BLOCK.COBBLESTONE : BLOCK.STONE_BRICK;
            blocks.push({ dx: x, dy: baseY, dz: vz + dz, id: blkId });
        }
    }

    const lamps = [
        [vx - 4, vz - 4], [vx + 4, vz - 4], [vx - 4, vz + 4], [vx + 4, vz + 4],
        [vx, vz - 18], [vx, vz + 18], [vx - 18, vz], [vx + 18, vz]
    ];
    for (const [lx, lz] of lamps) {
        blocks.push(...buildLamp(lx, baseY, lz));
    }

    return { vx, vz, baseY, blocks, clearZones };
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

        for (const zone of plan.clearZones) {
            const zx0 = Math.max(minX, zone.x0);
            const zx1 = Math.min(maxX, zone.x1);
            const zz0 = Math.max(minZ, zone.z0);
            const zz1 = Math.min(maxZ, zone.z1);
            for (let wx = zx0; wx <= zx1; wx += 1) {
                const lx = wx - minX;
                for (let wz = zz0; wz <= zz1; wz += 1) {
                    const lz = wz - minZ;
                    let groundY = 0;
                    for (let y = plan.baseY; y >= 1; y -= 1) {
                        const cur = blocks[chunkIndex(lx, y, lz)];
                        if (cur === BLOCK.STONE || cur === BLOCK.DIRT || cur === BLOCK.GRASS || cur === BLOCK.STONE_BRICK) {
                            groundY = y;
                            break;
                        }
                    }
                    if (groundY < plan.baseY) {
                        for (let y = groundY + 1; y < plan.baseY; y += 1) {
                            blocks[chunkIndex(lx, y, lz)] = BLOCK.STONE_BRICK;
                        }
                    }
                }
            }
        }
    }
}
