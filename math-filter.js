import { getCategoryUrl, parseCategoryUrl } from "./math-routes.js";

let buttons = [];
let cards = [];
let activeFilter = null;

function ensureElements() {
    if (buttons.length === 0) {
        buttons = Array.from(document.querySelectorAll(".math-filter-btn"));
    }
    if (cards.length === 0) {
        cards = Array.from(document.querySelectorAll(".math-grid .math-card"));
    }
}

export function getActiveFilter() {
    return activeFilter;
}

export function applyFilter(category, options = {}) {
    ensureElements();
    activeFilter = category || null;

    buttons.forEach((b) => {
        const isActive = b.dataset.filter === activeFilter;
        b.classList.toggle("active", isActive);
        b.setAttribute("aria-pressed", String(isActive));
    });

    cards.forEach((card) => {
        const hidden = activeFilter !== null && card.dataset.category !== activeFilter;
        card.classList.toggle("math-hidden", hidden);
    });

    if (activeFilter) {
        document.title = `${activeFilter} - Meteor`;
    } else {
        document.title = "Math - Meteor";
    }

    const targetUrl = activeFilter ? getCategoryUrl(activeFilter) : "/math";
    if (options.pushHistory === true) {
        if (window.location.pathname !== targetUrl && window.location.pathname !== targetUrl + "/") {
            history.pushState({ category: activeFilter }, "", targetUrl);
        }
    } else if (options.replaceHistory === true) {
        if (window.location.pathname !== targetUrl && window.location.pathname !== targetUrl + "/") {
            history.replaceState({ category: activeFilter }, "", targetUrl);
        }
    }
}

export function initFilters() {
    const container = document.getElementById("math-filter-container");
    const grid = document.querySelector(".math-grid");
    if (!container || !grid) return;

    buttons = Array.from(container.querySelectorAll(".math-filter-btn"));
    cards = Array.from(grid.querySelectorAll(".math-card"));

    const initialRoute = parseCategoryUrl(window.location.pathname);
    if (initialRoute) {
        applyFilter(initialRoute.category, { pushHistory: false });
    }

    container.addEventListener("click", (e) => {
        const btn = e.target.closest(".math-filter-btn");
        if (!btn) return;
        const category = btn.dataset.filter;
        const next = activeFilter === category ? null : category;
        applyFilter(next, { pushHistory: true });
    });
}
