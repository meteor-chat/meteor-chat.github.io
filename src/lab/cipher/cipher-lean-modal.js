import { LEAN_CIPHER_DATA, getLeanCipherPlaygroundUrl, LEAN_CIPHER_TIPS } from "./cipher-lean-data.js?v=1";

let modalBackdrop = null;
let lastActiveElement = null;

function createModalDOM() {
    modalBackdrop = document.createElement("div");
    modalBackdrop.id = "cipher-lean-modal-backdrop";
    modalBackdrop.className = "cipher-modal-backdrop cipher-hidden";
    modalBackdrop.setAttribute("role", "dialog");
    modalBackdrop.setAttribute("aria-modal", "true");
    modalBackdrop.setAttribute("aria-labelledby", "cipher-modal-title");

    const card = document.createElement("div");
    card.className = "cipher-modal-card";

    const header = document.createElement("div");
    header.className = "cipher-modal-header";

    const titleBox = document.createElement("div");
    const titleEl = document.createElement("h3");
    titleEl.id = "cipher-modal-title";
    titleEl.className = "cipher-modal-title";
    titleEl.textContent = LEAN_CIPHER_DATA.title;

    const tierBadgeEl = document.createElement("span");
    tierBadgeEl.className = "cipher-tier-badge " + (LEAN_CIPHER_DATA.tierClass || "tier-1");
    tierBadgeEl.textContent = LEAN_CIPHER_DATA.tier;

    const subtitleEl = document.createElement("div");
    subtitleEl.className = "cipher-modal-subtitle";
    subtitleEl.textContent = LEAN_CIPHER_DATA.framework;

    titleBox.appendChild(titleEl);
    titleBox.appendChild(tierBadgeEl);
    titleBox.appendChild(subtitleEl);

    const btnClose = document.createElement("button");
    btnClose.className = "cipher-modal-close";
    btnClose.setAttribute("aria-label", "Tutup modal verifikasi");
    btnClose.textContent = "×";
    btnClose.addEventListener("click", closeLeanCipherModal);

    header.appendChild(titleBox);
    header.appendChild(btnClose);

    const guaranteesEl = document.createElement("div");
    guaranteesEl.className = "cipher-proof-guarantees";
    LEAN_CIPHER_DATA.guarantees.forEach((g) => {
        const item = document.createElement("div");
        item.className = "cipher-guarantee-item";
        const itemTitle = document.createElement("div");
        itemTitle.className = "cipher-guarantee-title";
        itemTitle.textContent = g.name;
        const itemDesc = document.createElement("div");
        itemDesc.className = "cipher-guarantee-desc";
        itemDesc.textContent = g.desc;
        item.appendChild(itemTitle);
        item.appendChild(itemDesc);
        guaranteesEl.appendChild(item);
    });

    const codeBox = document.createElement("div");
    codeBox.className = "cipher-code-container";
    const codeEl = document.createElement("pre");
    codeEl.textContent = LEAN_CIPHER_DATA.code;
    codeBox.appendChild(codeEl);

    const tipsContainer = document.createElement("div");
    tipsContainer.className = "cipher-proof-tips";
    LEAN_CIPHER_TIPS.forEach((t) => {
        const item = document.createElement("div");
        item.className = "cipher-tip-item";
        const itemTitle = document.createElement("div");
        itemTitle.className = "cipher-tip-title";
        itemTitle.textContent = t.name;
        const itemDesc = document.createElement("div");
        itemDesc.className = "cipher-tip-desc";
        itemDesc.textContent = t.desc;
        item.appendChild(itemTitle);
        item.appendChild(itemDesc);
        tipsContainer.appendChild(item);
    });

    const actions = document.createElement("div");
    actions.className = "cipher-modal-actions";

    const btnCopyEl = document.createElement("button");
    btnCopyEl.className = "btn-cipher-action";
    btnCopyEl.textContent = "Salin Kode Lean 4";
    btnCopyEl.addEventListener("click", () => {
        navigator.clipboard.writeText(LEAN_CIPHER_DATA.code).then(() => {
            const originalText = btnCopyEl.textContent;
            btnCopyEl.textContent = "Tersalin!";
            setTimeout(() => {
                btnCopyEl.textContent = originalText;
            }, 2000);
        }).catch(() => {});
    });

    const linkRepoEl = document.createElement("a");
    linkRepoEl.className = "btn-cipher-action";
    linkRepoEl.target = "_blank";
    linkRepoEl.rel = "noopener noreferrer";
    linkRepoEl.href = LEAN_CIPHER_DATA.repoUrl;
    linkRepoEl.textContent = "Lihat Source File ↗";

    const linkPlaygroundEl = document.createElement("a");
    linkPlaygroundEl.className = "btn-cipher-action primary";
    linkPlaygroundEl.target = "_blank";
    linkPlaygroundEl.rel = "noopener noreferrer";
    linkPlaygroundEl.href = getLeanCipherPlaygroundUrl();
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
            closeLeanCipherModal();
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modalBackdrop && !modalBackdrop.classList.contains("cipher-hidden")) {
            closeLeanCipherModal();
        }
    });
}

export function openLeanCipherModal() {
    if (!modalBackdrop) {
        createModalDOM();
    }
    lastActiveElement = document.activeElement;
    modalBackdrop.classList.remove("cipher-hidden");
    const closeBtn = modalBackdrop.querySelector(".cipher-modal-close");
    if (closeBtn) closeBtn.focus();
}

export function closeLeanCipherModal() {
    if (modalBackdrop) {
        modalBackdrop.classList.add("cipher-hidden");
    }
    if (lastActiveElement && typeof lastActiveElement.focus === "function") {
        lastActiveElement.focus();
    }
}
