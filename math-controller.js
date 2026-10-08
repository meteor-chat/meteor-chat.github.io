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
        katex.render(FORMULA, refs.mathCard1, { throwOnError: false, displayMode: true });
        if (refs.mathCard2) katex.render(FORMULA2, refs.mathCard2, { throwOnError: false, displayMode: true });
        if (refs.mathCard3) katex.render(FORMULA3, refs.mathCard3, { throwOnError: false, displayMode: true });
        if (refs.mathCard4) katex.render(FORMULA4, refs.mathCard4, { throwOnError: false, displayMode: true });
        if (refs.mathCard5) katex.render(FORMULA5, refs.mathCard5, { throwOnError: false, displayMode: true });
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
            refs.m4DynamicInputs.innerHTML = '';
            for (let i = 1; i <= n; i++) {
                const div = document.createElement('div');
                div.className = 'math-input-group';
                div.innerHTML = `<label>Fitness Individu ${i}</label><input type="number" step="any" class="m4-fitness-input" id="m4-fit-${i}" placeholder="0">`;
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

    if (!/^[01]+$/.test(kromosom)) {
        refs.mathSteps.innerHTML = "<div class='katex-error'>Kromosom harus biner (0/1)</div>";
        if(refs.inN) refs.inN.value = "";
        return;
    }

    const n = kromosom.length;
    if(refs.inN) refs.inN.value = n;

    if (isNaN(xMin) || isNaN(xMax)) {
        refs.mathSteps.innerHTML = "";
        return;
    }

    const d = parseInt(kromosom, 2);
    const step1 = `d = (${kromosom})_2 = ${d}`;
    const num = xMax - xMin;
    const den = Math.pow(2, n) - 1;
    const xMinFmt = xMin < 0 ? `(${xMin})` : xMin;
    const step2 = `x = ${xMin} + \\frac{${xMax} - ${xMinFmt}}{2^{${n}} - 1} \\cdot ${d}`;

    let stepsHtml = "";
    stepsHtml += `<div class="math-step">`;
    stepsHtml += katex.renderToString(step1, { throwOnError: false, displayMode: true });
    stepsHtml += `</div>`;
    stepsHtml += `<div class="math-step">`;
    stepsHtml += katex.renderToString(step2, { throwOnError: false, displayMode: true });
    stepsHtml += `</div>`;

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
                const step3 = `x = ${topSimp}`;
                stepsHtml += `<div class="math-step">`;
                stepsHtml += katex.renderToString(step3, { throwOnError: false, displayMode: true });
                stepsHtml += `</div>`;
            } else {
                const fracPrefix = (topSimp < 0 && bottomSimp > 0) || (topSimp > 0 && bottomSimp < 0) ? "-" : "";
                const step3 = `x = ${fracPrefix}\\frac{${Math.abs(topSimp)}}{${Math.abs(bottomSimp)}}`;
                stepsHtml += `<div class="math-step">`;
                stepsHtml += katex.renderToString(step3, { throwOnError: false, displayMode: true });
                stepsHtml += `</div>`;
            }
        }
        const rounded = Math.round(val * 100) / 100;
        const step4 = `x \\approx ${rounded}`;
        if (!isInt || (num/den)*d % 1 !== 0) {
            stepsHtml += `<div class="math-step-box">`;
            stepsHtml += katex.renderToString(step4, { throwOnError: false, displayMode: true });
            stepsHtml += `</div>`;
        }
    }
    refs.mathSteps.innerHTML = stepsHtml;
}

