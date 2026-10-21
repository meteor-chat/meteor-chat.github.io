import { refs } from "./dom-refs.js";
import { renderFpaCards, renderFpaTopFormula } from "./math-calc-26-cards.js";

function parseNum(el) {
    if (!el) return null;
    const v = el.value.trim();
    if (v === "" || isNaN(parseFloat(v))) return null;
    return parseFloat(v);
}

export function calculateMath26() {
    renderFpaTopFormula();
    const ei = parseNum(refs.m26InEi);
    const eif = parseNum(refs.m26InEif);
    const eo = parseNum(refs.m26InEo);
    const eq = parseNum(refs.m26InEq);
    const ilf = parseNum(refs.m26InIlf);
    const lang = parseNum(refs.m26InLang);
    const rate = parseNum(refs.m26InRate);

    renderFpaCards(ei, eif, eo, eq, ilf, lang, rate);
}
