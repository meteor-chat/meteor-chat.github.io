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
    const rxRect = resX ? resX.getBoundingClientRect() : null;
    const rxRight = rxRect ? rxRect.right - sRect.left : 0;
    const rxBot = rxRect ? rxRect.bottom - sRect.top : 0;
    const ryRect = resY ? resY.getBoundingClientRect() : null;
    const ryRight = ryRect ? ryRect.right - sRect.left : 0;
    const ryBot = ryRect ? ryRect.bottom - sRect.top : 0;
    const safeOut = Math.min(sRect.width - 4, Math.max(startX + 4, rxRight + 22, ryRight + 22));

    const tx1 = dxRect.left - sRect.left + dxRect.width * 0.72;
    const ty1 = dxRect.bottom - sRect.top + 4;
    const cx1a = Math.min(sRect.width - 4, safeOut);
    const cy1a = Math.max(startY + 40, rxBot + 10);
    const cx2a = Math.min(sRect.width - 4, Math.max(tx1 + 42, rxRight + 18));
    addBezierArrow(svg, startX, startY, cx1a, cy1a, cx2a, ty1 + 40, tx1, ty1, "lr-after-head");

    const tx2 = dyRect.left - sRect.left + dyRect.width * 0.72;
    const ty2 = dyRect.bottom - sRect.top + 4;
    const cx1b = Math.min(sRect.width - 2, safeOut + 6);
    const cy1b = Math.max(startY + 60, ryBot + 10);
    const cx2b = Math.min(sRect.width - 4, Math.max(tx2 + 48, ryRight + 24));
    addBezierArrow(
        svg,
        startX,
        startY,
        cx1b,
        cy1b,
        cx2b,
        ty2 + 52,
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

function drawFractionStageArrows(stage, idx) {
    const svg = stage.querySelector(".lr-stage-svg");
    if (!svg) return;
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

    const markerId = `lr-frac-head-${idx}`;
    svg.setAttribute("viewBox", `0 0 ${stR.width} ${stR.height}`);
    addArrowMarker(svg, markerId);

    const box = (el) => {
        const b = el.getBoundingClientRect();
        return {
            l: b.left - stR.left,
            r: b.right - stR.left,
            t: b.top - stR.top,
            b: b.bottom - stR.top,
            cx: b.left - stR.left + b.width * 0.5,
            cy: b.top - stR.top + b.height * 0.5
        };
    };

    const bn = box(num);
    const bm = box(mtop);
    const stacked = bn.b < bm.t - 6;

    if (stacked) {
        const bl = box(num.closest(".lr-slope-node"));
        const bd = box(den);
        const bmb = box(mbot);
        const bv1 = box(vtop);
        const bv2 = box(vbot);
        const br1 = box(rnum);
        const br2 = box(rden);

        const railLeftX = Math.max(6, bl.l - 42);
        addBezierArrow(svg, bn.cx, bn.t - 4, railLeftX, bn.t - 28, railLeftX, bm.t - 24, bm.cx, bm.t - 5, markerId);
        const midDenY = (bd.b + 4 + bmb.t - 5) * 0.5;
        addBezierArrow(svg, bd.cx, bd.b + 4, bd.cx, midDenY, bmb.cx, midDenY, bmb.cx, bmb.t - 5, markerId);
        addBezierArrow(svg, bv1.cx, bv1.b + 4, bv1.cx - 18, br1.cy - 12, br1.l - 30, br1.cy, br1.l - 6, br1.cy, markerId);
        addBezierArrow(svg, bv2.cx, bv2.b + 4, bv2.cx, br2.b + 24, br2.cx + 12, br2.b + 24, br2.cx, br2.b + 5, markerId);
    } else {
        const conn = (aEl, bEl, waveY1 = 0, waveY2 = 0) => {
            const a = aEl.getBoundingClientRect();
            const b = bEl.getBoundingClientRect();
            if (a.width <= 0 || b.width <= 0) return;
            const x1 = a.right - stR.left + 6;
            const y1 = a.top + a.height * 0.5 - stR.top;
            const x2 = b.left - stR.left - 6;
            const y2 = b.top + b.height * 0.5 - stR.top;
            const mx = (x1 + x2) * 0.5;
            addBezierArrow(svg, x1, y1, mx, y1 + waveY1, mx, y2 + waveY2, x2, y2, markerId);
        };

        conn(num, mtop, 0, 0);
        conn(den, mbot, 0, 0);
        conn(vtop, rnum, -8, -4);
        conn(vbot, rden, 8, 4);
    }
}

function drawRmseArrows() {
    const stage = document.getElementById("math39-rmse-stage");
    const svg = document.getElementById("math39-rmse-svg");
    if (!stage || !svg) return;
    svg.textContent = "";

    const stR = stage.getBoundingClientRect();
    if (!stR || stR.width <= 0 || stR.height <= 0) return;

    const inEl = stage.querySelector(".lr-rm-in");
    const midEl = stage.querySelector(".lr-rm-mid");
    const valEl = stage.querySelector(".lr-rm-val");
    const outEl = stage.querySelector(".lr-rm-out");
    if (!inEl || !midEl || !valEl || !outEl) return;

    const box = (el) => {
        const b = el.getBoundingClientRect();
        return {
            l: b.left - stR.left,
            r: b.right - stR.left,
            b: b.bottom - stR.top,
            cx: b.left - stR.left + b.width * 0.5,
            cy: b.top - stR.top + b.height * 0.5
        };
    };

    const bin = box(inEl);
    const bmid = box(midEl);
    const bval = box(valEl);
    const bout = box(outEl);

    svg.setAttribute("viewBox", `0 0 ${stR.width} ${stR.height}`);
    addArrowMarker(svg, "lr-rmse-head");

    const mx1 = (bin.r + 6 + bmid.l - 6) * 0.5;
    addBezierArrow(svg, bin.r + 6, bin.cy, mx1, bin.cy, mx1, bmid.cy, bmid.l - 6, bmid.cy, "lr-rmse-head");

    const dropY = Math.max(bval.b, bout.b) + 22;
    addBezierArrow(svg, bval.cx, bval.b + 4, bval.cx, dropY, bout.cx, dropY, bout.cx, bout.b + 5, "lr-rmse-head");
}

function drawSlopeArrows() {
    document.querySelectorAll(".lr-frac-stage").forEach((stage, idx) => {
        drawFractionStageArrows(stage, idx);
    });
    drawRmseArrows();
    drawInterceptArrows();
}

function drawInterceptArrows() {
    const stage = document.getElementById("math39-int-stage");
    const svg = document.getElementById("math39-int-svg");
    if (!stage || !svg) return;
    svg.textContent = "";

    const stR = stage.getBoundingClientRect();
    if (!stR || stR.width <= 0 || stR.height <= 0) return;

    const q = (cls) => stage.querySelector(`.${cls}`);
    const pairs = [
        [q("lr-in-ybar"), q("lr-in-my")],
        [q("lr-in-w1"), q("lr-in-mw1")],
        [q("lr-in-xbar"), q("lr-in-mx")],
        [q("lr-in-vy"), q("lr-in-ry")],
        [q("lr-in-vw1"), q("lr-in-rw1")],
        [q("lr-in-vx"), q("lr-in-rx")]
    ];
    if (pairs.some(([a, b]) => !a || !b)) return;

    const box = (el) => {
        const b = el.getBoundingClientRect();
        return {
            cx: b.left - stR.left + b.width * 0.5,
            t: b.top - stR.top,
            b: b.bottom - stR.top
        };
    };

    svg.setAttribute("viewBox", `0 0 ${stR.width} ${stR.height}`);
    addArrowMarker(svg, "lr-int-head");

    pairs.forEach(([fromEl, toEl]) => {
        const a = box(fromEl);
        const b = box(toEl);
        const y1 = a.b + 4;
        const y2 = b.t - 5;
        const midY = (y1 + y2) * 0.5;
        addBezierArrow(svg, a.cx, y1, a.cx, midY, b.cx, midY, b.cx, y2, "lr-int-head");
    });
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

    const makeHBraceSummary = (tex) => {
        const wrap = makeEl("div", "lr-slope-summary");
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
        const node = makeEl("div", "lr-slope-node");
        renderTex(tex, node, false);
        wrap.append(hBrace, node);
        return wrap;
    };

    const joinCls = (tokCls, baseCls) => (tokCls ? `${tokCls} ${baseCls}` : baseCls);
    const makeFractionFlowCard = ({ symTex, numTex, denTex, numValTex, denValTex, resValTex, numCls = "", denCls = "", resCls = "", extraCls = "" }) => {
        const wrap = makeEl("div", extraCls ? `lr-step-card lr-table-scroll ${extraCls}` : "lr-step-card lr-table-scroll");
        const stage = makeEl("div", "lr-slope-stage lr-frac-stage");
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "lr-stage-svg");
        svg.setAttribute("aria-hidden", "true");
        stage.appendChild(svg);

        const leftNode = makeEl("div", "lr-slope-node");
        renderTex(
            `${symTex} = \\frac{\\htmlClass{lr-sl-num}{${numTex}}}{\\htmlClass{lr-sl-den}{${denTex}}}`,
            leftNode,
            true
        );

        const midCol = makeEl("div", "lr-slope-mid");
        const midTop = makeEl("div", "lr-slope-node lr-sl-mtop");
        renderTex(`${numTex} = \\htmlClass{${joinCls(numCls, "lr-sl-vtop")}}{${numValTex}}`, midTop, false);
        const midBot = makeEl("div", "lr-slope-node lr-sl-mbot");
        renderTex(`${denTex} = \\htmlClass{${joinCls(denCls, "lr-sl-vbot")}}{${denValTex}}`, midBot, false);
        midCol.append(midTop, midBot);

        const rightNode = makeEl("div", "lr-slope-node");
        const resWrapped = resCls ? `\\htmlClass{${resCls}}{${resValTex}}` : resValTex;
        renderTex(
            `\\frac{\\htmlClass{${joinCls(numCls, "lr-sl-rnum")}}{${numValTex}}}{\\htmlClass{${joinCls(denCls, "lr-sl-rden")}}{${denValTex}}} = ${resWrapped}`,
            rightNode,
            true
        );

        stage.append(leftNode, midCol, rightNode);
        wrap.append(stage, makeHBraceSummary(`${symTex} = ${resWrapped}`));
        return wrap;
    };

    frag.appendChild(makeArrow());
    const slopeSec = makeSection("5. slope");
    slopeSec.appendChild(
        makeFractionFlowCard({
            symTex: "w_1",
            numTex: "\\text{total } (dx \\cdot dy)",
            denTex: "\\text{total } dx^2",
            numValTex: fmtNum(sxy, 4),
            denValTex: fmtNum(sxx, 4),
            resValTex: fmtNum(w1, 4),
            numCls: "lr-tok-w0",
            denCls: "lr-tok-w1",
            resCls: "lr-tok-w1"
        })
    );
    frag.appendChild(slopeSec);

    frag.appendChild(makeArrow());
    const intSec = makeSection("6. intercept");
    const intWrap = makeEl("div", "lr-step-card lr-table-scroll");
    const intStage = makeEl("div", "lr-int-stage");
    intStage.id = "math39-int-stage";
    const intSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    intSvg.setAttribute("class", "lr-stage-svg");
    intSvg.setAttribute("aria-hidden", "true");
    intSvg.id = "math39-int-svg";
    intStage.appendChild(intSvg);

    const intLeft = makeEl("div", "lr-slope-node");
    renderTex(
        "w_0 = \\htmlClass{lr-in-ybar}{\\bar{y}} - \\htmlClass{lr-in-w1}{w_1} \\cdot \\htmlClass{lr-in-xbar}{\\bar{x}}",
        intLeft,
        false
    );

    const intMid = makeEl("div", "lr-int-mid");
    const intR1 = makeEl("div", "lr-slope-node");
    renderTex(`\\htmlClass{lr-in-my}{\\bar{y}} = \\htmlClass{lr-in-vy}{${fmtNum(meanY, 4)}}`, intR1, false);
    const intR2 = makeEl("div", "lr-slope-node");
    renderTex(`\\htmlClass{lr-in-mw1}{w_1} = \\htmlClass{lr-in-vw1}{${fmtNum(w1, 4)}}`, intR2, false);
    const intR3 = makeEl("div", "lr-slope-node");
    renderTex(`\\htmlClass{lr-in-mx}{\\bar{x}} = \\htmlClass{lr-in-vx}{${fmtNum(meanX, 4)}}`, intR3, false);
    intMid.append(intR1, intR2, intR3);

    const intRight = makeEl("div", "lr-slope-node");
    const yStr = meanY < 0 ? `(${fmtNum(meanY, 4)})` : fmtNum(meanY, 4);
    const w1Wrap = w1 < 0 ? `(${fmtNum(w1, 4)})` : fmtNum(w1, 4);
    const meanXWrap = meanX < 0 ? `(${fmtNum(meanX, 4)})` : fmtNum(meanX, 4);
    renderTex(
        `\\htmlClass{lr-in-ry}{${yStr}} - \\htmlClass{lr-in-rw1}{${w1Wrap}} \\cdot \\htmlClass{lr-in-rx}{${meanXWrap}} = \\htmlClass{lr-tok-w0}{${fmtNum(w0, 4)}}`,
        intRight,
        false
    );

    intStage.append(intLeft, intMid, intRight);
    intWrap.append(intStage, makeHBraceSummary(`w_0 = \\htmlClass{lr-tok-w0}{${fmtNum(w0, 4)}}`));

    const signW1 = w1 < 0 ? `- ${fmtNum(Math.abs(w1), 4)}` : `+ ${fmtNum(w1, 4)}`;
    const eqMath = makeEl("div", "lr-step-card lr-step-eq");
    renderTex(
        `\\htmlClass{lr-tok-y}{\\hat{y}} = \\htmlClass{lr-tok-w0}{${fmtNum(w0, 4)}} ${signW1}\\,x`,
        eqMath,
        true
    );
    intSec.append(intWrap, eqMath);
    frag.appendChild(intSec);

    frag.appendChild(makeArrow());
    const predSec = makeSection("7. prediction");
    const signW1Tok = w1 < 0
        ? `- \\htmlClass{lr-tok-w1}{${fmtNum(Math.abs(w1), 4)}}`
        : `+ \\htmlClass{lr-tok-w1}{${fmtNum(w1, 4)}}`;
    const predParens = (v, d = 3) => (v < 0 ? `(${fmtNum(v, d)})` : fmtNum(v, d));
    predSec.appendChild(
        makeTexTable(
            [
                { label: "data" },
                { tex: "x" },
                { tex: "y" },
                { tex: "\\hat{y}\\text{ formula}" },
                { tex: "\\hat{y}" }
            ],
            predRows.map((r) => [
                { rawText: r.label },
                { tex: fmtNum(r.x, 3) },
                { tex: fmtNum(r.actual, 3) },
                {
                    tex: `\\htmlClass{lr-tok-w0}{${fmtNum(w0, 4)}} ${signW1Tok} \\cdot ${predParens(r.x, 3)}`,
                    cls: "lr-calc-cell"
                },
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
                { tex: "(y - \\hat{y})\\text{ formula}" },
                { tex: "y - \\hat{y}" },
                { tex: "(y - \\hat{y})^2\\text{ formula}" },
                { tex: "(y - \\hat{y})^2" },
                { tex: "|y - \\hat{y}|" }
            ],
            predRows.map((r) => [
                { rawText: r.label },
                {
                    tex: `${fmtNum(r.actual, 3)} - \\htmlClass{lr-tok-y}{${predParens(r.predict, 3)}}`,
                    cls: "lr-calc-cell"
                },
                { tex: fmtNum(r.residual, 4), cls: "lr-calc-cell" },
                { tex: `${predParens(r.residual, 4)}^2`, cls: "lr-calc-cell" },
                { tex: fmtNum(r.sse, 4), cls: "lr-calc-cell" },
                { tex: fmtNum(r.absRes, 4), cls: "lr-calc-cell" }
            ]),
            [
                { rawText: "total" },
                { rawText: "" },
                { tex: fmtNum(sumResidual, 4), cls: "lr-calc-cell" },
                { rawText: "" },
                { tex: `\\htmlClass{lr-tok-err}{${fmtNum(sse, 4)}}`, cls: "lr-calc-cell" },
                { tex: fmtNum(sumAbsRes, 4), cls: "lr-calc-cell" }
            ]
        )
    );
    frag.appendChild(resSec);

    frag.appendChild(makeArrow());
    const metSec = makeSection("SSE: Smaller is better");
    metSec.classList.add("lr-metrics-sec");

    const mseCard = makeFractionFlowCard({
        symTex: "\\text{MSE}",
        numTex: "\\text{total } (y - \\hat{y})^2",
        denTex: "\\text{jumlah data}",
        numValTex: fmtNum(sse, 4),
        denValTex: String(n),
        resValTex: fmtNum(mse, 4),
        numCls: "lr-tok-err",
        denCls: "lr-tok-y",
        resCls: "lr-tok-err"
    });

    const rmseCard = makeEl("div", "lr-step-card lr-table-scroll");
    const rmseStage = makeEl("div", "lr-rmse-stage");
    rmseStage.id = "math39-rmse-stage";
    const rmseSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    rmseSvg.setAttribute("class", "lr-stage-svg");
    rmseSvg.setAttribute("aria-hidden", "true");
    rmseSvg.id = "math39-rmse-svg";
    rmseStage.appendChild(rmseSvg);

    const rmseLeft = makeEl("div", "lr-slope-node");
    renderTex("\\text{RMSE} = \\sqrt{\\htmlClass{lr-rm-in}{\\text{MSE}}}", rmseLeft, true);

    const rmseMid = makeEl("div", "lr-slope-node");
    renderTex(`\\htmlClass{lr-rm-mid}{\\text{MSE}} = \\htmlClass{lr-tok-err lr-rm-val}{${fmtNum(mse, 4)}}`, rmseMid, false);

    const rmseRight = makeEl("div", "lr-slope-node");
    renderTex(
        `\\sqrt{\\htmlClass{lr-tok-err lr-rm-out}{${fmtNum(mse, 4)}}} = \\htmlClass{lr-tok-err}{${fmtNum(rmse, 4)}}`,
        rmseRight,
        true
    );

    rmseStage.append(rmseLeft, rmseMid, rmseRight);
    rmseCard.append(rmseStage, makeHBraceSummary(`\\text{RMSE} = \\htmlClass{lr-tok-err}{${fmtNum(rmse, 4)}}`));

    const maeCard = makeFractionFlowCard({
        symTex: "\\text{MAE}",
        numTex: "\\text{total } |y - \\hat{y}|",
        denTex: "\\text{jumlah data}",
        numValTex: fmtNum(sumAbsRes, 4),
        denValTex: String(n),
        resValTex: fmtNum(mae, 4),
        denCls: "lr-tok-y",
        resCls: "lr-tok-err",
        extraCls: "lr-mae-card"
    });

    metSec.append(mseCard, makeArrow(), rmseCard, maeCard);
    frag.appendChild(metSec);

    container.appendChild(frag);
    if (typeof requestAnimationFrame !== "undefined") {
        requestAnimationFrame(drawAfterArrows);
    } else {
        drawAfterArrows();
    }
}
