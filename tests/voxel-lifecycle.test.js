import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "fs";
import { buildCameraBasis } from "../src/lab/voxel/voxel-camera.js";
import { bindVisibility, createVoxelInput } from "../src/lab/voxel/voxel-input.js";
import { createVoxelApp } from "../src/lab/voxel/voxel-controller.js";
import { createVoxelRenderer } from "../src/lab/voxel/voxel-renderer.js";
import { generateVoxelAtlasData } from "../src/lab/voxel/voxel-textures.js";
import { createVoxelWorld } from "../src/lab/voxel/voxel-world.js";
import {
    acceptMeshMessages,
    buildPaddedBuffers,
    makeColumn,
    orderDirtyColumns
} from "../src/lab/voxel/voxel-world-stream.js";
import { createMockGl } from "./helpers/mock-gl.js";

const atlas = generateVoxelAtlasData();
const cam = buildCameraBasis([8, 50, 8], 0.4, -0.2, 1.2, 1.6);

function makeRendererFixture(hooks = {}) {
    const mock = createMockGl();
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 200;
    canvas.getContext = () => mock.gl;
    const renderer = createVoxelRenderer(canvas, atlas, hooks);
    const frame = () => renderer.renderFrame(cam, [8, 50, 8], 1, 0.3, null, false);
    const sub = { sy: 3, opaque: new Uint32Array(12), translucent: new Uint32Array(0) };
    return { mock, canvas, renderer, frame, sub };
}

describe("Voxel renderer GPU lifecycle", () => {
    it("caches uniform locations so frames never query them again", () => {
        const { mock, frame } = makeRendererFixture();
        const afterCreate = mock.calls("getUniformLocation");
        expect(afterCreate).toBeGreaterThan(20);
        for (let i = 0; i < 5; i += 1) frame();
        expect(mock.calls("getUniformLocation")).toBe(afterCreate);
        expect(mock.calls("drawArrays")).toBeGreaterThan(0);
    });

    it("stops drawing on context loss, rebuilds on restore, and drops stale meshes", () => {
        const onContextLost = vi.fn();
        const onContextRestored = vi.fn();
        const { mock, canvas, renderer, frame, sub } = makeRendererFixture({ onContextLost, onContextRestored });
        renderer.uploadMeshUpdate(0, 0, [sub], true);
        frame();
        expect(renderer.meshCount()).toBe(1);

        const lostEvent = new window.Event("webglcontextlost", { cancelable: true });
        canvas.dispatchEvent(lostEvent);
        expect(lostEvent.defaultPrevented).toBe(true);
        expect(renderer.isLost()).toBe(true);
        expect(onContextLost).toHaveBeenCalledTimes(1);

        const drawsBefore = mock.calls("drawArrays");
        expect(frame()).toMatchObject({ drawCalls: 0, triCount: 0 });
        expect(mock.calls("drawArrays")).toBe(drawsBefore);

        const programsBefore = mock.calls("createProgram");
        const vaoDeletesBefore = mock.calls("deleteVertexArray");
        canvas.dispatchEvent(new window.Event("webglcontextrestored"));
        expect(mock.calls("deleteVertexArray")).toBe(vaoDeletesBefore);
        expect(mock.calls("createProgram")).toBe(programsBefore + 6);
        expect(renderer.isLost()).toBe(false);
        expect(renderer.meshCount()).toBe(0);
        expect(onContextRestored).toHaveBeenCalledTimes(1);

        frame();
        expect(mock.calls("drawArrays")).toBeGreaterThan(drawsBefore);
    });

    it("stays lost and reports an error when the restore cannot rebuild resources", () => {
        const onContextError = vi.fn();
        const { mock, canvas, renderer } = makeRendererFixture({ onContextError });
        canvas.dispatchEvent(new window.Event("webglcontextlost", { cancelable: true }));
        mock.gl.getProgramParameter = () => false;
        canvas.dispatchEvent(new window.Event("webglcontextrestored"));
        expect(renderer.isLost()).toBe(true);
        expect(onContextError).toHaveBeenCalledTimes(1);
    });

    it("frees every GL object and listener on destroy", () => {
        const onContextLost = vi.fn();
        const { mock, canvas, renderer, frame, sub } = makeRendererFixture({ onContextLost });
        renderer.uploadMeshUpdate(1, 1, [sub], true);
        frame();
        renderer.destroy();
        for (const kind of ["vao", "buffer", "texture", "framebuffer", "renderbuffer", "program", "shader"]) {
            expect(mock.liveCount(kind), kind).toBe(0);
        }
        canvas.dispatchEvent(new window.Event("webglcontextlost", { cancelable: true }));
        expect(onContextLost).not.toHaveBeenCalled();
    });
});

