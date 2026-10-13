import {
    createGridState,
    clearWalls,
    clearPath,
    generateMaze
} from "./search-grid-state.js";
import { setupArenaCanvas, drawArena } from "./search-grid-draw.js";
import { attachArenaEvents } from "./search-grid-events.js";

const WIDTH = 800;
const HEIGHT = 450;
const ROWS = 22;
const COLS = 40;

const canvas = document.getElementById("search-canvas");
const filterButtons = document.querySelectorAll(".search-filter-btn");
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

export function getActiveSearchAlgorithm() {
    return currentAlgorithm;
}

export function setActiveSearchAlgorithm(algo) {
    currentAlgorithm = algo;
    filterButtons.forEach((btn) => {
        const matches = btn.getAttribute("data-search") === algo;
        btn.classList.toggle("active", matches);
    });
}

export function getGridState() {
    return gridState;
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

    if (btnClearWalls) {
        btnClearWalls.addEventListener("click", () => {
            clearWalls(gridState);
            render();
        });
    }

    if (btnClearPath) {
        btnClearPath.addEventListener("click", () => {
            clearPath(gridState);
            render();
        });
    }

    if (btnGenerateMaze) {
        btnGenerateMaze.addEventListener("click", () => {
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
