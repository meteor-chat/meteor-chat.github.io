import { describe, it, expect } from "vitest";
import { BLOCK } from "../src/lab/voxel/voxel-blocks.js";
import { stepPlayerPhysics } from "../src/lab/voxel/voxel-physics.js";

const GROUND = 10;

function makeWorld(extra = () => BLOCK.AIR) {
    return (x, y, z) => {
        const special = extra(x, y, z);
        if (special !== BLOCK.AIR) return special;
        return y < GROUND ? BLOCK.STONE : BLOCK.AIR;
    };
}

function makePlayer(overrides = {}) {
    return {
        pos: [0.5, GROUND, 0.5],
        vel: [0, 0, 0],
        yaw: 0,
        pitch: 0,
        flyMode: false,
        onGround: false,
        submerged: false,
        ...overrides
    };
}

function run(player, keys, world, seconds, dt = 1 / 60) {
    const held = new Set(keys);
    const steps = Math.round(seconds / dt);
    for (let i = 0; i < steps; i += 1) stepPlayerPhysics(player, held, dt, world);
}

describe("walking physics", () => {
    it("lands on the ground after falling", () => {
        const player = makePlayer({ pos: [0.5, GROUND + 5, 0.5] });
        run(player, [], makeWorld(), 2);
        expect(player.pos[1]).toBeCloseTo(GROUND, 1);
        expect(player.onGround).toBe(true);
    });

    it("moves forward on flat ground", () => {
        const player = makePlayer();
        run(player, ["KeyW"], makeWorld(), 0.5);
        expect(player.pos[2]).toBeLessThan(0.5 - 1);
    });

    it("stops at a wall two blocks high", () => {
        const wall = (x, y, z) => (z <= -2 && y < GROUND + 2 ? BLOCK.STONE : BLOCK.AIR);
        const player = makePlayer();
        run(player, ["KeyW"], makeWorld(wall), 2);
        expect(player.pos[2]).toBeGreaterThan(-1.6);
        expect(player.pos[1]).toBeCloseTo(GROUND, 1);
    });

    it("jumps when space is pressed on the ground", () => {
        const player = makePlayer();
        run(player, [], makeWorld(), 0.2);
        run(player, ["Space"], makeWorld(), 0.15);
        expect(player.pos[1]).toBeGreaterThan(GROUND + 0.3);
    });
});

describe("fly mode", () => {
    it("ignores gravity", () => {
        const player = makePlayer({ flyMode: true, pos: [0.5, 40, 0.5] });
        run(player, [], makeWorld(), 1);
        expect(player.pos[1]).toBe(40);
    });
});

describe("water", () => {
    const pool = (x, y) => (y >= GROUND && y < GROUND + 6 ? BLOCK.WATER : BLOCK.AIR);

    it("sinks slowly without input", () => {
        const player = makePlayer({ pos: [0.5, GROUND + 4, 0.5] });
        run(player, [], makeWorld(pool), 0.5);
        expect(player.pos[1]).toBeLessThan(GROUND + 4);
    });
});
