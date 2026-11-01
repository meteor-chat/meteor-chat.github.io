export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

export function predict(x, w, b) {
    return Number(w) * Number(x) + Number(b);
}

export function computeOLS(points) {
    if (!points || points.length < 2) {
        const singleY = points && points.length === 1 ? points[0].y : 0;
        return { w: 0, b: singleY, valid: false };
    }

    const n = points.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    for (let i = 0; i < n; i++) {
        const px = Number(points[i].x);
        const py = Number(points[i].y);
        sumX += px;
        sumY += py;
        sumXY += px * py;
        sumX2 += px * px;
    }

    const denom = n * sumX2 - sumX * sumX;
    if (Math.abs(denom) < 1e-12) {
        return { w: 0, b: sumY / n, valid: false };
    }

    const w = (n * sumXY - sumX * sumY) / denom;
    const b = (sumY - w * sumX) / n;

    return {
        w,
        b,
        sumX,
        sumY,
        sumXY,
        sumX2,
        meanX: sumX / n,
        meanY: sumY / n,
        n,
        valid: true
    };
}

export function computeResiduals(points, w, b) {
    if (!points || points.length === 0) return [];
    return points.map((p) => {
        const yHat = predict(p.x, w, b);
        const residual = p.y - yHat;
        return {
            x: p.x,
            y: p.y,
            yHat,
            residual,
            sqResidual: residual * residual
        };
    });
}

export function computeGradients(points, w, b) {
    if (!points || points.length === 0) {
        return { dw: 0, db: 0 };
    }

    const n = points.length;
    let sumDw = 0;
    let sumDb = 0;

    for (let i = 0; i < n; i++) {
        const px = Number(points[i].x);
        const py = Number(points[i].y);
        const diff = predict(px, w, b) - py;
        sumDw += diff * px;
        sumDb += diff;
    }

    return {
        dw: (2 / n) * sumDw,
        db: (2 / n) * sumDb
    };
}

export function gradientDescentStep(points, w, b, alpha) {
    const { dw, db } = computeGradients(points, w, b);
    const safeDw = clamp(dw, -1e4, 1e4);
    const safeDb = clamp(db, -1e4, 1e4);
    const nextW = w - alpha * safeDw;
    const nextB = b - alpha * safeDb;
    return {
        w: nextW,
        b: nextB,
        dw: safeDw,
        db: safeDb
    };
}
