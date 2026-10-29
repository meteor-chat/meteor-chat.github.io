export function renderPopulationBoard(container, state) {
    if (!container) return;
    container.textContent = "";

    const {
        generation,
        maxGenerations,
        pc,
        status,
        statusMessage,
        currentPopulation,
        lastStepResult,
        diversity
    } = state;

    const wrap = document.createElement("div");
    wrap.className = "cross-pop-wrap";

    const statusBanner = document.createElement("div");
    statusBanner.className = `cross-pop-status cross-status-${status}`;

    const statusTitle = document.createElement("div");
    statusTitle.className = "cross-pop-status-title";
    if (status === "stopped_converged") {
        statusTitle.textContent = "\u2728 Berhenti: Konvergensi Pola Tercapai";
    } else if (status === "stopped_max_gen") {
        statusTitle.textContent = `\uD83D\uDED1 Berhenti: Batas Maksimum (${maxGenerations}) Tercapai`;
    } else if (generation === 0) {
        statusTitle.textContent = "\u25B6\uFE0F Populasi Awal Siap (Generasi 0)";
    } else {
        statusTitle.textContent = `\uD83D\uDFE2 Generasi ${generation} dari ${maxGenerations}`;
    }

    const statusDesc = document.createElement("div");
    statusDesc.className = "cross-pop-status-desc";
    statusDesc.textContent = statusMessage;

    statusBanner.appendChild(statusTitle);
    statusBanner.appendChild(statusDesc);
    wrap.appendChild(statusBanner);

    const metricsRow = document.createElement("div");
    metricsRow.className = "cross-pop-metrics";

    const divMetric = document.createElement("div");
    divMetric.className = "cross-metric-item";
    const divLabel = document.createElement("span");
    divLabel.className = "cross-metric-label";
    divLabel.textContent = "Diversitas Genetik:";
    const divVal = document.createElement("span");
    divVal.className = "cross-metric-value";
    divVal.textContent = `${diversity}%`;
    divMetric.appendChild(divLabel);
    divMetric.appendChild(divVal);

    const divBar = document.createElement("div");
    divBar.className = "cross-diversity-bar";
    const divFill = document.createElement("div");
    divFill.className = "cross-diversity-fill";
    divFill.style.width = `${Math.min(100, Math.max(0, diversity))}%`;
    divBar.appendChild(divFill);

    metricsRow.appendChild(divMetric);
    metricsRow.appendChild(divBar);
    wrap.appendChild(metricsRow);

    if (lastStepResult && Array.isArray(lastStepResult.pairs)) {
        const pairsSec = document.createElement("div");
        pairsSec.className = "cross-pop-section";

        const pairsTitle = document.createElement("div");
        pairsTitle.className = "cross-board-section-title";
        pairsTitle.textContent = `Pasangan Parent Terpilih (Generasi ${generation - 1})`;
        pairsSec.appendChild(pairsTitle);

        lastStepResult.pairs.forEach((pair) => {
            const pairCard = document.createElement("div");
            pairCard.className = "cross-pair-card";

            const pairHead = document.createElement("div");
            pairHead.className = "cross-pair-header";

            const pairBadge = document.createElement("span");
            pairBadge.className = "cross-pair-num";
            pairBadge.textContent = `Pasangan ${pair.pairIndex}`;

            const probBadge = document.createElement("span");
            probBadge.className = pair.crossoverApplied ? "cross-prob-badge cross-prob-yes" : "cross-prob-badge cross-prob-no";
            probBadge.textContent = pair.crossoverApplied
                ? `r = ${pair.rVal} \u2264 pc (${pair.pc}) \u279C Crossover Dilakukan`
                : `r = ${pair.rVal} > pc (${pair.pc}) \u279C Salin Langsung`;

            pairHead.appendChild(pairBadge);
            pairHead.appendChild(probBadge);
            pairCard.appendChild(pairHead);

            const chromoRowA = document.createElement("div");
            chromoRowA.className = "cross-pop-chromo-row";
            const labelA = document.createElement("span");
            labelA.className = "cross-pop-label";
            labelA.textContent = `P${pair.pairIndex * 2 - 1}:`;
            const bitsA = document.createElement("span");
            bitsA.className = "cross-pop-bits cross-bits-pa";
            bitsA.textContent = pair.parentA;
            chromoRowA.appendChild(labelA);
            chromoRowA.appendChild(bitsA);
            pairCard.appendChild(chromoRowA);

            const chromoRowB = document.createElement("div");
            chromoRowB.className = "cross-pop-chromo-row";
            const labelB = document.createElement("span");
            labelB.className = "cross-pop-label";
            labelB.textContent = `P${pair.pairIndex * 2}:`;
            const bitsB = document.createElement("span");
            bitsB.className = "cross-pop-bits cross-bits-pb";
            bitsB.textContent = pair.parentB;
            chromoRowB.appendChild(labelB);
            chromoRowB.appendChild(bitsB);
            pairCard.appendChild(chromoRowB);

            pairsSec.appendChild(pairCard);
        });

        wrap.appendChild(pairsSec);
    }

    const offSec = document.createElement("div");
    offSec.className = "cross-pop-section";

    const offTitle = document.createElement("div");
    offTitle.className = "cross-board-section-title";
    offTitle.textContent = generation === 0 ? "Kromosom Populasi Awal" : `Kumpulan Anak Kromosom (Generasi ${generation})`;
    offSec.appendChild(offTitle);

    const offTable = document.createElement("div");
    offTable.className = "cross-offspring-grid";

    currentPopulation.forEach((chromo, idx) => {
        const item = document.createElement("div");
        item.className = "cross-offspring-item";

        const badge = document.createElement("span");
        badge.className = `cross-chromo-badge cross-badge-c${(idx % 2) + 1}`;
        badge.textContent = generation === 0 ? `P${idx + 1}` : `O${idx + 1}`;

        const bitsWrap = document.createElement("div");
        bitsWrap.className = "cross-cells-wrap";

        for (let i = 0; i < chromo.length; i++) {
            const cell = document.createElement("div");
            cell.className = "cross-bit-cell";
            const bitVal = document.createElement("span");
            bitVal.className = "cross-bit-value";
            bitVal.textContent = chromo[i];
            const idxVal = document.createElement("span");
            idxVal.className = "cross-bit-index";
            idxVal.textContent = `${i + 1}`;
            cell.appendChild(bitVal);
            cell.appendChild(idxVal);
            bitsWrap.appendChild(cell);
        }

        const decVal = document.createElement("span");
        decVal.className = "cross-offspring-dec";
        decVal.textContent = `(${parseInt(chromo, 2)})`;

        item.appendChild(badge);
        item.appendChild(bitsWrap);
        item.appendChild(decVal);
        offTable.appendChild(item);
    });

    offSec.appendChild(offTable);
    wrap.appendChild(offSec);

    container.appendChild(wrap);
}
