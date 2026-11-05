import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import {
    LANDSCAPES,
    calcMetropolis,
    computeNextTemp,
    generateNeighbor,
    getTempStatus,
    createInitialState,
    stepSA
} from "../src/math/calculators/math-calc-38-engine.js";
import { FORMULAS } from "../src/math/math-formulas.js";
import { FORMULA_NAMES } from "../src/math/math-formula-names.js";
import { getFormulaUrl, parseFormulaUrl, FORMULA_CATEGORIES } from "../src/math/math-routes.js";
import { FORM_COUNT } from "../src/math/math-refs.js";

describe("Simulated Annealing Engine (math-calc-38-engine)", () => {
    it("evaluates doubleWell benchmark potential correctly", () => {
        const dw = LANDSCAPES.doubleWell;
        expect(dw.eval(0)).toBeCloseTo(1.0, 5);
        expect(dw.eval(1)).toBeCloseTo(0.1, 5);
        expect(dw.eval(-1)).toBeCloseTo(-0.1, 5);
    });

    it("evaluates rastrigin benchmark potential correctly", () => {
        const rast = LANDSCAPES.rastrigin;
        expect(rast.eval(0)).toBeCloseTo(0.0, 5);
        expect(rast.eval(1)).toBeCloseTo(1.0, 5);
    });

    it("evaluates quadratic benchmark correctly", () => {
        const q = LANDSCAPES.quadratic;
        expect(q.eval(0)).toBe(0);
        expect(q.eval(3)).toBe(9);
    });

    it("computes Metropolis acceptance probability accurately", () => {
        expect(calcMetropolis(-2.5, 100)).toBe(1.0);
        expect(calcMetropolis(0, 50)).toBe(1.0);
        const p1 = calcMetropolis(10, 100);
        expect(p1).toBeCloseTo(Math.exp(-0.1), 5);
        expect(calcMetropolis(10, 0)).toBe(0.0);
        const pLowT = calcMetropolis(10, 2);
        const pHighT = calcMetropolis(10, 100);
        expect(pHighT).toBeGreaterThan(pLowT);
    });

    it("computes cooling schedules correctly", () => {
        const nextGeom = computeNextTemp(100, 100, 1, "geometric", 0.95);
        expect(nextGeom).toBeCloseTo(95, 4);
        const nextLin = computeNextTemp(100, 100, 1, "linear", 0.95, 100, 0.001);
        expect(nextLin).toBeLessThan(100);
        const nextHarm = computeNextTemp(100, 100, 10, "harmonic", 0.95);
        expect(nextHarm).toBeLessThan(100);
    });

    it("clamps neighbors within landscape domain", () => {
        const fn = LANDSCAPES.doubleWell;
        for (let i = 0; i < 50; i++) {
            const cand = generateNeighbor(2.0, 1.5, fn.domain[0], fn.domain[1]);
            expect(cand).toBeGreaterThanOrEqual(fn.domain[0]);
            expect(cand).toBeLessThanOrEqual(fn.domain[1]);
        }
    });

    it("returns appropriate temperature status levels", () => {
        expect(getTempStatus(80, 100).level).toBe("hot");
        expect(getTempStatus(40, 100).level).toBe("warm");
        expect(getTempStatus(15, 100).level).toBe("cool");
        expect(getTempStatus(2, 100).level).toBe("freeze");
    });

    it("creates initial simulation state cleanly", () => {
        const init = createInitialState("doubleWell", 1.2, 100);
        expect(init.iter).toBe(0);
        expect(init.currX).toBeCloseTo(1.2, 5);
        expect(init.bestX).toBeCloseTo(1.2, 5);
        expect(init.bestE).toBe(init.currE);
        expect(init.acceptedCount).toBe(0);
    });

    it("executes single step in SA and tracks history monotonically for best energy", () => {
        const params = { landscape: "doubleWell", schedule: "geometric", sigma: 0.35, alpha: 0.95, t0: 100 };
        let state = createInitialState("doubleWell", 1.5, 100);
        for (let i = 0; i < 20; i++) {
            const next = stepSA(state, params);
            expect(next.iter).toBe(state.iter + 1);
            expect(next.bestE).toBeLessThanOrEqual(state.bestE);
            state = next;
        }
    });
});

describe("Formula 38 Integration & Routing", () => {
    it("registers formula 38 in registry and routes", () => {
        expect(FORM_COUNT).toBe(38);
        expect(FORMULAS[38]).toBe("P = \\exp\\left(-\\frac{\\Delta E}{T}\\right)");
        expect(FORMULA_NAMES[38]).toBe("Simulated Annealing");
        expect(FORMULA_CATEGORIES[38]).toBe("Kecerdasan Artifisial");
        expect(getFormulaUrl(38)).toBe("/math/ai/10");
        expect(parseFormulaUrl("/math/ai/10")).toEqual({ id: 38, category: "Kecerdasan Artifisial" });
        expect(parseFormulaUrl("/math/ai/38")).toEqual({ id: 38, category: "Kecerdasan Artifisial" });
        expect(parseFormulaUrl("/math/38")).toEqual({ id: 38, category: "Kecerdasan Artifisial" });
    });

    it("verifies static route math/ai/10/index.html was generated", () => {
        expect(existsSync("math/ai/10/index.html")).toBe(true);
    });
});

describe("Zero Comments & Line Count Rules", () => {
    const files = [
        "src/math/calculators/math-calc-38-engine.js",
        "src/math/calculators/math-calc-38.js",
        "src/math/visuals/math-visual-38.js",
        "styles/math.css",
        "src/math/math-formulas.js",
        "src/math/math-formula-names.js",
        "src/math/math-routes.js",
        "src/math/math-refs.js",
        "src/math/math-inputs.js",
        "tests/math-sa.test.js"
    ];

    it("verifies all files have <= 300 lines", () => {
        [...files, "src/math/math-modules.js"].forEach((file) => {
            const content = readFileSync(file, "utf8");
            const lines = content.split("\n").length;
            expect(lines).toBeLessThanOrEqual(300);
        });
    });

    it("verifies all files contain zero comments", () => {
        const commentRegex = new RegExp("\\/\\*|\\/\\/");
        files.forEach((file) => {
            const content = readFileSync(file, "utf8");
            expect(commentRegex.test(content)).toBe(false);
        });
        const modContent = readFileSync("src/math/math-modules.js", "utf8");
        const modWithoutUrls = modContent.replace(/https:\/\/[^"\s]+/g, "");
        expect(commentRegex.test(modWithoutUrls)).toBe(false);
    });

    it("verifies math.html contains zero HTML comments", () => {
        const html = readFileSync("math.html", "utf8");
        const htmlCommentRegex = new RegExp("<" + "!-" + "-");
        expect(htmlCommentRegex.test(html)).toBe(false);
    });
});
