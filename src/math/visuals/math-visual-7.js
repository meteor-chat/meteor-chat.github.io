export function renderVisualChromosomeBoard(container, state, onCutChange) {
    if (!container) return;
    container.textContent = "";

    const { p1, p2, type, k, k1, k2, mask, c1, c2, valid, errorMsg } = state;

    if (!valid) {
        const errBox = document.createElement("div");
        errBox.className = "cross-visual-empty";
        errBox.textContent = errorMsg || "Masukkan kromosom biner yang valid";
        container.appendChild(errBox);
        return;
    }

    const n = p1.length;

    const wrap = document.createElement("div");
    wrap.className = "cross-board-wrap";

    const titleParents = document.createElement("div");
    titleParents.className = "cross-board-section-title";
    titleParents.textContent = "Kromosom Induk (Parents)";
    wrap.appendChild(titleParents);

    const makeRow = (id, labelText, bitString, isParent, parentOrigin) => {
        const row = document.createElement("div");
        row.className = `cross-chromo-row cross-row-${id}`;

        const badge = document.createElement("span");
        badge.className = `cross-chromo-badge cross-badge-${id}`;
        badge.textContent = labelText;
        row.appendChild(badge);

        const cellsWrap = document.createElement("div");
        cellsWrap.className = "cross-cells-wrap";

        for (let i = 0; i < n; i++) {
            const cell = document.createElement("button");
            cell.type = "button";
            cell.className = "cross-bit-cell";
            cell.dataset.index = String(i + 1);

            let origin = id;
            if (!isParent && parentOrigin) {
                origin = parentOrigin[i];
            }
            cell.classList.add(`cross-origin-${origin}`);

            if (type === "single") {
                if (i + 1 === k) {
                    cell.classList.add("cross-cut-after");
                }
            } else if (type === "two") {
                if (i + 1 === k1 || i + 1 === k2) {
                    cell.classList.add("cross-cut-after");
                }
            }

            if (isParent && onCutChange && type === "single") {
                cell.setAttribute("title", `Klik untuk potong setelah gen ${i + 1}`);
                cell.addEventListener("click", () => {
                    if (i + 1 < n) onCutChange(i + 1);
                });
            }

            const bitVal = document.createElement("span");
            bitVal.className = "cross-bit-value";
            bitVal.textContent = bitString[i];

            const idxVal = document.createElement("span");
            idxVal.className = "cross-bit-index";
            idxVal.textContent = `${i + 1}`;

            cell.appendChild(bitVal);
            cell.appendChild(idxVal);
            cellsWrap.appendChild(cell);
        }

        row.appendChild(cellsWrap);
        return row;
    };

    wrap.appendChild(makeRow("p1", "P1", p1, true));
    wrap.appendChild(makeRow("p2", "P2", p2, true));

    const divider = document.createElement("div");
    divider.className = "cross-board-divider";

    const cutInfo = document.createElement("span");
    cutInfo.className = "cross-cut-badge";
    if (type === "single") {
        cutInfo.textContent = `\u2702\uFE0F Titik Potong k = ${k}`;
    } else if (type === "two") {
        cutInfo.textContent = `\u2702\uFE0F Titik Potong k1 = ${k1}, k2 = ${k2}`;
    } else {
        cutInfo.textContent = `\uD83C\uDFB2 Uniform Mask = ${mask}`;
    }
    divider.appendChild(cutInfo);
    wrap.appendChild(divider);

    const titleOffspring = document.createElement("div");
    titleOffspring.className = "cross-board-section-title";
    titleOffspring.textContent = "Kromosom Anak (Offspring)";
    wrap.appendChild(titleOffspring);

    const originC1 = [];
    const originC2 = [];
    for (let i = 0; i < n; i++) {
        if (type === "single") {
            originC1.push(i < k ? "p1" : "p2");
            originC2.push(i < k ? "p2" : "p1");
        } else if (type === "two") {
            const inMid = i >= k1 && i < k2;
            originC1.push(inMid ? "p2" : "p1");
            originC2.push(inMid ? "p1" : "p2");
        } else {
            const bit = mask[i];
            originC1.push(bit === "1" ? "p1" : "p2");
            originC2.push(bit === "1" ? "p2" : "p1");
        }
    }

    wrap.appendChild(makeRow("c1", "C1", c1, false, originC1));
    wrap.appendChild(makeRow("c2", "C2", c2, false, originC2));

    container.appendChild(wrap);
}
