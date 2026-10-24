import { refs } from "./dom-refs.js";
import { formatMax3 } from "./math-format.js";
import { drawPerformanceMeter, clearVisual25 } from "./math-visual-25.js";

function createDiv(className, text) {
    const div = document.createElement("div");
    div.className = className;
    if (text) div.textContent = text;
    return div;
}

function renderTexStep(container, tex, extraClass = "") {
    const box = createDiv(`pm-step-card ${extraClass}`.trim());
    const mathBox = createDiv("pm-step-math");
    if (typeof katex !== "undefined") {
        katex.render(tex, mathBox, { throwOnError: false, displayMode: true });
    } else {
        mathBox.textContent = tex;
    }
    box.appendChild(mathBox);
    container.appendChild(box);
}

export function calculateMath25() {
    if (!refs.m25Steps) return;
    refs.m25Steps.textContent = "";
    clearVisual25();

    if (!refs.m25InActual || !refs.m25InPlanned) return;

    const rawActual = refs.m25InActual.value.trim();
    const rawPlanned = refs.m25InPlanned.value.trim();

    if (rawActual === "" || rawPlanned === "") return;

    const actual = parseFloat(rawActual);
    const planned = parseFloat(rawPlanned);

    if (isNaN(actual) || isNaN(planned)) {
        refs.m25Steps.appendChild(createDiv("pm-step-card pm-step-error", "Input kemajuan pekerjaan harus berupa angka valid."));
        return;
    }

    if (actual < 0 || planned < 0) {
        refs.m25Steps.appendChild(createDiv("pm-step-card pm-step-error", "Nilai kemajuan pekerjaan tidak boleh negatif."));
        return;
    }

    if (planned === 0) {
        refs.m25Steps.appendChild(createDiv("pm-step-card pm-step-error", "Planned Work Completed tidak boleh bernilai 0 (mencegah pembagian dengan nol)."));
        return;
    }

    const ratio = actual / planned;
    const rpPercent = ratio * 100;
    const devPercent = rpPercent - 100;

    let status = "ahead";
    if (Math.abs(devPercent) < 1e-6) {
        status = "on-track";
    } else if (devPercent < 0) {
        status = "behind";
    }

    const fSub = `RP = \\frac{\\text{Actual Work Completed}}{\\text{Planned Work Completed}} \\times 100\\% = \\frac{${formatMax3(actual)}}{${formatMax3(planned)}} \\times 100\\%`;
    renderTexStep(refs.m25Steps, fSub);

    const fCalc = `RP = ${formatMax3(ratio)} \\times 100\\% = ${formatMax3(rpPercent)}\\%`;
    renderTexStep(refs.m25Steps, fCalc);

    const fDec = `\\text{Nilai Desimal: } RP = \\frac{${formatMax3(actual)}}{${formatMax3(planned)}} = ${formatMax3(ratio)}`;
    renderTexStep(refs.m25Steps, fDec);

    drawPerformanceMeter(actual, planned, rpPercent, ratio, devPercent, status);
}
