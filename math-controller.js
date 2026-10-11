import { refs } from "./dom-refs.js";
import { initFilters } from "./math-filter.js";
import { state } from "./app-state.js";
import { calculateMath, calculateMath2, calculateMath3 } from "./math-calc-1-3.js";
import { addM4Input, addM5Input, addM6Input, calculateMath4, calculateMath5, calculateMath6 } from "./math-calc-4-6.js";
import { calculateMath7, calculateMath8 } from "./math-calc-7-8.js";
import { addM9Input, calculateMath9 } from "./math-calc-9.js";
import { addM10Input, calculateMath10 } from "./math-calc-10.js";
import { addM11Input, calculateMath11 } from "./math-calc-11.js";
import { calculateMath12 } from "./math-calc-12.js";
import { calculateMath13 } from "./math-calc-13.js";
import { calculateMath14 } from "./math-calc-14.js";
import { calculateMath15 } from "./math-calc-15.js";
import { calculateMath16 } from "./math-calc-16.js";
import { calculateMath17 } from "./math-calc-17.js";
import { calculateMath18 } from "./math-calc-18.js";
import { calculateMath19 } from "./math-calc-19.js";
import { calculateMath20 } from "./math-calc-20.js";
import { calculateMath21 } from "./math-calc-21.js";
import { calculateMath22 } from "./math-calc-22.js";

const FORMULAS = [
    null,
    "x = x_{\\min} + \\frac{x_{\\max} - x_{\\min}}{2^n - 1} \\cdot d",
    "h = (x_1)^3 + \\frac{1}{3}(x_2)^2",
    "Fitness = \\frac{1}{h+a}",
    "P_i = \\frac{F_i}{\\sum F}",
    "C_i = C_{i-1} + P_i",
    "\\sum F = \\sum_{i=1}^{n} F_i",
    "O_1 = P_1(0..k) + P_2(k..n), \\; O_2 = P_2(0..k) + P_1(k..n)",
    "A \\prec B \\iff \\forall i: f_i(A) \\leq f_i(B) \\land \\exists j: f_j(A) < f_j(B)",
    "n_p \\text{ dan } S_p",
    "\\sigma = \\sqrt{\\frac{\\sum_{i=1}^{n}(x_i - \\mu)^2}{n}}",
    "s = \\sqrt{\\frac{\\sum_{i=1}^{n}(x_i - \\bar{x})^2}{n-1}}",
    "P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)}",
    "\\binom{n}{k} = C(n,k) = \\frac{n!}{k!(n-k)!}",
    "c^2 = a^2 + b^2",
    "\\lim_{x\\to c} \\frac{f'(x)}{g'(x)}",
    "g'(x) = \\frac{d}{dx} \\left[ \\int_a^x f(t) dt \\right] = f(x)",
    "\\int_a^b f(x) dx = F(b) - F(a)",
    "f(c) = \\frac{1}{b-a} \\int_a^b f(x) dx",
    "C(n+r-1, r) = \\binom{n+r-1}{r}",
    "\\det(AB) = \\det(A) \\cdot \\det(B)",
    "\\pi",
    "\\mathbb{P} = \\{2, 3, 5, 7, \\dots\\}"
];

