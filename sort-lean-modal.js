import { LEAN_ALGORITHMS, getLeanSortData, getLeanPlaygroundUrl, LEAN_SHARED_TIPS } from "./sort-lean-data.js?v=14";

let modalBackdrop = null;
let lastActiveElement = null;
let activeSortType = "bubble";
let titleEl = null;
let subtitleEl = null;
let guaranteesEl = null;
let codeEl = null;
let linkRepoEl = null;
let linkPlaygroundEl = null;
let btnCopyEl = null;
let tabElements = [];

function updateModalContent(type) {
    activeSortType = type;
    const data = getLeanSortData(type);
    if (titleEl) titleEl.textContent = data.title;
    if (subtitleEl) subtitleEl.textContent = data.framework;
    if (codeEl) codeEl.textContent = data.code;
    if (linkRepoEl) linkRepoEl.href = data.repoUrl;
    if (linkPlaygroundEl) linkPlaygroundEl.href = getLeanPlaygroundUrl(type);

    if (guaranteesEl) {
        guaranteesEl.textContent = "";
        data.guarantees.forEach((g) => {
            const item = document.createElement("div");
            item.className = "lean-guarantee-item";
            const itemTitle = document.createElement("div");
            itemTitle.className = "lean-guarantee-title";
            itemTitle.textContent = g.name;
            const itemDesc = document.createElement("div");
            itemDesc.className = "lean-guarantee-desc";
            itemDesc.textContent = g.desc;
            item.appendChild(itemTitle);
            item.appendChild(itemDesc);
            guaranteesEl.appendChild(item);
        });
    }

    tabElements.forEach((btn) => {
        const isActive = btn.getAttribute("data-lean-sort") === type;
        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });
}

function createModalDOM() {
    modalBackdrop = document.createElement("div");
    modalBackdrop.id = "lean-modal-backdrop";
    modalBackdrop.className = "lean-modal-backdrop sort-hidden";
    modalBackdrop.setAttribute("role", "dialog");
    modalBackdrop.setAttribute("aria-modal", "true");
    modalBackdrop.setAttribute("aria-labelledby", "lean-modal-title");

    const card = document.createElement("div");
    card.className = "lean-modal-card";

    const header = document.createElement("div");
    header.className = "lean-modal-header";

    const titleBox = document.createElement("div");
    titleEl = document.createElement("h3");
    titleEl.id = "lean-modal-title";
    titleEl.className = "lean-modal-title";

    subtitleEl = document.createElement("div");
    subtitleEl.className = "lean-modal-subtitle";

    titleBox.appendChild(titleEl);
    titleBox.appendChild(subtitleEl);

    const btnClose = document.createElement("button");
    btnClose.className = "lean-modal-close";
    btnClose.setAttribute("aria-label", "Tutup modal verifikasi");
    btnClose.textContent = "×";
    btnClose.addEventListener("click", closeLeanModal);

    header.appendChild(titleBox);
    header.appendChild(btnClose);

    const tabsNav = document.createElement("div");
    tabsNav.className = "lean-modal-tabs";
    tabsNav.setAttribute("role", "tablist");
    tabsNav.setAttribute("aria-label", "Pilihan Algoritma Sorting");

    tabElements = [];
    LEAN_ALGORITHMS.forEach((algo) => {
        const tabBtn = document.createElement("button");
        tabBtn.className = "lean-tab-btn";
        tabBtn.setAttribute("role", "tab");
        tabBtn.setAttribute("data-lean-sort", algo.id);
        tabBtn.textContent = algo.name;
        tabBtn.addEventListener("click", () => updateModalContent(algo.id));
        tabsNav.appendChild(tabBtn);
        tabElements.push(tabBtn);
    });

    guaranteesEl = document.createElement("div");
    guaranteesEl.className = "lean-proof-guarantees";

    const codeBox = document.createElement("div");
    codeBox.className = "lean-code-container";
    codeEl = document.createElement("pre");
    codeBox.appendChild(codeEl);

    const tipsContainer = document.createElement("div");
    tipsContainer.className = "lean-proof-tips";
    LEAN_SHARED_TIPS.forEach((t) => {
        const item = document.createElement("div");
        item.className = "lean-tip-item";
        const itemTitle = document.createElement("div");
        itemTitle.className = "lean-tip-title";
        itemTitle.textContent = t.name;
        const itemDesc = document.createElement("div");
        itemDesc.className = "lean-tip-desc";
        itemDesc.textContent = t.desc;
        item.appendChild(itemTitle);
        item.appendChild(itemDesc);
        tipsContainer.appendChild(item);
    });

    const actions = document.createElement("div");
    actions.className = "lean-modal-actions";

    btnCopyEl = document.createElement("button");
    btnCopyEl.className = "btn-lean-action";
    btnCopyEl.textContent = "Salin Kode Lean 4";
    btnCopyEl.addEventListener("click", () => {
        const data = getLeanSortData(activeSortType);
        navigator.clipboard.writeText(data.code).then(() => {
            const originalText = btnCopyEl.textContent;
            btnCopyEl.textContent = "Tersalin!";
            setTimeout(() => {
                btnCopyEl.textContent = originalText;
            }, 2000);
        }).catch(() => {});
    });

    linkRepoEl = document.createElement("a");
    linkRepoEl.className = "btn-lean-action";
    linkRepoEl.target = "_blank";
    linkRepoEl.rel = "noopener noreferrer";
    linkRepoEl.textContent = "Lihat Source File ↗";

    linkPlaygroundEl = document.createElement("a");
    linkPlaygroundEl.className = "btn-lean-action primary";
    linkPlaygroundEl.target = "_blank";
    linkPlaygroundEl.rel = "noopener noreferrer";
    linkPlaygroundEl.textContent = "Uji Live di Lean 4 Web ↗";

    actions.appendChild(btnCopyEl);
    actions.appendChild(linkRepoEl);
    actions.appendChild(linkPlaygroundEl);

    card.appendChild(header);
    card.appendChild(tabsNav);
    card.appendChild(guaranteesEl);
    card.appendChild(tipsContainer);
    card.appendChild(codeBox);
    card.appendChild(actions);

    modalBackdrop.appendChild(card);
    document.body.appendChild(modalBackdrop);

    modalBackdrop.addEventListener("click", (e) => {
        if (e.target === modalBackdrop) {
            closeLeanModal();
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modalBackdrop && !modalBackdrop.classList.contains("sort-hidden")) {
            closeLeanModal();
        }
    });
}

export function openLeanModal(type = "bubble") {
    if (!modalBackdrop) {
        createModalDOM();
    }
    updateModalContent(type || "bubble");
    lastActiveElement = document.activeElement;
    modalBackdrop.classList.remove("sort-hidden");
    const closeBtn = modalBackdrop.querySelector(".lean-modal-close");
    if (closeBtn) closeBtn.focus();
}

export function closeLeanModal() {
    if (modalBackdrop) {
        modalBackdrop.classList.add("sort-hidden");
    }
    if (lastActiveElement && typeof lastActiveElement.focus === "function") {
        lastActiveElement.focus();
    }
}
