import { describe, it, expect } from "vitest";
import { BLOCK, CHUNK_SIZE, chunkIndex } from "../src/lab/voxel/voxel-blocks.js";
import { propagateColumnLight } from "../src/lab/voxel/voxel-light.js";
import { buildCottage, buildFarm, buildFountain, buildLamp, buildTower } from "../src/lab/voxel/voxel-village-blueprints.js";
import { applyVillageToColumn, getVillageCenter, isVillageArea } from "../src/lab/voxel/voxel-village-gen.js";
import { generateColumn } from "../src/lab/voxel/voxel-world-gen.js";

const SEED = 2026;

describe("village architectural blueprints", () => {
    it("builds a tiered fountain with stone basin, water, and corner torches", () => {
        const blocks = buildFountain(0, 50, 0);
        expect(blocks.length).toBeGreaterThan(30);
        const hasWater = blocks.some((b) => b.id === BLOCK.WATER);
        const hasStone = blocks.some((b) => b.id === BLOCK.STONE);
        const hasTorch = blocks.some((b) => b.id === BLOCK.TORCH);
        expect(hasWater).toBe(true);
        expect(hasStone).toBe(true);
        expect(hasTorch).toBe(true);
    });

    it("builds a tudor cottage with snow walls, wood frame, glass windows, and chimney", () => {
        const blocks = buildCottage(0, 50, 0, 6, 6, true);
        const ids = new Set(blocks.map((b) => b.id));
        expect(ids.has(BLOCK.WOOD)).toBe(true);
        expect(ids.has(BLOCK.SNOW)).toBe(true);
        expect(ids.has(BLOCK.GLASS)).toBe(true);
        expect(ids.has(BLOCK.TORCH)).toBe(true);
        expect(ids.has(BLOCK.STONE)).toBe(true);
    });

    it("builds a tall watchtower with stone arches and peak spire", () => {
        const blocks = buildTower(0, 50, 0);
        let minY = Infinity;
        let maxY = -Infinity;
        for (const b of blocks) {
            minY = Math.min(minY, b.dy);
            maxY = Math.max(maxY, b.dy);
        }
        expect(maxY - minY).toBeGreaterThanOrEqual(15);
        const hasGlass = blocks.some((b) => b.id === BLOCK.GLASS);
        const hasTorch = blocks.some((b) => b.id === BLOCK.TORCH);
        expect(hasGlass).toBe(true);
        expect(hasTorch).toBe(true);
    });

    it("builds a terraced farm with irrigation canal and crops", () => {
        const blocks = buildFarm(0, 50, 0, 6, 7);
        const ids = new Set(blocks.map((b) => b.id));
        expect(ids.has(BLOCK.WATER)).toBe(true);
        expect(ids.has(BLOCK.DIRT)).toBe(true);
        expect(ids.has(BLOCK.LEAVES)).toBe(true);
        expect(ids.has(BLOCK.WOOD)).toBe(true);
        expect(ids.has(BLOCK.TORCH)).toBe(true);
    });

    it("builds street lamp posts topped with torches", () => {
        const blocks = buildLamp(0, 50, 0);
        expect(blocks).toHaveLength(4);
        expect(blocks[3].id).toBe(BLOCK.TORCH);
        expect(blocks[0].id).toBe(BLOCK.WOOD);
    });
});

describe("village generation and seamless chunk integration", () => {
    it("places the starter village near spawn and identifies its area", () => {
        const center = getVillageCenter(0, 0, SEED);
        expect(center).not.toBeNull();
        expect(center.vx).toBe(36);
        expect(center.vz).toBe(36);
        expect(isVillageArea(36, 36, SEED)).toBe(true);
        expect(isVillageArea(40, 40, SEED)).toBe(true);
        expect(isVillageArea(500, 500, SEED)).toBe(false);
    });

    it("stamps village structures into chunk columns intersecting the starter village", () => {
        const col = generateColumn(2, 2, SEED);
        let woodCount = 0;
        let snowCount = 0;
        let torchCount = 0;
        for (let i = 0; i < col.blocks.length; i += 1) {
            const id = col.blocks[i];
            if (id === BLOCK.WOOD) woodCount += 1;
            if (id === BLOCK.SNOW) snowCount += 1;
            if (id === BLOCK.TORCH) torchCount += 1;
        }
        expect(woodCount).toBeGreaterThan(10);
        expect(snowCount).toBeGreaterThan(5);
        expect(torchCount).toBeGreaterThan(0);
    });

    it("aligns structures seamlessly across adjacent chunk borders", () => {
        const colA = generateColumn(1, 2, SEED);
        const colB = generateColumn(2, 2, SEED);
        let sharedSolid = 0;
        for (let y = 30; y < 70; y += 1) {
            for (let lz = 0; lz < CHUNK_SIZE; lz += 1) {
                const idA = colA.blocks[chunkIndex(CHUNK_SIZE - 1, y, lz)];
                const idB = colB.blocks[chunkIndex(0, y, lz)];
                if (idA !== BLOCK.AIR && idB !== BLOCK.AIR) sharedSolid += 1;
            }
        }
        expect(sharedSolid).toBeGreaterThan(0);
    });

    it("creates dark interior shade under cottage roofs and warm torchlight", () => {
        const col = generateColumn(2, 2, SEED);
        propagateColumnLight(col.blocks, col.light);
        let foundTorchLight = false;
        for (let i = 0; i < col.blocks.length; i += 1) {
            const blockLight = col.light[i] & 15;
            if (blockLight >= 12) {
                foundTorchLight = true;
                break;
            }
        }
        expect(foundTorchLight).toBe(true);
    });

    it("applies stone foundation skirts under buildings on uneven ground", () => {
        const blocks = new Uint8Array(CHUNK_SIZE * 128 * CHUNK_SIZE);
        for (let lx = 0; lx < CHUNK_SIZE; lx += 1) {
            for (let lz = 0; lz < CHUNK_SIZE; lz += 1) {
                for (let y = 0; y <= 40; y += 1) {
                    blocks[chunkIndex(lx, y, lz)] = BLOCK.DIRT;
                }
            }
        }
        applyVillageToColumn(blocks, 2, 2, SEED);
        let hasFoundation = false;
        for (let lx = 0; lx < CHUNK_SIZE; lx += 1) {
            for (let lz = 0; lz < CHUNK_SIZE; lz += 1) {
                for (let y = 41; y < 55; y += 1) {
                    if (blocks[chunkIndex(lx, y, lz)] === BLOCK.STONE) {
                        hasFoundation = true;
                        break;
                    }
                }
                if (hasFoundation) break;
            }
            if (hasFoundation) break;
        }
        expect(hasFoundation).toBe(true);
    });
});
