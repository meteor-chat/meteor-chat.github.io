import { refs } from "../../core/dom-refs.js";
import { drawObjectiveCurve, drawFitnessCurve, clearVisual2, clearVisual3 } from "../visuals/math-visual-2-3.js";
import { formatMax3 } from "../math-format.js";
export { calculateMath } from "./math-calc-1.js";

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
    const x1Fmt = x1 < 0 ? `(${formatMax3(x1)})` : formatMax3(x1);
    const x2Fmt = x2 < 0 ? `(${formatMax3(x2)})` : formatMax3(x2);
    const step1 = `h = ${x1Fmt}^3 + \\frac{1}{3}${x2Fmt}^2`;
    const x1Cubed = Math.pow(x1, 3);
    const x2Sq = Math.pow(x2, 2);
    let step2 = "";
    if (Number.isInteger(x2Sq) && x2Sq !== 0) {
        step2 = `h = ${formatMax3(x1Cubed)} + \\frac{${x2Sq}}{3}`;
    } else {
        const x2Term = x2Sq / 3;
        step2 = `h = ${formatMax3(x1Cubed)} + ${formatMax3(x2Term)}`;
    }
    const finalVal = x1Cubed + (x2Sq / 3);
    const step3 = `h \\approx ${formatMax3(finalVal)}`;
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
    const hFmt = h < 0 ? `(${formatMax3(h)})` : formatMax3(h);
    const aFmt = a < 0 ? `(${formatMax3(a)})` : formatMax3(a);
    const step1 = `Fitness = \\frac{1}{${hFmt} + ${aFmt}}`;
    const sum = h + a;
    const step2 = `Fitness = \\frac{1}{${formatMax3(sum)}}`;
    const finalVal = 1 / sum;
    const step3 = `Fitness \\approx ${formatMax3(finalVal)}`;
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