export const LR_PRESETS = {
    manual: {
        id: "manual",
        label: "Kasus Kuliah & Manual (5 Data)",
        xName: "Jam Belajar / Minggu",
        yName: "Nilai Akhir",
        queryLabel: "F",
        queryX: 3,
        gdLr: 0.1,
        gdStd: true,
        points: [
            { label: "A", x: 2, y: 51 },
            { label: "B", x: 4, y: 58 },
            { label: "C", x: 6, y: 67 },
            { label: "D", x: 8, y: 72 },
            { label: "E", x: 10, y: 82 }
        ]
    },
    ex1: {
        id: "ex1",
        label: "Latihan 1 Week 9 (4 Data)",
        xName: "Jam Belajar",
        yName: "Nilai Ujian",
        queryLabel: "E",
        queryX: 4,
        gdLr: 0.1,
        gdStd: true,
        points: [
            { label: "A", x: 1, y: 40 },
            { label: "B", x: 3, y: 50 },
            { label: "C", x: 5, y: 56 },
            { label: "D", x: 7, y: 66 }
        ]
    },
    gd0: {
        id: "gd0",
        label: "Sesi 2 GD Slide 22 (3 Data)",
        xName: "Fitur x",
        yName: "Target y",
        queryLabel: "Uji",
        queryX: 2.5,
        gdLr: 0.1,
        gdStd: false,
        points: [
            { label: "1", x: 1, y: 3 },
            { label: "2", x: 2, y: 5 },
            { label: "3", x: 3, y: 7 }
        ]
    },
    ex3: {
        id: "ex3",
        label: "Latihan 3 GD Week 9 (3 Data)",
        xName: "Fitur x",
        yName: "Target y",
        queryLabel: "Uji",
        queryX: 3,
        gdLr: 0.1,
        gdStd: false,
        points: [
            { label: "1", x: 1, y: 2 },
            { label: "2", x: 2, y: 4 },
            { label: "3", x: 4, y: 8 }
        ]
    },
    outlier: {
        id: "outlier",
        label: "Uji Outlier (SSE vs MAE)",
        xName: "Jam Belajar",
        yName: "Skor Evaluasi",
        queryLabel: "Uji",
        queryX: 6,
        gdLr: 0.1,
        gdStd: true,
        points: [
            { label: "A", x: 2, y: 50 },
            { label: "B", x: 4, y: 58 },
            { label: "C", x: 6, y: 66 },
            { label: "D", x: 8, y: 74 },
            { label: "E", x: 10, y: 42 }
        ]
    }
};

function defaultRowLabel(index) {
    const code = 65 + (index % 26);
    const suffix = index >= 26 ? String(Math.floor(index / 26)) : "";
    return String.fromCharCode(code) + suffix;
}

