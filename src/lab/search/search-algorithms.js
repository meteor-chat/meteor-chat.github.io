import { NODE_WALL } from "./search-grid-state.js";

const DIRECTIONS = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1]
];

function reconstructPath(parent, start, target) {
    const path = [];
    let curr = parent[target.r][target.c];
    while (curr && !(curr.r === start.r && curr.c === start.c)) {
        path.push({ r: curr.r, c: curr.c });
        curr = parent[curr.r][curr.c];
    }
    return path.reverse();
}

export function runBFS(state) {
    const rows = state.rows;
    const cols = state.cols;
    const start = state.start;
    const target = state.target;

    const visited = Array.from({ length: rows }, () => new Uint8Array(cols));
    const parent = Array.from({ length: rows }, () => new Array(cols).fill(null));
    const queue = [{ r: start.r, c: start.c }];
    const visitedInOrder = [];
    visited[start.r][start.c] = 1;

    let found = false;

    while (queue.length > 0) {
        const curr = queue.shift();

        if (curr.r === target.r && curr.c === target.c) {
            found = true;
            break;
        }

        if (!(curr.r === start.r && curr.c === start.c)) {
            visitedInOrder.push(curr);
        }

        for (let i = 0; i < DIRECTIONS.length; i++) {
            const nr = curr.r + DIRECTIONS[i][0];
            const nc = curr.c + DIRECTIONS[i][1];

            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            if (visited[nr][nc] || state.grid[nr][nc] === NODE_WALL) continue;

            visited[nr][nc] = 1;
            parent[nr][nc] = curr;
            queue.push({ r: nr, c: nc });
        }
    }

    const path = found ? reconstructPath(parent, start, target) : [];
    return { visitedInOrder, path, found };
}

export function runDFS(state) {
    const rows = state.rows;
    const cols = state.cols;
    const start = state.start;
    const target = state.target;

    const visited = Array.from({ length: rows }, () => new Uint8Array(cols));
    const parent = Array.from({ length: rows }, () => new Array(cols).fill(null));
    const stack = [{ r: start.r, c: start.c }];
    const visitedInOrder = [];

    let found = false;

    while (stack.length > 0) {
        const curr = stack.pop();

        if (visited[curr.r][curr.c]) continue;
        visited[curr.r][curr.c] = 1;

        if (curr.r === target.r && curr.c === target.c) {
            found = true;
            break;
        }

        if (!(curr.r === start.r && curr.c === start.c)) {
            visitedInOrder.push(curr);
        }

        for (let i = 0; i < DIRECTIONS.length; i++) {
            const nr = curr.r + DIRECTIONS[i][0];
            const nc = curr.c + DIRECTIONS[i][1];

            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            if (visited[nr][nc] || state.grid[nr][nc] === NODE_WALL) continue;

            if (!parent[nr][nc]) {
                parent[nr][nc] = curr;
            }
            stack.push({ r: nr, c: nc });
        }
    }

    const path = found ? reconstructPath(parent, start, target) : [];
    return { visitedInOrder, path, found };
}

export function runDijkstra(state) {
    const rows = state.rows;
    const cols = state.cols;
    const start = state.start;
    const target = state.target;

    const dist = Array.from({ length: rows }, () => new Float64Array(cols).fill(Infinity));
    const visited = Array.from({ length: rows }, () => new Uint8Array(cols));
    const parent = Array.from({ length: rows }, () => new Array(cols).fill(null));
    const visitedInOrder = [];

    dist[start.r][start.c] = 0;
    const unvisited = [{ r: start.r, c: start.c, d: 0 }];

    let found = false;

    while (unvisited.length > 0) {
        unvisited.sort((a, b) => a.d - b.d);
        const curr = unvisited.shift();

        if (visited[curr.r][curr.c]) continue;
        visited[curr.r][curr.c] = 1;

        if (curr.d === Infinity) break;

        if (curr.r === target.r && curr.c === target.c) {
            found = true;
            break;
        }

        if (!(curr.r === start.r && curr.c === start.c)) {
            visitedInOrder.push(curr);
        }

        for (let i = 0; i < DIRECTIONS.length; i++) {
            const nr = curr.r + DIRECTIONS[i][0];
            const nc = curr.c + DIRECTIONS[i][1];

            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            if (visited[nr][nc] || state.grid[nr][nc] === NODE_WALL) continue;

            const alt = curr.d + 1;
            if (alt < dist[nr][nc]) {
                dist[nr][nc] = alt;
                parent[nr][nc] = curr;
                unvisited.push({ r: nr, c: nc, d: alt });
            }
        }
    }

    const path = found ? reconstructPath(parent, start, target) : [];
    return { visitedInOrder, path, found };
}

export function executeAlgorithm(type, state) {
    if (type === "dfs") return runDFS(state);
    if (type === "dijkstra") return runDijkstra(state);
    return runBFS(state);
}
