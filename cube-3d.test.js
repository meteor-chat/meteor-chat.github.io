import { describe, it, expect } from "vitest";

describe("cube-3d math calculations", () => {
    it("computes all 6 metrics correctly for sisi = 12 matching illustration", () => {
        const s = 12;
        const vol = Math.pow(s, 3);
        const lp = 6 * s * s;
        const pr = 12 * s;
        const ds = parseFloat((s * Math.SQRT2).toFixed(2));
        const dr = parseFloat((s * Math.SQRT3).toFixed(2));
        const bd = parseFloat((s * ds).toFixed(2));

        expect(vol).toBe(1728);
        expect(lp).toBe(864);
        expect(pr).toBe(144);
        expect(ds).toBe(16.97);
        expect(dr).toBe(20.78);
        expect(bd).toBe(203.64);
    });

    it("computes correctly for s = 5", () => {
        const s = 5;
        const vol = Math.pow(s, 3);
        const lp = 6 * s * s;
        const pr = 12 * s;
        const ds = parseFloat((s * Math.SQRT2).toFixed(2));
        const dr = parseFloat((s * Math.SQRT3).toFixed(2));
        const bd = parseFloat((s * ds).toFixed(2));

        expect(vol).toBe(125);
        expect(lp).toBe(150);
        expect(pr).toBe(60);
        expect(ds).toBe(7.07);
        expect(dr).toBe(8.66);
        expect(bd).toBe(35.35);
    });

    it("handles zero sisi correctly", () => {
        const s = 0;
        expect(Math.pow(s, 3)).toBe(0);
        expect(6 * s * s).toBe(0);
        expect(12 * s).toBe(0);
    });
});

