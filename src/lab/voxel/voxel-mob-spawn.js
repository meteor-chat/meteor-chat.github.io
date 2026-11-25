import { BLOCK, CHUNK_HEIGHT, CHUNK_SIZE, SEA_LEVEL, isCrossPlant, isSolid } from "./voxel-blocks.js";
import { getNearbyVillages } from "./voxel-village-gen.js";
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

const VILLAGE_GROUND = new Set([BLOCK.GRASS, BLOCK.COBBLESTONE, BLOCK.STONE_BRICK, BLOCK.WOOD_PLANKS]);

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

export const SPAWN_VILLAGER_CAP = 5;
const VILLAGER_DESPAWN_DIST = 78;

export function createVillagerSpawner({ mobs, world, seed, rng }) {
    const isLoaded = (wx, wz) => Boolean(world.getColumn(Math.floor(wx / CHUNK_SIZE), Math.floor(wz / CHUNK_SIZE)));
    let timer = 0.6;

    const findRoadSpot = (vx, vz) => {
        const offsets = [
            [4, 0], [-4, 0], [0, 4], [0, -4],
            [8, 0], [-8, 0], [0, 8], [0, -8],
            [12, 0], [0, 12], [-12, 0], [0, -12]
        ];
        const start = Math.floor(rng() * offsets.length);
        for (let i = 0; i < offsets.length; i += 1) {
            const [ox, oz] = offsets[(start + i) % offsets.length];
            const wx = vx + ox;
            const wz = vz + oz;
            if (!isLoaded(wx, wz)) continue;
            if (mobs.villagers.some((v) => Math.hypot(v.pos[0] - (wx + 0.5), v.pos[2] - (wz + 0.5)) < 3.5)) continue;
            for (let y = CHUNK_HEIGHT - 6; y > SEA_LEVEL + 1; y -= 1) {
                const g = world.getBlock(wx, y, wz);
                if (!isSolid(g) || g === BLOCK.LEAVES) continue;
                if (VILLAGE_GROUND.has(g) && isPassable(world.getBlock(wx, y + 1, wz)) && isPassable(world.getBlock(wx, y + 2, wz))) {
                    return { x: wx + 0.5, y: y + 1, z: wz + 0.5 };
                }
                break;
            }
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
        timer = 1.8;
        if (mobs.villagers.length >= SPAWN_VILLAGER_CAP) return;
        const nearby = getNearbyVillages(
            playerPos[0] - 48,
            playerPos[2] - 48,
            playerPos[0] + 48,
            playerPos[2] + 48,
            seed
        );
        for (const village of nearby) {
            if (mobs.villagers.length >= SPAWN_VILLAGER_CAP) break;
            const spot = findRoadSpot(village.vx, village.vz);
            if (spot) {
                mobs.spawnVillager(spot.x, spot.y, spot.z, village.vx, village.vz);
            }
        }
    };

    return { update, isLoaded };
}
