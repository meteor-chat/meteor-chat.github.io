import { describe, it, expect } from "vitest";
import { BLOCK, CHUNK_HEIGHT, CHUNK_SIZE, SUB_SIZE, chunkIndex } from "../src/lab/voxel/voxel-blocks.js";
import { buildCameraBasis, extractFrustumPlanes, isBoxInFrustum } from "../src/lab/voxel/voxel-camera.js";
import { propagateColumnLight, updateWorldLight } from "../src/lab/voxel/voxel-light.js";
import { meshSubchunk, packVertex } from "../src/lab/voxel/voxel-mesher.js";
import { raycastVoxel } from "../src/lab/voxel/voxel-raycast.js";
import { computeSkyAtmosphere } from "../src/lab/voxel/voxel-renderer.js";
import { generateVoxelAtlasData } from "../src/lab/voxel/voxel-textures.js";
import { createVoxelWorld } from "../src/lab/voxel/voxel-world.js";
import { generateColumn } from "../src/lab/voxel/voxel-world-gen.js";

describe("Voxel World Engine Core", () => {
    it("packs and unpacks 64-bit vertex attributes without bit overflow across boundaries", () => {
        const [w0, w1] = packVertex(16, 16, 16, 5, 3, 2, 17, 15, 14, 16, 16, 9);
        expect(w0 & 31).toBe(16);
        expect((w0 >>> 5) & 31).toBe(16);
        expect((w0 >>> 10) & 31).toBe(16);
        expect((w0 >>> 15) & 7).toBe(5);
        expect((w0 >>> 18) & 3).toBe(3);
        expect((w0 >>> 20) & 3).toBe(2);
        expect((w0 >>> 22) & 255).toBe(17);
        expect(w1 & 15).toBe(15);
        expect((w1 >>> 4) & 15).toBe(14);
        expect((w1 >>> 8) & 31).toBe(16);
        expect((w1 >>> 13) & 31).toBe(16);
        expect((w1 >>> 18) & 15).toBe(9);
    });

    it("greedy meshes an entire 16x1x16 uniform floor into minimal triangles and culls internal water seams", () => {
        const blocks = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
        for (let z = 0; z < 16; z += 1) {
            for (let x = 0; x < 16; x += 1) {
                blocks[chunkIndex(x, 1, z)] = BLOCK.STONE;
                blocks[chunkIndex(x, 2, z)] = BLOCK.WATER;
            }
        }
        const getBlock = (x, y, z) =>
            x >= 0 && x < 16 && z >= 0 && z < 16 && y >= 0 && y < CHUNK_HEIGHT ? blocks[chunkIndex(x, y, z)] : BLOCK.AIR;
        const getLight = () => 240;

        const res = meshSubchunk(0, getBlock, getLight);
        const opaqueVerts = res.opaque.length / 2;
        const transVerts = res.translucent.length / 2;
        expect(opaqueVerts).toBe(36);
        expect(transVerts).toBe(30);
    });

    it("traverses voxels via 3D DDA and identifies exact face normals while ignoring air and water", () => {
        const blocks = new Map();
        blocks.set("2,10,0", BLOCK.WATER);
        blocks.set("4,10,0", BLOCK.STONE);
        const getBlock = (x, y, z) => blocks.get(`${x},${y},${z}`) || BLOCK.AIR;

        const hit = raycastVoxel([0.5, 10.5, 0.5], [1, 0.01, 0], 10, getBlock);
        expect(hit.hit).toBe(true);
        expect(hit.vx).toBe(4);
        expect(hit.vy).toBe(10);
        expect(hit.vz).toBe(0);
        expect(hit.nx).toBe(-1);
        expect(hit.ny).toBe(0);
        expect(hit.nz).toBe(0);
    });

    it("propagates sunlight and removes emissive torchlight accurately via BFS queues", () => {
        const blocks = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE).fill(BLOCK.STONE);
        const light = new Uint8Array(blocks.length);
        for (let x = 3; x <= 7; x += 1) {
            blocks[chunkIndex(x, 20, 8)] = BLOCK.AIR;
        }
        blocks[chunkIndex(5, 20, 8)] = BLOCK.TORCH;
        propagateColumnLight(blocks, light);

        expect(light[chunkIndex(5, 20, 8)] & 15).toBe(14);
        expect(light[chunkIndex(6, 20, 8)] & 15).toBe(13);
        expect(light[chunkIndex(7, 20, 8)] & 15).toBe(12);

        const col = { cx: 0, cz: 0, blocks, light };
        const getCol = (cx, cz) => (cx === 0 && cz === 0 ? col : null);
        blocks[chunkIndex(5, 20, 8)] = BLOCK.AIR;
        updateWorldLight(getCol, () => {}, 5, 20, 8, BLOCK.TORCH, BLOCK.AIR);
        expect(light[chunkIndex(6, 20, 8)] & 15).toBe(0);
    });

    it("generates terrain columns, procedural 18-layer texture array data, and handles frustum culling", () => {
        const col = generateColumn(0, 0, 2026);
        expect(col.blocks.length).toBe(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
        expect(col.blocks[chunkIndex(0, 0, 0)]).toBe(BLOCK.BEDROCK);

        const atlas = generateVoxelAtlasData();
        expect(atlas.layerCount).toBe(18);
        expect(atlas.data.length).toBe(16 * 16 * 4 * 18);

        const cam = buildCameraBasis([0, 60, 0], 0.4, -0.3, Math.PI / 2, 1.5);
        expect(cam.up[1]).toBeGreaterThan(0.8);
        const dotFU = cam.forward[0] * cam.up[0] + cam.forward[1] * cam.up[1] + cam.forward[2] * cam.up[2];
        expect(Math.abs(dotFU)).toBeLessThan(1e-5);
        const planes = extractFrustumPlanes(cam.viewProj);
        expect(isBoxInFrustum(planes, 0, 50, -20, 16, 66, -4)).toBe(true);
        expect(isBoxInFrustum(planes, -8, 50, 24, 8, 66, 40)).toBe(false);

        const noon = computeSkyAtmosphere(0.3);
        const night = computeSkyAtmosphere(0.88);
        expect(noon.dayIntensity).toBeGreaterThan(night.dayIntensity);
    });

    it("manages synchronous world streaming, block editing, and sub-chunk bounds", () => {
        const world = createVoxelWorld({ seed: 2026, viewRadius: 1, useWorker: false });
        world.warmAreaSync(8, 8, 0);
        expect(world.getColumnCount()).toBe(1);
        expect(world.setBlock(8, 100, 8, BLOCK.TORCH)).toBe(true);
        expect(world.getBlock(8, 100, 8)).toBe(BLOCK.TORCH);
        const meshes = world.consumeMeshes();
        expect(meshes.length).toBeGreaterThan(0);
        expect(SUB_SIZE).toBe(16);
        world.destroy();
    });
});
