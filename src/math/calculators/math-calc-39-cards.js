import { fmtNum } from "./math-calc-39-engine.js";
import { bindLrTokenHover } from "./math-calc-39-diagram.js";

function makeEl(tag, className, textContent) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (textContent !== undefined) el.textContent = textContent;
    return el;
}

function renderTex(tex, el, displayMode = true) {
    if (typeof katex !== "undefined") {
        katex.render(tex, el, { throwOnError: false, trust: true, displayMode });
    } else {
        el.textContent = tex;
    }
}

function makeArrow() {
    return makeEl("div", "lr-step-arrow", "↓");
}

function makeStepCard(variantClass, mathTex, subnoteText = "", isError = false) {
    const card = makeEl("div", `lr-step-card ${variantClass}`);
    const mathBox = makeEl("div", "lr-step-math");
    renderTex(mathTex, mathBox, true);
    card.appendChild(mathBox);
    if (subnoteText) {
        const sub = makeEl("div", isError ? "lr-card-subnote lr-subnote-warn" : "lr-card-subnote", subnoteText);
        card.appendChild(sub);
    }
    return card;
}

function buildOlsFlow(ols) {
    const frag = document.createDocumentFragment();

    if (!ols || !ols.valid) {
        frag.appendChild(
            makeStepCard(
                "lr-step-rounded",
                "w_1 = \\frac{S_{xy}}{S_{xx}}, \\quad w_0 = \\bar{y} - w_1\\bar{x}",
                ols?.reason || "Masukkan minimal 2 titik dengan nilai x berbeda.",
                true
            )
        );
        frag.appendChild(makeArrow());
        frag.appendChild(makeStepCard("lr-step-result", "\\hat{y} \\approx ?", "Menunggu data valid"));
        return frag;
    }

    const { w1, w0, sxy, sxx, meanX, meanY, sse, mse, mae, r2, query, checks } = ols;
    const tokW1 = `\\htmlClass{lr-tok-w1}{${fmtNum(w1, 3)}}`;
    const tokW0 = `\\htmlClass{lr-tok-w0}{${fmtNum(w0, 3)}}`;
    const tokSxy = `\\htmlClass{lr-tok-w0}{${fmtNum(sxy, 3)}}`;
    const tokSxx = `\\htmlClass{lr-tok-w1}{${fmtNum(sxx, 3)}}`;
    const tokQx = `\\htmlClass{lr-tok-w1}{${fmtNum(query.x, 3)}}`;
    const tokQy = `\\htmlClass{lr-tok-y}{${fmtNum(query.yHat, 3)}}`;

    const c1Math = `w_1 = \\frac{${tokSxy}}{${tokSxx}} = ${tokW1}`;
    const c1Sub = `Slope ${w1 >= 0 ? "+" : ""}${fmtNum(w1, 3)}: tiap +1 x berasosiasi ${w1 >= 0 ? "+" : ""}${fmtNum(w1, 3)} y`;
    frag.appendChild(makeStepCard("lr-step-rounded", c1Math, c1Sub));
    frag.appendChild(makeArrow());

    const meanXWrap = meanX < 0 ? `(${fmtNum(meanX, 3)})` : fmtNum(meanX, 3);
    const w1Wrap = w1 < 0 ? `(${fmtNum(w1, 3)})` : fmtNum(w1, 3);
    const prodW1MeanX = w1 * meanX;
    const diffStr = prodW1MeanX < 0 ? `+ ${fmtNum(Math.abs(prodW1MeanX), 3)}` : `- ${fmtNum(prodW1MeanX, 3)}`;
    const c2Math = `w_0 = ${fmtNum(meanY, 3)} - ${w1Wrap}(${meanXWrap}) = ${fmtNum(meanY, 3)} ${diffStr} = ${tokW0}`;
    const c2Sub = `Intercept garis pada sumbu tegak x = 0`;
    frag.appendChild(makeStepCard("lr-step-rect", c2Math, c2Sub));
    frag.appendChild(makeArrow());

    const w1Signed = w1 < 0 ? `- ${fmtNum(Math.abs(w1), 3)}` : `+ ${fmtNum(w1, 3)}`;
    const c3Math = `\\htmlClass{lr-tok-y}{\\hat{y}} = ${tokW0} ${w1Signed}\\,x`;
    const c1Ok = checks.passesCentroid ? "Lulus" : "Cek";
    const c2Ok = checks.residualsSumZero ? "Lulus" : "Cek";
    const c3Sub = `Check 1 (x̄, ȳ): ${fmtNum(checks.yAtMeanX, 2)} (${c1Ok})  ·  Check 2 (∑e): ${fmtNum(checks.sumResidual, 2)} (${c2Ok})`;
    frag.appendChild(makeStepCard("lr-step-rect", c3Math, c3Sub));
    frag.appendChild(makeArrow());

    const contrib = w1 * query.x;
    const contribStr = contrib < 0 ? `- ${fmtNum(Math.abs(contrib), 3)}` : `+ ${fmtNum(contrib, 3)}`;
    const qxWrap = query.x < 0 ? `(${tokQx})` : tokQx;
    const c4Math = `\\hat{y}(${tokQx}) = ${tokW0} ${w1Signed}(${qxWrap}) = ${tokW0} ${contribStr}`;
    const extrapTxt = query.isExtrapolation
        ? `Ekstrapolasi: x = ${fmtNum(query.x, 3)} di luar rentang latih [${fmtNum(query.minX, 2)}, ${fmtNum(query.maxX, 2)}]`
        : `Interpolasi: x = ${fmtNum(query.x, 3)} berada di dalam rentang [${fmtNum(query.minX, 2)}, ${fmtNum(query.maxX, 2)}]`;
    frag.appendChild(makeStepCard("lr-step-rect", c4Math, extrapTxt, query.isExtrapolation));
    frag.appendChild(makeArrow());

    const isExact = Number.isInteger(query.yHat) || parseFloat(query.yHat.toFixed(3)) === query.yHat;
    const sym = isExact ? "=" : "\\approx";
    const c5Math = `\\htmlClass{lr-tok-y}{\\hat{y}} ${sym} ${tokQy}`;
    const c5Sub = `SSE = ${fmtNum(sse, 3)}  ·  MSE = ${fmtNum(mse, 3)}  ·  MAE = ${fmtNum(mae, 3)}  ·  R² = ${fmtNum(r2, 4)}`;
    frag.appendChild(makeStepCard("lr-step-result", c5Math, c5Sub));

    return frag;
}

