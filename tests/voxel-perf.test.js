import { describe, it, expect } from "vitest";
import { createUniformCache } from "../src/lab/voxel/voxel-gl-utils.js";
import { createGpuTimer } from "../src/lab/voxel/voxel-gpu-timer.js";
import { createMeshStore } from "../src/lab/voxel/voxel-mesh-store.js";
import { createQualityController } from "../src/lab/voxel/voxel-quality.js";
import { createMockGl, createTimerExtension } from "./helpers/mock-gl.js";

const allVisible = Array.from({ length: 6 }, () => [0, 0, 0, 1]);

function sub(sy, { opaque = 6, translucent = 0 } = {}) {
    return { sy, opaque: new Uint32Array(opaque * 2), translucent: new Uint32Array(translucent * 2) };
}

function run(controller, frameMs, seconds) {
    const dt = frameMs / 1000;
    const frames = Math.round(seconds / dt);
    for (let i = 0; i < frames; i += 1) controller.update(dt);
    return controller.getScale();
}

describe("Voxel uniform cache", () => {
    it("looks up each uniform location exactly once and returns a name keyed map", () => {
        const mock = createMockGl();
        const cache = createUniformCache(mock.gl, { id: 1 }, ["uA", "uB", "uC"]);
        expect(mock.calls("getUniformLocation")).toBe(3);
        expect(cache.uB).toEqual({ name: "uB" });
    });
});

describe("Voxel mesh store", () => {
    it("reuses one vertex array and buffer per sub-chunk across repeated uploads", () => {
        const mock = createMockGl();
        const store = createMeshStore(mock.gl);
        for (let i = 0; i < 5; i += 1) {
            store.queue(0, 0, [sub(1)]);
            store.flush();
        }
        expect(mock.calls("createVertexArray")).toBe(1);
        expect(mock.calls("createBuffer")).toBe(1);
        expect(mock.calls("bufferData")).toBe(5);
        expect(mock.liveCount("vao")).toBe(1);
    });

    it("honors the per-frame upload budget and drains the backlog over several frames", () => {
        const mock = createMockGl();
        const store = createMeshStore(mock.gl, { maxUploadsPerFrame: 3 });
        store.queue(0, 0, Array.from({ length: 8 }, (_, sy) => sub(sy)));
        expect(store.flush()).toMatchObject({ uploads: 3, remaining: 5 });
        expect(store.flush()).toMatchObject({ uploads: 3, remaining: 2 });
        expect(store.flush()).toMatchObject({ uploads: 2, remaining: 0 });
        expect(store.size()).toBe(8);
    });

    it("stops early on the byte budget but always uploads at least one job", () => {
        const mock = createMockGl();
        const store = createMeshStore(mock.gl, { maxUploadsPerFrame: 10, maxBytesPerFrame: 1 });
        store.queue(0, 0, [sub(0), sub(1), sub(2)]);
        expect(store.flush().uploads).toBe(1);
        expect(store.flush(true).uploads).toBe(2);
    });

    it("uploads urgent edits immediately and supersedes a queued older job", () => {
        const mock = createMockGl();
        const store = createMeshStore(mock.gl);
        store.queue(2, 3, [sub(4)]);
        store.queue(2, 3, [sub(4, { opaque: 12 })], true);
        expect(store.has(2, 4, 3)).toBe(true);
        expect(store.pendingCount()).toBe(0);
        expect(mock.calls("bufferData")).toBe(1);
    });

    it("frees both slots when a sub-chunk becomes empty and when a column unloads", () => {
        const mock = createMockGl();
        const store = createMeshStore(mock.gl);
        store.queue(0, 0, [sub(0, { translucent: 4 }), sub(1)]);
        store.flush();
        expect(mock.liveCount("vao")).toBe(3);
        store.queue(0, 0, [sub(0, { opaque: 0, translucent: 0 })]);
        store.flush();
        expect(store.has(0, 0, 0)).toBe(false);
        expect(mock.liveCount("vao")).toBe(1);
        store.queue(0, 0, [sub(2)]);
        store.unloadColumn(0, 0);
        expect(store.pendingCount()).toBe(0);
        expect(store.size()).toBe(0);
        expect(mock.liveCount("vao")).toBe(0);
        expect(mock.liveCount("buffer")).toBe(0);
    });

    it("sorts opaque front to back and translucent back to front around the eye", () => {
        const mock = createMockGl();
        const store = createMeshStore(mock.gl);
        for (const cx of [5, 0, 2]) store.queue(cx, 0, [sub(0, { opaque: 3, translucent: 3 })], true);
        const visible = store.collectVisible(allVisible, [0, 8, 0]);
        expect(visible.opaque.map((e) => e.origin[0])).toEqual([0, 32, 80]);
        expect(visible.translucent.map((e) => e.origin[0])).toEqual([80, 32, 0]);
        expect(visible.culled).toBe(0);
    });

    it("culls sub-chunks that fail a frustum plane test", () => {
        const mock = createMockGl();
        const store = createMeshStore(mock.gl);
        store.queue(0, 0, [sub(0)], true);
        const rejectAll = Array.from({ length: 6 }, () => [0, 0, 0, -1]);
        const visible = store.collectVisible(rejectAll, [0, 0, 0]);
        expect(visible.opaque).toHaveLength(0);
        expect(visible.culled).toBe(1);
    });
});

