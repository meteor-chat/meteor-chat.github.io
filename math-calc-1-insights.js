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
    const title = makeEl("h3", "chromo-insights-title", "Penjelasan & Fakta Penting");
    const subtitle = makeEl("p", "chromo-insights-subtitle", "Keterangan ukuran langkah, ketelitian, dan sifat angka biner");
    header.appendChild(title);
    header.appendChild(subtitle);
    wrap.appendChild(header);

    const grid = makeEl("div", "chromo-insights-grid");

    const card1 = makeEl("div", "chromo-insight-card");
    const c1Head = makeEl("div", "chromo-insight-card-head");
    c1Head.appendChild(makeEl("span", "chromo-insight-tag", "Ketelitian"));
    c1Head.appendChild(makeEl("h4", "chromo-insight-card-title", "Ukuran Langkah & Batas Ralat"));
    card1.appendChild(c1Head);
    const c1Body = makeEl("div", "chromo-insight-card-body");
    const c1Math1 = makeEl("div", "chromo-insight-math-row");
    if (typeof katex !== "undefined") {
        katex.render(`\\Delta x = \\frac{${formatCBP4(deltaR)}}{${den}} \\approx ${formatCBP4(stepSize)} \\text{ (tiap 1 langkah)}`, c1Math1, { throwOnError: false });
    } else {
        c1Math1.textContent = `Δx = ${formatCBP4(stepSize)}`;
    }
    c1Body.appendChild(c1Math1);
    const c1Math2 = makeEl("div", "chromo-insight-math-row");
    if (typeof katex !== "undefined") {
        katex.render(`\\text{Batas Ralat} = \\pm\\frac{\\Delta x}{2} \\approx \\pm ${formatCBP4(errorBound)}`, c1Math2, { throwOnError: false });
    } else {
        c1Math2.textContent = `Batas Ralat = ±${formatCBP4(errorBound)}`;
    }
    c1Body.appendChild(c1Math2);
    const c1Desc = makeEl("p", "chromo-insight-desc", `Ada ${powVal.toLocaleString()} kemungkinan nilai. Tiap naik 1 desimal, nilai x bertambah ${formatCBP4(stepSize)}. Jika gen ditambah 1 bit, jarak langkah menjadi 2 kali lebih rapat (lebih teliti).`);
    c1Body.appendChild(c1Desc);
    card1.appendChild(c1Body);
    grid.appendChild(card1);

    const card2 = makeEl("div", "chromo-insight-card");
    const c2Head = makeEl("div", "chromo-insight-card-head");
    c2Head.appendChild(makeEl("span", hasCliff ? "chromo-insight-tag chromo-tag-warn" : "chromo-insight-tag chromo-tag-ok", hasCliff ? "Tebing Hamming" : "Mulus"));
    c2Head.appendChild(makeEl("h4", "chromo-insight-card-title", "Perubahan Bit ke Angka Sebelah"));
    card2.appendChild(c2Head);
    const c2Body = makeEl("div", "chromo-insight-card-body");
    const c2Info = makeEl("div", "chromo-insight-cliff-info");
    if (prevDist !== null) {
        const rowP = makeEl("div", "chromo-cliff-row", `Angka ${d - 1} (${prevBin}): beda ${prevDist} bit`);
        c2Info.appendChild(rowP);
    }
    if (nextDist !== null) {
        const rowN = makeEl("div", "chromo-cliff-row", `Angka ${d + 1} (${nextBin}): beda ${nextDist} bit`);
        c2Info.appendChild(rowN);
    }
    c2Body.appendChild(c2Info);
    const c2Status = makeEl(
        "div",
        hasCliff ? "chromo-cliff-alert chromo-alert-danger" : "chromo-cliff-alert chromo-alert-success",
        hasCliff
            ? "⚠️ Ada Tebing Hamming: Untuk pindah ke angka sebelah, harus mengubah lebih dari 1 bit sekaligus. Mutasi 1 bit biasa tidak bisa langsung sampai ke angka ini."
            : "✓ Mulus: Untuk pindah ke angka sebelah, cukup mengubah 1 bit saja."
    );
    c2Body.appendChild(c2Status);
    card2.appendChild(c2Body);
    grid.appendChild(card2);

    const card3 = makeEl("div", "chromo-insight-card");
    const c3Head = makeEl("div", "chromo-insight-card-head");
    c3Head.appendChild(makeEl("span", "chromo-insight-tag", "Kode Gray"));
    c3Head.appendChild(makeEl("h4", "chromo-insight-card-title", "Bentuk Kode Gray (Tanpa Tebing)"));
    card3.appendChild(c3Head);
    const c3Body = makeEl("div", "chromo-insight-card-body");
    const c3CodeRow = makeEl("div", "chromo-insight-code-compare");
    const binerBox = makeEl("div", "chromo-code-box");
    binerBox.appendChild(makeEl("span", "chromo-code-lbl", "Biner:"));
    binerBox.appendChild(makeEl("code", "chromo-code-val", curBin));
    const grayBox = makeEl("div", "chromo-code-box");
    grayBox.appendChild(makeEl("span", "chromo-code-lbl", "Kode Gray:"));
    grayBox.appendChild(makeEl("code", "chromo-code-val chromo-val-highlight", curGray));
    c3CodeRow.appendChild(binerBox);
    c3CodeRow.appendChild(grayBox);
    c3Body.appendChild(c3CodeRow);
    const c3Desc = makeEl("p", "chromo-insight-desc", "Pada Kode Gray, dua angka yang bersebelahan selalu hanya berbeda 1 bit saja. Tidak ada tebing, sehingga mutasi 1 bit selalu bisa pindah ke angka terdekat.");
    c3Body.appendChild(c3Desc);
    card3.appendChild(c3Body);
    grid.appendChild(card3);

    const card4 = makeEl("div", "chromo-insight-card");
    const c4Head = makeEl("div", "chromo-insight-card-head");
    c4Head.appendChild(makeEl("span", "chromo-insight-tag chromo-tag-warn", "Penting"));
    c4Head.appendChild(makeEl("h4", "chromo-insight-card-title", "Kenapa Harus Dibagi (2ⁿ - 1)?"));
    card4.appendChild(c4Head);
    const c4Body = makeEl("div", "chromo-insight-card-body");
    const missingGap = deltaR / powVal;
    const c4Math = makeEl("div", "chromo-insight-math-row");
    if (typeof katex !== "undefined") {
        katex.render(`\\text{Jika salah dibagi } 2^n \\implies x \\text{ hanya sampai } ${formatCBP4(xMax - missingGap)}`, c4Math, { throwOnError: false });
    } else {
        c4Math.textContent = `Jika salah dibagi 2^n => x hanya sampai ${formatCBP4(xMax - missingGap)}`;
    }
    c4Body.appendChild(c4Math);
    const c4Desc = makeEl("p", "chromo-insight-desc", `Ibarat ${powVal} tiang pagar hanya memiliki ${den} celah. Jika dibagi ${powVal}, nilai x saat semua bit 1 tidak akan pernah sampai ke batas atas (${formatCBP4(xMax)}). Karena itu, pembaginya harus ${den} agar pas mencapai batas atas.`);
    c4Body.appendChild(c4Desc);
    card4.appendChild(c4Body);
    grid.appendChild(card4);

    wrap.appendChild(grid);
    container.appendChild(wrap);
}
