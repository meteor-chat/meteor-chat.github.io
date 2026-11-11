import { parseCustomStopwords } from "./stopwords.js";
import { computeFrequencies } from "./tokenizer.js";
import { calculateLayout } from "./layout.js";
import { assignWordColors, renderCloudToCanvas, findWordAtPoint, generateSVGString, downloadCanvasPNG, downloadFile } from "./renderer.js";
import { SAMPLE_PRESETS } from "./presets.js";

let currentLayoutResult = null;
let currentHoveredWord = null;
let currentActiveWord = null;

function getVal(id, fallback = "") {
    const el = document.getElementById(id);
    return el ? el.value : fallback;
}

function getOptionsFromUI() {
    return {
        text: getVal("wc-input-text"),
        stopwordMode: getVal("wc-select-lang", "all"),
        customStopwords: parseCustomStopwords(getVal("wc-input-custom-stop")),
        minWordLength: parseInt(getVal("wc-range-min-len", "2"), 10),
        maxWords: parseInt(getVal("wc-range-max-words", "75"), 10),
        scaleMode: getVal("wc-select-scale", "sqrt"),
        fontFamily: getVal("wc-select-font", "'Google Sans', sans-serif"),
        angleMode: getVal("wc-select-angle", "mixed"),
        palette: getVal("wc-select-palette", "aurora")
    };
}

function updateMetricDisplays(freqData, layoutResult) {
    const cEl = document.getElementById("wc-metric-compactness");
    const tokEl = document.getElementById("wc-metric-tokens");
    const uEl = document.getElementById("wc-metric-unique");
    const ttrEl = document.getElementById("wc-metric-ttr");

    if (cEl) cEl.textContent = `${Math.round(layoutResult.compactness * 100)}%`;
    if (tokEl) tokEl.textContent = `${freqData.displayedCount} / ${freqData.totalRawTokens}`;
    if (uEl) uEl.textContent = freqData.uniqueTokens;
    if (ttrEl) ttrEl.textContent = `${(freqData.typeTokenRatio * 100).toFixed(1)}%`;
}

function renderFrequencyBadges(words) {
    const container = document.getElementById("wc-badge-list");
    if (!container) return;
    container.innerHTML = "";

    words.slice(0, 15).forEach((w) => {
        const badge = document.createElement("button");
        badge.type = "button";
        badge.className = "wc-top-badge";
        badge.innerHTML = `<span class="wc-badge-word">${w.text}</span><span class="wc-badge-count">${w.count}</span>`;
        badge.addEventListener("click", () => {
            currentActiveWord = w;
            const canvas = document.getElementById("wc-canvas");
            renderCloudToCanvas(canvas, currentLayoutResult, {
                width: canvas.clientWidth,
                height: canvas.clientHeight,
                hoveredWord: currentHoveredWord,
                activeWord: currentActiveWord
            });
        });
        container.appendChild(badge);
    });
}

export function updateWordCloud() {
    const canvas = document.getElementById("wc-canvas");
    if (!canvas) return;

    const opts = getOptionsFromUI();
    const freqData = computeFrequencies(opts.text, {
        stopwordMode: opts.stopwordMode,
        customStopwords: opts.customStopwords,
        minWordLength: opts.minWordLength,
        maxWords: opts.maxWords
    });

    const coloredWords = assignWordColors(freqData.words, opts.palette);
    const canvasWidth = canvas.clientWidth || 840;
    const canvasHeight = Math.max(420, canvas.clientHeight || 520);

    const layout = calculateLayout(coloredWords, {
        width: canvasWidth,
        height: canvasHeight,
        minFontSize: 14,
        maxFontSize: 66,
        fontFamily: opts.fontFamily,
        angleMode: opts.angleMode,
        scaleMode: opts.scaleMode
    });

    currentLayoutResult = layout;
    currentHoveredWord = null;
    currentActiveWord = null;

    renderCloudToCanvas(canvas, layout, {
        width: canvasWidth,
        height: canvasHeight,
        hoveredWord: null,
        activeWord: null,
        palette: opts.palette
    });

    updateMetricDisplays(freqData, layout);
    renderFrequencyBadges(coloredWords);
}

