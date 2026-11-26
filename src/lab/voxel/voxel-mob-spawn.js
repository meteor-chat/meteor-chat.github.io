import { BLOCK, CHUNK_HEIGHT, CHUNK_SIZE, SEA_LEVEL, isCrossPlant, isSolid } from "./voxel-blocks.js";
import { VILLAGER_PROFESSIONS } from "./voxel-mob-villager-ai.js";
import { getNearbyVillages, getVillageMeta } from "./voxel-village-gen.js";
import { sampleColumnMeta } from "./voxel-world-gen.js";

export const SPAWN_MIN_DIST = 14;
export const SPAWN_MAX_DIST = 34;
export const DESPAWN_DIST = 56;
export const SPAWN_INTERVAL = 2;
export const SPAWN_CAP = 6;
export const MIN_CAT_SPACING = 3;
export const VIEW_CONE_COS = 0.57;

export const BIOME_SURFACE = Object.freeze({
    grass: BLOCK.GRASS,
    snow: BLOCK.SNOW,
    desert: BLOCK.SAND
});

export const BIOME_VARIANTS = Object.freeze({
    grass: [["orange", 0.45], ["calico", 0.35], ["black", 0.2]],
    snow: [["white", 1]],
    desert: [["sand", 1]]
});

const VILLAGE_GROUND = new Set([
    BLOCK.GRASS,
    BLOCK.SAND,
    BLOCK.COBBLESTONE,
    BLOCK.MOSSY_COBBLE,
    BLOCK.STONE_BRICK,
    BLOCK.WOOD_PLANKS
]);

export function pickVariant(biome, roll) {
    const table = BIOME_VARIANTS[biome];
    if (!table) return null;
    let acc = 0;
    for (const [variant, weight] of table) {
        acc += weight;
        if (roll < acc) return variant;
    }
    return table[table.length - 1][0];
}

function isPassable(id) {
    return id === BLOCK.AIR || isCrossPlant(id);
}

export function findSpawnSurface(x, z, ctx, allowVillageGround = false) {
    const wx = Math.floor(x);
    const wz = Math.floor(z);
    if (!ctx.isLoaded(wx, wz)) return null;
    const biome = sampleColumnMeta(wx, wz, ctx.seed).biome;
    let y = CHUNK_HEIGHT - 3;
    while (y > SEA_LEVEL + 1) {
        const id = ctx.getBlock(wx, y, wz);
        if (id === BLOCK.AIR || id === BLOCK.LEAVES || isCrossPlant(id)) {
            y -= 1;
            continue;
        }
        const matchesBiome = id === BIOME_SURFACE[biome];
        const matchesVillage = allowVillageGround && VILLAGE_GROUND.has(id);
        if ((matchesBiome || matchesVillage) && isPassable(ctx.getBlock(wx, y + 1, wz)) && isPassable(ctx.getBlock(wx, y + 2, wz))) {
            return { y: y + 1, biome };
        }
        return null;
    }
    return null;
}

function inViewCone(playerPos, yaw, x, z, fovRad) {
    const dx = x - playerPos[0];
    const dz = z - playerPos[2];
    const len = Math.hypot(dx, dz);
    if (len === 0) return true;
    const coneCos = fovRad ? Math.cos(Math.min(1.3, fovRad * 0.65)) : VIEW_CONE_COS;
    return (dx * Math.sin(yaw) - dz * Math.cos(yaw)) / len > coneCos;
}

export function createCatSpawner({ mobs, world, seed, rng }) {
    const isLoaded = (wx, wz) => Boolean(world.getColumn(Math.floor(wx / CHUNK_SIZE), Math.floor(wz / CHUNK_SIZE)));
    const ctx = { seed, getBlock: world.getBlock, isLoaded };
    let timer = SPAWN_INTERVAL * 0.5;

    const crowded = (x, z) => mobs.cats.some((cat) => Math.hypot(cat.pos[0] - x, cat.pos[2] - z) < MIN_CAT_SPACING);

    const trySpawn = (playerPos, yaw, fovRad) => {
        const angle = rng() * Math.PI * 2;
        const dist = SPAWN_MIN_DIST + rng() * (SPAWN_MAX_DIST - SPAWN_MIN_DIST);
        const x = Math.floor(playerPos[0] + Math.cos(angle) * dist) + 0.5;
        const z = Math.floor(playerPos[2] + Math.sin(angle) * dist) + 0.5;
        if (yaw !== undefined && inViewCone(playerPos, yaw, x, z, fovRad)) return null;
        if (crowded(x, z)) return null;
        const site = findSpawnSurface(x, z, ctx, true);
        if (!site) return null;
        return mobs.spawnCat(x, site.y, z, pickVariant(site.biome, rng()));
    };

    const despawnFar = (playerPos) => {
        for (const cat of [...mobs.cats]) {
            const far = Math.hypot(cat.pos[0] - playerPos[0], cat.pos[2] - playerPos[2]) > DESPAWN_DIST;
            if (far || !isLoaded(cat.pos[0], cat.pos[2]) || cat.pos[1] < 2) mobs.removeCat(cat);
        }
    };

    const update = (dt, playerPos, yaw, fovRad) => {
        despawnFar(playerPos);
        timer -= dt;
        if (timer > 0) return;
        timer = SPAWN_INTERVAL;
        if (mobs.cats.length < SPAWN_CAP) trySpawn(playerPos, yaw, fovRad);
    };

    return { update, trySpawn, isLoaded };
}

