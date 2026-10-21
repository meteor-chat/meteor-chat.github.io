import { refs } from "./dom-refs.js";
import { renderFinancialCards, renderFinancialTopFormula } from "./math-calc-27-cards.js";

function parseNum(el) {
    if (!el) return null;
    const v = el.value.trim();
    if (v === "" || isNaN(parseFloat(v))) return null;
    return parseFloat(v);
}

export function calculateMath27() {
    renderFinancialTopFormula();
    const rev = parseNum(refs.m27InRev);
    const exp = parseNum(refs.m27InExp);
    const dev = parseNum(refs.m27InDev);
    const support = parseNum(refs.m27InSupport);
    const est = parseNum(refs.m27InEst);
    const act = parseNum(refs.m27InAct);

    renderFinancialCards(rev, exp, dev, support, est, act);
}
