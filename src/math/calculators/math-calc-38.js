import { refs } from "../../core/dom-refs.js";
import { LANDSCAPES, createInitialState, stepSA, getTempStatus } from "./math-calc-38-engine.js";
import { initSaVisual, renderSaVisual } from "../visuals/math-visual-38.js";

let saState = null;
let isRunning = false;
let runTimer = null;
let initialized = false;

function getParams() {
    const lKey = refs.m38Preset ? refs.m38Preset.value : "doubleWell";
    const t0 = refs.m38InT0 ? parseFloat(refs.m38InT0.value) || 100 : 100;
    const alpha = refs.m38InAlpha ? parseFloat(refs.m38InAlpha.value) || 0.95 : 0.95;
    const sigma = refs.m38InSigma ? parseFloat(refs.m38InSigma.value) || 0.35 : 0.35;
    const schedule = refs.m38InSchedule ? refs.m38InSchedule.value : "geometric";
    return { landscape: lKey, t0, alpha, sigma, schedule, maxIter: 300 };
}

function stopLoop() {
    isRunning = false;
    if (runTimer) {
        clearTimeout(runTimer);
        runTimer = null;
    }
    if (refs.m38BtnPlay) {
        refs.m38BtnPlay.textContent = "▶ Jalankan";
        refs.m38BtnPlay.classList.remove("sa-btn-active");
    }
}

function startLoop() {
    if (isRunning) return;
    isRunning = true;
    if (refs.m38BtnPlay) {
        refs.m38BtnPlay.textContent = "⏸ Jeda";
        refs.m38BtnPlay.classList.add("sa-btn-active");
    }
    const tick = () => {
        if (!isRunning) return;
        stepOnce();
        if (saState.temp <= 0.002 || saState.iter >= 500) {
            stopLoop();
            return;
        }
        const speedVal = refs.m38Speed ? parseInt(refs.m38Speed.value, 10) : 2;
        const delay = speedVal === 1 ? 260 : speedVal === 3 ? 35 : 90;
        runTimer = setTimeout(tick, delay);
    };
    tick();
}

function stepOnce() {
    const params = getParams();
    saState = stepSA(saState, params);
    renderSaVisual(saState, params);
    renderSteps(saState, params);
}

function resetSim() {
    stopLoop();
    const params = getParams();
    const fn = LANDSCAPES[params.landscape] || LANDSCAPES.doubleWell;
    const x0 = refs.m38InX0 ? parseFloat(refs.m38InX0.value) || fn.domain[0] + 0.8 : fn.domain[0] + 0.8;
    saState = createInitialState(params.landscape, x0, params.t0);
    renderSaVisual(saState, params);
    renderSteps(saState, params);
}

