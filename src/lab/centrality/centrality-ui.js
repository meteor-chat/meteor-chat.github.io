export function renderLeaderboard(listEl, scores, maxScore, inspectedNode, normalizedEnabled, onSelect) {
    if (!listEl) return;
    listEl.innerHTML = "";

    const sorted = Object.entries(scores)
        .map(([u, s]) => ({ node: parseInt(u, 10), score: s }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

    if (sorted.length === 0) {
        listEl.innerHTML = `<div class="rank-empty">Belum ada titik di graf.</div>`;
        return;
    }

    sorted.forEach((item, idx) => {
        const row = document.createElement("div");
        row.className = `rank-row ${item.node === inspectedNode ? "active" : ""}`;
        const pct = maxScore > 0 ? (item.score / maxScore) * 100 : 0;
        const scoreFmt = normalizedEnabled ? item.score.toFixed(4) : item.score.toFixed(1);
        let badgeClass = idx === 0 || pct >= 80 ? "badge-top" : (pct <= 20 ? "badge-low" : "badge-mid");
        let badgeText = idx === 0 || pct >= 80 ? "Gatekeeper" : (pct <= 20 ? "Perifer" : "Perantara");

        row.innerHTML = `<div class="rank-num">#${idx + 1}</div><div class="rank-info"><div class="rank-title">Node ${item.node} <span class="rank-badge ${badgeClass}">${badgeText}</span></div><div class="rank-meter"><div class="rank-fill" style="width: ${pct}%"></div></div></div><div class="rank-val">${scoreFmt}</div>`;
        row.addEventListener("click", () => onSelect(item.node));
        listEl.appendChild(row);
    });
}

export function renderInspector(cardEl, graph, scores, degrees, maxScore, inspectedNode, normalizedEnabled) {
    if (!cardEl) return;

    if (graph.nodes.length === 0) {
        cardEl.innerHTML = `<p class="inspector-desc">Graf kosong. Klik mode <strong>+ Titik</strong> untuk mulai membuat node.</p>`;
        return;
    }

    const u = inspectedNode && scores[inspectedNode] !== undefined ? inspectedNode : graph.nodes[0];
    const score = scores[u] !== undefined ? scores[u] : 0;
    const deg = degrees[u] || 0;
    const label = graph.labels && graph.labels[u] ? graph.labels[u] : `Node #${u}`;
    const scoreFmt = normalizedEnabled ? score.toFixed(4) : score.toFixed(1);
    const norm = maxScore > 0 ? score / maxScore : 0;

    let roleDesc = "Titik ini berada di <strong>Perifer Jaringan</strong> dengan peran komunikasi minim.";
    if (norm >= 0.75) {
        roleDesc = "Titik ini adalah <strong>Gatekeeper Utama</strong>. Menghubungkan komponen utama jaringan; jika terputus, komunikasi antar kelompok akan terisolasi.";
    } else if (norm >= 0.3) {
        roleDesc = "Titik ini adalah <strong>Jembatan Sekunder</strong> penting yang menjadi perantara rute terpendek alternatif.";
    } else if (deg > 3) {
        roleDesc = "Titik ini memiliki <strong>Konektivitas Lokal Tinggi</strong> (banyak teman) namun bukan jembatan komunikasi global.";
    }

    cardEl.innerHTML = `
        <div class="inspector-header"><div class="inspector-badge">Node ${u}</div><h3 class="inspector-name">${label}</h3></div>
        <div class="inspector-stats">
            <div class="stat-box"><span class="stat-lbl">Betweenness</span><span class="stat-val stat-hl">${scoreFmt}</span></div>
            <div class="stat-box"><span class="stat-lbl">Derajat</span><span class="stat-val">${deg} teman</span></div>
            <div class="stat-box"><span class="stat-lbl">Pengaruh</span><span class="stat-val">${(norm * 100).toFixed(1)}%</span></div>
        </div>
        <p class="inspector-desc">${roleDesc}</p>
    `;
}

export function renderBanner(bannerEl, mode, state, onClearPath) {
    if (!bannerEl) return;

    if (mode === "add_node") {
        bannerEl.innerHTML = `<span class="path-active">Mode <strong>+ Tambah Titik</strong>: Klik di kanvas kosong untuk menaruh node baru.</span>`;
        return;
    }
    if (mode === "connect") {
        bannerEl.innerHTML = !state.connectSource
            ? `<span class="path-active">Mode <strong>🔗 Sambung Garis</strong>: Klik titik pertama.</span>`
            : `<span class="path-active">Terpilih: <strong>Node ${state.connectSource}</strong>. Klik titik kedua untuk menyambung.</span>`;
        return;
    }
    if (mode === "disconnect") {
        bannerEl.innerHTML = !state.disconnectSource
            ? `<span class="path-error">Mode <strong>✂️ Putus Garis</strong>: Klik garis di kanvas atau klik titik pertama.</span>`
            : `<span class="path-error">Terpilih: <strong>Node ${state.disconnectSource}</strong>. Klik titik pasangan untuk memutus.</span>`;
        return;
    }
    if (mode === "delete_node") {
        bannerEl.innerHTML = `<span class="path-error">Mode <strong>🗑️ Hapus Titik</strong>: Klik titik mana saja untuk menghapusnya.</span>`;
        return;
    }

    if (!state.selectedA && !state.selectedB) {
        bannerEl.innerHTML = `<span class="path-hint">Klik node untuk inspeksi/drag. Klik 2 node berurutan untuk melihat <strong>lintasan terpendek</strong>.</span>`;
        return;
    }
    if (state.selectedA && !state.selectedB) {
        bannerEl.innerHTML = `<span class="path-active">Titik awal: <strong>Node ${state.selectedA}</strong>. Klik satu node lagi sebagai tujuan.</span>`;
        return;
    }
    if (state.shortestPaths.length === 0) {
        bannerEl.innerHTML = `<div class="path-result"><span class="path-error">Tidak ada rute antara Node ${state.selectedA} dan Node ${state.selectedB}.</span><button id="btn-clear-path" class="btn-clear-path" type="button">Reset</button></div>`;
    } else {
        const path = state.shortestPaths[0];
        const inters = path.slice(1, -1);
        let note = "";
        if (inters.length > 0) {
            const best = inters.reduce((max, c) => (state.scores[c] > state.scores[max] ? c : max), inters[0]);
            note = ` (Melewati Gatekeeper <strong>Node ${best}</strong>)`;
        }
        const str = path.map((n, i) => `<span class="${i === 0 ? "p-start" : (i === path.length - 1 ? "p-end" : "p-mid")}">${n}</span>`).join(" → ");
        bannerEl.innerHTML = `<div class="path-result"><div>Rute (${path.length - 1} langkah): ${str}${note}</div><button id="btn-clear-path" class="btn-clear-path" type="button">Reset</button></div>`;
    }

    const clearBtn = document.getElementById("btn-clear-path");
    if (clearBtn) clearBtn.addEventListener("click", onClearPath);
}

export function updateNodeSelects(selFrom, selTo, nodes) {
    if (!selFrom || !selTo) return;
    const curFrom = selFrom.value;
    const curTo = selTo.value;
    const opts = nodes.map(u => `<option value="${u}">Node ${u}</option>`).join("");
    selFrom.innerHTML = opts;
    selTo.innerHTML = opts;
    if (curFrom && nodes.includes(parseInt(curFrom, 10))) selFrom.value = curFrom;
    if (curTo && nodes.includes(parseInt(curTo, 10))) selTo.value = curTo;
}
