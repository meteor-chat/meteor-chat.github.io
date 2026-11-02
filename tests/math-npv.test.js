import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { computeNpv } from "../src/math/calculators/math-calc-37.js";
import { PM_GUIDE_DATA } from "../src/math/calculators/math-calc-pm-guide-data.js";
import { FORMULAS } from "../src/math/math-formulas.js";
import { FORMULA_NAMES } from "../src/math/math-formula-names.js";
import { FORMULA_URLS, parseFormulaUrl } from "../src/math/math-routes.js";

describe("math-npv (Formula 37 - Simplified Rapid)", () => {
    it("computes positive NPV and accepted status correctly", () => {
        const c0 = 1000;
        const ct = 1200;
        const r = 10;

        const res = computeNpv(c0, ct, r);

        expect(res.pv).toBeCloseTo(1090.91, 2);
        expect(res.npv).toBeCloseTo(90.91, 2);
        expect(res.roi).toBeCloseTo(9.09, 2);
        expect(res.status).toBe("DITERIMA");
    });

    it("computes negative NPV and rejected status correctly", () => {
        const c0 = 1000;
        const ct = 1000;
        const r = 10;

        const res = computeNpv(c0, ct, r);

        expect(res.pv).toBeCloseTo(909.09, 2);
        expect(res.npv).toBeCloseTo(-90.91, 2);
        expect(res.status).toBe("DITOLAK");
    });

    it("computes exact zero NPV and neutral status correctly", () => {
        const c0 = 1000;
        const ct = 1100;
        const r = 10;

        const res = computeNpv(c0, ct, r);

        expect(res.pv).toBeCloseTo(1000, 4);
        expect(res.npv).toBeCloseTo(0, 4);
        expect(res.status).toBe("NETRAL");
    });

    it("handles zero discount rate correctly", () => {
        const c0 = 1000;
        const ct = 1500;
        const r = 0;

        const res = computeNpv(c0, ct, r);

        expect(res.pv).toBe(1500);
        expect(res.npv).toBe(500);
        expect(res.roi).toBe(50);
        expect(res.status).toBe("DITERIMA");
    });

    it("handles zero cash inflow correctly", () => {
        const c0 = 500;
        const ct = 0;
        const r = 5;

        const res = computeNpv(c0, ct, r);

        expect(res.pv).toBe(0);
        expect(res.npv).toBe(-500);
        expect(res.status).toBe("DITOLAK");
    });

    it("registers formula 37 metadata and routing correctly", () => {
        expect(FORMULAS[37]).toBe("NPV = \\frac{C_t}{1 + r} - C_0");
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
        expect(entry.formula).toBe("NPV = \\frac{C_t}{1 + r} - C_0");
        expect(Array.isArray(entry.inputs)).toBe(true);
        expect(entry.inputs.length).toBe(3);

        expect(entry.inputs[0].name).toContain("C0");
        expect(entry.inputs[1].name).toContain("Ct");
        expect(entry.inputs[2].name).toContain("r");

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