export function normalizePoints(rawPoints) {
    if (!Array.isArray(rawPoints)) return [];
    const clean = [];
    for (let i = 0; i < rawPoints.length; i++) {
        const p = rawPoints[i];
        const x = Number(p?.x);
        const y = Number(p?.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        const label = p?.label && String(p.label).trim() !== "" ? String(p.label).trim() : defaultRowLabel(clean.length);
        clean.push({ index: clean.length, label, x, y });
    }
    return clean;
}

export function computeLinearRegressionOLS(rawPoints, queryX) {
    const points = normalizePoints(rawPoints);
    const n = points.length;
    if (n < 2) {
        return {
            valid: false,
            n,
            points,
            reason: "Minimal 2 titik data valid diperlukan untuk menghitung regresi linier."
        };
    }

    let sumX = 0;
    let sumY = 0;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < n; i++) {
        const { x, y } = points[i];
        sumX += x;
        sumY += y;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    }

    const meanX = sumX / n;
    const meanY = sumY / n;

    let sumDx = 0;
    let sumDy = 0;
    let sxy = 0;
    let sxx = 0;
    let sst = 0;

    const rows = points.map((p) => {
        const dx = p.x - meanX;
        const dy = p.y - meanY;
        const dxdy = dx * dy;
        const dx2 = dx * dx;
        const dy2 = dy * dy;
        sumDx += dx;
        sumDy += dy;
        sxy += dxdy;
        sxx += dx2;
        sst += dy2;
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
            minX,
            maxX,
            minY,
            maxY,
            rows,
            sumDx,
            sumDy,
            sxy,
            sxx,
            sst,
            reason: "Sxx bernilai 0 karena semua nilai x identik, kemiringan w1 tidak terdefinisi."
        };
    }

    const w1 = sxy / sxx;
    const w0 = meanY - w1 * meanX;

    let sumResidual = 0;
    let sse = 0;
    let sumAbsErr = 0;

    const predRows = points.map((p) => {
        const yHat = w0 + w1 * p.x;
        const residual = p.y - yHat;
        const sqErr = residual * residual;
        const absErr = Math.abs(residual);
        sumResidual += residual;
        sse += sqErr;
        sumAbsErr += absErr;
        return {
            index: p.index,
            label: p.label,
            x: p.x,
            y: p.y,
            yHat,
            residual,
            sqErr,
            absErr
        };
    });

    const mse = sse / n;
    const rmse = Math.sqrt(mse);
    const mae = sumAbsErr / n;
    const maeSignedCheck = sumResidual / n;
    const r2 = sst > 1e-12 ? 1 - sse / sst : sse <= 1e-12 ? 1 : 0;
    const rDenom = Math.sqrt(sxx * sst);
    const r = rDenom > 1e-12 ? sxy / rDenom : 0;

    const yAtMeanX = w0 + w1 * meanX;
    const diffCentroid = Math.abs(yAtMeanX - meanY);
    const passesCentroid = diffCentroid < 1e-6;
    const residualsSumZero = Math.abs(sumResidual) < 1e-6;

    const qx = Number.isFinite(Number(queryX)) ? Number(queryX) : meanX;
    const qyHat = w0 + w1 * qx;
    const isExtrapolation = qx < minX || qx > maxX;

    return {
        valid: true,
        n,
        points,
        sumX,
        sumY,
        meanX,
        meanY,
        minX,
        maxX,
        minY,
        maxY,
        rows,
        sumDx,
        sumDy,
        sxy,
        sxx,
        sst,
        w1,
        w0,
        predRows,
        sumResidual,
        sse,
        sumAbsErr,
        mse,
        rmse,
        mae,
        maeSignedCheck,
        r2,
        r,
        checks: {
            yAtMeanX,
            diffCentroid,
            passesCentroid,
            sumResidual,
            residualsSumZero
        },
        query: {
            x: qx,
            yHat: qyHat,
            minX,
            maxX,
            isExtrapolation
        }
    };
}

export function computeFeatureStats(rawPoints) {
    const points = normalizePoints(rawPoints);
    const n = points.length;
    if (n === 0) return { meanX: 0, stdX: 1, hasSpread: false };
    let sumX = 0;
    for (let i = 0; i < n; i++) sumX += points[i].x;
    const meanX = sumX / n;
    let sqSum = 0;
    for (let i = 0; i < n; i++) {
        const d = points[i].x - meanX;
        sqSum += d * d;
    }
    const stdX = Math.sqrt(sqSum / n);
    return {
        meanX,
        stdX: stdX > 1e-12 ? stdX : 1,
        hasSpread: stdX > 1e-12
    };
}

function toActualWeights(theta0, theta1, stats, standardise) {
    if (standardise && stats.hasSpread) {
        const w1 = theta1 / stats.stdX;
        const w0 = theta0 - (theta1 * stats.meanX) / stats.stdX;
        return { w0, w1 };
    }
    return { w0: theta0, w1: theta1 };
}

