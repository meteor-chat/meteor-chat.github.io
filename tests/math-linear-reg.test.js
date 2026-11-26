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
    it("matches CSV manual calculations accurately", () => {
        const res = computeLinearRegressionOLS(DEFAULT_LR_POINTS);
        expect(res.valid).toBe(true);
        expect(res.n).toBe(5);
        expect(res.meanX).toBeCloseTo(6, 10);
        expect(res.meanY).toBeCloseTo(66, 10);
        expect(res.sxy).toBeCloseTo(152, 10);
        expect(res.sxx).toBeCloseTo(40, 10);
        expect(res.w1).toBeCloseTo(3.8, 10);
        expect(res.w0).toBeCloseTo(43.2, 10);
        expect(res.sse).toBeCloseTo(4.4, 10);
        expect(res.mse).toBeCloseTo(0.88, 10);
        expect(fmtNum(res.rmse, 2)).toBe("0.94");
        expect(res.mae).toBeCloseTo(0.8, 10);
    });

    it("registers Formula 39 routes and builds /math/ai/11", () => {
        expect(FORM_COUNT).toBe(40);
        expect(FORMULA_NAMES[39]).toBe("Linear Regression");
        expect(FORMULAS[39]).toBe("\\hat{y} = w_0 + w_1 x");
        expect(hasForm(39)).toBe(true);
        expect(getFormulaUrl(39)).toBe("/math/ai/11");
        expect(parseFormulaUrl("/math/ai/11")).toEqual({ id: 39, category: "Kecerdasan Artifisial" });
        expect(fs.existsSync(path.resolve(process.cwd(), "math/ai/11/index.html"))).toBe(true);
    });

    describe("Auto-row tabulate and #after DOM flow", () => {
        beforeEach(() => {
            const rawHtml = fs.readFileSync(path.resolve(process.cwd(), "math.html"), "utf-8");
            document.documentElement.innerHTML = rawHtml.replace(/<style[\s\S]*?<\/style>/g, "");
        });

        it("auto-adds blank row when typing and removes cleared rows with no add/delete buttons", () => {
            initMath39();
            const form = document.getElementById("math-calc-form-39");
            const tbody = document.getElementById("math39-tabulate-body");
            const steps = document.getElementById("math39-steps-container");
            const meanWrap = document.getElementById("math39-mean-wrap");
            const toggleBtn = document.getElementById("math39-btn-explain-toggle");

            expect(form.querySelectorAll("button").length).toBe(2);
            expect(toggleBtn.getAttribute("aria-expanded")).toBe("false");
            expect(form.classList.contains("lr-explain-open")).toBe(false);
            expect(tbody.children.length).toBe(6);
            expect(document.getElementById("math39-n-val").textContent).toBe("5");
            expect(meanWrap.textContent).toContain("mean");
            expect(steps.textContent).toContain("deviations");
            expect(form.querySelectorAll(".lr-explain-box").length).toBe(9);
            expect(steps.textContent).toContain("3.8");

            toggleBtn.click();
            expect(form.classList.contains("lr-explain-open")).toBe(true);
            expect(toggleBtn.getAttribute("aria-expanded")).toBe("true");
            expect(meanWrap.textContent).toContain("jungkat-jungkit");

            toggleBtn.click();
            expect(form.classList.contains("lr-explain-open")).toBe(false);
            expect(toggleBtn.getAttribute("aria-expanded")).toBe("false");

            const lastInputs = tbody.lastElementChild.querySelectorAll("input");
            lastInputs[0].value = "12";
            lastInputs[0].dispatchEvent(new window.Event("input"));
            expect(tbody.children.length).toBe(7);

            const rowAInputs = tbody.firstElementChild.querySelectorAll("input");
            rowAInputs[0].value = "";
            rowAInputs[0].dispatchEvent(new window.Event("input"));
            rowAInputs[1].value = "";
            rowAInputs[1].dispatchEvent(new window.Event("input"));
            expect(tbody.children.length).toBe(6);

            const slopeExplain = form.querySelectorAll(".lr-explain-box")[4].textContent;
            expect(slopeExplain).toContain("naik");
            expect(slopeExplain).toContain("3.8");
            const y0In = tbody.firstElementChild.querySelectorAll("input")[1];
            y0In.value = "120";
            y0In.dispatchEvent(new window.Event("input"));
            const slopeUpdated = form.querySelectorAll(".lr-explain-box")[4].textContent;
            expect(slopeUpdated).not.toContain("3.8 poin");
        });
    });

    it("updates dynamic explanations for negative slope and exact fit", () => {
        const rawHtml = fs.readFileSync(path.resolve(process.cwd(), "math.html"), "utf-8");
        document.documentElement.innerHTML = rawHtml.replace(/<style[\s\S]*?<\/style>/g, "");
        initMath39();
        const form = document.getElementById("math-calc-form-39");
        const tbody = document.getElementById("math39-tabulate-body");
        while (tbody.children.length > 4) {
            const inputs = tbody.firstElementChild.querySelectorAll("input");
            inputs[0].value = "";
            inputs[0].dispatchEvent(new window.Event("input"));
            inputs[1].value = "";
            inputs[1].dispatchEvent(new window.Event("input"));
        }
        const pairs = [[1, 90], [3, 70], [5, 50]];
        pairs.forEach(([x, y], i) => {
            const inputs = tbody.children[i].querySelectorAll("input");
            inputs[0].value = String(x);
            inputs[0].dispatchEvent(new window.Event("input"));
            inputs[1].value = String(y);
            inputs[1].dispatchEvent(new window.Event("input"));
        });
        const txt = form.textContent;
        expect(txt).toContain("pola turun berlawanan");
        expect(txt).toContain("turun 10 poin");
        expect(txt).toContain("SSE = 0");
    });

    it("complies with zero-comment, zero-em-dash, line-limit, and TeX font rules", () => {
        const files = [
            "src/math/calculators/math-calc-39-engine.js",
            "src/math/calculators/math-calc-39-explain.js",
            "src/math/calculators/math-calc-39-cards.js",
            "src/math/calculators/math-calc-39.js",
            "tests/math-linear-reg.test.js"
        ];
        for (const rel of files) {
            const c = fs.readFileSync(path.resolve(process.cwd(), rel), "utf-8");
            expect(c.split(/\r?\n/).length).toBeLessThanOrEqual(1000);
            expect(c.includes("\u2014")).toBe(false);
            expect(/\/\*[\s\S]*?\*\//.test(c)).toBe(false);
            expect(/(^|\s)\/\//.test(c)).toBe(false);
        }
        const css = fs.readFileSync(path.resolve(process.cwd(), "styles/math.css"), "utf-8");
        const lrCss = css.slice(css.indexOf(".lr-page"));
        expect(lrCss.includes("KaTeX_Main")).toBe(true);
        expect(lrCss.includes("Roboto Mono")).toBe(false);
        expect(lrCss.includes("700")).toBe(false);
    });
});
