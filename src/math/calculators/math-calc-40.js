import { refs } from "../../core/dom-refs.js";
import { DEFAULT_LOGREG_POINTS, computeLogisticRegression } from "./math-calc-40-engine.js";
import { renderTopFormula40, renderLogRegSteps, drawLogRegArrows } from "./math-calc-40-cards.js";
import { makeEl } from "./math-calc-39-cards.js";

let rowEntries = [];
let resizeAttached = false;

function createInitialEntries() {
    const entries = DEFAULT_LOGREG_POINTS.map((p) => ({
        xStr: String(p.x),
        yStr: String(p.y)
    }));
    entries.push({ xStr: "", yStr: "" });
    return entries;
}

function relabelRows(tbody) {
    Array.from(tbody.children).forEach((tr, idx) => {
        const lbl = String(idx + 1);
        const td = tr.querySelector(".lr-tab-label");
        if (td) td.textContent = lbl;
        const inputs = tr.querySelectorAll(".lr-cell-input");
        if (inputs[0]) inputs[0].setAttribute("aria-label", `x ${lbl}`);
        if (inputs[1]) inputs[1].setAttribute("aria-label", `y ${lbl}`);
    });
}

function buildRowElement(entry, idx, tbody) {
    const tr = makeEl("tr");
    const numLbl = String(idx + 1);
    const tdIdx = makeEl("td", "lr-tab-label", numLbl);

    const tdX = makeEl("td", "lr-tab-input-cell");
    const inX = makeEl("input", "lr-cell-input");
    inX.type = "number";
    inX.step = "any";
    inX.inputMode = "decimal";
    inX.placeholder = "...";
    inX.value = entry.xStr;
    inX.setAttribute("aria-label", `x ${numLbl}`);

    const tdY = makeEl("td", "lr-tab-input-cell");
    const inY = makeEl("input", "lr-cell-input");
    inY.type = "number";
    inY.step = "1";
    inY.min = "0";
    inY.max = "1";
    inY.inputMode = "numeric";
    inY.placeholder = "...";
    inY.value = entry.yStr;
    inY.setAttribute("aria-label", `y ${numLbl}`);

    const onRowInput = (axis, rawVal) => {
        const curIdx = Array.prototype.indexOf.call(tbody.children, tr);
        if (curIdx < 0) return;
        rowEntries[curIdx][axis] = rawVal;

        const lastIdx = rowEntries.length - 1;
        const last = rowEntries[lastIdx];
        if (last.xStr.trim() !== "" || last.yStr.trim() !== "") {
            const newEntry = { xStr: "", yStr: "" };
            rowEntries.push(newEntry);
            tbody.appendChild(buildRowElement(newEntry, rowEntries.length - 1, tbody));
        }

        if (curIdx < rowEntries.length - 1 && inX.value.trim() === "" && inY.value.trim() === "") {
            rowEntries.splice(curIdx, 1);
            tbody.removeChild(tr);
            relabelRows(tbody);
        }

        calculateMath40();
    };

    inX.addEventListener("input", () => onRowInput("xStr", inX.value));
    inY.addEventListener("input", () => onRowInput("yStr", inY.value));

    tdX.appendChild(inX);
    tdY.appendChild(inY);
    tr.append(tdIdx, tdX, tdY);
    return tr;
}

function renderTabulateBody() {
    const tbody = refs.m40Rows || document.getElementById("math40-tabulate-body");
    if (!tbody) return;
    tbody.textContent = "";
    rowEntries.forEach((entry, idx) => {
        tbody.appendChild(buildRowElement(entry, idx, tbody));
    });
}

function readNumInput(id, fallback) {
    const el = document.getElementById(id);
    if (!el) return fallback;
    const v = parseFloat(el.value);
    return Number.isFinite(v) ? v : fallback;
}

export function initMath40() {
    const root = document.getElementById("math-calc-form-40");
    if (root && root.dataset.lrBound !== "1") {
        root.dataset.lrBound = "1";
        rowEntries = createInitialEntries();
        renderTabulateBody();
        ["math40-in-w0", "math40-in-w1", "math40-in-lr", "math40-in-th"].forEach((id) => {
            const input = document.getElementById(id);
            if (input) input.addEventListener("input", calculateMath40);
        });
        if (!resizeAttached && typeof window !== "undefined") {
            resizeAttached = true;
            window.addEventListener("resize", drawLogRegArrows);
        }
    }

    renderTopFormula40();
    calculateMath40();
}

export function calculateMath40() {
    const rawPoints = [];
    for (let i = 0; i < rowEntries.length; i++) {
        const xStr = String(rowEntries[i].xStr ?? "").trim();
        const yStr = String(rowEntries[i].yStr ?? "").trim();
        if (xStr === "" || yStr === "") continue;
        const x = parseFloat(xStr);
        const y = parseFloat(yStr);
        if (Number.isFinite(x) && Number.isFinite(y)) {
            rawPoints.push({ x, y });
        }
    }
    const w0 = readNumInput("math40-in-w0", 0);
    const w1 = readNumInput("math40-in-w1", 0);
    const lr = readNumInput("math40-in-lr", 1);
    const th = readNumInput("math40-in-th", 0.5);
    const res = computeLogisticRegression(rawPoints, w0, w1, lr, th, 5);
    renderLogRegSteps(res);
}
