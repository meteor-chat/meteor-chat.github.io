import { describe, it, expect } from "vitest";
import { TEX } from "../src/lab/voxel/voxel-blocks.js";
import { tileFbm, tileNoise } from "../src/lab/voxel/voxel-tex-noise.js";
import { bayer, palettePick } from "../src/lab/voxel/voxel-tex-palette.js";
import { generateVoxelAtlasData } from "../src/lab/voxel/voxel-textures.js";

const atlas = generateVoxelAtlasData();
const LAYER = 16 * 16 * 4;

function layerBytes(bytes, layer) {
    return bytes.subarray(layer * LAYER, (layer + 1) * LAYER);
}

function distinctColors(bytes, layer) {
    const seen = new Set();
    const px = layerBytes(bytes, layer);
    for (let i = 0; i < px.length; i += 4) seen.add(`${px[i]},${px[i + 1]},${px[i + 2]}`);
    return seen.size;
}

describe("Voxel procedural noise and palette", () => {
    it("tiles seamlessly: noise repeats exactly after one full tile", () => {
        for (const [u, v] of [[0.13, 0.71], [0.5, 0.02], [0.99, 0.6]]) {
            expect(tileNoise(u + 1, v, 4, 77)).toBeCloseTo(tileNoise(u, v, 4, 77), 10);
            expect(tileNoise(u, v + 1, 4, 77)).toBeCloseTo(tileNoise(u, v, 4, 77), 10);
            expect(tileFbm(u + 1, v + 1, 3, 3, 9)).toBeCloseTo(tileFbm(u, v, 3, 3, 9), 10);
        }
    });

    it("keeps noise within 0..1 and the Bayer matrix within the open unit interval", () => {
        for (let i = 0; i < 200; i += 1) {
            const n = tileFbm(i * 0.0137, i * 0.0291, 4, 3, 5);
            expect(n).toBeGreaterThanOrEqual(0);
            expect(n).toBeLessThanOrEqual(1);
        }
        for (let y = 0; y < 4; y += 1) {
            for (let x = 0; x < 4; x += 1) {
                expect(bayer(x, y)).toBeGreaterThan(0);
                expect(bayer(x, y)).toBeLessThan(1);
            }
        }
    });

    it("picks palette stops inside bounds for out-of-range input", () => {
        const stops = [[1, 1, 1], [2, 2, 2], [3, 3, 3]];
        expect(stops).toContain(palettePick(stops, -4, 3, 3));
        expect(stops).toContain(palettePick(stops, 9, 1, 2));
        expect(palettePick(stops, 0.5, 0, 0)).toHaveLength(3);
    });
});

describe("Voxel procedural atlas", () => {
    it("keeps the public contract and a second map array of equal size", () => {
        expect(atlas.layerCount).toBe(28);
        expect(atlas.tileSize).toBe(16);
        expect(atlas.data.length).toBe(LAYER * 28);
        expect(atlas.maps.length).toBe(LAYER * 28);
    });

    it("is deterministic across generations", () => {
        const again = generateVoxelAtlasData();
        expect(again.data).toEqual(atlas.data);
        expect(again.maps).toEqual(atlas.maps);
    });

    it("gives every layer a varied palette instead of a flat color", () => {
        for (let layer = 0; layer < 28; layer += 1) {
            expect(distinctColors(atlas.data, layer), `layer ${layer}`).toBeGreaterThanOrEqual(3);
        }
    });

    it("encodes unit-length tangent normals for every texel", () => {
        for (let i = 0; i < atlas.maps.length; i += 4) {
            const nx = (atlas.maps[i] / 255) * 2 - 1;
            const ny = (atlas.maps[i + 1] / 255) * 2 - 1;
            expect(nx * nx + ny * ny).toBeLessThanOrEqual(1.02);
        }
    });

    it("produces real surface relief on stone and nearly flat normals on water", () => {
        const spread = (layer) => {
            const px = layerBytes(atlas.maps, layer);
            let sum = 0;
            for (let i = 0; i < px.length; i += 4) sum += Math.abs(px[i] - 128) + Math.abs(px[i + 1] - 128);
            return sum / (px.length / 4);
        };
        expect(spread(TEX.STONE)).toBeGreaterThan(spread(TEX.WATER) * 2);
    });

    it("keeps opaque blocks opaque, translucent blocks translucent, and leaves with cutout holes", () => {
        const alphas = (layer) => {
            const px = layerBytes(atlas.data, layer);
            const list = [];
            for (let i = 3; i < px.length; i += 4) list.push(px[i]);
            return list;
        };
        for (const layer of [TEX.STONE, TEX.DIRT, TEX.GRASS_TOP, TEX.WOOD_SIDE]) {
            expect(Math.min(...alphas(layer)), `layer ${layer}`).toBe(255);
        }
        expect(Math.max(...alphas(TEX.WATER))).toBeLessThan(255);
        expect(Math.max(...alphas(TEX.GLASS))).toBeLessThan(255);
        const leaf = alphas(TEX.LEAVES);
        const holes = leaf.filter((a) => a === 0).length;
        expect(holes).toBeGreaterThan(0);
        expect(holes).toBeLessThan(leaf.length * 0.2);
    });

    it("marks lava, torch flame, and gold flecks as emissive but never plain stone", () => {
        const emissive = (layer) => {
            const px = layerBytes(atlas.maps, layer);
            let peak = 0;
            for (let i = 3; i < px.length; i += 4) peak = Math.max(peak, px[i]);
            return peak;
        };
        expect(emissive(TEX.LAVA)).toBeGreaterThan(190);
        expect(emissive(TEX.TORCH)).toBe(255);
        expect(emissive(TEX.GOLD_ORE)).toBeGreaterThan(0);
        expect(emissive(TEX.STONE)).toBe(0);
    });

    it("draws a green fringe above dirt on grass side tiles", () => {
        const px = layerBytes(atlas.data, TEX.GRASS_SIDE);
        const rowAverage = (y) => {
            let r = 0;
            let g = 0;
            for (let x = 0; x < 16; x += 1) {
                r += px[(y * 16 + x) * 4];
                g += px[(y * 16 + x) * 4 + 1];
            }
            return { r: r / 16, g: g / 16 };
        };
        const top = rowAverage(15);
        const bottom = rowAverage(0);
        expect(top.g).toBeGreaterThan(top.r);
        expect(bottom.r).toBeGreaterThan(bottom.g);
    });
});
