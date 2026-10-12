export function initFilters() {
    const container = document.getElementById("math-filter-container");
    const grid = document.querySelector(".math-grid");
    if (!container || !grid) return;

    const buttons = Array.from(container.querySelectorAll(".math-filter-btn"));
    const cards = Array.from(grid.querySelectorAll(".math-card"));
    let activeFilter = null;

    container.addEventListener("click", (e) => {
        const btn = e.target.closest(".math-filter-btn");
        if (!btn) return;
        const category = btn.dataset.filter;
        activeFilter = activeFilter === category ? null : category;

        buttons.forEach((b) => {
            const isActive = b.dataset.filter === activeFilter;
            b.classList.toggle("active", isActive);
            b.setAttribute("aria-pressed", String(isActive));
        });

        cards.forEach((card) => {
            const hidden = activeFilter !== null && card.dataset.category !== activeFilter;
            card.classList.toggle("math-hidden", hidden);
        });
    });
}
