export function gcd(a, b) {
    let x = BigInt(Math.abs(Number(a)));
    let y = BigInt(Math.abs(Number(b)));
    while (y !== 0n) {
        const t = y;
        y = x % y;
        x = t;
    }
    return Number(x);
}

export function getPrimeFactors(n) {
    let val = Math.abs(Number(n));
    const factors = [];
    if (val < 2) return factors;
    if (val % 2 === 0) {
        factors.push(2);
        while (val % 2 === 0) val /= 2;
    }
    let d = 3;
    while (d * d <= val) {
        if (val % d === 0) {
            factors.push(d);
            while (val % d === 0) val /= d;
        }
        d += 2;
    }
    if (val > 1) factors.push(val);
    return factors;
}

export function checkHullDobell(a, c, m) {
    const numA = Number(a);
    const numC = Number(c);
    const numM = Number(m);

    if (numM <= 0) {
        return {
            isFullPeriod: false,
            cond1: { passed: false, gcd: 0 },
            cond2: { passed: false, primes: [] },
            cond3: { passed: false, mMod4: false }
        };
    }

    const g = gcd(numC, numM);
    const cond1 = g === 1;

    const primes = getPrimeFactors(numM);
    const aMinus1 = numA - 1;
    const cond2 = primes.length === 0 ? true : primes.every((p) => aMinus1 % p === 0);

    const mMod4 = numM % 4 === 0;
    const cond3 = !mMod4 || aMinus1 % 4 === 0;

    const isFullPeriod = cond1 && cond2 && cond3;

    return {
        isFullPeriod,
        cond1: { passed: cond1, gcd: g },
        cond2: { passed: cond2, primes },
        cond3: { passed: cond3, mMod4 }
    };
}

export function nextLcg(Xn, a, c, m) {
    const bM = BigInt(m);
    if (bM <= 0n) return 0;
    const bX = BigInt(Xn);
    const bA = BigInt(a);
    const bC = BigInt(c);
    const res = ((bA * bX + bC) % bM + bM) % bM;
    return Number(res);
}

export function stepDetail(Xn, a, c, m) {
    const current = Number(Xn);
    const numA = Number(a);
    const numC = Number(c);
    const numM = Number(m);
    const prod = numA * current;
    const sum = prod + numC;
    const next = nextLcg(current, numA, numC, numM);
    return {
        current,
        next,
        formula: `(${numA} × ${current} + ${numC}) mod ${numM}`,
        sum,
        stepText: `(${prod} + ${numC}) mod ${numM} = ${sum} mod ${numM} = ${next}`
    };
}

export function detectCycle(X0, a, c, m, maxLimit = 20000) {
    const numM = Number(m);
    const limit = Math.min(numM > 0 ? numM + 2 : maxLimit, maxLimit);
    const sequence = [];
    const seen = new Map();

    let current = Number(X0);
    let step = 0;
    let cycleStart = -1;

    while (step < limit) {
        if (seen.has(current)) {
            cycleStart = seen.get(current);
            break;
        }
        seen.set(current, step);
        sequence.push(current);
        current = nextLcg(current, a, c, m);
        step++;
    }

    const period = cycleStart !== -1 ? sequence.length - cycleStart : sequence.length;
    const isFullPeriod = period === numM;

    return {
        sequence,
        period,
        cycleStart,
        isFullPeriod,
        totalVisited: sequence.length
    };
}

export function generateLcgSeries(X0, a, c, m, count = 20) {
    const series = [];
    let curr = Number(X0);
    for (let i = 0; i < count; i++) {
        const detail = stepDetail(curr, a, c, m);
        series.push({
            index: i + 1,
            ...detail
        });
        curr = detail.next;
    }
    return series;
}