describe("Voxel padded buffer assembly", () => {
    const PAD = 18;

    function referencePadded(world, cx, cz) {
        const blocks = new Uint8Array(PAD * 128 * PAD);
        const light = new Uint8Array(PAD * 128 * PAD);
        for (let y = 0; y < 128; y += 1) {
            for (let dz = -1; dz <= 16; dz += 1) {
                for (let dx = -1; dx <= 16; dx += 1) {
                    const idx = dx + 1 + (dz + 1) * PAD + y * PAD * PAD;
                    blocks[idx] = world.getBlock(cx * 16 + dx, y, cz * 16 + dz);
                    light[idx] = world.getLight(cx * 16 + dx, y, cz * 16 + dz);
                }
            }
        }
        return { blocks, light };
    }

    it("matches the per-cell reference with all eight neighbors loaded", () => {
        const world = createVoxelWorld({ seed: 2026, viewRadius: 1, useWorker: false });
        world.warmAreaSync(8, 8, 1);
        const fast = buildPaddedBuffers(world.getColumn, 0, 0);
        const ref = referencePadded(world, 0, 0);
        expect(fast.padBlocks).toEqual(ref.blocks);
        expect(fast.padLight).toEqual(ref.light);
        world.destroy();
    }, 60000);

    it("matches the reference when neighbors are missing, using air and full sky light", () => {
        const world = createVoxelWorld({ seed: 2026, viewRadius: 1, useWorker: false });
        world.warmAreaSync(8, 8, 0);
        const fast = buildPaddedBuffers(world.getColumn, 0, 0);
        const ref = referencePadded(world, 0, 0);
        expect(fast.padBlocks).toEqual(ref.blocks);
        expect(fast.padLight).toEqual(ref.light);
        world.destroy();
    }, 60000);
});

describe("Voxel mesh stream filtering", () => {
    const makeGetter = (col) => () => col;

    it("drops results for unloaded columns and for a reloaded column instance", () => {
        const subs = [{ sy: 0 }];
        expect(acceptMeshMessages([{ cx: 0, cz: 0, colId: 1, seq: 1, subs }], () => null)).toEqual([]);
        const col = makeColumn(0, 0, null, null);
        const stale = { cx: 0, cz: 0, colId: col.id - 1, seq: 1, subs };
        expect(acceptMeshMessages([stale], makeGetter(col))).toEqual([]);
    });

    it("keeps a sub-chunk that only exists in an older job while dropping superseded ones", () => {
        const col = makeColumn(0, 0, null, null);
        const newer = { cx: 0, cz: 0, colId: col.id, seq: 5, subs: [{ sy: 0 }, { sy: 1 }] };
        const older = { cx: 0, cz: 0, colId: col.id, seq: 4, subs: [{ sy: 1 }, { sy: 2 }] };
        const accepted = acceptMeshMessages([newer, older], makeGetter(col));
        expect(accepted).toHaveLength(2);
        expect(accepted[0].subs.map((s) => s.sy)).toEqual([0, 1]);
        expect(accepted[1].subs.map((s) => s.sy)).toEqual([2]);
        const oldest = { cx: 0, cz: 0, colId: col.id, seq: 3, subs: [{ sy: 0 }, { sy: 2 }] };
        expect(acceptMeshMessages([oldest], makeGetter(col))).toEqual([]);
    });

    it("orders dirty columns by distance to the player", () => {
        const dirty = new Map([["5,5", 1], ["0,1", 3], ["1,0", 255], ["-2,0", 8]]);
        const order = orderDirtyColumns(dirty, 0, 0).map((job) => job.key);
        expect(order).toEqual(["0,1", "1,0", "-2,0", "5,5"]);
        expect(orderDirtyColumns(dirty, 0, 0)[0].mask).toBe(3);
    });
});

