import { loadAlgorithm, loadCircle, getLoadedCircle, preloadWhenIdle } from "./sort-loader.js";

const container = document.getElementById("sort-visualizer");
const canvas = document.getElementById("sort-canvas");
const buttons = document.querySelectorAll(".sort-filter-btn");
const btnRandomize = document.getElementById("btn-randomize");
const btnModeBar = document.getElementById("btn-mode-bar");
const btnModeColor = document.getElementById("btn-mode-color");

const SORTED_REF = [1, 1.5, 2, 2.5, 3, 3.5, 4];
const TITLES = {
    bubble: "Bubble Sort",
    selection: "Selection Sort",
    insertion: "Insertion Sort",
    quick: "Quick Sort",
    merge: "Merge Sort",
    shaker: "Shaker Sort"
};

let currentMode = "bar";
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

export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isBusy() {
    const circle = getLoadedCircle();
    return isSorting || (circle ? circle.isCircleSortingActive() : false);
}

function clearActive() {
    buttons.forEach((b) => b.classList.remove("active"));
}

function setControlsDisabled(disabled) {
    buttons.forEach((btn) => {
        btn.style.pointerEvents = disabled ? "none" : "auto";
    });
    if (btnRandomize) btnRandomize.disabled = disabled;
    if (btnModeBar) btnModeBar.disabled = disabled;
    if (btnModeColor) btnModeColor.disabled = disabled;
}

function finishSort() {
    isSorting = false;
    setControlsDisabled(false);
    clearActive();
}

function isBarSorted() {
    return arr.every((val, i) => val === SORTED_REF[i]);
}

async function startBarSort(type) {
    if (isBarSorted()) {
        initArray();
        renderBars();
        await sleep(500);
    }
    const sort = await loadAlgorithm(type);
    if (sort) {
        await sort(arr, domBars, updateBarPosition, setBarTemp, sleep);
    } else {
        await sleep(500);
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
            await circle.startCircleSort(canvas, type, TITLES[type] || TITLES.bubble, finishSort);
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
            circle.renderCircle(canvas, TITLES.bubble);
        })
        .catch(() => {});
}

function setMode(mode) {
    if (isBusy() || mode === currentMode) return;
    currentMode = mode;
    clearActive();
    const isBar = mode === "bar";
    if (btnModeBar) btnModeBar.classList.toggle("active", isBar);
    if (btnModeColor) btnModeColor.classList.toggle("active", !isBar);
    if (canvas) canvas.classList.toggle("sort-hidden", isBar);
    if (container) container.classList.toggle("sort-hidden", !isBar);
    if (isBar) {
        renderBars();
    } else {
        drawCircle(false);
    }
}

if (btnModeBar) btnModeBar.addEventListener("click", () => setMode("bar"));
if (btnModeColor) btnModeColor.addEventListener("click", () => setMode("color"));

buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
        if (isBusy()) return;
        clearActive();
        btn.classList.add("active");
        startSort(btn.getAttribute("data-sort"));
    });
});

if (btnRandomize) {
    btnRandomize.addEventListener("click", () => {
        if (isBusy()) return;
        clearActive();
        if (currentMode === "bar") {
            initArray();
            renderBars();
        } else {
            drawCircle(true);
        }
    });
}

window.addEventListener("resize", () => {
    const circle = getLoadedCircle();
    if (currentMode === "color" && circle && !circle.isCircleSortingActive()) {
        circle.renderCircle(canvas, TITLES.bubble);
    }
});

initArray();
renderBars();
preloadWhenIdle();
