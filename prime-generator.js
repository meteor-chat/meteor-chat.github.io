const cachedPrimes = [];

function sievePrimes(targetCount) {
    let limit = targetCount < 6 ? 15 : Math.ceil(targetCount * (Math.log(targetCount) + Math.log(Math.log(targetCount))) * 1.2) + 20;
    while (true) {
        const sieve = new Uint8Array(limit + 1);
        const sqrt = Math.floor(Math.sqrt(limit));
        for (let i = 2; i <= sqrt; i++) {
            if (sieve[i] === 0) {
                for (let j = i * i; j <= limit; j += i) {
                    sieve[j] = 1;
                }
            }
        }
        cachedPrimes.length = 0;
        for (let i = 2; i <= limit; i++) {
            if (sieve[i] === 0) {
                cachedPrimes.push(i);
                if (cachedPrimes.length === targetCount) {
                    return;
                }
            }
        }
        if (cachedPrimes.length >= targetCount) {
            return;
        }
        limit = Math.ceil(limit * 1.5);
    }
}

export function getPrimes(n) {
    if (typeof n !== "number" || isNaN(n) || n < 1) return [];
    const maxAllowed = 100000;
    const count = Math.min(Math.floor(n), maxAllowed);
    if (cachedPrimes.length < count) {
        sievePrimes(count);
    }
    return cachedPrimes.slice(0, count);
}
