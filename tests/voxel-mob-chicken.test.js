import { describe, it, expect } from "vitest";
import { BLOCK, TEX } from "../src/lab/voxel/voxel-blocks.js";
import { createChicken, stepChicken, CHICKEN_STATE } from "../src/lab/voxel/voxel-mob-chicken-ai.js";
import {
    buildChickenVertices,
    CHICKEN_LAYERS,
    FLOATS_PER_CHICKEN,
    FLOATS_PER_VERTEX,
    VERTS_PER_CHICKEN
} from "../src/lab/voxel/voxel-mob-chicken-model.js";
import { stepMobPhysics } from "../src/lab/voxel/voxel-mob-physics.js";
import { createMobSystem } from "../src/lab/voxel/voxel-mob-system.js";
import { createChickenSpawner } from "../src/lab/voxel/voxel-mob-spawn.js";
import { sampleColumnMeta } from "../src/lab/voxel/voxel-world-gen.js";

const fixedRng = () => 0.5;

function makeChicken(overrides = {}) {
    const chicken = createChicken(10.5, 20, -4.5, "white", fixedRng);
    chicken.yaw = 0;
    return Object.assign(chicken, overrides);
}

function build(chicken, timeSec = 1) {
    const out = new Float32Array(FLOATS_PER_CHICKEN);
    const end = buildChickenVertices(chicken, timeSec, out, 0);
    return { out, end };
}

