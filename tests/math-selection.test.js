import { describe, it, expect, beforeEach, vi } from "vitest";
import { refs } from "../src/core/dom-refs.js";
import { renderTopFormula4, renderSelectionCards } from "../src/math/calculators/math-calc-4-cards.js";
import { handleCanvasSliceHover } from "../src/math/calculators/math-calc-4-tokens.js";
import {
    initMath4,
    addM4Input,
    removeM4Input,
    getFitnessValues
} from "../src/math/calculators/math-calc-4.js";
import { drawRouletteWheel4, getPaletteColor } from "../src/math/visuals/math-visual-4.js";

describe("math-selection evaluation and cards", () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="math-calc-form-4">
                <div id="math-calc-formula-display-4"></div>
                <div id="math4-dynamic-inputs"></div>
                <button id="sel-btn-add"></button>
                <button id="sel-btn-del"></button>
                <div id="sel-card-step1"></div>
                <div id="sel-card-step2"></div>
                <div id="sel-card-step3"></div>
                <div id="sel-card-step4"></div>
                <canvas id="math4-canvas" width="340" height="340"></canvas>
            </div>
        `;
        refs.m4DynamicInputs = document.getElementById("math4-dynamic-inputs");

        window.katex = {
            render: vi.fn((tex, el) => {
                el.innerHTML = tex;
            })
        };
    });

    it("renders top formula with correct token classes", () => {
        renderTopFormula4();
        const formulaEl = document.getElementById("math-calc-formula-display-4");
        expect(formulaEl.innerHTML).toContain("sel-token-pi");
        expect(formulaEl.innerHTML).toContain("sel-token-fi");
        expect(formulaEl.innerHTML).toContain("sel-token-sumf");
    });

    it("renders syllabus population cards with 4 decimal places precision", () => {
        const syllabusValues = [5.40, 2.15, 7.85, 1.60];
        renderSelectionCards(syllabusValues);

        const c1 = document.getElementById("sel-card-step1");
        const c2 = document.getElementById("sel-card-step2");
        const c3 = document.getElementById("sel-card-step3");
        const c4 = document.getElementById("sel-card-step4");

        expect(c1.innerHTML).toContain("17.0000");
        expect(c2.innerHTML).toContain("5.40");
        expect(c2.innerHTML).toContain("17.00");
        expect(c3.innerHTML).toContain("0.3176");
        expect(c3.innerHTML).toContain("0.1265");
        expect(c3.innerHTML).toContain("0.4618");
        expect(c3.innerHTML).toContain("0.0941");
        expect(c4.innerHTML).toContain("1.0000");
    });

    it("handles zero or empty values gracefully", () => {
        renderSelectionCards([0, 0, 0]);
        const c1 = document.getElementById("sel-card-step1");
        const c4 = document.getElementById("sel-card-step4");
        expect(c1.innerHTML).toContain("0.0000");
        expect(c4.innerHTML).toContain("0.0000");
    });

    it("initializes inputs with default syllabus population", () => {
        initMath4();
        const inputs = document.querySelectorAll(".sel-input-fit");
        expect(inputs.length).toBe(4);
        expect(inputs[0].value).toBe("5.4");
        expect(inputs[1].value).toBe("2.15");
        expect(inputs[2].value).toBe("7.85");
        expect(inputs[3].value).toBe("1.6");

        const values = getFitnessValues();
        expect(values).toEqual([5.4, 2.15, 7.85, 1.6]);
    });

    it("adds and removes inputs within limits 2 to 6", () => {
        initMath4();
        expect(getFitnessValues().length).toBe(4);

        addM4Input();
        expect(getFitnessValues().length).toBe(5);

        addM4Input();
        expect(getFitnessValues().length).toBe(6);

        addM4Input();
        expect(getFitnessValues().length).toBe(6);

        removeM4Input();
        expect(getFitnessValues().length).toBe(5);

        removeM4Input();
        removeM4Input();
        removeM4Input();
        expect(getFitnessValues().length).toBe(2);

        removeM4Input();
        expect(getFitnessValues().length).toBe(2);
    });

    it("binds tokens and highlights active row and card tokens on hover", () => {
        initMath4();
        const row0 = document.getElementById("sel-row-0");
        expect(row0).not.toBeNull();

        handleCanvasSliceHover(0, 4, getFitnessValues);
        expect(row0.classList.contains("sel-row-active")).toBe(true);

        handleCanvasSliceHover(-1, 4, getFitnessValues);
        expect(row0.classList.contains("sel-row-active")).toBe(false);
    });

    it("updates probability badges when input changes", () => {
        initMath4();
        const input0 = document.getElementById("sel-input-0");
        input0.value = "17";
        input0.dispatchEvent(new window.Event("input"));

        const p0 = document.getElementById("sel-prob-0");
        expect(p0.textContent).not.toBe("P: --");
    });

    it("provides palette colors up to 6 individuals", () => {
        for (let i = 0; i < 6; i++) {
            const color = getPaletteColor(i);
            expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
        }
    });

    it("draws wheel without error even without native canvas context", () => {
        expect(() => {
            drawRouletteWheel4([5.4, 2.15, 7.85, 1.6], 0);
        }).not.toThrow();
    });
});
