import { checkHullDobell, stepDetail, detectCycle } from "./lcg-logic.js?v=1";
import { getPresetById } from "./lcg-presets.js?v=1";
import { LCG_CODE_SAMPLES } from "./lcg-code.js?v=1";
import { setupCanvasDpi, drawStateRing, drawLatticePlot } from "./lcg-visualizer.js?v=1";
import { highlightSortCode } from "../sort/code/sort-code-highlighter.js?v=1";
import { initCodePanelResizer } from "../sort/code/sort-code-resizer.js?v=1";

let inputM, inputA, inputC, inputX0;
let badgeHull, condGcdEl, condPrimesEl, condMod4El;
let canvas, ctx, btnPlay, btnModeRing, btnModeLattice;
let stepsContainer, seriesChipsContainer;
let codePanel, codeContainer, codeTitle, tabsContainer;

let currentM = 8;
let currentA = 5;
let currentC = 3;
let currentX0 = 1;
let history = [];
let currentVal = 1;
let isPlaying = false;
let playInterval = null;
let currentMode = "ring";
let activeCodeLang = "python";
let isCodeOpen = false;

function getParams() {
    return {
        m: Math.max(1, parseInt(inputM?.value || "8", 10)),
        a: Math.max(1, parseInt(inputA?.value || "5", 10)),
        c: Math.max(0, parseInt(inputC?.value || "3", 10)),
        x0: Math.max(0, parseInt(inputX0?.value || "1", 10))
    };
}

function updateHullDobell() {
    const { m, a, c } = getParams();
    const result = checkHullDobell(a, c, m);
    if (badgeHull) {
        badgeHull.className = "lcg-badge-period " + (result.isFullPeriod ? "badge-full" : "badge-short");
        badgeHull.textContent = result.isFullPeriod ? `✓ Periode Penuh Terjamin (${m})` : "⚠ Periode Tidak Maksimal";
    }
    if (condGcdEl) {
        condGcdEl.className = "lcg-cond-item " + (result.cond1.passed ? "passed" : "failed");
        condGcdEl.textContent = `1. FPB(c, m) = ${result.cond1.gcd} ${result.cond1.passed ? "✓ (Relatif Prima)" : "✗ (Harus = 1)"}`;
    }
    if (condPrimesEl) {
        const factorStr = result.cond2.primes.length ? result.cond2.primes.join(", ") : "Tidak ada";
        condPrimesEl.className = "lcg-cond-item " + (result.cond2.passed ? "passed" : "failed");
        condPrimesEl.textContent = `2. Faktor prima m (${factorStr}) membagi (a-1) ${result.cond2.passed ? "✓" : "✗"}`;
    }
    if (condMod4El) {
        condMod4El.className = "lcg-cond-item " + (result.cond3.passed ? "passed" : "failed");
        condMod4El.textContent = result.cond3.mMod4 ? `3. m kelipatan 4, maka (a-1) kelipatan 4 ${result.cond3.passed ? "✓" : "✗"}` : "3. m bukan kelipatan 4 ✓";
    }
}

function renderVisualizer() {
    if (!canvas || !ctx) return;
    const seq = history.map((h) => h.current);
    if (history.length > 0) seq.push(history[history.length - 1].next);
    else seq.push(currentVal);

    if (currentMode === "ring") {
        drawStateRing(ctx, 360, 360, currentM, seq, history.length);
    } else {
        const cycle = detectCycle(currentX0, currentA, currentC, currentM, 200);
        drawLatticePlot(ctx, 360, 360, cycle.sequence, currentM);
    }
}

function renderSteps() {
    if (!stepsContainer || !seriesChipsContainer) return;
    stepsContainer.textContent = "";
    const frag = document.createDocumentFragment();
    history.slice(-8).forEach((item, idx) => {
        const card = document.createElement("div");
        card.className = "lcg-step-card";
        const stepNum = history.length > 8 ? history.length - 8 + idx + 1 : idx + 1;
        card.innerHTML = `<span class="step-num">X<sub>${stepNum}</sub>:</span> <span class="step-calc">(${currentA} × ${item.current} + ${currentC}) mod ${currentM} = <strong>${item.next}</strong></span>`;
        frag.appendChild(card);
    });
    stepsContainer.appendChild(frag);
    const chips = history.map((h) => h.next);
    seriesChipsContainer.textContent = chips.length ? chips.join(", ") : String(currentX0);
}

function stepForward() {
    const detail = stepDetail(currentVal, currentA, currentC, currentM);
    history.push(detail);
    currentVal = detail.next;
    renderSteps();
    renderVisualizer();
}

function resetSimulation() {
    if (isPlaying) stopAutoPlay();
    const p = getParams();
    currentM = p.m;
    currentA = p.a;
    currentC = p.c;
    currentX0 = p.x0;
    currentVal = currentX0;
    history = [];
    updateHullDobell();
    renderSteps();
    renderVisualizer();
}

function startAutoPlay() {
    isPlaying = true;
    if (btnPlay) btnPlay.textContent = "Pause";
    playInterval = window.setInterval(() => stepForward(), 450);
}

