import { refs } from "./dom-refs.js";
import { state } from "./app-state.js";

const FORMULA = "x = x_{\\min} + \\frac{x_{\\max} - x_{\\min}}{2^n - 1} \\cdot d";
const FORMULA2 = "h = (x_1)^3 + \\frac{1}{3}(x_2)^2";
const FORMULA3 = "Fitness = \\frac{1}{h+a}";
const FORMULA4 = "P_i = \\frac{F_i}{\\sum F}";
const FORMULA5 = "C_i = C_{i-1} + P_i";

export function initMath() {
    refs.btnMathEor = document.getElementById("btn-math-eor");
    refs.mathMenu = document.getElementById("math-menu-view");
    refs.mathCalc = document.getElementById("math-calc-view");
    refs.mathCard1 = document.getElementById("math-card-1");
    refs.mathCard2 = document.getElementById("math-card-2");
    refs.mathCard3 = document.getElementById("math-card-3");
    refs.mathCard4 = document.getElementById("math-card-4");
    refs.mathCard5 = document.getElementById("math-card-5");
    refs.form1 = document.getElementById("math-calc-form-1");
    refs.form2 = document.getElementById("math-calc-form-2");
    refs.form3 = document.getElementById("math-calc-form-3");
    refs.form4 = document.getElementById("math-calc-form-4");
    refs.form5 = document.getElementById("math-calc-form-5");
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
    refs.m4InN = document.getElementById("math4-in-n");
    refs.m4DynamicInputs = document.getElementById("math4-dynamic-inputs");
    refs.m4Steps = document.getElementById("math4-steps-container");
    refs.m5InR = document.getElementById("math5-in-r");
    refs.m5Steps = document.getElementById("math5-steps-container");

    if (typeof katex !== 'undefined') {
        katex.render(FORMULA, refs.mathCard1, { throwOnError: false, displayMode: false });
        if (refs.mathCard2) katex.render(FORMULA2, refs.mathCard2, { throwOnError: false, displayMode: false });
        if (refs.mathCard3) katex.render(FORMULA3, refs.mathCard3, { throwOnError: false, displayMode: false });
        if (refs.mathCard4) katex.render(FORMULA4, refs.mathCard4, { throwOnError: false, displayMode: false });
        if (refs.mathCard5) katex.render(FORMULA5, refs.mathCard5, { throwOnError: false, displayMode: false });
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

                state.currentView = "math-calc";

                if (formNum === 1) {
            refs.form1.classList.remove("hidden");
            if (typeof katex !== 'undefined') {
                katex.render(FORMULA, refs.mathFormulaDisplay, { throwOnError: false, displayMode: true });
            }
            calculateMath();
        } else if (formNum === 2) {
            refs.form2.classList.remove("hidden");
            if (typeof katex !== 'undefined') {
                katex.render(FORMULA2, refs.mathFormulaDisplay2, { throwOnError: false, displayMode: true });
            }
            calculateMath2();
        } else if (formNum === 3) {
            if(refs.form3) refs.form3.classList.remove("hidden");
            if (typeof katex !== 'undefined' && refs.mathFormulaDisplay3) {
                katex.render(FORMULA3, refs.mathFormulaDisplay3, { throwOnError: false, displayMode: true });
            }
            calculateMath3();
        } else if (formNum === 4) {
            if(refs.form4) refs.form4.classList.remove("hidden");
            if (typeof katex !== 'undefined' && refs.mathFormulaDisplay4) {
                katex.render(FORMULA4, refs.mathFormulaDisplay4, { throwOnError: false, displayMode: true });
            }
            if(refs.m4InN) calculateMath4();
        } else if (formNum === 5) {
            if(refs.form5) refs.form5.classList.remove("hidden");
            if (typeof katex !== 'undefined' && refs.mathFormulaDisplay5) {
                katex.render(FORMULA5, refs.mathFormulaDisplay5, { throwOnError: false, displayMode: true });
            }
            if(refs.m5InR) calculateMath5();
        }
    };

    refs.mathCard1.addEventListener("click", () => openForm(1));
    if(refs.mathCard2) refs.mathCard2.addEventListener("click", () => openForm(2));
    if(refs.mathCard3) refs.mathCard3.addEventListener("click", () => openForm(3));
    if(refs.mathCard4) refs.mathCard4.addEventListener("click", () => openForm(4));
    if(refs.mathCard5) refs.mathCard5.addEventListener("click", () => openForm(5));

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

    [refs.inKromosom, refs.inXmin, refs.inXmax].forEach(el => {
        if(el) el.addEventListener("input", calculateMath);
    });

    [refs.m2InX1, refs.m2InX2].forEach(el => {
        if(el) el.addEventListener("input", calculateMath2);
    });

    [refs.m3InH, refs.m3InA].forEach(el => {
        if(el) el.addEventListener("input", calculateMath3);
    });

    if (refs.m4InN) {
        refs.m4InN.addEventListener("input", () => {
            const n = parseInt(refs.m4InN.value) || 0;
            refs.m4DynamicInputs.textContent = '';
            for (let i = 1; i <= n; i++) {
                const div = document.createElement('div');
                div.className = 'math-input-group';

                                const label = document.createElement('label');
                label.textContent = `Fitness Individu ${i}`;

                                const input = document.createElement('input');
                input.type = 'number';
                input.step = 'any';
                input.className = 'm4-fitness-input';
                input.id = `m4-fit-${i}`;
                input.placeholder = '0';

                                div.appendChild(label);
                div.appendChild(input);
                refs.m4DynamicInputs.appendChild(div);
            }
            const inputs = document.querySelectorAll('.m4-fitness-input');
            inputs.forEach(inp => inp.addEventListener("input", calculateMath4));
            calculateMath4();
        });
    }

    if (refs.m5InR) refs.m5InR.addEventListener("input", calculateMath5);
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
        const rounded = Math.round(val * 100) / 100;
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
        const x2TermRounded = Math.round(x2Term * 100) / 100;
        step2 = `h = ${x1Cubed} + ${x2TermRounded}`;
    }

    const finalVal = x1Cubed + (x2Sq / 3);
    const step3 = `h \\approx ${Math.round(finalVal * 100) / 100}`;

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
    const step3 = `Fitness \\approx ${Math.round(finalVal * 100) / 100}`;

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
    if (inputs.length === 0) return;

    const fitnessValues = [];
    let totalFitness = 0;
    inputs.forEach(input => {
        const val = parseFloat(input.value) || 0;
        fitnessValues.push(val);
        totalFitness += val;
    });

    const totalDiv = document.createElement('div');
    totalDiv.className = 'math-step math-step-total';
    const strong = document.createElement('strong');
    strong.textContent = `Total Fitness (\u03A3F) = ${totalFitness}`;
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
        strongP.textContent = p.toFixed(4);
        tdP.appendChild(strongP);
        tr.appendChild(tdP);
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    refs.m4Steps.appendChild(table);

    localStorage.setItem('ga_probabilities', JSON.stringify(probabilities));
}

