import { describe, it, expect, beforeEach } from "vitest";
import {
    createGridState,
    setWall,
    toggleWall,
    setStartNode,
    setTargetNode,
    clearWalls,
    clearPath,
    generateMaze,
    NODE_EMPTY,
    NODE_WALL,
    NODE_START,
    NODE_TARGET,
    NODE_VISITED,
    NODE_PATH
} from "./search-grid-state.js";
import { drawArena } from "./search-grid-draw.js";

describe("Pathfinding Arena Grid State", () => {
    it("should initialize grid with correct dimensions and start/target nodes", () => {
        const state = createGridState(22, 40);
        expect(state.rows).toBe(22);
        expect(state.cols).toBe(40);
        expect(state.grid[state.start.r][state.start.c]).toBe(NODE_START);
        expect(state.grid[state.target.r][state.target.c]).toBe(NODE_TARGET);
    });

    it("should toggle walls correctly without overwriting start or target", () => {
        const state = createGridState(10, 10);
        toggleWall(state, 0, 0);
        expect(state.grid[0][0]).toBe(NODE_WALL);
        toggleWall(state, 0, 0);
        expect(state.grid[0][0]).toBe(NODE_EMPTY);

        toggleWall(state, state.start.r, state.start.c);
        expect(state.grid[state.start.r][state.start.c]).toBe(NODE_START);

        toggleWall(state, state.target.r, state.target.c);
        expect(state.grid[state.target.r][state.target.c]).toBe(NODE_TARGET);
    });

    it("should set wall explicitly", () => {
        const state = createGridState(10, 10);
        setWall(state, 2, 2, true);
        expect(state.grid[2][2]).toBe(NODE_WALL);
        setWall(state, 2, 2, false);
        expect(state.grid[2][2]).toBe(NODE_EMPTY);
    });

    it("should move start and target nodes safely", () => {
        const state = createGridState(10, 10);
        const oldStart = { ...state.start };
        const successMove = setStartNode(state, 0, 0);
        expect(successMove).toBe(true);
        expect(state.grid[oldStart.r][oldStart.c]).toBe(NODE_EMPTY);
        expect(state.grid[0][0]).toBe(NODE_START);

        const invalidMove = setStartNode(state, state.target.r, state.target.c);
        expect(invalidMove).toBe(false);

        const successTarget = setTargetNode(state, 9, 9);
        expect(successTarget).toBe(true);
        expect(state.grid[9][9]).toBe(NODE_TARGET);
    });

    it("should clear walls and clear path correctly", () => {
        const state = createGridState(10, 10);
        setWall(state, 1, 1, true);
        setWall(state, 1, 2, true);
        clearWalls(state);
        expect(state.grid[1][1]).toBe(NODE_EMPTY);
        expect(state.grid[1][2]).toBe(NODE_EMPTY);

        state.grid[2][2] = NODE_VISITED;
        state.grid[2][3] = NODE_PATH;
        clearPath(state);
        expect(state.grid[2][2]).toBe(NODE_EMPTY);
        expect(state.grid[2][3]).toBe(NODE_EMPTY);
        expect(state.grid[state.start.r][state.start.c]).toBe(NODE_START);
        expect(state.grid[state.target.r][state.target.c]).toBe(NODE_TARGET);
    });

    it("should generate maze with walls while keeping start and target intact", () => {
        const state = createGridState(15, 20);
        generateMaze(state);
        expect(state.grid[state.start.r][state.start.c]).toBe(NODE_START);
        expect(state.grid[state.target.r][state.target.c]).toBe(NODE_TARGET);

        let wallCount = 0;
        for (let r = 0; r < state.rows; r++) {
            for (let c = 0; c < state.cols; c++) {
                if (state.grid[r][c] === NODE_WALL) wallCount++;
            }
        }
        expect(wallCount).toBeGreaterThan(0);
    });

    it("drawArena should execute without errors on mock context", () => {
        const state = createGridState(6, 6);
        state.grid[1][1] = NODE_WALL;
        state.grid[2][2] = NODE_VISITED;
        state.grid[3][3] = NODE_PATH;

        const calls = [];
        const mockCtx = {
            clearRect: () => calls.push("clearRect"),
            fillRect: () => calls.push("fillRect"),
            strokeRect: () => calls.push("strokeRect"),
            beginPath: () => calls.push("beginPath"),
            moveTo: () => calls.push("moveTo"),
            lineTo: () => calls.push("lineTo"),
            stroke: () => calls.push("stroke"),
            arc: () => calls.push("arc"),
            fill: () => calls.push("fill"),
            closePath: () => calls.push("closePath"),
            fillStyle: "",
            strokeStyle: "",
            lineWidth: 0
        };

        drawArena(mockCtx, 800, 450, state);
        expect(calls).toContain("clearRect");
        expect(calls).toContain("fillRect");
        expect(calls).toContain("stroke");
        expect(calls).toContain("arc");
        expect(calls).toContain("fill");
    });
});

describe("Search Page & Controller", () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="search-filter-container" class="search-filter-container">
                <button class="search-filter-btn active" data-search="bfs">BFS</button>
                <button class="search-filter-btn" data-search="dfs">DFS</button>
                <button class="search-filter-btn" data-search="dijkstra">Dijkstra</button>
            </div>
            <canvas id="search-canvas" width="800" height="450"></canvas>
            <button id="btn-generate-maze"></button>
            <button id="btn-clear-walls"></button>
            <button id="btn-clear-path"></button>
        `;
    });

    it("should toggle active state properly when selecting algorithms", async () => {
        const { setActiveSearchAlgorithm, getActiveSearchAlgorithm } = await import("./search-controller.js");
        expect(getActiveSearchAlgorithm()).toBe("bfs");

        setActiveSearchAlgorithm("dfs");
        expect(getActiveSearchAlgorithm()).toBe("dfs");
        const dfsBtn = document.querySelector('[data-search="dfs"]');
        const bfsBtn = document.querySelector('[data-search="bfs"]');
        expect(dfsBtn.classList.contains("active")).toBe(true);
        expect(bfsBtn.classList.contains("active")).toBe(false);

        setActiveSearchAlgorithm("dijkstra");
        expect(getActiveSearchAlgorithm()).toBe("dijkstra");
        const dijkstraBtn = document.querySelector('[data-search="dijkstra"]');
        expect(dijkstraBtn.classList.contains("active")).toBe(true);
        expect(dfsBtn.classList.contains("active")).toBe(false);
    });
});
