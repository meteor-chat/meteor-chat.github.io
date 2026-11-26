import { fmtNum, normalizePoints } from "./math-calc-39-engine.js";

export const DEFAULT_LOGREG_POINTS = [
    { x: -2, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 0 },
    { x: 2, y: 1 }
];

export { fmtNum, normalizePoints };

export function sigmoid(z) {
    if (z >= 0) {
        const ez = Math.exp(-z);
        return 1 / (1 + ez);
    }
    const ez = Math.exp(z);
    return ez / (1 + ez);
}

export function computeLogisticIteration(rawPoints, w0 = 0, w1 = 0, threshold = 0.5) {
    const points = normalizePoints(rawPoints);
    const n = points.length;
    if (n === 0) {
        return { valid: false, reason: "Minimal 1 titik data (x, y) diperlukan.", points: [], n: 0 };
    }
    if (!Number.isFinite(w0) || !Number.isFinite(w1)) {
        return { valid: false, reason: "Bobot awal w0 dan w1 harus berupa angka valid.", points, n };
    }
    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
        return { valid: false, reason: "Nilai threshold harus berada di antara 0 dan 1.", points, n };
    }
    if (points.some((p) => Math.abs(p.y) > 1e-12 && Math.abs(p.y - 1) > 1e-12)) {
        return { valid: false, reason: "Nilai target y pada Logistic Regression harus 0 atau 1.", points, n };
    }

    const eps = 1e-12;
    let totalLoss = 0;
    let totalGw0 = 0;
    let totalGw1 = 0;
    let correct = 0;

    const rows = points.map((p, idx) => {
        const z = w0 + w1 * p.x;
        const alpha = sigmoid(z);
        const safeP = Math.min(1 - eps, Math.max(eps, alpha));
        const loss = -(p.y * Math.log(safeP) + (1 - p.y) * Math.log(1 - safeP));
        const err = alpha - p.y;
        const gw0 = err;
        const gw1 = err * p.x;
        const predClass = alpha >= threshold ? 1 : 0;
        if (predClass === Math.round(p.y)) correct += 1;

        totalLoss += loss;
        totalGw0 += gw0;
        totalGw1 += gw1;

        return {
            index: idx + 1,
            label: p.label,
            x: p.x,
            y: p.y,
            z,
            alpha,
            loss,
            err,
            gw0,
            gw1,
            predClass
        };
    });

    const avgLoss = totalLoss / n;
    const avgGw0 = totalGw0 / n;
    const avgGw1 = totalGw1 / n;

    return {
        valid: true,
        n,
        w0,
        w1,
        threshold,
        rows,
        totalLoss,
        avgLoss,
        totalGw0,
        avgGw0,
        totalGw1,
        avgGw1,
        correct,
        accuracy: correct / n
    };
}

export function computeLogisticRegression(rawPoints, w0 = 0, w1 = 0, lr = 1, threshold = 0.5, numIters = 5) {
    if (!Number.isFinite(lr) || lr < 0) {
        const base = normalizePoints(rawPoints);
        return { valid: false, reason: "Learning rate harus bernilai >= 0.", points: base, n: base.length };
    }
    const iter0 = computeLogisticIteration(rawPoints, w0, w1, threshold);
    if (!iter0.valid) return iter0;

    const newW0 = w0 - lr * iter0.avgGw0;
    const newW1 = w1 - lr * iter0.avgGw1;
    const afterStep = computeLogisticIteration(rawPoints, newW0, newW1, threshold);

    const trace = [];
    let curW0 = w0;
    let curW1 = w1;
    for (let k = 0; k < numIters; k++) {
        const step = computeLogisticIteration(rawPoints, curW0, curW1, threshold);
        trace.push({
            iter: k,
            w0: curW0,
            w1: curW1,
            probs: step.rows.map((r) => r.alpha),
            avgLoss: step.avgLoss,
            avgGw0: step.avgGw0,
            avgGw1: step.avgGw1,
            accuracy: step.accuracy
        });
        curW0 = curW0 - lr * step.avgGw0;
        curW1 = curW1 - lr * step.avgGw1;
    }

    return {
        valid: true,
        n: iter0.n,
        lr,
        threshold,
        initW0: w0,
        initW1: w1,
        rows: iter0.rows,
        totalLoss: iter0.totalLoss,
        avgLoss: iter0.avgLoss,
        totalGw0: iter0.totalGw0,
        avgGw0: iter0.avgGw0,
        totalGw1: iter0.totalGw1,
        avgGw1: iter0.avgGw1,
        initCorrect: iter0.correct,
        initAccuracy: iter0.accuracy,
        newW0,
        newW1,
        afterRows: afterStep.rows,
        afterLoss: afterStep.avgLoss,
        afterCorrect: afterStep.correct,
        afterAccuracy: afterStep.accuracy,
        trace
    };
}
