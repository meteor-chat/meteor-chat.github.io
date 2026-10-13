const buttons = document.querySelectorAll(".search-filter-btn");

let currentAlgorithm = "bfs";

export function getActiveSearchAlgorithm() {
    return currentAlgorithm;
}

export function setActiveSearchAlgorithm(algo) {
    currentAlgorithm = algo;
    buttons.forEach((btn) => {
        const matches = btn.getAttribute("data-search") === algo;
        btn.classList.toggle("active", matches);
    });
}

export function initSearchController() {
    buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const algo = btn.getAttribute("data-search");
            if (algo) {
                setActiveSearchAlgorithm(algo);
            }
        });
    });
}

initSearchController();
