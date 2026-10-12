import { bubbleSort } from "./sort-bubble.js";
import { selectionSort } from "./sort-selection.js";
import { insertionSort } from "./sort-insertion.js";
import { quickSort } from "./sort-quick.js";
import { mergeSort } from "./sort-merge.js";
import { shakerSort } from "./sort-shaker.js";
import {
    initCircleArray,
    renderCircle,
    startCircleSort,
    isCircleSortingActive
} from "./sort-circle-runner.js";

const container = document.getElementById("sort-visualizer");
const canvas = document.getElementById("sort-canvas");
const buttons = document.querySelectorAll(".sort-filter-btn");
const btnRandomize = document.getElementById("btn-randomize");
const btnModeBar = document.getElementById("btn-mode-bar");
const btnModeColor = document.getElementById("btn-mode-color");

let currentMode = "bar";
let arr = [];
let domBars = [];
let isSorting = false;

function initArray() {
    arr = [1, 1.5, 2, 2.5, 3, 3.5, 4];
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
        if (isTemp) {
            domBars[index].classList.add("temp");
        } else {
            domBars[index].classList.remove("temp");
        }
    }
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function setControlsDisabled(disabled) {
    buttons.forEach(btn => {
        btn.style.pointerEvents = disabled ? "none" : "auto";
    });
    if (btnRandomize) btnRandomize.disabled = disabled;
    if (btnModeBar) btnModeBar.disabled = disabled;
    if (btnModeColor) btnModeColor.disabled = disabled;
}

function getTitle(type) {
    if (type === "bubble") return "Bubble Sort";
    if (type === "selection") return "Selection Sort";
    if (type === "insertion") return "Insertion Sort";
    if (type === "quick") return "Quick Sort";
    if (type === "merge") return "Merge Sort";
    if (type === "shaker") return "Shaker Sort";
    return "Bubble Sort";
}

async function startBarSort(type) {
    let isSorted = true;
    const sortedRef = [1, 1.5, 2, 2.5, 3, 3.5, 4];
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] !== sortedRef[i]) isSorted = false;
    }
    if (isSorted) {
        initArray();
        renderBars();
        await sleep(500);
    }

    if (type === "bubble") {
        await bubbleSort(arr, domBars, updateBarPosition, setBarTemp, sleep);
    } else if (type === "selection") {
        await selectionSort(arr, domBars, updateBarPosition, setBarTemp, sleep);
    } else if (type === "insertion") {
        await insertionSort(arr, domBars, updateBarPosition, setBarTemp, sleep);
    } else if (type === "quick") {
        await quickSort(arr, domBars, updateBarPosition, setBarTemp, sleep);
    } else if (type === "merge") {
        await mergeSort(arr, domBars, updateBarPosition, setBarTemp, sleep);
    } else if (type === "shaker") {
        await shakerSort(arr, domBars, updateBarPosition, setBarTemp, sleep);
    } else {
        await sleep(500);
    }
}

async function startSort(type) {
    if (isSorting || isCircleSortingActive()) return;
    isSorting = true;
    setControlsDisabled(true);

    if (currentMode === "bar") {
        await startBarSort(type);
        isSorting = false;
        setControlsDisabled(false);
        buttons.forEach(b => b.classList.remove("active"));
    } else {
        await startCircleSort(canvas, type, getTitle(type), () => {
            isSorting = false;
            setControlsDisabled(false);
            buttons.forEach(b => b.classList.remove("active"));
        });
    }
}

function setMode(mode) {
    if (isSorting || isCircleSortingActive()) return;
    if (mode === currentMode) return;
    currentMode = mode;
    buttons.forEach(b => b.classList.remove("active"));

    if (mode === "bar") {
        if (btnModeBar) btnModeBar.classList.add("active");
        if (btnModeColor) btnModeColor.classList.remove("active");
        if (canvas) canvas.classList.add("sort-hidden");
        if (container) container.classList.remove("sort-hidden");
        renderBars();
    } else {
        if (btnModeColor) btnModeColor.classList.add("active");
        if (btnModeBar) btnModeBar.classList.remove("active");
        if (container) container.classList.add("sort-hidden");
        if (canvas) canvas.classList.remove("sort-hidden");
        renderCircle(canvas, -1, "Bubble Sort");
    }
}

if (btnModeBar) {
    btnModeBar.addEventListener("click", () => setMode("bar"));
}

if (btnModeColor) {
    btnModeColor.addEventListener("click", () => setMode("color"));
}

if (buttons.length > 0) {
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            if (isSorting || isCircleSortingActive()) return;
            buttons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const type = btn.getAttribute("data-sort");
            startSort(type);
        });
    });
}

if (btnRandomize) {
    btnRandomize.addEventListener("click", () => {
        if (isSorting || isCircleSortingActive()) return;
        buttons.forEach(b => b.classList.remove("active"));
        if (currentMode === "bar") {
            initArray();
            renderBars();
        } else {
            initCircleArray();
            renderCircle(canvas, -1, "Bubble Sort");
        }
    });
}

window.addEventListener("resize", () => {
    if (currentMode === "color" && !isCircleSortingActive()) {
        renderCircle(canvas, -1, "Bubble Sort");
    }
});

initArray();
renderBars();
initCircleArray();
