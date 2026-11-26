import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadKatex } from "../scripts/lib/load-katex.mjs";
import {
    DEFAULT_LOGREG_POINTS,
    sigmoid,
    computeLogisticIteration,
    computeLogisticRegression
} from "../src/math/calculators/math-calc-40-engine.js";
import { FORMULAS } from "../src/math/math-formulas.js";
import { FORMULA_NAMES } from "../src/math/math-formula-names.js";
import { FORM_COUNT } from "../src/math/math-refs.js";
import { getFormulaUrl, parseFormulaUrl } from "../src/math/math-routes.js";
import { hasForm } from "../src/math/math-modules.js";
import { initMath40 } from "../src/math/calculators/math-calc-40.js";
import { wrapNeg } from "../src/math/calculators/math-calc-39-cards.js";

describe("Formula 40: Logistic Regression", () => {
    it("matches CSV manual spreadsheet and Slide 35 iterations accurately", () => {
        const res = computeLogisticRegression(DEFAULT_LOGREG_POINTS, 0, 0, 1, 0.5, 5);
        expect(res.valid).toBe(true);
        expect(res.n).toBe(5);
        expect(res.avgLoss).toBeCloseTo(Math.log(2), 6);
        expect(res.avgGw0).toBeCloseTo(0.1, 6);
        expect(res.avgGw1).toBeCloseTo(-0.4, 6);
        expect(res.newW0).toBeCloseTo(-0.1, 6);
        expect(res.newW1).toBeCloseTo(0.4, 6);
        expect(res.afterLoss).toBeCloseTo(0.5634, 3);
        expect(res.afterRows.map((r) => Number(r.alpha.toFixed(4)))).toEqual([0.2891, 0.3775, 0.475, 0.5744, 0.6682]);
        expect(res.trace.length).toBe(5);
        expect(res.trace[2].avgLoss).toBeCloseTo(0.5234, 3);
        expect(res.trace[3].avgLoss).toBeCloseTo(0.5069, 3);
    });

    it("handles extreme sigmoid logits, empty rows, and invalid binary targets safely", () => {
        expect(sigmoid(1000)).toBe(1);
        expect(sigmoid(-1000)).toBe(0);
        expect(Number.isFinite(sigmoid(1e6))).toBe(true);
        expect(wrapNeg(-0.00001, 4)).toBe("0");
        expect(wrapNeg(-0.5, 4)).toBe("(-0.5)");

        const withBlank = computeLogisticIteration([...DEFAULT_LOGREG_POINTS, { x: "", y: "" }], 0, 0, 0.5);
        expect(withBlank.valid).toBe(true);
        expect(withBlank.n).toBe(5);

        expect(computeLogisticIteration([], 0, 0, 0.5).valid).toBe(false);
        expect(computeLogisticIteration([{ x: 1, y: 2 }], 0, 0, 0.5).valid).toBe(false);
        expect(computeLogisticIteration(DEFAULT_LOGREG_POINTS, 0, 0, 1.5).valid).toBe(false);
        expect(computeLogisticRegression(DEFAULT_LOGREG_POINTS, 0, 0, -1, 0.5, 5).valid).toBe(false);
    });

    it("registers Formula 40 routes and builds /math/ai/12", () => {
        expect(FORM_COUNT).toBe(40);
        expect(FORMULA_NAMES[40]).toBe("Logistic Regression");
        expect(FORMULAS[40]).toBe("p = \\sigma(w_0 + w_1 x)");
        expect(hasForm(40)).toBe(true);
        expect(getFormulaUrl(40)).toBe("/math/ai/12");
        expect(parseFormulaUrl("/math/ai/12")).toEqual({ id: 40, category: "Kecerdasan Artifisial" });
        expect(fs.existsSync(path.resolve(process.cwd(), "math/ai/12/index.html"))).toBe(true);
    });

    describe("Auto-row tabulate, live parameter recalculation, and color tokens", () => {
        const katexLib = loadKatex(pathToFileURL(path.resolve(process.cwd(), "vendor/katex/katex.min.js")));

        beforeEach(() => {
            const rawHtml = fs.readFileSync(path.resolve(process.cwd(), "math.html"), "utf-8");
            document.documentElement.innerHTML = rawHtml.replace(/<style[\s\S]*?<\/style>/g, "");
            globalThis.katex = {
                render: (expr, el, opts) => {
                    el.innerHTML = katexLib.renderToString(expr, opts);
                }
            };
        });

        afterEach(() => {
            delete globalThis.katex;
        });

        it("renders 5 active rows + 1 blank row and updates live on edits", () => {
            initMath40();
            const tbody = document.getElementById("math40-tabulate-body");
            const steps = document.getElementById("math40-steps-container");

            const nHtml = () => document.getElementById("math40-n-val").querySelector(".katex-html").textContent;
            expect(tbody.children.length).toBe(6);
            expect(nHtml()).toBe("5");
            expect(steps.textContent).toContain("linear score (z) and sigmoid probability");
            expect(steps.textContent).toContain("gradient descent iterations");
            expect(steps.querySelectorAll(".lr40-upd-grid").length).toBe(1);
            expect(steps.querySelectorAll(".lr-diagram-unit").length).toBe(5);
            expect(steps.querySelectorAll("tfoot .lr-tok-err").length).toBe(2);
            const iterTable = steps.querySelector("section:last-child table tbody");
            expect(iterTable.querySelectorAll(".lr-tok-w0").length).toBe(10);
            expect(iterTable.querySelectorAll(".lr-tok-w1").length).toBe(10);
            expect(iterTable.querySelectorAll(".lr-tok-err").length).toBe(5);

            const lastInputs = tbody.lastElementChild.querySelectorAll("input");
            lastInputs[0].value = "3";
            lastInputs[0].dispatchEvent(new window.Event("input"));
            lastInputs[1].value = "1";
            lastInputs[1].dispatchEvent(new window.Event("input"));
            expect(tbody.children.length).toBe(7);
            expect(nHtml()).toBe("6");

            const firstInputs = tbody.firstElementChild.querySelectorAll("input");
            firstInputs[0].value = "";
            firstInputs[0].dispatchEvent(new window.Event("input"));
            firstInputs[1].value = "";
            firstInputs[1].dispatchEvent(new window.Event("input"));
            expect(tbody.children.length).toBe(6);
            expect(nHtml()).toBe("5");

            const w0In = document.getElementById("math40-in-w0");
            w0In.value = "-0.2";
            w0In.dispatchEvent(new window.Event("input"));
            expect(steps.textContent).toContain("-0.2");

            const rowInputs = tbody.firstElementChild.querySelectorAll("input");
            rowInputs[1].value = "2";
            rowInputs[1].dispatchEvent(new window.Event("input"));
            expect(steps.querySelector(".lr-subnote-warn")).not.toBeNull();
            expect(nHtml()).toBe("5");
        });
    });

    it("complies with zero-comment, zero-em-dash, line-limit, and TeX font rules", () => {
        const files = [
            "src/math/calculators/math-calc-40-engine.js",
            "src/math/calculators/math-calc-40-cards.js",
            "src/math/calculators/math-calc-40.js",
            "tests/math-logistic-reg.test.js"
        ];
        const blockComment = new RegExp("\\/\\*[\\s\\S]*?\\*\\/");
        const lineComment = new RegExp("(^|\\s)\\/\\/");
        for (const rel of files) {
            const c = fs.readFileSync(path.resolve(process.cwd(), rel), "utf-8");
            expect(c.split(/\r?\n/).length).toBeLessThanOrEqual(1000);
            expect(c.includes("\u2014")).toBe(false);
            expect(blockComment.test(c)).toBe(false);
            expect(lineComment.test(c)).toBe(false);
        }
        const css = fs.readFileSync(path.resolve(process.cwd(), "styles/math.css"), "utf-8");
        const lrCss = css.slice(css.indexOf(".lr-page"));
        expect(lrCss.includes("KaTeX_Main")).toBe(true);
        expect(lrCss.includes("Roboto Mono")).toBe(false);
        expect(lrCss.includes("700")).toBe(false);
    });
});
