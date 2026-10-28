import { calculateBetweenness, calculateDegrees, buildAdjacency, findShortestPaths } from "./centrality-algorithms.js";
import { PRESETS, clonePreset } from "./centrality-datasets.js";
import { renderGraph, getNodeAt, toLogicalCoords } from "./centrality-renderer.js";
import { createNode, deleteNode, addEdge, removeEdge, findEdgeNearPoint, clearGraph } from "./centrality-editor.js";
import { renderLeaderboard, renderInspector, renderBanner, updateNodeSelects } from "./centrality-ui.js";

export function initCentralityApp() {
    const canvas = document.getElementById("centrality-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let currentPreset = "bridge";
    let graph = clonePreset(currentPreset);
    let mode = "inspect";
    let heatmapEnabled = true;
    let normalizedEnabled = true;
    let selectedA = null;
    let selectedB = null;
    let connectSource = null;
    let disconnectSource = null;
    let inspectedNode = 8;
    let shortestPaths = [];
    let draggingNode = null;
    let cursorPos = null;
    let hoveredEdge = null;
    let hoveredNode = null;
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
            inspectedNode, shortestPaths, heatmapEnabled, draggingNode,
            mode, connectSource, cursorPos, hoveredEdge, hoveredNode
        });
    }

    function updateUI() {
        const listEl = document.getElementById("centrality-top-list");
        const cardEl = document.getElementById("centrality-node-card");
        const bannerEl = document.getElementById("centrality-path-banner");
        const selFrom = document.getElementById("sel-node-from");
        const selTo = document.getElementById("sel-node-to");

        renderLeaderboard(listEl, scores, maxScore, inspectedNode, normalizedEnabled, (nodeId) => {
            inspectedNode = nodeId;
            render();
            updateUI();
        });

        renderInspector(cardEl, graph, scores, degrees, maxScore, inspectedNode, normalizedEnabled);

        renderBanner(bannerEl, mode, {
            connectSource, disconnectSource, selectedA, selectedB, shortestPaths, scores
        }, () => {
            selectedA = null;
            selectedB = null;
            recompute();
        });

        updateNodeSelects(selFrom, selTo, graph.nodes);
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
        const logical = toLogicalCoords(pt, canvas);
        const u = getNodeAt(graph, pt, canvas);

        if (mode === "add_node") {
            if (!u) {
                createNode(graph, logical.x, logical.y);
                recompute();
            }
            return;
        }

        if (mode === "connect") {
            if (u) {
                if (!connectSource) {
                    connectSource = u;
                } else if (connectSource !== u) {
                    addEdge(graph, connectSource, u);
                    connectSource = u;
                }
                recompute();
            }
            return;
        }

        if (mode === "disconnect") {
            if (u) {
                if (!disconnectSource) {
                    disconnectSource = u;
                } else {
                    removeEdge(graph, disconnectSource, u);
                    disconnectSource = null;
                }
                recompute();
                return;
            }
            const edge = findEdgeNearPoint(graph, logical);
            if (edge) {
                removeEdge(graph, edge[0], edge[1]);
                recompute();
            }
            return;
        }

        if (mode === "delete_node") {
            if (u) {
                deleteNode(graph, u);
                recompute();
            }
            return;
        }

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
        const pt = getEventPos(e);
        const logical = toLogicalCoords(pt, canvas);
        cursorPos = pt;

        if (mode === "disconnect") {
            hoveredEdge = findEdgeNearPoint(graph, logical);
        } else {
            hoveredEdge = null;
        }

        if (mode === "delete_node") {
            hoveredNode = getNodeAt(graph, pt, canvas);
        } else {
            hoveredNode = null;
        }

        if (draggingNode && mode === "inspect") {
            e.preventDefault();
            graph.positions[draggingNode] = {
                x: Math.max(30, Math.min(570, logical.x)),
                y: Math.max(30, Math.min(370, logical.y))
            };
        }
        render();
    }

    window.addEventListener("mouseup", () => {
        if (draggingNode) {
            draggingNode = null;
            render();
        }
    });

    document.querySelectorAll(".btn-mode").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".btn-mode").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            mode = btn.getAttribute("data-mode");
            connectSource = null;
            disconnectSource = null;
            hoveredEdge = null;
            hoveredNode = null;
            recompute();
        });
    });

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

    const btnClearCanvas = document.getElementById("btn-clear-canvas");
    if (btnClearCanvas) {
        btnClearCanvas.addEventListener("click", () => {
            clearGraph(graph);
            selectedA = null;
            selectedB = null;
            inspectedNode = null;
            document.querySelectorAll(".btn-preset").forEach(b => b.classList.remove("active"));
            recompute();
        });
    }

    const btnManualAdd = document.getElementById("btn-manual-add");
    if (btnManualAdd) {
        btnManualAdd.addEventListener("click", () => {
            const u = parseInt(document.getElementById("sel-node-from").value, 10);
            const v = parseInt(document.getElementById("sel-node-to").value, 10);
            if (addEdge(graph, u, v)) recompute();
        });
    }

    const btnManualCut = document.getElementById("btn-manual-cut");
    if (btnManualCut) {
        btnManualCut.addEventListener("click", () => {
            const u = parseInt(document.getElementById("sel-node-from").value, 10);
            const v = parseInt(document.getElementById("sel-node-to").value, 10);
            if (removeEdge(graph, u, v)) recompute();
        });
    }

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
