import { NODE_VISITED, NODE_PATH } from "./search-grid-state.js";

let animFrameId = null;
let isAnimating = false;

export function isPathfindingActive() {
    return isAnimating;
}

export function stopPathfindingAnimation() {
    if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
    }
    isAnimating = false;
}

export function animatePathfinding(state, visitedInOrder, shortestPath, onFrame, onComplete) {
    stopPathfindingAnimation();
    isAnimating = true;

    let visitedIdx = 0;
    let pathIdx = 0;
    const visitedBatch = 4;
    const pathBatch = 2;

    function stepPath() {
        if (!isAnimating) return;

        for (let i = 0; i < pathBatch && pathIdx < shortestPath.length; i++) {
            const node = shortestPath[pathIdx++];
            state.grid[node.r][node.c] = NODE_PATH;
        }

        onFrame();

        if (pathIdx < shortestPath.length) {
            animFrameId = requestAnimationFrame(stepPath);
        } else {
            isAnimating = false;
            animFrameId = null;
            if (typeof onComplete === "function") {
                onComplete(true);
            }
        }
    }

    function stepVisited() {
        if (!isAnimating) return;

        for (let i = 0; i < visitedBatch && visitedIdx < visitedInOrder.length; i++) {
            const node = visitedInOrder[visitedIdx++];
            state.grid[node.r][node.c] = NODE_VISITED;
        }

        onFrame();

        if (visitedIdx < visitedInOrder.length) {
            animFrameId = requestAnimationFrame(stepVisited);
        } else {
            if (shortestPath.length > 0) {
                animFrameId = requestAnimationFrame(stepPath);
            } else {
                isAnimating = false;
                animFrameId = null;
                if (typeof onComplete === "function") {
                    onComplete(false);
                }
            }
        }
    }

    animFrameId = requestAnimationFrame(stepVisited);
}
