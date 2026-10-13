import {
    createGridState,
    clearWalls,
    clearPath,
    generateMaze
} from "./search-grid-state.js";
import { setupArenaCanvas, drawArena } from "./search-grid-draw.js";
import { attachArenaEvents } from "./search-grid-events.js";
import { executeAlgorithm } from "./search-algorithms.js";
import {
    animatePathfinding,
    isPathfindingActive,
    stopPathfindingAnimation
} from "./search-animator.js";

const WIDTH = 800;
const HEIGHT = 450;
const ROWS = 22;
const COLS = 40;

const ALGO_NAMES = {
    bfs: "BFS",
    dfs: "DFS",
    dijkstra: "Dijkstra"
};

const canvas = document.getElementById("search-canvas");
const filterButtons = document.querySelectorAll(".search-filter-btn");
const btnVisualize = document.getElementById("btn-visualize");
const btnClearWalls = document.getElementById("btn-clear-walls");
const btnClearPath = document.getElementById("btn-clear-path");
const btnGenerateMaze = document.getElementById("btn-generate-maze");

let currentAlgorithm = "bfs";
const gridState = createGridState(ROWS, COLS);
let ctx = null;

function render() {
    if (!canvas) return;
    if (!ctx) {
        ctx = setupArenaCanvas(canvas, WIDTH, HEIGHT);
    }
    drawArena(ctx, WIDTH, HEIGHT, gridState);
}

function updateVisualizeButtonText() {
    if (!btnVisualize) return;
    const name = ALGO_NAMES[currentAlgorithm] || "Search";
    btnVisualize.textContent = `Visualize ${name}`;
}

function setControlsDisabled(disabled) {
    filterButtons.forEach((btn) => {
        btn.style.pointerEvents = disabled ? "none" : "auto";
    });
    if (btnVisualize) btnVisualize.disabled = disabled;
    if (btnClearWalls) btnClearWalls.disabled = disabled;
    if (btnClearPath) btnClearPath.disabled = disabled;
    if (btnGenerateMaze) btnGenerateMaze.disabled = disabled;
}

export function getActiveSearchAlgorithm() {
    return currentAlgorithm;
}

export function setActiveSearchAlgorithm(algo) {
    if (isPathfindingActive()) return;
    currentAlgorithm = algo;
    filterButtons.forEach((btn) => {
        const matches = btn.getAttribute("data-search") === algo;
        btn.classList.toggle("active", matches);
    });
    updateVisualizeButtonText();
}

export function getGridState() {
    return gridState;
}

export function startSearch() {
    if (isPathfindingActive()) return;

    clearPath(gridState);
    render();

    const { visitedInOrder, path } = executeAlgorithm(currentAlgorithm, gridState);
    setControlsDisabled(true);

    animatePathfinding(
        gridState,
        visitedInOrder,
        path,
        render,
        () => {
            setControlsDisabled(false);
        }
    );
}

export function initSearchController() {
    if (canvas) {
        ctx = setupArenaCanvas(canvas, WIDTH, HEIGHT);
        render();
        attachArenaEvents(canvas, gridState, render, WIDTH, HEIGHT);
    }

    updateVisualizeButtonText();

    filterButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const algo = btn.getAttribute("data-search");
            if (algo) {
                setActiveSearchAlgorithm(algo);
            }
        });
    });

    if (btnVisualize) {
        btnVisualize.addEventListener("click", () => {
            startSearch();
        });
    }

    if (btnClearWalls) {
        btnClearWalls.addEventListener("click", () => {
            if (isPathfindingActive()) stopPathfindingAnimation();
            setControlsDisabled(false);
            clearWalls(gridState);
            render();
        });
    }

    if (btnClearPath) {
        btnClearPath.addEventListener("click", () => {
            if (isPathfindingActive()) stopPathfindingAnimation();
            setControlsDisabled(false);
            clearPath(gridState);
            render();
        });
    }

    if (btnGenerateMaze) {
        btnGenerateMaze.addEventListener("click", () => {
            if (isPathfindingActive()) stopPathfindingAnimation();
            setControlsDisabled(false);
            generateMaze(gridState);
            render();
        });
    }

    window.addEventListener("resize", () => {
        if (canvas) {
            ctx = setupArenaCanvas(canvas, WIDTH, HEIGHT);
            render();
        }
    });
}

initSearchController();