function stopAutoPlay() {
    isPlaying = false;
    if (btnPlay) btnPlay.textContent = "Auto Play";
    if (playInterval) {
        window.clearInterval(playInterval);
        playInterval = null;
    }
}

function toggleAutoPlay() {
    if (isPlaying) stopAutoPlay();
    else startAutoPlay();
}

function applyPreset(presetId) {
    const p = getPresetById(presetId);
    if (!p) return;
    if (inputM) inputM.value = String(p.m);
    if (inputA) inputA.value = String(p.a);
    if (inputC) inputC.value = String(p.c);
    if (inputX0) inputX0.value = String(p.x0);
    resetSimulation();
}

function renderCode() {
    if (!codeContainer) return;
    const sample = LCG_CODE_SAMPLES[activeCodeLang] || LCG_CODE_SAMPLES.python;
    if (codeTitle) codeTitle.textContent = `LCG Code (${sample.language})`;

    codeContainer.textContent = "";
    const lines = sample.code.split("\n");
    const frag = document.createDocumentFragment();

    lines.forEach((lineText, idx) => {
        const lineDiv = document.createElement("div");
        lineDiv.className = "sort-code-line";

        const numSpan = document.createElement("span");
        numSpan.className = "sort-code-line-num";
        numSpan.textContent = String(idx + 1);

        const codeSpan = document.createElement("span");
        codeSpan.className = "sort-code-line-text";
        codeSpan.innerHTML = highlightSortCode(lineText, activeCodeLang) || "&nbsp;";

        lineDiv.appendChild(numSpan);
        lineDiv.appendChild(codeSpan);
        frag.appendChild(lineDiv);
    });
    codeContainer.appendChild(frag);

    if (tabsContainer) {
        const tabs = tabsContainer.querySelectorAll(".sort-code-tab");
        tabs.forEach((tab) => {
            tab.classList.toggle("active", tab.getAttribute("data-lang") === activeCodeLang);
        });
    }
}

function openCodePanel() {
    if (!codePanel) return;
    isCodeOpen = true;
    codePanel.classList.remove("sort-code-hidden");
    renderCode();
}

function closeCodePanel() {
    if (!codePanel) return;
    isCodeOpen = false;
    codePanel.classList.add("sort-code-hidden");
}

function toggleCodePanel() {
    if (isCodeOpen) closeCodePanel();
    else openCodePanel();
}

export function initLcgController() {
    inputM = document.getElementById("lcg-in-m");
    inputA = document.getElementById("lcg-in-a");
    inputC = document.getElementById("lcg-in-c");
    inputX0 = document.getElementById("lcg-in-x0");

    badgeHull = document.getElementById("lcg-hull-badge");
    condGcdEl = document.getElementById("lcg-cond-gcd");
    condPrimesEl = document.getElementById("lcg-cond-primes");
    condMod4El = document.getElementById("lcg-cond-mod4");

    canvas = document.getElementById("lcg-canvas");
    if (canvas) ctx = setupCanvasDpi(canvas, 360, 360);

    btnPlay = document.getElementById("btn-lcg-play");
    btnModeRing = document.getElementById("btn-mode-ring");
    btnModeLattice = document.getElementById("btn-mode-lattice");

    stepsContainer = document.getElementById("lcg-steps-box");
    seriesChipsContainer = document.getElementById("lcg-series-chips");

    codePanel = document.getElementById("sort-code-panel");
    codeContainer = document.getElementById("lcg-code-body");
    codeTitle = document.getElementById("lcg-code-title");
    tabsContainer = document.getElementById("lcg-code-tabs");

    if (codePanel) initCodePanelResizer(codePanel);

    document.getElementById("btn-lcg-step")?.addEventListener("click", stepForward);
    btnPlay?.addEventListener("click", toggleAutoPlay);
    document.getElementById("btn-lcg-reset")?.addEventListener("click", resetSimulation);

    btnModeRing?.addEventListener("click", () => {
        currentMode = "ring";
        btnModeRing.classList.add("active");
        btnModeLattice?.classList.remove("active");
        renderVisualizer();
    });

    btnModeLattice?.addEventListener("click", () => {
        currentMode = "lattice";
        btnModeLattice.classList.add("active");
        btnModeRing?.classList.remove("active");
        renderVisualizer();
    });

    [inputM, inputA, inputC, inputX0].forEach((inp) => {
        inp?.addEventListener("input", resetSimulation);
    });

    document.getElementById("lcg-preset-select")?.addEventListener("change", (e) => {
        applyPreset(e.target.value);
    });

    document.getElementById("btn-toggle-code")?.addEventListener("click", toggleCodePanel);
    document.getElementById("btn-code-floating")?.addEventListener("click", toggleCodePanel);
    document.getElementById("lcg-code-close")?.addEventListener("click", closeCodePanel);

    tabsContainer?.querySelectorAll(".sort-code-tab").forEach((tab) => {
        tab.addEventListener("click", () => {
            activeCodeLang = tab.getAttribute("data-lang");
            renderCode();
        });
    });

    resetSimulation();
}

if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initLcgController);
    } else {
        initLcgController();
    }
}
