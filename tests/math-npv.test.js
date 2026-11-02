import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { computeNpv } from "../src/math/calculators/math-calc-37.js";
import { PM_GUIDE_DATA } from "../src/math/calculators/math-calc-pm-guide-data.js";
import { FORMULAS } from "../src/math/math-formulas.js";
import { FORMULA_NAMES } from "../src/math/math-formula-names.js";
import { FORMULA_URLS, parseFormulaUrl } from "../src/math/math-routes.js";

describe("math-npv (Formula 37 - Auto-Expanding Ct)", () => {
    it("computes single-period NPV correctly", () => {
        const c0 = 1000;
        const ct = 1200;
        const r = 10;

        const res = computeNpv(c0, ct, r);

        expect(res.pv).toBeCloseTo(1090.91, 2);
        expect(res.npv).toBeCloseTo(90.91, 2);
        expect(res.status).toBe("DITERIMA");
    });

    it("computes Figure 4-4 Project 1 multi-period cash flows accurately", () => {
        const c0 = 5000;
        const ctList = [1000, 2000, 3000, 4000];
        const r = 10;

        const res = computeNpv(c0, ctList, r);

        expect(res.pv).toBeCloseTo(7547.98, 2);
        expect(res.npv).toBeCloseTo(2547.98, 2);
        expect(res.status).toBe("DITERIMA");
        expect(res.pvList.length).toBe(4);
    });

    it("computes Figure 4-4 Project 2 multi-period cash flows accurately", () => {
        const c0 = 1000;
        const ctList = [0, 2000, 2000, 2000];
        const r = 10;

        const res = computeNpv(c0, ctList, r);

        expect(res.pv).toBeCloseTo(4521.55, 2);
        expect(res.npv).toBeCloseTo(3521.55, 2);
        expect(res.status).toBe("DITERIMA");
    });

    it("identifies negative NPV reject condition", () => {
        const c0 = 5000;
        const ctList = [1000, 1000];
        const r = 10;

        const res = computeNpv(c0, ctList, r);

        expect(res.npv).toBeLessThan(0);
        expect(res.status).toBe("DITOLAK");
    });

    it("handles exact zero NPV neutral condition", () => {
        const c0 = 1000;
        const ct = 1100;
        const r = 10;

        const res = computeNpv(c0, ct, r);

        expect(res.npv).toBeCloseTo(0, 4);
        expect(res.status).toBe("NETRAL");
    });

    it("handles zero discount rate with multiple cash flows", () => {
        const c0 = 1000;
        const ctList = [600, 700];
        const r = 0;

        const res = computeNpv(c0, ctList, r);

        expect(res.pv).toBe(1300);
        expect(res.npv).toBe(300);
        expect(res.status).toBe("DITERIMA");
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
        expect(Array.isArray(entry.inputs)).toBe(true);
        expect(entry.inputs.length).toBe(3);

        for (const input of entry.inputs) {
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