describe("Voxel dynamic resolution controller", () => {
    it("ignores startup hitches during the warmup window and after reset", () => {
        const controller = createQualityController();
        expect(run(controller, 50, 2.5)).toBe(1);
        expect(run(controller, 50, 4)).toBeLessThan(1);
        const resumed = createQualityController();
        run(resumed, 16.7, 10);
        resumed.reset();
        expect(run(resumed, 50, 2.5)).toBe(1);
    });

    it("holds full scale under a steady 60 Hz frame time", () => {
        expect(run(createQualityController({ warmupSec: 0 }), 16.7, 30)).toBe(1);
    });

    it("steps down under sustained load and never goes below the minimum", () => {
        const controller = createQualityController({ warmupSec: 0 });
        const afterShort = run(controller, 40, 2);
        expect(afterShort).toBeLessThan(1);
        expect(afterShort).toBeGreaterThanOrEqual(0.6);
        expect(run(controller, 40, 60)).toBe(0.6);
    });

    it("recovers to full scale after load disappears", () => {
        const controller = createQualityController({ warmupSec: 0 });
        run(controller, 40, 30);
        expect(run(controller, 16, 120)).toBe(1);
    });

    it("backs off probing after a failed step up", () => {
        const controller = createQualityController({ warmupSec: 0 });
        run(controller, 40, 3);
        run(controller, 16, 7);
        run(controller, 40, 2);
        const settled = controller.getScale();
        expect(run(controller, 16, 8)).toBe(settled);
        expect(run(controller, 16, 6)).toBeGreaterThan(settled);
    });

    it("keeps scale values quantized to hundredths", () => {
        const controller = createQualityController({ warmupSec: 0 });
        run(controller, 40, 10);
        expect(Math.round(controller.getScale() * 100) / 100).toBe(controller.getScale());
    });
});

describe("Voxel GPU timer", () => {
    it("returns null when the disjoint timer extension is unavailable", () => {
        expect(createGpuTimer(createMockGl().gl)).toBeNull();
    });

    it("reports smoothed milliseconds once a query resolves", () => {
        const mock = createMockGl({ extensions: { EXT_disjoint_timer_query_webgl2: createTimerExtension() } });
        const timer = createGpuTimer(mock.gl);
        expect(timer.getMs()).toBeNull();
        timer.begin();
        timer.end();
        timer.poll();
        expect(timer.getMs()).toBeCloseTo(4, 5);
        expect(mock.liveCount("query")).toBe(0);
    });

    it("discards disjoint results and caps queries in flight", () => {
        const mock = createMockGl({ extensions: { EXT_disjoint_timer_query_webgl2: createTimerExtension() } });
        const timer = createGpuTimer(mock.gl);
        mock.queryResults.disjoint = true;
        timer.begin();
        timer.end();
        timer.poll();
        expect(timer.getMs()).toBeNull();
        mock.queryResults.available = false;
        for (let i = 0; i < 6; i += 1) {
            timer.begin();
            timer.end();
        }
        expect(mock.liveCount("query")).toBe(3);
        timer.dispose();
        expect(mock.liveCount("query")).toBe(0);
    });
});
