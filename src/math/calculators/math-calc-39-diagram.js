import { fmtNum } from "./math-calc-39-engine.js";

function makeEl(tag, className, textContent) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (textContent !== undefined) el.textContent = textContent;
    return el;
}

function renderTex(tex, el, displayMode = false) {
    if (typeof katex !== "undefined") {
        katex.render(tex, el, { throwOnError: false, trust: true, displayMode });
    } else {
        el.textContent = tex;
    }
}

export function createLrBraceSvg(width) {
    const w = Math.max(width, 64);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "chromo-brace-svg");
    svg.setAttribute("viewBox", `0 0 ${w} 18`);
    svg.style.width = `${w}px`;
    svg.style.height = "18px";
    const mid = w / 2;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const d = `M 0 0 Q 0 8 10 8 L ${mid - 12} 8 Q ${mid} 8 ${mid} 16 Q ${mid} 8 ${mid + 12} 8 L ${w - 10} 8 Q ${w} 8 ${w} 0`;
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#ffffff");
    path.setAttribute("stroke-width", "1.5");
    svg.appendChild(path);
    return svg;
}

function makeArrowCells(n) {
    const group = makeEl("div", "lr-arrow-cells");
    for (let i = 0; i < n; i++) {
        group.appendChild(makeEl("div", "lr-arrow-cell", "↓"));
    }
    return group;
}

function makeArrowRow(n) {
    const row = makeEl("div", "lr-arrow-row");
    row.appendChild(makeEl("div", "lr-arrow-label-spacer"));
    row.appendChild(makeArrowCells(n));
    return row;
}

function makeMathRowLabel(prefix, mathTex) {
    const label = makeEl("div", "lr-row-label");
    label.appendChild(makeEl("span", "", prefix + " "));
    const mathSpan = makeEl("span", "lr-row-label-math");
    renderTex(mathTex, mathSpan, false);
    label.appendChild(mathSpan);
    label.appendChild(makeEl("span", "", ":"));
    return label;
}

function makeCellRow(label, cells, extraEl = null) {
    const row = makeEl("div", "lr-cell-row");
    if (typeof label === "string") {
        row.appendChild(makeEl("div", "lr-row-label", label));
    } else {
        row.appendChild(label);
    }
    const group = makeEl("div", "lr-cells-group");
    cells.forEach((c) => group.appendChild(c));
    row.appendChild(group);
    if (extraEl) row.appendChild(extraEl);
    return row;
}

function makeTexCell(tex, extraClass = "") {
    const strLen = tex.replace(/\\[a-zA-Z]+\{[^}]*\}|\{|\}|\\/g, "").length;
    let fit = "";
    if (strLen > 8) fit = " lr-cell-fit-xs";
    else if (strLen > 6) fit = " lr-cell-fit-sm";
    else if (strLen > 4) fit = " lr-cell-fit-md";
    const cell = makeEl("div", `lr-cell${fit}${extraClass ? " " + extraClass : ""}`);
    renderTex(tex, cell, false);
    return cell;
}

function bindGlow(sources, getTargets, glowClass) {
    sources.forEach((src) => {
        if (!src) return;
        src.addEventListener("mouseenter", () => {
            getTargets().forEach((el) => el.classList.add(glowClass));
        });
        src.addEventListener("mouseleave", () => {
            getTargets().forEach((el) => el.classList.remove(glowClass));
        });
    });
}

export function bindLrTokenHover() {
    const tokenGroups = [
        ["w0", "lr-glow-w0"],
        ["w1", "lr-glow-w1"],
        ["y", "lr-glow-y"],
        ["err", "lr-glow-err"]
    ];
    for (const [key, glowCls] of tokenGroups) {
        const cls = `lr-tok-${key}`;
        const list = document.querySelectorAll(`.${cls}`);
        bindGlow(list, () => document.querySelectorAll(`.${cls}`), glowCls);
    }
    const inQx = document.getElementById("math39-in-qx");
    if (inQx) {
        bindGlow([inQx], () => document.querySelectorAll(".lr-tok-y, .lr-tok-w1"), "lr-glow-y");
    }
}

export function renderTopFormula39() {
    if (typeof katex === "undefined") return;
    const el = document.getElementById("math-calc-formula-display-39");
    if (!el) return;
    el.textContent = "";
    const tex = "\\htmlClass{lr-tok-y}{\\hat{y}} = \\htmlClass{lr-tok-w0}{w_0} + \\htmlClass{lr-tok-w1}{w_1}\\,x";
    katex.render(tex, el, { throwOnError: false, trust: true, displayMode: false });
}

