import { refs } from "./dom-refs.js";
import { state } from "./app-state.js";
import { calculateMath, calculateMath2, calculateMath3 } from "./math-calc-1-3.js";
import { addM4Input, addM5Input, addM6Input, calculateMath4, calculateMath5, calculateMath6 } from "./math-calc-4-6.js";
import { calculateMath7, calculateMath8 } from "./math-calc-7-8.js";
import { addM9Input, calculateMath9 } from "./math-calc-9.js";
const FORMULA = "x = x_{\\min} + \\frac{x_{\\max} - x_{\\min}}{2^n - 1} \\cdot d";
const FORMULA2 = "h = (x_1)^3 + \\frac{1}{3}(x_2)^2";
const FORMULA3 = "Fitness = \\frac{1}{h+a}";
const FORMULA4 = "P_i = \\frac{F_i}{\\sum F}";
const FORMULA5 = "C_i = C_{i-1} + P_i";
const FORMULA6 = "\\sum F = \\sum_{i=1}^{n} F_i";
const FORMULA7 = "O_1 = P_1(0..k) + P_2(k..n), \\; O_2 = P_2(0..k) + P_1(k..n)";
const FORMULA8 = "A \\prec B \\iff \\forall i: f_i(A) \\leq f_i(B) \\land \\exists j: f_j(A) < f_j(B)";
const FORMULA9 = "n_p \\text{ dan } S_p";
export function initMath() {
    refs.btnMathEor = document.getElementById("btn-math-eor");
    refs.mathMenu = document.getElementById("math-menu-view");
    refs.mathCalc = document.getElementById("math-calc-view");
    refs.mathCard1 = document.getElementById("math-card-1");
    refs.mathCard2 = document.getElementById("math-card-2");
    refs.mathCard3 = document.getElementById("math-card-3");
    refs.mathCard4 = document.getElementById("math-card-4");
    refs.mathCard5 = document.getElementById("math-card-5");
    refs.mathCard6 = document.getElementById("math-card-6");
    refs.mathCard7 = document.getElementById("math-card-7");
    refs.form1 = document.getElementById("math-calc-form-1");
    refs.form2 = document.getElementById("math-calc-form-2");
    refs.form3 = document.getElementById("math-calc-form-3");
    refs.form4 = document.getElementById("math-calc-form-4");
    refs.form5 = document.getElementById("math-calc-form-5");
    refs.form6 = document.getElementById("math-calc-form-6");
    refs.form7 = document.getElementById("math-calc-form-7");
    refs.btnMathMenuBack = document.getElementById("btn-math-menu-back");
    refs.btnMathCalcBack1 = document.getElementById("btn-math-calc-back");
    refs.btnMathCalcBack2 = document.getElementById("btn-math-calc-back-2");
    refs.btnMathCalcBack3 = document.getElementById("btn-math-calc-back-3");
    refs.btnMathCalcBack4 = document.getElementById("btn-math-calc-back-4");
    refs.btnMathCalcBack5 = document.getElementById("btn-math-calc-back-5");
    refs.mathFormulaDisplay = document.getElementById("math-calc-formula-display");
    refs.mathFormulaDisplay2 = document.getElementById("math-calc-formula-display-2");
    refs.mathFormulaDisplay3 = document.getElementById("math-calc-formula-display-3");
    refs.mathFormulaDisplay4 = document.getElementById("math-calc-formula-display-4");
    refs.mathFormulaDisplay5 = document.getElementById("math-calc-formula-display-5");
    refs.mathFormulaDisplay6 = document.getElementById("math-calc-formula-display-6");
    refs.mathFormulaDisplay7 = document.getElementById("math-calc-formula-display-7");
    refs.btnMathCalcBack6 = document.getElementById("btn-math-calc-back-6");
    refs.btnMathCalcBack7 = document.getElementById("btn-math-calc-back-7");
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
    refs.mathCard8 = document.getElementById("math-card-8");
    refs.mathCard9 = document.getElementById("math-card-9");
    refs.form8 = document.getElementById("math-calc-form-8");
    refs.form9 = document.getElementById("math-calc-form-9");
    refs.mathFormulaDisplay8 = document.getElementById("math-calc-formula-display-8");
    refs.mathFormulaDisplay9 = document.getElementById("math-calc-formula-display-9");
    refs.btnMathCalcBack8 = document.getElementById("btn-math-calc-back-8");
    refs.btnMathCalcBack9 = document.getElementById("btn-math-calc-back-9");
    refs.m9DynamicInputs = document.getElementById("math9-dynamic-inputs");
    refs.m9Steps = document.getElementById("math9-steps-container");
    refs.m8InA = document.getElementById("math8-in-a");
    refs.m8InB = document.getElementById("math8-in-b");
    refs.m8Steps = document.getElementById("math8-steps-container");
    if (typeof katex !== 'undefined') {
        katex.render(FORMULA, refs.mathCard1, { throwOnError: false, displayMode: false });
        if (refs.mathCard2) katex.render(FORMULA2, refs.mathCard2, { throwOnError: false, displayMode: false });
        if (refs.mathCard3) katex.render(FORMULA3, refs.mathCard3, { throwOnError: false, displayMode: false });
        if (refs.mathCard4) katex.render(FORMULA4, refs.mathCard4, { throwOnError: false, displayMode: false });
        if (refs.mathCard5) katex.render(FORMULA5, refs.mathCard5, { throwOnError: false, displayMode: false });
        if (refs.mathCard6) katex.render(FORMULA6, refs.mathCard6, { throwOnError: false, displayMode: false });
        if (refs.mathCard7) katex.render(FORMULA7, refs.mathCard7, { throwOnError: false, displayMode: false });
        if(refs.mathCard8) katex.render(FORMULA8, refs.mathCard8, { throwOnError: false, displayMode: false });
        if(refs.mathCard9) katex.render(FORMULA9, refs.mathCard9, { throwOnError: false, displayMode: false });
    }
    refs.btnMathEor.addEventListener("click", () => {
        refs.landingEl.classList.add("hidden");
        refs.mathMenu.classList.remove("hidden");
        state.currentView = "math-menu";
    });
    refs.btnMathMenuBack.addEventListener("click", () => {
        refs.mathMenu.classList.add("hidden");
        refs.landingEl.classList.remove("hidden");
        state.currentView = "landing";
    });
    const openForm = (formNum) => {
        refs.mathMenu.classList.add("hidden");
        refs.mathCalc.classList.remove("hidden");
        refs.form1.classList.add("hidden");
        refs.form2.classList.add("hidden");
        if(refs.form3) refs.form3.classList.add("hidden");
        if(refs.form4) refs.form4.classList.add("hidden");
        if(refs.form5) refs.form5.classList.add("hidden");
        if(refs.form6) refs.form6.classList.add("hidden");
        if(refs.form7) refs.form7.classList.add("hidden");
        if(refs.form8) refs.form8.classList.add("hidden");
        if(refs.form9) refs.form9.classList.add("hidden");
                state.currentView = "math-calc";
                if (formNum === 1) {
            refs.form1.classList.remove("hidden");
            if (typeof katex !== 'undefined') {
                katex.render(FORMULA, refs.mathFormulaDisplay, { throwOnError: false, displayMode: false });
            }
            calculateMath();
        } else if (formNum === 2) {
            refs.form2.classList.remove("hidden");
            if (typeof katex !== 'undefined') {
                katex.render(FORMULA2, refs.mathFormulaDisplay2, { throwOnError: false, displayMode: false });
            }
            calculateMath2();
        } else if (formNum === 3) {
            if(refs.form3) refs.form3.classList.remove("hidden");
            if (typeof katex !== 'undefined' && refs.mathFormulaDisplay3) {
                katex.render(FORMULA3, refs.mathFormulaDisplay3, { throwOnError: false, displayMode: false });
            }
            calculateMath3();
        } else if (formNum === 4) {
            if(refs.form4) refs.form4.classList.remove("hidden");
            if (typeof katex !== 'undefined' && refs.mathFormulaDisplay4) {
                katex.render(FORMULA4, refs.mathFormulaDisplay4, { throwOnError: false, displayMode: false });
            }
            if (refs.m4DynamicInputs && refs.m4DynamicInputs.children.length === 0) {
                addM4Input();
            }
            calculateMath4();
        } else if (formNum === 5) {
            if(refs.form5) refs.form5.classList.remove("hidden");
            if (typeof katex !== 'undefined' && refs.mathFormulaDisplay5) {
                katex.render(FORMULA5, refs.mathFormulaDisplay5, { throwOnError: false, displayMode: false });
            }
            if (refs.m5DynamicInputs && refs.m5DynamicInputs.children.length === 0) {
                addM5Input();
            }
            calculateMath5();
        } else if (formNum === 6) {
            if(refs.form6) refs.form6.classList.remove("hidden");
            if (typeof katex !== 'undefined' && refs.mathFormulaDisplay6) {
                katex.render(FORMULA6, refs.mathFormulaDisplay6, { throwOnError: false, displayMode: false });
            }
            if (refs.m6DynamicInputs && refs.m6DynamicInputs.children.length === 0) {
                addM6Input();
            }
            calculateMath6();
        } else if (formNum === 7) {
            if(refs.form7) refs.form7.classList.remove("hidden");
            if (typeof katex !== 'undefined' && refs.mathFormulaDisplay7) {
                katex.render(FORMULA7, refs.mathFormulaDisplay7, { throwOnError: false, displayMode: false });
            }
            calculateMath7();
        } else if (formNum === 8) {
            if(refs.form8) refs.form8.classList.remove("hidden");
            if (typeof katex !== "undefined" && refs.mathFormulaDisplay8) {
                katex.render(FORMULA8, refs.mathFormulaDisplay8, { throwOnError: false, displayMode: false });
            }
            calculateMath8();
        } else if (formNum === 9) {
            if(refs.form9) refs.form9.classList.remove("hidden");
            if (typeof katex !== "undefined" && refs.mathFormulaDisplay9) {
                katex.render(FORMULA9, refs.mathFormulaDisplay9, { throwOnError: false, displayMode: false });
            }
            if (refs.m9DynamicInputs && refs.m9DynamicInputs.children.length === 0) {
                addM9Input();
            }
            calculateMath9();
        }
    };
    refs.mathCard1.addEventListener("click", () => openForm(1));
    if(refs.mathCard2) refs.mathCard2.addEventListener("click", () => openForm(2));
    if(refs.mathCard3) refs.mathCard3.addEventListener("click", () => openForm(3));
    if(refs.mathCard4) refs.mathCard4.addEventListener("click", () => openForm(4));
    if(refs.mathCard5) refs.mathCard5.addEventListener("click", () => openForm(5));
    if(refs.mathCard6) refs.mathCard6.addEventListener("click", () => openForm(6));
    if(refs.mathCard7) refs.mathCard7.addEventListener("click", () => openForm(7));
    if(refs.mathCard8) refs.mathCard8.addEventListener("click", () => openForm(8));
    if(refs.mathCard9) refs.mathCard9.addEventListener("click", () => openForm(9));
    const closeForm = () => {
        refs.mathCalc.classList.add("hidden");
        refs.mathMenu.classList.remove("hidden");
        state.currentView = "math-menu";
    };
    refs.btnMathCalcBack1.addEventListener("click", closeForm);
    if(refs.btnMathCalcBack2) refs.btnMathCalcBack2.addEventListener("click", closeForm);
    if(refs.btnMathCalcBack3) refs.btnMathCalcBack3.addEventListener("click", closeForm);
    if(refs.btnMathCalcBack4) refs.btnMathCalcBack4.addEventListener("click", closeForm);
    if(refs.btnMathCalcBack5) refs.btnMathCalcBack5.addEventListener("click", closeForm);
    if(refs.btnMathCalcBack6) refs.btnMathCalcBack6.addEventListener("click", closeForm);
    if(refs.btnMathCalcBack7) refs.btnMathCalcBack7.addEventListener("click", closeForm);
    if(refs.btnMathCalcBack8) refs.btnMathCalcBack8.addEventListener("click", closeForm);
    if(refs.btnMathCalcBack9) refs.btnMathCalcBack9.addEventListener("click", closeForm);
    [refs.inKromosom, refs.inXmin, refs.inXmax].forEach(el => {
        if(el) el.addEventListener("input", calculateMath);
    });
    [refs.m2InX1, refs.m2InX2].forEach(el => {
        if(el) el.addEventListener("input", calculateMath2);
    });
    [refs.m3InH, refs.m3InA].forEach(el => {
        if(el) el.addEventListener("input", calculateMath3);
    });
    if (refs.m5InR) refs.m5InR.addEventListener("input", calculateMath5);
    
    [refs.m8InA, refs.m8InB].forEach(el => {
        if(el) el.addEventListener("input", calculateMath8);
    });
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
}