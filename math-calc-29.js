import { refs } from "./dom-refs.js";
import { drawCvMeter, clearVisual29 } from "./math-visual-29.js";

let resizeBound = false;

function formatCurrency(n) {
    return "\\$" + Number(n).toLocaleString("id-ID");
}

export function updatePm5Lines() {
    const container = document.getElementById("pm5-flow-container");
    const svg = document.getElementById("pm5-flow-svg");
    const inEv = refs.m29InEv || document.getElementById("math29-in-ev");
    const inAc = refs.m29InAc || document.getElementById("math29-in-ac");
    const targetEv = document.getElementById("pm5-ev");
    const targetAc = document.getElementById("pm5-ac");
    const pathEv = document.getElementById("pm5-path-ev");
    const pathAc = document.getElementById("pm5-path-ac");

    if (!container || !svg || !inEv || !inAc || !targetEv || !targetAc || !pathEv || !pathAc) return;

    const cRect = container.getBoundingClientRect();
    if (cRect.width === 0 || cRect.height === 0) return;

    svg.setAttribute("viewBox", `0 0 ${cRect.width} ${cRect.height}`);

    const evRect = inEv.getBoundingClientRect();
    const acRect = inAc.getBoundingClientRect();
    const tEvRect = targetEv.getBoundingClientRect();
    const tAcRect = targetAc.getBoundingClientRect();

    const x1Ev = evRect.right - cRect.left;
    const y1Ev = evRect.top + evRect.height / 2 - cRect.top;
    const x2Ev = tEvRect.left - cRect.left - 4;
    const y2Ev = tEvRect.top + tEvRect.height / 2 - cRect.top;

    const x1Ac = acRect.right - cRect.left;
    const y1Ac = acRect.top + acRect.height / 2 - cRect.top;
    const x2Ac = tAcRect.left - cRect.left - 4;
    const y2Ac = tAcRect.top + tAcRect.height / 2 - cRect.top;

    if (x2Ev > x1Ev + 10) {
        const dxEv = (x2Ev - x1Ev) * 0.55;
        pathEv.setAttribute("d", `M ${x1Ev} ${y1Ev} C ${x1Ev + dxEv} ${y1Ev}, ${x2Ev - dxEv} ${y2Ev}, ${x2Ev} ${y2Ev}`);
        pathEv.style.display = "";
    } else {
        pathEv.style.display = "none";
    }

    if (x2Ac > x1Ac + 10) {
        const dxAc = (x2Ac - x1Ac) * 0.55;
        pathAc.setAttribute("d", `M ${x1Ac} ${y1Ac} C ${x1Ac + dxAc} ${y1Ac}, ${x2Ac - dxAc} ${y2Ac}, ${x2Ac} ${y2Ac}`);
        pathAc.style.display = "";
    } else {
        pathAc.style.display = "none";
    }
}

function bindResize() {
    if (resizeBound) return;
    resizeBound = true;
    window.addEventListener("resize", () => {
        updatePm5Lines();
    }, { passive: true });
}

export function calculateMath29() {
    bindResize();
    const errEl = document.getElementById("pm5-error-msg");
    const pathEv = document.getElementById("pm5-path-ev");
    const pathAc = document.getElementById("pm5-path-ac");

    if (!refs.m29Steps) return;
    if (!refs.m29InEv || !refs.m29InAc) return;

    const rawEv = refs.m29InEv.value.trim();
    const rawAc = refs.m29InAc.value.trim();

    if (rawEv === "" || rawAc === "") {
        refs.m29Steps.textContent = "";
        if (pathEv) pathEv.style.display = "none";
        if (pathAc) pathAc.style.display = "none";
        if (errEl) errEl.classList.add("hidden");
        clearVisual29();
        return;
    }

    const ev = parseFloat(rawEv);
    const ac = parseFloat(rawAc);

    if (isNaN(ev) || isNaN(ac) || ev < 0 || ac < 0) {
        refs.m29Steps.textContent = "";
        if (pathEv) pathEv.style.display = "none";
        if (pathAc) pathAc.style.display = "none";
        if (errEl) {
            errEl.textContent = "Input EV dan AC harus berupa angka positif yang valid.";
            errEl.classList.remove("hidden");
        }
        clearVisual29();
        return;
    }

    if (errEl) errEl.classList.add("hidden");

    const cv = ev - ac;
    let cvStr;
    if (cv < 0) {
        cvStr = `-\\text{${formatCurrency(Math.abs(cv))}}`;
    } else if (cv > 0) {
        cvStr = `+\\text{${formatCurrency(cv)}}`;
    } else {
        cvStr = `\\text{${formatCurrency(0)}}`;
    }

    const tex = `\\htmlId{pm5-ev}{\\text{${formatCurrency(ev)}}} - \\htmlId{pm5-ac}{\\text{${formatCurrency(ac)}}} = \\mathbf{${cvStr}}`;

    if (typeof katex !== "undefined") {
        katex.render(tex, refs.m29Steps, { throwOnError: false, trust: true, displayMode: false });
    } else {
        refs.m29Steps.textContent = tex;
    }

    updatePm5Lines();
    requestAnimationFrame(updatePm5Lines);
    drawCvMeter(ev, ac, cv);
}
