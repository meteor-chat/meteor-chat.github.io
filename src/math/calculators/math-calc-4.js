import { refs } from "../../core/dom-refs.js";
import { getPaletteColor, drawRouletteWheel4, initRouletteWheel4 } from "../visuals/math-visual-4.js";
import { renderTopFormula4, renderSelectionCards } from "./math-calc-4-cards.js";
import { bindSelectionTokens, handleCanvasSliceHover } from "./math-calc-4-tokens.js";

let population = [5.40, 2.15, 7.85, 1.60];
let initialized = false;

export function getFitnessValues() {
    const values = [];
    for (let i = 0; i < population.length; i++) {
        const inp = document.getElementById(`sel-input-${i}`);
        if (inp) {
            const raw = parseFloat(inp.value);
            values.push(isNaN(raw) ? 0 : Math.max(0, raw));
        } else {
            values.push(population[i] || 0);
        }
    }
    return values;
}

function renderInputs() {
    const container = refs.m4DynamicInputs || document.getElementById("math4-dynamic-inputs");
    if (!container) return;
    container.textContent = "";

    population.forEach((val, i) => {
        const color = getPaletteColor(i);
        const row = document.createElement("div");
        row.className = "sel-pop-row";
        row.id = `sel-row-${i}`;

        const badge = document.createElement("span");
        badge.className = "sel-badge-ind";
        badge.style.backgroundColor = `${color}22`;
        badge.style.color = color;
        badge.style.borderColor = `${color}55`;
        badge.textContent = `I${i + 1}`;

        const input = document.createElement("input");
        input.type = "number";
        input.id = `sel-input-${i}`;
        input.className = "sel-input-fit m4-fitness-input";
        input.value = val;
        input.step = "0.05";
        input.min = "0";
        input.setAttribute("aria-label", `Fitness Individu ${i + 1}`);
        input.addEventListener("input", () => {
            population[i] = parseFloat(input.value) || 0;
            calculateMath4();
        });

        const probSpan = document.createElement("span");
        probSpan.className = "sel-prob-text";
        probSpan.id = `sel-prob-${i}`;
        probSpan.textContent = "P: --";

        row.appendChild(badge);
        row.appendChild(input);
        row.appendChild(probSpan);
        container.appendChild(row);
    });
}

function updateProbBadges(values, sum) {
    values.forEach((v, i) => {
        const probSpan = document.getElementById(`sel-prob-${i}`);
        if (!probSpan) return;
        if (sum > 0) {
            const p = (v / sum).toFixed(4);
            probSpan.textContent = `P: ${p}`;
        } else {
            probSpan.textContent = "P: 0.0000";
        }
    });
}

export function calculateMath4() {
    const values = getFitnessValues();
    const sum = values.reduce((acc, v) => acc + v, 0);

    renderTopFormula4();
    renderSelectionCards(values);
    updateProbBadges(values, sum);
    drawRouletteWheel4(values);
    bindSelectionTokens(values.length, getFitnessValues);
}

export function addM4Input() {
    if (population.length >= 6) return;
    const defaultNewVal = 2.00;
    population.push(defaultNewVal);
    renderInputs();
    calculateMath4();
}

export function removeM4Input() {
    if (population.length <= 2) return;
    population.pop();
    renderInputs();
    calculateMath4();
}

export function initMath4() {
    const addBtn = document.getElementById("sel-btn-add");
    const delBtn = document.getElementById("sel-btn-del");
    if (addBtn && !addBtn.dataset.bound) {
        addBtn.dataset.bound = "true";
        addBtn.addEventListener("click", addM4Input);
    }
    if (delBtn && !delBtn.dataset.bound) {
        delBtn.dataset.bound = "true";
        delBtn.addEventListener("click", removeM4Input);
    }

    renderInputs();
    if (!initialized) {
        initRouletteWheel4((idx) => {
            handleCanvasSliceHover(idx, population.length, getFitnessValues);
        });
        initialized = true;
    }
    calculateMath4();
}
