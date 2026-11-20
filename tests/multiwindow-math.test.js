import { describe, it, expect } from "vitest";
import {
    createOrthoMatrix,
    multiplyMatrix,
    createTransformMatrix,
    getWindowColors,
    appendOrbParticles,
    appendBridgeParticles,
    generateWormholeSceneData,
    buildCubeVertices,
    buildSphereVertices,
    buildIcosahedronVertices,
    buildTorusKnotVertices,
    buildCoreVertices
} from "../src/lab/multiwindow/multiwindow-math.js";

describe("Multiple Window Math & Wormhole Particle Engine", () => {
    it("creates orthographic projection matrix with valid diagonal terms", () => {
        const mat = createOrthoMatrix(800, 600, -1000, 1000);
        expect(mat.length).toBe(16);
        expect(mat[0]).toBeCloseTo(2 / 800, 5);
        expect(mat[5]).toBeCloseTo(-2 / 600, 5);
        expect(mat[15]).toBe(1);
    });

    it("multiplies matrices accurately", () => {
        const a = createOrthoMatrix(800, 600);
        const b = createTransformMatrix(10, 20, 0, 0, 0, 0);
        const res = multiplyMatrix(a, b);
        expect(res.length).toBe(16);
        expect(Number.isFinite(res[12])).toBe(true);
    });

    it("returns complementary color pairs for Staal viral theme", () => {
        const pair0 = getWindowColors(0, "staal");
        const pair1 = getWindowColors(1, "staal");

        expect(pair0.outer[1]).toBeGreaterThan(0.8);
        expect(pair0.core[0]).toBeGreaterThan(0.8);

        expect(pair1.outer[0]).toBeGreaterThan(0.8);
        expect(pair1.core[1]).toBeGreaterThan(0.8);
    });

    it("appends dual-nested Fibonacci orb particles with outer and core shells", () => {
        const pts = [];
        appendOrbParticles(pts, 200, 300, 120, 100, 0.5, [0, 1, 0], [1, 0, 0]);

        expect(pts.length).toBe(100 * 7);
        expect(pts[0]).toBeGreaterThanOrEqual(80);
        expect(pts[0]).toBeLessThanOrEqual(320);

        const outerG = pts[4];
        expect(outerG).toBe(1);
    });

    it("appends catenoid wormhole bridge between two window centers", () => {
        const pts = [];
        appendBridgeParticles(pts, 100, 100, 500, 100, 50, 1.0, [0, 1, 0], [1, 0, 0], 100);

        expect(pts.length).toBe(50 * 7);
        for (let i = 0; i < 50; i += 1) {
            const x = pts[i * 7];
            expect(x).toBeGreaterThanOrEqual(90);
            expect(x).toBeLessThanOrEqual(510);
        }
    });

    it("generates full scene data for single and multiple windows", () => {
        const singleWin = [{ id: 1, shape: { x: 100, y: 100, w: 600, h: 400 } }];
        const offset = { x: -100, y: -100 };
        const data1 = generateWormholeSceneData(singleWin, offset, 0, "staal");
        expect(data1.length).toBeGreaterThan(0);
        expect(data1.length % 7).toBe(0);

        const multiWin = [
            { id: 1, shape: { x: 0, y: 0, w: 400, h: 400 } },
            { id: 2, shape: { x: 500, y: 0, w: 400, h: 400 } }
        ];
        const data2 = generateWormholeSceneData(multiWin, offset, 0, "staal");
        expect(data2.length).toBeGreaterThan(data1.length);
    });

    it("builds clean wireframe geometry vertices", () => {
        const cube = buildCubeVertices(100);
        expect(cube.length).toBe(72);

        const icosa = buildIcosahedronVertices(80);
        expect(icosa.length).toBeGreaterThan(0);

        const torus = buildTorusKnotVertices(60, 20);
        expect(torus.length).toBeGreaterThan(0);

        const sphere = buildSphereVertices(70);
        expect(sphere.length).toBeGreaterThan(0);

        const core = buildCoreVertices(50, 100);
        expect(core.length).toBeGreaterThan(0);
    });
});
