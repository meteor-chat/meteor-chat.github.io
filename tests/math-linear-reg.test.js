import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { describe, it, expect, beforeEach } from "vitest";
import {
    LR_PRESETS,
    computeLinearRegressionOLS,
    createGDState,
    stepGD
} from "../src/math/calculators/math-calc-39-engine.js";
import { FORMULAS } from "../src/math/math-formulas.js";
import { FORMULA_NAMES } from "../src/math/math-formula-names.js";
import { FORM_COUNT } from "../src/math/math-refs.js";
import { getFormulaUrl, parseFormulaUrl } from "../src/math/math-routes.js";
import { hasForm } from "../src/math/math-modules.js";
import { initMath39 } from "../src/math/calculators/math-calc-39.js";

function createMockCanvasCtx() {
    return {
        clearRect: () => {},
        fillRect: () => {},
        strokeRect: () => {},
        rect: () => {},
        clip: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        arc: () => {},
        fill: () => {},
        stroke: () => {},
        fillText: () => {},
        setLineDash: () => {},
        save: () => {},
        restore: () => {},
        scale: () => {},
        measureText: (txt) => ({ width: String(txt || "").length * 7 }),
        setTransform: () => {}
    };
}

describe("Formula 39: Linear Regression", () => {
    it("matches manual Excel/CSV/PDF calculations exactly", () => {
        const res = computeLinearRegressionOLS(LR_PRESETS.manual.points, 3);
        expect(res.valid).toBe(true);
        expect(res.n).toBe(5);
        expect(res.meanX).toBeCloseTo(6, 10);
        expect(res.meanY).toBeCloseTo(66, 10);
        expect(res.sxx).toBeCloseTo(40, 10);
        expect(res.sxy).toBeCloseTo(152, 10);
        expect(res.sst).toBeCloseTo(582, 10);
        expect(res.w1).toBeCloseTo(3.8, 10);
        expect(res.w0).toBeCloseTo(43.2, 10);

        expect(res.query.x).toBe(3);
        expect(res.query.yHat).toBeCloseTo(54.6, 10);
        expect(res.query.isExtrapolation).toBe(false);

        const expectedResiduals = [0.2, -0.4, 1.0, -1.6, 0.8];
        res.predRows.forEach((row, idx) => {
            expect(row.residual).toBeCloseTo(expectedResiduals[idx], 10);
        });

        expect(res.sse).toBeCloseTo(4.4, 10);
        expect(res.mse).toBeCloseTo(0.88, 10);
        expect(res.rmse).toBeCloseTo(Math.sqrt(0.88), 10);
        expect(res.mae).toBeCloseTo(0.8, 10);
        expect(res.maeSignedCheck).toBeCloseTo(0, 10);
        expect(res.r2).toBeCloseTo(1 - 4.4 / 582, 10);

        expect(res.checks.yAtMeanX).toBeCloseTo(66, 10);
        expect(res.checks.passesCentroid).toBe(true);
        expect(res.checks.sumResidual).toBeCloseTo(0, 10);
        expect(res.checks.residualsSumZero).toBe(true);
    });

    it("solves Week 9 Exercise 1 dataset accurately", () => {
        const res = computeLinearRegressionOLS(LR_PRESETS.ex1.points, 4);
        expect(res.valid).toBe(true);
        expect(res.meanX).toBeCloseTo(4, 10);
        expect(res.meanY).toBeCloseTo(53, 10);
        expect(res.w1).toBeCloseTo(4.2, 10);
        expect(res.w0).toBeCloseTo(36.2, 10);
        expect(res.query.yHat).toBeCloseTo(53, 10);
        expect(res.sse).toBeCloseTo(3.2, 10);
        expect(res.mse).toBeCloseTo(0.8, 10);
        expect(res.mae).toBeCloseTo(0.8, 10);
        expect(res.checks.passesCentroid).toBe(true);
        expect(res.checks.residualsSumZero).toBe(true);
    });

    it("computes Week 9 Slide 22 Gradient Descent step-by-step and converges", () => {
        const pts = LR_PRESETS.gd0.points;
        let state = createGDState(pts, 0, 0, false);
        expect(state.iter).toBe(0);
        expect(state.mse).toBeCloseTo(83 / 3, 6);
        expect(state.grad0).toBeCloseTo(-10, 6);
        expect(state.grad1).toBeCloseTo(-68 / 3, 6);

        state = stepGD(state, pts, 0.1);
        expect(state.iter).toBe(1);
        expect(state.w0).toBeCloseTo(1.0, 6);
        expect(state.w1).toBeCloseTo(2.2666666667, 6);
        expect(state.mse).toBeLessThan(83 / 3);

        for (let i = 0; i < 119; i++) {
            state = stepGD(state, pts, 0.1);
        }
        expect(state.w0).toBeCloseTo(1, 1);
        expect(state.w1).toBeCloseTo(2, 1);
        expect(state.mse).toBeLessThan(0.05);
    });

    it("recovers original scale weights under z-score GD and flags high-LR divergence", () => {
        const pts = LR_PRESETS.manual.points;
        let stdState = createGDState(pts, 0, 0, true);
        for (let i = 0; i < 100; i++) {
            stdState = stepGD(stdState, pts, 0.1);
        }
        expect(stdState.diverged).toBe(false);
        expect(stdState.w1).toBeCloseTo(3.8, 2);
        expect(stdState.w0).toBeCloseTo(43.2, 1);

        let rawDivState = createGDState(pts, 0, 0, false);
        for (let i = 0; i < 20 && !rawDivState.diverged; i++) {
            rawDivState = stepGD(rawDivState, pts, 0.35);
        }
        expect(rawDivState.diverged).toBe(true);
    });

    it("handles degenerate datasets and extrapolation warnings safely", () => {
        const single = computeLinearRegressionOLS([{ label: "A", x: 2, y: 10 }], 2);
        expect(single.valid).toBe(false);

        const vertical = computeLinearRegressionOLS([
            { label: "A", x: 5, y: 10 },
            { label: "B", x: 5, y: 20 }
        ], 5);
        expect(vertical.valid).toBe(false);
        expect(vertical.sxx).toBe(0);

        const horizontal = computeLinearRegressionOLS([
            { label: "A", x: 1, y: 42 },
            { label: "B", x: 3, y: 42 },
            { label: "C", x: 5, y: 42 }
        ], 8);
        expect(horizontal.valid).toBe(true);
        expect(horizontal.w1).toBe(0);
        expect(horizontal.w0).toBe(42);
        expect(horizontal.r2).toBe(1);
        expect(horizontal.query.isExtrapolation).toBe(true);
    });

    it("registers Formula 39 routes, names, and static HTML outputs", () => {
        expect(FORM_COUNT).toBe(39);
        expect(FORMULA_NAMES[39]).toBe("Linear Regression");
        expect(FORMULAS[39]).toBe("\\hat{y} = w_0 + w_1 x");
        expect(hasForm(39)).toBe(true);
        expect(getFormulaUrl(39)).toBe("/math/ai/11");
        expect(parseFormulaUrl("/math/ai/11")).toEqual({ id: 39, category: "Kecerdasan Artifisial" });
        expect(parseFormulaUrl("/math/ai/39")).toEqual({ id: 39, category: "Kecerdasan Artifisial" });
        expect(parseFormulaUrl("/math/39")).toEqual({ id: 39, category: "Kecerdasan Artifisial" });

        const routeHtml = path.resolve(process.cwd(), "math/ai/11/index.html");
        expect(fs.existsSync(routeHtml)).toBe(true);
    });

    describe("Interactive DOM controller integration", () => {
        beforeEach(() => {
            const html = fs.readFileSync(path.resolve(process.cwd(), "math.html"), "utf-8");
            document.documentElement.innerHTML = html;
            if (typeof window.HTMLCanvasElement !== "undefined") {
                window.HTMLCanvasElement.prototype.getContext = function getContextMock() {
                    return createMockCanvasCtx();
                };
            }
        });

        it("initializes UI, updates OLS query, switches preset and runs GD mode", () => {
            initMath39();
            const steps = document.getElementById("math39-steps-container");
            expect(steps.textContent).toContain("54.6");
            expect(steps.textContent).toContain("43.2");
            expect(steps.textContent).toContain("3.8");

            const preset = document.getElementById("math39-preset");
            preset.value = "ex1";
            preset.dispatchEvent(new window.Event("change"));
            expect(steps.textContent).toContain("36.2");
            expect(steps.textContent).toContain("4.2");

            const tabGd = document.getElementById("math39-tab-gd");
            tabGd.click();
            const gdPanel = document.getElementById("math39-gd-panel");
            expect(gdPanel.classList.contains("hidden")).toBe(false);

            const btnStep = document.getElementById("math39-btn-step");
            btnStep.click();
            expect(steps.textContent).toContain("Iterasi Saat Ini");
            expect(steps.textContent).toContain("1855.008");
        });
    });

    it("complies with zero-comment, zero-em-dash, line-limit, and font constraints", () => {
        const filesToCheck = [
            "src/math/calculators/math-calc-39-engine.js",
            "src/math/calculators/math-calc-39-cards.js",
            "src/math/calculators/math-calc-39.js",
            "src/math/visuals/math-visual-39.js",
            "tests/math-linear-reg.test.js"
        ];
        const emDash = "\u2014";
        for (const rel of filesToCheck) {
            const content = fs.readFileSync(path.resolve(process.cwd(), rel), "utf-8");
            const lines = content.split(/\r?\n/);
            expect(lines.length).toBeLessThanOrEqual(1000);
            expect(content.includes(emDash)).toBe(false);
            expect(/\/\*[\s\S]*?\*\//.test(content)).toBe(false);
            expect(/(^|\s)\/\//.test(content)).toBe(false);
        }

        const cssText = fs.readFileSync(path.resolve(process.cwd(), "styles/math.css"), "utf-8");
        const lrIdx = cssText.indexOf(".lr-page");
        expect(lrIdx).toBeGreaterThan(-1);
        const lrCss = cssText.slice(lrIdx);
        expect(lrCss.includes("700")).toBe(false);
        expect(lrCss.includes("bold")).toBe(false);
        expect(lrCss.includes("transition: all")).toBe(false);
        expect(lrCss.includes("/*")).toBe(false);

        const mathHtml = fs.readFileSync(path.resolve(process.cwd(), "math.html"), "utf-8");
        expect(mathHtml.split(/\r?\n/).length).toBeLessThanOrEqual(1000);
    });
});
