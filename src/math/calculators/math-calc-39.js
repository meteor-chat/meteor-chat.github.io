import { refs } from "../../core/dom-refs.js";
import { DEFAULT_LR_POINTS, computeLinearRegressionOLS } from "./math-calc-39-engine.js";
import { renderTopFormula39, renderLRSteps, drawAfterArrows } from "./math-calc-39-cards.js";

let rowEntries = [];
let resizeAttached = false;

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

function createInitialEntries() {
    const entries = DEFAULT_LR_POINTS.map((p) => ({
        xStr: String(p.x),
        yStr: String(p.y)
    }));
    entries.push({ xStr: "", yStr: "" });
    return entries;
}

function buildRowElement(entry, idx, tbody) {
    const tr = makeEl("tr");
    const tdLbl = makeEl("td", "lr-tab-label", defaultLabelAt(idx));

    const tdX = makeEl("td", "lr-tab-input-cell");
    const inX = makeEl("input", "lr-cell-input");
    inX.type = "number";
    inX.step = "any";
    inX.inputMode = "decimal";
    inX.placeholder = "...";
    inX.value = entry.xStr;
    inX.setAttribute("aria-label", `x ${defaultLabelAt(idx)}`);

    const tdY = makeEl("td", "lr-tab-input-cell");
    const inY = makeEl("input", "lr-cell-input");
    inY.type = "number";
    inY.step = "any";
    inY.inputMode = "decimal";
    inY.placeholder = "...";
    inY.value = entry.yStr;
    inY.setAttribute("aria-label", `y ${defaultLabelAt(idx)}`);

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

        calculateMath39();
    };

    inX.addEventListener("input", () => onRowInput("xStr", inX.value));
    inY.addEventListener("input", () => onRowInput("yStr", inY.value));

    tdX.appendChild(inX);
    tdY.appendChild(inY);
    tr.append(tdLbl, tdX, tdY);
    return tr;
}

function relabelRows(tbody) {
    Array.from(tbody.children).forEach((tr, idx) => {
        const lbl = defaultLabelAt(idx);
        const td = tr.querySelector(".lr-tab-label");
        if (td) td.textContent = lbl;
        const inputs = tr.querySelectorAll(".lr-cell-input");
        if (inputs[0]) inputs[0].setAttribute("aria-label", `x ${lbl}`);
        if (inputs[1]) inputs[1].setAttribute("aria-label", `y ${lbl}`);
    });
}

function renderTabulateBody() {
    const tbody = refs.m39Rows || document.getElementById("math39-tabulate-body");
    if (!tbody) return;
    tbody.textContent = "";
    rowEntries.forEach((entry, idx) => {
        tbody.appendChild(buildRowElement(entry, idx, tbody));
    });
}

export function initMath39() {
    const root = document.getElementById("math-calc-form-39");
    if (root && root.dataset.lrBound !== "1") {
        root.dataset.lrBound = "1";
        rowEntries = createInitialEntries();
        renderTabulateBody();
        const toggleBtn = document.getElementById("math39-btn-explain-toggle");
        if (toggleBtn) {
            toggleBtn.setAttribute("aria-expanded", "false");
            toggleBtn.addEventListener("click", () => {
                const open = root.classList.toggle("lr-explain-open");
                toggleBtn.setAttribute("aria-expanded", String(open));
                toggleBtn.classList.toggle("is-active", open);
                toggleBtn.textContent = open ? "Sembunyikan Penjelasan" : "Tampilkan Penjelasan";
                if (typeof requestAnimationFrame !== "undefined") {
                    requestAnimationFrame(drawAfterArrows);
                } else {
                    drawAfterArrows();
                }
            });
        }
        if (!resizeAttached && typeof window !== "undefined") {
            resizeAttached = true;
            window.addEventListener("resize", drawAfterArrows);
        }
    }

    renderTopFormula39();
    calculateMath39();
}

export function calculateMath39() {
    const pts = [];
    for (let i = 0; i < rowEntries.length; i++) {
        const x = parseFloat(rowEntries[i].xStr);
        const y = parseFloat(rowEntries[i].yStr);
        if (Number.isFinite(x) && Number.isFinite(y)) {
            pts.push({ label: defaultLabelAt(i), x, y });
        }
    }
    const res = computeLinearRegressionOLS(pts);
    renderLRSteps(res);
}
