import { describe, it, expect } from "vitest";

describe("cube-3d math calculations", () => {
    it("computes cube volume correctly for integer sisi", () => {
        const s = 12;
        expect(Math.pow(s, 3)).toBe(1728);
    });

    it("computes cube volume correctly for fractional sisi", () => {
        const s = 2.5;
        expect(Math.pow(s, 3)).toBe(15.625);
    });

    it("handles zero sisi", () => {
        const s = 0;
        expect(Math.pow(s, 3)).toBe(0);
    });
});
