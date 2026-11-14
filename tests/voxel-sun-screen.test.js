import { describe, it, expect } from "vitest";
import { projectSunToScreen, raysStrength } from "../src/lab/voxel/voxel-sun-screen.js";

const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const FORWARD_W = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0];

describe("projectSunToScreen", () => {
    it("hides the sun when it is behind the camera", () => {
        const result = projectSunToScreen(FORWARD_W, [0, 0, 0], [0, 0.5, -1]);
        expect(result.visibility).toBe(0);
    });

    it("centers the sun when it is straight ahead and high enough", () => {
        const result = projectSunToScreen(FORWARD_W, [0, 0, 0], [0, 0.3, 1]);
        expect(result.visibility).toBeGreaterThan(0);
        expect(result.u).toBeGreaterThan(0);
        expect(result.u).toBeLessThan(1);
    });

    it("hides the sun below the horizon", () => {
        const result = projectSunToScreen(IDENTITY, [0, 0, 0], [0, -0.5, 1]);
        expect(result.visibility).toBe(0);
    });
});

describe("raysStrength", () => {
    it("scales with visibility", () => {
        expect(raysStrength([0, 0.5, 0], 0)).toBe(0);
        expect(raysStrength([0, 0.5, 0], 1)).toBeGreaterThan(0);
    });

    it("is stronger when the sun is low", () => {
        expect(raysStrength([0, 0.05, 1], 1)).toBeGreaterThan(raysStrength([0, 0.9, 0], 1));
    });
});