export function renderLRInputsRow(inputsEl, points, meanX, meanY, handlers) {
    if (!inputsEl) return;
    inputsEl.textContent = "";
    const n = points.length;

    const tagCells = points.map((pt, idx) => {
        const box = makeEl("div", "lr-cell lr-cell-head");
        const lbl = makeEl("span", "lr-head-label", pt.label);
        box.appendChild(lbl);
        if (n > 2) {
            const del = makeEl("button", "lr-cell-del", "×");
            del.type = "button";
            del.setAttribute("aria-label", `Hapus titik ${pt.label}`);
            del.addEventListener("click", () => handlers.onRemove(idx));
            box.appendChild(del);
        }
        return box;
    });

    if (n < 12) {
        const addBtn = makeEl("button", "lr-cell lr-cell-add", "+");
        addBtn.type = "button";
        addBtn.setAttribute("aria-label", "Tambah titik data baru");
        addBtn.addEventListener("click", handlers.onAdd);
        tagCells.push(addBtn);
    }
    inputsEl.appendChild(makeCellRow("titik data:", tagCells));

    const xCells = points.map((pt, idx) => {
        const inp = makeEl("input", "lr-cell lr-cell-input lr-cell-x");
        inp.type = "number";
        inp.step = "any";
        inp.inputMode = "decimal";
        inp.value = String(pt.x);
        inp.setAttribute("aria-label", `x titik ${pt.label}`);
        inp.dataset.idx = String(idx);
        inp.dataset.axis = "x";
        inp.addEventListener("input", () => {
            const v = parseFloat(inp.value);
            if (Number.isFinite(v)) handlers.onEdit(idx, "x", v);
        });
        inp.addEventListener("blur", () => {
            const v = parseFloat(inp.value);
            if (!Number.isFinite(v)) inp.value = String(points[idx].x);
        });
        return inp;
    });

    const meanXTag = makeEl("div", "lr-n-tag");
    if (Number.isFinite(meanX)) {
        renderTex(`(\\bar{x} = \\htmlClass{lr-tok-w1}{${fmtNum(meanX, 3)}})`, meanXTag, false);
    }
    inputsEl.appendChild(makeCellRow(makeMathRowLabel("input", "(x_i)"), xCells, meanXTag));

    const yCells = points.map((pt, idx) => {
        const inp = makeEl("input", "lr-cell lr-cell-input lr-cell-y");
        inp.type = "number";
        inp.step = "any";
        inp.inputMode = "decimal";
        inp.value = String(pt.y);
        inp.setAttribute("aria-label", `y titik ${pt.label}`);
        inp.dataset.idx = String(idx);
        inp.dataset.axis = "y";
        inp.addEventListener("input", () => {
            const v = parseFloat(inp.value);
            if (Number.isFinite(v)) handlers.onEdit(idx, "y", v);
        });
        inp.addEventListener("blur", () => {
            const v = parseFloat(inp.value);
            if (!Number.isFinite(v)) inp.value = String(points[idx].y);
        });
        return inp;
    });

    const meanYTag = makeEl("div", "lr-n-tag");
    if (Number.isFinite(meanY)) {
        renderTex(`(\\bar{y} = \\htmlClass{lr-tok-w0}{${fmtNum(meanY, 3)}})`, meanYTag, false);
    }
    inputsEl.appendChild(makeCellRow(makeMathRowLabel("target", "(y_i)"), yCells, meanYTag));
}

export function updateLRMeansTags(inputsEl, meanX, meanY) {
    if (!inputsEl) return;
    const tags = inputsEl.querySelectorAll(".lr-n-tag");
    if (tags[0] && Number.isFinite(meanX)) {
        renderTex(`(\\bar{x} = \\htmlClass{lr-tok-w1}{${fmtNum(meanX, 3)}})`, tags[0], false);
    }
    if (tags[1] && Number.isFinite(meanY)) {
        renderTex(`(\\bar{y} = \\htmlClass{lr-tok-w0}{${fmtNum(meanY, 3)}})`, tags[1], false);
    }
}

function appendBraceSummary(container, termsTex, resultTex, labelPrefix, blockWidth) {
    const sumRow = makeEl("div", "lr-cell-row");
    sumRow.appendChild(makeEl("div", "lr-row-label", labelPrefix));
    const sumContent = makeEl("div", "lr-sum-content");
    renderTex(termsTex, sumContent, false);
    sumContent.style.width = `${blockWidth}px`;
    sumRow.appendChild(sumContent);
    container.appendChild(sumRow);

    const braceRow = makeEl("div", "lr-brace-row");
    braceRow.appendChild(makeEl("div", "lr-arrow-label-spacer"));
    const braceBox = makeEl("div", "lr-brace-content");
    braceBox.style.width = `${blockWidth}px`;
    braceBox.appendChild(createLrBraceSvg(blockWidth));
    braceRow.appendChild(braceBox);
    container.appendChild(braceRow);

    const finalRow = makeEl("div", "lr-cell-row");
    finalRow.appendChild(makeEl("div", "lr-row-label", ""));
    const finalContent = makeEl("div", "lr-final-content");
    finalContent.style.width = `${blockWidth}px`;
    renderTex(resultTex, finalContent, false);
    finalRow.appendChild(finalContent);
    container.appendChild(finalRow);
}

function formatSignedTerms(nums) {
    return nums.map((val, i) => {
        const s = fmtNum(val, 2);
        if (i === 0) return s;
        return val < 0 ? `- ${fmtNum(Math.abs(val), 2)}` : `+ ${s}`;
    }).join(" ");
}

