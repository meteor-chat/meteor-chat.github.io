import { refs } from "./dom-refs.js";
import { formatMax3 } from "./math-format.js";
import { renderEvmCards, renderEvmTopFormula } from "./math-calc-25-cards.js";

function parseNum(el) {
    if (!el) return null;
    const v = el.value.trim();
    if (v === "" || isNaN(parseFloat(v))) return null;
    return parseFloat(v);
}

function updateVisualBars(bac, pv, ev, ac) {
    const box = document.getElementById("m25-bars-box");
    if (!box) return;
    box.textContent = "";

    const maxVal = Math.max(bac || 1, pv || 0, ev || 0, ac || 0);

    const items = [
        { label: "Planned Value (PV)", val: pv, color: "#38bdf8" },
        { label: "Earned Value (EV)", val: ev, color: "#34d399" },
        { label: "Actual Cost (AC)", val: ac, color: "#f87171" }
    ];

    items.forEach((item) => {
        const row = document.createElement("div");
        row.className = "evm-bar-row";

        const label = document.createElement("div");
        label.className = "evm-bar-label";
        label.textContent = item.label;

        const track = document.createElement("div");
        track.className = "evm-bar-track";

        const fill = document.createElement("div");
        fill.className = "evm-bar-fill";
        const pct = item.val !== null && maxVal > 0 ? Math.min(100, Math.max(0, (item.val / maxVal) * 100)) : 0;
        fill.style.width = `${pct}%`;
        fill.style.backgroundColor = item.color;

        const valText = document.createElement("div");
        valText.className = "evm-bar-val";
        valText.textContent = item.val !== null ? formatMax3(item.val) : "-";

        track.appendChild(fill);
        row.appendChild(label);
        row.appendChild(track);
        row.appendChild(valText);
        box.appendChild(row);
    });
}

export function calculateMath25() {
    renderEvmTopFormula();
    const bac = parseNum(refs.m25InBac);
    const plannedPct = parseNum(refs.m25InPlannedPct);
    const actualPct = parseNum(refs.m25InActualPct);
    const ac = parseNum(refs.m25InAc);
    const planTime = parseNum(refs.m25InTime);

    const pv = (bac !== null && plannedPct !== null) ? bac * (plannedPct / 100) : null;
    const ev = (bac !== null && actualPct !== null) ? bac * (actualPct / 100) : null;

    updateVisualBars(bac, pv, ev, ac);
    renderEvmCards(bac, plannedPct, actualPct, ac, planTime);
}
