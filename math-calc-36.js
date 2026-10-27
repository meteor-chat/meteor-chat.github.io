import { refs } from "./dom-refs.js";
import { drawVacMeter, clearVisual36 } from "./math-visual-36.js";

let resizeBound = false;

export function updatePm12Lines() {
    const container = document.getElementById("pm12-flow-container");
    const svg = document.getElementById("pm12-flow-svg");
    const inBac = refs.m36InBac || document.getElementById("math36-in-bac");
    const inEac = refs.m36InEac || document.getElementById("math36-in-eac");
    const targetBac = document.getElementById("pm12-bac");
    const targetEac = document.getElementById("pm12-eac");
    const pathBac = document.getElementById("pm12-path-bac");
    const pathEac = document.getElementById("pm12-path-eac");

    if (!container || !svg || !inBac || !inEac || !targetBac || !targetEac || !pathBac || !pathEac) return;

    const cRect = container.getBoundingClientRect();
    if (cRect.width === 0 || cRect.height === 0) return;

    svg.setAttribute("viewBox", `0 0 ${cRect.width} ${cRect.height}`);

    const bacRect = inBac.getBoundingClientRect();
    const eacRect = inEac.getBoundingClientRect();
    const tBacRect = targetBac.getBoundingClientRect();
    const tEacRect = targetEac.getBoundingClientRect();

    const x1Bac = bacRect.right - cRect.left;
    const y1Bac = bacRect.top + bacRect.height / 2 - cRect.top;
    const x2Bac = tBacRect.left - cRect.left - 4;
    const y2Bac = tBacRect.top + tBacRect.height / 2 - cRect.top;

    const x1Eac = eacRect.right - cRect.left;
    const y1Eac = eacRect.top + eacRect.height / 2 - cRect.top;
    const x2Eac = tEacRect.left + tEacRect.width / 2 - cRect.left;
    const y2Eac = tEacRect.bottom - cRect.top + 5;

    if (x2Bac > x1Bac + 10) {
        const dxBac = (x2Bac - x1Bac) * 0.55;
        pathBac.setAttribute("d", `M ${x1Bac} ${y1Bac} C ${x1Bac + dxBac} ${y1Bac}, ${x2Bac - dxBac} ${y2Bac}, ${x2Bac} ${y2Bac}`);
        pathBac.style.display = "";
    } else {
        pathBac.style.display = "none";
    }

    if (x2Eac > x1Eac + 10) {
        const yClear = Math.max(y1Eac, tBacRect.bottom - cRect.top, tEacRect.bottom - cRect.top) + 14;
        pathEac.setAttribute("d", `M ${x1Eac} ${y1Eac} C ${x1Eac + (x2Eac - x1Eac) * 0.45} ${yClear}, ${x2Eac} ${yClear}, ${x2Eac} ${y2Eac}`);
        pathEac.style.display = "";
    } else {
        pathEac.style.display = "none";
    }
}

function bindResize() {
    if (resizeBound) return;
    resizeBound = true;
    window.addEventListener("resize", () => {
        updatePm12Lines();
    }, { passive: true });
}

export function calculateMath36() {
    bindResize();
    const errEl = document.getElementById("pm12-error-msg");
    const pathBac = document.getElementById("pm12-path-bac");
    const pathEac = document.getElementById("pm12-path-eac");

    if (!refs.m36Steps) return;
    if (!refs.m36InBac || !refs.m36InEac) return;

    const rawBac = refs.m36InBac.value.trim();
    const rawEac = refs.m36InEac.value.trim();

    if (rawBac === "" || rawEac === "") {
        refs.m36Steps.textContent = "";
        if (pathBac) pathBac.style.display = "none";
        if (pathEac) pathEac.style.display = "none";
        if (errEl) errEl.classList.add("hidden");
        clearVisual36();
        return;
    }

    const bac = parseFloat(rawBac);
    const eac = parseFloat(rawEac);

    if (isNaN(bac) || isNaN(eac) || bac < 0 || eac < 0) {
        refs.m36Steps.textContent = "";
        if (pathBac) pathBac.style.display = "none";
        if (pathEac) pathEac.style.display = "none";
        if (errEl) {
            errEl.textContent = "Input BAC dan EAC harus berupa angka positif yang valid.";
            errEl.classList.remove("hidden");
        }
        clearVisual36();
        return;
    }

    if (errEl) errEl.classList.add("hidden");

    const vac = bac - eac;
    const vacNumStr = Number(vac.toFixed(2)).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    const vacTexStr = vac < 0 ? `-\\text{\\$${Math.abs(vac).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).replace(/,/g, "{,}")}}` : `\\text{\\$${vacNumStr.replace(/,/g, "{,}")}}`;

    const bacNumStr = Number(bac.toFixed(2)).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    const bacTexStr = `\\text{\\$${bacNumStr.replace(/,/g, "{,}")}}`;

    const eacNumStr = Number(eac.toFixed(2)).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    const eacTexStr = `\\text{\\$${eacNumStr.replace(/,/g, "{,}")}}`;

    const tex = `\\htmlId{pm12-bac}{${bacTexStr}} - \\htmlId{pm12-eac}{${eacTexStr}} = \\mathbf{${vacTexStr}}`;

    if (typeof katex !== "undefined") {
        katex.render(tex, refs.m36Steps, { throwOnError: false, trust: true, displayMode: false });
    } else {
        refs.m36Steps.textContent = tex;
    }

    updatePm12Lines();
    requestAnimationFrame(updatePm12Lines);
    drawVacMeter(bac, eac, vac);
}
