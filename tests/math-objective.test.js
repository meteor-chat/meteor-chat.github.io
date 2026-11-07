import { describe, it, expect, beforeEach, vi } from "vitest";
import fs from "fs";
import { refs } from "../src/core/dom-refs.js";
import {
    renderTopFormula2,
    renderParamLabels2,
    renderObjectiveCards
} from "../src/math/calculators/math-calc-2-cards.js";
import { bindObjTokenHover } from "../src/math/calculators/math-calc-2-tokens.js";
import { calculateMath2 } from "../src/math/calculators/math-calc-2.js";
import {
    evaluateGradient,
    evaluateHessian,
    renderObjectiveCriticalAnalysis
} from "../src/math/calculators/math-calc-2-critical.js";
import { sampleColormap } from "../src/math/visuals/math-visual-colormap.js";
import {
    evaluateH,
    setObjectiveVisualMode,
    setObjectiveColormap,
    getObjectiveVisualState
} from "../src/math/visuals/math-visual-2.js";

describe("math-objective evaluation and cards", () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="math-calc-form-2">
                <div id="math-calc-formula-display-2"></div>
                <div class="obj-sci-toolbar">
                    <button type="button" id="obj-mode-contour-btn" class="active">Kontur 2D</button>
                    <button type="button" id="obj-mode-slices-btn">Irisan 1D</button>
                    <select id="obj-colormap-select">
                        <option value="viridis" selected>Viridis</option>
                        <option value="cividis">Cividis</option>
                        <option value="rdbu">RdBu</option>
                    </select>
                </div>
                <div id="obj-label-x1"></div>
                <div id="obj-label-x2"></div>
                <input id="math2-in-x1" value="2" />
                <input id="math2-in-x2" value="3" />
                <div id="obj-card-step1"></div>
                <div id="obj-card-step2"></div>
                <div id="obj-card-step3"></div>
                <div id="obj-card-step4"></div>
                <div id="obj-card-step5"></div>
                <div id="obj-critical-cards-container"></div>
                <canvas id="math2-canvas" width="340" height="340"></canvas>
            </div>
        `;
        refs.m2InX1 = document.getElementById("math2-in-x1");
        refs.m2InX2 = document.getElementById("math2-in-x2");

        window.katex = {
            render: vi.fn((tex, el) => {
                el.innerHTML = tex;
            })
        };
    });

    it("renders syllabus formula and step cards correctly for x1=2, x2=3", () => {
        renderTopFormula2();
        const formulaBox = document.getElementById("math-calc-formula-display-2");
        expect(formulaBox.innerHTML).toContain("x_1");
        expect(formulaBox.innerHTML).toContain("x_2");

        renderObjectiveCards(2, 3);
        const c1 = document.getElementById("obj-card-step1");
        const c2 = document.getElementById("obj-card-step2");
        const c3 = document.getElementById("obj-card-step3");
        const c4 = document.getElementById("obj-card-step4");
        const c5 = document.getElementById("obj-card-step5");

        expect(c1.innerHTML).toContain("2");
        expect(c2.innerHTML).toContain("8");
        expect(c3.innerHTML).toContain("3");
        expect(c4.innerHTML).toContain("8 + 3");
        expect(c5.innerHTML).toContain("11");
    });

    it("evaluates negative inputs correctly", () => {
        renderObjectiveCards(-2, -3);
        const c1 = document.getElementById("obj-card-step1");
        const c2 = document.getElementById("obj-card-step2");
        const c3 = document.getElementById("obj-card-step3");
        const c4 = document.getElementById("obj-card-step4");
        const c5 = document.getElementById("obj-card-step5");

        expect(c1.innerHTML).toContain("{-2}");
        expect(c2.innerHTML).toContain("-8");
        expect(c3.innerHTML).toContain("3");
        expect(c4.innerHTML).toContain("-8 + 3");
        expect(c5.innerHTML).toContain("-5");
    });

    it("evaluates decimal inputs accurately", () => {
        renderObjectiveCards(1.5, 3);
        const c5 = document.getElementById("obj-card-step5");
        expect(c5.innerHTML).toContain("6.375");
    });

    it("handles invalid inputs gracefully", () => {
        renderObjectiveCards(NaN, 3);
        const c1 = document.getElementById("obj-card-step1");
        const c2 = document.getElementById("obj-card-step2");
        expect(c1.textContent).toContain("Masukkan nilai x₁ dan x₂ yang valid");
        expect(c2.textContent).toBe("");
    });

    it("renders param labels without throwing", () => {
        renderParamLabels2();
        const l1 = document.getElementById("obj-label-x1");
        const l2 = document.getElementById("obj-label-x2");
        expect(l1.innerHTML).toContain("x_1");
        expect(l2.innerHTML).toContain("x_2");
    });

    it("binds token hover highlight events correctly", () => {
        document.body.innerHTML += `
            <span class="obj-token-x1">token1</span>
            <span class="obj-token-x1">token2</span>
        `;
        bindObjTokenHover();
        const input1 = document.getElementById("math2-in-x1");
        const tokens = document.querySelectorAll(".obj-token-x1");

        input1.dispatchEvent(new window.MouseEvent("mouseenter", { bubbles: true }));
        tokens.forEach((t) => expect(t.classList.contains("obj-glow-x1")).toBe(true));

        input1.dispatchEvent(new window.MouseEvent("mouseleave", { bubbles: true }));
        tokens.forEach((t) => expect(t.classList.contains("obj-glow-x1")).toBe(false));
    });

    it("calculates and triggers step card cascade via calculateMath2", () => {
        calculateMath2();
        const c5 = document.getElementById("obj-card-step5");
        expect(c5.innerHTML).toContain("11");
    });

    it("evaluates calculus gradient and Hessian correctly", () => {
        const grad = evaluateGradient(2, 3);
        expect(grad.dh_dx1).toBeCloseTo(12, 4);
        expect(grad.dh_dx2).toBeCloseTo(2, 4);
        expect(grad.mag).toBeCloseTo(Math.hypot(12, 2), 4);

        const hessPos = evaluateHessian(2);
        expect(hessPos.det).toBeCloseTo(8, 4);
        expect(hessPos.classification).toContain("Konveks");

        const hessNeg = evaluateHessian(-1);
        expect(hessNeg.det).toBeCloseTo(-4, 4);
        expect(hessNeg.classification).toContain("Sadel");

        const hessZero = evaluateHessian(0);
        expect(hessZero.det).toBeCloseTo(0, 4);
        expect(hessZero.classification).toContain("Titik Belok");
    });

    it("renders critical analysis cards into container", () => {
        const crit = document.getElementById("obj-critical-cards-container");
        renderObjectiveCriticalAnalysis(2, 3, crit);
        expect(crit.innerHTML).toContain("Vektor Gradien");
        expect(crit.innerHTML).toContain("Matriks Hessian");
        expect(crit.innerHTML).toContain("Penalaran Kritis Ilmiah");
    });

    it("samples perceptually uniform colormaps correctly", () => {
        const v0 = sampleColormap("viridis", 0);
        const v1 = sampleColormap("viridis", 1);
        expect(v0.css).toContain("rgb");
        expect(v1.css).toContain("rgb");

        const c0 = sampleColormap("cividis", 0.5);
        expect(c0.css).toContain("rgb");

        const r0 = sampleColormap("rdbu", 0.5);
        expect(r0.css).toContain("rgb");
    });

    it("switches visualization modes and colormaps", () => {
        setObjectiveVisualMode("slices");
        expect(getObjectiveVisualState().mode).toBe("slices");
        setObjectiveVisualMode("contour");
        expect(getObjectiveVisualState().mode).toBe("contour");

        setObjectiveColormap("cividis");
        expect(getObjectiveVisualState().colormap).toBe("cividis");
        setObjectiveColormap("rdbu");
        expect(getObjectiveVisualState().colormap).toBe("rdbu");
        setObjectiveColormap("viridis");
        expect(getObjectiveVisualState().colormap).toBe("viridis");
    });

    it("computes objective function value evaluateH correctly", () => {
        expect(evaluateH(2, 3)).toBeCloseTo(11, 4);
        expect(evaluateH(-2, 3)).toBeCloseTo(-5, 4);
        expect(evaluateH(0, 0)).toBe(0);
    });

    it("verifies math.html contains benchmark layout without pipeline button or preset select", () => {
        const html = fs.readFileSync("math.html", "utf8");
        expect(html).toContain("obj-two-col-layout");
        expect(html).not.toContain("obj-preset-select");
        expect(html).not.toContain("btn-obj-import-chromo");
        expect(html).toContain("obj-card-step1");
        expect(html).toContain("obj-card-step5");
        expect(html).toContain("math2-canvas");
        expect(html).toContain("obj-sci-toolbar");
        expect(html).toContain("obj-mode-contour-btn");
        expect(html).toContain("obj-mode-slices-btn");
        expect(html).toContain("obj-colormap-select");
        expect(html).toContain("obj-critical-cards-container");
    });
});
