import { describe, it, expect } from "vitest";
import { createMeshStore } from "../src/lab/voxel/voxel-mesh-store.js";
import { buildShadowFrame, createShadowController } from "../src/lab/voxel/voxel-shadow-math.js";
import { createMockGl } from "./helpers/mock-gl.js";

function project(m, p) {
    const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12];
    const y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13];
    const z = m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14];
    const w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
    return [x / w, y / w, z / w];
}

function sunAt(elevation) {
    return [Math.cos(elevation) * 0.8, Math.sin(elevation), Math.cos(elevation) * 0.6];
}

describe("Voxel shadow frame", () => {
    it("maps every point inside the shadow sphere into clip space", () => {
        const center = [30, 50, -12];
        const radius = 56;
        for (const elevation of [0.2, 0.7, 1.2, 1.5]) {
            const frame = buildShadowFrame(center, sunAt(elevation), radius, 2048);
            for (let i = 0; i < 300; i += 1) {
                const a = i * 2.399;
                const r = radius * 0.95 * Math.sqrt((i % 50) / 50);
                const p = [center[0] + Math.cos(a) * r, center[1] + ((i % 7) - 3) * 9, center[2] + Math.sin(a) * r];
                if (Math.hypot(p[0] - center[0], p[1] - center[1], p[2] - center[2]) > radius * 0.98) continue;
                const [x, y, z] = project(frame.viewProj, p);
                expect(Math.abs(x)).toBeLessThanOrEqual(1.0001);
                expect(Math.abs(y)).toBeLessThanOrEqual(1.0001);
                expect(z).toBeGreaterThanOrEqual(-1);
                expect(z).toBeLessThanOrEqual(1);
            }
        }
    });

    it("orders depth so points nearer the sun get smaller depth values", () => {
        const sun = sunAt(0.8);
        const frame = buildShadowFrame([0, 40, 0], sun, 56, 2048);
        const towardSun = project(frame.viewProj, [sun[0] * 20, 40 + sun[1] * 20, sun[2] * 20]);
        const awayFromSun = project(frame.viewProj, [-sun[0] * 20, 40 - sun[1] * 20, -sun[2] * 20]);
        expect(towardSun[2]).toBeLessThan(awayFromSun[2]);
    });

    it("includes tall casters far above the center on the sun side", () => {
        const sun = sunAt(0.5);
        const frame = buildShadowFrame([0, 40, 0], sun, 56, 2048);
        const tall = project(frame.viewProj, [sun[0] * 70, 40 + sun[1] * 70, sun[2] * 70]);
        expect(tall[2]).toBeGreaterThan(-1);
        expect(tall[2]).toBeLessThan(1);
    });

    it("snaps the frame translation to whole texels for any camera position", () => {
        const sun = sunAt(0.9);
        for (let i = 0; i < 40; i += 1) {
            const center = [i * 3.137 - 20, 40 + (i % 5), i * -1.913 + 7];
            const frame = buildShadowFrame(center, sun, 56, 2048);
            const unitsX = (-frame.viewProj[12] * 56) / frame.texel;
            const unitsY = (-frame.viewProj[13] * 56) / frame.texel;
            expect(Math.abs(unitsX - Math.round(unitsX))).toBeLessThan(0.002);
            expect(Math.abs(unitsY - Math.round(unitsY))).toBeLessThan(0.002);
        }
    });
    it("stays finite with the sun straight overhead", () => {
        const frame = buildShadowFrame([0, 40, 0], [0, 1, 0], 56, 2048);
        expect(Array.from(frame.viewProj).every(Number.isFinite)).toBe(true);
        const [x, y] = project(frame.viewProj, [20, 40, 10]);
        expect(Math.abs(x) + Math.abs(y)).toBeGreaterThan(0);
    });
});

describe("Voxel shadow refresh controller", () => {
    const make = () => createShadowController({ radius: 56, mapSize: 2048, recenterDist: 12, minFrames: 4 });
    const sun = sunAt(0.8);

    it("renders once, then holds while sun, camera, and meshes are unchanged", () => {
        const ctl = make();
        expect(ctl.update(sun, [8, 50, 8], 1).refresh).toBe(true);
        for (let i = 0; i < 20; i += 1) expect(ctl.update(sun, [8.4, 50, 8.2], 1).refresh).toBe(false);
    });

    it("refreshes when the sun moves past the angle threshold but not for tiny drift", () => {
        const ctl = make();
        ctl.update(sun, [0, 50, 0], 1);
        expect(ctl.update(sunAt(0.8001), [0, 50, 0], 1).refresh).toBe(false);
        expect(ctl.update(sunAt(0.82), [0, 50, 0], 1).refresh).toBe(true);
    });

    it("recenters only after the player travels beyond the recenter distance", () => {
        const ctl = make();
        const first = ctl.update(sun, [0, 50, 0], 1).frame;
        expect(ctl.update(sun, [8, 50, 0], 1).frame.center).toEqual(first.center);
        const moved = ctl.update(sun, [20, 50, 0], 1);
        expect(moved.refresh).toBe(true);
        expect(moved.frame.center[0]).toBeGreaterThan(first.center[0] + 10);
    });

    it("throttles mesh-driven refreshes to the minimum frame gap", () => {
        const ctl = make();
        ctl.update(sun, [0, 50, 0], 1);
        expect(ctl.update(sun, [0, 50, 0], 2).refresh).toBe(false);
        expect(ctl.update(sun, [0, 50, 0], 2).refresh).toBe(false);
        expect(ctl.update(sun, [0, 50, 0], 2).refresh).toBe(false);
        expect(ctl.update(sun, [0, 50, 0], 2).refresh).toBe(true);
        expect(ctl.update(sun, [0, 50, 0], 2).refresh).toBe(false);
    });

    it("forces a refresh after invalidation, as needed after a context restore", () => {
        const ctl = make();
        ctl.update(sun, [0, 50, 0], 1);
        ctl.invalidate();
        expect(ctl.update(sun, [0, 50, 0], 1).refresh).toBe(true);
    });
});

describe("Voxel mesh store shadow support", () => {
    const planesAll = Array.from({ length: 6 }, () => [0, 0, 0, 1]);
    const planesNone = Array.from({ length: 6 }, () => [0, 0, 0, -1]);
    const sub = (sy, translucent = 0) => ({
        sy,
        opaque: new Uint32Array(12),
        translucent: new Uint32Array(translucent * 2)
    });

    it("bumps its revision on every upload and unload", () => {
        const store = createMeshStore(createMockGl().gl);
        const start = store.version();
        store.queue(0, 0, [sub(0)], true);
        const afterUpload = store.version();
        store.unloadColumn(0, 0);
        expect(afterUpload).toBeGreaterThan(start);
        expect(store.version()).toBeGreaterThan(afterUpload);
    });

    it("returns only chunks that have opaque geometry and sit inside the light frustum", () => {
        const store = createMeshStore(createMockGl().gl);
        store.queue(0, 0, [{ sy: 0, opaque: new Uint32Array(0), translucent: new Uint32Array(6) }], true);
        store.queue(1, 0, [sub(0)], true);
        expect(store.collectOpaque(planesAll)).toHaveLength(1);
        expect(store.collectOpaque(planesNone)).toHaveLength(0);
    });
});
