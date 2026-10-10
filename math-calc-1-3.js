import { refs } from "./dom-refs.js";
import { drawObjectiveCurve, drawFitnessCurve, clearVisual2, clearVisual3 } from "./math-visual-2-3.js";
export function calculateMath() {
    if (typeof katex === 'undefined') return;
    refs.mathSteps.textContent = '';
    const nStr = refs.inN.value.trim();
    if (!nStr) return;
    const n = parseInt(nStr, 10);
    if (isNaN(n) || n < 1) {
        refs.mathSteps.innerHTML = '<div class="math-step-box math-step-error">Masukkan nilai n (bilangan bulat positif).</div>';
        return;
    }
    const kromosom = refs.inKromosom.value.trim();
    if (kromosom === '') return;
    if (!/^[01]+$/.test(kromosom)) {
        refs.mathSteps.innerHTML = '<div class="math-step-box math-step-error">Kromosom harus biner (0/1).</div>';
        return;
    }
    if (kromosom.length !== n) {
        refs.mathSteps.innerHTML = `<div class="math-step-box math-step-error">Panjang kromosom harus sama dengan n (${n} bit).</div>`;
        return;
    }
    const xMin = parseFloat(refs.inXmin.value || "-2");
    const xMax = parseFloat(refs.inXmax.value || "3");
    if (isNaN(xMin) || isNaN(xMax)) return;

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
    addStep(step1, 'math-step-box math-step-valid');
    addStep(step2, 'math-step-box math-step-valid');
    if (den === 0) {
        addStep(`x = \\text{Error: Division by zero}`, 'math-step-box math-step-error');
    } else {
        const res = xMin + (num / den) * d;
        addStep(`x \\approx ${res.toFixed(3)}`, 'math-step-box math-step-valid math-result-highlight');
    }
}

export function calculateMath2() {
    if(!refs.m2InX1 || typeof katex === 'undefined') return;
    const x1Str = refs.m2InX1.value || "2";
    const x2Str = refs.m2InX2.value || "3";
    const x1 = parseFloat(x1Str);
    const x2 = parseFloat(x2Str);
    refs.m2Table.textContent = "";
    clearVisual2();
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
    drawObjectiveCurve(x1, x2);
}
export function calculateMath3() {
    if(!refs.m3InH || typeof katex === 'undefined') return;
    const hStr = refs.m3InH.value || "5";
    const aStr = refs.m3InA.value || "0.1";
    const h = parseFloat(hStr);
    const a = parseFloat(aStr);
    refs.m3Steps.textContent = "";
    clearVisual3();
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
    drawFitnessCurve(h, a);
}