function buildGdFlow(gdState, ols, lrVal) {
    const frag = document.createDocumentFragment();
    if (!gdState) return frag;

    const mseStr = gdState.diverged ? "\\infty" : `\\htmlClass{lr-tok-err}{${fmtNum(gdState.mse, 4)}}`;
    const optNote = ols?.valid
        ? `Iterasi ${gdState.iter}  ·  Target OLS MSE* = ${fmtNum(ols.mse, 4)}`
        : `Iterasi ${gdState.iter}`;
    frag.appendChild(
        makeStepCard(
            "lr-step-rounded",
            `L(\\theta) = \\frac{1}{n}\\sum (\\hat{y}_i - y_i)^2 = ${mseStr}`,
            gdState.diverged ? "Divergen: turunkan Learning Rate atau aktifkan Standardisasi z" : optNote,
            gdState.diverged
        )
    );
    frag.appendChild(makeArrow());

    const paramSym0 = gdState.standardise ? "\\theta_0" : "w_0";
    const paramSym1 = gdState.standardise ? "\\theta_1" : "w_1";
    const gradTex = `\\frac{\\partial L}{\\partial ${paramSym0}} = ${fmtNum(gdState.grad0, 4)}, \\quad \\frac{\\partial L}{\\partial ${paramSym1}} = ${fmtNum(gdState.grad1, 4)}`;
    const scaleNote = gdState.standardise
        ? `Standardisasi z-score aktif  ·  Laju α = ${fmtNum(lrVal, 4)}`
        : `Tanpa standardisasi (fitur asli)  ·  Laju α = ${fmtNum(lrVal, 4)}`;
    frag.appendChild(makeStepCard("lr-step-rect", gradTex, scaleNote));
    frag.appendChild(makeArrow());

    const updTex = `${paramSym0} = \\htmlClass{lr-tok-w0}{${fmtNum(gdState.theta0, 4)}}, \\quad ${paramSym1} = \\htmlClass{lr-tok-w1}{${fmtNum(gdState.theta1, 4)}}`;
    frag.appendChild(
        makeStepCard("lr-step-rect", updTex, "Pembaruan serentak memakai gradien langkah sebelumnya")
    );
    frag.appendChild(makeArrow());

    const signW1 = gdState.w1 < 0 ? `- ${fmtNum(Math.abs(gdState.w1), 3)}` : `+ ${fmtNum(gdState.w1, 3)}`;
    const eqTex = `\\htmlClass{lr-tok-y}{\\hat{y}} = \\htmlClass{lr-tok-w0}{${fmtNum(gdState.w0, 3)}} ${signW1}\\,x`;
    const olsRef = ols?.valid
        ? `Target OLS: w0* = ${fmtNum(ols.w0, 3)}  ·  w1* = ${fmtNum(ols.w1, 3)}`
        : "";
    frag.appendChild(makeStepCard("lr-step-result", eqTex, olsRef));

    const recent = gdState.history.slice(-6);
    if (recent.length > 0) {
        const histBox = makeEl("div", "lr-gd-trace");
        const head = makeEl("div", "lr-gd-trace-row lr-gd-trace-head");
        head.append(makeEl("span", "", "iter"), makeEl("span", "", "w0"), makeEl("span", "", "w1"), makeEl("span", "", "MSE"));
        histBox.appendChild(head);
        for (const h of recent) {
            const row = makeEl("div", "lr-gd-trace-row");
            row.append(
                makeEl("span", "", String(h.iter)),
                makeEl("span", "", fmtNum(h.w0, 2)),
                makeEl("span", "", fmtNum(h.w1, 2)),
                makeEl("span", "", fmtNum(h.mse, 3))
            );
            histBox.appendChild(row);
        }
        frag.appendChild(histBox);
    }

    return frag;
}

export function renderLRSteps({ mode, ols, gdState, lr }) {
    const container = document.getElementById("math39-steps-container");
    if (!container) return;
    container.textContent = "";
    const content = mode === "gd" ? buildGdFlow(gdState, ols, lr) : buildOlsFlow(ols);
    container.appendChild(content);
    bindLrTokenHover();
}
