import { LEAN_SOURCE_CODE, getLeanPlaygroundUrl, LEAN_METADATA } from "./sort-lean-data.js?v=13";

let modalBackdrop = null;
let lastActiveElement = null;

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
    const title = document.createElement("h3");
    title.id = "lean-modal-title";
    title.className = "lean-modal-title";
    title.textContent = LEAN_METADATA.title;

    const subtitle = document.createElement("div");
    subtitle.className = "lean-modal-subtitle";
    subtitle.textContent = LEAN_METADATA.framework;

    titleBox.appendChild(title);
    titleBox.appendChild(subtitle);

    const btnClose = document.createElement("button");
    btnClose.className = "lean-modal-close";
    btnClose.setAttribute("aria-label", "Tutup modal verifikasi");
    btnClose.textContent = "×";
    btnClose.addEventListener("click", closeLeanModal);

    header.appendChild(titleBox);
    header.appendChild(btnClose);

    const guaranteesList = document.createElement("div");
    guaranteesList.className = "lean-proof-guarantees";

    LEAN_METADATA.guarantees.forEach((g) => {
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
        guaranteesList.appendChild(item);
    });

    const codeBox = document.createElement("div");
    codeBox.className = "lean-code-container";
    const pre = document.createElement("pre");
    pre.textContent = LEAN_SOURCE_CODE;
    codeBox.appendChild(pre);

    const actions = document.createElement("div");
    actions.className = "lean-modal-actions";

    const btnCopy = document.createElement("button");
    btnCopy.className = "btn-lean-action";
    btnCopy.textContent = "Salin Kode Lean 4";
    btnCopy.addEventListener("click", () => {
        navigator.clipboard.writeText(LEAN_SOURCE_CODE).then(() => {
            const originalText = btnCopy.textContent;
            btnCopy.textContent = "Tersalin!";
            setTimeout(() => {
                btnCopy.textContent = originalText;
            }, 2000);
        }).catch(() => {});
    });

    const linkRepo = document.createElement("a");
    linkRepo.className = "btn-lean-action";
    linkRepo.href = LEAN_METADATA.repoUrl;
    linkRepo.target = "_blank";
    linkRepo.rel = "noopener noreferrer";
    linkRepo.textContent = "Lihat Source File ↗";

    const linkPlayground = document.createElement("a");
    linkPlayground.className = "btn-lean-action primary";
    linkPlayground.href = getLeanPlaygroundUrl();
    linkPlayground.target = "_blank";
    linkPlayground.rel = "noopener noreferrer";
    linkPlayground.textContent = "Uji Live di Lean 4 Web ↗";

    actions.appendChild(btnCopy);
    actions.appendChild(linkRepo);
    actions.appendChild(linkPlayground);

    card.appendChild(header);
    card.appendChild(guaranteesList);

    if (LEAN_METADATA.tips) {
        const tipsContainer = document.createElement("div");
        tipsContainer.className = "lean-proof-tips";
        LEAN_METADATA.tips.forEach((t) => {
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
        card.appendChild(tipsContainer);
    }

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

export function openLeanModal() {
    if (!modalBackdrop) {
        createModalDOM();
    }
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
