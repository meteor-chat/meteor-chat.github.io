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

    const startY = GROUND + 3;
    const swim = (keys, pitch, seconds = 0.6, dt = 1 / 60) => {
        const player = makePlayer({ pos: [0.5, startY, 0.5], pitch });
        run(player, keys, makeWorld(pool), seconds, dt);
        return player;
    };

    it("sinks slowly without input", () => {
        const player = swim([], 0);
        expect(player.pos[1]).toBeLessThan(startY);
        expect(player.pos[1]).toBeGreaterThan(startY - 2);
    });

    it("rises when moving forward while looking up", () => {
        expect(swim(["KeyW"], 0.6).pos[1]).toBeGreaterThan(startY + 0.8);
    });

    it("keeps its depth when moving forward at the horizon", () => {
        const player = swim(["KeyW"], 0, 1);
        expect(Math.abs(player.pos[1] - startY)).toBeLessThan(0.1);
        expect(player.pos[2]).toBeLessThan(0.5 - 2);
    });

    it("dives when moving forward while looking down", () => {
        expect(swim(["KeyW"], -0.6).pos[1]).toBeLessThan(startY - 0.8);
    });

    it("reverses vertical motion when moving backward", () => {
        expect(swim(["KeyS"], 0.6).pos[1]).toBeLessThan(startY - 0.5);
    });

    it("does not follow pitch when only strafing", () => {
        const strafe = swim(["KeyD"], 0.6);
        const idle = swim([], 0.6);
        expect(strafe.pos[1]).toBeCloseTo(idle.pos[1], 5);
    });

    it("sinks the same distance at different frame rates", () => {
        const slow = swim([], 0, 0.5, 1 / 30);
        const fast = swim([], 0, 0.5, 1 / 120);
        expect(slow.pos[1]).toBeCloseTo(fast.pos[1], 0);
        expect(Math.abs(slow.pos[1] - fast.pos[1])).toBeLessThan(0.15);
    });
});