export function renderLRDerivedRows(derivedEl, mode, ols, gdState) {
    if (!derivedEl) return;
    derivedEl.textContent = "";

    const pts = ols?.points || [];
    const n = pts.length;
    if (n < 2) return;
    const blockWidth = Math.max(n * 72 - 8, 120);

    if (mode === "gd" && gdState) {
        derivedEl.appendChild(makeArrowRow(n));
        const predCells = pts.map((p) => makeTexCell(fmtNum(gdState.w0 + gdState.w1 * p.x, 2)));
        derivedEl.appendChild(makeCellRow(makeMathRowLabel("prediksi", "(\\hat{y}_i)"), predCells));

        derivedEl.appendChild(makeArrowRow(n));
        const errCells = gdState.errors.map((e) => {
            const sign = e >= 0 ? "+" : "";
            return makeTexCell(`\\htmlClass{lr-tok-err}{${sign}${fmtNum(e, 2)}}`);
        });
        derivedEl.appendChild(makeCellRow(makeMathRowLabel("galat", "(\\hat{y}_i - y_i)"), errCells));

        derivedEl.appendChild(makeArrowRow(n));
        const sqVals = gdState.errors.map((e) => e * e);
        const sqCells = sqVals.map((sq) => makeTexCell(fmtNum(sq, 2)));
        derivedEl.appendChild(makeCellRow(makeMathRowLabel("kuadrat galat", "(\\hat{y}_i - y_i)^2"), sqCells));

        appendBraceSummary(
            derivedEl,
            formatSignedTerms(sqVals),
            `\\text{MSE} = \\frac{\\text{SSE}}{${n}} = \\htmlClass{lr-tok-err}{${fmtNum(gdState.mse, 4)}}`,
            "penjumlahan e²:",
            blockWidth
        );
        return;
    }

    if (!ols || !ols.valid) return;

    derivedEl.appendChild(makeArrowRow(n));

    const dxCells = ols.rows.map((r) => makeTexCell((r.dx >= 0 ? "+" : "") + fmtNum(r.dx, 2)));
    derivedEl.appendChild(makeCellRow(makeMathRowLabel("deviasi x", "(x_i - \\bar{x})"), dxCells));

    const dyCells = ols.rows.map((r) => makeTexCell((r.dy >= 0 ? "+" : "") + fmtNum(r.dy, 2)));
    derivedEl.appendChild(makeCellRow(makeMathRowLabel("deviasi y", "(y_i - \\bar{y})"), dyCells));

    derivedEl.appendChild(makeArrowRow(n));

    const dxdyVals = ols.rows.map((r) => r.dxdy);
    const dxdyCells = dxdyVals.map((v) => makeTexCell(fmtNum(v, 2)));
    derivedEl.appendChild(makeCellRow(makeMathRowLabel("hasil kali", "dx \\cdot dy"), dxdyCells));

    appendBraceSummary(
        derivedEl,
        formatSignedTerms(dxdyVals),
        `S_{xy} = \\htmlClass{lr-tok-w0}{${fmtNum(ols.sxy, 3)}}`,
        "jumlah dx·dy:",
        blockWidth
    );

    const dx2Vals = ols.rows.map((r) => r.dx2);
    const dx2Cells = dx2Vals.map((v) => makeTexCell(fmtNum(v, 2)));
    derivedEl.appendChild(makeCellRow(makeMathRowLabel("kuadrat dx", "dx^2"), dx2Cells));

    appendBraceSummary(
        derivedEl,
        formatSignedTerms(dx2Vals),
        `S_{xx} = \\htmlClass{lr-tok-w1}{${fmtNum(ols.sxx, 3)}}`,
        "jumlah dx²:",
        blockWidth
    );

    derivedEl.appendChild(makeArrowRow(n));

    const resCells = ols.predRows.map((r) => {
        const s = (r.residual >= 0 ? "+" : "") + fmtNum(r.residual, 2);
        return makeTexCell(`\\htmlClass{lr-tok-err}{${s}}`);
    });
    const resSumTag = makeEl("div", "lr-n-tag");
    renderTex(`(\\sum e = \\htmlClass{lr-tok-err}{${fmtNum(ols.sumResidual, 2)}})`, resSumTag, false);
    derivedEl.appendChild(makeCellRow(makeMathRowLabel("residual", "(y_i - \\hat{y}_i)"), resCells, resSumTag));

    const sqVals = ols.predRows.map((r) => r.sqErr);
    const sqCells = sqVals.map((v) => makeTexCell(fmtNum(v, 2)));
    derivedEl.appendChild(makeCellRow(makeMathRowLabel("galat kuadrat", "(y_i - \\hat{y}_i)^2"), sqCells));

    appendBraceSummary(
        derivedEl,
        formatSignedTerms(sqVals),
        `\\text{SSE} = ${fmtNum(ols.sse, 3)} \\;\\cdot\\; \\text{MSE} = ${fmtNum(ols.mse, 3)} \\;\\cdot\\; \\text{MAE} = ${fmtNum(ols.mae, 3)} \\;\\cdot\\; R^2 = ${fmtNum(ols.r2, 4)}`,
        "jumlah galat²:",
        blockWidth
    );
}
