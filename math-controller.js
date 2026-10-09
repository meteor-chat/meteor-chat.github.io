import { refs } from "./dom-refs.js";
import { state } from "./app-state.js";
const FORMULA = "x = x_{\\min} + \\frac{x_{\\max} - x_{\\min}}{2^n - 1} \\cdot d";
const FORMULA2 = "h = (x_1)^3 + \\frac{1}{3}(x_2)^2";
const FORMULA3 = "Fitness = \\frac{1}{h+a}";
const FORMULA4 = "P_i = \\frac{F_i}{\\sum F}";
const FORMULA5 = "C_i = C_{i-1} + P_i";
const FORMULA6 = "\\sum F = \\sum_{i=1}^{n} F_i";
const FORMULA7 = "O_1 = P_1(0..k) + P_2(k..n), \\; O_2 = P_2(0..k) + P_1(k..n)";
const FORMULA8 = "A \\prec B \\iff \\forall i: f_i(A) \\leq f_i(B) \\land \\exists j: f_j(A) < f_j(B)";
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
    refs.form8 = document.getElementById("math-calc-form-8");
    refs.mathFormulaDisplay8 = document.getElementById("math-calc-formula-display-8");
    refs.btnMathCalcBack8 = document.getElementById("btn-math-calc-back-8");
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
function addM4Input() {
    if (!refs.m4DynamicInputs) return;
    const index = refs.m4DynamicInputs.children.length + 1;
    const div = document.createElement('div');
    div.className = 'math-input-group';
    const label = document.createElement('label');
    label.textContent = `Fitness Individu ${index}`;
    const input = document.createElement('input');
    input.type = 'number';
    input.step = '0.1';
    input.className = 'm4-fitness-input';
    input.id = `m4-fit-${index}`;
    input.placeholder = '0';
        input.addEventListener("input", () => {
        const inputs = document.querySelectorAll('.m4-fitness-input');
        const lastInput = inputs[inputs.length - 1];
        if (lastInput.value.trim() !== '') {
            addM4Input();
        }
        calculateMath4();
    });
    div.appendChild(label);
    div.appendChild(input);
    refs.m4DynamicInputs.appendChild(div);
}
function addM5Input() {
    if (!refs.m5DynamicInputs) return;
    const index = refs.m5DynamicInputs.children.length + 1;
    const div = document.createElement('div');
    div.className = 'math-input-group';
    const label = document.createElement('label');
    label.textContent = `Probabilitas (Pi) ${index}`;
    const input = document.createElement('input');
    input.type = 'number';
    input.step = '0.1';
    input.className = 'm5-prob-input';
    input.id = `m5-prob-${index}`;
    input.placeholder = '0';
        input.addEventListener("input", () => {
        const inputs = document.querySelectorAll('.m5-prob-input');
        const lastInput = inputs[inputs.length - 1];
        if (lastInput.value.trim() !== '') {
            addM5Input();
        }
        calculateMath5();
    });
    div.appendChild(label);
    div.appendChild(input);
    refs.m5DynamicInputs.appendChild(div);
}
function addM6Input() {
    if (!refs.m6DynamicInputs) return;
    const index = refs.m6DynamicInputs.children.length + 1;
    const div = document.createElement('div');
    div.className = 'math-input-group';
    const label = document.createElement('label');
    label.textContent = `Nilai F${index}`;
    const input = document.createElement('input');
    input.type = 'number';
    input.step = '0.1';
    input.className = 'm6-fitness-input';
    input.id = `m6-fit-${index}`;
    input.placeholder = '0';
        input.addEventListener("input", () => {
        const inputs = document.querySelectorAll('.m6-fitness-input');
        const lastInput = inputs[inputs.length - 1];
        if (lastInput.value.trim() !== '') {
            addM6Input();
        }
        calculateMath6();
    });
    div.appendChild(label);
    div.appendChild(input);
    refs.m6DynamicInputs.appendChild(div);
}
function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
}
function calculateMath() {
    if (typeof katex === 'undefined') return;
    const kromosom = refs.inKromosom.value.trim() || "1011";
    const xMinStr = refs.inXmin.value || "-2";
    const xMaxStr = refs.inXmax.value || "3";
    const xMin = parseFloat(xMinStr);
    const xMax = parseFloat(xMaxStr);
        refs.mathSteps.textContent = '';
    if (!/^[01]+$/.test(kromosom)) {
        const err = document.createElement('div');
        err.className = 'katex-error';
        err.textContent = 'Kromosom harus biner (0/1)';
        refs.mathSteps.appendChild(err);
        if(refs.inN) refs.inN.value = "";
        return;
    }
    const n = kromosom.length;
    if(refs.inN) refs.inN.value = n;
    if (isNaN(xMin) || isNaN(xMax)) {
        return;
    }
    const d = parseInt(kromosom, 2);
    const step1 = `d = (${kromosom})_2 = ${d}`;
    const num = xMax - xMin;
    const den = Math.pow(2, n) - 1;
    const xMinFmt = xMin < 0 ? `(${xMin})` : xMin;
    const step2 = `x = ${xMin} + \\frac{${xMax} - ${xMinFmt}}{2^{${n}} - 1} \\cdot ${d}`;
    const addStep = (tex, boxClass = 'math-step') => {
        const div = document.createElement('div');
        div.className = boxClass;
        katex.render(tex, div, { throwOnError: false, displayMode: true });
        refs.mathSteps.appendChild(div);
    };
    addStep(step1);
    addStep(step2);
    if (den !== 0) {
        const val = xMin + (num / den) * d;
        const isInt = Number.isInteger(xMin) && Number.isInteger(xMax);
        if (isInt) {
            const top = (xMin * den) + (num * d);
            const bottom = den;
            const divisor = Math.abs(gcd(top, bottom));
            const topSimp = top / Math.abs(divisor);
            const bottomSimp = bottom / Math.abs(divisor);
            if (bottomSimp === 1) {
                addStep(`x = ${topSimp}`);
            } else {
                const fracPrefix = (topSimp < 0 && bottomSimp > 0) || (topSimp > 0 && bottomSimp < 0) ? "-" : "";
                addStep(`x = ${fracPrefix}\\frac{${Math.abs(topSimp)}}{${Math.abs(bottomSimp)}}`);
            }
        }
        const rounded = val.toFixed(3);
        const step4 = `x \\approx ${rounded}`;
        if (!isInt || (num/den)*d % 1 !== 0) {
            addStep(step4, 'math-step-box');
        }
    }
}
function calculateMath2() {
    if(!refs.m2InX1 || typeof katex === 'undefined') return;
    const x1Str = refs.m2InX1.value || "2";
    const x2Str = refs.m2InX2.value || "3";
    const x1 = parseFloat(x1Str);
    const x2 = parseFloat(x2Str);
    refs.m2Table.textContent = "";
    if (isNaN(x1) || isNaN(x2)) {
        return;
    }
    const x1Fmt = x1 < 0 ? `(${x1})` : x1;
    const x2Fmt = x2 < 0 ? `(${x2})` : x2;
    const step1 = `h = ${x1Fmt}^3 + \\frac{1}{3}${x2Fmt}^2`;
    const x1Cubed = Math.pow(x1, 3);
    const x2Sq = Math.pow(x2, 2);
    let step2 = "";
    if (Number.isInteger(x2Sq) && x2Sq !== 0) {
        step2 = `h = ${x1Cubed} + \\frac{${x2Sq}}{3}`;
    } else {
        const x2Term = x2Sq / 3;
        const x2TermRounded = x2Term.toFixed(3);
        step2 = `h = ${x1Cubed} + ${x2TermRounded}`;
    }
    const finalVal = x1Cubed + (x2Sq / 3);
    const step3 = `h \\approx ${finalVal.toFixed(3)}`;
    const addStep = (tex, boxClass = 'math-step') => {
        const div = document.createElement('div');
        div.className = boxClass;
        katex.render(tex, div, { throwOnError: false, displayMode: true });
        refs.m2Table.appendChild(div);
    };
    addStep(step1);
    addStep(step2);
    addStep(step3, 'math-step-box');
}
function calculateMath3() {
    if(!refs.m3InH || typeof katex === 'undefined') return;
    const hStr = refs.m3InH.value || "5";
    const aStr = refs.m3InA.value || "0.1";
    const h = parseFloat(hStr);
    const a = parseFloat(aStr);
    refs.m3Steps.textContent = "";
    if (isNaN(h) || isNaN(a)) {
        return;
    }
    const hFmt = h < 0 ? `(${h})` : h;
    const aFmt = a < 0 ? `(${a})` : a;
    const step1 = `Fitness = \\frac{1}{${hFmt} + ${aFmt}}`;
    const sum = h + a;
    const step2 = `Fitness = \\frac{1}{${sum}}`;
    const finalVal = 1 / sum;
    const step3 = `Fitness \\approx ${finalVal.toFixed(3)}`;
    const addStep = (tex, boxClass = 'math-step') => {
        const div = document.createElement('div');
        div.className = boxClass;
        katex.render(tex, div, { throwOnError: false, displayMode: true });
        refs.m3Steps.appendChild(div);
    };
    addStep(step1);
    if (sum !== h && sum !== a) {
        addStep(step2);
    }
    addStep(step3, 'math-step-box');
}
function calculateMath4() {
    if (!refs.m4Steps) return;
    const inputs = document.querySelectorAll('.m4-fitness-input');
    refs.m4Steps.textContent = '';
        const fitnessValues = [];
    let totalFitness = 0;
        inputs.forEach(input => {
        if (input.value.trim() !== '') {
            const val = parseFloat(input.value) || 0;
            fitnessValues.push(val);
            totalFitness += val;
        }
    });
    if (fitnessValues.length === 0) return;
    const totalDiv = document.createElement('div');
    totalDiv.className = 'math-step math-step-total';
    const strong = document.createElement('strong');
    strong.textContent = `Total Fitness (\u03A3F) = ${totalFitness.toFixed(3)}`;
    totalDiv.appendChild(strong);
    refs.m4Steps.appendChild(totalDiv);
    const table = document.createElement('table');
    table.className = 'math-table';
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Individu', 'Fitness (Fi)', 'Substitusi', 'Probabilitas (Pi)'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    const probabilities = [];
    fitnessValues.forEach((f, index) => {
        const p = totalFitness === 0 ? 0 : f / totalFitness;
        probabilities.push(p);
        const tr = document.createElement('tr');
        [index + 1, f, `${f} / ${totalFitness}`].forEach(val => {
            const td = document.createElement('td');
            td.textContent = val;
            tr.appendChild(td);
        });
        const tdP = document.createElement('td');
        const strongP = document.createElement('strong');
        strongP.textContent = p.toFixed(3);
        tdP.appendChild(strongP);
        tr.appendChild(tdP);
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    refs.m4Steps.appendChild(table);
}
function calculateMath5() {
    if (!refs.m5Steps) return;
    const inputs = document.querySelectorAll('.m5-prob-input');
    refs.m5Steps.textContent = '';
        const probabilities = [];
    inputs.forEach(input => {
        if (input.value.trim() !== '') {
            probabilities.push(parseFloat(input.value) || 0);
        }
    });
    if (probabilities.length === 0) return;
    const rInput = refs.m5InR.value;
    const r = rInput !== "" ? parseFloat(rInput) : null;
    let cumulative = 0;
    let selectedParent = null;
    let selectedParentCumulative = null;
    let finalCumulative = 0;
    const rows = [];
    probabilities.forEach((p, index) => {
        const prevCumulative = cumulative;
        cumulative += p;
        finalCumulative = cumulative;
        const calculationText = index === 0
            ? `${p.toFixed(3)}`
            : `${prevCumulative.toFixed(3)} + ${p.toFixed(3)}`;
        rows.push({ index, p, calculationText, cumulative });
        if (r !== null && selectedParent === null && cumulative >= r) {
            selectedParent = index + 1;
            selectedParentCumulative = cumulative.toFixed(3);
        }
    });
    const validBanner = document.createElement('div');
    validBanner.className = finalCumulative >= 0.999 && finalCumulative <= 1.001
        ? 'math-step-box math-step-valid'
        : 'math-step-box math-step-invalid';
    validBanner.textContent = finalCumulative >= 0.999 && finalCumulative <= 1.001
        ? '\u2705 Kumulatif valid (berakhir di 1.000)'
        : '\u274C Error: Kumulatif tidak berakhir di 1.000. Cek kembali input nilai probabilitas.';
    refs.m5Steps.appendChild(validBanner);
    const table = document.createElement('table');
    table.className = 'math-table';
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Individu', 'Probabilitas (Pi)', 'Cara Hitung Kumulatif', 'Kumulatif (Ci)'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    rows.forEach(({ index, p, calculationText, cumulative: cum }) => {
        const tr = document.createElement('tr');
        [index + 1, p.toFixed(3), calculationText].forEach(val => {
            const td = document.createElement('td');
            td.textContent = val;
            tr.appendChild(td);
        });
        const tdC = document.createElement('td');
        const strongC = document.createElement('strong');
        strongC.textContent = cum.toFixed(3);
        tdC.appendChild(strongC);
        tr.appendChild(tdC);
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    refs.m5Steps.appendChild(table);
    if (r !== null) {
        const resultDiv = document.createElement('div');
        if (selectedParent !== null) {
            resultDiv.className = 'math-step-box math-step-selected';
            const h3 = document.createElement('h3');
            h3.textContent = `\uD83C\uDFAF Parent Terpilih: Individu ${selectedParent}`;
            const p2 = document.createElement('p');
            p2.textContent = `Alasan: ${selectedParentCumulative} adalah nilai kumulatif pertama yang lebih besar atau sama dengan (\u2265) ${r}.`;
            resultDiv.appendChild(h3);
            resultDiv.appendChild(p2);
        } else {
            resultDiv.className = 'math-step-box math-step-invalid';
            const h3 = document.createElement('h3');
            h3.textContent = '\u274C Tidak ada Parent terpilih';
            const p2 = document.createElement('p');
            p2.textContent = `Alasan: Tidak ada nilai kumulatif yang lebih besar atau sama dengan (\u2265) ${r}.`;
            resultDiv.appendChild(h3);
            resultDiv.appendChild(p2);
        }
        refs.m5Steps.appendChild(resultDiv);
    }
}
function calculateMath6() {
    if (!refs.m6Steps) return;
    const inputs = document.querySelectorAll('.m6-fitness-input');
    refs.m6Steps.textContent = '';
        const fitnessValues = [];
    let totalFitness = 0;
        inputs.forEach(input => {
        if (input.value.trim() !== '') {
            const val = parseFloat(input.value) || 0;
            fitnessValues.push(val);
            totalFitness += val;
        }
    });
    if (fitnessValues.length === 0) return;
    const joinedValues = fitnessValues.join(" + ");
    const expression = "\\sum F = " + (joinedValues || "0");
    const divStep = document.createElement('div');
    divStep.className = 'math-step';
    if (typeof katex !== 'undefined') {
        katex.render(expression, divStep, { throwOnError: false, displayMode: true });
    }
    refs.m6Steps.appendChild(divStep);
    const totalDiv = document.createElement('div');
    totalDiv.className = 'math-step-box math-step-total';
    if (typeof katex !== 'undefined') {
        katex.render(`\\sum F = ${totalFitness.toFixed(3)}`, totalDiv, { throwOnError: false, displayMode: true });
    }
    refs.m6Steps.appendChild(totalDiv);
}
function calculateMath7() {
    if (!refs.m7Steps) return;
    refs.m7Steps.textContent = '';
    const p1 = refs.m7InP1 ? refs.m7InP1.value.trim() : '';
    const p2 = refs.m7InP2 ? refs.m7InP2.value.trim() : '';
    const type = refs.m7InType ? refs.m7InType.value : 'single';
    if (!p1 || !p2) return;
    const errDiv = document.createElement('div');
    errDiv.className = 'math-step-box math-step-error';
    if (p1.length !== p2.length) {
        errDiv.textContent = '\u274C Error: Panjang kromosom Parent 1 dan Parent 2 harus sama!';
        refs.m7Steps.appendChild(errDiv);
        return;
    }
    const n = p1.length;
    const stepDiv = document.createElement('div');
    stepDiv.className = 'math-step-box';
    const h3_1 = document.createElement('h3');
    h3_1.style.marginBottom = '8px';
    stepDiv.appendChild(h3_1);

    const createP = (label, spans) => {
        const p = document.createElement('p');
        p.style.fontFamily = 'monospace';
        p.style.fontSize = '1.1em';
        p.style.letterSpacing = '2px';
        const str = document.createElement('strong');
        str.textContent = label;
        p.appendChild(str);
        spans.forEach(s => {
            if(typeof s === 'string') {
                p.appendChild(document.createTextNode(s));
            } else {
                const sp = document.createElement('span');
                sp.style.color = s.color;
                sp.textContent = s.text;
                p.appendChild(sp);
            }
        });
        return p;
    };

    let o1Spans = [];
    let o2Spans = [];

    if (type === 'single') {
        const kStr = refs.m7InK ? refs.m7InK.value : '';
        if (kStr === '') return;
        const k = parseInt(kStr);
        if (k < 1 || k >= n) {
            errDiv.textContent = `\u274C Error: Titik potong (k) harus antara 1 dan ${n - 1}.`;
            refs.m7Steps.appendChild(errDiv);
            return;
        }
        h3_1.textContent = `\u2702\uFE0F 1. Single-point Crossover (k = ${k})`;
        stepDiv.appendChild(createP('P1: ', [{color: '#60a5fa', text: p1.substring(0, k)}, ' | ', {color: '#60a5fa', text: p1.substring(k)}]));
        const p2Node = createP('P2: ', [{color: '#34d399', text: p2.substring(0, k)}, ' | ', {color: '#34d399', text: p2.substring(k)}]);
        p2Node.style.marginBottom = '15px';
        stepDiv.appendChild(p2Node);
        o1Spans = [{color: '#60a5fa', text: p1.substring(0, k)}, {color: '#34d399', text: p2.substring(k)}];
        o2Spans = [{color: '#34d399', text: p2.substring(0, k)}, {color: '#60a5fa', text: p1.substring(k)}];
    } else if (type === 'two') {
        const k1Str = refs.m7InK1 ? refs.m7InK1.value : '';
        const k2Str = refs.m7InK2 ? refs.m7InK2.value : '';
        if (k1Str === '' || k2Str === '') return;
        const k1 = parseInt(k1Str);
        const k2 = parseInt(k2Str);
        if (k1 < 1 || k2 >= n || k1 >= k2) {
            errDiv.textContent = `\u274C Error: Titik potong tidak valid (1 \u2264 k1 < k2 < ${n}).`;
            refs.m7Steps.appendChild(errDiv);
            return;
        }
        h3_1.textContent = `\u2702\uFE0F 1. Two-point Crossover (k1 = ${k1}, k2 = ${k2})`;
        stepDiv.appendChild(createP('P1: ', [{color: '#60a5fa', text: p1.substring(0, k1)}, ' | ', {color: '#60a5fa', text: p1.substring(k1, k2)}, ' | ', {color: '#60a5fa', text: p1.substring(k2)}]));
        const p2Node = createP('P2: ', [{color: '#34d399', text: p2.substring(0, k1)}, ' | ', {color: '#34d399', text: p2.substring(k1, k2)}, ' | ', {color: '#34d399', text: p2.substring(k2)}]);
        p2Node.style.marginBottom = '15px';
        stepDiv.appendChild(p2Node);
        o1Spans = [{color: '#60a5fa', text: p1.substring(0, k1)}, {color: '#34d399', text: p2.substring(k1, k2)}, {color: '#60a5fa', text: p1.substring(k2)}];
        o2Spans = [{color: '#34d399', text: p2.substring(0, k1)}, {color: '#60a5fa', text: p1.substring(k1, k2)}, {color: '#34d399', text: p2.substring(k2)}];
    } else if (type === 'uniform') {
        const mask = refs.m7InMask ? refs.m7InMask.value.trim() : '';
        if (mask === '') return;
        if (mask.length !== n || !/^[01]+$/.test(mask)) {
            errDiv.textContent = `\u274C Error: Mask harus biner dengan panjang ${n}.`;
            refs.m7Steps.appendChild(errDiv);
            return;
        }
        h3_1.textContent = `\uD83C\uDFB2 1. Uniform Crossover (mask = ${mask})`;
        stepDiv.appendChild(createP('P1: ', [{color: '#60a5fa', text: p1}]));
        stepDiv.appendChild(createP('P2: ', [{color: '#34d399', text: p2}]));
        const maskNode = createP('Mask: ', [{color: '#fbbf24', text: mask}]);
        maskNode.style.marginBottom = '15px';
        stepDiv.appendChild(maskNode);
        
        for (let i = 0; i < n; i++) {
            if (mask[i] === '1') {
                o1Spans.push({color: '#60a5fa', text: p1[i]});
                o2Spans.push({color: '#34d399', text: p2[i]});
            } else {
                o1Spans.push({color: '#34d399', text: p2[i]});
                o2Spans.push({color: '#60a5fa', text: p1[i]});
            }
        }
    }

    const h3_2 = document.createElement('h3');
    h3_2.style.marginBottom = '8px';
    h3_2.textContent = '\uD83D\uDD00 2. Hasil Persilangan (Offspring)';
    stepDiv.appendChild(h3_2);
    
    stepDiv.appendChild(createP('O1: ', o1Spans));
    stepDiv.appendChild(createP('O2: ', o2Spans));

    refs.m7Steps.appendChild(stepDiv);
}

function calculateMath8() {
    if (!refs.m8Steps) return;
    refs.m8Steps.textContent = '';
    const strA = refs.m8InA ? refs.m8InA.value.trim() : '';
    const strB = refs.m8InB ? refs.m8InB.value.trim() : '';
    if (!strA || !strB) return;

    const parseVec = (str) => {
        const parts = str.split(',').map(s => parseFloat(s.trim()));
        return parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) ? parts : null;
    };

    const vecA = parseVec(strA);
    const vecB = parseVec(strB);

    const errDiv = document.createElement('div');
    errDiv.className = 'math-step-box math-step-error';
    if (!vecA || !vecB) {
        errDiv.textContent = '\u274C Error: Format tidak valid! Gunakan format "f1,f2" contoh: 3,45';
        refs.m8Steps.appendChild(errDiv);
        return;
    }

    const stepDiv = document.createElement('div');
    stepDiv.className = 'math-step-box';

    const pTest = document.createElement('p');
    pTest.style.fontFamily = 'monospace';
    pTest.style.fontSize = '1.1em';
    pTest.style.marginBottom = '15px';
    
    // Condition A dominates B
    // A <= B on all, A < B on at least one
    const aLTE1 = vecA[0] <= vecB[0];
    const aLTE2 = vecA[1] <= vecB[1];
    const aLT1 = vecA[0] < vecB[0];
    const aLT2 = vecA[1] < vecB[1];
    const aDominatesB = (aLTE1 && aLTE2) && (aLT1 || aLT2);

    const bLTE1 = vecB[0] <= vecA[0];
    const bLTE2 = vecB[1] <= vecA[1];
    const bLT1 = vecB[0] < vecA[0];
    const bLT2 = vecB[1] < vecA[1];
    const bDominatesA = (bLTE1 && bLTE2) && (bLT1 || bLT2);

    const identical = (vecA[0] === vecB[0] && vecA[1] === vecB[1]);

    const title = document.createElement('h3');
    title.style.marginBottom = '10px';
    title.textContent = '⚖️ Uji Pareto Dominance (Minimisasi)';
    stepDiv.appendChild(title);

    let testStr = `Test A ≤ B: ${vecA[0]} ≤ ${vecB[0]} ➔ ${aLTE1 ? 'True' : 'False'}, ${vecA[1]} ≤ ${vecB[1]} ➔ ${aLTE2 ? 'True' : 'False'}`;
    pTest.innerHTML = testStr + '<br>' + `Test B ≤ A: ${vecB[0]} ≤ ${vecA[0]} ➔ ${bLTE1 ? 'True' : 'False'}, ${vecB[1]} ≤ ${vecA[1]} ➔ ${bLTE2 ? 'True' : 'False'}`;
    stepDiv.appendChild(pTest);

    const resDiv = document.createElement('div');
    resDiv.style.fontWeight = 'bold';
    resDiv.style.fontSize = '1.2em';
    resDiv.style.padding = '10px';
    resDiv.style.borderRadius = '8px';
    resDiv.style.marginTop = '15px';

    if (identical) {
        resDiv.style.backgroundColor = '#4b5563';
        resDiv.style.color = 'white';
        resDiv.textContent = 'Result: Neither dominates (Identical)';
    } else if (aDominatesB) {
        resDiv.style.backgroundColor = '#059669';
        resDiv.style.color = 'white';
        resDiv.textContent = 'Result: A dominates B';
    } else if (bDominatesA) {
        resDiv.style.backgroundColor = '#2563eb';
        resDiv.style.color = 'white';
        resDiv.textContent = 'Result: B dominates A';
    } else {
        resDiv.style.backgroundColor = '#dc2626';
        resDiv.style.color = 'white';
        resDiv.textContent = 'Result: Neither dominates (Incomparable)';
    }
    
    stepDiv.appendChild(resDiv);
    refs.m8Steps.appendChild(stepDiv);
}
