import { loadAlgorithmCode } from "./sort-code-registry.js?v=1";

const LANGUAGES = [
    { id: "python", label: "Python" },
    { id: "javascript", label: "JavaScript" },
    { id: "c", label: "C" },
    { id: "cpp", label: "C++" },
    { id: "java", label: "Java" },
    { id: "golang", label: "Golang" }
];

const ALGO_TITLES = {
    bubble: "Bubble Sort",
    insertion: "Insertion Sort",
    selection: "Selection Sort",
    quick: "Quick Sort",
    merge: "Merge Sort",
    shaker: "Shaker Sort"
};

let panelEl = null;
let titleEl = null;
let tabsContainer = null;
let codeContainer = null;
let lineElements = [];

let activeAlgo = "bubble";
let activeLang = "python";
let activeStep = null;
let currentCodeData = null;
let isOpen = false;

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function updateTabs() {
    if (!tabsContainer) return;
    const tabButtons = tabsContainer.querySelectorAll(".sort-code-tab");
    tabButtons.forEach((btn) => {
        const lang = btn.getAttribute("data-lang");
        btn.classList.toggle("active", lang === activeLang);
    });
}

function renderCode() {
    if (!codeContainer || !currentCodeData) return;
    const langData = currentCodeData[activeLang];
    if (!langData) return;

    codeContainer.textContent = "";
    lineElements = [];

    const lines = langData.code.split("\n");
    const frag = document.createDocumentFragment();

    lines.forEach((lineText, idx) => {
        const lineNum = idx + 1;
        const lineDiv = document.createElement("div");
        lineDiv.className = "sort-code-line";
        lineDiv.setAttribute("data-line", String(lineNum));

        const numSpan = document.createElement("span");
        numSpan.className = "sort-code-line-num";
        numSpan.textContent = String(lineNum);

        const codeSpan = document.createElement("span");
        codeSpan.className = "sort-code-line-text";
        codeSpan.innerHTML = escapeHtml(lineText) || "&nbsp;";

        lineDiv.appendChild(numSpan);
        lineDiv.appendChild(codeSpan);
        frag.appendChild(lineDiv);
        lineElements.push(lineDiv);
    });

    codeContainer.appendChild(frag);
    applyHighlight();
}

function applyHighlight() {
    lineElements.forEach((el) => el.classList.remove("active"));
    if (!activeStep || !currentCodeData) return;

    const langData = currentCodeData[activeLang];
    if (!langData || !langData.steps) return;

    const targetLines = langData.steps[activeStep];
    if (!Array.isArray(targetLines) || targetLines.length === 0) return;

    let firstActiveEl = null;
    targetLines.forEach((lineNum) => {
        const el = lineElements[lineNum - 1];
        if (el) {
            el.classList.add("active");
            if (!firstActiveEl) firstActiveEl = el;
        }
    });

    if (firstActiveEl && isOpen && typeof firstActiveEl.scrollIntoView === "function") {
        firstActiveEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
}

async function loadAndDisplay() {
    if (titleEl) {
        titleEl.textContent = `${ALGO_TITLES[activeAlgo] || "Algorithm"} Code`;
    }
    const data = await loadAlgorithmCode(activeAlgo);
    currentCodeData = data;
    renderCode();
    return data;
}

export function openCodePanel() {
    if (!panelEl || !document.body.contains(panelEl)) {
        createDOM();
    }
    isOpen = true;
    panelEl.classList.remove("sort-code-hidden");
    return loadAndDisplay();
}

export function closeCodePanel() {
    if (!panelEl) return;
    isOpen = false;
    panelEl.classList.add("sort-code-hidden");
}

export function toggleCodePanel() {
    if (isOpen) {
        closeCodePanel();
    } else {
        openCodePanel();
    }
}

export function setCodeAlgorithm(algo) {
    if (activeAlgo === algo && currentCodeData) return Promise.resolve(currentCodeData);
    activeAlgo = algo;
    if (isOpen) {
        return loadAndDisplay();
    }
    currentCodeData = null;
    return Promise.resolve(null);
}

export function setCodeLanguage(lang) {
    if (activeLang === lang) return;
    activeLang = lang;
    updateTabs();
    renderCode();
}

export function highlightCodeStep(stepKey) {
    activeStep = stepKey;
    applyHighlight();
}

export function clearCodeHighlight() {
    activeStep = null;
    applyHighlight();
}

function createDOM() {
    if (panelEl && document.body.contains(panelEl)) return;
    if (panelEl && !document.body.contains(panelEl)) {
        document.body.appendChild(panelEl);
        return;
    }

    panelEl = document.createElement("aside");
    panelEl.id = "sort-code-panel";
    panelEl.className = "sort-code-panel sort-code-hidden";
    panelEl.setAttribute("aria-label", "Sorting Code Inspector");

    const header = document.createElement("div");
    header.className = "sort-code-header";

    titleEl = document.createElement("h3");
    titleEl.className = "sort-code-title";
    titleEl.textContent = `${ALGO_TITLES[activeAlgo]} Code`;

    const closeBtn = document.createElement("button");
    closeBtn.className = "sort-code-close";
    closeBtn.setAttribute("aria-label", "Close code panel");
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", closeCodePanel);

    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    tabsContainer = document.createElement("div");
    tabsContainer.className = "sort-code-tabs";

    LANGUAGES.forEach((lang) => {
        const tabBtn = document.createElement("button");
        tabBtn.className = "sort-code-tab" + (lang.id === activeLang ? " active" : "");
        tabBtn.setAttribute("data-lang", lang.id);
        tabBtn.textContent = lang.label;
        tabBtn.addEventListener("click", () => setCodeLanguage(lang.id));
        tabsContainer.appendChild(tabBtn);
    });

    const pre = document.createElement("pre");
    pre.className = "sort-code-pre";

    codeContainer = document.createElement("code");
    codeContainer.className = "sort-code-body";
    pre.appendChild(codeContainer);

    panelEl.appendChild(header);
    panelEl.appendChild(tabsContainer);
    panelEl.appendChild(pre);

    document.body.appendChild(panelEl);
}
