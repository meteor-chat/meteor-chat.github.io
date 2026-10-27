export function isPrime(n) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (let i = 5; i * i <= n; i += 6) {
        if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
}

export function getPrimes(max = 100) {
    const res = new Set();
    for (let i = 2; i <= max; i++) {
        if (isPrime(i)) res.add(i);
    }
    return res;
}

export function getFibonacci(max = 100) {
    const res = new Set();
    let a = 1;
    let b = 1;
    while (a <= max) {
        res.add(a);
        const next = a + b;
        a = b;
        b = next;
    }
    return res;
}

export function getMultiples(k, max = 100) {
    const res = new Set();
    const step = Math.max(1, Math.floor(k));
    for (let i = step; i <= max; i += step) {
        res.add(i);
    }
    return res;
}

export function getEvens(max = 100) {
    const res = new Set();
    for (let i = 2; i <= max; i += 2) {
        res.add(i);
    }
    return res;
}

export function getOdds(max = 100) {
    const res = new Set();
    for (let i = 1; i <= max; i += 2) {
        res.add(i);
    }
    return res;
}

export function getSquares(max = 100) {
    const res = new Set();
    for (let i = 1; i * i <= max; i++) {
        res.add(i * i);
    }
    return res;
}

export function getFactors(n) {
    const factors = [];
    for (let i = 1; i <= n; i++) {
        if (n % i === 0) factors.push(i);
    }
    return factors;
}

export function getNumberDetails(n) {
    const factors = getFactors(n);
    const prime = isPrime(n);
    const fibSet = getFibonacci(100);
    const sqSet = getSquares(100);
    return {
        number: n,
        isPrime: prime,
        isFibonacci: fibSet.has(n),
        isEven: n % 2 === 0,
        isSquare: sqSet.has(n),
        factors
    };
}
