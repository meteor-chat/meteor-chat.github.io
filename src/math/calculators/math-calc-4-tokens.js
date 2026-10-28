import { drawRouletteWheel4 } from "../visuals/math-visual-4.js";
import { renderSelectionCards } from "./math-calc-4-cards.js";

function setIndividualHighlight(index, count, values, isHovered) {
    for (let i = 0; i < count; i++) {
        const row = document.getElementById(`sel-row-${i}`);
        const active = isHovered && i === index;
        if (row) {
            row.classList.toggle("sel-row-active", active);
        }
        const valTokens = document.querySelectorAll(`.sel-token-val-${i}`);
        valTokens.forEach(el => el.classList.toggle(`sel-glow-${i}`, active));
        const pTokens = document.querySelectorAll(`.sel-token-p-${i}`);
        pTokens.forEach(el => el.classList.toggle(`sel-glow-${i}`, active));
    }
    const actIdx = isHovered ? index : 0;
    renderSelectionCards(values, actIdx);
    drawRouletteWheel4(values, isHovered ? index : -1);
}

export function bindSelectionTokens(count, getValues) {
    for (let i = 0; i < count; i++) {
        const row = document.getElementById(`sel-row-${i}`);
        const input = document.getElementById(`sel-input-${i}`);
        if (!row || !input) continue;

        const onEnter = () => {
            const values = getValues();
            setIndividualHighlight(i, count, values, true);
        };
        const onLeave = () => {
            const values = getValues();
            setIndividualHighlight(i, count, values, false);
        };

        row.onmouseenter = onEnter;
        row.onmouseleave = onLeave;
        input.onfocus = onEnter;
        input.onblur = onLeave;
    }
}

export function handleCanvasSliceHover(index, count, getValues) {
    const values = getValues();
    if (index >= 0 && index < count) {
        setIndividualHighlight(index, count, values, true);
    } else {
        setIndividualHighlight(-1, count, values, false);
    }
}
