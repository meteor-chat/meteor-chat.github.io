import { describe, it, expect } from "vitest";
import { BLOCK, CHUNK_SIZE, chunkIndex } from "../src/lab/voxel/voxel-blocks.js";
import { propagateColumnLight } from "../src/lab/voxel/voxel-light.js";
import { meshSubchunk } from "../src/lab/voxel/voxel-mesher.js";
import { createGolem, stepGolem } from "../src/lab/voxel/voxel-mob-golem-ai.js";
import { buildGolemVertices, FLOATS_PER_GOLEM } from "../src/lab/voxel/voxel-mob-golem-model.js";
import { createVillager, stepVillager, VILLAGER_PROFESSIONS, VILLAGER_STATE } from "../src/lab/voxel/voxel-mob-villager-ai.js";
import { buildVillagerVertices, FLOATS_PER_VILLAGER } from "../src/lab/voxel/voxel-mob-villager-model.js";
import { mulberry32 } from "../src/lab/voxel/voxel-noise.js";
import { buildArchBridge, buildCottage, buildFarm, buildFountain, buildLamp, buildTower, buildWindmill } from "../src/lab/voxel/voxel-village-blueprints.js";
import { applyVillageToColumn, getVillageCenter, getVillageMeta, getVillagePlan, isVillageArea } from "../src/lab/voxel/voxel-village-gen.js";
import { generateColumn } from "../src/lab/voxel/voxel-world-gen.js";

const SEED = 2026;

