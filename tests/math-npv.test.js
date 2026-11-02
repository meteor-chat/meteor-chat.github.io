import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { computeNpv } from "../src/math/calculators/math-calc-37.js";
import { PM_GUIDE_DATA } from "../src/math/calculators/math-calc-pm-guide-data.js";
import { FORMULAS } from "../src/math/math-formulas.js";
import { FORMULA_NAMES } from "../src/math/math-formula-names.js";
import { FORMULA_URLS, parseFormulaUrl } from "../src/math/math-routes.js";

describe("math-npv (Formula 37)", () => {
    it("computes Figure 4-5 JWD Consulting case accurately", () => {
        const initial = 140000;
        const rate = 0.08;
        const periods = [
            { benefit: 200000, cost: 40000 },
            { benefit: 200000, cost: 40000 },
            { benefit: 200000, cost: 40000 }
        ];

        const res = computeNpv(initial, rate, periods);

        expect(Math.round(res.npv)).toBe(272336);
        expect(Math.round(res.roi)).toBe(112);
        expect(res.paybackYear).toBeCloseTo(0.875, 2);
        expect(res.discPaybackYear).toBeCloseTo(0.945, 2);
        expect(res.periods.length).toBe(3);
        expect(res.periods[0].net).toBe(160000);
        expect(res.periods[0].df).toBeCloseTo(0.9259, 3);
    });

    it("computes Figure 4-4 Project 1 accurately", () => {
        const initial = 5000;
        const rate = 0.10;
        const periods = [
            { benefit: 2000, cost: 1000 },
            { benefit: 3000, cost: 1000 },
            { benefit: 4000, cost: 1000 },
            { benefit: 5000, cost: 1000 }
        ];

        const res = computeNpv(initial, rate, periods);

        expect(res.npv).toBeCloseTo(2547.98, 1);
        expect(res.npv).toBeGreaterThan(0);
        expect(res.periods[0].net).toBe(1000);
        expect(res.periods[1].net).toBe(2000);
        expect(res.periods[2].net).toBe(3000);
        expect(res.periods[3].net).toBe(4000);
    });

    it("computes Figure 4-4 Project 2 accurately", () => {
        const initial = 1000;
        const rate = 0.10;
        const periods = [
            { benefit: 2000, cost: 2000 },
            { benefit: 4000, cost: 2000 },
            { benefit: 4000, cost: 2000 },
            { benefit: 4000, cost: 2000 }
        ];

        const res = computeNpv(initial, rate, periods);

        expect(res.npv).toBeCloseTo(3521.55, 1);
        expect(res.npv).toBeGreaterThan(0);
        expect(res.periods[0].net).toBe(0);
        expect(res.periods[1].net).toBe(2000);
        expect(res.periods[2].net).toBe(2000);
        expect(res.periods[3].net).toBe(2000);
    });

    it("identifies negative NPV reject cases and never-payback projects", () => {
        const initial = 10000;
        const rate = 0.10;
        const periods = [
            { benefit: 1000, cost: 800 },
            { benefit: 1000, cost: 800 }
        ];

        const res = computeNpv(initial, rate, periods);

        expect(res.npv).toBeLessThan(0);
        expect(res.paybackYear).toBeNull();
        expect(res.discPaybackYear).toBeNull();
    });

    it("handles zero discount rate correctly", () => {
        const initial = 1000;
        const rate = 0;
        const periods = [
            { benefit: 800, cost: 200 },
            { benefit: 1000, cost: 400 }
        ];

        const res = computeNpv(initial, rate, periods);

        expect(res.npv).toBe(200);
        expect(res.periods[0].df).toBe(1);
        expect(res.periods[1].df).toBe(1);
    });

    it("handles exact zero NPV indifferent condition", () => {
        const initial = 1000;
        const rate = 0;
        const periods = [
            { benefit: 1000, cost: 0 }
        ];

        const res = computeNpv(initial, rate, periods);

        expect(res.npv).toBe(0);
        expect(res.paybackYear).toBeCloseTo(1, 4);
    });

    it("registers formula 37 metadata and routing correctly", () => {
        expect(FORMULAS[37]).toContain("NPV");
        expect(FORMULA_NAMES[37]).toBe("Net Present Value (NPV)");
        expect(FORMULA_URLS[37]).toBe("/math/pm/12");
        expect(parseFormulaUrl("/math/pm/12").id).toBe(37);
        expect(parseFormulaUrl("/math/pm/37").id).toBe(37);
        expect(parseFormulaUrl("/math/37").id).toBe(37);
    });

    it("has complete A1 guide data for formula 37", () => {
        const entry = PM_GUIDE_DATA[37];
        expect(entry).toBeDefined();
        expect(entry.title).toBe("Net Present Value (NPV)");
        expect(entry.formula).toBeTruthy();
        expect(Array.isArray(entry.inputs)).toBe(true);
        expect(entry.inputs.length).toBeGreaterThanOrEqual(2);

        for (const input of entry.inputs) {
            expect(input.name).toBeTruthy();
            expect(input.meaning).toBeTruthy();
            expect(input.source).toBeTruthy();
            expect(input.purpose).toBeTruthy();
        }

        expect(entry.outputs).toBeDefined();
        expect(entry.outputs.meaning).toBeTruthy();
        expect(Array.isArray(entry.outputs.interpretation)).toBe(true);
        expect(entry.outputs.interpretation.length).toBeGreaterThanOrEqual(3);
        expect(entry.outputs.action).toBeTruthy();

        expect(entry.example).toBeDefined();
        expect(entry.example.title).toBeTruthy();
        expect(entry.example.story).toBeTruthy();
        expect(entry.example.calc).toBeTruthy();
        expect(entry.example.meaning).toBeTruthy();
    });

    it("strictly conforms to zero-comment and line-limit architectural rules", () => {
        const commentRegex = new RegExp("\\/\\*|\\/\\/");
        const files = [
            "src/math/calculators/math-calc-37.js",
            "src/math/visuals/math-visual-37.js",
            "src/math/calculators/math-calc-pm-guide-data-3.js",
            "src/math/calculators/math-calc-pm-guide-data.js",
            "styles/math.css",
            "tests/math-npv.test.js"
        ];

        for (const file of files) {
            const content = readFileSync(file, "utf8");
            expect(commentRegex.test(content)).toBe(false);
            const lineCount = content.split("\n").length;
            expect(lineCount).toBeLessThanOrEqual(300);
        }
    });
});