import { fmtNum } from "./math-calc-40-engine.js";
import {
    makeEl,
    renderTex,
    makeArrow,
    makeSection,
    makeTexTable,
    syncRightBrace,
    makeHBraceSummary,
    makeFractionFlowCard,
    drawFractionStageArrows,
    drawThreeTierArrows
} from "./math-calc-39-cards.js";

function wrapNeg(v, digits = 4) {
    const s = fmtNum(v, digits);
    return v < 0 ? `(${s})` : s;
}

export function renderTopFormula40() {
    const el = document.getElementById("math-calc-formula-display-40");
    if (el) {
        el.textContent = "";
        const tex = "\\htmlClass{lr-tok-y}{\\alpha(z)} = \\frac{1}{1 + e^{-z}}, \\quad z = \\htmlClass{lr-tok-w0}{w_0} + \\htmlClass{lr-tok-w1}{w_1}\\,x";
        renderTex(tex, el, false);
    }

    const thX = document.getElementById("lr40-th-x");
    const thY = document.getElementById("lr40-th-y");
    if (thX) renderTex("x", thX, false);
    if (thY) renderTex("y", thY, false);

    const pW0 = document.getElementById("lr40-lbl-w0");
    const pW1 = document.getElementById("lr40-lbl-w1");
    const pLr = document.getElementById("lr40-lbl-lr");
    const pTh = document.getElementById("lr40-lbl-th");
    if (pW0) renderTex("\\htmlClass{lr-tok-w0}{w_0}", pW0, false);
    if (pW1) renderTex("\\htmlClass{lr-tok-w1}{w_1}", pW1, false);
    if (pLr) renderTex("\\eta", pLr, false);
    if (pTh) renderTex("\\theta", pTh, false);
}

export function drawLogRegArrows() {
    syncRightBrace(
        ".lr40-tab-brace-row",
        "math40-tabulate-body",
        "math40-brace-side",
        "math40-vbrace-svg",
        "math40-vbrace-path"
    );

    const form40 = document.getElementById("math-calc-form-40");
    if (!form40) return;

    form40.querySelectorAll(".lr-frac-stage").forEach((stage, idx) => {
        drawFractionStageArrows(stage, idx, "lr-frac-head-40");
    });
    form40.querySelectorAll(".lr-int-stage").forEach((stage, idx) => {
        drawThreeTierArrows(stage, `lr-int-head-40-${idx}`);
    });
}

function makeWeightUpdateCard({ labelNewTex, symTex, symVal, lr, gradSymTex, gradVal, tokCls }) {
    const newVal = symVal - lr * gradVal;
    const card = makeEl("div", "lr-step-card lr-table-scroll");
    const stage = makeEl("div", "lr-int-stage");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "lr-stage-svg");
    svg.setAttribute("aria-hidden", "true");
    stage.appendChild(svg);

    const topNode = makeEl("div", "lr-slope-node");
    renderTex(
        `${labelNewTex} = \\htmlClass{lr-in-ybar}{${symTex}} - \\htmlClass{lr-in-w1}{\\eta} \\cdot \\htmlClass{lr-in-xbar}{${gradSymTex}}`,
        topNode,
        false
    );

    const midRow = makeEl("div", "lr-int-mid");
    const m1 = makeEl("div", "lr-slope-node");
    renderTex(`\\htmlClass{lr-in-my}{${symTex}} = \\htmlClass{lr-in-vy ${tokCls}}{${fmtNum(symVal, 4)}}`, m1, false);
    const m2 = makeEl("div", "lr-slope-node");
    renderTex(`\\htmlClass{lr-in-mw1}{\\eta} = \\htmlClass{lr-in-vw1}{${fmtNum(lr, 4)}}`, m2, false);
    const m3 = makeEl("div", "lr-slope-node");
    renderTex(`\\htmlClass{lr-in-mx}{${gradSymTex}} = \\htmlClass{lr-in-vx ${tokCls}}{${fmtNum(gradVal, 4)}}`, m3, false);
    midRow.append(m1, m2, m3);

    const botNode = makeEl("div", "lr-slope-node");
    renderTex(
        `\\htmlClass{lr-in-ry ${tokCls}}{${wrapNeg(symVal, 4)}} \\;-\\; \\htmlClass{lr-in-rw1}{${wrapNeg(lr, 4)}} \\;\\cdot\\; \\htmlClass{lr-in-rx ${tokCls}}{${wrapNeg(gradVal, 4)}} = \\htmlClass{${tokCls}}{${fmtNum(newVal, 4)}}`,
        botNode,
        false
    );

    stage.append(topNode, midRow, botNode);
    const unit = makeEl("div", "lr-diagram-unit");
    unit.append(stage, makeHBraceSummary(`${labelNewTex} = \\htmlClass{${tokCls}}{${fmtNum(newVal, 4)}}`));
    card.appendChild(unit);
    return card;
}

