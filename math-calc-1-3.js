import { refs } from "./dom-refs.js";
export function calculateMath() {
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
export function calculateMath2() {
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
export function calculateMath3() {
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