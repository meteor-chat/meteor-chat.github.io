import { describe, it, expect } from "vitest";
import { TEX } from "../src/lab/voxel/voxel-blocks.js";
import { generateVoxelAtlasData } from "../src/lab/voxel/voxel-textures.js";

const atlas = generateVoxelAtlasData();
const LAYER = 16 * 16 * 4;
const BLOCK_LAYERS = 18;
const FUR = {
    orange: TEX.CAT_FUR_ORANGE,
    black: TEX.CAT_FUR_BLACK,
    calico: TEX.CAT_FUR_CALICO,
    white: TEX.CAT_FUR_WHITE,
    sand: TEX.CAT_FUR_SAND
};
const FACE = {
    orange: TEX.CAT_FACE_ORANGE,
    black: TEX.CAT_FACE_BLACK,
    calico: TEX.CAT_FACE_CALICO,
    white: TEX.CAT_FACE_WHITE,
    sand: TEX.CAT_FACE_SAND
};

const layerOf = (bytes, layer) => bytes.subarray(layer * LAYER, (layer + 1) * LAYER);

function fnv(bytes) {
    let h = 2166136261;
    for (let i = 0; i < bytes.length; i += 1) {
        h ^= bytes[i];
        h = Math.imul(h, 16777619) >>> 0;
    }
    return h;
}

function averageColor(layer) {
    const px = layerOf(atlas.data, layer);
    const sum = [0, 0, 0];
    for (let i = 0; i < px.length; i += 4) {
        sum[0] += px[i];
        sum[1] += px[i + 1];
        sum[2] += px[i + 2];
    }
    const n = px.length / 4;
    return sum.map((v) => v / n);
}

function distinct(layer) {
    const seen = new Set();
    const px = layerOf(atlas.data, layer);
    for (let i = 0; i < px.length; i += 4) seen.add(`${px[i]},${px[i + 1]},${px[i + 2]}`);
    return seen.size;
}

describe("cat textures", () => {
    it("appends ten layers after the block layers without moving them", () => {
        expect(atlas.layerCount).toBe(28);
        expect(TEX.CACTUS).toBe(17);
        expect(TEX.GRASS_TOP).toBe(0);
        const all = [...Object.values(FUR), ...Object.values(FACE)];
        expect(new Set(all).size).toBe(10);
        for (const layer of all) {
            expect(layer).toBeGreaterThanOrEqual(BLOCK_LAYERS);
            expect(layer).toBeLessThanOrEqual(255);
        }
    });

    it("leaves every original block layer byte for byte unchanged", () => {
        const blockData = atlas.data.subarray(0, LAYER * BLOCK_LAYERS);
        const blockMaps = atlas.maps.subarray(0, LAYER * BLOCK_LAYERS);
        expect(fnv(blockData)).toBe(2070161302);
        expect(fnv(blockMaps)).toBe(610408556);
    });

    it("is deterministic across generations", () => {
        const again = generateVoxelAtlasData();
        expect(again.data).toEqual(atlas.data);
        expect(again.maps).toEqual(atlas.maps);
    });

    it("keeps every cat layer opaque and varied", () => {
        for (const layer of [...Object.values(FUR), ...Object.values(FACE)]) {
            const px = layerOf(atlas.data, layer);
            for (let i = 3; i < px.length; i += 4) expect(px[i], `layer ${layer}`).toBe(255);
            expect(distinct(layer), `layer ${layer}`).toBeGreaterThanOrEqual(3);
        }
    });

    it("colors each fur according to its variant", () => {
        const orange = averageColor(FUR.orange);
        expect(orange[0]).toBeGreaterThan(orange[2] * 1.6);
        expect(orange[0]).toBeGreaterThan(orange[1]);
        const black = averageColor(FUR.black);
        expect(Math.max(...black)).toBeLessThan(70);
        const white = averageColor(FUR.white);
        expect(Math.min(...white)).toBeGreaterThan(190);
        const sand = averageColor(FUR.sand);
        expect(sand[0]).toBeGreaterThan(sand[2]);
        expect(sand[0]).toBeGreaterThan(150);
        expect(sand[0]).toBeLessThan(235);
    });

    it("mixes orange, white and black patches on the calico fur", () => {
        const px = layerOf(atlas.data, FUR.calico);
        let dark = 0;
        let light = 0;
        let warm = 0;
        for (let i = 0; i < px.length; i += 4) {
            const lum = px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11;
            if (lum < 70) dark += 1;
            if (lum > 190) light += 1;
            if (px[i] > px[i + 2] * 1.6 && lum >= 70 && lum <= 190) warm += 1;
        }
        expect(dark).toBeGreaterThan(8);
        expect(light).toBeGreaterThan(8);
        expect(warm).toBeGreaterThan(8);
    });

    it("draws two glowing eyes, a nose and a mouth on every face", () => {
        for (const variant of Object.keys(FACE)) {
            const colors = layerOf(atlas.data, FACE[variant]);
            const maps = layerOf(atlas.maps, FACE[variant]);
            let glowing = 0;
            for (let i = 3; i < maps.length; i += 4) if (maps[i] > 0) glowing += 1;
            expect(glowing, variant).toBeGreaterThanOrEqual(6);
            const at = (x, y) => (y * 16 + x) * 4;
            const nose = at(7, 6);
            expect(colors[nose], variant).toBeGreaterThan(200);
            const mouth = at(7, 4);
            expect(colors[mouth], variant).toBeLessThan(100);
            const fur = layerOf(atlas.data, FUR[variant]);
            const furPixel = at(0, 0);
            expect(colors[furPixel]).toBe(fur[furPixel]);
        }
    });

    it("keeps the fur normals unit length", () => {
        for (const layer of Object.values(FUR)) {
            const px = layerOf(atlas.maps, layer);
            for (let i = 0; i < px.length; i += 4) {
                const nx = (px[i] / 255) * 2 - 1;
                const ny = (px[i + 1] / 255) * 2 - 1;
                expect(nx * nx + ny * ny).toBeLessThanOrEqual(1.02);
            }
        }
    });
});
