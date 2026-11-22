import { getCategoryUrl, parseCategoryUrl } from "./math-routes.js";

let buttons = [];
let cards = [];
let activeFilter = null;
let searchQuery = "";
let searchInput = null;
let searchClearBtn = null;
let counterEl = null;
let emptyStateEl = null;
let emptyResetBtn = null;
let boundContainer = null;
let boundSearchInput = null;
let boundClearBtn = null;
let boundResetBtn = null;
let windowBound = false;

function ensureElements() {
    if (buttons.length === 0 || !buttons[0]?.isConnected) {
        buttons = Array.from(document.querySelectorAll(".math-filter-btn"));
    }
    if (cards.length === 0 || !cards[0]?.isConnected) {
        cards = Array.from(document.querySelectorAll(".math-grid .math-card[data-formula]"));
    }
    if (!searchInput || !searchInput.isConnected) {
        searchInput = document.getElementById("math-search-input");
    }
    if (!searchClearBtn || !searchClearBtn.isConnected) {
        searchClearBtn = document.getElementById("math-search-clear");
    }
    if (!counterEl || !counterEl.isConnected) {
        counterEl = document.getElementById("math-search-counter");
    }
    if (!emptyStateEl || !emptyStateEl.isConnected) {
        emptyStateEl = document.getElementById("math-empty-state");
    }
    if (!emptyResetBtn || !emptyResetBtn.isConnected) {
        emptyResetBtn = document.getElementById("math-empty-reset");
    }
}

export function getActiveFilter() {
    return activeFilter;
}

export function getSearchQuery() {
    return searchQuery;
}

function updateCardVisibility() {
    ensureElements();
    const query = (searchQuery || "").trim().toLowerCase();
    let visibleCount = 0;

    cards.forEach((card) => {
        const cat = card.dataset.category || "";
        const formulaId = card.dataset.formula || "";
        const titleEl = card.querySelector(".math-card-title");
        const title = (titleEl ? titleEl.textContent : "") || card.getAttribute("aria-label") || "";
        const aria = (card.getAttribute("aria-label") || "").toLowerCase();

        const catMatches = !activeFilter || cat === activeFilter;
        let searchMatches = true;

        if (query.length > 0) {
            const idMatch = formulaId === query || `#${formulaId}` === query || `#0${formulaId}` === query;
            const titleMatch = title.toLowerCase().includes(query);
            const catSearchMatch = cat.toLowerCase().includes(query);
            const ariaMatch = aria.includes(query);
            searchMatches = idMatch || titleMatch || catSearchMatch || ariaMatch;
        }

        const isVisible = catMatches && searchMatches;
        card.classList.toggle("math-hidden", !isVisible);
        if (isVisible) visibleCount++;
    });

    const comingSoonCard = document.querySelector(".math-grid .math-card.disabled");
    if (comingSoonCard) {
        comingSoonCard.classList.toggle("math-hidden", Boolean(activeFilter || query.length > 0));
    }

    if (counterEl) {
        if (!activeFilter && query.length === 0) {
            counterEl.textContent = `Menampilkan ${cards.length} rumus`;
        } else {
            counterEl.textContent = `Menampilkan ${visibleCount} dari ${cards.length} rumus`;
        }
    }

    if (emptyStateEl) {
        emptyStateEl.classList.toggle("hidden", visibleCount > 0);
    }
}

export function setSearchQuery(query) {
    ensureElements();
    searchQuery = (query || "").trim();
    if (searchInput && searchInput.value !== searchQuery) {
        searchInput.value = searchQuery;
    }
    if (searchClearBtn) {
        searchClearBtn.classList.toggle("hidden", searchQuery.length === 0);
    }
    updateCardVisibility();
}

export function applyFilter(category, options = {}) {
    ensureElements();
    activeFilter = category || null;

    buttons.forEach((b) => {
        const bFilter = b.dataset.filter || null;
        const isActive = activeFilter ? bFilter === activeFilter : (!bFilter || bFilter === "");
        b.classList.toggle("active", isActive);
        b.setAttribute("aria-pressed", String(isActive));
    });

    updateCardVisibility();

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

export function resetAllFilters() {
    setSearchQuery("");
    applyFilter(null, { pushHistory: true });
}

export function initFilters() {
    const container = document.getElementById("math-filter-container");
    const grid = document.querySelector(".math-grid");
    if (!container || !grid) return;

    buttons = Array.from(container.querySelectorAll(".math-filter-btn"));
    cards = Array.from(grid.querySelectorAll(".math-card[data-formula]"));
    searchInput = document.getElementById("math-search-input");
    searchClearBtn = document.getElementById("math-search-clear");
    counterEl = document.getElementById("math-search-counter");
    emptyStateEl = document.getElementById("math-empty-state");
    emptyResetBtn = document.getElementById("math-empty-reset");

    activeFilter = null;
    searchQuery = "";

    buttons.forEach((b) => {
        const cat = b.dataset.filter;
        const countSpan = b.querySelector(".math-filter-count");
        if (countSpan) {
            if (!cat) {
                countSpan.textContent = String(cards.length);
            } else {
                const count = cards.filter((c) => c.dataset.category === cat).length;
                countSpan.textContent = String(count);
            }
        }
    });

    const initialRoute = parseCategoryUrl(window.location.pathname);
    if (initialRoute) {
        applyFilter(initialRoute.category, { pushHistory: false });
    } else {
        updateCardVisibility();
    }

    if (boundContainer !== container) {
        boundContainer = container;
        container.addEventListener("click", (e) => {
            const btn = e.target.closest(".math-filter-btn");
            if (!btn) return;
            const category = btn.dataset.filter || null;
            const next = activeFilter === category ? null : category;
            applyFilter(next, { pushHistory: true });
        });
    }

    if (searchInput && boundSearchInput !== searchInput) {
        boundSearchInput = searchInput;
        let debounceTimer = null;
        searchInput.addEventListener("input", (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                setSearchQuery(e.target.value);
            }, 120);
        });

        searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                setSearchQuery("");
                searchInput.blur();
            }
        });
    }

    if (searchClearBtn && boundClearBtn !== searchClearBtn) {
        boundClearBtn = searchClearBtn;
        searchClearBtn.addEventListener("click", () => {
            setSearchQuery("");
            if (searchInput) searchInput.focus();
        });
    }

    if (emptyResetBtn && boundResetBtn !== emptyResetBtn) {
        boundResetBtn = emptyResetBtn;
        emptyResetBtn.addEventListener("click", () => {
            resetAllFilters();
        });
    }

    if (!windowBound) {
        windowBound = true;
        window.addEventListener("keydown", (e) => {
            if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
                const menuView = document.getElementById("math-menu-view");
                if (searchInput && (!menuView || !menuView.classList.contains("hidden"))) {
                    e.preventDefault();
                    searchInput.focus();
                }
            }
        });
    }
}