function setupCanvasInteractions() {
    const canvas = document.getElementById("wc-canvas");
    const tooltip = document.getElementById("wc-tooltip");
    if (!canvas || !tooltip) return;

    canvas.addEventListener("mousemove", (e) => {
        if (!currentLayoutResult) return;
        const rect = canvas.getBoundingClientRect();
        const hit = findWordAtPoint(currentLayoutResult, e.clientX - rect.left, e.clientY - rect.top);
        if (hit !== currentHoveredWord) {
            currentHoveredWord = hit;
            renderCloudToCanvas(canvas, currentLayoutResult, {
                width: canvas.clientWidth,
                height: canvas.clientHeight,
                hoveredWord: currentHoveredWord,
                activeWord: currentActiveWord
            });
        }

        if (hit) {
            canvas.style.cursor = "pointer";
            tooltip.classList.remove("hidden");
            const total = currentLayoutResult.placed.reduce((acc, i) => acc + i.count, 0);
            const pct = total > 0 ? ((hit.count / total) * 100).toFixed(1) : "0";
            tooltip.innerHTML = `<strong>${hit.text}</strong><span>Rank: #${hit.rank}</span><span>Frekuensi: ${hit.count} (${pct}%)</span>`;
            tooltip.style.left = `${e.clientX + 14}px`;
            tooltip.style.top = `${e.clientY + 14}px`;
        } else {
            canvas.style.cursor = "default";
            tooltip.classList.add("hidden");
        }
    });

    canvas.addEventListener("mouseleave", () => {
        currentHoveredWord = null;
        tooltip.classList.add("hidden");
        renderCloudToCanvas(canvas, currentLayoutResult, {
            width: canvas.clientWidth,
            height: canvas.clientHeight,
            hoveredWord: null,
            activeWord: currentActiveWord
        });
    });

    canvas.addEventListener("click", (e) => {
        if (!currentLayoutResult) return;
        const rect = canvas.getBoundingClientRect();
        currentActiveWord = findWordAtPoint(currentLayoutResult, e.clientX - rect.left, e.clientY - rect.top);
        renderCloudToCanvas(canvas, currentLayoutResult, {
            width: canvas.clientWidth,
            height: canvas.clientHeight,
            hoveredWord: currentHoveredWord,
            activeWord: currentActiveWord
        });
    });
}

function setupPresetButtons() {
    ["ai", "semantics", "physics_id"].forEach((key) => {
        const btn = document.getElementById(`wc-preset-${key}`);
        if (btn) {
            btn.addEventListener("click", () => {
                const textInput = document.getElementById("wc-input-text");
                if (textInput && SAMPLE_PRESETS[key]) {
                    textInput.value = SAMPLE_PRESETS[key];
                    updateWordCloud();
                }
            });
        }
    });
}

function setupExportHandlers() {
    const btnPng = document.getElementById("wc-btn-export-png");
    const btnSvg = document.getElementById("wc-btn-export-svg");
    const btnCsv = document.getElementById("wc-btn-export-csv");

    if (btnPng) {
        btnPng.addEventListener("click", () => {
            const canvas = document.getElementById("wc-canvas");
            downloadCanvasPNG(canvas, "meteor-wordcloud.png");
        });
    }

    if (btnSvg) {
        btnSvg.addEventListener("click", () => {
            if (!currentLayoutResult) return;
            const canvas = document.getElementById("wc-canvas");
            const w = canvas.clientWidth || 800;
            const h = canvas.clientHeight || 500;
            const svgString = generateSVGString(currentLayoutResult, w, h);
            downloadFile("meteor-wordcloud.svg", svgString, "image/svg+xml");
        });
    }

    if (btnCsv) {
        btnCsv.addEventListener("click", () => {
            if (!currentLayoutResult || !currentLayoutResult.placed) return;
            const rows = [["Rank", "Word", "Count", "Percentage"]];
            const total = currentLayoutResult.placed.reduce((acc, i) => acc + i.count, 0);
            currentLayoutResult.placed.forEach((w) => {
                const pct = total > 0 ? ((w.count / total) * 100).toFixed(2) : "0";
                rows.push([w.rank, `"${w.text}"`, w.count, `${pct}%`]);
            });
            downloadFile("wordcloud-frequencies.csv", rows.map((r) => r.join(",")).join("\n"), "text/csv");
        });
    }
}

export function initWordCloudApp() {
    setupCanvasInteractions();
    setupPresetButtons();
    setupExportHandlers();

    const ids = [
        "wc-select-lang",
        "wc-range-min-len",
        "wc-range-max-words",
        "wc-select-scale",
        "wc-select-font",
        "wc-select-angle",
        "wc-select-palette"
    ];

    ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("change", updateWordCloud);
            if (el.type === "range") {
                el.addEventListener("input", () => {
                    const label = document.getElementById(`${id}-val`);
                    if (label) label.textContent = el.value;
                    updateWordCloud();
                });
            }
        }
    });

    const customStop = document.getElementById("wc-input-custom-stop");
    if (customStop) customStop.addEventListener("input", updateWordCloud);

    const textInput = document.getElementById("wc-input-text");
    if (textInput) {
        if (!textInput.value.trim()) textInput.value = SAMPLE_PRESETS.ai;
        textInput.addEventListener("input", updateWordCloud);
    }

    window.addEventListener("resize", updateWordCloud);
    updateWordCloud();
}

if (typeof window !== "undefined") {
    window.addEventListener("DOMContentLoaded", () => {
        if (document.getElementById("wc-app-root")) {
            initWordCloudApp();
        }
    });
}
