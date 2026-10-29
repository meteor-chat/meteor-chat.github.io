import { describe, it, expect, beforeEach, vi } from "vitest";
import { evaluatePareto, checkNoWorse, checkStrictlyBetter, PARETO_PRESETS } from "../src/math/calculators/math-calc-8-core.js";
import { renderTopFormula8, renderParetoCards } from "../src/math/calculators/math-calc-8-cards.js";
import { calculateMath8, initParetoView, resetParetoInit } from "../src/math/calculators/math-calc-8.js";

describe("Pareto Dominance Core Evaluation", () => {
    it("evaluates condition helpers accurately", () => {
        expect(checkNoWorse(3, 4, "min")).toBe(true);
        expect(checkNoWorse(4, 3, "min")).toBe(false);
        expect(checkNoWorse(3, 3, "min")).toBe(true);
        expect(checkNoWorse(5, 4, "max")).toBe(true);
        expect(checkNoWorse(4, 5, "max")).toBe(false);

        expect(checkStrictlyBetter(3, 4, "min")).toBe(true);
        expect(checkStrictlyBetter(3, 3, "min")).toBe(false);
        expect(checkStrictlyBetter(5, 4, "max")).toBe(true);
        expect(checkStrictlyBetter(4, 4, "max")).toBe(false);
    });

    it("evaluates Slide 6 Case 1: Strict Dominance (3,29) vs (4,44)", () => {
        const res = evaluatePareto([3, 29], [4, 44], ["min", "min"]);
        expect(res.aDominatesB).toBe(true);
        expect(res.bDominatesA).toBe(false);
        expect(res.status).toBe("a_dom_b");
        expect(res.identical).toBe(false);
    });

    it("evaluates Slide 6 Case 2: Tie on f1 allowed (3,44) vs (3,45)", () => {
        const res = evaluatePareto([3, 44], [3, 45], ["min", "min"]);
        expect(res.aDominatesB).toBe(true);
        expect(res.bDominatesA).toBe(false);
        expect(res.status).toBe("a_dom_b");
    });

    it("evaluates Slide 6 Case 3: Incomparable Trade-off (5,27) vs (3,44)", () => {
        const res = evaluatePareto([5, 27], [3, 44], ["min", "min"]);
        expect(res.aDominatesB).toBe(false);
        expect(res.bDominatesA).toBe(false);
        expect(res.status).toBe("incomparable");
    });

    it("evaluates Slide 6 Case 4: Identical (4,41) vs (4,41)", () => {
        const res = evaluatePareto([4, 41], [4, 41], ["min", "min"]);
        expect(res.aDominatesB).toBe(false);
        expect(res.bDominatesA).toBe(false);
        expect(res.identical).toBe(true);
        expect(res.status).toBe("identical");
    });

    it("evaluates reverse dominance B dominates A", () => {
        const res = evaluatePareto([4, 44], [3, 29], ["min", "min"]);
        expect(res.aDominatesB).toBe(false);
        expect(res.bDominatesA).toBe(true);
        expect(res.status).toBe("b_dom_a");
    });

    it("evaluates maximization directions and mixed", () => {
        const resMax = evaluatePareto([10, 20], [5, 10], ["max", "max"]);
        expect(resMax.aDominatesB).toBe(true);
        expect(resMax.status).toBe("a_dom_b");

        const resMixed = evaluatePareto([2, 50], [5, 20], ["min", "max"]);
        expect(resMixed.aDominatesB).toBe(true);
        expect(resMixed.status).toBe("a_dom_b");
    });

    it("provides valid presets array", () => {
        expect(PARETO_PRESETS.length).toBeGreaterThanOrEqual(4);
        expect(PARETO_PRESETS[0].a).toEqual([3, 29]);
        expect(PARETO_PRESETS[0].b).toEqual([4, 44]);
    });
});

describe("Pareto Cards & DOM Rendering", () => {
    beforeEach(() => {
        resetParetoInit();
        document.body.innerHTML = `
            <div id="math-calc-form-8">
                <div id="math-calc-formula-display-8"></div>
                <div id="math8-presets"></div>
                <canvas id="math8-canvas" width="340" height="340"></canvas>
                <input id="math8-in-f1a" value="3" />
                <input id="math8-in-f2a" value="29" />
                <input id="math8-in-f1b" value="4" />
                <input id="math8-in-f2b" value="44" />
                <select id="math8-in-dir">
                    <option value="min-min" selected>min-min</option>
                </select>
                <input id="math8-in-a" value="3, 29" />
                <input id="math8-in-b" value="4, 44" />
                <div id="pareto-card-step1"></div>
                <div id="pareto-card-step2"></div>
                <div id="pareto-card-step3"></div>
                <div id="pareto-card-step4"></div>
                <div id="math8-steps-container"></div>
            </div>
        `;
        window.katex = {
            render: vi.fn((tex, el) => {
                el.innerHTML = tex;
            })
        };
    });

    it("renders top formula with token highlighting", () => {
        renderTopFormula8();
        const display = document.getElementById("math-calc-formula-display-8");
        expect(display.innerHTML).toContain("pareto-tok-a");
        expect(display.innerHTML).toContain("pareto-tok-b");
        expect(display.innerHTML).toContain("prec");
    });

    it("renders 4 step cards for Slide 6 Strict dominance", () => {
        const evalRes = evaluatePareto([3, 29], [4, 44], ["min", "min"]);
        renderParetoCards(evalRes);

        const c1 = document.getElementById("pareto-card-step1");
        const c2 = document.getElementById("pareto-card-step2");
        const c3 = document.getElementById("pareto-card-step3");
        const c4 = document.getElementById("pareto-card-step4");

        expect(c1.innerHTML).toContain("3");
        expect(c1.innerHTML).toContain("29");
        expect(c2.innerHTML).toContain("Terpenuhi");
        expect(c3.innerHTML).toContain("Terpenuhi");
        expect(c4.innerHTML).toContain("Mendominasi");
    });

    it("runs calculateMath8 and updates DOM properly", () => {
        calculateMath8();
        const c4 = document.getElementById("pareto-card-step4");
        expect(c4.innerHTML).toContain("Mendominasi");

        const legacy = document.getElementById("math8-steps-container");
        expect(legacy.textContent).toBe("a_dom_b");
    });

    it("handles preset clicks and input changes", () => {
        initParetoView();
        const presetsWrap = document.getElementById("math8-presets");
        const buttons = presetsWrap.querySelectorAll("button");
        expect(buttons.length).toBeGreaterThanOrEqual(4);

        buttons[2].click();
        const f1a = document.getElementById("math8-in-f1a");
        expect(f1a.value).toBe("5");
        const legacy = document.getElementById("math8-steps-container");
        expect(legacy.textContent).toBe("incomparable");
    });
});
