import { describe, it, expect, beforeEach } from "vitest";
import { computeCrossover, initMath7, calculateMath7, setCrossoverMode, getPopManager } from "../src/math/calculators/math-calc-7.js";
import { computePairCrossover, stepPopulationGeneration, isPopulationIdentical, calculatePopulationDiversity } from "../src/math/calculators/math-calc-7-engine.js";
import { PopulationCrossoverManager } from "../src/math/calculators/math-calc-7-pop-state.js";
import { renderCrossoverCards, renderTopFormula7, renderPopulationCards } from "../src/math/calculators/math-calc-7-cards.js";
import { renderVisualChromosomeBoard } from "../src/math/visuals/math-visual-7.js";
import { renderPopulationBoard } from "../src/math/visuals/math-visual-7-pop.js";

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

    describe("Multi-Pair Population & Iteration Engine", () => {
        it("generates offspring pool from selected parents with probability test", () => {
            const parents = ["1100", "0011", "1010", "0101"];
            const resCross = stepPopulationGeneration(parents, 1.0, "single", { k: 2 }, () => 0.1);
            expect(resCross.valid).toBe(true);
            expect(resCross.offspring.length).toBe(4);
            expect(resCross.pairs.length).toBe(2);
            expect(resCross.pairs[0].crossoverApplied).toBe(true);
            expect(resCross.offspring[0]).toBe("1111");
            expect(resCross.offspring[1]).toBe("0000");

            const resClone = stepPopulationGeneration(parents, 0.5, "single", { k: 2 }, () => 0.9);
            expect(resClone.pairs[0].crossoverApplied).toBe(false);
            expect(resClone.offspring[0]).toBe("1100");
            expect(resClone.offspring[1]).toBe("0011");
        });

        it("detects identical population patterns", () => {
            expect(isPopulationIdentical(["1111", "1111", "1111"])).toBe(true);
            expect(isPopulationIdentical(["1111", "1101", "1111"])).toBe(false);
            expect(calculatePopulationDiversity(["1111", "1111"])).toBe(0);
            expect(calculatePopulationDiversity(["1111", "0000"])).toBe(100);
        });

        it("terminates iteration when maximum generations is reached", () => {
            const mgr = new PopulationCrossoverManager(["1100", "0011", "1010", "0101"], 2, 0.8);
            expect(mgr.getState().generation).toBe(0);
            expect(mgr.getState().status).toBe("running");

            mgr.step(() => 0.1);
            expect(mgr.getState().generation).toBe(1);
            expect(mgr.getState().status).toBe("running");

            mgr.step(() => 0.1);
            expect(mgr.getState().generation).toBe(2);
            expect(mgr.getState().status).toBe("stopped_max_gen");

            const blockedStep = mgr.step(() => 0.1);
            expect(blockedStep.finished).toBe(true);
        });

        it("terminates iteration when pattern convergence is reached", () => {
            const mgr = new PopulationCrossoverManager(["1111", "1111", "1111", "1111"], 10, 0.9);
            expect(mgr.getState().status).toBe("stopped_converged");

            const mgr2 = new PopulationCrossoverManager(["1010", "1010", "1010", "1010"], 5, 0.8);
            expect(mgr2.getState().status).toBe("stopped_converged");
        });

        it("resets population state correctly", () => {
            const mgr = new PopulationCrossoverManager(["1100", "0011", "1010", "0101"], 2, 0.8);
            mgr.step(() => 0.1);
            mgr.step(() => 0.1);
            expect(mgr.getState().status).toBe("stopped_max_gen");
            mgr.reset();
            expect(mgr.getState().generation).toBe(0);
            expect(mgr.getState().status).toBe("running");
        });
    });

    describe("DOM, Visual Board and Cards Rendering", () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <div id="math-calc-formula-display-7"></div>
                <div id="cross-mode-tabs">
                    <button id="cross-tab-pair"></button>
                    <button id="cross-tab-pop"></button>
                </div>
                <div id="cross-visual-board"></div>
                <div id="cross-pop-board" class="hidden"></div>
                <div id="cross-pair-inputs">
                    <input type="text" id="math7-in-p1" value="10110010">
                    <input type="text" id="math7-in-p2" value="01101101">
                    <select id="math7-in-type"><option value="single" selected>Single-point</option></select>
                    <input type="number" id="math7-in-k" value="3">
                    <input type="range" id="math7-in-k-slider" value="3">
                </div>
                <div id="cross-pop-controls" class="hidden">
                    <select id="math7-pop-preset"><option value="week3" selected>Week 3</option></select>
                    <input type="number" id="math7-pop-maxgen" value="5">
                    <input type="range" id="math7-pop-pc" value="0.8">
                    <span id="math7-pop-pc-val">0.80</span>
                    <button id="math7-btn-step"></button>
                    <button id="math7-btn-autorun"></button>
                    <button id="math7-btn-reset"></button>
                </div>
                <div id="cross-card-step1"></div>
                <div id="cross-card-step2"></div>
                <div id="cross-card-step3"></div>
                <div id="cross-card-step4"></div>
            `;
        });

        it("renders top formula and step cards without throwing", () => {
            expect(() => {
                renderTopFormula7("single", "pair");
                renderTopFormula7("single", "pop");
            }).not.toThrow();

            const state = computeCrossover("10110010", "01101101", "single", 3);
            renderCrossoverCards(state);
            expect(document.getElementById("cross-card-step1").textContent).toContain("P_1");
            expect(document.getElementById("cross-card-step2").textContent).toContain("C_1");
        });

        it("renders population cards and population visual board", () => {
            const mgr = new PopulationCrossoverManager(["11001011", "11011111", "01010101", "10101010"], 5, 0.8);
            mgr.step(() => 0.1);
            const popState = mgr.getState();

            const popBoard = document.getElementById("cross-pop-board");
            renderPopulationBoard(popBoard, popState);
            expect(popBoard.querySelectorAll(".cross-pair-card").length).toBe(2);
            expect(popBoard.querySelectorAll(".cross-offspring-item").length).toBe(4);

            renderPopulationCards(popState);
            expect(document.getElementById("cross-card-step3").textContent).toContain("O_");
        });

        it("switches modes cleanly via setCrossoverMode", () => {
            initMath7();
            calculateMath7();
            const tabPair = document.getElementById("cross-tab-pair");
            const tabPop = document.getElementById("cross-tab-pop");
            const pairInputs = document.getElementById("cross-pair-inputs");
            const popControls = document.getElementById("cross-pop-controls");

            expect(pairInputs.classList.contains("hidden")).toBe(false);
            expect(popControls.classList.contains("hidden")).toBe(true);

            setCrossoverMode("pop");
            expect(pairInputs.classList.contains("hidden")).toBe(true);
            expect(popControls.classList.contains("hidden")).toBe(false);

            setCrossoverMode("pair");
            expect(pairInputs.classList.contains("hidden")).toBe(false);
            expect(popControls.classList.contains("hidden")).toBe(true);
        });
    });
});