function vertex(out, i) {
    const o = i * FLOATS_PER_VERTEX;
    return {
        pos: [out[o], out[o + 1], out[o + 2]],
        normal: [out[o + 3], out[o + 4], out[o + 5]],
        uv: [out[o + 6], out[o + 7]],
        layer: out[o + 8],
        sky: out[o + 9]
    };
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const POSES = [
    { label: "standing", anim: { phase: 0, moving: 0, peck: 0, flutter: 0 } },
    { label: "walking", anim: { phase: 1.5, moving: 1, peck: 0, flutter: 0 } },
    { label: "pecking", anim: { phase: 0, moving: 0, peck: 0.8, flutter: 0 } },
    { label: "gliding", anim: { phase: 2.0, moving: 0.5, peck: 0, flutter: 1 } }
];

describe("chicken model", () => {
    it("writes the complete vertex budget with finite values", () => {
        const { out, end } = build(makeChicken());
        expect(end).toBe(FLOATS_PER_CHICKEN);
        expect(end / FLOATS_PER_VERTEX).toBe(VERTS_PER_CHICKEN);
        expect(Array.from(out).every(Number.isFinite)).toBe(true);
    });

    it("keeps triangles wound counter clockwise toward their normals in every pose", () => {
        for (const pose of POSES) {
            const { out } = build(makeChicken({ anim: pose.anim, yaw: 0.8 }), 1.4);
            for (let t = 0; t < VERTS_PER_CHICKEN; t += 3) {
                const a = vertex(out, t);
                const b = vertex(out, t + 1);
                const c = vertex(out, t + 2);
                const facing = dot(cross(sub(b.pos, a.pos), sub(c.pos, a.pos)), a.normal);
                expect(facing, `${pose.label} triangle ${t / 3}`).toBeGreaterThan(0);
            }
        }
    });

    it("emits unit normals and valid uv coordinates", () => {
        const { out } = build(makeChicken());
        for (let i = 0; i < VERTS_PER_CHICKEN; i += 1) {
            const v = vertex(out, i);
            expect(Math.hypot(...v.normal)).toBeCloseTo(1, 4);
            expect(v.uv[0]).toBeGreaterThanOrEqual(0);
            expect(v.uv[1]).toBeGreaterThanOrEqual(0);
        }
    });

    it("assigns expected layers for face, beak, wattle, legs, and feathers", () => {
        const { out } = build(makeChicken());
        const counts = new Map();
        for (let i = 0; i < VERTS_PER_CHICKEN; i += 1) {
            const l = vertex(out, i).layer;
            counts.set(l, (counts.get(l) || 0) + 1);
        }
        expect(counts.get(CHICKEN_LAYERS.face)).toBe(6);
        expect(counts.get(CHICKEN_LAYERS.wattle)).toBe(36);
        expect(counts.get(CHICKEN_LAYERS.beak)).toBe(108);
        expect(counts.get(CHICKEN_LAYERS.feather)).toBe(138);
        expect(CHICKEN_LAYERS.feather).toBe(TEX.CHICKEN_FEATHER);
        expect(CHICKEN_LAYERS.face).toBe(TEX.CHICKEN_FACE);
        expect(CHICKEN_LAYERS.beak).toBe(TEX.CHICKEN_BEAK);
        expect(CHICKEN_LAYERS.wattle).toBe(TEX.CHICKEN_WATTLE);
    });
});

describe("chicken AI and glide physics", () => {
    it("initializes with slowFall enabled and chicken dimensions", () => {
        const chicken = makeChicken();
        expect(chicken.kind).toBe("chicken");
        expect(chicken.slowFall).toBe(true);
        expect(chicken.hw).toBe(0.20);
        expect(chicken.h).toBe(0.50);
        expect(chicken.state).toBe("idle");
    });

    it("caps falling speed to slow glide speed in midair", () => {
        const chicken = makeChicken({ pos: [0.5, 40, 0.5], vel: [0, -10, 0] });
        const airWorld = () => BLOCK.AIR;
        stepMobPhysics(chicken, 0.1, 0, 0, airWorld);
        expect(chicken.vel[1]).toBeGreaterThanOrEqual(-2.2);
        expect(chicken.vel[1]).toBeLessThan(0);
    });

    it("transitions into walking and pecking states", () => {
        let seq = 0;
        const cyclingRng = () => {
            seq = (seq + 0.17) % 1;
            return seq;
        };
        const chicken = createChicken(0.5, 10, 0.5, "white", cyclingRng);
        const groundWorld = (x, y) => (Math.floor(y) < 10 ? BLOCK.STONE : BLOCK.AIR);
        const ctx = { getBlock: groundWorld, rng: cyclingRng };
        const states = new Set();
        for (let i = 0; i < 400; i += 1) {
            stepChicken(chicken, 1 / 30, ctx);
            states.add(chicken.state);
        }
        expect(states.has(CHICKEN_STATE.WALK)).toBe(true);
        expect(states.has(CHICKEN_STATE.PECK)).toBe(true);
    });

    it("flutters wings when airborne and rests them on the ground", () => {
        const chicken = makeChicken({ pos: [0.5, 30, 0.5], onGround: false, vel: [0, -1, 0] });
        const airWorld = () => BLOCK.AIR;
        const airCtx = { getBlock: airWorld, rng: fixedRng };
        for (let i = 0; i < 15; i += 1) stepChicken(chicken, 1 / 30, airCtx);
        expect(chicken.anim.flutter).toBeGreaterThan(0.5);

        const groundWorld = (x, y) => (Math.floor(y) < 10 ? BLOCK.GRASS : BLOCK.AIR);
        chicken.pos[1] = 10;
        chicken.onGround = true;
        chicken.vel[1] = 0;
        const groundCtx = { getBlock: groundWorld, rng: fixedRng };
        for (let i = 0; i < 30; i += 1) stepChicken(chicken, 1 / 30, groundCtx);
        expect(chicken.anim.flutter).toBeLessThan(0.1);
    });
});

describe("chicken mob system and spawning", () => {
    const flatGrass = (x, y) => {
        if (Math.floor(y) < 10) return BLOCK.STONE;
        if (Math.floor(y) === 10) return BLOCK.GRASS;
        return BLOCK.AIR;
    };

    it("spawns chickens through mob system and aggregates in all list", () => {
        const system = createMobSystem({ getBlock: flatGrass, rng: fixedRng });
        const cat = system.spawnCat(0, 11, 0, "orange");
        const chicken = system.spawnChicken(2, 11, 2);
        expect(system.cats).toContain(cat);
        expect(system.chickens).toContain(chicken);
        expect(system.all).toContain(cat);
        expect(system.all).toContain(chicken);
        expect(system.all).toHaveLength(2);

        system.removeChicken(chicken);
        expect(system.chickens).toHaveLength(0);
        expect(system.all).toHaveLength(1);
    });

    it("spawns chickens on grass surfaces with createChickenSpawner", () => {
        const SEED = 2026;
        let grassX = 0;
        let grassZ = 0;
        for (let x = -500; x <= 500; x += 16) {
            for (let z = -500; z <= 500; z += 16) {
                if (sampleColumnMeta(x - 20, z, SEED).biome === "grass") {
                    grassX = x;
                    grassZ = z;
                    break;
                }
            }
            if (grassX !== 0) break;
        }
        const GROUND = 60;
        const world = {
            getBlock: (x, y) => {
                const wy = Math.floor(y);
                if (wy < GROUND) return BLOCK.STONE;
                if (wy === GROUND) return BLOCK.GRASS;
                return BLOCK.AIR;
            },
            getColumn: () => ({})
        };
        const system = createMobSystem({ getBlock: world.getBlock, rng: fixedRng });
        const spawner = createChickenSpawner({
            mobs: system,
            world,
            seed: SEED,
            rng: () => 0.5
        });
        const spawned = spawner.trySpawn([grassX, GROUND + 1, grassZ], 0);
        expect(spawned).not.toBeNull();
        expect(system.chickens.length).toBe(1);
        expect(spawned.kind).toBe("chicken");
    });
});
