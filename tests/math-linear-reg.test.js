import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { describe, it, expect, beforeEach } from "vitest";
import {
    DEFAULT_LR_POINTS,
    computeLinearRegressionOLS,
    fmtNum
} from "../src/math/calculators/math-calc-39-engine.js";
import { FORMULAS } from "../src/math/math-formulas.js";
import { FORMULA_NAMES } from "../src/math/math-formula-names.js";
import { FORM_COUNT } from "../src/math/math-refs.js";
import { getFormulaUrl, parseFormulaUrl } from "../src/math/math-routes.js";
import { hasForm } from "../src/math/math-modules.js";
import { initMath39 } from "../src/math/calculators/math-calc-39.js";

describe("Formula 39: Linear Regression", () => {
    it("matches CSV and 4-screenshot manual calculations step by step", () => {
        const res = computeLinearRegressionOLS(DEFAULT_LR_POINTS);
        expect(res.valid).toBe(true);
        expect(res.n).toBe(5);
        expect(res.meanX).toBeCloseTo(6, 10);
        expect(res.meanY).toBeCloseTo(66, 10);

        expect(res.rows.map((r) => r.dx)).toEqual([-4, -2, 0, 2, 4]);
        expect(res.rows.map((r) => r.dy)).toEqual([-15, -8, 1, 6, 16]);
        expect(res.rows.map((r) => r.dxdy)).toEqual([60, 16, 0, 12, 64]);
        expect(res.rows.map((r) => r.dx2)).toEqual([16, 4, 0, 4, 16]);

        expect(res.sxy).toBeCloseTo(152, 10);
        expect(res.sxx).toBeCloseTo(40, 10);
        expect(res.w1).toBeCloseTo(3.8, 10);
        expect(res.w0).toBeCloseTo(43.2, 10);

        const expectedPred = [50.8, 58.4, 66, 73.6, 81.2];
        const expectedRes = [0.2, -0.4, 1, -1.6, 0.8];
        const expectedSse = [0.04, 0.16, 1, 2.56, 0.64];
        res.predRows.forEach((r, i) => {
            expect(r.predict).toBeCloseTo(expectedPred[i], 10);
            expect(r.residual).toBeCloseTo(expectedRes[i], 10);
            expect(r.sse).toBeCloseTo(expectedSse[i], 10);
            expect(r.absRes).toBeCloseTo(Math.abs(expectedRes[i]), 10);
        });

        expect(res.sumResidual).toBeCloseTo(0, 10);
        expect(res.sse).toBeCloseTo(4.4, 10);
        expect(res.sumAbsRes).toBeCloseTo(4, 10);
        expect(res.mse).toBeCloseTo(0.88, 10);
        expect(fmtNum(res.rmse, 2)).toBe("0.94");
        expect(res.mae).toBeCloseTo(0.8, 10);
    });

    it("handles fewer than 2 points, identical x, and constant y safely", () => {
        const one = computeLinearRegressionOLS([{ x: 2, y: 50 }]);
        expect(one.valid).toBe(false);

        const sameX = computeLinearRegressionOLS([
            { x: 5, y: 10 },
            { x: 5, y: 20 }
        ]);
        expect(sameX.valid).toBe(false);
        expect(sameX.sxx).toBe(0);

        const flatY = computeLinearRegressionOLS([
            { x: 1, y: 40 },
            { x: 3, y: 40 },
            { x: 5, y: 40 }
        ]);
        expect(flatY.valid).toBe(true);
        expect(flatY.w1).toBe(0);
        expect(flatY.w0).toBe(40);
        expect(flatY.sse).toBe(0);
        expect(flatY.mse).toBe(0);
    });

    it("registers Formula 39 routes, names, and static HTML outputs", () => {
        expect(FORM_COUNT).toBe(39);
        expect(FORMULA_NAMES[39]).toBe("Linear Regression");
        expect(FORMULAS[39]).toBe("\\hat{y} = w_0 + w_1 x");
        expect(hasForm(39)).toBe(true);
        expect(getFormulaUrl(39)).toBe("/math/ai/11");
        expect(parseFormulaUrl("/math/ai/11")).toEqual({ id: 39, category: "Kecerdasan Artifisial" });

        const routeHtml = path.resolve(process.cwd(), "math/ai/11/index.html");
        expect(fs.existsSync(routeHtml)).toBe(true);
    });

    describe("Interactive 2-input (x, y) automatic flow DOM integration", () => {
        beforeEach(() => {
            const html = fs.readFileSync(path.resolve(process.cwd(), "math.html"), "utf-8");
            document.documentElement.innerHTML = html;
        });

        it("accepts only x and y inputs and auto-computes mean through SSE below", () => {
            initMath39();
            const form = document.getElementById("math-calc-form-39");
            const tbody = document.getElementById("math39-tabulate-body");
            const steps = document.getElementById("math39-steps-container");

            expect(form.querySelectorAll("input").length).toBe(10);
            expect(tbody.querySelectorAll("input").length).toBe(10);

            const txt = steps.textContent;
            expect(txt).toContain("mean");
            expect(txt).toContain("deviations");
            expect(txt).toContain("two sums");
            expect(txt).toContain("slope");
            expect(txt).toContain("intercept");
            expect(txt).toContain("prediction");
            expect(txt).toContain("residuals and SSE");
            expect(txt).toContain("152");
            expect(txt).toContain("40");
            expect(txt).toContain("3.8");
            expect(txt).toContain("43.2");
            expect(txt).toContain("50.8");
            expect(txt).toContain("4.4");
            expect(txt).toContain("0.88");

            const firstY = tbody.querySelectorAll("input")[1];
            firstY.value = "52";
            firstY.dispatchEvent(new window.Event("input"));
            expect(steps.textContent).toContain("66.2");

            document.getElementById("math39-btn-add").click();
            expect(tbody.querySelectorAll("input").length).toBe(12);

            document.getElementById("math39-btn-reset").click();
            expect(tbody.querySelectorAll("input").length).toBe(10);
            expect(steps.textContent).toContain("43.2");
        });
    });

    it("complies with zero-comment, zero-em-dash, line-limit, and font constraints", () => {
        const filesToCheck = [
            "src/math/calculators/math-calc-39-engine.js",
            "src/math/calculators/math-calc-39-cards.js",
            "src/math/calculators/math-calc-39.js",
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
