import { describe, it, expect, vi } from "vitest";
import { createVoxelAudio } from "../src/lab/voxel/voxel-audio.js";
import { BLOCK, BLOCK_CATALOG, CHUNK_HEIGHT, CHUNK_SIZE, chunkIndex } from "../src/lab/voxel/voxel-blocks.js";
import { createVoxelHand } from "../src/lab/voxel/voxel-hand.js";
import { createVoxelInput } from "../src/lab/voxel/voxel-input.js";
import { propagateColumnLight, stitchColumnLight, updateWorldLight } from "../src/lab/voxel/voxel-light.js";
import { meshSubchunk } from "../src/lab/voxel/voxel-mesher.js";
import { chickenPose } from "../src/lab/voxel/voxel-mob-chicken-model.js";
import { createVillager, stepVillager } from "../src/lab/voxel/voxel-mob-villager-ai.js";
import {
    buildVillagerVertices,
    FLOATS_PER_VERTEX,
    FLOATS_PER_VILLAGER,
    VERTS_PER_VILLAGER
} from "../src/lab/voxel/voxel-mob-villager-model.js";
import { mulberry32 } from "../src/lab/voxel/voxel-noise.js";
import { createVoxelParticles } from "../src/lab/voxel/voxel-particles.js";
import { stepPlayerPhysics } from "../src/lab/voxel/voxel-physics.js";
import { COMPOSITE_FS } from "../src/lab/voxel/voxel-shaders-fx.js";
import { WORLD_FS } from "../src/lab/voxel/voxel-shaders-world.js";
import { createWorldStorage } from "../src/lab/voxel/voxel-storage.js";
import { buildCottage } from "../src/lab/voxel/voxel-village-blueprints.js";
import { getVillageCenter } from "../src/lab/voxel/voxel-village-gen.js";