function evaluateGDPoint(points, theta0, theta1, stats, standardise) {
    const n = points.length;
    if (n === 0) return { mse: 0, grad0: 0, grad1: 0, errors: [] };
    let sqSum = 0;
    let g0Sum = 0;
    let g1Sum = 0;
    const errors = [];
    for (let i = 0; i < n; i++) {
        const p = points[i];
        const featX = standardise && stats.hasSpread ? (p.x - stats.meanX) / stats.stdX : p.x;
        const yHat = theta0 + theta1 * featX;
        const err = yHat - p.y;
        errors.push(err);
        sqSum += err * err;
        g0Sum += 2 * err;
        g1Sum += 2 * err * featX;
    }
    return {
        mse: sqSum / n,
        grad0: g0Sum / n,
        grad1: g1Sum / n,
        errors
    };
}

export function createGDState(rawPoints, initW0 = 0, initW1 = 0, standardise = false) {
    const points = normalizePoints(rawPoints);
    const stats = computeFeatureStats(points);
    const useStd = Boolean(standardise && stats.hasSpread);
    const theta0 = Number.isFinite(Number(initW0)) ? Number(initW0) : 0;
    const theta1 = Number.isFinite(Number(initW1)) ? Number(initW1) : 0;
    const evalRes = evaluateGDPoint(points, theta0, theta1, stats, useStd);
    const actual = toActualWeights(theta0, theta1, stats, useStd);
    const entry = {
        iter: 0,
        theta0,
        theta1,
        w0: actual.w0,
        w1: actual.w1,
        mse: evalRes.mse,
        grad0: evalRes.grad0,
        grad1: evalRes.grad1,
        errors: evalRes.errors
    };
    return {
        iter: 0,
        standardise: useStd,
        stats,
        theta0,
        theta1,
        w0: actual.w0,
        w1: actual.w1,
        mse: evalRes.mse,
        grad0: evalRes.grad0,
        grad1: evalRes.grad1,
        errors: evalRes.errors,
        diverged: !Number.isFinite(evalRes.mse) || evalRes.mse > 1e12,
        history: [entry]
    };
}

export function stepGD(state, rawPoints, lr = 0.1) {
    if (!state) return createGDState(rawPoints, 0, 0, false);
    if (state.diverged) return state;
    const points = normalizePoints(rawPoints);
    const stepLr = Number.isFinite(Number(lr)) && Number(lr) > 0 ? Number(lr) : 0.01;
    const nextTheta0 = state.theta0 - stepLr * state.grad0;
    const nextTheta1 = state.theta1 - stepLr * state.grad1;

    if (!Number.isFinite(nextTheta0) || !Number.isFinite(nextTheta1) || Math.abs(nextTheta0) > 1e7 || Math.abs(nextTheta1) > 1e7) {
        return {
            ...state,
            diverged: true
        };
    }

    const evalRes = evaluateGDPoint(points, nextTheta0, nextTheta1, state.stats, state.standardise);
    const diverged = !Number.isFinite(evalRes.mse) || evalRes.mse > 1e12;
    const actual = toActualWeights(nextTheta0, nextTheta1, state.stats, state.standardise);
    const nextIter = state.iter + 1;

    const entry = {
        iter: nextIter,
        theta0: nextTheta0,
        theta1: nextTheta1,
        w0: actual.w0,
        w1: actual.w1,
        mse: evalRes.mse,
        grad0: evalRes.grad0,
        grad1: evalRes.grad1,
        errors: evalRes.errors
    };

    const nextHistory = state.history.length >= 250 ? state.history.slice(1) : [...state.history];
    nextHistory.push(entry);

    return {
        iter: nextIter,
        standardise: state.standardise,
        stats: state.stats,
        theta0: nextTheta0,
        theta1: nextTheta1,
        w0: actual.w0,
        w1: actual.w1,
        mse: evalRes.mse,
        grad0: evalRes.grad0,
        grad1: evalRes.grad1,
        errors: evalRes.errors,
        diverged,
        history: nextHistory
    };
}
