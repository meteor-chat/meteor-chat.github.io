import { refs } from "../../core/dom-refs.js";

export function calculateMath8() {
    if (!refs.m8Steps) return;
    refs.m8Steps.textContent = "";
    const strA = refs.m8InA ? refs.m8InA.value.trim() : "";
    const strB = refs.m8InB ? refs.m8InB.value.trim() : "";
    if (!strA || !strB) return;
    const parseVec = (str) => {
        const parts = str.split(",").map(s => parseFloat(s.trim()));
        return parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) ? parts : null;
    };
    const vecA = parseVec(strA);
    const vecB = parseVec(strB);
    const errDiv = document.createElement("div");
    errDiv.className = "math-step-box math-step-error";
    if (!vecA || !vecB) {
        errDiv.textContent = "\u274C Error: Format tidak valid! Gunakan format \"f1,f2\" contoh: 3,45";
        refs.m8Steps.appendChild(errDiv);
        return;
    }
    const stepDiv = document.createElement("div");
    stepDiv.className = "math-step-box";
    const pTest = document.createElement("p");
    pTest.style.fontFamily = "monospace";
    pTest.style.fontSize = "1.1em";
    pTest.style.marginBottom = "15px";
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
    const title = document.createElement("h3");
    title.style.marginBottom = "10px";
    title.textContent = "\u2696\uFE0F Uji Pareto Dominance (Minimisasi)";
    stepDiv.appendChild(title);
    const testStr = `Test A \u2264 B: ${vecA[0]} \u2264 ${vecB[0]} \u2794 ${aLTE1 ? "True" : "False"}, ${vecA[1]} \u2264 ${vecB[1]} \u2794 ${aLTE2 ? "True" : "False"}`;
    pTest.innerHTML = testStr + "<br>" + `Test B \u2264 A: ${vecB[0]} \u2264 ${vecA[0]} \u2794 ${bLTE1 ? "True" : "False"}, ${vecB[1]} \u2264 ${vecA[1]} \u2794 ${bLTE2 ? "True" : "False"}`;
    stepDiv.appendChild(pTest);
    const resDiv = document.createElement("div");
    resDiv.style.fontWeight = "600";
    resDiv.style.fontSize = "1.2em";
    resDiv.style.padding = "10px";
    resDiv.style.borderRadius = "8px";
    resDiv.style.marginTop = "15px";
    if (identical) {
        resDiv.style.backgroundColor = "#4b5563";
        resDiv.style.color = "white";
        resDiv.textContent = "Result: Neither dominates (Identical)";
    } else if (aDominatesB) {
        resDiv.style.backgroundColor = "#059669";
        resDiv.style.color = "white";
        resDiv.textContent = "Result: A dominates B";
    } else if (bDominatesA) {
        resDiv.style.backgroundColor = "#2563eb";
        resDiv.style.color = "white";
        resDiv.textContent = "Result: B dominates A";
    } else {
        resDiv.style.backgroundColor = "#dc2626";
        resDiv.style.color = "white";
        resDiv.textContent = "Result: Neither dominates (Incomparable)";
    }
    stepDiv.appendChild(resDiv);
    refs.m8Steps.appendChild(stepDiv);
}
