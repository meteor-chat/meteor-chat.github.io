import { describe, it, expect } from "vitest";
import { buildCameraBasis } from "../src/lab/voxel/voxel-camera.js";
import { PROGRAM_SPECS } from "../src/lab/voxel/voxel-gpu-resources.js";
import { createCat } from "../src/lab/voxel/voxel-mob-cat-ai.js";
import { FLOATS_PER_CAT, MAX_CATS } from "../src/lab/voxel/voxel-mob-cat-model.js";
import { fillMobStage } from "../src/lab/voxel/voxel-mob-render.js";
import { createVoxelRenderer } from "../src/lab/voxel/voxel-renderer.js";
import { generateVoxelAtlasData } from "../src/lab/voxel/voxel-textures.js";
import { createMockGl } from "./helpers/mock-gl.js";

const atlas = generateVoxelAtlasData();
const cam = buildCameraBasis([8, 50, 8], 0.4, -0.2, 1.2, 1.6);
const rng = () => 0.5;

function fixture() {
    const mock = createMockGl();
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 200;
    canvas.getContext = () => mock.gl;
    const renderer = createVoxelRenderer(canvas, atlas, {});
    const frame = (mobs) => renderer.renderFrame(cam, [8, 50, 8], 1, 0.3, null, false, mobs);
    return { mock, canvas, renderer, frame };
}

const catAt = (x, z) => createCat(x, 45, z, "orange", rng);

describe("mob rendering", () => {
    it("registers a dedicated mob program and keeps it in the spec list", () => {
        expect(Object.keys(PROGRAM_SPECS)).toContain("mob");
        expect(PROGRAM_SPECS.mob.uniforms).toContain("uViewProj");
        expect(PROGRAM_SPECS.mob.uniforms).not.toContain("uChunkOrigin");
    });

    it("skips all mob work when there are no cats", () => {
        const { mock, frame } = fixture();
        frame([]);
        frame();
        expect(mock.calls("bufferSubData")).toBe(0);
    });

    it("draws every cat in one upload and one draw call plus one batched shadow upload", () => {
        const { mock, frame } = fixture();
        const base = frame([]);
        const uploadsBefore = mock.calls("bufferSubData");
        const stats = frame([catAt(10, 6), catAt(12, 8), catAt(6, 10)]);
        expect(mock.calls("bufferSubData")).toBe(uploadsBefore + 2);
        expect(stats.drawCalls).toBe(base.drawCalls + 1);
        expect(stats.triCount).toBeGreaterThan(base.triCount);
    });

    it("skips the blob shadow batch at night but still draws the cats", () => {
        const mock = createMockGl();
        const canvas = document.createElement("canvas");
        canvas.width = 320;
        canvas.height = 200;
        canvas.getContext = () => mock.gl;
        const renderer = createVoxelRenderer(canvas, atlas, {});
        const uploads = mock.calls("bufferSubData");
        renderer.renderFrame(cam, [8, 50, 8], 1, 0.88, null, false, [catAt(10, 6)]);
        expect(mock.calls("bufferSubData")).toBe(uploads + 1);
        renderer.renderFrame(cam, [8, 50, 8], 1, 0.3, null, false, [catAt(10, 6)]);
        expect(mock.calls("bufferSubData")).toBe(uploads + 3);
    });

    it("limits the batch to the maximum number of cats and ignores far away ones", () => {
        const cats = Array.from({ length: MAX_CATS + 4 }, (_, i) => catAt(8 + i * 0.1, 8));
        const stage = new Float32Array(MAX_CATS * FLOATS_PER_CAT);
        expect(fillMobStage(cats, 1, [8, 50, 8], stage).count).toBe(MAX_CATS);
        const far = [catAt(400, 400), catAt(9, 9)];
        const filled = fillMobStage(far, 1, [8, 50, 8], stage);
        expect(filled.count).toBe(1);
        expect(filled.floats).toBe(FLOATS_PER_CAT);
    });

    it("rebuilds mob geometry after a context restore and draws again", () => {
        const { mock, canvas, frame } = fixture();
        frame([catAt(10, 6)]);
        const buffersBefore = mock.calls("createBuffer");
        canvas.dispatchEvent(new window.Event("webglcontextlost", { cancelable: true }));
        canvas.dispatchEvent(new window.Event("webglcontextrestored"));
        expect(mock.calls("createBuffer")).toBeGreaterThan(buffersBefore);
        const uploads = mock.calls("bufferSubData");
        frame([catAt(10, 6)]);
        expect(mock.calls("bufferSubData")).toBe(uploads + 2);
    });

    it("frees the mob geometry on destroy", () => {
        const { mock, renderer, frame } = fixture();
        frame([catAt(10, 6)]);
        expect(mock.liveCount("buffer")).toBeGreaterThan(0);
        renderer.destroy();
        for (const kind of ["vao", "buffer", "texture", "program", "shader"]) {
            expect(mock.liveCount(kind), kind).toBe(0);
        }
    });

    it("does not draw cats while the context is lost", () => {
        const { mock, canvas, frame } = fixture();
        canvas.dispatchEvent(new window.Event("webglcontextlost", { cancelable: true }));
        const uploads = mock.calls("bufferSubData");
        frame([catAt(10, 6)]);
        expect(mock.calls("bufferSubData")).toBe(uploads);
    });
});
