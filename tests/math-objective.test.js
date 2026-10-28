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

describe("math-objective evaluation and cards", () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="math-calc-form-2">
                <div id="math-calc-formula-display-2"></div>
                <div id="obj-label-x1"></div>
                <div id="obj-label-x2"></div>
                <input id="math2-in-x1" value="2" />
                <input id="math2-in-x2" value="3" />
                <button id="btn-obj-import-chromo"></button>
                <div id="obj-card-step1"></div>
                <div id="obj-card-step2"></div>
                <div id="obj-card-step3"></div>
                <div id="obj-card-step4"></div>
                <div id="obj-card-step5"></div>
                <div id="chromo-card-step6">x ≈ 1.85</div>
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
        expect(c5.innerHTML).toContain("Nilai evaluasi fenotipe");
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

    it("imports decoded chromosome value when import button is clicked", () => {
        calculateMath2();
        const btn = document.getElementById("btn-obj-import-chromo");
        btn.click();
        expect(refs.m2InX1.value).toBe("1.85");
    });

    it("verifies math.html contains benchmark layout without preset select", () => {
        const html = fs.readFileSync("math.html", "utf8");
        expect(html).toContain("obj-two-col-layout");
        expect(html).not.toContain("obj-preset-select");
        expect(html).toContain("btn-obj-import-chromo");
        expect(html).toContain("obj-card-step1");
        expect(html).toContain("obj-card-step5");
        expect(html).toContain("math2-canvas");
    });
});
