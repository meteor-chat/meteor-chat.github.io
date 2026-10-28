import { describe, it, expect } from "vitest";
import { computeCubeMetrics, formatVal } from "../src/math/geometry/cube-metrics.js";

describe("cube-3d math calculations", () => {
    it("computes all 6 metrics correctly for sisi = 12 matching illustration", () => {
        const res = computeCubeMetrics("12");
        expect(res.vol).toBe("1728");
        expect(res.lp).toBe("864");
        expect(res.pr).toBe("144");
        expect(res.ds).toBe("16.97");
        expect(res.dr).toBe("20.78");
        expect(res.bd).toBe("203.64");
    });

    it("computes all 6 metrics correctly for s = 9 matching user prompt", () => {
        const res = computeCubeMetrics("9");
        expect(res.vol).toBe("729");
        expect(res.lp).toBe("486");
        expect(res.pr).toBe("108");
        expect(res.ds).toBe("12.73");
        expect(res.dr).toBe("15.59");
        expect(res.bd).toBe("114.57");
    });

    it("computes all 6 metrics correctly for s = 6 matching user screenshot", () => {
        const res = computeCubeMetrics("6");
        expect(res.vol).toBe("216");
        expect(res.lp).toBe("216");
        expect(res.pr).toBe("72");
        expect(res.ds).toBe("8.49");
        expect(res.dr).toBe("10.39");
        expect(res.bd).toBe("50.94");
    });

    it("computes correctly for s = 5", () => {
        const res = computeCubeMetrics("5");
        expect(res.vol).toBe("125");
        expect(res.lp).toBe("150");
        expect(res.pr).toBe("60");
        expect(res.ds).toBe("7.07");
        expect(res.dr).toBe("8.66");
        expect(res.bd).toBe("35.35");
    });

    it("handles zero and negative or invalid sisi correctly", () => {
        const zeroRes = computeCubeMetrics("0");
        expect(zeroRes.vol).toBe("0");
        expect(zeroRes.lp).toBe("0");
        expect(zeroRes.pr).toBe("0");

        const emptyRes = computeCubeMetrics("");
        expect(emptyRes.vol).toBe("0");

        const invalidRes = computeCubeMetrics("abc");
        expect(invalidRes.vol).toBe("0");
    });

    it("formats values properly with formatVal", () => {
        expect(formatVal(0)).toBe("0");
        expect(formatVal(100)).toBe("100");
        expect(formatVal(12.3456)).toBe("12.35");
        expect(formatVal(-5)).toBe("0");
    });
});
