import { refs } from "../../core/dom-refs.js";
import { computePairCrossover } from "./math-calc-7-engine.js";
import { PopulationCrossoverManager } from "./math-calc-7-pop-state.js";
import { renderVisualChromosomeBoard } from "../visuals/math-visual-7.js";
import { renderPopulationBoard } from "../visuals/math-visual-7-pop.js";
import { renderTopFormula7, renderCrossoverCards, renderPopulationCards } from "./math-calc-7-cards.js";
import { bindCrossoverTokens } from "./math-calc-7-tokens.js";

let initialized = false;
let activeMode = "pair";
let popManager = new PopulationCrossoverManager();
let autoRunTimer = null;

export function computeCrossover(p1, p2, type, k, k1, k2, mask) {
    return computePairCrossover(p1, p2, type, k, k1, k2, mask);
}

export function getPopManager() {
    return popManager;
}

export function setCrossoverMode(mode) {
    activeMode = mode === "pop" ? "pop" : "pair";
    if (activeMode === "pair" && autoRunTimer) {
        clearInterval(autoRunTimer);
        autoRunTimer = null;
    }
    updateModeUI();
    calculateMath7();
}

function updateModeUI() {
    const tabPair = document.getElementById("cross-tab-pair");
    const tabPop = document.getElementById("cross-tab-pop");
    const pairInputs = document.getElementById("cross-pair-inputs");
    const popControls = document.getElementById("cross-pop-controls");
    const boardPair = document.getElementById("cross-visual-board");
    const boardPop = document.getElementById("cross-pop-board");

    if (tabPair && tabPop) {
        tabPair.classList.toggle("cross-tab-active", activeMode === "pair");
        tabPop.classList.toggle("cross-tab-active", activeMode === "pop");
    }
    if (pairInputs && popControls) {
        pairInputs.classList.toggle("hidden", activeMode !== "pair");
        popControls.classList.toggle("hidden", activeMode !== "pop");
    }
    if (boardPair && boardPop) {
        boardPair.classList.toggle("hidden", activeMode !== "pair");
        boardPop.classList.toggle("hidden", activeMode !== "pop");
    }
}

