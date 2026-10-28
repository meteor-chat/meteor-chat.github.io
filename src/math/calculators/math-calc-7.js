import { refs } from "../../core/dom-refs.js";
import { renderVisualChromosomeBoard } from "../visuals/math-visual-7.js";
import { renderTopFormula7, renderCrossoverCards } from "./math-calc-7-cards.js";
import { bindCrossoverTokens } from "./math-calc-7-tokens.js";

let initialized = false;

export function computeCrossover(p1, p2, type, k, k1, k2, mask) {
    const cleanP1 = (p1 || "").trim();
    const cleanP2 = (p2 || "").trim();

    if (!cleanP1 || !cleanP2) {
        return { valid: false, errorMsg: "Parent 1 dan Parent 2 wajib diisi" };
    }
    if (!/^[01]+$/.test(cleanP1) || !/^[01]+$/.test(cleanP2)) {
        return { valid: false, errorMsg: "Kromosom harus berupa deret biner (0 atau 1)" };
    }
    if (cleanP1.length !== cleanP2.length) {
        return { valid: false, errorMsg: "Panjang kromosom Parent 1 dan Parent 2 harus sama" };
    }

    const n = cleanP1.length;
    if (n < 2) {
        return { valid: false, errorMsg: "Panjang kromosom minimal 2 bit" };
    }

    let c1 = "";
    let c2 = "";

    if (type === "single") {
        const cutK = parseInt(k, 10);
        if (isNaN(cutK) || cutK < 1 || cutK >= n) {
            return { valid: false, errorMsg: `Titik potong k harus antara 1 dan ${n - 1}` };
        }
        c1 = cleanP1.slice(0, cutK) + cleanP2.slice(cutK);
        c2 = cleanP2.slice(0, cutK) + cleanP1.slice(cutK);
        return { valid: true, p1: cleanP1, p2: cleanP2, type, k: cutK, c1, c2 };
    }

    if (type === "two") {
        const cutK1 = parseInt(k1, 10);
        const cutK2 = parseInt(k2, 10);
        if (isNaN(cutK1) || isNaN(cutK2) || cutK1 < 1 || cutK2 >= n || cutK1 >= cutK2) {
            return { valid: false, errorMsg: `Titik potong tidak valid (1 \u2264 k1 < k2 < ${n})` };
        }
        c1 = cleanP1.slice(0, cutK1) + cleanP2.slice(cutK1, cutK2) + cleanP1.slice(cutK2);
        c2 = cleanP2.slice(0, cutK1) + cleanP1.slice(cutK1, cutK2) + cleanP2.slice(cutK2);
        return { valid: true, p1: cleanP1, p2: cleanP2, type, k1: cutK1, k2: cutK2, c1, c2 };
    }

    if (type === "uniform") {
        const cleanMask = (mask || "").trim();
        if (cleanMask.length !== n || !/^[01]+$/.test(cleanMask)) {
            return { valid: false, errorMsg: `Mask harus biner sepanjang ${n} bit` };
        }
        for (let i = 0; i < n; i++) {
            if (cleanMask[i] === "1") {
                c1 += cleanP1[i];
                c2 += cleanP2[i];
            } else {
                c1 += cleanP2[i];
                c2 += cleanP1[i];
            }
        }
        return { valid: true, p1: cleanP1, p2: cleanP2, type, mask: cleanMask, c1, c2 };
    }

    return { valid: false, errorMsg: "Tipe skema crossover tidak dikenal" };
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
        });
    }

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

    const state = computeCrossover(p1, p2, type, k, k1, k2, mask);

    renderTopFormula7(type);

    renderVisualChromosomeBoard(boardEl, state, (newK) => {
        if (inK) inK.value = String(newK);
        if (sliderK) sliderK.value = String(newK);
        calculateMath7();
    });

    renderCrossoverCards(state);

    bindCrossoverTokens();
}