export const MIN_CHICKEN_SPACING = 3;
export const SPAWN_CHICKEN_CAP = 6;

export function createChickenSpawner({ mobs, world, seed, rng }) {
    const isLoaded = (wx, wz) => Boolean(world.getColumn(Math.floor(wx / CHUNK_SIZE), Math.floor(wz / CHUNK_SIZE)));
    const ctx = { seed, getBlock: world.getBlock, isLoaded };
    let timer = SPAWN_INTERVAL * 0.75;

    const crowded = (x, z) => mobs.chickens.some((c) => Math.hypot(c.pos[0] - x, c.pos[2] - z) < MIN_CHICKEN_SPACING);

    const trySpawn = (playerPos, yaw, fovRad) => {
        const angle = rng() * Math.PI * 2;
        const dist = SPAWN_MIN_DIST + rng() * (SPAWN_MAX_DIST - SPAWN_MIN_DIST);
        const x = Math.floor(playerPos[0] + Math.cos(angle) * dist) + 0.5;
        const z = Math.floor(playerPos[2] + Math.sin(angle) * dist) + 0.5;
        if (yaw !== undefined && inViewCone(playerPos, yaw, x, z, fovRad)) return null;
        if (crowded(x, z)) return null;
        const site = findSpawnSurface(x, z, ctx, false);
        if (!site || site.biome !== "grass") return null;
        return mobs.spawnChicken(x, site.y, z, "white");
    };

    const despawnFar = (playerPos) => {
        for (const chicken of [...mobs.chickens]) {
            const far = Math.hypot(chicken.pos[0] - playerPos[0], chicken.pos[2] - playerPos[2]) > DESPAWN_DIST;
            if (far || !isLoaded(chicken.pos[0], chicken.pos[2]) || chicken.pos[1] < 2) mobs.removeChicken(chicken);
        }
    };

    const update = (dt, playerPos, yaw, fovRad) => {
        despawnFar(playerPos);
        timer -= dt;
        if (timer > 0) return;
        timer = SPAWN_INTERVAL;
        if (mobs.chickens.length < SPAWN_CHICKEN_CAP) trySpawn(playerPos, yaw, fovRad);
    };

    return { update, trySpawn, isLoaded };
}

export const SPAWN_VILLAGER_CAP = 12;
const VILLAGER_DESPAWN_DIST = 98;

function findStandableY(world, wx, wz, headroom = 2) {
    for (let y = CHUNK_HEIGHT - 6; y > SEA_LEVEL; y -= 1) {
        const g = world.getBlock(wx, y, wz);
        if (!isSolid(g) || g === BLOCK.LEAVES) continue;
        if (!VILLAGE_GROUND.has(g)) return -1;
        for (let h = 1; h <= headroom; h += 1) {
            if (!isPassable(world.getBlock(wx, y + h, wz))) return -1;
        }
        return y + 1;
    }
    return -1;
}

