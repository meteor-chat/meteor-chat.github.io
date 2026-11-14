import { describe, it, expect } from "vitest";
import { BLOCK, SEA_LEVEL } from "../src/lab/voxel/voxel-blocks.js";
import { createMobSystem } from "../src/lab/voxel/voxel-mob-system.js";
import {
    BIOME_SURFACE,
    BIOME_VARIANTS,
    DESPAWN_DIST,
    MIN_CAT_SPACING,
    SPAWN_CAP,
    SPAWN_INTERVAL,
    SPAWN_MAX_DIST,
    SPAWN_MIN_DIST,
    VIEW_CONE_COS,
    createCatSpawner,
    findSpawnSurface,
    pickVariant
} from "../src/lab/voxel/voxel-mob-spawn.js";
import { mulberry32 } from "../src/lab/voxel/voxel-noise.js";
import { sampleColumnMeta } from "../src/lab/voxel/voxel-world-gen.js";

const SEED = 2026;
const GROUND = 60;

function biomeAt(x, z) {
    return sampleColumnMeta(Math.floor(x), Math.floor(z), SEED).biome;
}

function findBiome(name) {
    for (let x = -3000; x <= 3000; x += 16) {
        for (let z = -3000; z <= 3000; z += 16) {
            if (biomeAt(x, z) === name) return [x, z];
        }
    }
    return null;
}

function biomeWorld({ loaded = () => true, topOverride = null } = {}) {
    const getBlock = (x, y, z) => {
        const wx = Math.floor(x);
        const wz = Math.floor(z);
        const wy = Math.floor(y);
        if (wy > GROUND) return BLOCK.AIR;
        if (wy === GROUND) return topOverride ?? BIOME_SURFACE[biomeAt(wx, wz)];
        return wy >= 0 ? BLOCK.STONE : BLOCK.AIR;
    };
    const getColumn = (cx, cz) => (loaded(cx * 16, cz * 16) ? {} : null);
    return { getBlock, getColumn };
}

function siteContext(world, loaded = true) {
    return { seed: SEED, getBlock: world.getBlock, isLoaded: () => loaded };
}

describe("cat variants", () => {
    it("restricts variants to the biome", () => {
        for (const roll of [0, 0.2, 0.44, 0.45, 0.6, 0.79, 0.8, 0.95, 0.999]) {
            expect(["orange", "calico", "black"]).toContain(pickVariant("grass", roll));
            expect(pickVariant("snow", roll)).toBe("white");
            expect(pickVariant("desert", roll)).toBe("sand");
        }
        expect(pickVariant("ocean", 0.5)).toBeNull();
    });

    it("follows the grass weights at the table boundaries", () => {
        expect(pickVariant("grass", 0)).toBe("orange");
        expect(pickVariant("grass", 0.449)).toBe("orange");
        expect(pickVariant("grass", 0.451)).toBe("calico");
        expect(pickVariant("grass", 0.799)).toBe("calico");
        expect(pickVariant("grass", 0.801)).toBe("black");
        const total = BIOME_VARIANTS.grass.reduce((sum, [, w]) => sum + w, 0);
        expect(total).toBeCloseTo(1, 10);
    });
});

describe("spawn surface rules", () => {
    it("accepts the matching surface block in each biome", () => {
        for (const biome of ["grass", "snow", "desert"]) {
            const spot = findBiome(biome);
            expect(spot, biome).not.toBeNull();
            const world = biomeWorld();
            const site = findSpawnSurface(spot[0] + 0.5, spot[1] + 0.5, siteContext(world));
            expect(site).toEqual({ y: GROUND + 1, biome });
        }
    });

    it("rejects surfaces that do not belong to the biome", () => {
        const spot = findBiome("grass");
        for (const wrong of [BLOCK.SAND, BLOCK.SNOW, BLOCK.WATER, BLOCK.LEAVES, BLOCK.LAVA, BLOCK.STONE, BLOCK.CACTUS]) {
            const world = biomeWorld({ topOverride: wrong });
            expect(findSpawnSurface(spot[0], spot[1], siteContext(world)), String(wrong)).toBeNull();
        }
        const desert = findBiome("desert");
        expect(findSpawnSurface(desert[0], desert[1], siteContext(biomeWorld({ topOverride: BLOCK.GRASS })))).toBeNull();
    });

    it("rejects beaches, blocked headroom and unloaded columns", () => {
        const spot = findBiome("grass");
        const low = (x, y) => (Math.floor(y) === SEA_LEVEL + 1 ? BLOCK.GRASS : Math.floor(y) < SEA_LEVEL + 1 ? BLOCK.STONE : BLOCK.AIR);
        expect(findSpawnSurface(spot[0], spot[1], { seed: SEED, getBlock: low, isLoaded: () => true })).toBeNull();
        const base = biomeWorld();
        const covered = (x, y, z) => (Math.floor(y) === GROUND + 2 ? BLOCK.STONE : base.getBlock(x, y, z));
        expect(findSpawnSurface(spot[0], spot[1], { seed: SEED, getBlock: covered, isLoaded: () => true })).toBeNull();
        expect(findSpawnSurface(spot[0], spot[1], siteContext(base, false))).toBeNull();
    });
});

function makeSpawner(world, seed = 11) {
    const rng = mulberry32(seed);
    const mobs = createMobSystem({ getBlock: world.getBlock, rng, isLoaded: () => true });
    const spawner = createCatSpawner({ mobs, world, seed: SEED, rng });
    return { mobs, spawner };
}

