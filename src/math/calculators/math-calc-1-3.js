import { refs } from "../../core/dom-refs.js";
import { drawFitnessCurve, clearVisual3 } from "../visuals/math-visual-2-3.js";
import { formatMax3 } from "../math-format.js";
export { calculateMath } from "./math-calc-1.js";
export { calculateMath2 } from "./math-calc-2.js";

export function calculateMath3() {
    if (!refs.m3InH || typeof katex === "undefined") return;
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
    const addStep = (tex, boxClass = "math-step") => {
        const div = document.createElement("div");
        div.className = boxClass;
        katex.render(tex, div, { throwOnError: false, displayMode: true });
        refs.m3Steps.appendChild(div);
    };
    addStep(step1);
    if (sum !== h && sum !== a) {
        addStep(step2);
    }
    addStep(step3, "math-step-box");
    drawFitnessCurve(h, a);
}
