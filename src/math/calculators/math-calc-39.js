import { refs } from "../../core/dom-refs.js";
import { DEFAULT_LR_POINTS, computeLinearRegressionOLS } from "./math-calc-39-engine.js";
import { renderTopFormula39, renderLRSteps } from "./math-calc-39-cards.js";

let currentPoints = DEFAULT_LR_POINTS.map((p) => ({ ...p }));

function defaultLabelAt(i) {
    const code = 97 + (i % 26);
    const suffix = i >= 26 ? String(Math.floor(i / 26)) : "";
    return String.fromCharCode(code) + suffix;
}

function makeEl(tag, className, textContent) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (textContent !== undefined) el.textContent = textContent;
    return el;
}

function relabelPoints() {
    currentPoints = currentPoints.map((pt, idx) => ({
        ...pt,
        label: defaultLabelAt(idx)
    }));
}

function renderTabulateRows() {
    const tbody = refs.m39Rows || document.getElementById("math39-tabulate-body");
    if (!tbody) return;
    tbody.textContent = "";

    currentPoints.forEach((pt, idx) => {
        const tr = makeEl("tr");
        const tdLbl = makeEl("td", "lr-tab-label", pt.label);

        const tdX = makeEl("td", "lr-tab-input-cell");
        const inX = makeEl("input", "lr-cell-input");
        inX.type = "number";
        inX.step = "any";
        inX.inputMode = "decimal";
        inX.value = String(pt.x);
        inX.setAttribute("aria-label", `Nilai x untuk data ${pt.label}`);
        inX.addEventListener("input", () => {
            const v = parseFloat(inX.value);
            if (Number.isFinite(v)) {
                currentPoints[idx].x = v;
                calculateMath39();
            } else if (inX.value.trim() === "") {
                currentPoints[idx].x = NaN;
                calculateMath39();
            }
        });
        tdX.appendChild(inX);

        const tdY = makeEl("td", "lr-tab-input-cell");
        const inY = makeEl("input", "lr-cell-input");
        inY.type = "number";
        inY.step = "any";
        inY.inputMode = "decimal";
        inY.value = String(pt.y);
        inY.setAttribute("aria-label", `Nilai y untuk data ${pt.label}`);
        inY.addEventListener("input", () => {
            const v = parseFloat(inY.value);
            if (Number.isFinite(v)) {
                currentPoints[idx].y = v;
                calculateMath39();
            } else if (inY.value.trim() === "") {
                currentPoints[idx].y = NaN;
                calculateMath39();
            }
        });
        tdY.appendChild(inY);

        const tdAct = makeEl("td", "lr-tab-act");
        const delBtn = makeEl("button", "lr-row-del", "×");
        delBtn.type = "button";
        delBtn.disabled = currentPoints.length <= 2;
        delBtn.setAttribute("aria-label", `Hapus data ${pt.label}`);
        delBtn.addEventListener("click", () => {
            if (currentPoints.length <= 2) return;
            currentPoints.splice(idx, 1);
            relabelPoints();
            renderTabulateRows();
            calculateMath39();
        });
        tdAct.appendChild(delBtn);

        tr.append(tdLbl, tdX, tdY, tdAct);
        tbody.appendChild(tr);
    });
}

export function initMath39() {
    const root = document.getElementById("math-calc-form-39");
    if (root && root.dataset.lrBound !== "1") {
        root.dataset.lrBound = "1";
        currentPoints = DEFAULT_LR_POINTS.map((p) => ({ ...p }));

        const btnAdd = document.getElementById("math39-btn-add");
        if (btnAdd) {
            btnAdd.addEventListener("click", () => {
                if (currentPoints.length >= 20) return;
                const last = currentPoints[currentPoints.length - 1];
                const nextX = Number.isFinite(last?.x) ? Math.round((last.x + 2) * 100) / 100 : 0;
                const nextY = Number.isFinite(last?.y) ? Math.round((last.y + 5) * 100) / 100 : 0;
                currentPoints.push({
                    label: defaultLabelAt(currentPoints.length),
                    x: nextX,
                    y: nextY
                });
                renderTabulateRows();
                calculateMath39();
            });
        }

        const btnReset = document.getElementById("math39-btn-reset");
        if (btnReset) {
            btnReset.addEventListener("click", () => {
                currentPoints = DEFAULT_LR_POINTS.map((p) => ({ ...p }));
                renderTabulateRows();
                calculateMath39();
            });
        }

        renderTabulateRows();
    }

    renderTopFormula39();
    calculateMath39();
}

export function calculateMath39() {
    const res = computeLinearRegressionOLS(currentPoints);
    renderLRSteps(res);
}