export function initMath7() {
    if (initialized) {
        calculateMath7();
        return;
    }
    initialized = true;

    const inP1 = refs.m7InP1 || document.getElementById("math7-in-p1");
    const inP2 = refs.m7InP2 || document.getElementById("math7-in-p2");
    const inK = refs.m7InK || document.getElementById("math7-in-k");
    const sliderK = document.getElementById("math7-in-k-slider");
    const inType = refs.m7InType || document.getElementById("math7-in-type");
    const inK1 = refs.m7InK1 || document.getElementById("math7-in-k1");
    const inK2 = refs.m7InK2 || document.getElementById("math7-in-k2");
    const inMask = refs.m7InMask || document.getElementById("math7-in-mask");

    const tabPair = document.getElementById("cross-tab-pair");
    const tabPop = document.getElementById("cross-tab-pop");
    if (tabPair) tabPair.addEventListener("click", () => setCrossoverMode("pair"));
    if (tabPop) tabPop.addEventListener("click", () => setCrossoverMode("pop"));

    if (inP1 && !inP1.value) inP1.value = "10110010";
    if (inP2 && !inP2.value) inP2.value = "01101101";
    if (inK && !inK.value) inK.value = "3";

    if (sliderK && inK) {
        sliderK.value = inK.value;
        sliderK.addEventListener("input", () => {
            inK.value = sliderK.value;
            calculateMath7();
        });
        inK.addEventListener("input", () => {
            sliderK.value = inK.value;
            calculateMath7();
        });
    }

    [inP1, inP2, inK1, inK2, inMask].forEach((inp) => {
        if (inp) inp.addEventListener("input", () => calculateMath7());
    });

    if (inType) {
        inType.addEventListener("change", () => {
            const val = inType.value;
            const kBox = document.getElementById("math7-k-container");
            const k1Box = document.getElementById("math7-k1-container");
            const k2Box = document.getElementById("math7-k2-container");
            const maskBox = document.getElementById("math7-mask-container");
            if (kBox) kBox.classList.toggle("hidden", val !== "single");
            if (k1Box) k1Box.classList.toggle("hidden", val !== "two");
            if (k2Box) k2Box.classList.toggle("hidden", val !== "two");
            if (maskBox) maskBox.classList.toggle("hidden", val !== "uniform");
            calculateMath7();
        });
    }

    const inMaxGen = document.getElementById("math7-pop-maxgen");
    const inPc = document.getElementById("math7-pop-pc");
    const btnStep = document.getElementById("math7-btn-step");
    const btnAuto = document.getElementById("math7-btn-autorun");
    const btnReset = document.getElementById("math7-btn-reset");
    const selPreset = document.getElementById("math7-pop-preset");

    if (inMaxGen) {
        inMaxGen.addEventListener("change", () => {
            popManager.setMaxGenerations(inMaxGen.value);
            calculateMath7();
        });
    }

    if (inPc) {
        inPc.addEventListener("input", () => {
            popManager.setPc(inPc.value);
            const lbl = document.getElementById("math7-pop-pc-val");
            if (lbl) lbl.textContent = inPc.value;
            calculateMath7();
        });
    }

    if (btnStep) {
        btnStep.addEventListener("click", () => {
            popManager.step();
            calculateMath7();
        });
    }

    if (btnAuto) {
        btnAuto.addEventListener("click", () => {
            if (autoRunTimer) {
                clearInterval(autoRunTimer);
                autoRunTimer = null;
                btnAuto.textContent = "Jalankan Otomatis";
            } else {
                btnAuto.textContent = "Jeda";
                autoRunTimer = setInterval(() => {
                    const stepRes = popManager.step();
                    calculateMath7();
                    if (stepRes.finished) {
                        clearInterval(autoRunTimer);
                        autoRunTimer = null;
                        btnAuto.textContent = "Jalankan Otomatis";
                    }
                }, 800);
            }
        });
    }

    if (btnReset) {
        btnReset.addEventListener("click", () => {
            if (autoRunTimer) {
                clearInterval(autoRunTimer);
                autoRunTimer = null;
                if (btnAuto) btnAuto.textContent = "Jalankan Otomatis";
            }
            popManager.reset();
            calculateMath7();
        });
    }

    if (selPreset) {
        selPreset.addEventListener("change", () => {
            if (selPreset.value === "week3") {
                popManager.setPopulation(["11001011", "11011111", "01010101", "10101010"]);
            } else if (selPreset.value === "converged") {
                popManager.setPopulation(["11110000", "11110000", "11110000", "11110000"]);
            } else if (selPreset.value === "alternate") {
                popManager.setPopulation(["10101010", "01010101", "11001100", "00110011"]);
            }
            calculateMath7();
        });
    }

    updateModeUI();
    calculateMath7();
}

export function calculateMath7() {
    const inP1 = refs.m7InP1 || document.getElementById("math7-in-p1");
    const inP2 = refs.m7InP2 || document.getElementById("math7-in-p2");
    const inType = refs.m7InType || document.getElementById("math7-in-type");
    const inK = refs.m7InK || document.getElementById("math7-in-k");
    const inK1 = refs.m7InK1 || document.getElementById("math7-in-k1");
    const inK2 = refs.m7InK2 || document.getElementById("math7-in-k2");
    const inMask = refs.m7InMask || document.getElementById("math7-in-mask");
    const sliderK = document.getElementById("math7-in-k-slider");
    const boardEl = document.getElementById("cross-visual-board");
    const popBoardEl = document.getElementById("cross-pop-board");

    const p1 = inP1 ? inP1.value : "";
    const p2 = inP2 ? inP2.value : "";
    const type = inType ? inType.value : "single";
    const k = inK ? inK.value : "";
    const k1 = inK1 ? inK1.value : "";
    const k2 = inK2 ? inK2.value : "";
    const mask = inMask ? inMask.value : "";

    if (sliderK && p1.length >= 2) {
        sliderK.max = String(p1.length - 1);
        if (inK) inK.max = String(p1.length - 1);
    }

    renderTopFormula7(type, activeMode);

    if (activeMode === "pop") {
        popManager.setCrossoverType(type, {
            k: parseInt(k, 10) || 4,
            k1: parseInt(k1, 10) || 2,
            k2: parseInt(k2, 10) || 5,
            mask: mask || "11001010"
        });
        const popState = popManager.getState();
        renderPopulationBoard(popBoardEl, popState);
        renderPopulationCards(popState);
        return;
    }

    const state = computePairCrossover(p1, p2, type, k, k1, k2, mask);

    renderVisualChromosomeBoard(boardEl, state, (newK) => {
        if (inK) inK.value = String(newK);
        if (sliderK) sliderK.value = String(newK);
        calculateMath7();
    });

    renderCrossoverCards(state);
    bindCrossoverTokens();
}
