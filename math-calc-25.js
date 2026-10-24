import { refs } from "./dom-refs.js";
import { formatMax3 } from "./math-format.js";
import { drawPerformanceMeter, clearVisual25 } from "./math-visual-25.js";

function createBox(className, text) {
    const div = document.createElement("div");
    div.className = className;
    if (text) div.textContent = text;
    return div;
}

function renderTexStep(container, tex, boxClass = "math-step-box math-step-valid") {
    const box = createBox(boxClass);
    if (typeof katex !== "undefined") {
        katex.render(tex, box, { throwOnError: false, displayMode: true });
    } else {
        box.textContent = tex;
    }
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
        refs.m25Steps.appendChild(createBox("math-step-box math-step-error", "❌ Error: Input kemajuan pekerjaan harus berupa angka valid."));
        return;
    }

    if (actual < 0 || planned < 0) {
        refs.m25Steps.appendChild(createBox("math-step-box math-step-error", "❌ Error: Nilai kemajuan pekerjaan tidak boleh negatif."));
        return;
    }

    if (planned === 0) {
        refs.m25Steps.appendChild(createBox("math-step-box math-step-error", "❌ Error: Planned Work Completed tidak boleh bernilai 0 (mencegah pembagian dengan nol)."));
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

    const stepContainer = createBox("math-step");

    const infoBox = createBox("math-step-box math-step-selected");
    const infoTitle = document.createElement("strong");
    infoTitle.textContent = "Diketahui Parameter:";
    infoBox.appendChild(infoTitle);
    infoBox.appendChild(document.createElement("br"));
    const infoA = document.createElement("span");
    infoA.textContent = `• Kemajuan Pekerjaan Aktual (Actual) = ${formatMax3(actual)}%`;
    infoBox.appendChild(infoA);
    infoBox.appendChild(document.createElement("br"));
    const infoP = document.createElement("span");
    infoP.textContent = `• Rencana Kemajuan Pekerjaan (Planned) = ${formatMax3(planned)}%`;
    infoBox.appendChild(infoP);
    stepContainer.appendChild(infoBox);

    const fSub = `RP = \\frac{\\text{Actual Work Completed}}{\\text{Planned Work Completed}} \\times 100\\% = \\frac{${formatMax3(actual)}}{${formatMax3(planned)}} \\times 100\\%`;
    renderTexStep(stepContainer, fSub, "math-step-box math-step-valid math-mt-15");

    const fCalc = `RP = ${formatMax3(ratio)} \\times 100\\% = ${formatMax3(rpPercent)}\\%`;
    renderTexStep(stepContainer, fCalc);

    const fDec = `\\text{Nilai Desimal: } RP = \\frac{${formatMax3(actual)}}{${formatMax3(planned)}} = ${formatMax3(ratio)}`;
    renderTexStep(stepContainer, fDec);

    const highlightBox = createBox("math-step-box math-step-valid math-result-highlight");
    const resTitle = document.createElement("div");
    resTitle.className = "m10-td-bold";
    resTitle.textContent = `Hasil Akhir: RP = ${formatMax3(rpPercent)}% (${formatMax3(ratio)})`;
    highlightBox.appendChild(resTitle);

    const resDesc = document.createElement("div");
    resDesc.className = "math-mt-15";
    if (status === "ahead") {
        resDesc.textContent = `Evaluasi: Proyek berjalan lebih cepat dari target yang direncanakan (Ahead of Schedule). Kemajuan fisik aktual melampaui target jadwal sebesar +${formatMax3(devPercent)}%.`;
    } else if (status === "on-track") {
        resDesc.textContent = "Evaluasi: Proyek berjalan tepat sesuai dengan jadwal yang direncanakan (On Schedule / On Track 100%).";
    } else {
        resDesc.textContent = `Evaluasi: Proyek mengalami keterlambatan dari jadwal yang direncanakan (Behind Schedule). Kemajuan fisik aktual berada di bawah target jadwal sebesar ${formatMax3(devPercent)}%.`;
    }
    highlightBox.appendChild(resDesc);
    stepContainer.appendChild(highlightBox);

    refs.m25Steps.appendChild(stepContainer);
    drawPerformanceMeter(actual, planned, rpPercent, ratio, devPercent, status);
}