describe("Voxel world streaming", () => {
    it("delivers each edit once and re-meshes every loaded column after remeshAll", () => {
        const world = createVoxelWorld({ seed: 2026, viewRadius: 1, useWorker: false });
        world.warmAreaSync(8, 8, 1);
        expect(world.consumeMeshes().length).toBe(9);
        expect(world.consumeMeshes()).toEqual([]);

        world.remeshAll();
        const seen = new Set();
        for (let i = 0; i < 5; i += 1) {
            world.updateAround(8, 8);
            for (const msg of world.consumeMeshes()) seen.add(`${msg.cx},${msg.cz}`);
        }
        expect(seen.size).toBe(9);
        world.destroy();
    }, 60000);

    it("re-sends only the edited sub-chunks after setBlock", () => {
        const world = createVoxelWorld({ seed: 2026, viewRadius: 1, useWorker: false });
        world.warmAreaSync(8, 8, 1);
        world.consumeMeshes();
        expect(world.setBlock(8, 90, 8, 3)).toBe(true);
        const msgs = world.consumeMeshes();
        expect(msgs.length).toBeGreaterThan(0);
        expect(msgs[0].subs.map((s) => s.sy)).toContain(5);
        world.destroy();
    }, 60000);
});

describe("Voxel input and visibility lifecycle", () => {
    it("clears held keys on window blur so movement never sticks", () => {
        const canvas = document.createElement("canvas");
        const hud = { syncHud: vi.fn() };
        const input = createVoxelInput({
            canvas,
            player: { flyMode: true },
            state: { selectedSlot: 0, actionMode: "break" },
            hud,
            performBlockAction: vi.fn()
        });
        window.dispatchEvent(new window.KeyboardEvent("keydown", { code: "KeyW" }));
        expect(input.keys.has("KeyW")).toBe(true);
        window.dispatchEvent(new window.Event("blur"));
        expect(input.keys.size).toBe(0);
        input.destroy();
        window.dispatchEvent(new window.KeyboardEvent("keydown", { code: "KeyS" }));
        expect(input.keys.size).toBe(0);
    });

    it("routes visibilitychange to the hidden and visible callbacks until unbound", () => {
        const listeners = new Map();
        const doc = {
            hidden: false,
            addEventListener: (name, fn) => listeners.set(name, fn),
            removeEventListener: (name) => listeners.delete(name)
        };
        const onHidden = vi.fn();
        const onVisible = vi.fn();
        const unbind = bindVisibility(doc, onHidden, onVisible);
        doc.hidden = true;
        listeners.get("visibilitychange")();
        doc.hidden = false;
        listeners.get("visibilitychange")();
        expect(onHidden).toHaveBeenCalledTimes(1);
        expect(onVisible).toHaveBeenCalledTimes(1);
        unbind();
        expect(listeners.size).toBe(0);
    });
});

describe("Voxel controller loop pausing", () => {
    let app = null;

    beforeEach(() => {
        document.documentElement.innerHTML = readFileSync("voxel.html", "utf8");
        window.HTMLCanvasElement.prototype.getContext = () => null;
        vi.stubGlobal("requestAnimationFrame", vi.fn(() => 41));
        vi.stubGlobal("cancelAnimationFrame", vi.fn());
    });

    afterEach(() => {
        if (app) app.destroy();
        app = null;
        vi.unstubAllGlobals();
    });

    it("cancels the frame request when hidden and schedules again when visible, idempotently", () => {
        app = createVoxelApp(document.getElementById("voxel-app-root"));
        const raf = globalThis.requestAnimationFrame;
        const caf = globalThis.cancelAnimationFrame;
        const scheduled = raf.mock.calls.length;
        app.pause();
        app.pause();
        expect(caf).toHaveBeenCalledTimes(1);
        app.resume();
        app.resume();
        expect(raf.mock.calls.length).toBe(scheduled + 1);
    });
});
