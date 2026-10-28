const MIN_PANEL_WIDTH = 300;
const DEFAULT_PANEL_WIDTH = 440;
const STORAGE_KEY = "sort_code_panel_width";

export function initCodePanelResizer(panelEl) {
    if (!panelEl) return null;
    let resizer = panelEl.querySelector(".sort-code-resizer");
    if (!resizer) {
        resizer = document.createElement("div");
        resizer.className = "sort-code-resizer";
        resizer.setAttribute("role", "separator");
        resizer.setAttribute("aria-orientation", "vertical");
        resizer.setAttribute("tabindex", "0");
        resizer.setAttribute("aria-label", "Resize Code Panel");
        panelEl.insertBefore(resizer, panelEl.firstChild);
    }

    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = parseInt(saved, 10);
            const maxWidth = Math.max(MIN_PANEL_WIDTH, window.innerWidth - 60);
            if (!Number.isNaN(parsed) && parsed >= MIN_PANEL_WIDTH && parsed <= maxWidth) {
                panelEl.style.width = `${parsed}px`;
            }
        }
    } catch {}

    let isDragging = false;

    function applyWidth(targetWidth) {
        const maxWidth = Math.max(MIN_PANEL_WIDTH, window.innerWidth - 60);
        const clamped = Math.min(Math.max(targetWidth, MIN_PANEL_WIDTH), maxWidth);
        panelEl.style.width = `${clamped}px`;
        resizer.setAttribute("aria-valuenow", String(clamped));
        return clamped;
    }

    function onPointerDown(e) {
        if (e.button !== 0 && e.pointerType === "mouse") return;
        isDragging = true;
        try {
            resizer.setPointerCapture(e.pointerId);
        } catch {}
        panelEl.classList.add("is-resizing");
        resizer.classList.add("is-dragging");
        document.body.style.cursor = "ew-resize";
        document.body.style.userSelect = "none";
        e.preventDefault();
    }

    function onPointerMove(e) {
        if (!isDragging) return;
        const newWidth = window.innerWidth - e.clientX;
        applyWidth(newWidth);
    }

    function onPointerUp(e) {
        if (!isDragging) return;
        isDragging = false;
        try {
            resizer.releasePointerCapture(e.pointerId);
        } catch {}
        panelEl.classList.remove("is-resizing");
        resizer.classList.remove("is-dragging");
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        try {
            const finalWidth = parseInt(panelEl.style.width, 10);
            if (!Number.isNaN(finalWidth)) {
                localStorage.setItem(STORAGE_KEY, String(finalWidth));
            }
        } catch {}
    }

    function onKeyDown(e) {
        const current = parseInt(panelEl.style.width || String(DEFAULT_PANEL_WIDTH), 10);
        const step = e.shiftKey ? 50 : 20;
        if (e.key === "ArrowLeft") {
            const next = applyWidth(current + step);
            try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
            e.preventDefault();
        } else if (e.key === "ArrowRight") {
            const next = applyWidth(current - step);
            try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
            e.preventDefault();
        } else if (e.key === "Home") {
            const next = applyWidth(DEFAULT_PANEL_WIDTH);
            try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
            e.preventDefault();
        }
    }

    resizer.addEventListener("pointerdown", onPointerDown);
    resizer.addEventListener("pointermove", onPointerMove);
    resizer.addEventListener("pointerup", onPointerUp);
    resizer.addEventListener("pointercancel", onPointerUp);
    resizer.addEventListener("keydown", onKeyDown);

    window.addEventListener("resize", () => {
        if (window.innerWidth <= 650) {
            panelEl.style.width = "";
            return;
        }
        const current = parseInt(panelEl.style.width, 10);
        if (!Number.isNaN(current)) {
            const max = Math.max(MIN_PANEL_WIDTH, window.innerWidth - 60);
            if (current > max) {
                panelEl.style.width = `${max}px`;
            }
        }
    });

    return resizer;
}
