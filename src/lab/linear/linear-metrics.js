import { predict } from "./linear-model.js";

export function computeMetrics(points, w, b) {
    if (!points || points.length === 0) {
        return {
            n: 0,
            sse: 0,
            mse: 0,
            rmse: 0,
            mae: 0,
            ssTot: 0,
            ssRes: 0,
            r2: 0,
            r: 0,
            meanX: 0,
            meanY: 0
        };
    }

    const n = points.length;
    let sumX = 0;
    let sumY = 0;

    for (let i = 0; i < n; i++) {
        sumX += Number(points[i].x);
        sumY += Number(points[i].y);
    }

    const meanX = sumX / n;
    const meanY = sumY / n;

    let ssTot = 0;
    let ssRes = 0;
    let sumAbs = 0;
    let covXY = 0;
    let varX = 0;

    for (let i = 0; i < n; i++) {
        const px = Number(points[i].x);
        const py = Number(points[i].y);
        const yHat = predict(px, w, b);
        const diff = py - yHat;

        ssRes += diff * diff;
        sumAbs += Math.abs(diff);

        const dy = py - meanY;
        const dx = px - meanX;
        ssTot += dy * dy;
        covXY += dx * dy;
        varX += dx * dx;
    }

    const mse = ssRes / n;
    const rmse = Math.sqrt(mse);
    const mae = sumAbs / n;

    let r2 = 0;
    if (ssTot > 1e-12) {
        r2 = 1 - ssRes / ssTot;
    } else {
        r2 = ssRes < 1e-12 ? 1 : 0;
    }

    let r = 0;
    const denomR = Math.sqrt(varX * ssTot);
    if (denomR > 1e-12) {
        r = covXY / denomR;
    }

    return {
        n,
        sse: ssRes,
        mse,
        rmse,
        mae,
        ssTot,
        ssRes,
        r2,
        r,
        meanX,
        meanY
    };
}
