import { bubbleSort } from "./sort-bubble.js";
import { selectionSort } from "./sort-selection.js";
import { insertionSort } from "./sort-insertion.js";
import { quickSort } from "./sort-quick.js";

const container = document.getElementById("sort-visualizer");
const buttons = document.querySelectorAll(".sort-filter-btn");
const btnRandomize = document.getElementById("btn-randomize");

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
    container.innerHTML = '';
    domBars = [];
    arr.forEach((val, index) => {
        const bar = document.createElement("div");
        bar.className = "sort-bar";
        bar.style.height = `${val * 80}px`;
        bar.style.transform = `translateX(${index * 90}px)`;
        container.appendChild(bar);
        domBars.push(bar);
    });
}

export function updateBarPosition(index, positionIndex) {
    if (domBars[index]) {
        domBars[index].style.transform = `translateX(${positionIndex * 90}px)`;
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

async function startSort(type) {
    if (isSorting) return;
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
    
    isSorting = true;
    buttons.forEach(btn => btn.style.pointerEvents = "none");
    if (btnRandomize) btnRandomize.disabled = true;
    
    if (type === "bubble") {
        await bubbleSort(arr, domBars, updateBarPosition, setBarTemp, sleep);
    } else if (type === "selection") {
        await selectionSort(arr, domBars, updateBarPosition, setBarTemp, sleep);
    } else if (type === "insertion") {
        await insertionSort(arr, domBars, updateBarPosition, setBarTemp, sleep);
    } else if (type === "quick") {
        await quickSort(arr, domBars, updateBarPosition, setBarTemp, sleep);
    } else {
        await sleep(500);
    }
    
    isSorting = false;
    buttons.forEach(btn => btn.style.pointerEvents = "auto");
    if (btnRandomize) btnRandomize.disabled = false;
    buttons.forEach(b => b.classList.remove('active'));
}

if (buttons.length > 0) {
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            if (isSorting) return;
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const type = btn.getAttribute("data-sort");
            startSort(type);
        });
    });
}


if (btnRandomize) {
    btnRandomize.addEventListener("click", () => {
        if (isSorting) return;
        buttons.forEach(b => b.classList.remove('active'));
        initArray();
        renderBars();
    });
}

initArray();
renderBars();
