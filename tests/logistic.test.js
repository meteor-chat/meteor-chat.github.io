import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
    clamp,
    sigmoid,
    logit,
    predictProb,
    classify,
    computeLoss,
    computeGradients,
    gradientDescentStep,
    computeBoundaryEndpoints
} from "../src/lab/logistic/logistic-model.js";
import {
    getBlobsPreset,
    getOverlapPreset,
    getImbalancedPreset,
    getXORPreset
} from "../src/lab/logistic/logistic-presets.js";
import {
    computeConfusionMatrix,
    computeMetrics
} from "../src/lab/logistic/logistic-metrics.js";

describe("logistic regression core model operations", () => {
    it("clamps values correctly", () => {
        expect(clamp(5, 0, 10)).toBe(5);
        expect(clamp(-5, 0, 10)).toBe(0);
        expect(clamp(15, 0, 10)).toBe(10);
    });

    it("evaluates sigmoid function accurately with extreme guards", () => {
        expect(sigmoid(0)).toBeCloseTo(0.5, 6);
        expect(sigmoid(100)).toBeCloseTo(1.0, 6);
        expect(sigmoid(-100)).toBeCloseTo(0.0, 6);
        expect(sigmoid(2)).toBeCloseTo(0.880797, 5);
        expect(sigmoid(-2)).toBeCloseTo(0.119202, 5);
    });

    it("evaluates logit inverse correctly", () => {
        expect(logit(0.5)).toBeCloseTo(0, 5);
        expect(logit(0.880797)).toBeCloseTo(2, 4);
    });

    it("predicts probability and classifies with threshold", () => {
        const p = predictProb(1, 1, 2, 2, -4);
        expect(p).toBeCloseTo(0.5, 5);
        expect(classify(1, 1, 2, 2, -4, 0.5)).toBe(1);
        expect(classify(1, 1, 2, 2, -4, 0.51)).toBe(0);
    });

    it("computes binary cross entropy loss and L2 penalty", () => {
        const points = [
            { x1: 2, x2: 2, y: 1 },
            { x1: -2, x2: -2, y: 0 }
        ];
        const lossWithoutReg = computeLoss(points, 2, 2, 0, 0);
        expect(lossWithoutReg).toBeGreaterThan(0);
        expect(lossWithoutReg).toBeLessThan(0.05);

        const lossWithReg = computeLoss(points, 2, 2, 0, 0.1);
        expect(lossWithReg).toBeCloseTo(lossWithoutReg + 0.5 * 0.1 * (4 + 4), 5);
    });

    it("computes analytical gradients matching batch directions", () => {
        const points = [
            { x1: 1, x2: 0, y: 1 },
            { x1: -1, x2: 0, y: 0 }
        ];
        const grads = computeGradients(points, 0, 0, 0, 0);
        expect(grads.dw1).toBeLessThan(0);
        expect(grads.dw2).toBe(0);
        expect(grads.db).toBe(0);
    });

    it("converges loss downward across gradient descent steps on separable data", () => {
        const data = getBlobsPreset();
        let state = { w1: 0.1, w2: 0.1, b: 0 };
        const initialLoss = computeLoss(data, state.w1, state.w2, state.b, 0);
        for (let i = 0; i < 50; i++) {
            const next = gradientDescentStep(state, data, 0.2, 0);
            state = { w1: next.w1, w2: next.w2, b: next.b };
        }
        const finalLoss = computeLoss(data, state.w1, state.w2, state.b, 0);
        expect(finalLoss).toBeLessThan(initialLoss);
    });

    it("calculates 2D decision boundary endpoints cleanly across bounding box", () => {
        const bounds = { xMin: -5, xMax: 5, yMin: -5, yMax: 5 };
        const segment = computeBoundaryEndpoints(1, 0, 0, 0.5, bounds);
        expect(segment).not.toBeNull();
        expect(segment.p1.x).toBeCloseTo(0, 4);
        expect(segment.p2.x).toBeCloseTo(0, 4);
    });
});

describe("logistic presets and confusion metrics", () => {
    it("generates deterministic non-empty presets", () => {
        const blobs = getBlobsPreset();
        const overlap = getOverlapPreset();
        const imbalanced = getImbalancedPreset();
        const xor = getXORPreset();

        expect(blobs.length).toBe(48);
        expect(overlap.length).toBe(60);
        expect(imbalanced.length).toBe(50);
        expect(xor.length).toBe(56);

        expect(blobs.filter(p => p.y === 1).length).toBe(24);
        expect(imbalanced.filter(p => p.y === 1).length).toBe(5);
    });

    it("evaluates confusion matrix and classification metrics", () => {
        const pts = [
            { x1: 2, x2: 2, y: 1 },
            { x1: 3, x2: 3, y: 1 },
            { x1: -2, x2: -2, y: 0 },
            { x1: -3, x2: -3, y: 0 }
        ];
        const cm = computeConfusionMatrix(pts, 1, 1, 0, 0.5);
        expect(cm.tp).toBe(2);
        expect(cm.tn).toBe(2);
        expect(cm.fp).toBe(0);
        expect(cm.fn).toBe(0);

        const metrics = computeMetrics(cm);
        expect(metrics.accuracy).toBe(100);
        expect(metrics.precision).toBe(1);
        expect(metrics.recall).toBe(1);
        expect(metrics.f1).toBe(1);
    });
});

describe("file architecture integrity and zero comments", () => {
    const dir = path.resolve(__dirname, "../src/lab/logistic");
    const files = fs.readdirSync(dir);

    it("guarantees all files in src/lab/logistic have zero comments and under 300 lines", () => {
        expect(files.length).toBeGreaterThan(0);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const content = fs.readFileSync(fullPath, "utf-8");
            const lines = content.split("\n");

            expect(lines.length).toBeLessThanOrEqual(300);
            expect(content).not.toMatch(/\/\*/);
            expect(content).not.toMatch(/\*\//);
            expect(content).not.toMatch(/^\s*\/\//m);
        }
    });

    it("guarantees logistic.html has zero comments, under 300 lines, and uses assets/svg/back.svg", () => {
        const htmlPath = path.resolve(__dirname, "../logistic.html");
        const htmlContent = fs.readFileSync(htmlPath, "utf-8");
        const lines = htmlContent.split("\n");

        expect(lines.length).toBeLessThanOrEqual(300);
        expect(htmlContent).not.toMatch(/<!--/);
        expect(htmlContent).not.toMatch(/-->/);
        expect(htmlContent).not.toMatch(/\/\*/);
        expect(htmlContent).not.toMatch(/\*\//);
        expect(htmlContent).toContain("./assets/svg/back.svg");
    });
});