describe("village architectural blueprints", () => {
    it("builds a tiered fountain with stone brick basin, water, and corner torches", () => {
        const blocks = buildFountain(0, 50, 0);
        expect(blocks.length).toBeGreaterThan(30);
        const hasWater = blocks.some((b) => b.id === BLOCK.WATER);
        const hasStoneBrick = blocks.some((b) => b.id === BLOCK.STONE_BRICK);
        const hasCobble = blocks.some((b) => b.id === BLOCK.COBBLESTONE);
        const hasTorch = blocks.some((b) => b.id === BLOCK.TORCH);
        expect(hasWater).toBe(true);
        expect(hasStoneBrick).toBe(true);
        expect(hasCobble).toBe(true);
        expect(hasTorch).toBe(true);
    });

    it("builds a tudor cottage with plaster walls, wood frame, red tile roof, and chimney", () => {
        const blocks = buildCottage(0, 50, 0, 6, 6, true);
        const ids = new Set(blocks.map((b) => b.id));
        expect(ids.has(BLOCK.WOOD)).toBe(true);
        expect(ids.has(BLOCK.PLASTER)).toBe(true);
        expect(ids.has(BLOCK.ROOF_RED)).toBe(true);
        expect(ids.has(BLOCK.WOOD_PLANKS)).toBe(true);
        expect(ids.has(BLOCK.STONE_BRICK)).toBe(true);
        expect(ids.has(BLOCK.GLASS)).toBe(true);
        expect(ids.has(BLOCK.TORCH)).toBe(true);
        expect(ids.has(BLOCK.COBBLESTONE)).toBe(true);
    });

    it("builds a rustic windmill with rotating sails and stacked hay bales", () => {
        const blocks = buildWindmill(0, 50, 0);
        const ids = new Set(blocks.map((b) => b.id));
        expect(ids.has(BLOCK.STONE_BRICK)).toBe(true);
        expect(ids.has(BLOCK.PLASTER)).toBe(true);
        expect(ids.has(BLOCK.ROOF_RED)).toBe(true);
        expect(ids.has(BLOCK.WOOD_PLANKS)).toBe(true);
        expect(ids.has(BLOCK.HAY_BALE)).toBe(true);
        expect(ids.has(BLOCK.TORCH)).toBe(true);
        let minY = Infinity;
        let maxY = -Infinity;
        for (const b of blocks) {
            minY = Math.min(minY, b.dy);
            maxY = Math.max(maxY, b.dy);
        }
        expect(maxY - minY).toBeGreaterThanOrEqual(12);
    });

    it("builds a tall citadel watchtower with stone bricks and green copper spire", () => {
        const blocks = buildTower(0, 50, 0);
        let minY = Infinity;
        let maxY = -Infinity;
        for (const b of blocks) {
            minY = Math.min(minY, b.dy);
            maxY = Math.max(maxY, b.dy);
        }
        expect(maxY - minY).toBeGreaterThanOrEqual(15);
        const ids = new Set(blocks.map((b) => b.id));
        expect(ids.has(BLOCK.STONE_BRICK)).toBe(true);
        expect(ids.has(BLOCK.ROOF_GREEN)).toBe(true);
        expect(ids.has(BLOCK.GLASS)).toBe(true);
        expect(ids.has(BLOCK.TORCH)).toBe(true);
    });

    it("builds a terraced farm with stone brick borders and golden wheat crops", () => {
        const blocks = buildFarm(0, 50, 0, 6, 7);
        const ids = new Set(blocks.map((b) => b.id));
        expect(ids.has(BLOCK.WATER)).toBe(true);
        expect(ids.has(BLOCK.DIRT)).toBe(true);
        expect(ids.has(BLOCK.WHEAT)).toBe(true);
        expect(ids.has(BLOCK.STONE_BRICK)).toBe(true);
        expect(ids.has(BLOCK.HAY_BALE)).toBe(true);
        expect(ids.has(BLOCK.TORCH)).toBe(true);
    });

    it("builds an arch stone bridge spanning terrain", () => {
        const blocks = buildArchBridge(0, 50, 0, 7);
        expect(blocks.length).toBeGreaterThan(20);
        const ids = new Set(blocks.map((b) => b.id));
        expect(ids.has(BLOCK.STONE_BRICK)).toBe(true);
        expect(ids.has(BLOCK.COBBLESTONE)).toBe(true);
    });

    it("builds street lamp posts with stone brick base and torches", () => {
        const blocks = buildLamp(0, 50, 0);
        expect(blocks).toHaveLength(4);
        expect(blocks[3].id).toBe(BLOCK.TORCH);
        expect(blocks[0].id).toBe(BLOCK.STONE_BRICK);
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

    it("stamps village structures into chunk columns with rich block composition", () => {
        const col = generateColumn(2, 2, SEED);
        let brickCount = 0;
        let plasterCount = 0;
        let roofCount = 0;
        let torchCount = 0;
        for (let i = 0; i < col.blocks.length; i += 1) {
            const id = col.blocks[i];
            if (id === BLOCK.STONE_BRICK) brickCount += 1;
            if (id === BLOCK.PLASTER) plasterCount += 1;
            if (id === BLOCK.ROOF_RED || id === BLOCK.ROOF_GREEN) roofCount += 1;
            if (id === BLOCK.TORCH) torchCount += 1;
        }
        expect(brickCount).toBeGreaterThan(10);
        expect(plasterCount).toBeGreaterThan(5);
        expect(roofCount).toBeGreaterThan(5);
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

    it("applies stone brick foundation skirts under buildings on uneven ground", () => {
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
                    if (blocks[chunkIndex(lx, y, lz)] === BLOCK.STONE_BRICK) {
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

    it("generates a dense multi-tier coastal hillside town with diverse landmarks and zero building overlaps", () => {
        const plan = getVillagePlan(36, 36, SEED);
        const meta = getVillageMeta(36, 36, SEED);
        expect(plan.buildings.length).toBeGreaterThanOrEqual(40);
        expect(plan.chunkBuckets.size).toBeGreaterThan(20);
        expect(meta.chimneys.length).toBeGreaterThanOrEqual(10);
        expect(meta.pois.length).toBeGreaterThanOrEqual(30);

        const kinds = new Set(plan.buildings.map((b) => b.kind));
        expect(kinds.has("home")).toBe(true);
        expect(kinds.has("church")).toBe(true);
        expect(kinds.has("forge")).toBe(true);
        expect(kinds.has("market")).toBe(true);
        expect(kinds.has("dock")).toBe(true);
        expect(kinds.has("farm")).toBe(true);

        const ys = plan.buildings.map((b) => b.floorY);
        expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThanOrEqual(12);

        for (let i = 0; i < plan.buildings.length; i += 1) {
            const a = plan.buildings[i];
            for (let j = i + 1; j < plan.buildings.length; j += 1) {
                const b = plan.buildings[j];
                const overlaps = a.x0 <= b.x1 && a.x1 >= b.x0 && a.z0 <= b.z1 && a.z1 >= b.z0;
                expect(overlaps, `overlap between ${a.kind} and ${b.kind}`).toBe(false);
            }
        }
    });

    it("meshes waterlogged seagrass without internal water bubble faces and emits lantern light", () => {
        const blocks = new Uint8Array(CHUNK_SIZE * 128 * CHUNK_SIZE);
        const light = new Uint8Array(blocks.length);
        for (let z = 4; z <= 10; z += 1) {
            for (let x = 4; x <= 10; x += 1) {
                blocks[chunkIndex(x, 38, z)] = BLOCK.SAND;
                blocks[chunkIndex(x, 39, z)] = BLOCK.WATER;
                blocks[chunkIndex(x, 40, z)] = BLOCK.WATER;
            }
        }
        blocks[chunkIndex(7, 39, 7)] = BLOCK.SEAGRASS;
        blocks[chunkIndex(7, 45, 7)] = BLOCK.LANTERN;
        propagateColumnLight(blocks, light);
        expect(light[chunkIndex(7, 45, 7)] & 15).toBe(15);

        const gBlock = (x, y, z) =>
            x >= 0 && x < CHUNK_SIZE && z >= 0 && z < CHUNK_SIZE && y >= 0 && y < 128
                ? blocks[chunkIndex(x, y, z)]
                : BLOCK.AIR;
        const gLight = (x, y, z) =>
            x >= 0 && x < CHUNK_SIZE && z >= 0 && z < CHUNK_SIZE && y >= 0 && y < 128
                ? light[chunkIndex(x, y, z)]
                : 240;

        const subWater = meshSubchunk(2, gBlock, gLight);
        expect(subWater.cutout.length).toBeGreaterThan(0);

        const waterOnly = new Uint8Array(blocks);
        waterOnly[chunkIndex(7, 39, 7)] = BLOCK.WATER;
        const gWaterOnly = (x, y, z) =>
            x >= 0 && x < CHUNK_SIZE && z >= 0 && z < CHUNK_SIZE && y >= 0 && y < 128
                ? waterOnly[chunkIndex(x, y, z)]
                : BLOCK.AIR;
        const refWater = meshSubchunk(2, gWaterOnly, gLight);
        expect(subWater.translucent.length).toBeLessThanOrEqual(refWater.translucent.length);
    });

    it("drives profession villagers with social chat and builds Iron Golem patrol geometry", () => {
        const flat = (x, y) => (Math.floor(y) < 50 ? BLOCK.COBBLESTONE : BLOCK.AIR);
        const rng = mulberry32(42);
        const pois = [
            { type: "plaza", x: 10, y: 50, z: 10 },
            { type: "forge", x: 18, y: 50, z: 10 }
        ];
        const a = createVillager(10.5, 50, 10.5, 10, 10, rng, { variant: "blacksmith", pois });
        const b = createVillager(12.2, 50, 10.5, 10, 10, rng, { variant: "farmer", pois });
        a.chatCooldown = 0;
        a.timer = 0;
        const ctx = { rng: () => 0.1, getBlock: flat, frozen: false, playerPos: null, isNight: false, villagers: [a, b] };
        stepVillager(a, 0.05, ctx);
        expect(a.state).toBe(VILLAGER_STATE.CHAT);
        expect(VILLAGER_PROFESSIONS).toContain(b.variant);

        const vBuf = new Float32Array(FLOATS_PER_VILLAGER);
        expect(buildVillagerVertices(b, 1.2, vBuf, 0)).toBe(FLOATS_PER_VILLAGER);

        const golem = createGolem(10.5, 50, 14.5, 10, 10, rng, pois);
        for (let i = 0; i < 30; i += 1) {
            stepGolem(golem, 0.05, { rng, getBlock: flat, frozen: false, playerPos: [14, 50, 14] });
        }
        expect(golem.pos[1]).toBeCloseTo(50, 2);
        const gBuf = new Float32Array(FLOATS_PER_GOLEM);
        expect(buildGolemVertices(golem, 1.5, gBuf, 0)).toBe(FLOATS_PER_GOLEM);
    });
});