function runSpawner(player, yaw, seconds, seed) {
    const world = biomeWorld();
    const { mobs, spawner } = makeSpawner(world, seed);
    const steps = Math.round(seconds / 0.5);
    for (let i = 0; i < steps; i += 1) spawner.update(0.5, player, yaw);
    return mobs;
}

describe("cat spawner", () => {
    it("spawns only variants that match the biome under each cat", () => {
        let total = 0;
        for (const biome of ["grass", "snow", "desert"]) {
            const spot = findBiome(biome);
            const mobs = runSpawner([spot[0] + 0.5, GROUND + 1, spot[1] + 0.5], undefined, 400, 3);
            for (const cat of mobs.cats) {
                const here = biomeAt(cat.pos[0], cat.pos[2]);
                expect(BIOME_VARIANTS[here].map(([v]) => v)).toContain(cat.variant);
                total += 1;
            }
        }
        expect(total).toBeGreaterThan(3);
    });

    it("never exceeds the cap and keeps spawns within the ring around the player", () => {
        const spot = findBiome("grass");
        const player = [spot[0] + 0.5, GROUND + 1, spot[1] + 0.5];
        const mobs = runSpawner(player, undefined, 600, 5);
        expect(mobs.cats.length).toBeGreaterThan(0);
        expect(mobs.cats.length).toBeLessThanOrEqual(SPAWN_CAP);
        for (const cat of mobs.cats) {
            const dist = Math.hypot(cat.pos[0] - player[0], cat.pos[2] - player[2]);
            expect(dist).toBeGreaterThanOrEqual(SPAWN_MIN_DIST - 1.5);
            expect(dist).toBeLessThanOrEqual(SPAWN_MAX_DIST + 1.5);
            expect(cat.pos[1]).toBe(GROUND + 1);
        }
    });

    it("keeps new cats apart and outside the view cone", () => {
        const spot = findBiome("grass");
        const player = [spot[0] + 0.5, GROUND + 1, spot[1] + 0.5];
        const yaw = 0.8;
        const world = biomeWorld();
        const { mobs, spawner } = makeSpawner(world, 9);
        for (let i = 0; i < 400; i += 1) {
            const before = mobs.cats.length;
            spawner.trySpawn(player, yaw);
            if (mobs.cats.length > before) {
                const cat = mobs.cats[mobs.cats.length - 1];
                const dx = cat.pos[0] - player[0];
                const dz = cat.pos[2] - player[2];
                const facing = (dx * Math.sin(yaw) - dz * Math.cos(yaw)) / Math.hypot(dx, dz);
                expect(facing).toBeLessThanOrEqual(VIEW_CONE_COS);
            }
        }
        const list = mobs.cats;
        for (let i = 0; i < list.length; i += 1) {
            for (let j = i + 1; j < list.length; j += 1) {
                const gap = Math.hypot(list[i].pos[0] - list[j].pos[0], list[i].pos[2] - list[j].pos[2]);
                expect(gap).toBeGreaterThanOrEqual(MIN_CAT_SPACING);
            }
        }
    });

    it("spawns at most one cat per interval", () => {
        const spot = findBiome("grass");
        const { mobs, spawner } = makeSpawner(biomeWorld(), 21);
        const player = [spot[0] + 0.5, GROUND + 1, spot[1] + 0.5];
        for (let i = 0; i < 40; i += 1) spawner.update(SPAWN_INTERVAL / 4, player);
        expect(mobs.cats.length).toBeLessThanOrEqual(Math.ceil((40 * SPAWN_INTERVAL) / 4 / SPAWN_INTERVAL) + 1);
    });

    it("removes cats that are too far, in unloaded columns, or fallen out of the world", () => {
        const spot = findBiome("grass");
        const player = [spot[0] + 0.5, GROUND + 1, spot[1] + 0.5];
        let loadedFlag = true;
        const world = biomeWorld({ loaded: () => loadedFlag });
        const { mobs, spawner } = makeSpawner(world, 4);
        const far = mobs.spawnCat(player[0] + DESPAWN_DIST + 10, GROUND + 1, player[2], "orange");
        const near = mobs.spawnCat(player[0] + 6, GROUND + 1, player[2], "black");
        const void_ = mobs.spawnCat(player[0] + 8, 1, player[2] + 3, "orange");
        spawner.update(0.01, player);
        expect(mobs.cats).not.toContain(far);
        expect(mobs.cats).not.toContain(void_);
        expect(mobs.cats).toContain(near);
        loadedFlag = false;
        spawner.update(0.01, player);
        expect(mobs.cats).toHaveLength(0);
    });

    it("is deterministic for the same seed and player path", () => {
        const spot = findBiome("grass");
        const player = [spot[0] + 0.5, GROUND + 1, spot[1] + 0.5];
        const a = runSpawner(player, 0.3, 120, 17);
        const b = runSpawner(player, 0.3, 120, 17);
        expect(a.cats.map((c) => [c.variant, ...c.pos])).toEqual(b.cats.map((c) => [c.variant, ...c.pos]));
    });
});

describe("frozen mobs", () => {
    it("does not move cats whose column is not loaded", () => {
        const world = biomeWorld();
        const rng = mulberry32(2);
        const mobs = createMobSystem({ getBlock: world.getBlock, rng, isLoaded: () => false });
        const cat = mobs.spawnCat(10.5, GROUND + 1, 10.5, "orange");
        const start = [...cat.pos];
        for (let i = 0; i < 60; i += 1) mobs.update(1 / 30, [12, GROUND + 1, 10]);
        expect(cat.pos).toEqual(start);
    });
});
