import {
    getPrimes,
    getFibonacci,
    getMultiples,
    getEvens,
    getOdds,
    getSquares,
    getTriangular,
    getCubes,
    getPowersOfTwo,
    getNumberDetails
} from "./patterns-logic.js";

const FILTER_CONFIG = {
    all: {
        title: "All Numbers (1–100)",
        color: "#38bdf8",
        textColor: "#000000",
        getSet: () => new Set()
    },
    prime: {
        title: "Prime Numbers",
        color: "#f59e0b",
        textColor: "#000000",
        getSet: () => getPrimes(100)
    },
    fibonacci: {
        title: "Fibonacci Numbers",
        color: "#22d3ee",
        textColor: "#000000",
        getSet: () => getFibonacci(100)
    },
    even: {
        title: "Even Numbers",
        color: "#ea580c",
        textColor: "#ffffff",
        getSet: () => getEvens(100)
    },
    odd: {
        title: "Odd Numbers",
        color: "#a855f7",
        textColor: "#ffffff",
        getSet: () => getOdds(100)
    },
    square: {
        title: "Square Numbers",
        color: "#10b981",
        textColor: "#000000",
        getSet: () => getSquares(100)
    },
    triangular: {
        title: "Triangular Numbers",
        color: "#84cc16",
        textColor: "#000000",
        getSet: () => getTriangular(100)
    },
    cube: {
        title: "Cube Numbers",
        color: "#ec4899",
        textColor: "#ffffff",
        getSet: () => getCubes(100)
    },
    pow2: {
        title: "Powers of 2 (2ⁿ Binary Weights)",
        color: "#6366f1",
        textColor: "#ffffff",
        getSet: () => getPowersOfTwo(100)
    },
    "mult-3": {
        title: "Multiples of 3",
        color: "#f97316",
        textColor: "#ffffff",
        getSet: () => getMultiples(3, 100)
    },
    "mult-4": {
        title: "Multiples of 4",
        color: "#3b82f6",
        textColor: "#ffffff",
        getSet: () => getMultiples(4, 100)
    },
    "mult-5": {
        title: "Multiples of 5",
        color: "#10b981",
        textColor: "#000000",
        getSet: () => getMultiples(5, 100)
    },
    "mult-6": {
        title: "Multiples of 6",
        color: "#ec4899",
        textColor: "#ffffff",
        getSet: () => getMultiples(6, 100)
    },
    "mult-7": {
        title: "Multiples of 7",
        color: "#f97316",
        textColor: "#ffffff",
        getSet: () => getMultiples(7, 100)
    },
    "mult-8": {
        title: "Multiples of 8",
        color: "#6366f1",
        textColor: "#ffffff",
        getSet: () => getMultiples(8, 100)
    },
    "mult-9": {
        title: "Multiples of 9",
        color: "#eab308",
        textColor: "#000000",
        getSet: () => getMultiples(9, 100)
    }
};

let currentFilter = "mult-7";
let customMultiple = 7;
let cellElements = [];

function buildGrid(container) {
    container.innerHTML = "";
    cellElements = [];
    const frag = document.createDocumentFragment();
    for (let i = 1; i <= 100; i++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "pattern-cell";
        btn.dataset.number = String(i);
        btn.textContent = String(i);
        btn.setAttribute("aria-label", `Angka ${i}`);
        btn.addEventListener("click", () => inspectNumber(i));
        frag.appendChild(btn);
        cellElements.push(btn);
    }
    container.appendChild(frag);
}

export function inspectNumber(n) {
    const detailEl = document.getElementById("pattern-detail");
    if (!detailEl) return;
    const info = getNumberDetails(n);
    const tags = [];
    if (info.isPrime) tags.push('<span class="pattern-tag tag-prime">Prima</span>');
    if (info.isFibonacci) tags.push('<span class="pattern-tag tag-fib">Fibonacci</span>');
    if (info.isSquare) tags.push('<span class="pattern-tag tag-sq">Kuadrat</span>');
    if (info.isTriangular) tags.push('<span class="pattern-tag tag-tri">Segitiga</span>');
    if (info.isCube) tags.push('<span class="pattern-tag tag-cube">Kubik</span>');
    if (info.isPowerOfTwo) tags.push('<span class="pattern-tag tag-pow2">Pangkat 2</span>');
    tags.push(`<span class="pattern-tag tag-eo">${info.isEven ? "Genap" : "Ganjil"}</span>`);

    detailEl.innerHTML = `
        <div class="detail-header">
            <span class="detail-number">${info.number}</span>
            <div class="detail-tags">${tags.join("")}</div>
        </div>
        <div class="detail-body">
            <span class="detail-factors">Faktor: ${info.factors.join(", ")} (${info.factors.length} faktor)</span>
        </div>
    `;
    detailEl.classList.remove("hidden");

    cellElements.forEach((el) => {
        el.classList.toggle("is-inspected", el.dataset.number === String(n));
    });
}

export function applyFilter(filterKey, customVal = null) {
    currentFilter = filterKey;
    const titleEl = document.getElementById("pattern-title");
    const countEl = document.getElementById("pattern-count");

    let cfg = FILTER_CONFIG[filterKey];
    let activeSet;
    let title;
    let color;
    let textColor;

    if (filterKey === "custom") {
        const k = customVal !== null ? Number(customVal) : customMultiple;
        customMultiple = Math.max(1, Math.min(100, isNaN(k) ? 1 : k));
        title = `Multiples of ${customMultiple}`;
        color = "#f97316";
        textColor = "#ffffff";
        activeSet = getMultiples(customMultiple, 100);
    } else if (cfg) {
        title = cfg.title;
        color = cfg.color;
        textColor = cfg.textColor;
        activeSet = cfg.getSet();
    } else {
        return;
    }

    if (titleEl) {
        titleEl.textContent = title;
        titleEl.style.color = color;
    }

    if (countEl) {
        const cnt = activeSet.size;
        countEl.textContent = `${cnt} angka (${cnt}%)`;
        countEl.style.borderColor = color;
        countEl.style.color = color;
    }

    document.querySelectorAll(".pattern-filter-btn").forEach((btn) => {
        const match = btn.dataset.filter === filterKey;
        btn.classList.toggle("active", match);
        btn.setAttribute("aria-pressed", match ? "true" : "false");
    });

    cellElements.forEach((cell) => {
        const num = Number(cell.dataset.number);
        const isActive = activeSet.has(num);
        cell.classList.toggle("is-active", isActive);
        if (isActive) {
            cell.style.setProperty("--cell-bg", color);
            cell.style.setProperty("--cell-text", textColor);
        } else {
            cell.style.removeProperty("--cell-bg");
            cell.style.removeProperty("--cell-text");
        }
    });
}

export function initPatterns() {
    const gridEl = document.getElementById("patterns-grid");
    if (!gridEl) return;
    buildGrid(gridEl);

    document.querySelectorAll(".pattern-filter-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const key = btn.dataset.filter;
            if (key) applyFilter(key);
        });
    });

    const customInput = document.getElementById("pattern-custom-input");
    if (customInput) {
        customInput.addEventListener("input", (e) => {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val) && val >= 1 && val <= 100) {
                applyFilter("custom", val);
            }
        });
    }

    applyFilter("mult-7");
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPatterns);
} else {
    initPatterns();
}