export function initMath() {
    refs.btnMathEor = document.getElementById("btn-math-eor");
    refs.mathMenu = document.getElementById("math-menu-view");
    refs.mathCalc = document.getElementById("math-calc-view");
    for(let i=1; i<=22; i++) {
        refs[`mathCard${i}`] = document.getElementById(`math-card-${i}`);
        refs[`form${i}`] = document.getElementById(`math-calc-form-${i}`);
        refs[`btnMathCalcBack${i===1?'1':i}`] = document.getElementById(i===1?'btn-math-calc-back':`btn-math-calc-back-${i}`);
        refs[`mathFormulaDisplay${i===1?'':i}`] = document.getElementById(i===1?'math-calc-formula-display':`math-calc-formula-display-${i}`);
    }
    refs.btnMathMenuBack = document.getElementById("btn-math-menu-back");
    refs.inKromosom = document.getElementById("math-in-kromosom");
    refs.inXmin = document.getElementById("math-in-xmin");
    refs.inXmax = document.getElementById("math-in-xmax");
    refs.inN = document.getElementById("math-in-n");
    refs.mathSteps = document.getElementById("math-steps-container");
    refs.m2InX1 = document.getElementById("math2-in-x1");
    refs.m2InX2 = document.getElementById("math2-in-x2");
    refs.m2Table = document.getElementById("math2-table-container");
    refs.m3InH = document.getElementById("math3-in-h");
    refs.m3InA = document.getElementById("math3-in-a");
    refs.m3Steps = document.getElementById("math3-steps-container");
    refs.m4DynamicInputs = document.getElementById("math4-dynamic-inputs");
    refs.m4Steps = document.getElementById("math4-steps-container");
    refs.m5InR = document.getElementById("math5-in-r");
    refs.m5DynamicInputs = document.getElementById("math5-dynamic-inputs");
    refs.m5Steps = document.getElementById("math5-steps-container");
    refs.m6DynamicInputs = document.getElementById("math6-dynamic-inputs");
    refs.m6Steps = document.getElementById("math6-steps-container");
    refs.m7InP1 = document.getElementById("math7-in-p1");
    refs.m7InP2 = document.getElementById("math7-in-p2");
    refs.m7InType = document.getElementById("math7-in-type");
    refs.m7InK = document.getElementById("math7-in-k");
    refs.m7InK1 = document.getElementById("math7-in-k1");
    refs.m7InK2 = document.getElementById("math7-in-k2");
    refs.m7InMask = document.getElementById("math7-in-mask");
    refs.m7ContainerK = document.getElementById("math7-k-container");
    refs.m7ContainerK1 = document.getElementById("math7-k1-container");
    refs.m7ContainerK2 = document.getElementById("math7-k2-container");
    refs.m7ContainerMask = document.getElementById("math7-mask-container");
    refs.m7Steps = document.getElementById("math7-steps-container");
    refs.m8InA = document.getElementById("math8-in-a");
    refs.m8InB = document.getElementById("math8-in-b");
    refs.m8Steps = document.getElementById("math8-steps-container");
    refs.m9DynamicInputs = document.getElementById("math9-dynamic-inputs");
    refs.m9Steps = document.getElementById("math9-steps-container");
    refs.m10DynamicInputs = document.getElementById("math10-dynamic-inputs");
    refs.m10Steps = document.getElementById("math10-steps-container");
    refs.m11DynamicInputs = document.getElementById("math11-dynamic-inputs");
    refs.m11Steps = document.getElementById("math11-steps-container");
    refs.m12InPa = document.getElementById("math12-in-pa");
    refs.m12InPba = document.getElementById("math12-in-pba");
    refs.m12InPb = document.getElementById("math12-in-pb");
    refs.m12Steps = document.getElementById("math12-steps-container");
    refs.m13InN = document.getElementById("math13-in-n");
    refs.m13InK = document.getElementById("math13-in-k");
    refs.m13Steps = document.getElementById("math13-steps-container");
    refs.m14InA = document.getElementById("math14-in-a");
    refs.m14InB = document.getElementById("math14-in-b");
    refs.m14InC = document.getElementById("math14-in-c");
    refs.m14Steps = document.getElementById("math14-steps-container");
    refs.m15InF = document.getElementById("math15-in-f");
    refs.m15InG = document.getElementById("math15-in-g");
    refs.m15InC = document.getElementById("math15-in-c");
    refs.m15Steps = document.getElementById("math15-steps-container");
    refs.m16InF = document.getElementById("math16-in-f");
    refs.m16InA = document.getElementById("math16-in-a");
    refs.m16Steps = document.getElementById("math16-steps-container");
    refs.m17InF = document.getElementById("math17-in-f");
    refs.m17InBigF = document.getElementById("math17-in-bigf");
    refs.m17InA = document.getElementById("math17-in-a");
    refs.m17InB = document.getElementById("math17-in-b");
    refs.m17Steps = document.getElementById("math17-steps-container");
    refs.m18InF = document.getElementById("math18-in-f");
    refs.m18InA = document.getElementById("math18-in-a");
    refs.m18InB = document.getElementById("math18-in-b");
    refs.m18Steps = document.getElementById("math18-steps-container");
    refs.m19InN = document.getElementById("math19-in-n");
    refs.m19InR = document.getElementById("math19-in-r");
    refs.m19Steps = document.getElementById("math19-steps-container");
    refs.m20InA = document.getElementById("math20-in-a");
    refs.m20InB = document.getElementById("math20-in-b");
    refs.m20Steps = document.getElementById("math20-steps-container");
    refs.m21InD = document.getElementById("math21-in-d");
    refs.m21Steps = document.getElementById("math21-steps-container");
    refs.m22InN = document.getElementById("math22-in-n");
    refs.m22Steps = document.getElementById("math22-steps-container");

    if (typeof katex !== 'undefined') {
        for(let i=1; i<=22; i++) {
            if(refs[`mathCard${i}`] && FORMULAS[i]) {
                katex.render(FORMULAS[i], refs[`mathCard${i}`], { throwOnError: false, displayMode: false });
            }
        }
    }

    if (refs.btnMathEor && refs.btnMathEor.tagName !== "A") {
        refs.btnMathEor.addEventListener("click", () => {
            refs.landingEl.classList.add("hidden");
            refs.mathMenu.classList.remove("hidden");
            state.currentView = "math-menu";
        });
    }

    if (refs.btnMathMenuBack && refs.btnMathMenuBack.tagName !== "A") {
        refs.btnMathMenuBack.addEventListener("click", () => {
            refs.mathMenu.classList.add("hidden");
            refs.landingEl.classList.remove("hidden");
            state.currentView = "landing";
        });
    }

    const CALC_MAP = {
        1: calculateMath,
        2: calculateMath2,
        3: calculateMath3,
        4: () => { if (refs.m4DynamicInputs && refs.m4DynamicInputs.children.length === 0) addM4Input(); calculateMath4(); },
        5: () => { if (refs.m5DynamicInputs && refs.m5DynamicInputs.children.length === 0) addM5Input(); calculateMath5(); },
        6: () => { if (refs.m6DynamicInputs && refs.m6DynamicInputs.children.length === 0) addM6Input(); calculateMath6(); },
        7: calculateMath7,
        8: calculateMath8,
        9: () => { if (refs.m9DynamicInputs && refs.m9DynamicInputs.children.length === 0) addM9Input(); calculateMath9(); },
        10: () => { if (refs.m10DynamicInputs && refs.m10DynamicInputs.children.length === 0) addM10Input(); calculateMath10(); },
        11: () => { if (refs.m11DynamicInputs && refs.m11DynamicInputs.children.length === 0) addM11Input(); calculateMath11(); },
        12: calculateMath12,
        13: calculateMath13,
        14: calculateMath14,
        15: calculateMath15,
        16: calculateMath16,
        17: calculateMath17,
        18: calculateMath18,
        19: calculateMath19,
        20: calculateMath20,
        21: calculateMath21,
        22: calculateMath22
    };

    const openForm = (formNum) => {
        refs.mathMenu.classList.add("hidden");
        refs.mathCalc.classList.remove("hidden");
        for(let i=1; i<=22; i++) {
            if(refs[`form${i}`]) refs[`form${i}`].classList.add("hidden");
        }
        state.currentView = "math-calc";
        if(refs[`form${formNum}`]) refs[`form${formNum}`].classList.remove("hidden");
        const disp = refs[`mathFormulaDisplay${formNum===1?'':formNum}`];
        if (typeof katex !== 'undefined' && disp && FORMULAS[formNum]) {
            katex.render(FORMULAS[formNum], disp, { throwOnError: false, displayMode: false });
        }
        if (CALC_MAP[formNum]) CALC_MAP[formNum]();
    };

    const closeForm = () => {
        refs.mathCalc.classList.add("hidden");
        refs.mathMenu.classList.remove("hidden");
        state.currentView = "math-menu";
    };

    for(let i=1; i<=22; i++) {
        if(refs[`mathCard${i}`]) refs[`mathCard${i}`].addEventListener("click", () => openForm(i));
        const btnBack = document.getElementById(i === 1 ? "btn-math-calc-back" : `btn-math-calc-back-${i}`);
        if (btnBack) btnBack.addEventListener("click", closeForm);
    }

    [refs.inN, refs.inKromosom, refs.inXmin, refs.inXmax].forEach(el => { if(el) el.addEventListener("input", calculateMath); });
    if(refs.inN) refs.inN.addEventListener("input", () => {
        const n = parseInt(refs.inN.value, 10);
        if(!isNaN(n) && n > 0 && !refs.inKromosom.value) { refs.inKromosom.value = "0".repeat(n); calculateMath(); }
    });
    const handleK = (e, d) => {
        const n = parseInt(refs.inN.value, 10);
        if(isNaN(n) || n < 1) return;
        e.preventDefault();
        let v = parseInt(refs.inKromosom.value || "0", 2);
        if(isNaN(v)) v = 0;
        v += d;
        const m = Math.pow(2, n) - 1;
        if(v < 0) v = m;
        if(v > m) v = 0;
        refs.inKromosom.value = v.toString(2).padStart(n, '0');
        calculateMath();
    };
    if(refs.inKromosom) {
        refs.inKromosom.addEventListener("keydown", (e) => {
            if(e.key === "ArrowUp") handleK(e, 1);
            if(e.key === "ArrowDown") handleK(e, -1);
        });
        refs.inKromosom.addEventListener("wheel", (e) => handleK(e, e.deltaY < 0 ? 1 : -1), {passive: false});
    }
    [refs.m2InX1, refs.m2InX2].forEach(el => { if(el) el.addEventListener("input", calculateMath2); });
    [refs.m3InH, refs.m3InA].forEach(el => { if(el) el.addEventListener("input", calculateMath3); });
    if (refs.m5InR) refs.m5InR.addEventListener("input", calculateMath5);
    [refs.m8InA, refs.m8InB].forEach(el => { if(el) el.addEventListener("input", calculateMath8); });
    [refs.m12InPa, refs.m12InPba, refs.m12InPb].forEach(el => { if(el) el.addEventListener("input", calculateMath12); });
    [refs.m13InN, refs.m13InK].forEach(el => { if(el) el.addEventListener("input", calculateMath13); });
    [refs.m14InA, refs.m14InB, refs.m14InC].forEach(el => { if(el) el.addEventListener("input", calculateMath14); });
    [refs.m15InF, refs.m15InG, refs.m15InC].forEach(el => { if(el) el.addEventListener("input", calculateMath15); });
    [refs.m16InF, refs.m16InA].forEach(el => { if(el) el.addEventListener("input", calculateMath16); });
    [refs.m17InF, refs.m17InBigF, refs.m17InA, refs.m17InB].forEach(el => { if(el) el.addEventListener("input", calculateMath17); });
    [refs.m18InF, refs.m18InA, refs.m18InB].forEach(el => { if(el) el.addEventListener("input", calculateMath18); });
    [refs.m19InN, refs.m19InR].forEach(el => { if(el) el.addEventListener("input", calculateMath19); });
    [refs.m20InA, refs.m20InB].forEach(el => { if(el) el.addEventListener("input", calculateMath20); });
    if(refs.m21InD) refs.m21InD.addEventListener("input", calculateMath21);
    if(refs.m22InN) refs.m22InN.addEventListener("input", calculateMath22);
    [refs.m7InP1, refs.m7InP2, refs.m7InType, refs.m7InK, refs.m7InK1, refs.m7InK2, refs.m7InMask].forEach(el => {
        if(el) el.addEventListener("input", () => {
            if (el === refs.m7InType) {
                const type = refs.m7InType.value;
                if(refs.m7ContainerK) refs.m7ContainerK.classList.toggle("hidden", type !== "single");
                if(refs.m7ContainerK1) refs.m7ContainerK1.classList.toggle("hidden", type !== "two");
                if(refs.m7ContainerK2) refs.m7ContainerK2.classList.toggle("hidden", type !== "two");
                if(refs.m7ContainerMask) refs.m7ContainerMask.classList.toggle("hidden", type !== "uniform");
            }
            calculateMath7();
        });
    });
    initFilters();
}