function calculateMath2() {
    if(!refs.m2InX1 || typeof katex === 'undefined') return;
    const x1Str = refs.m2InX1.value || "2";
    const x2Str = refs.m2InX2.value || "3";
    const x1 = parseFloat(x1Str);
    const x2 = parseFloat(x2Str);

    if (isNaN(x1) || isNaN(x2)) {
        refs.m2Table.innerHTML = "";
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

    let html = "";
    html += `<div class="math-step">${katex.renderToString(step1, { throwOnError: false, displayMode: true })}</div>`;
    html += `<div class="math-step">${katex.renderToString(step2, { throwOnError: false, displayMode: true })}</div>`;
    html += `<div class="math-step-box">${katex.renderToString(step3, { throwOnError: false, displayMode: true })}</div>`;

    refs.m2Table.innerHTML = html;
}

function calculateMath3() {
    if(!refs.m3InH || typeof katex === 'undefined') return;
    const hStr = refs.m3InH.value || "5";
    const aStr = refs.m3InA.value || "0.1";
    const h = parseFloat(hStr);
    const a = parseFloat(aStr);

    if (isNaN(h) || isNaN(a)) {
        refs.m3Steps.innerHTML = "";
        return;
    }

    const hFmt = h < 0 ? `(${h})` : h;
    const aFmt = a < 0 ? `(${a})` : a;
    const step1 = `Fitness = \\frac{1}{${hFmt} + ${aFmt}}`;
    const sum = h + a;
    const step2 = `Fitness = \\frac{1}{${sum}}`;
    const finalVal = 1 / sum;
    const step3 = `Fitness \\approx ${Math.round(finalVal * 100) / 100}`;

    let html = "";
    html += `<div class="math-step">${katex.renderToString(step1, { throwOnError: false, displayMode: true })}</div>`;
    if (sum !== h && sum !== a) {
        html += `<div class="math-step">${katex.renderToString(step2, { throwOnError: false, displayMode: true })}</div>`;
    }
    html += `<div class="math-step-box">${katex.renderToString(step3, { throwOnError: false, displayMode: true })}</div>`;

    refs.m3Steps.innerHTML = html;
}

function calculateMath4() {
    if (!refs.m4Steps) return;
    const inputs = document.querySelectorAll('.m4-fitness-input');
    if (inputs.length === 0) {
        refs.m4Steps.innerHTML = '';
        return;
    }
    const fitnessValues = [];
    let totalFitness = 0;
    inputs.forEach(input => {
        const val = parseFloat(input.value) || 0;
        fitnessValues.push(val);
        totalFitness += val;
    });

    let html = `<div class="math-step" style="text-align: center; margin-bottom: 20px;"><strong>Total Fitness (&Sigma;F) = ${totalFitness}</strong></div>`;
    html += `<table style="width: 100%; border-collapse: collapse; margin-top: 10px; color: var(--text-color, inherit);">`;
    html += `<thead><tr style="border-bottom: 1px solid var(--border-color, #444);"><th style="padding: 8px; text-align: left;">Individu</th><th style="padding: 8px; text-align: left;">Fitness (F<sub>i</sub>)</th><th style="padding: 8px; text-align: left;">Substitusi</th><th style="padding: 8px; text-align: left;">Probabilitas (P<sub>i</sub>)</th></tr></thead>`;
    html += `<tbody>`;

    const probabilities = [];
    fitnessValues.forEach((f, index) => {
        const p = totalFitness === 0 ? 0 : f / totalFitness;
        probabilities.push(p);
        html += `<tr style="border-bottom: 1px solid var(--border-color, #222);">`;
        html += `<td style="padding: 8px;">${index + 1}</td>`;
        html += `<td style="padding: 8px;">${f}</td>`;
        html += `<td style="padding: 8px;">${f} / ${totalFitness}</td>`;
        html += `<td style="padding: 8px;"><strong>${p.toFixed(4)}</strong></td>`;
        html += `</tr>`;
    });
    html += `</tbody></table>`;

    localStorage.setItem('ga_probabilities', JSON.stringify(probabilities));
    refs.m4Steps.innerHTML = html;
}

function calculateMath5() {
    if (!refs.m5Steps) return;
    const pStr = localStorage.getItem('ga_probabilities');
    if (!pStr) {
        refs.m5Steps.innerHTML = '<div class="math-step-box" style="color: #e74c3c;">Data probabilitas tidak ditemukan. Silakan isi Modul 4 terlebih dahulu.</div>';
        return;
    }

    const probabilities = JSON.parse(pStr);
    const rInput = refs.m5InR.value;
    const r = rInput !== "" ? parseFloat(rInput) : null;

    let cumulative = 0;
    let selectedParent = null;
    let selectedParentCumulative = null;
    let finalCumulative = 0;

    let html = `<table style="width: 100%; border-collapse: collapse; margin-top: 10px; color: var(--text-color, inherit);">`;
    html += `<thead><tr style="border-bottom: 1px solid var(--border-color, #444);"><th style="padding: 8px; text-align: left;">Individu</th><th style="padding: 8px; text-align: left;">Probabilitas (P<sub>i</sub>)</th><th style="padding: 8px; text-align: left;">Cara Hitung Kumulatif</th><th style="padding: 8px; text-align: left;">Kumulatif (C<sub>i</sub>)</th></tr></thead>`;
    html += `<tbody>`;

    probabilities.forEach((p, index) => {
        const prevCumulative = cumulative;
        cumulative += p;
        finalCumulative = cumulative;

        let calculationText = '';
        if (index === 0) {
            calculationText = `${p.toFixed(4)}`;
        } else {
            calculationText = `${prevCumulative.toFixed(4)} + ${p.toFixed(4)}`;
        }

        html += `<tr style="border-bottom: 1px solid var(--border-color, #222);">`;
        html += `<td style="padding: 8px;">${index + 1}</td>`;
        html += `<td style="padding: 8px;">${p.toFixed(4)}</td>`;
        html += `<td style="padding: 8px;">${calculationText}</td>`;
        html += `<td style="padding: 8px;"><strong>${cumulative.toFixed(4)}</strong></td>`;
        html += `</tr>`;

        if (r !== null && selectedParent === null && cumulative >= r) {
            selectedParent = index + 1;
            selectedParentCumulative = cumulative.toFixed(4);
        }
    });
    html += `</tbody></table>`;

    if (finalCumulative >= 0.9999 && finalCumulative <= 1.0001) {
        html = `<div class="math-step-box" style="border-color: #27ae60; color: #27ae60; font-weight: bold; margin-bottom: 20px;">✅ Kumulatif valid (berakhir di 1.0000)</div>` + html;
    } else {
        html = `<div class="math-step-box" style="border-color: #c0392b; color: #c0392b; font-weight: bold; margin-bottom: 20px;">❌ Error: Kumulatif tidak berakhir di 1.0000. Cek kembali input di Modul 4.</div>` + html;
    }

    if (r !== null) {
        if (selectedParent !== null) {
            html += `<div class="math-step-box" style="margin-top: 20px; border-left-color: #e67e22;">`;
            html += `<h3>🎯 Parent Terpilih: Individu ${selectedParent}</h3>`;
            html += `<p>Alasan: ${selectedParentCumulative} adalah nilai kumulatif pertama yang lebih besar atau sama dengan (&ge;) ${r}.</p>`;
            html += `</div>`;
        } else {
            html += `<div class="math-step-box" style="margin-top: 20px; border-left-color: #c0392b;">`;
            html += `<h3>❌ Tidak ada Parent terpilih</h3>`;
            html += `<p>Alasan: Tidak ada nilai kumulatif yang lebih besar atau sama dengan (&ge;) ${r}.</p>`;
            html += `</div>`;
        }
    }
    refs.m5Steps.innerHTML = html;
}