import { makeEl } from "./math-calc-1-tokens.js";
import { formatCBP4 } from "./math-format.js";

function getHammingDistance(binA, binB) {
    let dist = 0;
    const len = Math.max(binA.length, binB.length);
    const a = binA.padStart(len, "0");
    const b = binB.padStart(len, "0");
    for (let i = 0; i < len; i++) {
        if (a[i] !== b[i]) dist++;
    }
    return dist;
}

function binaryToGray(d, n) {
    const gray = d ^ (d >> 1);
    return gray.toString(2).padStart(n, "0");
}

export function renderChromoInsights(n, d, xMin, xMax, currentBits) {
    const container = document.getElementById("chromo-insights-section");
    if (!container) return;

    if (n === 0 || xMin === null || xMax === null) {
        container.textContent = "";
        container.classList.add("hidden");
        return;
    }

    container.textContent = "";
    container.classList.remove("hidden");

    const powVal = Math.pow(2, n);
    const den = powVal - 1;
    const deltaR = xMax - xMin;
    const stepSize = deltaR / den;
    const errorBound = stepSize / 2;

    const curBin = currentBits.join("");
    const curGray = binaryToGray(d, n);

    let prevDist = null;
    let nextDist = null;
    let prevBin = "";
    let nextBin = "";

    if (d > 0) {
        prevBin = (d - 1).toString(2).padStart(n, "0");
        prevDist = getHammingDistance(curBin, prevBin);
    }
    if (d < den) {
        nextBin = (d + 1).toString(2).padStart(n, "0");
        nextDist = getHammingDistance(curBin, nextBin);
    }

    const hasCliff = (prevDist !== null && prevDist > 1) || (nextDist !== null && nextDist > 1);

    const wrap = makeEl("div", "chromo-insights-wrap");

    const header = makeEl("div", "chromo-insights-header");
    const title = makeEl("h3", "chromo-insights-title", "Panel Intelijen Genetik & Analisis Metaheuristik");
    const subtitle = makeEl("p", "chromo-insights-subtitle", "Dekomposisi resolusi kisi, batas galat kuantisasi, dan evaluasi topologi ruang pencarian");
    header.appendChild(title);
    header.appendChild(subtitle);
    wrap.appendChild(header);

    const grid = makeEl("div", "chromo-insights-grid");

    const card1 = makeEl("div", "chromo-insight-card");
    const c1Head = makeEl("div", "chromo-insight-card-head");
    c1Head.appendChild(makeEl("span", "chromo-insight-tag", "Kuantisasi"));
    c1Head.appendChild(makeEl("h4", "chromo-insight-card-title", "Resolusi Kisi & Batas Galat"));
    card1.appendChild(c1Head);
    const c1Body = makeEl("div", "chromo-insight-card-body");
    const c1Math1 = makeEl("div", "chromo-insight-math-row");
    if (typeof katex !== "undefined") {
        katex.render(`\\Delta x = \\frac{${formatCBP4(deltaR)}}{${den}} \\approx ${formatCBP4(stepSize)}`, c1Math1, { throwOnError: false });
    } else {
        c1Math1.textContent = `Δx = ${formatCBP4(stepSize)}`;
    }
    c1Body.appendChild(c1Math1);
    const c1Math2 = makeEl("div", "chromo-insight-math-row");
    if (typeof katex !== "undefined") {
        katex.render(`\\epsilon_{\\max} = \\pm\\frac{\\Delta x}{2} \\approx \\pm ${formatCBP4(errorBound)}`, c1Math2, { throwOnError: false });
    } else {
        c1Math2.textContent = `ε_max = ±${formatCBP4(errorBound)}`;
    }
    c1Body.appendChild(c1Math2);
    const c1Desc = makeEl("p", "chromo-insight-desc", `Ruang pencarian terdiri dari tepat 2ⁿ = ${powVal.toLocaleString()} keadaan diskrit. Menambah 1 bit akan melipatgandakan ruang pencarian sekaligus memotong ukuran langkah (Δx) menjadi separuh.`);
    c1Body.appendChild(c1Desc);
    card1.appendChild(c1Body);
    grid.appendChild(card1);

    const card2 = makeEl("div", "chromo-insight-card");
    const c2Head = makeEl("div", "chromo-insight-card-head");
    c2Head.appendChild(makeEl("span", hasCliff ? "chromo-insight-tag chromo-tag-warn" : "chromo-insight-tag chromo-tag-ok", hasCliff ? "Hamming Cliff" : "Topologi Mulus"));
    c2Head.appendChild(makeEl("h4", "chromo-insight-card-title", "Pemeriksaan Tebing Hamming"));
    card2.appendChild(c2Head);
    const c2Body = makeEl("div", "chromo-insight-card-body");
    const c2Info = makeEl("div", "chromo-insight-cliff-info");
    if (prevDist !== null) {
        const rowP = makeEl("div", "chromo-cliff-row", `Tetangga d-1 (${d - 1}): ${prevBin} → Jarak: ${prevDist} bit`);
        c2Info.appendChild(rowP);
    }
    if (nextDist !== null) {
        const rowN = makeEl("div", "chromo-cliff-row", `Tetangga d+1 (${d + 1}): ${nextBin} → Jarak: ${nextDist} bit`);
        c2Info.appendChild(rowN);
    }
    c2Body.appendChild(c2Info);
    const c2Status = makeEl(
        "div",
        hasCliff ? "chromo-cliff-alert chromo-alert-danger" : "chromo-cliff-alert chromo-alert-success",
        hasCliff
            ? "⚠️ Hamming Cliff: Perpindahan ke tetangga integer terdekat memerlukan lebih dari 1 bit flip. Satu mutasi titik acak tidak dapat menjangkau tetangga ini secara langsung."
            : "✓ Topologi Mulus: Transisi ke tetangga terdekat hanya memerlukan 1 bit flip."
    );
    c2Body.appendChild(c2Status);
    card2.appendChild(c2Body);
    grid.appendChild(card2);

    const card3 = makeEl("div", "chromo-insight-card");
    const c3Head = makeEl("div", "chromo-insight-card-head");
    c3Head.appendChild(makeEl("span", "chromo-insight-tag", "Gray Code"));
    c3Head.appendChild(makeEl("h4", "chromo-insight-card-title", "Ekuivalen Refleksi Gray Code"));
    card3.appendChild(c3Head);
    const c3Body = makeEl("div", "chromo-insight-card-body");
    const c3CodeRow = makeEl("div", "chromo-insight-code-compare");
    const binerBox = makeEl("div", "chromo-code-box");
    binerBox.appendChild(makeEl("span", "chromo-code-lbl", "Biner Standar:"));
    binerBox.appendChild(makeEl("code", "chromo-code-val", curBin));
    const grayBox = makeEl("div", "chromo-code-box");
    grayBox.appendChild(makeEl("span", "chromo-code-lbl", "Gray Code:"));
    grayBox.appendChild(makeEl("code", "chromo-code-val chromo-val-highlight", curGray));
    c3CodeRow.appendChild(binerBox);
    c3CodeRow.appendChild(grayBox);
    c3Body.appendChild(c3CodeRow);
    const c3Desc = makeEl("p", "chromo-insight-desc", "Pada representasi Gray Code (g = b ⊕ (b ≫ 1)), setiap pasangan integer yang bersebelahan selalu berbeda tepat 1 bit. Ini menghapus fenomena Hamming Cliff secara permanen.");
    c3Body.appendChild(c3Desc);
    card3.appendChild(c3Body);
    grid.appendChild(card3);

    const card4 = makeEl("div", "chromo-insight-card");
    const c4Head = makeEl("div", "chromo-insight-card-head");
    c4Head.appendChild(makeEl("span", "chromo-insight-tag chromo-tag-warn", "Ujian CBP 1"));
    c4Head.appendChild(makeEl("h4", "chromo-insight-card-title", "Fencepost Problem: Mengapa 2ⁿ - 1?"));
    card4.appendChild(c4Head);
    const c4Body = makeEl("div", "chromo-insight-card-body");
    const missingGap = deltaR / powVal;
    const c4Math = makeEl("div", "chromo-insight-math-row");
    if (typeof katex !== "undefined") {
        katex.render(`\\text{Gap Hilang} = \\frac{\\Delta R}{2^n} = \\frac{${formatCBP4(deltaR)}}{${powVal}} = ${formatCBP4(missingGap)}`, c4Math, { throwOnError: false });
    } else {
        c4Math.textContent = `Gap Hilang = ΔR / 2^n = ${formatCBP4(missingGap)}`;
    }
    c4Body.appendChild(c4Math);
    const c4Desc = makeEl("p", "chromo-insight-desc", `Jika rumus dibagi dengan 2ⁿ (${powVal}), kromosom all-1 hanya akan mencapai x = ${formatCBP4(xMax - missingGap)} dan tidak akan pernah menyentuh xₘₐₓ. Sebanyak 2ⁿ titik diskrit membentuk tepat 2ⁿ - 1 interval segmen seragam.`);
    c4Body.appendChild(c4Desc);
    card4.appendChild(c4Body);
    grid.appendChild(card4);

    wrap.appendChild(grid);
    container.appendChild(wrap);
}
