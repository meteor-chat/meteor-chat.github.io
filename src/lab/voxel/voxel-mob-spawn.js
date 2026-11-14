import { BLOCK, CHUNK_HEIGHT, CHUNK_SIZE, SEA_LEVEL } from "./voxel-blocks.js";
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

export function findSpawnSurface(x, z, ctx) {
    const wx = Math.floor(x);
    const wz = Math.floor(z);
    if (!ctx.isLoaded(wx, wz)) return null;
    const biome = sampleColumnMeta(wx, wz, ctx.seed).biome;
    let y = CHUNK_HEIGHT - 3;
    while (y > 0 && ctx.getBlock(wx, y, wz) === BLOCK.AIR) y -= 1;
    if (y <= SEA_LEVEL + 1) return null;
    if (ctx.getBlock(wx, y, wz) !== BIOME_SURFACE[biome]) return null;
    if (ctx.getBlock(wx, y + 1, wz) !== BLOCK.AIR || ctx.getBlock(wx, y + 2, wz) !== BLOCK.AIR) return null;
    return { y: y + 1, biome };
}

function inViewCone(playerPos, yaw, x, z) {
    const dx = x - playerPos[0];
    const dz = z - playerPos[2];
    const len = Math.hypot(dx, dz);
    if (len === 0) return true;
    return (dx * Math.sin(yaw) - dz * Math.cos(yaw)) / len > VIEW_CONE_COS;
}

export function createCatSpawner({ mobs, world, seed, rng }) {
    const isLoaded = (wx, wz) => Boolean(world.getColumn(Math.floor(wx / CHUNK_SIZE), Math.floor(wz / CHUNK_SIZE)));
    const ctx = { seed, getBlock: world.getBlock, isLoaded };
    let timer = SPAWN_INTERVAL * 0.5;

    const crowded = (x, z) => mobs.cats.some((cat) => Math.hypot(cat.pos[0] - x, cat.pos[2] - z) < MIN_CAT_SPACING);

    const trySpawn = (playerPos, yaw) => {
        const angle = rng() * Math.PI * 2;
        const dist = SPAWN_MIN_DIST + rng() * (SPAWN_MAX_DIST - SPAWN_MIN_DIST);
        const x = Math.floor(playerPos[0] + Math.cos(angle) * dist) + 0.5;
        const z = Math.floor(playerPos[2] + Math.sin(angle) * dist) + 0.5;
        if (yaw !== undefined && inViewCone(playerPos, yaw, x, z)) return null;
        if (crowded(x, z)) return null;
        const site = findSpawnSurface(x, z, ctx);
        if (!site) return null;
        return mobs.spawnCat(x, site.y, z, pickVariant(site.biome, rng()));
    };

    const despawnFar = (playerPos) => {
        for (const cat of [...mobs.cats]) {
            const far = Math.hypot(cat.pos[0] - playerPos[0], cat.pos[2] - playerPos[2]) > DESPAWN_DIST;
            if (far || !isLoaded(cat.pos[0], cat.pos[2]) || cat.pos[1] < 2) mobs.removeCat(cat);
        }
    };

    const update = (dt, playerPos, yaw) => {
        despawnFar(playerPos);
        timer -= dt;
        if (timer > 0) return;
        timer = SPAWN_INTERVAL;
        if (mobs.cats.length < SPAWN_CAP) trySpawn(playerPos, yaw);
    };

    return { update, trySpawn, isLoaded };
}
