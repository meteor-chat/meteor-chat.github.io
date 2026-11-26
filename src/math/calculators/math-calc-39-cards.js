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

function makeArrow() {
    return makeEl("div", "lr-step-arrow", "↓");
}

function makeBlock(titleText) {
    const box = makeEl("section", "lr-block");
    const head = makeEl("div", "lr-block-head", titleText);
    box.appendChild(head);
    return box;
}

function makeTable(headers, bodyRows, footerRow = null) {
    const wrap = makeEl("div", "lr-table-scroll");
    const table = makeEl("table", "lr-sheet-table");

    const thead = makeEl("thead");
    const hr = makeEl("tr");
    headers.forEach((h) => {
        const th = makeEl("th", h.cls || "", h.label);
        hr.appendChild(th);
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    const tbody = makeEl("tbody");
    bodyRows.forEach((cells) => {
        const tr = makeEl("tr");
        cells.forEach((c) => {
            const td = makeEl("td", c.cls || "", c.text);
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    if (footerRow) {
        const tfoot = makeEl("tfoot");
        const fr = makeEl("tr");
        footerRow.forEach((c) => {
            const td = makeEl("td", c.cls || "", c.text);
            fr.appendChild(td);
        });
        tfoot.appendChild(fr);
        table.appendChild(tfoot);
    }

    wrap.appendChild(table);
    return wrap;
}

export function renderTopFormula39() {
    const el = document.getElementById("math-calc-formula-display-39");
    if (!el) return;
    el.textContent = "";
    const tex = "\\htmlClass{lr-tok-y}{\\hat{y}} = \\htmlClass{lr-tok-w0}{w_0} + \\htmlClass{lr-tok-w1}{w_1}\\,x";
    renderTex(tex, el, false);
}

export function renderLRSteps(res) {
    const container = document.getElementById("math39-steps-container");
    if (!container) return;
    container.textContent = "";

    const frag = document.createDocumentFragment();

    if (!res || !res.valid) {
        frag.appendChild(makeArrow());
        const errBox = makeBlock("status perhitungan");
        errBox.appendChild(
            makeEl("div", "lr-card-subnote lr-subnote-warn", res?.reason || "Masukkan minimal 2 pasang nilai x dan y yang valid.")
        );
        frag.appendChild(errBox);
        container.appendChild(frag);
        return;
    }

    const { n, meanX, meanY, rows, sxy, sxx, w1, w0, predRows, sumResidual, sse, sumAbsRes, mse, rmse, mae } = res;

    frag.appendChild(makeArrow());
    const meanBox = makeBlock("mean");
    const meanGrid = makeEl("div", "lr-kv-list");
    const rowX = makeEl("div", "lr-kv-row");
    rowX.append(makeEl("span", "lr-kv-key", "x̄"), makeEl("span", "lr-kv-eq", "="), makeEl("span", "lr-kv-val lr-tok-w1", fmtNum(meanX, 4)));
    const rowY = makeEl("div", "lr-kv-row");
    rowY.append(makeEl("span", "lr-kv-key", "ȳ"), makeEl("span", "lr-kv-eq", "="), makeEl("span", "lr-kv-val lr-tok-w0", fmtNum(meanY, 4)));
    meanGrid.append(rowX, rowY);
    meanBox.appendChild(meanGrid);
    frag.appendChild(meanBox);

    frag.appendChild(makeArrow());
    const devBox = makeBlock("deviations");
    devBox.appendChild(
        makeTable(
            [
                { label: "data" },
                { label: "x" },
                { label: "y" },
                { label: "dx" },
                { label: "dy" }
            ],
            rows.map((r) => [
                { text: r.label },
                { text: fmtNum(r.x, 3) },
                { text: fmtNum(r.y, 3) },
                { text: fmtNum(r.dx, 3), cls: "lr-calc-cell" },
                { text: fmtNum(r.dy, 3), cls: "lr-calc-cell" }
            ])
        )
    );
    frag.appendChild(devBox);

    frag.appendChild(makeArrow());
    const sumsBox = makeBlock("two sums");
    sumsBox.appendChild(
        makeTable(
            [
                { label: "data" },
                { label: "dx * dy" },
                { label: "dx ^ 2" }
            ],
            rows.map((r) => [
                { text: r.label },
                { text: fmtNum(r.dxdy, 3), cls: "lr-calc-cell" },
                { text: fmtNum(r.dx2, 3), cls: "lr-calc-cell" }
            ]),
            [
                { text: "total" },
                { text: fmtNum(sxy, 4), cls: "lr-calc-cell lr-tok-w0" },
                { text: fmtNum(sxx, 4), cls: "lr-calc-cell lr-tok-w1" }
            ]
        )
    );
    frag.appendChild(sumsBox);

    frag.appendChild(makeArrow());
    const slopeBox = makeBlock("slope");
    const slopeMath = makeEl("div", "lr-step-math");
    renderTex(
        `w_1 = \\frac{\\text{total } (dx \\cdot dy)}{\\text{total } dx^2} = \\frac{\\htmlClass{lr-tok-w0}{${fmtNum(sxy, 4)}}}{\\htmlClass{lr-tok-w1}{${fmtNum(sxx, 4)}}} = \\htmlClass{lr-tok-w1}{${fmtNum(w1, 4)}}`,
        slopeMath,
        true
    );
    slopeBox.appendChild(slopeMath);
    frag.appendChild(slopeBox);

    frag.appendChild(makeArrow());
    const intBox = makeBlock("intercept");
    const intMath = makeEl("div", "lr-step-math");
    const w1Wrap = w1 < 0 ? `(${fmtNum(w1, 4)})` : fmtNum(w1, 4);
    const meanXWrap = meanX < 0 ? `(${fmtNum(meanX, 4)})` : fmtNum(meanX, 4);
    const signW1 = w1 < 0 ? `- ${fmtNum(Math.abs(w1), 4)}` : `+ ${fmtNum(w1, 4)}`;
    renderTex(
        `w_0 = \\bar{y} - w_1\\bar{x} = ${fmtNum(meanY, 4)} - ${w1Wrap}\\cdot ${meanXWrap} = \\htmlClass{lr-tok-w0}{${fmtNum(w0, 4)}}`,
        intMath,
        true
    );
    intBox.appendChild(intMath);
    const eqLine = makeEl("div", "lr-step-math lr-eq-summary");
    renderTex(
        `\\htmlClass{lr-tok-y}{\\hat{y}} = \\htmlClass{lr-tok-w0}{${fmtNum(w0, 4)}} ${signW1}\\,x`,
        eqLine,
        true
    );
    intBox.appendChild(eqLine);
    frag.appendChild(intBox);

    frag.appendChild(makeArrow());
    const predBox = makeBlock("prediction");
    predBox.appendChild(
        makeTable(
            [
                { label: "data" },
                { label: "x" },
                { label: "actual" },
                { label: "predict" }
            ],
            predRows.map((r) => [
                { text: r.label },
                { text: fmtNum(r.x, 3) },
                { text: fmtNum(r.actual, 3) },
                { text: fmtNum(r.predict, 3), cls: "lr-calc-cell lr-tok-y" }
            ])
        )
    );
    frag.appendChild(predBox);

    frag.appendChild(makeArrow());
    const resBox = makeBlock("residuals and SSE (sum of squared errors)");
    resBox.appendChild(
        makeTable(
            [
                { label: "data" },
                { label: "residual" },
                { label: "sse" },
                { label: "abs (res)" }
            ],
            predRows.map((r) => [
                { text: r.label },
                { text: fmtNum(r.residual, 4), cls: "lr-calc-cell" },
                { text: fmtNum(r.sse, 4), cls: "lr-calc-cell" },
                { text: fmtNum(r.absRes, 4), cls: "lr-calc-cell" }
            ]),
            [
                { text: "total" },
                { text: fmtNum(sumResidual, 4), cls: "lr-calc-cell" },
                { text: fmtNum(sse, 4), cls: "lr-calc-cell lr-tok-err" },
                { text: fmtNum(sumAbsRes, 4), cls: "lr-calc-cell" }
            ]
        )
    );
    frag.appendChild(resBox);

    frag.appendChild(makeArrow());
    const metricsBox = makeBlock("SSE: Smaller is better");
    const metricsGrid = makeEl("div", "lr-kv-list");
    const rMse = makeEl("div", "lr-kv-row");
    rMse.append(makeEl("span", "lr-kv-key", "MSE"), makeEl("span", "lr-kv-eq", "="), makeEl("span", "lr-kv-val", fmtNum(mse, 4)));
    const rRmse = makeEl("div", "lr-kv-row");
    rRmse.append(makeEl("span", "lr-kv-key", "RMSE"), makeEl("span", "lr-kv-eq", "="), makeEl("span", "lr-kv-val", fmtNum(rmse, 4)));
    const rMae = makeEl("div", "lr-kv-row");
    rMae.append(makeEl("span", "lr-kv-key", "MAE"), makeEl("span", "lr-kv-eq", "="), makeEl("span", "lr-kv-val", fmtNum(mae, 4)));
    metricsGrid.append(rMse, rRmse, rMae);
    metricsBox.appendChild(metricsGrid);
    metricsBox.appendChild(
        makeEl("div", "lr-card-subnote", `MSE = SSE / ${n}  ·  RMSE = sqrt(MSE)  ·  MAE = sum(|residual|) / ${n}`)
    );
    frag.appendChild(metricsBox);

    container.appendChild(frag);
}