export function createVillagerSpawner({ mobs, world, seed, rng }) {
    const isLoaded = (wx, wz) => Boolean(world.getColumn(Math.floor(wx / CHUNK_SIZE), Math.floor(wz / CHUNK_SIZE)));
    let timer = 0.5;
    let profCursor = 0;

    const findVillageSpot = (meta) => {
        const pool = meta.pois && meta.pois.length > 0 ? meta.pois : [];
        const start = Math.floor(rng() * Math.max(1, pool.length));
        for (let i = 0; i < Math.min(pool.length, 18); i += 1) {
            const poi = pool[(start + i) % pool.length];
            const wx = Math.floor(poi.x);
            const wz = Math.floor(poi.z);
            if (!isLoaded(wx, wz)) continue;
            if (mobs.villagers.some((v) => Math.hypot(v.pos[0] - (wx + 0.5), v.pos[2] - (wz + 0.5)) < 3.2)) continue;
            const sy = findStandableY(world, wx, wz, 2);
            if (sy > 0) return { x: wx + 0.5, y: sy, z: wz + 0.5, poi };
        }
        const fallbackOffsets = [
            [4, 0], [-4, 0], [0, 4], [0, -4],
            [8, 0], [-8, 0], [0, 8], [0, -8]
        ];
        for (const [ox, oz] of fallbackOffsets) {
            const wx = meta.vx + ox;
            const wz = meta.vz + oz;
            if (!isLoaded(wx, wz)) continue;
            if (mobs.villagers.some((v) => Math.hypot(v.pos[0] - (wx + 0.5), v.pos[2] - (wz + 0.5)) < 3.2)) continue;
            const sy = findStandableY(world, wx, wz, 2);
            if (sy > 0) return { x: wx + 0.5, y: sy, z: wz + 0.5, poi: null };
        }
        return null;
    };

    const despawnFar = (playerPos) => {
        for (const v of [...mobs.villagers]) {
            const far = Math.hypot(v.pos[0] - playerPos[0], v.pos[2] - playerPos[2]) > VILLAGER_DESPAWN_DIST;
            if (far || !isLoaded(v.pos[0], v.pos[2]) || v.pos[1] < 2) mobs.removeVillager(v);
        }
    };

    const update = (dt, playerPos) => {
        despawnFar(playerPos);
        timer -= dt;
        if (timer > 0) return;
        timer = 1.1;
        if (mobs.villagers.length >= SPAWN_VILLAGER_CAP) return;
        const nearby = getNearbyVillages(
            playerPos[0] - 84,
            playerPos[2] - 84,
            playerPos[0] + 84,
            playerPos[2] + 84,
            seed
        );
        for (const village of nearby) {
            if (mobs.villagers.length >= SPAWN_VILLAGER_CAP) break;
            const meta = getVillageMeta(village.vx, village.vz, seed);
            const spot = findVillageSpot(meta);
            if (spot) {
                const variant = VILLAGER_PROFESSIONS[profCursor % VILLAGER_PROFESSIONS.length];
                profCursor += 1;
                const homes = meta.pois.filter((p) => p.type === "home" || p.type === "inn");
                const homeDoor = homes.length > 0 ? homes[Math.floor(rng() * homes.length)] : null;
                mobs.spawnVillager(spot.x, spot.y, spot.z, village.vx, village.vz, {
                    variant,
                    pois: meta.pois,
                    homeDoor
                });
            }
        }
    };

    return { update, isLoaded };
}

export const SPAWN_GOLEM_CAP = 2;

export function createGolemSpawner({ mobs, world, seed, rng }) {
    const isLoaded = (wx, wz) => Boolean(world.getColumn(Math.floor(wx / CHUNK_SIZE), Math.floor(wz / CHUNK_SIZE)));
    let timer = 0.8;

    const findPatrolSpot = (meta) => {
        const spots = [
            { x: meta.vx + 4, z: meta.vz },
            { x: meta.vx - 4, z: meta.vz },
            { x: meta.vx, z: meta.vz + 5 },
            { x: meta.vx, z: meta.vz - 5 },
            ...meta.pois.filter((p) => p.type === "plaza" || p.type === "market" || p.type === "forge")
        ];
        const start = Math.floor(rng() * spots.length);
        for (let i = 0; i < spots.length; i += 1) {
            const p = spots[(start + i) % spots.length];
            const wx = Math.floor(p.x);
            const wz = Math.floor(p.z);
            if (!isLoaded(wx, wz)) continue;
            if (mobs.golems.some((g) => Math.hypot(g.pos[0] - (wx + 0.5), g.pos[2] - (wz + 0.5)) < 8)) continue;
            const sy = findStandableY(world, wx, wz, 3);
            if (sy > 0) return { x: wx + 0.5, y: sy, z: wz + 0.5 };
        }
        return null;
    };

    const despawnFar = (playerPos) => {
        for (const g of [...mobs.golems]) {
            const far = Math.hypot(g.pos[0] - playerPos[0], g.pos[2] - playerPos[2]) > VILLAGER_DESPAWN_DIST;
            if (far || !isLoaded(g.pos[0], g.pos[2]) || g.pos[1] < 2) mobs.removeGolem(g);
        }
    };

    const update = (dt, playerPos) => {
        despawnFar(playerPos);
        timer -= dt;
        if (timer > 0) return;
        timer = 2.4;
        if (mobs.golems.length >= SPAWN_GOLEM_CAP) return;
        const nearby = getNearbyVillages(
            playerPos[0] - 84,
            playerPos[2] - 84,
            playerPos[0] + 84,
            playerPos[2] + 84,
            seed
        );
        for (const village of nearby) {
            if (mobs.golems.length >= SPAWN_GOLEM_CAP) break;
            const meta = getVillageMeta(village.vx, village.vz, seed);
            const spot = findPatrolSpot(meta);
            if (spot) {
                mobs.spawnGolem(spot.x, spot.y, spot.z, village.vx, village.vz, meta.pois);
            }
        }
    };

    return { update, isLoaded };
}
