import { LEAN_BOIDS_DATA, getLeanBoidsPlaygroundUrl, LEAN_BOIDS_TIPS } from "./boids-lean-data.js?v=1";

let modalBackdrop = null;
let lastActiveElement = null;

function createModalDOM() {
    modalBackdrop = document.createElement("div");
    modalBackdrop.id = "boids-lean-modal-backdrop";
    modalBackdrop.className = "boids-modal-backdrop boids-hidden";
    modalBackdrop.setAttribute("role", "dialog");
    modalBackdrop.setAttribute("aria-modal", "true");
    modalBackdrop.setAttribute("aria-labelledby", "boids-modal-title");

    const card = document.createElement("div");
    card.className = "boids-modal-card";

    const header = document.createElement("div");
    header.className = "boids-modal-header";

    const titleBox = document.createElement("div");
    const titleEl = document.createElement("h3");
    titleEl.id = "boids-modal-title";
    titleEl.className = "boids-modal-title";
    titleEl.textContent = LEAN_BOIDS_DATA.title;

    const tierBadgeEl = document.createElement("span");
    tierBadgeEl.className = "boids-tier-badge " + (LEAN_BOIDS_DATA.tierClass || "tier-1");
    tierBadgeEl.textContent = LEAN_BOIDS_DATA.tier;

    const subtitleEl = document.createElement("div");
    subtitleEl.className = "boids-modal-subtitle";
    subtitleEl.textContent = LEAN_BOIDS_DATA.framework;

    titleBox.appendChild(titleEl);
    titleBox.appendChild(tierBadgeEl);
    titleBox.appendChild(subtitleEl);

    const btnClose = document.createElement("button");
    btnClose.className = "boids-modal-close";
    btnClose.setAttribute("aria-label", "Tutup modal verifikasi");
    btnClose.textContent = "×";
    btnClose.addEventListener("click", closeLeanBoidsModal);

    header.appendChild(titleBox);
    header.appendChild(btnClose);

    const guaranteesEl = document.createElement("div");
    guaranteesEl.className = "boids-proof-guarantees";
    LEAN_BOIDS_DATA.guarantees.forEach((g) => {
        const item = document.createElement("div");
        item.className = "boids-guarantee-item";
        const itemTitle = document.createElement("div");
        itemTitle.className = "boids-guarantee-title";
        itemTitle.textContent = g.name;
        const itemDesc = document.createElement("div");
        itemDesc.className = "boids-guarantee-desc";
        itemDesc.textContent = g.desc;
        item.appendChild(itemTitle);
        item.appendChild(itemDesc);
        guaranteesEl.appendChild(item);
    });

    const codeBox = document.createElement("div");
    codeBox.className = "boids-code-container";
    const codeEl = document.createElement("pre");
    codeEl.textContent = LEAN_BOIDS_DATA.code;
    codeBox.appendChild(codeEl);

    const tipsContainer = document.createElement("div");
    tipsContainer.className = "boids-proof-tips";
    LEAN_BOIDS_TIPS.forEach((t) => {
        const item = document.createElement("div");
        item.className = "boids-tip-item";
        const itemTitle = document.createElement("div");
        itemTitle.className = "boids-tip-title";
        itemTitle.textContent = t.name;
        const itemDesc = document.createElement("div");
        itemDesc.className = "boids-tip-desc";
        itemDesc.textContent = t.desc;
        item.appendChild(itemTitle);
        item.appendChild(itemDesc);
        tipsContainer.appendChild(item);
    });

    const actions = document.createElement("div");
    actions.className = "boids-modal-actions";

    const btnCopyEl = document.createElement("button");
    btnCopyEl.className = "btn-boids-action";
    btnCopyEl.textContent = "Salin Kode Lean 4";
    btnCopyEl.addEventListener("click", () => {
        navigator.clipboard.writeText(LEAN_BOIDS_DATA.code).then(() => {
            const originalText = btnCopyEl.textContent;
            btnCopyEl.textContent = "Tersalin!";
            setTimeout(() => {
                btnCopyEl.textContent = originalText;
            }, 2000);
        }).catch(() => {});
    });

    const linkRepoEl = document.createElement("a");
    linkRepoEl.className = "btn-boids-action";
    linkRepoEl.target = "_blank";
    linkRepoEl.rel = "noopener noreferrer";
    linkRepoEl.href = LEAN_BOIDS_DATA.repoUrl;
    linkRepoEl.textContent = "Lihat Source File ↗";

    const linkPlaygroundEl = document.createElement("a");
    linkPlaygroundEl.className = "btn-boids-action primary";
    linkPlaygroundEl.target = "_blank";
    linkPlaygroundEl.rel = "noopener noreferrer";
    linkPlaygroundEl.href = getLeanBoidsPlaygroundUrl();
    linkPlaygroundEl.textContent = "Uji Live di Lean 4 Web ↗";

    actions.appendChild(btnCopyEl);
    actions.appendChild(linkRepoEl);
    actions.appendChild(linkPlaygroundEl);

    card.appendChild(header);
    card.appendChild(guaranteesEl);
    card.appendChild(tipsContainer);
    card.appendChild(codeBox);
    card.appendChild(actions);

    modalBackdrop.appendChild(card);
    document.body.appendChild(modalBackdrop);

    modalBackdrop.addEventListener("click", (e) => {
        if (e.target === modalBackdrop) {
            closeLeanBoidsModal();
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modalBackdrop && !modalBackdrop.classList.contains("boids-hidden")) {
            closeLeanBoidsModal();
        }
    });
}

export function openLeanBoidsModal() {
    if (!modalBackdrop) {
        createModalDOM();
    }
    lastActiveElement = document.activeElement;
    modalBackdrop.classList.remove("boids-hidden");
    const closeBtn = modalBackdrop.querySelector(".boids-modal-close");
    if (closeBtn) closeBtn.focus();
}

export function closeLeanBoidsModal() {
    if (modalBackdrop) {
        modalBackdrop.classList.add("boids-hidden");
    }
    if (lastActiveElement && typeof lastActiveElement.focus === "function") {
        lastActiveElement.focus();
    }
}