function calculateMath5() {
    if (!refs.m5Steps) return;
    refs.m5Steps.textContent = '';
    const pStr = localStorage.getItem('ga_probabilities');
    if (!pStr) {
        const errDiv = document.createElement('div');
        errDiv.className = 'math-step-box math-step-error';
        errDiv.textContent = 'Data probabilitas tidak ditemukan. Silakan isi Modul 4 terlebih dahulu.';
        refs.m5Steps.appendChild(errDiv);
        return;
    }

    const probabilities = JSON.parse(pStr);
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
            ? `${p.toFixed(4)}`
            : `${prevCumulative.toFixed(4)} + ${p.toFixed(4)}`;
        rows.push({ index, p, calculationText, cumulative });
        if (r !== null && selectedParent === null && cumulative >= r) {
            selectedParent = index + 1;
            selectedParentCumulative = cumulative.toFixed(4);
        }
    });

    const validBanner = document.createElement('div');
    validBanner.className = finalCumulative >= 0.9999 && finalCumulative <= 1.0001
        ? 'math-step-box math-step-valid'
        : 'math-step-box math-step-invalid';
    validBanner.textContent = finalCumulative >= 0.9999 && finalCumulative <= 1.0001
        ? '\u2705 Kumulatif valid (berakhir di 1.0000)'
        : '\u274C Error: Kumulatif tidak berakhir di 1.0000. Cek kembali input di Modul 4.';
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
        [index + 1, p.toFixed(4), calculationText].forEach(val => {
            const td = document.createElement('td');
            td.textContent = val;
            tr.appendChild(td);
        });
        const tdC = document.createElement('td');
        const strongC = document.createElement('strong');
        strongC.textContent = cum.toFixed(4);
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