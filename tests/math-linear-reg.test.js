import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadKatex } from "../scripts/lib/load-katex.mjs";
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

function visibleText(el) {
    const clone = el.cloneNode(true);
    clone.querySelectorAll(".katex-mathml").forEach((n) => n.remove());
    return clone.textContent.replace(/\s+/g, " ").trim();
}

function proseOnlyText(el) {
    const clone = el.cloneNode(true);
    clone.querySelectorAll(".katex, .lr-explain-tag").forEach((n) => n.remove());
    return clone.textContent.replace(/\s+/g, " ").trim();
}

function assertAllExplanationsUseKatex(form) {
    const boxes = form.querySelectorAll(".lr-explain-box");
    expect(boxes.length).toBeGreaterThan(0);
    const hasDigit = /\d/;
    const hasOp = new RegExp("[=+*\\/<>^]|\\B-|\\s-\\s");
    const hasMathVar = /\b(x|y|dx|dy|w0|w1|SSE|MSE|RMSE|MAE)\b/;
    boxes.forEach((box) => {
        expect(box.querySelectorAll(".katex").length).toBeGreaterThan(0);
        const prose = proseOnlyText(box.querySelector(".lr-explain-text"));
        expect(hasDigit.test(prose)).toBe(false);
        expect(hasOp.test(prose)).toBe(false);
        expect(hasMathVar.test(prose)).toBe(false);
    });
}

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

    describe("Auto-row tabulate, KaTeX explanations, and #after DOM flow", () => {
        const katexLib = loadKatex(pathToFileURL(path.resolve(process.cwd(), "vendor/katex/katex.min.js")));
        const rawHtml = fs.readFileSync(path.resolve(process.cwd(), "math.html"), "utf-8");
        const start39 = rawHtml.indexOf("<div id=\"math-calc-form-39\"");
        const end39 = rawHtml.indexOf("<div id=\"math-calc-form-40\"", start39);
        const form39Html = rawHtml.slice(start39, end39);
        const texCache = new Map();

        beforeEach(() => {
            document.body.innerHTML = form39Html;
            const fragCache = new Map();
            globalThis.katex = {
                render: (expr, el, opts) => {
                    const key = `${opts && opts.displayMode ? 1 : 0}:${expr}`;
                    let frag = fragCache.get(key);
                    if (frag === undefined) {
                        let html = texCache.get(key);
                        if (html === undefined) {
                            html = katexLib.renderToString(expr, opts);
                            texCache.set(key, html);
                        }
                        const tpl = document.createElement("template");
                        tpl.innerHTML = html;
                        frag = tpl.content;
                        fragCache.set(key, frag);
                    }
                    el.textContent = "";
                    el.appendChild(frag.cloneNode(true));
                }
            };
        });

        afterEach(() => {
            delete globalThis.katex;
        });

        it("auto-adds blank row, renders KaTeX in explanations/headings, and updates live on edits", () => {
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
            expect(document.getElementById("math39-n-val").querySelector(".katex-html").textContent).toBe("5");
            expect(document.getElementById("lr39-title-tab").querySelector(".katex-html").textContent).toBe("1.");
            expect(form.querySelectorAll(".lr-tab-label .katex").length).toBe(6);
            expect(visibleText(meanWrap)).toContain("2. mean");
            expect(visibleText(steps)).toContain("3. deviations");
            expect(form.querySelectorAll(".lr-explain-box").length).toBe(9);
            assertAllExplanationsUseKatex(form);
            expect(visibleText(steps)).toContain("3.8");

            toggleBtn.click();
            expect(form.classList.contains("lr-explain-open")).toBe(true);
            expect(toggleBtn.getAttribute("aria-expanded")).toBe("true");
            expect(visibleText(meanWrap)).toContain("jungkat-jungkit");

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

            const slopeExplain = visibleText(form.querySelectorAll(".lr-explain-box")[4]);
            expect(slopeExplain).toContain("naik");
            expect(slopeExplain).toContain("3.8");
            const y0In = tbody.firstElementChild.querySelectorAll("input")[1];
            y0In.value = "120";
            y0In.dispatchEvent(new window.Event("input"));
            const slopeUpdated = visibleText(form.querySelectorAll(".lr-explain-box")[4]);
            expect(slopeUpdated).not.toContain("3.8 poin");
            assertAllExplanationsUseKatex(form);
        }, 20000);

        it("updates dynamic KaTeX explanations for negative slope and exact fit", () => {
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
            const txt = visibleText(form);
            expect(txt).toContain("pola turun berlawanan");
            expect(txt).toContain("turun 10 poin");
            expect(txt).toContain("SSE=0");
            assertAllExplanationsUseKatex(form);
        }, 20000);
    });

    it("complies with zero-comment, zero-em-dash, line-limit, and TeX font rules", () => {
        const files = [
            "src/math/calculators/math-calc-39-engine.js",
            "src/math/calculators/math-calc-39-explain.js",
            "src/math/calculators/math-calc-39-cards.js",
            "src/math/calculators/math-calc-39.js",
            "tests/math-linear-reg.test.js"
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
