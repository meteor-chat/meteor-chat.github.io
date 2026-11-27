import { describe, it, expect } from "vitest";
import { BLOCK } from "../src/lab/voxel/voxel-blocks.js";
import { BLOB_FLOATS_PER_VERTEX, BLOB_VERTS_PER_CAT, fillBlobStage } from "../src/lab/voxel/voxel-mob-blob.js";
import { fillMobStage } from "../src/lab/voxel/voxel-mob-render.js";
import {
    FLOATS_PER_PLAYER,
    FLOATS_PER_VERTEX,
    MAX_REMOTE_PLAYERS,
    PLAYER_OUTFITS,
    buildPlayerVertices
} from "../src/lab/voxel/voxel-player-model.js";

function makePlayer(overrides = {}) {
    return {
        id: "p_1",
        kind: "player",
        name: "Budi",
        variant: "sky",
        pos: [10, 50, 10],
        yaw: 0.3,
        pitch: -0.2,
        hw: 0.3,
        h: 1.8,
        heldBlockId: BLOCK.TORCH,
        sky: 1,
        blk: 0,
        groundY: 50,
        anim: { phase: 1.2, moving: 1, swing: 0.5, sneaking: false },
        ...overrides
    };
}

describe("Voxel 3D remote player avatar geometry", () => {
    it("emits finite vertices and skips held cube when hand is empty", () => {
        const withHeld = new Float32Array(FLOATS_PER_PLAYER);
        const endHeld = buildPlayerVertices(makePlayer({ heldBlockId: BLOCK.TORCH }), 1.5, withHeld, 0);
        expect(endHeld).toBe(FLOATS_PER_PLAYER);
        for (let i = 0; i < endHeld; i += 1) {
            expect(Number.isFinite(withHeld[i])).toBe(true);
        }

        const emptyHand = new Float32Array(FLOATS_PER_PLAYER);
        const endEmpty = buildPlayerVertices(makePlayer({ heldBlockId: BLOCK.AIR }), 1.5, emptyHand, 0);
        expect(endEmpty).toBeLessThan(endHeld);
    });

    it("keeps every outfit layer index within the 58-layer texture atlas and lowers height while sneaking", () => {
        for (const o of PLAYER_OUTFITS) {
            const buf = new Float32Array(FLOATS_PER_PLAYER);
            const end = buildPlayerVertices(makePlayer({ variant: o.id }), 0, buf, 0);
            for (let i = 8; i < end; i += FLOATS_PER_VERTEX) {
                expect(buf[i]).toBeGreaterThanOrEqual(0);
                expect(buf[i]).toBeLessThan(58);
            }
        }

        const stand = new Float32Array(FLOATS_PER_PLAYER);
        const sneak = new Float32Array(FLOATS_PER_PLAYER);
        const endS = buildPlayerVertices(makePlayer({ anim: { sneaking: false } }), 0, stand, 0);
        const endC = buildPlayerVertices(makePlayer({ anim: { sneaking: true } }), 0, sneak, 0);
        let maxStand = -Infinity;
        let maxSneak = -Infinity;
        for (let i = 1; i < endS; i += FLOATS_PER_VERTEX) maxStand = Math.max(maxStand, stand[i]);
        for (let i = 1; i < endC; i += FLOATS_PER_VERTEX) maxSneak = Math.max(maxSneak, sneak[i]);
        expect(maxSneak).toBeLessThan(maxStand - 0.1);
    });

    it("integrates into the single-draw-call mob batch and blob shadow batch with MAX_REMOTE_PLAYERS cap", () => {
        const list = Array.from({ length: MAX_REMOTE_PLAYERS + 3 }, (_, i) => makePlayer({ id: `p_${i}`, pos: [10 + i * 0.2, 50, 10] }));
        const stage = new Float32Array(MAX_REMOTE_PLAYERS * FLOATS_PER_PLAYER);
        const filled = fillMobStage(list, 1, [8, 52, 8], stage);
        expect(filled.count).toBe(MAX_REMOTE_PLAYERS);
        expect(filled.floats).toBe(MAX_REMOTE_PLAYERS * FLOATS_PER_PLAYER);

        const blobStage = new Float32Array(MAX_REMOTE_PLAYERS * BLOB_VERTS_PER_CAT * BLOB_FLOATS_PER_VERTEX);
        const blobs = fillBlobStage(list, [8, 52, 8], 1, [40, 80], blobStage);
        expect(blobs.count).toBe(MAX_REMOTE_PLAYERS);
    });
});