export function renderLogRegSteps(res) {
    const braceSide = document.getElementById("math40-brace-side");
    const nTag = document.getElementById("math40-n-tag");
    const container = document.getElementById("math40-steps-container");
    if (!container) return;
    container.textContent = "";

    if (!res.valid) {
        if (braceSide) braceSide.classList.add("hidden");
        const err = makeEl("div", "lr-step-card lr-card-subnote lr-subnote-warn", res.reason);
        container.appendChild(err);
        return;
    }

    const { n, lr, threshold, initW0, initW1, rows, totalLoss, avgLoss, totalGw0, avgGw0, totalGw1, avgGw1, newW0, newW1, afterRows, afterLoss, afterCorrect, initCorrect, trace } = res;

    if (braceSide && nTag) {
        nTag.textContent = "";
        nTag.appendChild(document.createTextNode("jumlah data = "));
        const nVal = makeEl("span", "lr-n-val");
        nVal.id = "math40-n-val";
        renderTex(String(n), nVal, false);
        nTag.appendChild(nVal);
        braceSide.classList.remove("hidden");
    }

    const frag = document.createDocumentFragment();
    const w0SignTok = initW1 < 0 ? `- \\htmlClass{lr-tok-w1}{${fmtNum(Math.abs(initW1), 4)}}` : `+ \\htmlClass{lr-tok-w1}{${fmtNum(initW1, 4)}}`;

    frag.appendChild(makeArrow());
    const sigSec = makeSection("3. linear score (z) and sigmoid probability");
    sigSec.appendChild(
        makeTexTable(
            [
                { tex: "i" },
                { tex: "x" },
                { tex: "y" },
                { tex: "z\\text{ formula}" },
                { tex: "z" },
                { tex: "\\alpha(z)\\text{ formula}" },
                { tex: "\\alpha(z)" },
                { tex: "\\hat{y}\\;(\\alpha \\ge \\theta)" }
            ],
            rows.map((r) => [
                { tex: String(r.index) },
                { tex: fmtNum(r.x, 3) },
                { tex: fmtNum(r.y, 3) },
                { tex: `\\htmlClass{lr-tok-w0}{${fmtNum(initW0, 4)}} ${w0SignTok} \\cdot ${wrapNeg(r.x, 3)}`, cls: "lr-calc-cell" },
                { tex: fmtNum(r.z, 4), cls: "lr-calc-cell" },
                { tex: `\\frac{1}{1 + e^{-${wrapNeg(r.z, 4)}}}`, cls: "lr-calc-cell" },
                { tex: `\\htmlClass{lr-tok-y}{${fmtNum(r.alpha, 4)}}`, cls: "lr-calc-cell" },
                { tex: String(r.predClass), cls: "lr-calc-cell" }
            ]),
            [
                { rawText: "accuracy" },
                { rawText: "" },
                { rawText: "" },
                { rawText: "" },
                { rawText: "" },
                { rawText: "" },
                { rawText: "" },
                { tex: `${initCorrect}/${n}\\;(${fmtNum((initCorrect / n) * 100, 1)}\\%)`, cls: "lr-calc-cell" }
            ]
        )
    );
    frag.appendChild(sigSec);

    frag.appendChild(makeArrow());
    const lossSec = makeSection("4. log loss and average log loss");
    lossSec.appendChild(
        makeTexTable(
            [
                { tex: "i" },
                { tex: "y" },
                { tex: "\\alpha(z)" },
                { tex: "\\text{log loss formula}" },
                { tex: "\\text{log loss}" }
            ],
            rows.map((r) => {
                const lossF = Math.round(r.y) === 1
                    ? `-\\ln(\\htmlClass{lr-tok-y}{${fmtNum(r.alpha, 4)}})`
                    : `-\\ln(1 - \\htmlClass{lr-tok-y}{${fmtNum(r.alpha, 4)}})`;
                return [
                    { tex: String(r.index) },
                    { tex: fmtNum(r.y, 3) },
                    { tex: `\\htmlClass{lr-tok-y}{${fmtNum(r.alpha, 4)}}`, cls: "lr-calc-cell" },
                    { tex: lossF, cls: "lr-calc-cell" },
                    { tex: fmtNum(r.loss, 4), cls: "lr-calc-cell" }
                ];
            }),
            [
                { rawText: "total" },
                { rawText: "" },
                { rawText: "" },
                { rawText: "" },
                { tex: `\\htmlClass{lr-tok-err}{${fmtNum(totalLoss, 4)}}`, cls: "lr-calc-cell" }
            ]
        )
    );
    lossSec.appendChild(
        makeFractionFlowCard({
            symTex: "\\text{avg log loss}",
            numTex: "\\text{total log loss}",
            denTex: "\\text{jumlah data}",
            numValTex: fmtNum(totalLoss, 4),
            denValTex: String(n),
            resValTex: fmtNum(avgLoss, 4),
            numCls: "lr-tok-err",
            denCls: "lr-tok-y",
            resCls: "lr-tok-err"
        })
    );
    frag.appendChild(lossSec);

    frag.appendChild(makeArrow());
    const gradSec = makeSection("5. gradients");
    gradSec.appendChild(
        makeTexTable(
            [
                { tex: "i" },
                { tex: "x" },
                { tex: "y" },
                { tex: "\\alpha(z)" },
                { tex: "g_{w_0}\\text{ formula}" },
                { tex: "g_{w_0}" },
                { tex: "g_{w_1}\\text{ formula}" },
                { tex: "g_{w_1}" }
            ],
            rows.map((r) => [
                { tex: String(r.index) },
                { tex: fmtNum(r.x, 3) },
                { tex: fmtNum(r.y, 3) },
                { tex: `\\htmlClass{lr-tok-y}{${fmtNum(r.alpha, 4)}}`, cls: "lr-calc-cell" },
                { tex: `\\htmlClass{lr-tok-y}{${fmtNum(r.alpha, 4)}} - ${wrapNeg(r.y, 3)}`, cls: "lr-calc-cell" },
                { tex: fmtNum(r.gw0, 4), cls: "lr-calc-cell" },
                { tex: `${wrapNeg(r.gw0, 4)} \\cdot ${wrapNeg(r.x, 3)}`, cls: "lr-calc-cell" },
                { tex: fmtNum(r.gw1, 4), cls: "lr-calc-cell" }
            ]),
            [
                { rawText: "total" },
                { rawText: "" },
                { rawText: "" },
                { rawText: "" },
                { rawText: "" },
                { tex: `\\htmlClass{lr-tok-w0}{${fmtNum(totalGw0, 4)}}`, cls: "lr-calc-cell" },
                { rawText: "" },
                { tex: `\\htmlClass{lr-tok-w1}{${fmtNum(totalGw1, 4)}}`, cls: "lr-calc-cell" }
            ]
        )
    );
    frag.appendChild(gradSec);

    frag.appendChild(makeArrow());
    const avgGradSec = makeSection("6. average gradients");
    avgGradSec.append(
        makeFractionFlowCard({
            symTex: "g_{w_0}",
            numTex: "\\text{total } (\\alpha(z) - y)",
            denTex: "\\text{jumlah data}",
            numValTex: fmtNum(totalGw0, 4),
            denValTex: String(n),
            resValTex: fmtNum(avgGw0, 4),
            numCls: "lr-tok-w0",
            denCls: "lr-tok-y",
            resCls: "lr-tok-w0"
        }),
        makeFractionFlowCard({
            symTex: "g_{w_1}",
            numTex: "\\text{total } (\\alpha(z) - y)x",
            denTex: "\\text{jumlah data}",
            numValTex: fmtNum(totalGw1, 4),
            denValTex: String(n),
            resValTex: fmtNum(avgGw1, 4),
            numCls: "lr-tok-w1",
            denCls: "lr-tok-y",
            resCls: "lr-tok-w1"
        })
    );
    frag.appendChild(avgGradSec);

    frag.appendChild(makeArrow());
    const updSec = makeSection("7. weight update (gradient descent)");
    const updGrid = makeEl("div", "lr40-upd-grid");
    updGrid.append(
        makeWeightUpdateCard({
            labelNewTex: "w_0^{\\text{new}}",
            symTex: "w_0",
            symVal: initW0,
            lr,
            gradSymTex: "g_{w_0}",
            gradVal: avgGw0,
            tokCls: "lr-tok-w0"
        }),
        makeWeightUpdateCard({
            labelNewTex: "w_1^{\\text{new}}",
            symTex: "w_1",
            symVal: initW1,
            lr,
            gradSymTex: "g_{w_1}",
            gradVal: avgGw1,
            tokCls: "lr-tok-w1"
        })
    );
    const newSignW1 = newW1 < 0 ? `- \\htmlClass{lr-tok-w1}{${fmtNum(Math.abs(newW1), 4)}}` : `+ \\htmlClass{lr-tok-w1}{${fmtNum(newW1, 4)}}`;
    const newModelCard = makeEl("div", "lr-step-card lr-step-eq");
    renderTex(
        `z^{\\text{new}} = \\htmlClass{lr-tok-w0}{${fmtNum(newW0, 4)}} ${newSignW1}\\,x, \\quad \\theta = ${fmtNum(threshold, 2)}`,
        newModelCard,
        true
    );
    updSec.append(updGrid, newModelCard);
    frag.appendChild(updSec);

    frag.appendChild(makeArrow());
    const evalSec = makeSection("8. updated probability and decision");
    evalSec.appendChild(
        makeTexTable(
            [
                { tex: "i" },
                { tex: "x" },
                { tex: "y" },
                { tex: "z^{\\text{new}}\\text{ formula}" },
                { tex: "z^{\\text{new}}" },
                { tex: "\\alpha(z^{\\text{new}})" },
                { tex: "\\text{log loss}" },
                { tex: "\\hat{y}" }
            ],
            afterRows.map((r) => [
                { tex: String(r.index) },
                { tex: fmtNum(r.x, 3) },
                { tex: fmtNum(r.y, 3) },
                { tex: `\\htmlClass{lr-tok-w0}{${fmtNum(newW0, 4)}} ${newSignW1} \\cdot ${wrapNeg(r.x, 3)}`, cls: "lr-calc-cell" },
                { tex: fmtNum(r.z, 4), cls: "lr-calc-cell" },
                { tex: `\\htmlClass{lr-tok-y}{${fmtNum(r.alpha, 4)}}`, cls: "lr-calc-cell" },
                { tex: fmtNum(r.loss, 4), cls: "lr-calc-cell" },
                { tex: String(r.predClass), cls: "lr-calc-cell" }
            ]),
            [
                { rawText: "average / acc" },
                { rawText: "" },
                { rawText: "" },
                { rawText: "" },
                { rawText: "" },
                { rawText: "" },
                { tex: `\\htmlClass{lr-tok-err}{${fmtNum(afterLoss, 4)}}`, cls: "lr-calc-cell" },
                { tex: `${afterCorrect}/${n}\\;(${fmtNum((afterCorrect / n) * 100, 1)}\\%)`, cls: "lr-calc-cell" }
            ]
        )
    );
    frag.appendChild(evalSec);

    frag.appendChild(makeArrow());
    const iterSec = makeSection("9. gradient descent iterations (0..4)");
    iterSec.appendChild(
        makeTexTable(
            [
                { tex: "\\text{iter}" },
                { tex: "w_0" },
                { tex: "w_1" },
                { tex: "\\text{avg log loss}" },
                { tex: "g_{w_0}" },
                { tex: "g_{w_1}" }
            ],
            trace.map((t) => [
                { tex: String(t.iter) },
                { tex: `\\htmlClass{lr-tok-w0}{${fmtNum(t.w0, 4)}}`, cls: "lr-calc-cell" },
                { tex: `\\htmlClass{lr-tok-w1}{${fmtNum(t.w1, 4)}}`, cls: "lr-calc-cell" },
                { tex: `\\htmlClass{lr-tok-err}{${fmtNum(t.avgLoss, 4)}}`, cls: "lr-calc-cell" },
                { tex: fmtNum(t.avgGw0, 4), cls: "lr-calc-cell" },
                { tex: fmtNum(t.avgGw1, 4), cls: "lr-calc-cell" }
            ])
        )
    );
    frag.appendChild(iterSec);

    container.appendChild(frag);
    if (typeof requestAnimationFrame !== "undefined") {
        requestAnimationFrame(drawLogRegArrows);
    } else {
        drawLogRegArrows();
    }
}
