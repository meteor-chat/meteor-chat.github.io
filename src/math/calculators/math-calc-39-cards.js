import { fmtNum } from "./math-calc-39-engine.js";

function makeEl(tag, className, textContent) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (textContent !== undefined) el.textContent = textContent;
    return el;
}

export function renderTex(tex, el, displayMode = false) {
    const expr = String(tex ?? "");
    if (typeof katex !== "undefined") {
        katex.render(expr, el, { throwOnError: false, trust: true, displayMode });
    } else {
        el.textContent = expr;
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
            tr.appendChild(c.rawText !== undefined ? makeEl("td", c.cls || "", c.rawText) : makeTexCell(c.tex, c.cls || ""));
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    if (footerRow) {
        const tfoot = makeEl("tfoot");
        const fr = makeEl("tr");
        footerRow.forEach((c) => {
            fr.appendChild(c.rawText !== undefined ? makeEl("td", c.cls || "", c.rawText) : makeTexCell(c.tex, c.cls || ""));
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

    addArrowMarker(svg, "lr-after-head");

    const startX = nRect.left - sRect.left + nRect.width * 0.5;
    const startY = nRect.bottom - sRect.top + 5;

    const resX = document.querySelector(".lr-res-x");
    const resY = document.querySelector(".lr-res-y");
    const rxRight = resX ? resX.getBoundingClientRect().right - sRect.left : 0;
    const ryRight = resY ? resY.getBoundingClientRect().right - sRect.left : 0;
    const safeOut = Math.min(sRect.width - 8, Math.max(startX + 4, rxRight + 28, ryRight + 28));

    const tx1 = dxRect.left - sRect.left + dxRect.width * 0.72;
    const ty1 = dxRect.bottom - sRect.top + 4;
    addBezierArrow(svg, startX, startY, safeOut, ty1 + 26, tx1 + 38, ty1 + 30, tx1, ty1, "lr-after-head");

    const tx2 = dyRect.left - sRect.left + dyRect.width * 0.72;
    const ty2 = dyRect.bottom - sRect.top + 4;
    addBezierArrow(
        svg,
        startX,
        startY,
        Math.min(sRect.width - 4, safeOut + 12),
        ty2 + 30,
        tx2 + 40,
        ty2 + 34,
        tx2,
        ty2,
        "lr-after-head"
    );

    drawSlopeArrows();
}

function addArrowMarker(svg, id) {
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute("id", id);
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
}

function addBezierArrow(svg, x1, y1, cx1, cy1, cx2, cy2, x2, y2, markerId) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "rgba(255,255,255,0.88)");
    path.setAttribute("stroke-width", "1.4");
    path.setAttribute("marker-end", `url(#${markerId})`);
    svg.appendChild(path);
}

function drawSlopeArrows() {
    const stage = document.getElementById("math39-slope-stage");
    const svg = document.getElementById("math39-slope-svg");
    if (!stage || !svg) return;
    svg.textContent = "";

    const stR = stage.getBoundingClientRect();
    if (!stR || stR.width <= 0 || stR.height <= 0) return;

    const num = stage.querySelector(".lr-sl-num");
    const den = stage.querySelector(".lr-sl-den");
    const mtop = stage.querySelector(".lr-sl-mtop");
    const mbot = stage.querySelector(".lr-sl-mbot");
    const vtop = stage.querySelector(".lr-sl-vtop");
    const vbot = stage.querySelector(".lr-sl-vbot");
    const rnum = stage.querySelector(".lr-sl-rnum");
    const rden = stage.querySelector(".lr-sl-rden");
    if (!num || !den || !mtop || !mbot || !vtop || !vbot || !rnum || !rden) return;

    svg.setAttribute("viewBox", `0 0 ${stR.width} ${stR.height}`);
    addArrowMarker(svg, "lr-slope-head");

    const conn = (aEl, bEl, waveY1 = 0, waveY2 = 0) => {
        const a = aEl.getBoundingClientRect();
        const b = bEl.getBoundingClientRect();
        if (a.width <= 0 || b.width <= 0) return;
        const x1 = a.right - stR.left + 6;
        const y1 = a.top + a.height * 0.5 - stR.top;
        const x2 = b.left - stR.left - 6;
        const y2 = b.top + b.height * 0.5 - stR.top;
        const mx = (x1 + x2) * 0.5;
        addBezierArrow(svg, x1, y1, mx, y1 + waveY1, mx, y2 + waveY2, x2, y2, "lr-slope-head");
    };

    conn(num, mtop, 0, 0);
    conn(den, mbot, 0, 0);
    conn(vtop, rnum, -8, -4);
    conn(vbot, rden, 8, 4);
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
    const mxTex = meanX < 0 ? `(\\htmlClass{lr-tok-w1}{${fmtNum(meanX, 4)}})` : `\\htmlClass{lr-tok-w1}{${fmtNum(meanX, 4)}}`;
    const myTex = meanY < 0 ? `(\\htmlClass{lr-tok-w0}{${fmtNum(meanY, 4)}})` : `\\htmlClass{lr-tok-w0}{${fmtNum(meanY, 4)}}`;
    devSec.appendChild(
        makeTexTable(
            [
                { label: "data" },
                { tex: "x" },
                { tex: "y" },
                { tex: "dx\\text{ formula}" },
                { tex: "dx" },
                { tex: "dy\\text{ formula}" },
                { tex: "dy" }
            ],
            rows.map((r) => [
                { rawText: r.label },
                { tex: fmtNum(r.x, 3) },
                { tex: fmtNum(r.y, 3) },
                { tex: `${fmtNum(r.x, 3)} - ${mxTex}`, cls: "lr-calc-cell" },
                { tex: fmtNum(r.dx, 3), cls: "lr-calc-cell" },
                { tex: `${fmtNum(r.y, 3)} - ${myTex}`, cls: "lr-calc-cell" },
                { tex: fmtNum(r.dy, 3), cls: "lr-calc-cell" }
            ])
        )
    );
    frag.appendChild(devSec);

    frag.appendChild(makeArrow());
    const sumsSec = makeSection("4. two sums");
    const paren = (v) => {
        const s = fmtNum(v, 3);
        return v < 0 ? `(${s})` : s;
    };
    sumsSec.appendChild(
        makeTexTable(
            [
                { label: "data" },
                { tex: "(dx \\cdot dy)\\text{ formula}" },
                { tex: "dx \\cdot dy" },
                { tex: "dx^2\\text{ formula}" },
                { tex: "dx^2" }
            ],
            rows.map((r) => [
                { rawText: r.label },
                { tex: `${paren(r.dx)} \\cdot ${paren(r.dy)}`, cls: "lr-calc-cell" },
                { tex: fmtNum(r.dxdy, 3), cls: "lr-calc-cell" },
                { tex: `${paren(r.dx)}^2`, cls: "lr-calc-cell" },
                { tex: fmtNum(r.dx2, 3), cls: "lr-calc-cell" }
            ]),
            [
                { rawText: "total" },
                { rawText: "" },
                { tex: `\\htmlClass{lr-tok-w0}{${fmtNum(sxy, 4)}}`, cls: "lr-calc-cell" },
                { rawText: "" },
                { tex: `\\htmlClass{lr-tok-w1}{${fmtNum(sxx, 4)}}`, cls: "lr-calc-cell" }
            ]
        )
    );
    frag.appendChild(sumsSec);

    frag.appendChild(makeArrow());
    const slopeSec = makeSection("5. slope");
    const slopeWrap = makeEl("div", "lr-step-card lr-table-scroll");
    const slopeStage = makeEl("div", "lr-slope-stage");
    slopeStage.id = "math39-slope-stage";
    const slopeSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    slopeSvg.setAttribute("class", "lr-stage-svg");
    slopeSvg.setAttribute("aria-hidden", "true");
    slopeSvg.id = "math39-slope-svg";
    slopeStage.appendChild(slopeSvg);

    const leftNode = makeEl("div", "lr-slope-node");
    renderTex(
        "w_1 = \\frac{\\htmlClass{lr-sl-num}{\\text{total } (dx \\cdot dy)}}{\\htmlClass{lr-sl-den}{\\text{total } dx^2}}",
        leftNode,
        true
    );

    const midCol = makeEl("div", "lr-slope-mid");
    const midTop = makeEl("div", "lr-slope-node lr-sl-mtop");
    renderTex(`\\text{total } (dx \\cdot dy) = \\htmlClass{lr-tok-w0 lr-sl-vtop}{${fmtNum(sxy, 4)}}`, midTop, false);
    const midBot = makeEl("div", "lr-slope-node lr-sl-mbot");
    renderTex(`\\text{total } dx^2 = \\htmlClass{lr-tok-w1 lr-sl-vbot}{${fmtNum(sxx, 4)}}`, midBot, false);
    midCol.append(midTop, midBot);

    const rightNode = makeEl("div", "lr-slope-node");
    renderTex(
        `\\frac{\\htmlClass{lr-tok-w0 lr-sl-rnum}{${fmtNum(sxy, 4)}}}{\\htmlClass{lr-tok-w1 lr-sl-rden}{${fmtNum(sxx, 4)}}} = \\htmlClass{lr-tok-w1}{${fmtNum(w1, 4)}}`,
        rightNode,
        true
    );

    slopeStage.append(leftNode, midCol, rightNode);

    const slopeSum = makeEl("div", "lr-slope-summary");
    const hBrace = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    hBrace.setAttribute("class", "lr-hbrace-svg");
    hBrace.setAttribute("viewBox", "0 0 540 22");
    hBrace.setAttribute("preserveAspectRatio", "none");
    hBrace.setAttribute("aria-hidden", "true");
    const hPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    hPath.setAttribute("d", "M 4 2 Q 4 12 22 12 L 254 12 Q 270 12 270 20 Q 270 12 286 12 L 518 12 Q 536 12 536 2");
    hPath.setAttribute("fill", "none");
    hPath.setAttribute("stroke", "#ffffff");
    hPath.setAttribute("stroke-width", "1.4");
    hPath.setAttribute("vector-effect", "non-scaling-stroke");
    hBrace.appendChild(hPath);

    const slopeFinal = makeEl("div", "lr-slope-node");
    renderTex(`w_1 = \\htmlClass{lr-tok-w1}{${fmtNum(w1, 4)}}`, slopeFinal, false);
    slopeSum.append(hBrace, slopeFinal);

    slopeWrap.append(slopeStage, slopeSum);
    slopeSec.appendChild(slopeWrap);
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
