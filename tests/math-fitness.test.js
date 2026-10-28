import { describe, it, expect, beforeEach, vi } from "vitest";
import fs from "fs";
import { refs } from "../src/core/dom-refs.js";
import {
    renderTopFormula3,
    renderParamLabels3,
    renderFitnessCards
} from "../src/math/calculators/math-calc-3-cards.js";
import { bindFitTokenHover } from "../src/math/calculators/math-calc-3-tokens.js";
import { calculateMath3 } from "../src/math/calculators/math-calc-3.js";

describe("math-fitness evaluation and cards", () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="math-calc-form-3">
                <div id="math-calc-formula-display-3"></div>
                <div id="fit-label-h"></div>
                <div id="fit-label-a"></div>
                <input id="math3-in-h" value="5" />
                <input id="math3-in-a" value="0.1" />
                <div id="fit-card-step1"></div>
                <div id="fit-card-step2"></div>
                <div id="fit-card-step3"></div>
                <div id="fit-card-step4"></div>
                <canvas id="math3-canvas" width="340" height="340"></canvas>
            </div>
        `;
        refs.m3InH = document.getElementById("math3-in-h");
        refs.m3InA = document.getElementById("math3-in-a");

        window.katex = {
            render: vi.fn((tex, el) => {
                el.innerHTML = tex;
            })
        };
    });

    it("renders top formula and step cards correctly for h=5, a=0.1", () => {
        renderTopFormula3();
        const formulaBox = document.getElementById("math-calc-formula-display-3");
        expect(formulaBox.innerHTML).toContain("fit-token-h");
        expect(formulaBox.innerHTML).toContain("fit-token-a");

        renderFitnessCards(5, 0.1);
        const c1 = document.getElementById("fit-card-step1");
        const c2 = document.getElementById("fit-card-step2");
        const c3 = document.getElementById("fit-card-step3");
        const c4 = document.getElementById("fit-card-step4");

        expect(c1.innerHTML).toContain("5");
        expect(c1.innerHTML).toContain("0.1");
        expect(c2.innerHTML).toContain("5.1");
        expect(c3.innerHTML).toContain("5.1");
        expect(c4.innerHTML).toContain("0.1961");
    });

    it("handles singularity when denominator is zero", () => {
        renderFitnessCards(-0.1, 0.1);
        const c4 = document.getElementById("fit-card-step4");
        expect(c4.innerHTML).toContain("Singular");
    });

    it("handles negative denominator correctly", () => {
        renderFitnessCards(-2, 0.1);
        const c4 = document.getElementById("fit-card-step4");
        expect(c4.innerHTML).toContain("-0.5263");
    });

    it("handles invalid inputs gracefully", () => {
        renderFitnessCards(NaN, 0.1);
        const c1 = document.getElementById("fit-card-step1");
        const c2 = document.getElementById("fit-card-step2");
        expect(c1.textContent).toContain("Masukkan nilai h dan a yang valid");
        expect(c2.textContent).toBe("");
    });

    it("renders param labels without throwing", () => {
        renderParamLabels3();
        const lh = document.getElementById("fit-label-h");
        const la = document.getElementById("fit-label-a");
        expect(lh.innerHTML).toContain("fit-token-h");
        expect(la.innerHTML).toContain("fit-token-a");
    });

    it("binds token hover highlight events correctly", () => {
        document.body.innerHTML += `
            <span class="fit-token-h">token_h</span>
            <span class="fit-token-a">token_a</span>
        `;
        bindFitTokenHover();
        const inH = document.getElementById("math3-in-h");
        const inA = document.getElementById("math3-in-a");
        const tokH = document.querySelector(".fit-token-h");
        const tokA = document.querySelector(".fit-token-a");

        inH.dispatchEvent(new window.MouseEvent("mouseenter", { bubbles: true }));
        expect(tokH.classList.contains("fit-glow-h")).toBe(true);
        inH.dispatchEvent(new window.MouseEvent("mouseleave", { bubbles: true }));
        expect(tokH.classList.contains("fit-glow-h")).toBe(false);

        inA.dispatchEvent(new window.MouseEvent("mouseenter", { bubbles: true }));
        expect(tokA.classList.contains("fit-glow-a")).toBe(true);
        inA.dispatchEvent(new window.MouseEvent("mouseleave", { bubbles: true }));
        expect(tokA.classList.contains("fit-glow-a")).toBe(false);
    });

    it("calculates and triggers step card cascade via calculateMath3", () => {
        calculateMath3();
        const c4 = document.getElementById("fit-card-step4");
        expect(c4.innerHTML).toContain("0.1961");
    });

    it("verifies math.html contains benchmark layout elements without pipeline button or card 5", () => {
        const html = fs.readFileSync("math.html", "utf8");
        expect(html).toContain("fit-two-col-layout");
        expect(html).not.toContain("btn-fit-import-obj");
        expect(html).toContain("fit-card-step1");
        expect(html).toContain("fit-card-step4");
        expect(html).not.toContain("fit-card-step5");
        expect(html).toContain("math3-canvas");
    });
});
