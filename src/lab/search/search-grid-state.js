export const NODE_EMPTY = 0;
export const NODE_WALL = 1;
export const NODE_START = 2;
export const NODE_TARGET = 3;
export const NODE_VISITED = 4;
export const NODE_PATH = 5;

export function createGridState(rows = 22, cols = 40) {
    const grid = [];
    for (let r = 0; r < rows; r++) {
        const row = new Uint8Array(cols);
        grid.push(row);
    }

    const state = {
        rows,
        cols,
        grid,
        start: { r: Math.floor(rows / 2), c: Math.floor(cols * 0.18) },
        target: { r: Math.floor(rows / 2), c: Math.floor(cols * 0.82) }
    };

    state.grid[state.start.r][state.start.c] = NODE_START;
    state.grid[state.target.r][state.target.c] = NODE_TARGET;

    return state;
}

export function isStartNode(state, r, c) {
    return state.start.r === r && state.start.c === c;
}

export function isTargetNode(state, r, c) {
    return state.target.r === r && state.target.c === c;
}

export function setWall(state, r, c, isWall) {
    if (r < 0 || r >= state.rows || c < 0 || c >= state.cols) return;
    if (isStartNode(state, r, c) || isTargetNode(state, r, c)) return;
    state.grid[r][c] = isWall ? NODE_WALL : NODE_EMPTY;
}

export function toggleWall(state, r, c) {
    if (r < 0 || r >= state.rows || c < 0 || c >= state.cols) return;
    if (isStartNode(state, r, c) || isTargetNode(state, r, c)) return;
    state.grid[r][c] = state.grid[r][c] === NODE_WALL ? NODE_EMPTY : NODE_WALL;
}

export function setStartNode(state, r, c) {
    if (r < 0 || r >= state.rows || c < 0 || c >= state.cols) return false;
    if (isTargetNode(state, r, c)) return false;
    state.grid[state.start.r][state.start.c] = NODE_EMPTY;
    state.start = { r, c };
    state.grid[r][c] = NODE_START;
    return true;
}

export function setTargetNode(state, r, c) {
    if (r < 0 || r >= state.rows || c < 0 || c >= state.cols) return false;
    if (isStartNode(state, r, c)) return false;
    state.grid[state.target.r][state.target.c] = NODE_EMPTY;
    state.target = { r, c };
    state.grid[r][c] = NODE_TARGET;
    return true;
}

export function clearWalls(state) {
    for (let r = 0; r < state.rows; r++) {
        for (let c = 0; c < state.cols; c++) {
            if (state.grid[r][c] === NODE_WALL) {
                state.grid[r][c] = NODE_EMPTY;
            }
        }
    }
}

export function clearPath(state) {
    for (let r = 0; r < state.rows; r++) {
        for (let c = 0; c < state.cols; c++) {
            const val = state.grid[r][c];
            if (val === NODE_VISITED || val === NODE_PATH) {
                state.grid[r][c] = NODE_EMPTY;
            }
        }
    }
    state.grid[state.start.r][state.start.c] = NODE_START;
    state.grid[state.target.r][state.target.c] = NODE_TARGET;
}

export function generateMaze(state) {
    clearWalls(state);
    clearPath(state);

    for (let r = 0; r < state.rows; r++) {
        for (let c = 0; c < state.cols; c++) {
            if (isStartNode(state, r, c) || isTargetNode(state, r, c)) continue;
            if (Math.random() < 0.28) {
                state.grid[r][c] = NODE_WALL;
            }
        }
    }
}

export const randomizeGrid = generateMaze;
