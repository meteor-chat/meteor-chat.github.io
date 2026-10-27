import { LEAN_DS_ALGORITHMS, getLeanDsData, getLeanDsPlaygroundUrl, LEAN_DS_TIPS } from "./ds-lean-data.js?v=1";

let modalBackdrop = null;
let lastActiveElement = null;
let activeDsType = "stack";
let titleEl = null;
let tierBadgeEl = null;
let subtitleEl = null;
let guaranteesEl = null;
let codeEl = null;
let linkRepoEl = null;
let linkPlaygroundEl = null;
let btnCopyEl = null;
let tabElements = [];

function updateModalContent(type) {
    activeDsType = type;
    const data = getLeanDsData(type);
    if (titleEl) titleEl.textContent = data.title;
    if (tierBadgeEl) {
        tierBadgeEl.textContent = data.tier;
        tierBadgeEl.className = "ds-tier-badge " + (data.tierClass || "tier-1");
    }
    if (subtitleEl) subtitleEl.textContent = data.framework;
    if (codeEl) codeEl.textContent = data.code;
    if (linkRepoEl) linkRepoEl.href = data.repoUrl;
    if (linkPlaygroundEl) linkPlaygroundEl.href = getLeanDsPlaygroundUrl(type);

    if (guaranteesEl) {
        guaranteesEl.textContent = "";
        data.guarantees.forEach((g) => {
            const item = document.createElement("div");
            item.className = "ds-guarantee-item";
            const itemTitle = document.createElement("div");
            itemTitle.className = "ds-guarantee-title";
            itemTitle.textContent = g.name;
            const itemDesc = document.createElement("div");
            itemDesc.className = "ds-guarantee-desc";
            itemDesc.textContent = g.desc;
            item.appendChild(itemTitle);
            item.appendChild(itemDesc);
            guaranteesEl.appendChild(item);
        });
    }

    tabElements.forEach((btn) => {
        const isActive = btn.getAttribute("data-ds-tab") === type;
        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });
}

function createModalDOM() {
    modalBackdrop = document.createElement("div");
    modalBackdrop.id = "ds-lean-modal-backdrop";
    modalBackdrop.className = "ds-modal-backdrop ds-hidden";
    modalBackdrop.setAttribute("role", "dialog");
    modalBackdrop.setAttribute("aria-modal", "true");
    modalBackdrop.setAttribute("aria-labelledby", "ds-modal-title");

    const card = document.createElement("div");
    card.className = "ds-modal-card";

    const header = document.createElement("div");
    header.className = "ds-modal-header";

    const titleBox = document.createElement("div");
    titleEl = document.createElement("h3");
    titleEl.id = "ds-modal-title";
    titleEl.className = "ds-modal-title";

    tierBadgeEl = document.createElement("span");
    tierBadgeEl.className = "ds-tier-badge";

    subtitleEl = document.createElement("div");
    subtitleEl.className = "ds-modal-subtitle";

    titleBox.appendChild(titleEl);
    titleBox.appendChild(tierBadgeEl);
    titleBox.appendChild(subtitleEl);

    const btnClose = document.createElement("button");
    btnClose.className = "ds-modal-close";
    btnClose.setAttribute("aria-label", "Tutup modal verifikasi");
    btnClose.textContent = "×";
    btnClose.addEventListener("click", closeLeanDsModal);

    header.appendChild(titleBox);
    header.appendChild(btnClose);

    const tabsNav = document.createElement("div");
    tabsNav.className = "ds-modal-tabs";
    tabsNav.setAttribute("role", "tablist");
    tabsNav.setAttribute("aria-label", "Pilihan Struktur Data");

    tabElements = [];
    LEAN_DS_ALGORITHMS.forEach((ds) => {
        const tabBtn = document.createElement("button");
        tabBtn.className = "ds-tab-btn";
        tabBtn.setAttribute("role", "tab");
        tabBtn.setAttribute("data-ds-tab", ds.id);
        tabBtn.textContent = ds.name;
        tabBtn.addEventListener("click", () => updateModalContent(ds.id));
        tabsNav.appendChild(tabBtn);
        tabElements.push(tabBtn);
    });

    guaranteesEl = document.createElement("div");
    guaranteesEl.className = "ds-proof-guarantees";

    const codeBox = document.createElement("div");
    codeBox.className = "ds-code-container";
    codeEl = document.createElement("pre");
    codeBox.appendChild(codeEl);

    const tipsContainer = document.createElement("div");
    tipsContainer.className = "ds-proof-tips";
    LEAN_DS_TIPS.forEach((t) => {
        const item = document.createElement("div");
        item.className = "ds-tip-item";
        const itemTitle = document.createElement("div");
        itemTitle.className = "ds-tip-title";
        itemTitle.textContent = t.name;
        const itemDesc = document.createElement("div");
        itemDesc.className = "ds-tip-desc";
        itemDesc.textContent = t.desc;
        item.appendChild(itemTitle);
        item.appendChild(itemDesc);
        tipsContainer.appendChild(item);
    });

    const actions = document.createElement("div");
    actions.className = "ds-modal-actions";

    btnCopyEl = document.createElement("button");
    btnCopyEl.className = "btn-ds-action";
    btnCopyEl.textContent = "Salin Kode Lean 4";
    btnCopyEl.addEventListener("click", () => {
        const data = getLeanDsData(activeDsType);
        navigator.clipboard.writeText(data.code).then(() => {
            const originalText = btnCopyEl.textContent;
            btnCopyEl.textContent = "Tersalin!";
            setTimeout(() => {
                btnCopyEl.textContent = originalText;
            }, 2000);
        }).catch(() => {});
    });

    linkRepoEl = document.createElement("a");
    linkRepoEl.className = "btn-ds-action";
    linkRepoEl.target = "_blank";
    linkRepoEl.rel = "noopener noreferrer";
    linkRepoEl.textContent = "Lihat Source File ↗";

    linkPlaygroundEl = document.createElement("a");
    linkPlaygroundEl.className = "btn-ds-action primary";
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
            closeLeanDsModal();
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modalBackdrop && !modalBackdrop.classList.contains("ds-hidden")) {
            closeLeanDsModal();
        }
    });
}

export function openLeanDsModal(type = "stack") {
    if (!modalBackdrop) {
        createModalDOM();
    }
    updateModalContent(type || "stack");
    lastActiveElement = document.activeElement;
    modalBackdrop.classList.remove("ds-hidden");
    const closeBtn = modalBackdrop.querySelector(".ds-modal-close");
    if (closeBtn) closeBtn.focus();
}

export function closeLeanDsModal() {
    if (modalBackdrop) {
        modalBackdrop.classList.add("ds-hidden");
    }
    if (lastActiveElement && typeof lastActiveElement.focus === "function") {
        lastActiveElement.focus();
    }
}
