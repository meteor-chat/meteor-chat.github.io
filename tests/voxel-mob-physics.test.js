import { describe, it, expect } from "vitest";
import { BLOCK } from "../src/lab/voxel/voxel-blocks.js";
import { createCat } from "../src/lab/voxel/voxel-mob-cat-ai.js";
import { stepMobPhysics } from "../src/lab/voxel/voxel-mob-physics.js";
import { collidesAABB } from "../src/lab/voxel/voxel-physics.js";

const GROUND = 10;
const fixedRng = () => 0.5;

function makeWorld(override = () => null) {
    return (x, y, z) => {
        const special = override(Math.floor(x), Math.floor(y), Math.floor(z));
        if (special !== null) return special;
        return y < GROUND ? BLOCK.STONE : BLOCK.AIR;
    };
}

function makeCat(overrides = {}) {
    const cat = createCat(0.5, GROUND, 0.5, "orange", fixedRng);
    return Object.assign(cat, overrides);
}

function run(cat, world, wishX, wishZ, seconds, dt = 1 / 60) {
    const steps = Math.round(seconds / dt);
    let blocked = false;
    for (let i = 0; i < steps; i += 1) {
        blocked = stepMobPhysics(cat, dt, wishX, wishZ, world).blocked || blocked;
    }
    return blocked;
}

describe("mob physics", () => {
    it("lands on the ground after falling", () => {
        const cat = makeCat({ pos: [0.5, GROUND + 5, 0.5] });
        run(cat, makeWorld(), 0, 0, 2);
        expect(cat.pos[1]).toBeCloseTo(GROUND, 3);
        expect(cat.onGround).toBe(true);
    });

    it("stops at a wall two blocks high and reports blocked", () => {
        const wall = (x, y, z) => (z <= -2 && y < GROUND + 2 ? BLOCK.STONE : null);
        const cat = makeCat();
        const blocked = run(cat, makeWorld(wall), 0, -1.6, 3);
        expect(blocked).toBe(true);
        expect(cat.pos[2]).toBeGreaterThan(-0.8);
        expect(cat.pos[1]).toBeCloseTo(GROUND, 3);
    });

    it("hops up a one block ledge", () => {
        const ledge = (x, y, z) => (z <= -1 && y < GROUND + 1 ? BLOCK.STONE : null);
        const cat = makeCat();
        run(cat, makeWorld(ledge), 0, -1.6, 3);
        expect(cat.pos[1]).toBeCloseTo(GROUND + 1, 3);
        expect(cat.pos[2]).toBeLessThan(-1);
    });

    it("steps down a one block drop", () => {
        const drop = (x, y, z) => (z <= -1 && y >= GROUND - 1 ? BLOCK.AIR : null);
        const cat = makeCat();
        run(cat, makeWorld(drop), 0, -1.6, 3);
        expect(cat.pos[1]).toBeCloseTo(GROUND - 1, 3);
        expect(cat.pos[2]).toBeLessThan(-1);
    });

    it("refuses to walk off a cliff deeper than two blocks", () => {
        const hole = (x, y, z) => (z <= -1 ? BLOCK.AIR : null);
        const cat = makeCat();
        const blocked = run(cat, makeWorld(hole), 0, -1.6, 3);
        expect(blocked).toBe(true);
        expect(cat.pos[2]).toBeGreaterThanOrEqual(0);
        expect(cat.pos[1]).toBeCloseTo(GROUND, 3);
    });

    it("refuses to walk into water or lava", () => {
        for (const liquid of [BLOCK.WATER, BLOCK.LAVA]) {
            const pool = (x, y, z) => (z <= -1 && y === GROUND - 1 ? liquid : null);
            const cat = makeCat();
            run(cat, makeWorld(pool), 0, -1.6, 3);
            expect(cat.pos[2]).toBeGreaterThanOrEqual(0);
        }
    });

    it("is pushed upward when a block appears inside it", () => {
        const buried = (x, y, z) => (x === 0 && z === 0 && y >= GROUND && y <= GROUND + 1 ? BLOCK.STONE : null);
        const world = makeWorld(buried);
        const cat = makeCat();
        run(cat, world, 0, 0, 0.2);
        expect(cat.pos[1]).toBeGreaterThanOrEqual(GROUND + 2);
        expect(collidesAABB(cat.pos[0], cat.pos[1], cat.pos[2], world, cat.hw, cat.h)).toBe(false);
    });

    it("floats upward in water", () => {
        const pool = (x, y) => (y >= GROUND && y < GROUND + 4 ? BLOCK.WATER : null);
        const cat = makeCat({ pos: [0.5, GROUND + 0.5, 0.5] });
        run(cat, makeWorld(pool), 0, 0, 1);
        expect(cat.pos[1]).toBeGreaterThan(GROUND + 0.5);
        expect(cat.inWater).toBe(true);
    });

    it("does not change the default player collision box", () => {
        const world = makeWorld();
        expect(collidesAABB(0.5, GROUND, 0.5, world)).toBe(false);
        const low = (x, y) => (y === GROUND + 1 ? BLOCK.STONE : null);
        expect(collidesAABB(0.5, GROUND, 0.5, makeWorld(low))).toBe(true);
        expect(collidesAABB(0.5, GROUND, 0.5, makeWorld(low), 0.25, 0.62)).toBe(false);
    });
});
