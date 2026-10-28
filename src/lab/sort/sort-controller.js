import { loadAlgorithm, loadCircle, getLoadedCircle, preloadWhenIdle } from "./sort-loader.js?v=13";
import { toggleCodePanel, setCodeAlgorithm, highlightCodeStep, clearCodeHighlight } from "./code/sort-code-panel.js?v=1";
import { preloadAllCodes } from "./code/sort-code-registry.js?v=1";

const container = document.getElementById("sort-visualizer");
const canvas = document.getElementById("sort-canvas");
const buttons = document.querySelectorAll(".sort-filter-btn");
const btnRun = document.getElementById("btn-run");
const btnRandomize = document.getElementById("btn-randomize");
const btnWorst = document.getElementById("btn-worst");
const btnModeBar = document.getElementById("btn-mode-bar");
const btnModeColor = document.getElementById("btn-mode-color");
const btnLeanVerify = document.getElementById("btn-lean-verify");
const leanBadgeText = document.getElementById("lean-badge-text");
const btnToggleCode = document.getElementById("btn-toggle-code");
const btnFloatingCode = document.getElementById("btn-code-floating");

const SORTED_REF = [1, 1.5, 2, 2.5, 3, 3.5, 4];
const VERIFIED_ALGORITHMS = {
    bubble: "Bubble Sort",
    insertion: "Insertion Sort",
    merge: "Merge Sort"
};

let currentMode = "bar";
let currentAlgorithm = "bubble";
let arr = [];
let domBars = [];
let isSorting = false;

function initArray() {
    arr = [...SORTED_REF];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

function setWorstArray() {
    arr = [...SORTED_REF].reverse();
}

function renderBars() {
    if (!container) return;
    container.textContent = "";
    domBars = [];
    arr.forEach((val, index) => {
        const bar = document.createElement("div");
        bar.className = "sort-bar";
        bar.style.height = `${val * 80}px`;
        bar.style.transform = `translate3d(${index * 90}px, 0, 0)`;
        container.appendChild(bar);
        domBars.push(bar);
    });
}

export function updateBarPosition(index, positionIndex) {
    if (domBars[index]) {
        domBars[index].style.transform = `translate3d(${positionIndex * 90}px, 0, 0)`;
    }
}

export function setBarTemp(index, isTemp) {
    if (domBars[index]) {
        domBars[index].classList.toggle("temp", isTemp);
    }
}

export function setBarCompare(index, isCompare) {
    if (domBars[index]) {
        domBars[index].classList.toggle("compare", isCompare);
    }
}

export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isBusy() {
    const circle = getLoadedCircle();
    return isSorting || (circle ? circle.isCircleSortingActive() : false);
}

function updateLeanBadge(type) {
    const isVerified = Boolean(type && VERIFIED_ALGORITHMS[type]);
    if (btnLeanVerify) {
        btnLeanVerify.classList.toggle("highlight", isVerified);
    }
    if (leanBadgeText) {
        if (isVerified) {
            leanBadgeText.textContent = `${VERIFIED_ALGORITHMS[type]}: Formally Verified in Lean 4`;
        } else {
            leanBadgeText.textContent = "Verified in Lean 4: Bubble, Insertion & Merge Sort";
        }
    }
}

function setControlsDisabled(disabled) {
    buttons.forEach((btn) => {
        btn.style.pointerEvents = disabled ? "none" : "auto";
    });
    if (btnRun) btnRun.disabled = disabled;
    if (btnRandomize) btnRandomize.disabled = disabled;
    if (btnWorst) btnWorst.disabled = disabled;
    if (btnModeBar) btnModeBar.disabled = disabled;
    if (btnModeColor) btnModeColor.disabled = disabled;
}

function finishSort() {
    isSorting = false;
    setControlsDisabled(false);
    clearCodeHighlight();
    domBars.forEach((bar) => {
        bar.classList.remove("temp", "compare");
    });
}

function isBarSorted() {
    return arr.every((val, i) => val === SORTED_REF[i]);
}

async function startBarSort(type) {
    if (isBarSorted()) {
        initArray();
        renderBars();
        await sleep(350);
    }
    const sort = await loadAlgorithm(type);
    if (sort) {
        await sort(arr, domBars, updateBarPosition, setBarTemp, sleep, setBarCompare, highlightCodeStep);
    } else {
        await sleep(350);
    }
}

async function startSort(type) {
    if (isBusy()) return;
    isSorting = true;
    setControlsDisabled(true);
    try {
        if (currentMode === "bar") {
            await startBarSort(type);
            finishSort();
        } else {
            const circle = await loadCircle();
            await circle.startCircleSort(canvas, type, finishSort);
        }
    } catch {
        finishSort();
    }
}

function drawCircle(reset) {
    loadCircle()
        .then((circle) => {
            if (currentMode !== "color" || circle.isCircleSortingActive()) return;
            if (reset) circle.initCircleArray();
            circle.renderCircle(canvas);
        })
        .catch(() => {});
}

function setMode(mode) {
    if (isBusy() || mode === currentMode) return;
    currentMode = mode;
    const isBar = mode === "bar";
    if (btnModeBar) btnModeBar.classList.toggle("active", isBar);
    if (btnModeColor) btnModeColor.classList.toggle("active", !isBar);
    if (canvas) canvas.classList.toggle("sort-hidden", isBar);
    if (container) container.classList.toggle("sort-hidden", !isBar);
    if (btnWorst) btnWorst.classList.toggle("sort-hidden", !isBar);
    if (isBar) {
        renderBars();
    } else {
        drawCircle(false);
    }
}

if (btnModeBar) btnModeBar.addEventListener("click", () => setMode("bar"));
if (btnModeColor) btnModeColor.addEventListener("click", () => setMode("color"));

if (btnLeanVerify) {
    btnLeanVerify.addEventListener("click", () => {
        import("./sort-lean-modal.js?v=15")
            .then((m) => {
                const target = VERIFIED_ALGORITHMS[currentAlgorithm] ? currentAlgorithm : "bubble";
                m.openLeanModal(target);
            })
            .catch(() => {});
    });
}

buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
        if (isBusy()) return;
        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentAlgorithm = btn.getAttribute("data-sort");
        updateLeanBadge(currentAlgorithm);
        setCodeAlgorithm(currentAlgorithm);
    });
});

if (btnRun) {
    btnRun.addEventListener("click", () => {
        if (isBusy()) return;
        startSort(currentAlgorithm);
    });
}

if (btnRandomize) {
    btnRandomize.addEventListener("click", () => {
        if (isBusy()) return;
        clearCodeHighlight();
        if (currentMode === "bar") {
            initArray();
            renderBars();
        } else {
            drawCircle(true);
        }
    });
}

if (btnWorst) {
    btnWorst.addEventListener("click", () => {
        if (isBusy() || currentMode !== "bar") return;
        clearCodeHighlight();
        setWorstArray();
        renderBars();
    });
}

if (btnToggleCode) btnToggleCode.addEventListener("click", toggleCodePanel);
if (btnFloatingCode) btnFloatingCode.addEventListener("click", toggleCodePanel);

window.addEventListener("resize", () => {
    const circle = getLoadedCircle();
    if (currentMode === "color" && circle && !circle.isCircleSortingActive()) {
        circle.renderCircle(canvas);
    }
});

initArray();
renderBars();
updateLeanBadge(currentAlgorithm);
preloadWhenIdle();
preloadAllCodes();
