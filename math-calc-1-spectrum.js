import { makeEl } from "./math-calc-1-tokens.js";
import { formatCBP4 } from "./math-format.js";

export function renderChromoSpectrum(n, d, xMin, xMax) {
    const container = document.getElementById("chromo-spectrum-section");
    if (!container) return;

    if (n === 0 || xMin === null || xMax === null) {
        container.textContent = "";
        container.classList.add("hidden");
        return;
    }

    container.textContent = "";
    container.classList.remove("hidden");

    const maxD = Math.pow(2, n) - 1;
    const ratio = maxD > 0 ? d / maxD : 0;
    const pct = Math.min(100, Math.max(0, ratio * 100));
    const deltaR = xMax - xMin;
    const curX = xMin + ratio * deltaR;

    const wrap = makeEl("div", "chromo-spectrum-wrap");

    const header = makeEl("div", "chromo-spectrum-header");
    const title = makeEl("h3", "chromo-spectrum-title", "Spektrum Ruang Fenotipe Kontinu");
    const subtitle = makeEl("p", "chromo-spectrum-subtitle", "Pemetaan dari ruang diskrit {0,1}ⁿ ke interval kompak [xₘᵢₙ, xₘₐₓ]");
    header.appendChild(title);
    header.appendChild(subtitle);
    wrap.appendChild(header);

    const trackContainer = makeEl("div", "chromo-spectrum-track-box");

    const pin = makeEl("div", "chromo-spectrum-pin");
    pin.style.left = `${pct}%`;

    const pinLabel = makeEl("div", "chromo-spectrum-pin-label");
    if (typeof katex !== "undefined") {
        katex.render(`x \\approx ${formatCBP4(curX)}`, pinLabel, { throwOnError: false });
    } else {
        pinLabel.textContent = `x = ${formatCBP4(curX)}`;
    }
    const pinPct = makeEl("div", "chromo-spectrum-pin-pct", `${pct.toFixed(2)}%`);
    pin.appendChild(pinLabel);
    pin.appendChild(pinPct);
    const pinPointer = makeEl("div", "chromo-spectrum-pin-arrow");
    pin.appendChild(pinPointer);
    trackContainer.appendChild(pin);

    const track = makeEl("div", "chromo-spectrum-bar");
    const fill = makeEl("div", "chromo-spectrum-fill");
    fill.style.width = `${pct}%`;
    track.appendChild(fill);
    trackContainer.appendChild(track);

    const boundsRow = makeEl("div", "chromo-spectrum-bounds");
    const leftBound = makeEl("div", "chromo-spectrum-bound-item chromo-spectrum-bound-left");
    const rightBound = makeEl("div", "chromo-spectrum-bound-item chromo-spectrum-bound-right");

    if (typeof katex !== "undefined") {
        const leftMath = makeEl("span", "chromo-token-xmin");
        katex.render(`x_{\\min} = ${formatCBP4(xMin)}`, leftMath, { throwOnError: false });
        leftBound.appendChild(leftMath);
        const rightMath = makeEl("span", "chromo-token-xmax");
        katex.render(`x_{\\max} = ${formatCBP4(xMax)}`, rightMath, { throwOnError: false });
        rightBound.appendChild(rightMath);
    } else {
        leftBound.textContent = `xmin = ${formatCBP4(xMin)}`;
        rightBound.textContent = `xmax = ${formatCBP4(xMax)}`;
    }

    const leftTag = makeEl("span", "chromo-spectrum-bound-tag", "All-0 (d = 0)");
    const rightTag = makeEl("span", "chromo-spectrum-bound-tag", `All-1 (d = ${maxD})`);
    leftBound.appendChild(leftTag);
    rightBound.appendChild(rightTag);

    boundsRow.appendChild(leftBound);
    boundsRow.appendChild(rightBound);
    trackContainer.appendChild(boundsRow);
    wrap.appendChild(trackContainer);

    const badgeGrid = makeEl("div", "chromo-spectrum-badges");

    const badgeZero = makeEl("div", "chromo-spectrum-badge");
    const zeroTitle = makeEl("div", "chromo-spectrum-badge-title", "Kondisi Batas Minimum (All-0)");
    const zeroMath = makeEl("div", "chromo-spectrum-badge-math");
    if (typeof katex !== "undefined") {
        katex.render(`d = 0 \\implies x = x_{\\min}`, zeroMath, { throwOnError: false });
    } else {
        zeroMath.textContent = "d = 0 => x = xmin";
    }
    const zeroStatus = makeEl("div", "chromo-spectrum-badge-status chromo-status-valid", "✓ Terverifikasi Eksak");
    badgeZero.appendChild(zeroTitle);
    badgeZero.appendChild(zeroMath);
    badgeZero.appendChild(zeroStatus);

    const badgePos = makeEl("div", "chromo-spectrum-badge");
    const posTitle = makeEl("div", "chromo-spectrum-badge-title", "Posisi Fenotipe Saat Ini");
    const posMath = makeEl("div", "chromo-spectrum-badge-math");
    if (typeof katex !== "undefined") {
        katex.render(`\\frac{d}{2^n - 1} = \\frac{${d}}{${maxD}} = ${(ratio * 100).toFixed(2)}\\%`, posMath, { throwOnError: false });
    } else {
        posMath.textContent = `d/(2^n - 1) = ${(ratio * 100).toFixed(2)}%`;
    }
    const posStatus = makeEl("div", "chromo-spectrum-badge-status", `Offset: +${formatCBP4(ratio * deltaR)}`);
    badgePos.appendChild(posTitle);
    badgePos.appendChild(posMath);
    badgePos.appendChild(posStatus);

    const badgeOne = makeEl("div", "chromo-spectrum-badge");
    const oneTitle = makeEl("div", "chromo-spectrum-badge-title", "Kondisi Batas Maksimum (All-1)");
    const oneMath = makeEl("div", "chromo-spectrum-badge-math");
    if (typeof katex !== "undefined") {
        katex.render(`d = 2^n - 1 \\implies x = x_{\\max}`, oneMath, { throwOnError: false });
    } else {
        oneMath.textContent = "d = 2^n - 1 => x = xmax";
    }
    const oneStatus = makeEl("div", "chromo-spectrum-badge-status chromo-status-valid", "✓ Terverifikasi Eksak");
    badgeOne.appendChild(oneTitle);
    badgeOne.appendChild(oneMath);
    badgeOne.appendChild(oneStatus);

    badgeGrid.appendChild(badgeZero);
    badgeGrid.appendChild(badgePos);
    badgeGrid.appendChild(badgeOne);
    wrap.appendChild(badgeGrid);

    container.appendChild(wrap);
}
