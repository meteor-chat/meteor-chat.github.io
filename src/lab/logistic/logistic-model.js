export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

export function sigmoid(z) {
    const clampedZ = clamp(z, -50, 50);
    return 1 / (1 + Math.exp(-clampedZ));
}

export function logit(p) {
    const safeP = clamp(p, 1e-6, 1 - 1e-6);
    return Math.log(safeP / (1 - safeP));
}

export function predictProb(x1, x2, w1, w2, b) {
    return sigmoid(w1 * x1 + w2 * x2 + b);
}

export function classify(x1, x2, w1, w2, b, threshold = 0.5) {
    return predictProb(x1, x2, w1, w2, b) >= threshold ? 1 : 0;
}

export function computeLoss(points, w1, w2, b, lambda = 0) {
    if (!points || points.length === 0) return 0;
    const eps = 1e-15;
    let sum = 0;
    for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        const p = clamp(predictProb(pt.x1, pt.x2, w1, w2, b), eps, 1 - eps);
        const y = pt.y;
        sum += -(y * Math.log(p) + (1 - y) * Math.log(1 - p));
    }
    const reg = 0.5 * lambda * (w1 * w1 + w2 * w2);
    return (sum / points.length) + reg;
}

export function computeGradients(points, w1, w2, b, lambda = 0) {
    if (!points || points.length === 0) {
        return { dw1: 0, dw2: 0, db: 0 };
    }
    let dw1 = 0;
    let dw2 = 0;
    let db = 0;
    const n = points.length;
    for (let i = 0; i < n; i++) {
        const pt = points[i];
        const p = predictProb(pt.x1, pt.x2, w1, w2, b);
        const diff = p - pt.y;
        dw1 += diff * pt.x1;
        dw2 += diff * pt.x2;
        db += diff;
    }
    dw1 = (dw1 / n) + lambda * w1;
    dw2 = (dw2 / n) + lambda * w2;
    db = db / n;
    return { dw1, dw2, db };
}

export function gradientDescentStep(state, points, lr = 0.1, lambda = 0) {
    const { dw1, dw2, db } = computeGradients(points, state.w1, state.w2, state.b, lambda);
    const nextW1 = state.w1 - lr * dw1;
    const nextW2 = state.w2 - lr * dw2;
    const nextB = state.b - lr * db;
    const loss = computeLoss(points, nextW1, nextW2, nextB, lambda);
    return {
        w1: nextW1,
        w2: nextW2,
        b: nextB,
        loss,
        dw1,
        dw2,
        db
    };
}

export function computeBoundaryEndpoints(w1, w2, b, threshold = 0.5, bounds = { xMin: -5, xMax: 5, yMin: -5, yMax: 5 }) {
    const targetZ = logit(threshold);
    const c = b - targetZ;
    const pts = [];
    const eps = 1e-7;

    if (Math.abs(w2) > eps) {
        const yAtXMin = (-c - w1 * bounds.xMin) / w2;
        if (yAtXMin >= bounds.yMin - eps && yAtXMin <= bounds.yMax + eps) {
            pts.push({ x: bounds.xMin, y: clamp(yAtXMin, bounds.yMin, bounds.yMax) });
        }
        const yAtXMax = (-c - w1 * bounds.xMax) / w2;
        if (yAtXMax >= bounds.yMin - eps && yAtXMax <= bounds.yMax + eps) {
            pts.push({ x: bounds.xMax, y: clamp(yAtXMax, bounds.yMin, bounds.yMax) });
        }
    }

    if (Math.abs(w1) > eps) {
        const xAtYMin = (-c - w2 * bounds.yMin) / w1;
        if (xAtYMin >= bounds.xMin - eps && xAtYMin <= bounds.xMax + eps) {
            const candidate = { x: clamp(xAtYMin, bounds.xMin, bounds.xMax), y: bounds.yMin };
            if (!pts.some(p => Math.hypot(p.x - candidate.x, p.y - candidate.y) < 1e-4)) {
                pts.push(candidate);
            }
        }
        const xAtYMax = (-c - w2 * bounds.yMax) / w1;
        if (xAtYMax >= bounds.xMin - eps && xAtYMax <= bounds.xMax + eps) {
            const candidate = { x: clamp(xAtYMax, bounds.xMin, bounds.xMax), y: bounds.yMax };
            if (!pts.some(p => Math.hypot(p.x - candidate.x, p.y - candidate.y) < 1e-4)) {
                pts.push(candidate);
            }
        }
    }

    if (pts.length < 2) return null;
    return { p1: pts[0], p2: pts[1] };
}
