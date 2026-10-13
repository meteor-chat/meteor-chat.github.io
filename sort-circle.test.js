import { describe, it, expect } from "vitest";
import {
    bubbleSortGenerator,
    selectionSortGenerator,
    insertionSortGenerator,
    shakerSortGenerator,
    quickSortGenerator,
    createSortGenerator
} from "./sort-circle-algorithms.js";

function isSorted(arr) {
    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] > arr[i + 1]) return false;
    }
    return true;
}

function runToCompletion(generator) {
    let result = generator.next();
    let steps = 0;
    while (!result.done) {
        steps++;
        result = generator.next();
    }
    return steps;
}

describe("Sort Circle Algorithms", () => {
    it("bubbleSortGenerator should sort an array completely", () => {
        const arr = [5, 3, 1, 4, 2, 0];
        const gen = bubbleSortGenerator(arr);
        const steps = runToCompletion(gen);
        expect(steps).toBeGreaterThan(0);
        expect(isSorted(arr)).toBe(true);
        expect(arr).toEqual([0, 1, 2, 3, 4, 5]);
    });

    it("selectionSortGenerator should sort an array completely", () => {
        const arr = [9, 2, 7, 4, 1, 8, 3];
        const gen = selectionSortGenerator(arr);
        const steps = runToCompletion(gen);
        expect(steps).toBeGreaterThan(0);
        expect(isSorted(arr)).toBe(true);
        expect(arr).toEqual([1, 2, 3, 4, 7, 8, 9]);
    });

    it("insertionSortGenerator should sort an array completely", () => {
        const arr = [10, 5, 8, 2, 1, 6];
        const gen = insertionSortGenerator(arr);
        const steps = runToCompletion(gen);
        expect(steps).toBeGreaterThan(0);
        expect(isSorted(arr)).toBe(true);
        expect(arr).toEqual([1, 2, 5, 6, 8, 10]);
    });

    it("shakerSortGenerator should sort an array completely", () => {
        const arr = [12, 1, 5, 3, 9, 7];
        const gen = shakerSortGenerator(arr);
        const steps = runToCompletion(gen);
        expect(steps).toBeGreaterThan(0);
        expect(isSorted(arr)).toBe(true);
        expect(arr).toEqual([1, 3, 5, 7, 9, 12]);
    });

    it("quickSortGenerator should sort an array completely", () => {
        const arr = [15, 3, 9, 8, 1, 4, 11, 2];
        const gen = quickSortGenerator(arr);
        const steps = runToCompletion(gen);
        expect(steps).toBeGreaterThan(0);
        expect(isSorted(arr)).toBe(true);
        expect(arr).toEqual([1, 2, 3, 4, 8, 9, 11, 15]);
    });

    it("createSortGenerator should return proper generator", () => {
        const arr = [3, 2, 1];
        const gen = createSortGenerator("bubble", arr);
        runToCompletion(gen);
        expect(isSorted(arr)).toBe(true);
    });

    it("drawDisparityCircle should never stroke red lines", async () => {
        const { drawDisparityCircle } = await import("./sort-circle-renderer.js");
        let strokeCalled = false;
        let ellipseCalled = false;
        const mockCtx = {
            clearRect: () => {},
            fillRect: () => {},
            fillText: () => {},
            beginPath: () => {},
            arc: () => {},
            fill: () => {},
            stroke: () => { strokeCalled = true; },
            ellipse: () => { ellipseCalled = true; },
            fillStyle: "",
            strokeStyle: "",
            lineWidth: 0,
            font: "",
            textBaseline: ""
        };
        drawDisparityCircle(mockCtx, 800, 450, [2, 0, 1], 1, "Shaker Sort");
        expect(strokeCalled).toBe(false);
        expect(ellipseCalled).toBe(false);
        expect(mockCtx.strokeStyle).toBe("");

        drawDisparityCircle(mockCtx, 800, 450, [2, 0, 1], "Shaker Sort");
        expect(strokeCalled).toBe(false);
        expect(ellipseCalled).toBe(false);

        drawDisparityCircle(mockCtx, 800, 450, [], "Empty");
        expect(strokeCalled).toBe(false);
    });
});

