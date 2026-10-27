import { refs } from "./dom-refs.js";
import { state } from "./app-state.js";
import { showError, hideError } from "./error-view.js";
import { FORMULAS } from "./math-formulas.js";
import { bindMathRefs, FORM_COUNT } from "./math-refs.js";
import { bindMathInputs } from "./math-inputs.js";
import { loadForm, hasForm } from "./math-modules.js";
import { FORMULA_NAMES } from "./math-formula-names.js";
import { getFormulaUrl, getCategoryUrl } from "./math-routes.js";
import { getActiveFilter } from "./math-filter.js";

let ready = false;
let openToken = 0;

function setup() {
    if (ready) return;
    bindMathRefs();
    bindMathInputs();
    for (let i = 1; i <= FORM_COUNT; i++) {
        const back = document.getElementById(i === 1 ? "btn-math-calc-back" : `btn-math-calc-back-${i}`);
        if (back) back.addEventListener("click", () => closeForm());
    }
    ready = true;
}

function renderFormula(n) {
    const box = refs[`mathFormulaDisplay${n === 1 ? "" : n}`];
    if (box && FORMULAS[n] && typeof katex !== "undefined") {
        katex.render(FORMULAS[n], box, { throwOnError: false, displayMode: false });
    }
}

function showForm(n) {
    refs.mathMenu.classList.add("hidden");
    refs.mathCalc.classList.remove("hidden");
    for (let i = 1; i <= FORM_COUNT; i++) {
        if (refs[`form${i}`]) refs[`form${i}`].classList.toggle("hidden", i !== n);
    }
    state.currentView = "math-calc";
    if (FORMULA_NAMES[n]) document.title = `${FORMULA_NAMES[n]} - Meteor`;
    window.scrollTo(0, 0);
}

export function prefetchForm(n) {
    if (!hasForm(n)) return;
    loadForm(n).catch(() => {});
}

export async function openForm(n, card, options = {}) {
    if (!hasForm(n)) return;
    setup();
    const token = ++openToken;
    if (card) card.setAttribute("aria-busy", "true");
    try {
        const form = await loadForm(n);
        if (token !== openToken) return;
        hideError();
        showForm(n);
        renderFormula(n);
        form.open();
        const url = getFormulaUrl(n);
        if (options.pushHistory !== false) {
            if (window.location.pathname !== url) {
                history.pushState({ formulaId: n }, "", url);
            }
        } else if (!history.state || history.state.formulaId !== n) {
            history.replaceState({ formulaId: n }, "", url);
        }
    } catch (e) {
        showError(`Kalkulator gagal dimuat: ${e.message}`);
    } finally {
        if (card) card.removeAttribute("aria-busy");
    }
}

export function closeForm(options = {}) {
    openToken++;
    refs.mathCalc.classList.add("hidden");
    refs.mathMenu.classList.remove("hidden");
    state.currentView = "math-menu";
    const active = getActiveFilter();
    document.title = active ? `${active} - Meteor` : "Math - Meteor";
    if (options.pushHistory !== false) {
        const targetUrl = active ? getCategoryUrl(active) : "/math";
        if (window.location.pathname !== targetUrl && window.location.pathname !== targetUrl + "/") {
            history.pushState({ formulaId: null, category: active }, "", targetUrl);
        }
    }
}
