export const LANDSCAPES = {
    doubleWell: {
        id: "doubleWell",
        name: "Double-Well Potential (Dua Lembah)",
        latex: "f(x) = (x^2 - 1)^2 + 0.1x",
        domain: [-2.2, 2.2],
        eval: (x) => Math.pow(x * x - 1, 2) + 0.1 * x,
        yRange: [-0.5, 4.0]
    },
    rastrigin: {
        id: "rastrigin",
        name: "Rastrigin 1D (Banyak Lembah)",
        latex: "f(x) = 10 + x^2 - 10\\cos(2\\pi x)",
        domain: [-2.5, 2.5],
        eval: (x) => 10 + x * x - 10 * Math.cos(2 * Math.PI * x),
        yRange: [0, 22]
    },
    sineWave: {
        id: "sineWave",
        name: "Gelombang Sinus Teredam",
        latex: "f(x) = x \\sin(x) + 0.1x^2",
        domain: [-8.0, 8.0],
        eval: (x) => x * Math.sin(x) + 0.1 * x * x,
        yRange: [-8.0, 14.0]
    },
    quadratic: {
        id: "quadratic",
        name: "Fungsi Kuadrat Murni (Konveks)",
        latex: "f(x) = x^2",
        domain: [-4.0, 4.0],
        eval: (x) => x * x,
        yRange: [0, 18.0]
    }
};

export function calcMetropolis(deltaE, temp) {
    if (deltaE <= 0) return 1.0;
    if (temp <= 1e-9) return 0.0;
    const p = Math.exp(-deltaE / temp);
    return Math.max(0, Math.min(1, p));
}

export function generateNeighbor(currX, sigma, minX, maxX) {
    const u1 = Math.random() || 1e-7;
    const u2 = Math.random() || 1e-7;
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    const candX = currX + z * sigma;
    return Math.max(minX, Math.min(maxX, candX));
}

export function computeNextTemp(temp, t0, iter, schedule, alpha, maxIter = 200, tMin = 0.001) {
    if (schedule === "linear") {
        const step = (t0 - tMin) / Math.max(1, maxIter);
        return Math.max(tMin, temp - step);
    }
    if (schedule === "harmonic") {
        return Math.max(tMin, t0 / (1 + 0.04 * iter));
    }
    return Math.max(tMin, temp * alpha);
}

export function getTempStatus(temp, t0) {
    const ratio = t0 > 0 ? temp / t0 : 0;
    if (ratio > 0.6) return { label: "Sangat Panas 🔥", level: "hot", color: "#f43f5e" };
    if (ratio > 0.25) return { label: "Hangat ⚡", level: "warm", color: "#f59e0b" };
    if (ratio > 0.06) return { label: "Dingin ❄️", level: "cool", color: "#38bdf8" };
    return { label: "Beku / Stabil 🧊", level: "freeze", color: "#10b981" };
}

export function createInitialState(landscapeKey, x0, t0) {
    const fn = LANDSCAPES[landscapeKey] || LANDSCAPES.doubleWell;
    const clampedX = Math.max(fn.domain[0], Math.min(fn.domain[1], x0));
    const initE = fn.eval(clampedX);
    return {
        iter: 0,
        temp: t0,
        currX: clampedX,
        currE: initE,
        candX: clampedX,
        candE: initE,
        deltaE: 0,
        prob: 1,
        roll: 0,
        accepted: true,
        bestX: clampedX,
        bestE: initE,
        isNewBest: true,
        acceptedCount: 0,
        rejectedCount: 0,
        history: [{ iter: 0, temp: t0, currE: initE, bestE: initE }]
    };
}

export function stepSA(state, params) {
    const { landscape, schedule, sigma, alpha, t0, maxIter = 250, tMin = 0.001 } = params;
    const fn = LANDSCAPES[landscape] || LANDSCAPES.doubleWell;
    const candX = generateNeighbor(state.currX, sigma, fn.domain[0], fn.domain[1]);
    const candE = fn.eval(candX);
    const deltaE = candE - state.currE;
    const prob = calcMetropolis(deltaE, state.temp);
    const roll = Math.random();
    const accepted = deltaE <= 0 || roll < prob;
    const nextIter = state.iter + 1;
    const nextTemp = computeNextTemp(state.temp, t0, nextIter, schedule, alpha, maxIter, tMin);
    const nextX = accepted ? candX : state.currX;
    const nextE = accepted ? candE : state.currE;
    const isNewBest = nextE < state.bestE;
    const nextBestX = isNewBest ? nextX : state.bestX;
    const nextBestE = isNewBest ? nextE : state.bestE;
    const nextHistory = state.history.length >= 80 ? state.history.slice(1) : [...state.history];
    nextHistory.push({ iter: nextIter, temp: nextTemp, currE: nextE, bestE: nextBestE });
    return {
        iter: nextIter,
        temp: nextTemp,
        currX: nextX,
        currE: nextE,
        candX,
        candE,
        deltaE,
        prob,
        roll,
        accepted,
        bestX: nextBestX,
        bestE: nextBestE,
        isNewBest,
        acceptedCount: state.acceptedCount + (accepted ? 1 : 0),
        rejectedCount: state.rejectedCount + (accepted ? 0 : 1),
        history: nextHistory
    };
}
