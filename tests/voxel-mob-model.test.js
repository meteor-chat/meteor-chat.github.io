import { describe, it, expect } from "vitest";
import { TEX } from "../src/lab/voxel/voxel-blocks.js";
import { createCat } from "../src/lab/voxel/voxel-mob-cat-ai.js";
import {
    buildCatVertices,
    CAT_LAYERS,
    FLOATS_PER_CAT,
    FLOATS_PER_VERTEX,
    VERTS_PER_CAT
} from "../src/lab/voxel/voxel-mob-cat-model.js";

const rng = () => 0.5;

function makeCat(overrides = {}) {
    const cat = createCat(10.5, 20, -4.5, "orange", rng);
    cat.yaw = 0;
    return Object.assign(cat, overrides);
}

function build(cat, timeSec = 1) {
    const out = new Float32Array(FLOATS_PER_CAT);
    const end = buildCatVertices(cat, timeSec, out, 0);
    return { out, end };
}

function vertex(out, i) {
    const o = i * FLOATS_PER_VERTEX;
    return {
        pos: [out[o], out[o + 1], out[o + 2]],
        normal: [out[o + 3], out[o + 4], out[o + 5]],
        uv: [out[o + 6], out[o + 7]],
        layer: out[o + 8],
        sky: out[o + 9]
    };
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const POSES = [
    { label: "standing", anim: { phase: 0, moving: 0, sit: 0 } },
    { label: "walking", anim: { phase: 1.3, moving: 1, sit: 0 } },
    { label: "sitting", anim: { phase: 0, moving: 0, sit: 1 } },
    { label: "half sitting", anim: { phase: 0.5, moving: 0.4, sit: 0.5 } }
];

describe("cat model", () => {
    it("writes the full vertex budget with finite values", () => {
        const { out, end } = build(makeCat());
        expect(end).toBe(FLOATS_PER_CAT);
        expect(end / FLOATS_PER_VERTEX).toBe(VERTS_PER_CAT);
        expect(Array.from(out).every(Number.isFinite)).toBe(true);
    });

    it("keeps triangles wound counter clockwise toward their normals in every pose", () => {
        for (const pose of POSES) {
            const { out } = build(makeCat({ anim: pose.anim, yaw: 0.9 }), 2.3);
            for (let t = 0; t < VERTS_PER_CAT; t += 3) {
                const a = vertex(out, t);
                const b = vertex(out, t + 1);
                const c = vertex(out, t + 2);
                const facing = dot(cross(sub(b.pos, a.pos), sub(c.pos, a.pos)), a.normal);
                expect(facing, `${pose.label} triangle ${t / 3}`).toBeGreaterThan(0);
            }
        }
    });

    it("emits unit normals and uv coordinates inside a sane range", () => {
        const { out } = build(makeCat());
        for (let i = 0; i < VERTS_PER_CAT; i += 1) {
            const v = vertex(out, i);
            expect(Math.hypot(...v.normal)).toBeCloseTo(1, 4);
            expect(v.uv[0]).toBeGreaterThanOrEqual(0);
            expect(v.uv[1]).toBeGreaterThanOrEqual(0);
            expect(v.uv[0]).toBeLessThanOrEqual(2);
            expect(v.uv[1]).toBeLessThanOrEqual(2);
        }
    });

    it("uses the face texture on exactly one head quad and the fur texture elsewhere", () => {
        for (const variant of Object.keys(CAT_LAYERS)) {
            const { out } = build(makeCat({ variant }));
            const layers = new Map();
            for (let i = 0; i < VERTS_PER_CAT; i += 1) {
                const layer = vertex(out, i).layer;
                layers.set(layer, (layers.get(layer) || 0) + 1);
            }
            expect([...layers.keys()].sort()).toEqual([CAT_LAYERS[variant].fur, CAT_LAYERS[variant].face].sort());
            expect(layers.get(CAT_LAYERS[variant].face), variant).toBe(6);
        }
        expect(CAT_LAYERS.orange.fur).toBe(TEX.CAT_FUR_ORANGE);
        expect(CAT_LAYERS.sand.face).toBe(TEX.CAT_FACE_SAND);
    });

    it("faces forward along the yaw direction", () => {
        for (const yaw of [0, 0.7, 1.9, 3.1, -2.2, -0.6]) {
            const cat = makeCat({ yaw });
            const { out } = build(cat);
            const faceLayer = CAT_LAYERS.orange.face;
            const sum = [0, 0, 0];
            let count = 0;
            for (let i = 0; i < VERTS_PER_CAT; i += 1) {
                const v = vertex(out, i);
                if (v.layer !== faceLayer) continue;
                for (let k = 0; k < 3; k += 1) sum[k] += v.pos[k];
                count += 1;
            }
            const dx = sum[0] / count - cat.pos[0];
            const dz = sum[2] / count - cat.pos[2];
            const forward = [Math.sin(yaw), -Math.cos(yaw)];
            const alignment = (dx * forward[0] + dz * forward[1]) / Math.hypot(dx, dz);
            expect(alignment, `yaw ${yaw}`).toBeGreaterThan(0.9);
        }
    });

    it("stands on the ground and never sinks below it", () => {
        for (const pose of POSES) {
            const { out } = build(makeCat({ anim: pose.anim }));
            let minY = Infinity;
            for (let i = 0; i < VERTS_PER_CAT; i += 1) minY = Math.min(minY, vertex(out, i).pos[1]);
            expect(minY, pose.label).toBeGreaterThan(20 - 0.06);
            expect(minY, pose.label).toBeLessThan(20 + 0.12);
        }
    });

    it("changes the leg geometry while walking and the whole silhouette while sitting", () => {
        const stand = build(makeCat({ anim: { phase: 0, moving: 0, sit: 0 } })).out;
        const stepA = build(makeCat({ anim: { phase: 0.8, moving: 1, sit: 0 } })).out;
        const stepB = build(makeCat({ anim: { phase: 2.4, moving: 1, sit: 0 } })).out;
        const sit = build(makeCat({ anim: { phase: 0, moving: 0, sit: 1 } })).out;
        expect(Array.from(stepA)).not.toEqual(Array.from(stepB));
        expect(Array.from(stand)).not.toEqual(Array.from(stepA));
        expect(Array.from(stand)).not.toEqual(Array.from(sit));
    });

    it("stays within a compact bounding box around the cat", () => {
        const { out } = build(makeCat({ anim: { phase: 1, moving: 1, sit: 0 } }));
        for (let i = 0; i < VERTS_PER_CAT; i += 1) {
            const v = vertex(out, i);
            expect(Math.abs(v.pos[0] - 10.5)).toBeLessThan(1);
            expect(Math.abs(v.pos[2] + 4.5)).toBeLessThan(1);
            expect(v.pos[1] - 20).toBeLessThan(1);
        }
    });

    it("writes the sky light into every vertex and defaults to full light", () => {
        const dark = build(makeCat({ sky: 0.32 })).out;
        const lit = build(makeCat({ sky: undefined })).out;
        for (let i = 0; i < VERTS_PER_CAT; i += 1) {
            expect(vertex(dark, i).sky).toBeCloseTo(0.32, 5);
            expect(vertex(lit, i).sky).toBe(1);
        }
    });

    it("appends at the requested offset without touching earlier data", () => {
        const out = new Float32Array(FLOATS_PER_CAT * 2);
        out[3] = 123;
        const end = buildCatVertices(makeCat(), 1, out, FLOATS_PER_CAT);
        expect(end).toBe(FLOATS_PER_CAT * 2);
        expect(out[3]).toBe(123);
        expect(out[FLOATS_PER_CAT + 1]).not.toBe(0);
    });
});
