import { describe, it, expect } from "vitest";
import { computeConeMetrics, resolveConeDimensions, formatVal } from "./cone-metrics.js";

describe("cone math calculations", () => {
    it("resolves s from r and t (3-4-5 triple)", () => {
        const d = resolveConeDimensions("rt", "3", "4");
        expect(d.valid).toBe(true);
        expect(d.r).toBe(3);
        expect(d.t).toBe(4);
        expect(d.s).toBe(5);
    });

    it("resolves t from r and s", () => {
        const d = resolveConeDimensions("rs", "3", "5");
        expect(d.valid).toBe(true);
        expect(d.t).toBeCloseTo(4, 10);
    });

    it("resolves r from t and s", () => {
        const d = resolveConeDimensions("ts", "4", "5");
        expect(d.valid).toBe(true);
        expect(d.r).toBeCloseTo(3, 10);
    });

    it("computes all metrics for r=3, t=4", () => {
        const res = computeConeMetrics("rt", "3", "4");
        expect(res.valid).toBe(true);
        expect(res.sText).toBe("5");
        expect(res.vol).toBe("37.7");
        expect(res.la).toBe("28.27");
        expect(res.ls).toBe("47.12");
        expect(res.lp).toBe("75.4");
    });

    it("gives identical metrics across equivalent input modes", () => {
        const a = computeConeMetrics("rt", "3", "4");
        const b = computeConeMetrics("rs", "3", "5");
        const c = computeConeMetrics("ts", "4", "5");
        expect(a.vol).toBe(b.vol);
        expect(b.vol).toBe(c.vol);
        expect(a.lp).toBe(c.lp);
    });

    it("rejects s not greater than r in rs mode", () => {
        const res = computeConeMetrics("rs", "5", "5");
        expect(res.valid).toBe(false);
        expect(res.vol).toBe("0");
    });

    it("rejects s not greater than t in ts mode", () => {
        const res = computeConeMetrics("ts", "5", "3");
        expect(res.valid).toBe(false);
        expect(res.vol).toBe("0");
    });

    it("handles zero, empty, and invalid inputs", () => {
        expect(computeConeMetrics("rt", "0", "4").vol).toBe("0");
        expect(computeConeMetrics("rt", "", "").vol).toBe("0");
        expect(computeConeMetrics("rt", "abc", "4").vol).toBe("0");
    });

    it("formats values properly with formatVal", () => {
        expect(formatVal(0)).toBe("0");
        expect(formatVal(100)).toBe("100");
        expect(formatVal(12.3456)).toBe("12.35");
        expect(formatVal(-5)).toBe("0");
    });
});
