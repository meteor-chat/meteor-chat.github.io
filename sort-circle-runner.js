import { setupCanvas, drawDisparityCircle } from "./sort-circle-draw.js?v=11";
import { createSortGenerator } from "./sort-circle-algorithms.js?v=11";

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

export function initWorstCircleArray() {
    circleArray = Array.from({ length: TOTAL_ELEMENTS }, (_, i) => TOTAL_ELEMENTS - 1 - i);
}

export function isCircleSorted() {
    for (let i = 0; i < circleArray.length; i++) {
        if (circleArray[i] !== i) return false;
    }
    return true;
}

export function renderCircle(canvas, titleOrIdx, maybeTitle) {
    if (!canvas) return;
    const title = typeof titleOrIdx === "string" ? titleOrIdx : (typeof maybeTitle === "string" ? maybeTitle : "Bubble Sort");
    const ctx = setupCanvas(canvas);
    drawDisparityCircle(ctx, 800, 450, circleArray, title);
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
        renderCircle(canvas, title);
        await new Promise(resolve => setTimeout(resolve, 400));
    }

    isCircleSorting = true;
    const ctx = setupCanvas(canvas);
    const generator = createSortGenerator(type, circleArray);
    const steps = getStepsPerFrame(type);

    function loop() {
        if (!isCircleSorting) return;
        let isDone = false;

        for (let s = 0; s < steps; s++) {
            const next = generator.next();
            if (next.done) {
                isDone = true;
                break;
            }
        }

        if (isDone) {
            drawDisparityCircle(ctx, 800, 450, circleArray, title);
            isCircleSorting = false;
            animationFrameId = null;
            if (typeof onComplete === "function") {
                onComplete();
            }
            return;
        }

        drawDisparityCircle(ctx, 800, 450, circleArray, title);
        animationFrameId = requestAnimationFrame(loop);
    }

    animationFrameId = requestAnimationFrame(loop);
}
