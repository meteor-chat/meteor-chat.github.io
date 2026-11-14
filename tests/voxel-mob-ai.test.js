import { describe, it, expect } from "vitest";
import { BLOCK } from "../src/lab/voxel/voxel-blocks.js";
import { CAT_STATE, FLEE_END, FLEE_START, createCat, stepCat } from "../src/lab/voxel/voxel-mob-cat-ai.js";
import { mulberry32 } from "../src/lab/voxel/voxel-noise.js";

const GROUND = 10;
const flat = (x, y) => (y < GROUND ? BLOCK.STONE : BLOCK.AIR);

function makeCtx(seed, playerPos, getBlock = flat) {
    return { rng: mulberry32(seed), playerPos, getBlock, frozen: false };
}

function simulate(cat, ctx, seconds, dt = 1 / 60, onStep = () => {}) {
    const steps = Math.round(seconds / dt);
    for (let i = 0; i < steps; i += 1) {
        stepCat(cat, dt, ctx);
        onStep(cat, i);
    }
}

describe("cat ai", () => {
    it("starts idle with a positive timer", () => {
        const cat = createCat(0.5, GROUND, 0.5, "orange", mulberry32(1));
        expect(cat.state).toBe(CAT_STATE.IDLE);
        expect(cat.timer).toBeGreaterThan(0);
        expect(cat.variant).toBe("orange");
    });

    it("visits idle, walk and sit states while the player is far away", () => {
        const cat = createCat(0.5, GROUND, 0.5, "black", mulberry32(7));
        const seen = new Set();
        simulate(cat, makeCtx(7, [80, GROUND, 80]), 90, 1 / 30, (c) => seen.add(c.state));
        expect(seen.has(CAT_STATE.IDLE)).toBe(true);
        expect(seen.has(CAT_STATE.WALK)).toBe(true);
        expect(seen.has(CAT_STATE.SIT)).toBe(true);
        expect(seen.has(CAT_STATE.FLEE)).toBe(false);
    });

    it("flees from a nearby player and increases the distance", () => {
        const cat = createCat(0.5, GROUND, 0.5, "orange", mulberry32(3));
        const player = [0.5 + 3, GROUND, 0.5];
        const ctx = makeCtx(3, player);
        simulate(cat, ctx, 0.3);
        expect(cat.state).toBe(CAT_STATE.FLEE);
        const before = Math.hypot(cat.pos[0] - player[0], cat.pos[2] - player[2]);
        simulate(cat, ctx, 1.5);
        const after = Math.hypot(cat.pos[0] - player[0], cat.pos[2] - player[2]);
        expect(after).toBeGreaterThan(before);
        expect(cat.pos[0]).toBeLessThan(0.5);
    });

    it("stops fleeing once the player is beyond the release distance", () => {
        const cat = createCat(0.5, GROUND, 0.5, "orange", mulberry32(5));
        const player = [0.5 + FLEE_START - 1, GROUND, 0.5];
        const ctx = makeCtx(5, player);
        simulate(cat, ctx, 0.3);
        expect(cat.state).toBe(CAT_STATE.FLEE);
        player[0] = 0.5 + FLEE_END + 2;
        simulate(cat, ctx, 0.2);
        expect(cat.state).not.toBe(CAT_STATE.FLEE);
    });

    it("ignores a player on a very different height", () => {
        const cat = createCat(0.5, GROUND, 0.5, "orange", mulberry32(5));
        simulate(cat, makeCtx(5, [2, GROUND + 30, 0.5]), 0.5);
        expect(cat.state).not.toBe(CAT_STATE.FLEE);
    });

    it("sits without moving and blends the sit pose in", () => {
        const cat = createCat(0.5, GROUND, 0.5, "orange", mulberry32(9));
        const ctx = makeCtx(9, [80, GROUND, 80]);
        simulate(cat, ctx, 0.1);
        cat.state = CAT_STATE.SIT;
        cat.timer = 5;
        cat.speed = 0;
        const x = cat.pos[0];
        const z = cat.pos[2];
        simulate(cat, ctx, 1);
        expect(cat.anim.sit).toBeGreaterThan(0.95);
        expect(cat.pos[0]).toBeCloseTo(x, 5);
        expect(cat.pos[2]).toBeCloseTo(z, 5);
    });

    it("is deterministic for the same seed", () => {
        const a = createCat(0.5, GROUND, 0.5, "orange", mulberry32(11));
        const b = createCat(0.5, GROUND, 0.5, "orange", mulberry32(11));
        simulate(a, makeCtx(11, [60, GROUND, 60]), 20, 1 / 30);
        simulate(b, makeCtx(11, [60, GROUND, 60]), 20, 1 / 30);
        expect(a.pos).toEqual(b.pos);
        expect(a.state).toBe(b.state);
    });

    it("does not move while frozen", () => {
        const cat = createCat(0.5, GROUND, 0.5, "orange", mulberry32(2));
        const ctx = makeCtx(2, [80, GROUND, 80]);
        ctx.frozen = true;
        const start = [...cat.pos];
        simulate(cat, ctx, 3);
        expect(cat.pos).toEqual(start);
    });

    it("does not pass through a wall while wandering", () => {
        const wall = (x, y, z) => (z <= -2 && y < GROUND + 3 ? BLOCK.STONE : flat(x, y));
        const cat = createCat(0.5, GROUND, 0.5, "orange", mulberry32(4));
        const ctx = makeCtx(4, [80, GROUND, 80], wall);
        cat.state = CAT_STATE.WALK;
        cat.timer = 30;
        cat.speed = 1.6;
        cat.yaw = 0;
        cat.targetYaw = 0;
        simulate(cat, ctx, 20, 1 / 30, (c) => expect(c.pos[2]).toBeGreaterThan(-1.8));
        expect(cat.pos[1]).toBeCloseTo(GROUND, 3);
    });

    it("escapes a wall in its way while fleeing", () => {
        const wall = (x, y, z) => (z <= -2 && y < GROUND + 3 ? BLOCK.STONE : flat(x, y));
        const cat = createCat(0.5, GROUND, -0.4, "orange", mulberry32(6));
        const player = [0.5, GROUND, 2.5];
        simulate(cat, makeCtx(6, player, wall), 4, 1 / 30);
        expect(cat.pos[2]).toBeGreaterThan(-1.8);
        expect(Number.isFinite(cat.pos[0])).toBe(true);
    });
});