describe("Voxel upgrade regressions", () => {
    it("prevents high-speed falling from tunneling through a single-block floor", () => {
        const floor = (_x, y) => (Math.floor(y) === 10 ? BLOCK.STONE : BLOCK.AIR);
        const player = { pos: [0.5, 11.4, 0.5], vel: [0, -54, 0], yaw: 0, pitch: 0, flyMode: false, onGround: false };
        stepPlayerPhysics(player, new Set(), 0.05, floor);
        expect(player.pos[1]).toBeGreaterThanOrEqual(11);
        expect(player.onGround).toBe(true);
    });

    it("prevents walking off a ledge while sneaking", () => {
        const ledge = (_x, y, z) => (Math.floor(z) >= 0 && Math.floor(y) < 10 ? BLOCK.STONE : BLOCK.AIR);
        const player = { pos: [0.5, 10, 0.5], vel: [0, 0, 0], yaw: 0, pitch: 0, flyMode: false, onGround: true };
        const held = new Set(["KeyW", "ShiftLeft"]);
        for (let i = 0; i < 120; i += 1) stepPlayerPhysics(player, held, 1 / 60, ledge);
        expect(player.pos[1]).toBeCloseTo(10, 2);
        expect(player.pos[2]).toBeGreaterThan(-0.35);
    });

    it("toggles fly mode on double-tap Space and toggles catalog on E", () => {
        const canvas = document.createElement("canvas");
        const player = { flyMode: false };
        const state = { selectedSlot: 0, actionMode: "break", catalogOpen: false };
        const hud = { syncHud: vi.fn() };
        const onToggleCatalog = vi.fn();
        const input = createVoxelInput({
            canvas,
            player,
            state,
            hud,
            performBlockAction: vi.fn(),
            onToggleCatalog
        });
        window.dispatchEvent(new window.KeyboardEvent("keydown", { code: "Space" }));
        window.dispatchEvent(new window.KeyboardEvent("keyup", { code: "Space" }));
        window.dispatchEvent(new window.KeyboardEvent("keydown", { code: "Space" }));
        expect(player.flyMode).toBe(true);
        window.dispatchEvent(new window.KeyboardEvent("keydown", { code: "KeyE" }));
        expect(onToggleCatalog).toHaveBeenCalledTimes(1);
        input.destroy();
    });

    it("uses unsigned hash shifts in getVillageCenter so negative region coords stay inside their region", () => {
        for (let rx = -12; rx <= 12; rx += 1) {
            for (let rz = -12; rz <= 12; rz += 1) {
                if (rx === 0 && rz === 0) continue;
                const v = getVillageCenter(rx, rz, 2026);
                if (!v) continue;
                expect(v.vx).toBeGreaterThanOrEqual((rx * 24 + 4) * CHUNK_SIZE);
                expect(v.vx).toBeLessThan((rx * 24 + 20) * CHUNK_SIZE);
                expect(v.vz).toBeGreaterThanOrEqual((rz * 24 + 4) * CHUNK_SIZE);
                expect(v.vz).toBeLessThan((rz * 24 + 20) * CHUNK_SIZE);
            }
        }
    });

    it("builds cottage doorways with full two-block vertical clearance above the floor", () => {
        const blocks = buildCottage(10, 50, 10, 7, 7, true, "south");
        const map = new Map();
        for (const b of blocks) map.set(`${b.dx},${b.dy},${b.dz}`, b.id);
        expect(map.get("13,50,15")).toBe(BLOCK.WOOD_PLANKS);
        expect(map.get("13,50,16")).toBe(BLOCK.STONE_BRICK);
        expect(map.get("13,51,16") ?? BLOCK.AIR).toBe(BLOCK.AIR);
        expect(map.get("13,52,16") ?? BLOCK.AIR).toBe(BLOCK.AIR);
        expect(map.get("13,53,16")).not.toBe(BLOCK.AIR);
    });

    it("attenuates skylight below leaves, stitches cross-chunk light, and preserves neighboring torches", () => {
        const mkCol = () => ({
            blocks: new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE),
            light: new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE)
        });
        const c0 = mkCol();
        const c1 = mkCol();
        c0.blocks[chunkIndex(15, 20, 8)] = BLOCK.TORCH;
        propagateColumnLight(c0.blocks, c0.light);
        propagateColumnLight(c1.blocks, c1.light);
        const cols = new Map([["0,0", c0], ["1,0", c1]]);
        const getCol = (cx, cz) => cols.get(`${cx},${cz}`) || null;
        stitchColumnLight(getCol, () => {}, 0, 0);
        expect(c1.light[chunkIndex(0, 20, 8)] & 15).toBeGreaterThan(10);

        c0.blocks[chunkIndex(8, 20, 8)] = BLOCK.TORCH;
        c0.blocks[chunkIndex(9, 20, 8)] = BLOCK.LAVA;
        propagateColumnLight(c0.blocks, c0.light);
        c0.blocks[chunkIndex(9, 20, 8)] = BLOCK.AIR;
        updateWorldLight(getCol, () => {}, 9, 20, 8, BLOCK.LAVA, BLOCK.AIR);
        expect(c0.light[chunkIndex(8, 20, 8)] & 15).toBe(14);
        expect(c0.light[chunkIndex(9, 20, 8)] & 15).toBeGreaterThanOrEqual(12);
    });

    it("separates opaque, cutout, and translucent meshes with tight bounds", () => {
        const getBlock = (x, y, z) => {
            if (x === 4 && y === 4 && z === 4) return BLOCK.STONE;
            if (x === 6 && y === 4 && z === 4) return BLOCK.TORCH;
            if (x === 8 && y === 4 && z === 4) return BLOCK.TALL_GRASS;
            if (x === 10 && y === 4 && z === 4) return BLOCK.WATER;
            return BLOCK.AIR;
        };
        const res = meshSubchunk(0, getBlock, () => 240);
        expect(res.opaque.length).toBeGreaterThan(0);
        expect(res.cutout.length).toBeGreaterThan(0);
        expect(res.translucent.length).toBeGreaterThan(0);
        expect(res.bounds).not.toBeNull();
        expect(res.bounds[0]).toBeGreaterThanOrEqual(4);
        expect(res.bounds[3]).toBeLessThanOrEqual(11);
    });

    it("keeps Early-Z opaque WORLD_FS free of discard and fract(vUv) and uses downward rain", () => {
        expect(WORLD_FS).not.toContain("discard");
        expect(WORLD_FS).not.toContain("fract(vUv)");
        expect(COMPOSITE_FS).toContain("(p.y + uTime * speed)");
    });

    it("pitches chicken head downward during peck and flaps wings strictly outward", () => {
        const peckPose = chickenPose({ anim: { phase: 0, moving: 0, peck: 1, flutter: 0 }, phaseSeed: 0 }, 0.2);
        expect(peckPose.head.rx).toBeLessThan(-0.3);
        for (let t = 0; t < 2; t += 0.13) {
            const glidePose = chickenPose({ anim: { phase: 0, moving: 0, peck: 0, flutter: 1 }, phaseSeed: 0 }, t);
            expect(glidePose.wingL.rz).toBeLessThanOrEqual(1e-6);
            expect(glidePose.wingR.rz).toBeGreaterThanOrEqual(-1e-6);
        }
    });

    it("builds finite CCW-wound Villager geometry and runs Villager AI cleanly", () => {
        const rng = mulberry32(42);
        const v = createVillager(36.5, 50, 36.5, 36, 36, rng);
        const ground = (_x, y) => (Math.floor(y) < 50 ? BLOCK.COBBLESTONE : BLOCK.AIR);
        for (let i = 0; i < 60; i += 1) {
            stepVillager(v, 1 / 30, { getBlock: ground, rng, frozen: false, playerPos: [38, 50, 36] });
        }
        const out = new Float32Array(FLOATS_PER_VILLAGER);
        const end = buildVillagerVertices(v, 1.2, out, 0);
        expect(end).toBe(FLOATS_PER_VILLAGER);
        expect(end / FLOATS_PER_VERTEX).toBe(VERTS_PER_VILLAGER);
        expect(Array.from(out).every(Number.isFinite)).toBe(true);
    });

    it("initializes audio, particles, hand model, catalog, and storage safely in jsdom", async () => {
        expect(BLOCK_CATALOG.length).toBe(25);
        const audio = createVoxelAudio();
        audio.unlock();
        audio.playFootstep("grass");
        audio.playBreak("glass");
        audio.playPlace("wood");
        audio.playSplash(1);
        audio.playMob("villager");
        audio.updateAmbience(0.5, 0.2, false);
        audio.destroy();

        const particles = createVoxelParticles();
        particles.spawnBlockBreak(4, 5, 6, BLOCK.GRASS, 10);
        particles.spawnSplash(4, 5, 6, 6);
        particles.spawnTorchEmber(4, 5, 6);
        particles.step(0.05);
        const buf = particles.buildBillboardBuffer([1, 0, 0], [0, 1, 0]);
        expect(buf.vertCount).toBeGreaterThan(0);

        const hand = createVoxelHand();
        hand.setBlock(BLOCK.TORCH);
        hand.triggerSwing();
        hand.step(0.05);
        expect(hand.getMesh().length).toBeGreaterThan(0);
        expect(hand.buildModelMatrix(2, 1, true)).toHaveLength(16);

        const storage = createWorldStorage(2026);
        storage.recordEdit(0, 0, chunkIndex(2, 10, 2), BLOCK.STONE);
        const blocks = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
        expect(storage.applyColumnEdits(0, 0, blocks)).toBe(true);
        expect(blocks[chunkIndex(2, 10, 2)]).toBe(BLOCK.STONE);
        await storage.clearAll();
        storage.destroy();
    });
});
