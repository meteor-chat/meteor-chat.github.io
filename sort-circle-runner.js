import { setupCanvas, drawDisparityCircle } from "./sort-circle-renderer.js";
import { createSortGenerator } from "./sort-circle-algorithms.js";

const TOTAL_ELEMENTS = 360;
let circleArray = [];
let isCircleSorting = false;
let animationFrameId = null;

export function initCircleArray() {
    circleArray = Array.from({ length: TOTAL_ELEMENTS }, (_, i) => i);
    for (let i = circleArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [circleArray[i], circleArray[j]] = [circleArray[j], circleArray[i]];
    }
}

export function isCircleSorted() {
    for (let i = 0; i < circleArray.length; i++) {
        if (circleArray[i] !== i) return false;
    }
    return true;
}

export function renderCircle(canvas, activeIdx = -1, title = "Bubble Sort") {
    if (!canvas) return;
    const ctx = setupCanvas(canvas);
    drawDisparityCircle(ctx, 800, 450, circleArray, activeIdx, title);
}

export function stopCircleSort() {
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    isCircleSorting = false;
}

export function isCircleSortingActive() {
    return isCircleSorting;
}

function getStepsPerFrame(type) {
    if (type === "quick") return 35;
    if (type === "insertion") return 150;
    return 120;
}

export async function startCircleSort(canvas, type, title, onComplete) {
    if (isCircleSorting) return;
    if (isCircleSorted()) {
        initCircleArray();
        renderCircle(canvas, -1, title);
        await new Promise(resolve => setTimeout(resolve, 400));
    }

    isCircleSorting = true;
    const ctx = setupCanvas(canvas);
    const generator = createSortGenerator(type, circleArray);
    const steps = getStepsPerFrame(type);

    function loop() {
        if (!isCircleSorting) return;
        let lastIdx = -1;
        let isDone = false;

        for (let s = 0; s < steps; s++) {
            const next = generator.next();
            if (next.done) {
                isDone = true;
                break;
            }
            lastIdx = next.value;
        }

        if (isDone) {
            drawDisparityCircle(ctx, 800, 450, circleArray, -1, title);
            isCircleSorting = false;
            animationFrameId = null;
            if (typeof onComplete === "function") {
                onComplete();
            }
            return;
        }

        drawDisparityCircle(ctx, 800, 450, circleArray, lastIdx, title);
        animationFrameId = requestAnimationFrame(loop);
    }

    animationFrameId = requestAnimationFrame(loop);
}
