import { describe, it, expect } from "vitest";
import { BLOCK } from "../src/lab/voxel/voxel-blocks.js";
import { createCat } from "../src/lab/voxel/voxel-mob-cat-ai.js";
import { FLOATS_PER_CAT, MAX_CATS } from "../src/lab/voxel/voxel-mob-cat-model.js";
import {
    BLOB_FLOATS_PER_VERTEX,
    BLOB_VERTS_PER_CAT,
    blobAlpha,
    fillBlobStage,
    sunPowerOf
} from "../src/lab/voxel/voxel-mob-blob.js";
import { createMobSystem, groundBelow } from "../src/lab/voxel/voxel-mob-system.js";
import { mulberry32 } from "../src/lab/voxel/voxel-noise.js";

const FOG = [24, 48];
const EYE = [0, 52, 0];

function makeCat(x = 3, z = 3, overrides = {}) {
    const cat = createCat(x, 50, z, "orange", () => 0.5);
    cat.yaw = 0;
    cat.groundY = 50;
    return Object.assign(cat, overrides);
}

const stageOf = () => new Float32Array(MAX_CATS * BLOB_VERTS_PER_CAT * BLOB_FLOATS_PER_VERTEX);

describe("blob shadow strength", () => {
    it("follows the sun elevation smoothly from night to day", () => {
        expect(sunPowerOf(-0.5)).toBe(0);
        expect(sunPowerOf(0.5)).toBe(1);
        const dawn = sunPowerOf(0.05);
        expect(dawn).toBeGreaterThan(0);
        expect(dawn).toBeLessThan(1);
        expect(sunPowerOf(0.1)).toBeGreaterThan(sunPowerOf(0.0));
    });

    it("fades with height above the ground and with fog distance", () => {
        const grounded = blobAlpha(makeCat(), 10, 1, FOG);
        const hopping = blobAlpha(makeCat(3, 3, { pos: [3, 51.2, 3] }), 10, 1, FOG);
        const flying = blobAlpha(makeCat(3, 3, { pos: [3, 54, 3] }), 10, 1, FOG);
        expect(grounded).toBeGreaterThan(0.3);
        expect(hopping).toBeLessThan(grounded);
        expect(hopping).toBeGreaterThan(0);
        expect(flying).toBe(0);
        expect(blobAlpha(makeCat(), 36, 1, FOG)).toBeLessThan(grounded);
        expect(blobAlpha(makeCat(), 60, 1, FOG)).toBe(0);
        expect(blobAlpha(makeCat(), 10, 0, FOG)).toBe(0);
    });
});

describe("blob geometry", () => {
    it("writes one flat quad per cat just above the ground", () => {
        const stage = stageOf();
        const filled = fillBlobStage([makeCat(), makeCat(6, 2)], EYE, 1, FOG, stage);
        expect(filled.count).toBe(2);
        expect(filled.floats).toBe(2 * BLOB_VERTS_PER_CAT * BLOB_FLOATS_PER_VERTEX);
        for (let v = 0; v < filled.floats / BLOB_FLOATS_PER_VERTEX; v += 1) {
            const o = v * BLOB_FLOATS_PER_VERTEX;
            expect(stage[o + 1]).toBeCloseTo(50.02, 5);
            expect(Math.abs(stage[o + 3])).toBe(1);
            expect(Math.abs(stage[o + 4])).toBe(1);
            expect(stage[o + 5]).toBeGreaterThan(0);
        }
    });

    it("stretches along the facing direction and shrinks while sitting", () => {
        const span = (cat) => {
            const stage = stageOf();
            fillBlobStage([cat], EYE, 1, FOG, stage);
            const xs = [];
            const zs = [];
            for (let v = 0; v < BLOB_VERTS_PER_CAT; v += 1) {
                xs.push(stage[v * BLOB_FLOATS_PER_VERTEX] - cat.pos[0]);
                zs.push(stage[v * BLOB_FLOATS_PER_VERTEX + 2] - cat.pos[2]);
            }
            return [Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs)];
        };
        const north = span(makeCat(3, 3, { yaw: 0 }));
        expect(north[1]).toBeGreaterThan(north[0]);
        const east = span(makeCat(3, 3, { yaw: Math.PI / 2 }));
        expect(east[0]).toBeGreaterThan(east[1]);
        const sitting = span(makeCat(3, 3, { yaw: 0, anim: { phase: 0, moving: 0, sit: 1 } }));
        expect(sitting[1]).toBeLessThan(north[1]);
    });

    it("skips everything at night and cats beyond the draw distance", () => {
        const stage = stageOf();
        expect(fillBlobStage([makeCat()], EYE, 0, FOG, stage).count).toBe(0);
        expect(fillBlobStage([makeCat(300, 300)], EYE, 1, FOG, stage).count).toBe(0);
    });

    it("never writes more than the batch capacity", () => {
        const cats = Array.from({ length: MAX_CATS + 5 }, (_, i) => makeCat(2 + i * 0.1, 3));
        const filled = fillBlobStage(cats, EYE, 1, FOG, stageOf());
        expect(filled.count).toBe(MAX_CATS);
        expect(FLOATS_PER_CAT).toBeGreaterThan(0);
    });
});

describe("ground detection", () => {
    const ground = (x, y) => (Math.floor(y) < 50 ? BLOCK.STONE : BLOCK.AIR);

    it("finds the top of the solid block below the feet", () => {
        expect(groundBelow([0.5, 50, 0.5], ground)).toBe(50);
        expect(groundBelow([0.5, 51.4, 0.5], ground)).toBe(50);
        expect(groundBelow([0.5, 54, 0.5], ground)).toBe(50);
    });

    it("ignores water and reports a far ground when nothing solid is below", () => {
        const water = (x, y) => (Math.floor(y) < 50 ? BLOCK.WATER : BLOCK.AIR);
        expect(groundBelow([0.5, 50, 0.5], water)).toBeLessThan(50 - 8);
    });

    it("keeps the cached ground height current while cats move", () => {
        const stairs = (x, y) => (Math.floor(y) < (x >= 2 ? 51 : 50) ? BLOCK.STONE : BLOCK.AIR);
        const system = createMobSystem({ getBlock: stairs, rng: mulberry32(1) });
        const cat = system.spawnCat(0.5, 50, 0.5, "orange");
        expect(cat.groundY).toBe(50);
        cat.pos[0] = 3.5;
        cat.pos[1] = 51;
        system.update(1 / 60, [99, 51, 99]);
        expect(cat.groundY).toBe(51);
    });
});
