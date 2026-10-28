import { describe, it, expect, beforeEach } from "vitest";
import { computeCrossover, initMath7, calculateMath7 } from "../src/math/calculators/math-calc-7.js";
import { renderCrossoverCards, renderTopFormula7 } from "../src/math/calculators/math-calc-7-cards.js";
import { renderVisualChromosomeBoard } from "../src/math/visuals/math-visual-7.js";

describe("Crossover Kromosom (Form 7)", () => {
    it("computes single-point crossover correctly according to slide 6", () => {
        const p1 = "10110010";
        const p2 = "01101101";
        const res = computeCrossover(p1, p2, "single", 3);
        expect(res.valid).toBe(true);
        expect(res.c1).toBe("10101101");
        expect(res.c2).toBe("01110010");
        expect(res.k).toBe(3);
    });

    it("computes single-point crossover correctly according to slide 34", () => {
        const p1 = "00110";
        const p2 = "11001";
        const res = computeCrossover(p1, p2, "single", 3);
        expect(res.valid).toBe(true);
        expect(res.c1).toBe("00101");
        expect(res.c2).toBe("11010");
    });

    it("computes two-point crossover correctly", () => {
        const p1 = "11111111";
        const p2 = "00000000";
        const res = computeCrossover(p1, p2, "two", null, 2, 5);
        expect(res.valid).toBe(true);
        expect(res.c1).toBe("11000111");
        expect(res.c2).toBe("00111000");
    });

    it("computes uniform crossover correctly", () => {
        const p1 = "1111";
        const p2 = "0000";
        const mask = "1010";
        const res = computeCrossover(p1, p2, "uniform", null, null, null, mask);
        expect(res.valid).toBe(true);
        expect(res.c1).toBe("1010");
        expect(res.c2).toBe("0101");
    });

    it("rejects non-binary chromosome inputs", () => {
        const res = computeCrossover("1020", "1100", "single", 2);
        expect(res.valid).toBe(false);
        expect(res.errorMsg).toContain("deret biner");
    });

    it("rejects chromosomes with unequal lengths", () => {
        const res = computeCrossover("101", "1010", "single", 2);
        expect(res.valid).toBe(false);
        expect(res.errorMsg).toContain("harus sama");
    });

    it("rejects out of bounds single-point cut index", () => {
        const resZero = computeCrossover("1010", "0101", "single", 0);
        expect(resZero.valid).toBe(false);
        const resExceed = computeCrossover("1010", "0101", "single", 4);
        expect(resExceed.valid).toBe(false);
    });

    it("rejects invalid two-point bounds", () => {
        const res = computeCrossover("101010", "010101", "two", null, 4, 3);
        expect(res.valid).toBe(false);
    });

    it("rejects uniform mask with invalid length", () => {
        const res = computeCrossover("1010", "0101", "uniform", null, null, null, "101");
        expect(res.valid).toBe(false);
    });

    describe("DOM and visual cards rendering", () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <div id="math-calc-formula-display-7"></div>
                <div id="cross-visual-board"></div>
                <div id="cross-card-step1"></div>
                <div id="cross-card-step2"></div>
                <div id="cross-card-step3"></div>
                <div id="cross-card-step4"></div>
            `;
        });

        it("renders top formula without throwing", () => {
            expect(() => {
                renderTopFormula7("single");
                renderTopFormula7("two");
                renderTopFormula7("uniform");
            }).not.toThrow();
        });

        it("renders step cards accurately for valid crossover state", () => {
            const state = computeCrossover("10110010", "01101101", "single", 3);
            renderCrossoverCards(state);
            const c1 = document.getElementById("cross-card-step1");
            const c2 = document.getElementById("cross-card-step2");
            const c3 = document.getElementById("cross-card-step3");
            const c4 = document.getElementById("cross-card-step4");
            expect(c1.textContent).toContain("P_1");
            expect(c2.textContent).toContain("C_1");
            expect(c3.textContent).toContain("length");
            expect(c4.textContent).toContain("173");
        });

        it("renders visual chromosome board with alleles and cut divider", () => {
            const state = computeCrossover("10110010", "01101101", "single", 3);
            const board = document.getElementById("cross-visual-board");
            let clickedK = 0;
            renderVisualChromosomeBoard(board, state, (newK) => { clickedK = newK; });
            const cells = board.querySelectorAll(".cross-bit-cell");
            expect(cells.length).toBe(32);
            const cutCell = board.querySelector(".cross-cut-after");
            expect(cutCell).not.toBeNull();
            cells[1].click();
            expect(clickedK).toBe(2);
        });

        it("integrates with full DOM form including user input from screenshot", () => {
            document.body.innerHTML = `
                <div id="math-calc-formula-display-7"></div>
                <div id="cross-visual-board"></div>
                <input type="text" id="math7-in-p1" value="101100101">
                <input type="text" id="math7-in-p2" value="011011011">
                <select id="math7-in-type"><option value="single" selected>Single-point</option></select>
                <input type="number" id="math7-in-k" value="4">
                <input type="range" id="math7-in-k-slider" value="4">
                <div id="cross-card-step1"></div>
                <div id="cross-card-step2"></div>
                <div id="cross-card-step3"></div>
                <div id="cross-card-step4"></div>
            `;
            initMath7();
            calculateMath7();
            const board = document.getElementById("cross-visual-board");
            expect(board.querySelectorAll(".cross-bit-cell").length).toBe(36);
            const c2 = document.getElementById("cross-card-step2");
            expect(c2.textContent).toContain("101111011");
            expect(c2.textContent).toContain("011000101");
            const c3 = document.getElementById("cross-card-step3");
            expect(c3.textContent).toContain("n = 9");
        });
    });
});