function renderSteps(state, params) {
    if (!refs.m38Steps) return;
    const tStat = getTempStatus(state.temp, params.t0);
    const isDownhill = state.deltaE <= 0;
    const decBadge = state.accepted
        ? `<span class="sa-badge sa-badge-acc">${isDownhill ? "DITERIMA (Lebih Rendah)" : "DITERIMA (Lompat Eksplorasi)"}</span>`
        : `<span class="sa-badge sa-badge-rej">DITOLAK (Terlalu Tinggi / Dingin)</span>`;

    const mathMetropolis = `P = \\exp\\left(-\\frac{\\Delta E}{T}\\right) = \\exp\\left(-\\frac{${state.deltaE.toFixed(3)}}{${state.temp.toFixed(2)}}\\right) = ${(state.prob * 100).toFixed(2)}\\%`;

    refs.m38Steps.innerHTML = `
        <div class="sa-telemetry-grid">
            <div class="sa-stat-card">
                <span class="sa-stat-lbl">Iterasi / Langkah</span>
                <span class="sa-stat-val">${state.iter}</span>
            </div>
            <div class="sa-stat-card">
                <span class="sa-stat-lbl">Suhu (T)</span>
                <span class="sa-stat-val" style="color:${tStat.color}">${state.temp.toFixed(2)}</span>
                <span class="sa-stat-sub">${tStat.label}</span>
            </div>
            <div class="sa-stat-card">
                <span class="sa-stat-lbl">Posisi Saat Ini (x)</span>
                <span class="sa-stat-val">${state.currX.toFixed(3)}</span>
                <span class="sa-stat-sub">E(x) = ${state.currE.toFixed(3)}</span>
            </div>
            <div class="sa-stat-card sa-stat-best">
                <span class="sa-stat-lbl">Solusi Terbaik (x*)</span>
                <span class="sa-stat-val">${state.bestX.toFixed(3)}</span>
                <span class="sa-stat-sub">E* = ${state.bestE.toFixed(3)}</span>
            </div>
        </div>

        <div class="math-step-card">
            <div class="math-step-title">Evaluasi Langkah Terakhir</div>
            <div class="sa-eval-row">
                <div>Kandidat Baru: <b>x' = ${state.candX.toFixed(3)}</b> (E' = ${state.candE.toFixed(3)})</div>
                <div>Selisih Energi: <b>ΔE = ${state.deltaE.toFixed(3)}</b></div>
            </div>
            <div class="sa-eval-row" style="margin-top:6px;">
                <div>Probabilitas Metropolis: <b>${(state.prob * 100).toFixed(2)}%</b></div>
                <div>Angka Acak (r): <b>${state.roll.toFixed(3)}</b></div>
            </div>
            <div style="margin-top:8px;">Hasil: ${decBadge}</div>
        </div>

        <div class="math-step-card">
            <div class="math-step-title">Rumus Metropolis-Hastings</div>
            <div class="math-step-formula" id="m38-katex-formula"></div>
            <div class="sa-explain-box">
                <p><b>1. Apa arti rumus di atas?</b> Rumus ini menghitung peluang menerima langkah baru yang nilainya lebih buruk (energi lebih tinggi).</p>
                <p><b>2. Mengapa langkah buruk boleh diterima?</b> Agar algoritma tidak terperangkap di lembah palsu (local minimum), sehingga bisa melompat menuju lembah terendah sejati (global minimum).</p>
                <p><b>3. Bagaimana pengaruh suhu?</b> Saat suhu masih <b>panas</b>, nilai P sangat tinggi (peluang melompat besar). Seiring waktu suhu <b>mendingin</b> menuju nol, nilai P mengecil sehingga algoritma hanya memilih jalan turun dan stabil di dasar lembah.</p>
            </div>
        </div>
    `;

    const fEl = document.getElementById("m38-katex-formula");
    if (fEl && window.katex) {
        try {
            window.katex.render(mathMetropolis, fEl, { throwOnError: false });
        } catch {
            fEl.textContent = mathMetropolis;
        }
    }
}

export function initMath38() {
    initSaVisual(refs.m38CanvasLandscape, refs.m38CanvasTelemetry);
    if (!initialized) {
        initialized = true;
        if (refs.m38BtnPlay) refs.m38BtnPlay.addEventListener("click", () => isRunning ? stopLoop() : startLoop());
        if (refs.m38BtnStep) refs.m38BtnStep.addEventListener("click", () => { stopLoop(); stepOnce(); });
        if (refs.m38BtnReset) refs.m38BtnReset.addEventListener("click", resetSim);
        if (refs.m38Preset) refs.m38Preset.addEventListener("change", () => {
            const params = getParams();
            const fn = LANDSCAPES[params.landscape] || LANDSCAPES.doubleWell;
            if (refs.m38InX0) refs.m38InX0.value = (fn.domain[0] + 0.8).toFixed(2);
            resetSim();
        });
        const autoResetInputs = [refs.m38InT0, refs.m38InAlpha, refs.m38InSigma, refs.m38InX0, refs.m38InSchedule];
        autoResetInputs.forEach((input) => {
            if (input) input.addEventListener("change", resetSim);
        });
    }
    resetSim();
}

export function calculateMath38() {
    initMath38();
}
