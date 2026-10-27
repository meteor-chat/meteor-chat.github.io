import { initFilters, applyFilter } from "./math-filter.js";
import { parseFormulaUrl, parseCategoryUrl } from "./math-routes.js";
import { initCubeThumbnail } from "./cube-thumb.js?v=2";

const KATEX_HREF = new URL("./vendor/katex/katex.min.js", import.meta.url).href;
const CONTROLLER_GRAPH = [
    "./math-controller.js",
    "./math-routes.js",
    "./dom-refs.js",
    "./app-state.js",
    "./error-view.js",
    "./math-formulas.js",
    "./math-refs.js",
    "./math-inputs.js",
    "./math-modules.js",
    "./lazy-assets.js"
];

let controllerPromise = null;

function loadController() {
    if (!controllerPromise) {
        controllerPromise = import("./math-controller.js").catch((error) => {
            controllerPromise = null;
            throw error;
        });
    }
    return controllerPromise;
}

function reportError(error) {
    import("./error-view.js")
        .then(({ showError }) => showError(`Kalkulator gagal dimuat: ${error.message}`))
        .catch(() => {});
}

function findCard(target) {
    const card = target.closest(".math-card[data-formula]");
    return card && !card.disabled ? card : null;
}

function addHint(rel, href, as) {
    const link = document.createElement("link");
    link.rel = rel;
    link.href = href;
    if (as) link.as = as;
    document.head.appendChild(link);
}

function prefetchWhenIdle() {
    if (navigator.connection && navigator.connection.saveData) return;
    const run = () => {
        CONTROLLER_GRAPH.forEach((path) => addHint("modulepreload", new URL(path, import.meta.url).href));
        addHint("prefetch", KATEX_HREF, "script");
    };
    const schedule = () => {
        if ("requestIdleCallback" in window) {
            window.requestIdleCallback(run, { timeout: 3000 });
        } else {
            setTimeout(run, 1500);
        }
    };
    if (document.readyState === "complete") {
        schedule();
    } else {
        window.addEventListener("load", schedule, { once: true });
    }
}

function bindGrid(grid) {
    const warm = (e) => {
        const card = findCard(e.target);
        if (!card) return;
        const n = Number(card.dataset.formula);
        loadController()
            .then((controller) => controller.prefetchForm(n))
            .catch(() => {});
    };
    grid.addEventListener("pointerover", warm, { passive: true });
    grid.addEventListener("focusin", warm);
    grid.addEventListener("click", (e) => {
        const card = findCard(e.target);
        if (!card) return;
        const n = Number(card.dataset.formula);
        loadController()
            .then((controller) => controller.openForm(n, card))
            .catch(reportError);
    });
}

function handleRoute() {
    const route = parseFormulaUrl(window.location.pathname);
    if (route) {
        let initialized = false;
        const init = () => {
            if (initialized) return;
            initialized = true;
            loadController()
                .then((controller) => controller.openForm(route.id, null, { pushHistory: false }))
                .catch(reportError);
        };
        const form = document.getElementById(`math-calc-form-${route.id}`);
        if (form && !form.classList.contains("hidden")) {
            const events = ["pointerdown", "keydown", "focusin", "touchstart"];
            const trigger = () => {
                events.forEach((ev) => form.removeEventListener(ev, trigger));
                init();
            };
            events.forEach((ev) => form.addEventListener(ev, trigger, { passive: true, once: true }));
            if ("requestIdleCallback" in window) {
                window.requestIdleCallback(init, { timeout: 2500 });
            } else {
                setTimeout(init, 1200);
            }
            return;
        }
        init();
        return;
    }
    const catRoute = parseCategoryUrl(window.location.pathname);
    if (catRoute) {
        applyFilter(catRoute.category, { pushHistory: false });
    }
}

initFilters();
initCubeThumbnail();
const grid = document.querySelector(".math-grid");
if (grid) bindGrid(grid);
prefetchWhenIdle();
handleRoute();
window.addEventListener("popstate", (e) => {
    const formulaId = e.state?.formulaId;
    loadController()
        .then((controller) => {
            if (formulaId) {
                controller.openForm(formulaId, null, { pushHistory: false });
            } else {
                const route = parseFormulaUrl(window.location.pathname);
                if (route) {
                    controller.openForm(route.id, null, { pushHistory: false });
                } else {
                    controller.closeForm({ pushHistory: false });
                    const catRoute = parseCategoryUrl(window.location.pathname);
                    applyFilter(catRoute ? catRoute.category : null, { pushHistory: false });
                }
            }
        })
        .catch(reportError);
});
