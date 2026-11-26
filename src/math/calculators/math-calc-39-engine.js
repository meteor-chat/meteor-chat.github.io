export const DEFAULT_LR_POINTS = [
    { label: "a", x: 2, y: 51 },
    { label: "b", x: 4, y: 58 },
    { label: "c", x: 6, y: 67 },
    { label: "d", x: 8, y: 72 },
    { label: "e", x: 10, y: 82 }
];

function defaultRowLabel(index) {
    const code = 97 + (index % 26);
    const suffix = index >= 26 ? String(Math.floor(index / 26)) : "";
    return String.fromCharCode(code) + suffix;
}

export function normalizePoints(rawPoints) {
    if (!Array.isArray(rawPoints)) return [];
    const clean = [];
    for (let i = 0; i < rawPoints.length; i++) {
        const p = rawPoints[i];
        if (p == null) continue;
        const rawX = typeof p.x === "string" ? p.x.trim() : p.x;
        const rawY = typeof p.y === "string" ? p.y.trim() : p.y;
        if (rawX === "" || rawY === "" || rawX === null || rawX === undefined || rawY === null || rawY === undefined) continue;
        const x = Number(rawX);
        const y = Number(rawY);
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        const label = p?.label && String(p.label).trim() !== ""
            ? String(p.label).trim()
            : defaultRowLabel(clean.length);
        clean.push({ index: clean.length, label, x, y });
    }
    return clean;
}

export function computeLinearRegressionOLS(rawPoints) {
    const points = normalizePoints(rawPoints);
    const n = points.length;
    if (n < 2) {
        return {
            valid: false,
            n,
            points,
            reason: "Minimal 2 baris data (x, y) valid diperlukan."
        };
    }

    let sumX = 0;
    let sumY = 0;
    for (let i = 0; i < n; i++) {
        sumX += points[i].x;
        sumY += points[i].y;
    }

    const meanX = sumX / n;
    const meanY = sumY / n;

    let sxy = 0;
    let sxx = 0;
    let sst = 0;

    const rows = points.map((p) => {
        const dx = p.x - meanX;
        const dy = p.y - meanY;
        const dxdy = dx * dy;
        const dx2 = dx * dx;
        sxy += dxdy;
        sxx += dx2;
        sst += dy * dy;
        return {
            index: p.index,
            label: p.label,
            x: p.x,
            y: p.y,
            dx,
            dy,
            dxdy,
            dx2
        };
    });

    if (Math.abs(sxx) <= 1e-12) {
        return {
            valid: false,
            n,
            points,
            sumX,
            sumY,
            meanX,
            meanY,
            rows,
            sxy,
            sxx,
            sst,
            reason: "Semua nilai x identik sehingga total dx^2 = 0 (slope w1 tidak terdefinisi)."
        };
    }

    const w1 = sxy / sxx;
    const w0 = meanY - w1 * meanX;

    let sumResidual = 0;
    let sse = 0;
    let sumAbsRes = 0;

    const predRows = points.map((p) => {
        const predict = w0 + w1 * p.x;
        const residual = p.y - predict;
        const sqErr = residual * residual;
        const absRes = Math.abs(residual);
        sumResidual += residual;
        sse += sqErr;
        sumAbsRes += absRes;
        return {
            index: p.index,
            label: p.label,
            x: p.x,
            actual: p.y,
            predict,
            residual,
            sse: sqErr,
            absRes
        };
    });

    const mse = sse / n;
    const rmse = Math.sqrt(mse);
    const mae = sumAbsRes / n;
    const r2 = sst > 1e-12 ? 1 - sse / sst : sse <= 1e-12 ? 1 : 0;

    return {
        valid: true,
        n,
        points,
        sumX,
        sumY,
        meanX,
        meanY,
        rows,
        sxy,
        sxx,
        sst,
        w1,
        w0,
        predRows,
        sumResidual,
        sse,
        sumAbsRes,
        mse,
        rmse,
        mae,
        r2
    };
}

export function fmtNum(val, digits = 3) {
    if (!Number.isFinite(val)) return "0";
    if (Math.abs(val) < 1e-11) return "0";
    const factor = Math.pow(10, digits);
    const rounded = Math.round(val * factor) / factor;
    if (Object.is(rounded, -0) || rounded === 0) return "0";
    return String(Number(rounded.toFixed(digits)));
}
