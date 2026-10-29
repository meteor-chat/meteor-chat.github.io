import { classify } from "./logistic-model.js";

export function computeConfusionMatrix(points, w1, w2, b, threshold = 0.5) {
    let tp = 0;
    let fp = 0;
    let tn = 0;
    let fn = 0;

    if (!points || points.length === 0) {
        return { tp, fp, tn, fn, total: 0 };
    }

    for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        const pred = classify(pt.x1, pt.x2, w1, w2, b, threshold);
        if (pt.y === 1 && pred === 1) tp++;
        else if (pt.y === 0 && pred === 1) fp++;
        else if (pt.y === 0 && pred === 0) tn++;
        else if (pt.y === 1 && pred === 0) fn++;
    }

    return { tp, fp, tn, fn, total: points.length };
}

export function computeMetrics(cm) {
    const total = cm.total || (cm.tp + cm.fp + cm.tn + cm.fn);
    if (total === 0) {
        return {
            accuracy: 0,
            precision: 0,
            recall: 0,
            specificity: 0,
            f1: 0
        };
    }

    const accuracy = (cm.tp + cm.tn) / total;
    const precision = (cm.tp + cm.fp) > 0 ? cm.tp / (cm.tp + cm.fp) : 0;
    const recall = (cm.tp + cm.fn) > 0 ? cm.tp / (cm.tp + cm.fn) : 0;
    const specificity = (cm.tn + cm.fp) > 0 ? cm.tn / (cm.tn + cm.fp) : 0;
    const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    return {
        accuracy: Math.round(accuracy * 1000) / 10,
        precision: Math.round(precision * 1000) / 1000,
        recall: Math.round(recall * 1000) / 1000,
        specificity: Math.round(specificity * 1000) / 1000,
        f1: Math.round(f1 * 1000) / 1000
    };
}
