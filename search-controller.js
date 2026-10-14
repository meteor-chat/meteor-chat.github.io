import {
    createGridState,
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

const canvas = document.getElementById("search-canvas");
const filterButtons = document.querySelectorAll(".search-filter-btn");
const btnRun = document.getElementById("btn-run") || document.getElementById("btn-visualize");
const btnRandomize = document.getElementById("btn-randomize") || document.getElementById("btn-generate-maze");

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

function setControlsDisabled(disabled) {
    filterButtons.forEach((btn) => {
        btn.style.pointerEvents = disabled ? "none" : "auto";
    });
    if (btnRun) btnRun.disabled = disabled;
    if (btnRandomize) btnRandomize.disabled = disabled;
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
    clearPath(gridState);
    render();
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

export function randomizeGrid() {
    if (isPathfindingActive()) stopPathfindingAnimation();
    setControlsDisabled(false);
    generateMaze(gridState);
    render();
}

export function initSearchController() {
    if (canvas) {
        ctx = setupArenaCanvas(canvas, WIDTH, HEIGHT);
        render();
        attachArenaEvents(canvas, gridState, render, WIDTH, HEIGHT);
    }

    filterButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const algo = btn.getAttribute("data-search");
            if (algo) {
                setActiveSearchAlgorithm(algo);
            }
        });
    });

    if (btnRun) {
        btnRun.addEventListener("click", () => {
            startSearch();
        });
    }

    if (btnRandomize) {
        btnRandomize.addEventListener("click", () => {
            randomizeGrid();
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

