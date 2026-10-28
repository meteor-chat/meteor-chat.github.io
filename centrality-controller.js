import { calculateBetweenness, calculateDegrees, buildAdjacency, findShortestPaths } from "./centrality-algorithms.js";
import { PRESETS, clonePreset } from "./centrality-datasets.js";
import { renderGraph, getNodeAt, toLogicalCoords } from "./centrality-renderer.js";

export function initCentralityApp() {
    const canvas = document.getElementById("centrality-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let currentPreset = "bridge";
    let graph = clonePreset(currentPreset);
    let heatmapEnabled = true;
    let normalizedEnabled = true;
    let selectedA = null;
    let selectedB = null;
    let inspectedNode = 8;
    let shortestPaths = [];
    let draggingNode = null;
    let scores = {};
    let degrees = {};
    let maxScore = 0;

    function recompute() {
        scores = calculateBetweenness(graph.nodes, graph.edges, normalizedEnabled);
        degrees = calculateDegrees(graph.nodes, graph.edges);
        maxScore = Math.max(0.0001, ...Object.values(scores));

        if (selectedA && selectedB) {
            const adj = buildAdjacency(graph.nodes, graph.edges);
            shortestPaths = findShortestPaths(adj, selectedA, selectedB);
        } else {
            shortestPaths = [];
        }

        render();
        updateUI();
    }

    function render() {
        renderGraph(canvas, ctx, {
            graph, scores, maxScore, selectedA, selectedB,
            inspectedNode, shortestPaths, heatmapEnabled, draggingNode
        });
    }

    function updateUI() {
        renderLeaderboard();
        renderInspector();
        renderPathBanner();
    }

    function renderLeaderboard() {
        const listEl = document.getElementById("centrality-top-list");
        if (!listEl) return;
        listEl.innerHTML = "";

        const sorted = Object.entries(scores)
            .map(([u, s]) => ({ node: parseInt(u, 10), score: s }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        sorted.forEach((item, idx) => {
            const row = document.createElement("div");
            row.className = `rank-row ${item.node === inspectedNode ? "active" : ""}`;
            const pct = maxScore > 0 ? (item.score / maxScore) * 100 : 0;
            const scoreFmt = normalizedEnabled ? item.score.toFixed(4) : item.score.toFixed(1);
            let badgeClass = idx === 0 || pct >= 80 ? "badge-top" : (pct <= 20 ? "badge-low" : "badge-mid");
            let badgeText = idx === 0 || pct >= 80 ? "Gatekeeper" : (pct <= 20 ? "Perifer" : "Perantara");

            row.innerHTML = `<div class="rank-num">#${idx + 1}</div><div class="rank-info"><div class="rank-title">Node ${item.node} <span class="rank-badge ${badgeClass}">${badgeText}</span></div><div class="rank-meter"><div class="rank-fill" style="width: ${pct}%"></div></div></div><div class="rank-val">${scoreFmt}</div>`;
            row.addEventListener("click", () => {
                inspectedNode = item.node;
                render();
                updateUI();
            });
            listEl.appendChild(row);
        });
    }

    function renderInspector() {
        const cardEl = document.getElementById("centrality-node-card");
        if (!cardEl) return;

        if (!inspectedNode || scores[inspectedNode] === undefined) {
            const topNode = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
            if (topNode) inspectedNode = parseInt(topNode[0], 10);
        }

        const u = inspectedNode;
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
                <div class="stat-box"><span class="stat-lbl">Derajat</span><span class="stat-val">${deg} tetangga</span></div>
                <div class="stat-box"><span class="stat-lbl">Pengaruh</span><span class="stat-val">${(norm * 100).toFixed(1)}%</span></div>
            </div>
            <p class="inspector-desc">${roleDesc}</p>
        `;
    }

    function renderPathBanner() {
        const bannerEl = document.getElementById("centrality-path-banner");
        if (!bannerEl) return;

        if (!selectedA && !selectedB) {
            bannerEl.innerHTML = `<span class="path-hint">Klik node di kanvas untuk inspeksi. Klik 2 node untuk melihat <strong>lintasan terpendek</strong>.</span>`;
            return;
        }

        if (selectedA && !selectedB) {
            bannerEl.innerHTML = `<span class="path-active">Titik awal: <strong>Node ${selectedA}</strong>. Klik satu node lagi sebagai tujuan.</span>`;
            return;
        }

        if (shortestPaths.length === 0) {
            bannerEl.innerHTML = `<span class="path-error">Tidak ditemukan lintasan antara Node ${selectedA} dan Node ${selectedB}.</span>`;
            return;
        }

        const path = shortestPaths[0];
        const inters = path.slice(1, -1);
        let note = "";
        if (inters.length > 0) {
            const best = inters.reduce((max, c) => (scores[c] > scores[max] ? c : max), inters[0]);
            note = ` (Melewati Gatekeeper <strong>Node ${best}</strong>)`;
        }
        const str = path.map((n, i) => `<span class="${i === 0 ? "p-start" : (i === path.length - 1 ? "p-end" : "p-mid")}">${n}</span>`).join(" → ");

        bannerEl.innerHTML = `<div class="path-result"><div>Rute (${path.length - 1} langkah): ${str}${note}</div><button id="btn-clear-path" class="btn-clear-path" type="button">Reset</button></div>`;
        const clearBtn = document.getElementById("btn-clear-path");
        if (clearBtn) {
            clearBtn.addEventListener("click", () => {
                selectedA = null;
                selectedB = null;
                recompute();
            });
        }
    }

    function getEventPos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height)
        };
    }

    canvas.addEventListener("mousedown", onPointerDown);
    canvas.addEventListener("touchstart", onPointerDown, { passive: false });

    function onPointerDown(e) {
        const pt = getEventPos(e);
        const u = getNodeAt(graph, pt, canvas);
        if (u) {
            e.preventDefault();
            draggingNode = u;
            inspectedNode = u;
            if (!selectedA) {
                selectedA = u;
            } else if (!selectedB && u !== selectedA) {
                selectedB = u;
            } else {
                selectedA = u;
                selectedB = null;
            }
            recompute();
        }
    }

    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("touchmove", onPointerMove, { passive: false });

    function onPointerMove(e) {
        if (!draggingNode) return;
        e.preventDefault();
        const pt = getEventPos(e);
        const logical = toLogicalCoords(pt, canvas);
        graph.positions[draggingNode] = {
            x: Math.max(30, Math.min(570, logical.x)),
            y: Math.max(30, Math.min(370, logical.y))
        };
        render();
    }

    window.addEventListener("mouseup", onPointerUp);
    window.addEventListener("touchend", onPointerUp);

    function onPointerUp() {
        if (draggingNode) {
            draggingNode = null;
            render();
        }
    }

    document.querySelectorAll(".btn-preset").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".btn-preset").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentPreset = btn.getAttribute("data-preset");
            graph = clonePreset(currentPreset);
            selectedA = null;
            selectedB = null;
            inspectedNode = graph.nodes[0];
            recompute();
        });
    });

    const toggleHeatmap = document.getElementById("toggle-heatmap");
    if (toggleHeatmap) {
        toggleHeatmap.addEventListener("click", () => {
            heatmapEnabled = !heatmapEnabled;
            toggleHeatmap.classList.toggle("active", heatmapEnabled);
            render();
        });
    }

    const toggleNorm = document.getElementById("toggle-norm");
    if (toggleNorm) {
        toggleNorm.addEventListener("click", () => {
            normalizedEnabled = !normalizedEnabled;
            toggleNorm.classList.toggle("active", normalizedEnabled);
            toggleNorm.textContent = normalizedEnabled ? "Skor: 0.0–1.0" : "Skor: Mentah";
            recompute();
        });
    }

    const btnResetPos = document.getElementById("btn-reset-pos");
    if (btnResetPos) {
        btnResetPos.addEventListener("click", () => {
            graph = clonePreset(currentPreset);
            recompute();
        });
    }

    recompute();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCentralityApp);
} else {
    initCentralityApp();
}
