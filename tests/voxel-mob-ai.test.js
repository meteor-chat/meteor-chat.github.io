import { describe, it, expect } from "vitest";
import { BLOCK } from "../src/lab/voxel/voxel-blocks.js";
import { CAT_STATE, createCat, stepCat } from "../src/lab/voxel/voxel-mob-cat-ai.js";
import { mulberry32 } from "../src/lab/voxel/voxel-noise.js";

const GROUND = 10;
const flat = (x, y) => (y < GROUND ? BLOCK.STONE : BLOCK.AIR);

function makeCtx(seed, getBlock = flat) {
    return { rng: mulberry32(seed), getBlock, frozen: false };
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

    it("only ever visits idle, walk and sit states", () => {
        const cat = createCat(0.5, GROUND, 0.5, "black", mulberry32(7));
        const seen = new Set();
        simulate(cat, makeCtx(7), 90, 1 / 30, (c) => seen.add(c.state));
        expect(seen.has(CAT_STATE.IDLE)).toBe(true);
        expect(seen.has(CAT_STATE.WALK)).toBe(true);
        expect(seen.has(CAT_STATE.SIT)).toBe(true);
        expect([...seen].every((s) => Object.values(CAT_STATE).includes(s))).toBe(true);
    });

    it("keeps wandering normally and does not react to a nearby player", () => {
        const cat = createCat(0.5, GROUND, 0.5, "orange", mulberry32(3));
        const ctx = makeCtx(3);
        const seen = new Set();
        simulate(cat, ctx, 30, 1 / 30, (c) => seen.add(c.state));
        expect(seen.has(CAT_STATE.WALK)).toBe(true);
        expect(cat.state).not.toBe("flee");
        expect(Object.values(CAT_STATE)).toContain(cat.state);
    });

    it("behaves the same whether or not a player stands right next to it", () => {
        const lone = createCat(0.5, GROUND, 0.5, "orange", mulberry32(14));
        const crowded = createCat(0.5, GROUND, 0.5, "orange", mulberry32(14));
        simulate(lone, makeCtx(14), 20, 1 / 30);
        simulate(crowded, { ...makeCtx(14), playerPos: [1.2, GROUND, 0.5] }, 20, 1 / 30);
        expect(crowded.pos).toEqual(lone.pos);
        expect(crowded.state).toBe(lone.state);
    });

    it("sits without moving and blends the sit pose in", () => {
        const cat = createCat(0.5, GROUND, 0.5, "orange", mulberry32(9));
        const ctx = makeCtx(9);
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
        simulate(a, makeCtx(11), 20, 1 / 30);
        simulate(b, makeCtx(11), 20, 1 / 30);
        expect(a.pos).toEqual(b.pos);
        expect(a.state).toBe(b.state);
    });

    it("does not move while frozen", () => {
        const cat = createCat(0.5, GROUND, 0.5, "orange", mulberry32(2));
        const ctx = makeCtx(2);
        ctx.frozen = true;
        const start = [...cat.pos];
        simulate(cat, ctx, 3);
        expect(cat.pos).toEqual(start);
    });

    it("does not pass through a wall while wandering", () => {
        const wall = (x, y, z) => (z <= -2 && y < GROUND + 3 ? BLOCK.STONE : flat(x, y));
        const cat = createCat(0.5, GROUND, 0.5, "orange", mulberry32(4));
        const ctx = makeCtx(4, wall);
        cat.state = CAT_STATE.WALK;
        cat.timer = 30;
        cat.speed = 1.6;
        cat.yaw = 0;
        cat.targetYaw = 0;
        simulate(cat, ctx, 20, 1 / 30, (c) => expect(c.pos[2]).toBeGreaterThan(-1.8));
        expect(cat.pos[1]).toBeCloseTo(GROUND, 3);
    });

    it("turns away from a wall it keeps bumping into", () => {
        const wall = (x, y, z) => (z <= -2 && y < GROUND + 3 ? BLOCK.STONE : flat(x, y));
        const cat = createCat(0.5, GROUND, -0.4, "orange", mulberry32(6));
        cat.state = CAT_STATE.WALK;
        cat.timer = 30;
        cat.speed = 1.6;
        cat.yaw = 0;
        cat.targetYaw = 0;
        simulate(cat, makeCtx(6, wall), 4, 1 / 30);
        expect(cat.pos[2]).toBeGreaterThan(-1.8);
        expect(Number.isFinite(cat.pos[0])).toBe(true);
    });
});
