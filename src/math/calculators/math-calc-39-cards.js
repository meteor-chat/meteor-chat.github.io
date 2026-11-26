import { fmtNum } from "./math-calc-39-engine.js";

function makeEl(tag, className, textContent) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (textContent !== undefined) el.textContent = textContent;
    return el;
}

export function renderTex(tex, el, displayMode = false) {
    if (typeof katex !== "undefined") {
        katex.render(tex, el, { throwOnError: false, trust: true, displayMode });
    } else {
        el.textContent = tex;
    }
}

function makeArrow() {
    const el = makeEl("div", "lr-step-arrow");
    renderTex("\\downarrow", el, false);
    return el;
}

function makeSection(titleText) {
    const sec = makeEl("section", "lr-sec");
    sec.appendChild(makeEl("div", "lr-sec-title", titleText));
    return sec;
}

function makeTexCell(tex, cls = "") {
    const td = makeEl("td", cls);
    const span = makeEl("span", "lr-tex-cell");
    renderTex(tex, span, false);
    td.appendChild(span);
    return td;
}

function makeTexHeader(tex) {
    const th = makeEl("th");
    renderTex(tex, th, false);
    return th;
}

function makeTexTable(headers, bodyRows, footerRow = null) {
    const wrap = makeEl("div", "lr-table-scroll");
    const table = makeEl("table", "lr-sheet-table");

    const thead = makeEl("thead");
    const hr = makeEl("tr");
    headers.forEach((h) => {
        if (h.tex) hr.appendChild(makeTexHeader(h.tex));
        else hr.appendChild(makeEl("th", "", h.label));
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    const tbody = makeEl("tbody");
    bodyRows.forEach((cells) => {
        const tr = makeEl("tr");
        cells.forEach((c) => {
            tr.appendChild(c.rawText ? makeEl("td", c.cls || "", c.rawText) : makeTexCell(c.tex, c.cls || ""));
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    if (footerRow) {
        const tfoot = makeEl("tfoot");
        const fr = makeEl("tr");
        footerRow.forEach((c) => {
            fr.appendChild(c.rawText ? makeEl("td", c.cls || "", c.rawText) : makeTexCell(c.tex, c.cls || ""));
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

    const thX = document.getElementById("lr-th-x");
    const thY = document.getElementById("lr-th-y");
    if (thX) renderTex("x", thX, false);
    if (thY) renderTex("y", thY, false);
}

function syncRightBrace() {
    const tabRow = document.querySelector(".lr-tab-brace-row");
    const tbody = document.getElementById("math39-tabulate-body");
    const braceSide = document.getElementById("math39-brace-side");
    const vbraceSvg = document.getElementById("math39-vbrace-svg");
    const vbracePath = document.getElementById("math39-vbrace-path");
    if (!tabRow || !tbody || !braceSide || !vbraceSvg) return;

    const filledRows = Array.from(tbody.children).filter((tr) => {
        const inputs = tr.querySelectorAll(".lr-cell-input");
        if (inputs.length < 2) return false;
        return Number.isFinite(parseFloat(inputs[0].value)) && Number.isFinite(parseFloat(inputs[1].value));
    });
    if (filledRows.length === 0) return;

    const tabRect = tabRow.getBoundingClientRect();
    const firstRect = filledRows[0].getBoundingClientRect();
    const lastRect = filledRows[filledRows.length - 1].getBoundingClientRect();
    if (firstRect.height <= 0 || lastRect.height <= 0) return;

    const topOffset = Math.max(0, firstRect.top - tabRect.top + 3);
    const braceH = Math.max(38, lastRect.bottom - firstRect.top - 6);
    const mid = braceH / 2;

    braceSide.style.paddingTop = `${topOffset}px`;
    vbraceSvg.setAttribute("viewBox", `0 0 22 ${braceH}`);
    vbraceSvg.style.width = "22px";
    vbraceSvg.style.height = `${braceH}px`;
    if (vbracePath) {
        const r = Math.min(12, Math.max(4, braceH * 0.14));
        const d = `M 2 2 Q 12 2 12 ${2 + r} L 12 ${mid - r} Q 12 ${mid} 20 ${mid} Q 12 ${mid} 12 ${mid + r} L 12 ${braceH - 2 - r} Q 12 ${braceH - 2} 2 ${braceH - 2}`;
        vbracePath.setAttribute("d", d);
    }
}

export function drawAfterArrows() {
    syncRightBrace();

    const stage = document.getElementById("math39-stage-top");
    const svg = document.getElementById("math39-arrows-svg");
    const srcEl = document.getElementById("math39-n-val");
    const denX = document.querySelector(".lr-den-x");
    const denY = document.querySelector(".lr-den-y");
    if (!stage || !svg) return;

    svg.textContent = "";
    if (!srcEl || !denX || !denY) return;

    const sRect = stage.getBoundingClientRect();
    if (!sRect || sRect.width <= 0 || sRect.height <= 0) return;

    const nRect = srcEl.getBoundingClientRect();
    const dxRect = denX.getBoundingClientRect();
    const dyRect = denY.getBoundingClientRect();
    if (nRect.width <= 0 || dxRect.width <= 0 || dyRect.width <= 0) return;

    svg.setAttribute("viewBox", `0 0 ${sRect.width} ${sRect.height}`);

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute("id", "lr-after-head");
    marker.setAttribute("markerWidth", "7");
    marker.setAttribute("markerHeight", "7");
    marker.setAttribute("refX", "5.5");
    marker.setAttribute("refY", "3.5");
    marker.setAttribute("orient", "auto");
    const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    poly.setAttribute("points", "0 0, 7 3.5, 0 7");
    poly.setAttribute("fill", "#ffffff");
    marker.appendChild(poly);
    defs.appendChild(marker);
    svg.appendChild(defs);

    const startX = nRect.left - sRect.left + nRect.width * 0.5;
    const startY = nRect.bottom - sRect.top + 5;

    const resX = document.querySelector(".lr-res-x");
    const resY = document.querySelector(".lr-res-y");
    const rxRight = resX ? resX.getBoundingClientRect().right - sRect.left : 0;
    const ryRight = resY ? resY.getBoundingClientRect().right - sRect.left : 0;
    const safeOut = Math.min(sRect.width - 8, Math.max(startX + 4, rxRight + 28, ryRight + 28));

    const tx1 = dxRect.left - sRect.left + dxRect.width * 0.72;
    const ty1 = dxRect.bottom - sRect.top + 4;
    const c1x1 = safeOut;
    const c1y1 = ty1 + 26;
    const c2x1 = tx1 + 38;
    const c2y1 = ty1 + 30;
    const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path1.setAttribute("d", `M ${startX} ${startY} C ${c1x1} ${c1y1}, ${c2x1} ${c2y1}, ${tx1} ${ty1}`);
    path1.setAttribute("fill", "none");
    path1.setAttribute("stroke", "rgba(255,255,255,0.88)");
    path1.setAttribute("stroke-width", "1.4");
    path1.setAttribute("marker-end", "url(#lr-after-head)");
    svg.appendChild(path1);

    const tx2 = dyRect.left - sRect.left + dyRect.width * 0.72;
    const ty2 = dyRect.bottom - sRect.top + 4;
    const c1x2 = Math.min(sRect.width - 4, safeOut + 12);
    const c1y2 = ty2 + 30;
    const c2x2 = tx2 + 40;
    const c2y2 = ty2 + 34;
    const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path2.setAttribute("d", `M ${startX} ${startY} C ${c1x2} ${c1y2}, ${c2x2} ${c2y2}, ${tx2} ${ty2}`);
    path2.setAttribute("fill", "none");
    path2.setAttribute("stroke", "rgba(255,255,255,0.88)");
    path2.setAttribute("stroke-width", "1.4");
    path2.setAttribute("marker-end", "url(#lr-after-head)");
    svg.appendChild(path2);
}

export function renderLRSteps(res) {
    const braceSide = document.getElementById("math39-brace-side");
    const nTag = document.getElementById("math39-n-tag");
    const meanWrap = document.getElementById("math39-mean-wrap");
    const container = document.getElementById("math39-steps-container");
    if (!container) return;

    container.textContent = "";
    if (meanWrap) meanWrap.textContent = "";

    const validCount = res ? res.n : 0;
    if (braceSide && nTag) {
        if (validCount > 0) {
            braceSide.classList.remove("hidden");
            nTag.textContent = "";
            nTag.appendChild(makeEl("span", "", "jumlah data = "));
            const nValSpan = makeEl("span", "lr-n-val lr-tok-y");
            nValSpan.id = "math39-n-val";
            renderTex(String(validCount), nValSpan, false);
            nTag.appendChild(nValSpan);
        } else {
            braceSide.classList.add("hidden");
        }
    }

    if (!res || !res.valid) {
        const msg = makeEl("div", "lr-card-subnote lr-subnote-warn", res?.reason || "Isi minimal 2 baris x dan y.");
        container.appendChild(msg);
        drawAfterArrows();
        return;
    }

    const { n, meanX, meanY, rows, sxy, sxx, w1, w0, predRows, sumResidual, sse, sumAbsRes, mse, rmse, mae } = res;

    if (meanWrap) {
        const meanSec = makeSection("2. mean");
        const xTerms = rows.map((r) => (r.x < 0 ? `(${fmtNum(r.x, 3)})` : fmtNum(r.x, 3))).join(" + ");
        const yTerms = rows.map((r) => (r.y < 0 ? `(${fmtNum(r.y, 3)})` : fmtNum(r.y, 3))).join(" + ");

        const eqX = makeEl("div", "lr-mean-line");
        renderTex(
            `\\text{mean } x = \\frac{${xTerms}}{\\htmlClass{lr-den-x lr-tok-y}{${n}}} = \\htmlClass{lr-tok-w1 lr-res-x}{${fmtNum(meanX, 4)}}`,
            eqX,
            true
        );
        const eqY = makeEl("div", "lr-mean-line");
        renderTex(
            `\\text{mean } y = \\frac{${yTerms}}{\\htmlClass{lr-den-y lr-tok-y}{${n}}} = \\htmlClass{lr-tok-w0 lr-res-y}{${fmtNum(meanY, 4)}}`,
            eqY,
            true
        );

        const summaryBox = makeEl("div", "lr-mean-summary");
        const sumX = makeEl("div", "lr-mean-line");
        renderTex(`\\text{mean } x = \\htmlClass{lr-tok-w1}{${fmtNum(meanX, 4)}}`, sumX, false);
        const sumY = makeEl("div", "lr-mean-line");
        renderTex(`\\text{mean } y = \\htmlClass{lr-tok-w0}{${fmtNum(meanY, 4)}}`, sumY, false);
        summaryBox.append(sumX, sumY);

        meanSec.append(eqX, eqY, summaryBox);
        meanWrap.appendChild(meanSec);
    }

    const frag = document.createDocumentFragment();

    frag.appendChild(makeArrow());
    const devSec = makeSection("3. deviations");
    devSec.appendChild(
        makeTexTable(
            [
                { label: "data" },
                { tex: "x" },
                { tex: "y" },
                { tex: "dx" },
                { tex: "dy" }
            ],
            rows.map((r) => [
                { rawText: r.label },
                { tex: fmtNum(r.x, 3) },
                { tex: fmtNum(r.y, 3) },
                { tex: fmtNum(r.dx, 3), cls: "lr-calc-cell" },
                { tex: fmtNum(r.dy, 3), cls: "lr-calc-cell" }
            ])
        )
    );
    frag.appendChild(devSec);

    frag.appendChild(makeArrow());
    const sumsSec = makeSection("4. two sums");
    sumsSec.appendChild(
        makeTexTable(
            [
                { label: "data" },
                { tex: "dx \\cdot dy" },
                { tex: "dx^2" }
            ],
            rows.map((r) => [
                { rawText: r.label },
                { tex: fmtNum(r.dxdy, 3), cls: "lr-calc-cell" },
                { tex: fmtNum(r.dx2, 3), cls: "lr-calc-cell" }
            ]),
            [
                { rawText: "total" },
                { tex: `\\htmlClass{lr-tok-w0}{${fmtNum(sxy, 4)}}`, cls: "lr-calc-cell" },
                { tex: `\\htmlClass{lr-tok-w1}{${fmtNum(sxx, 4)}}`, cls: "lr-calc-cell" }
            ]
        )
    );
    frag.appendChild(sumsSec);

    frag.appendChild(makeArrow());
    const slopeSec = makeSection("5. slope");
    const slopeMath = makeEl("div", "lr-step-card");
    renderTex(
        `w_1 = \\frac{\\text{total } (dx \\cdot dy)}{\\text{total } dx^2} = \\frac{\\htmlClass{lr-tok-w0}{${fmtNum(sxy, 4)}}}{\\htmlClass{lr-tok-w1}{${fmtNum(sxx, 4)}}} = \\htmlClass{lr-tok-w1}{${fmtNum(w1, 4)}}`,
        slopeMath,
        true
    );
    slopeSec.appendChild(slopeMath);
    frag.appendChild(slopeSec);

    frag.appendChild(makeArrow());
    const intSec = makeSection("6. intercept");
    const intMath = makeEl("div", "lr-step-card");
    const w1Wrap = w1 < 0 ? `(${fmtNum(w1, 4)})` : fmtNum(w1, 4);
    const meanXWrap = meanX < 0 ? `(${fmtNum(meanX, 4)})` : fmtNum(meanX, 4);
    const signW1 = w1 < 0 ? `- ${fmtNum(Math.abs(w1), 4)}` : `+ ${fmtNum(w1, 4)}`;
    renderTex(
        `w_0 = \\bar{y} - w_1\\bar{x} = ${fmtNum(meanY, 4)} - ${w1Wrap} \\cdot ${meanXWrap} = \\htmlClass{lr-tok-w0}{${fmtNum(w0, 4)}}`,
        intMath,
        true
    );
    const eqMath = makeEl("div", "lr-step-card lr-step-eq");
    renderTex(
        `\\htmlClass{lr-tok-y}{\\hat{y}} = \\htmlClass{lr-tok-w0}{${fmtNum(w0, 4)}} ${signW1}\\,x`,
        eqMath,
        true
    );
    intSec.append(intMath, eqMath);
    frag.appendChild(intSec);

    frag.appendChild(makeArrow());
    const predSec = makeSection("7. prediction");
    predSec.appendChild(
        makeTexTable(
            [
                { label: "data" },
                { tex: "x" },
                { tex: "y" },
                { tex: "\\hat{y}" }
            ],
            predRows.map((r) => [
                { rawText: r.label },
                { tex: fmtNum(r.x, 3) },
                { tex: fmtNum(r.actual, 3) },
                { tex: `\\htmlClass{lr-tok-y}{${fmtNum(r.predict, 3)}}`, cls: "lr-calc-cell" }
            ])
        )
    );
    frag.appendChild(predSec);

    frag.appendChild(makeArrow());
    const resSec = makeSection("8. residuals and SSE");
    resSec.appendChild(
        makeTexTable(
            [
                { label: "data" },
                { tex: "y - \\hat{y}" },
                { tex: "(y - \\hat{y})^2" },
                { tex: "|y - \\hat{y}|" }
            ],
            predRows.map((r) => [
                { rawText: r.label },
                { tex: fmtNum(r.residual, 4), cls: "lr-calc-cell" },
                { tex: fmtNum(r.sse, 4), cls: "lr-calc-cell" },
                { tex: fmtNum(r.absRes, 4), cls: "lr-calc-cell" }
            ]),
            [
                { rawText: "total" },
                { tex: fmtNum(sumResidual, 4), cls: "lr-calc-cell" },
                { tex: `\\htmlClass{lr-tok-err}{${fmtNum(sse, 4)}}`, cls: "lr-calc-cell" },
                { tex: fmtNum(sumAbsRes, 4), cls: "lr-calc-cell" }
            ]
        )
    );
    frag.appendChild(resSec);

    frag.appendChild(makeArrow());
    const metSec = makeSection("SSE: Smaller is better");
    const metCard = makeEl("div", "lr-step-card");
    renderTex(
        `\\text{MSE} = \\frac{${fmtNum(sse, 4)}}{${n}} = ${fmtNum(mse, 4)}, \\quad \\text{RMSE} = ${fmtNum(rmse, 4)}, \\quad \\text{MAE} = ${fmtNum(mae, 4)}`,
        metCard,
        true
    );
    metSec.appendChild(metCard);
    frag.appendChild(metSec);

    container.appendChild(frag);
    if (typeof requestAnimationFrame !== "undefined") {
        requestAnimationFrame(drawAfterArrows);
    } else {
        drawAfterArrows();
    }
}
