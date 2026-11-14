import { describe, it, expect } from "vitest";
import { BLOCK } from "../src/lab/voxel/voxel-blocks.js";
import { MAX_CATS } from "../src/lab/voxel/voxel-mob-cat-model.js";
import { createMobSystem, skyLightAt } from "../src/lab/voxel/voxel-mob-system.js";
import { mulberry32 } from "../src/lab/voxel/voxel-noise.js";

const GROUND = 10;
const flat = (x, y) => (Math.floor(y) < GROUND ? BLOCK.STONE : BLOCK.AIR);

function makeSystem(getBlock = flat) {
    return createMobSystem({ getBlock, rng: mulberry32(5) });
}

describe("mob system", () => {
    it("spawns cats up to the hard cap and refuses more", () => {
        const system = makeSystem();
        for (let i = 0; i < MAX_CATS; i += 1) expect(system.spawnCat(i, GROUND, 0, "orange")).not.toBeNull();
        expect(system.spawnCat(99, GROUND, 0, "orange")).toBeNull();
        expect(system.cats).toHaveLength(MAX_CATS);
    });

    it("removes a specific cat and clears the list in place", () => {
        const system = makeSystem();
        const a = system.spawnCat(0, GROUND, 0, "black");
        const b = system.spawnCat(3, GROUND, 0, "white");
        const list = system.cats;
        system.removeCat(a);
        expect(list).toEqual([b]);
        system.removeCat(a);
        expect(list).toHaveLength(1);
        system.clear();
        expect(system.cats).toBe(list);
        expect(list).toHaveLength(0);
    });

    it("measures sky light as full in the open and reduced under cover", () => {
        const roof = (x, y, z) => (Math.floor(y) === GROUND + 4 && Math.floor(x) === 5 ? BLOCK.STONE : flat(x, y, z));
        expect(skyLightAt([0.5, GROUND, 0.5], roof)).toBe(1);
        expect(skyLightAt([5.5, GROUND, 0.5], roof)).toBeLessThan(0.5);
        const canopy = (x, y, z) => (Math.floor(y) === GROUND + 3 ? BLOCK.LEAVES : flat(x, y, z));
        expect(skyLightAt([0.5, GROUND, 0.5], canopy)).toBeLessThan(0.5);
    });

    it("updates cats, keeps them on the ground and eases their light", () => {
        const roof = (x, y, z) => (Math.floor(y) === GROUND + 4 ? BLOCK.STONE : flat(x, y, z));
        const system = makeSystem(roof);
        const cat = system.spawnCat(0.5, GROUND, 0.5, "calico");
        expect(cat.sky).toBeLessThan(0.5);
        cat.sky = 1;
        for (let i = 0; i < 30; i += 1) system.update(1 / 30);
        expect(cat.pos[1]).toBeCloseTo(GROUND, 3);
        expect(cat.sky).toBeLessThan(0.5);
        expect(cat.sky).toBeGreaterThan(0.3);
    });

    it("wanders cats through the shared update without reacting to the player", () => {
        const system = makeSystem();
        const cat = system.spawnCat(0.5, GROUND, 0.5, "orange");
        const seen = new Set();
        for (let i = 0; i < 300; i += 1) {
            system.update(1 / 30);
            seen.add(cat.state);
        }
        expect(seen.has("walk")).toBe(true);
        expect(seen.has("flee")).toBe(false);
    });
});
