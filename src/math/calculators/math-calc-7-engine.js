export function computePairCrossover(p1, p2, type, k, k1, k2, mask) {
    const cleanP1 = (p1 || "").trim();
    const cleanP2 = (p2 || "").trim();

    if (!cleanP1 || !cleanP2) {
        return { valid: false, errorMsg: "Parent 1 dan Parent 2 wajib diisi" };
    }
    if (!/^[01]+$/.test(cleanP1) || !/^[01]+$/.test(cleanP2)) {
        return { valid: false, errorMsg: "Kromosom harus berupa deret biner (0 atau 1)" };
    }
    if (cleanP1.length !== cleanP2.length) {
        return { valid: false, errorMsg: "Panjang kromosom Parent 1 dan Parent 2 harus sama" };
    }

    const n = cleanP1.length;
    if (n < 2) {
        return { valid: false, errorMsg: "Panjang kromosom minimal 2 bit" };
    }

    let c1 = "";
    let c2 = "";

    if (type === "single") {
        const cutK = parseInt(k, 10);
        if (isNaN(cutK) || cutK < 1 || cutK >= n) {
            return { valid: false, errorMsg: `Titik potong k harus antara 1 dan ${n - 1}` };
        }
        c1 = cleanP1.slice(0, cutK) + cleanP2.slice(cutK);
        c2 = cleanP2.slice(0, cutK) + cleanP1.slice(cutK);
        return {
            valid: true,
            p1: cleanP1,
            p2: cleanP2,
            type,
            k: cutK,
            c1,
            c2,
            n,
            decC1: parseInt(c1, 2),
            decC2: parseInt(c2, 2)
        };
    }

    if (type === "two") {
        const cutK1 = parseInt(k1, 10);
        const cutK2 = parseInt(k2, 10);
        if (isNaN(cutK1) || isNaN(cutK2) || cutK1 < 1 || cutK2 >= n || cutK1 >= cutK2) {
            return { valid: false, errorMsg: `Titik potong tidak valid (1 \u2264 k1 < k2 < ${n})` };
        }
        c1 = cleanP1.slice(0, cutK1) + cleanP2.slice(cutK1, cutK2) + cleanP1.slice(cutK2);
        c2 = cleanP2.slice(0, cutK1) + cleanP1.slice(cutK1, cutK2) + cleanP2.slice(cutK2);
        return {
            valid: true,
            p1: cleanP1,
            p2: cleanP2,
            type,
            k1: cutK1,
            k2: cutK2,
            c1,
            c2,
            n,
            decC1: parseInt(c1, 2),
            decC2: parseInt(c2, 2)
        };
    }

    if (type === "uniform") {
        const cleanMask = (mask || "").trim();
        if (cleanMask.length !== n || !/^[01]+$/.test(cleanMask)) {
            return { valid: false, errorMsg: `Mask harus biner sepanjang ${n} bit` };
        }
        for (let i = 0; i < n; i++) {
            if (cleanMask[i] === "1") {
                c1 += cleanP1[i];
                c2 += cleanP2[i];
            } else {
                c1 += cleanP2[i];
                c2 += cleanP1[i];
            }
        }
        return {
            valid: true,
            p1: cleanP1,
            p2: cleanP2,
            type,
            mask: cleanMask,
            c1,
            c2,
            n,
            decC1: parseInt(c1, 2),
            decC2: parseInt(c2, 2)
        };
    }

    return { valid: false, errorMsg: "Tipe skema crossover tidak dikenal" };
}

export function calculateHammingDistance(s1, s2) {
    if (!s1 || !s2 || s1.length !== s2.length) return 0;
    let dist = 0;
    for (let i = 0; i < s1.length; i++) {
        if (s1[i] !== s2[i]) dist++;
    }
    return dist;
}

export function isPopulationIdentical(chromosomes) {
    if (!Array.isArray(chromosomes) || chromosomes.length <= 1) return true;
    const first = chromosomes[0];
    return chromosomes.every(c => c === first);
}

export function calculatePopulationDiversity(chromosomes) {
    if (!Array.isArray(chromosomes) || chromosomes.length <= 1) return 0;
    let totalPairs = 0;
    let totalDist = 0;
    const len = chromosomes[0].length || 1;
    for (let i = 0; i < chromosomes.length; i++) {
        for (let j = i + 1; j < chromosomes.length; j++) {
            totalDist += calculateHammingDistance(chromosomes[i], chromosomes[j]);
            totalPairs++;
        }
    }
    if (totalPairs === 0) return 0;
    const maxPossible = totalPairs * len;
    return maxPossible > 0 ? (totalDist / maxPossible) * 100 : 0;
}

export function stepPopulationGeneration(parents, pc, type, cutParams = {}, rng = Math.random) {
    if (!Array.isArray(parents) || parents.length < 2) {
        return { valid: false, errorMsg: "Populasi minimal harus 2 kromosom" };
    }

    const n = parents[0].length;
    for (let i = 0; i < parents.length; i++) {
        if (!/^[01]+$/.test(parents[i]) || parents[i].length !== n) {
            return { valid: false, errorMsg: "Semua kromosom harus biner dengan panjang seragam" };
        }
    }

    const pairsResult = [];
    const offspring = [];

    for (let idx = 0; idx < parents.length; idx += 2) {
        const pA = parents[idx];
        const pB = idx + 1 < parents.length ? parents[idx + 1] : parents[idx];
        const rVal = rng();
        const doCross = rVal <= pc;

        let resA = pA;
        let resB = pB;
        let pairCutInfo = {};

        if (doCross) {
            let k = cutParams.k;
            if (type === "single") {
                if (k === undefined || k === null) {
                    k = Math.max(1, Math.floor(n / 2));
                }
                const crossRes = computePairCrossover(pA, pB, "single", k);
                if (crossRes.valid) {
                    resA = crossRes.c1;
                    resB = crossRes.c2;
                    pairCutInfo = { k };
                }
            } else if (type === "two") {
                let k1 = cutParams.k1;
                let k2 = cutParams.k2;
                if (!k1 || !k2 || k1 >= k2) {
                    k1 = Math.max(1, Math.floor(n / 3));
                    k2 = Math.min(n - 1, Math.floor((2 * n) / 3));
                }
                const crossRes = computePairCrossover(pA, pB, "two", null, k1, k2);
                if (crossRes.valid) {
                    resA = crossRes.c1;
                    resB = crossRes.c2;
                    pairCutInfo = { k1, k2 };
                }
            } else if (type === "uniform") {
                let mask = cutParams.mask;
                if (!mask || mask.length !== n) {
                    mask = "";
                    for (let m = 0; m < n; m++) mask += m % 2 === 0 ? "1" : "0";
                }
                const crossRes = computePairCrossover(pA, pB, "uniform", null, null, null, mask);
                if (crossRes.valid) {
                    resA = crossRes.c1;
                    resB = crossRes.c2;
                    pairCutInfo = { mask };
                }
            }
        }

        pairsResult.push({
            pairIndex: pairsResult.length + 1,
            parentA: pA,
            parentB: pB,
            rVal: Number(rVal.toFixed(4)),
            pc: Number(pc),
            crossoverApplied: doCross,
            cutInfo: pairCutInfo,
            offspringA: resA,
            offspringB: resB,
            decA: parseInt(resA, 2),
            decB: parseInt(resB, 2)
        });

        offspring.push(resA);
        if (idx + 1 < parents.length) {
            offspring.push(resB);
        }
    }

    const identical = isPopulationIdentical(offspring);
    const diversity = calculatePopulationDiversity(offspring);

    return {
        valid: true,
        pairs: pairsResult,
        offspring,
        isIdentical: identical,
        diversity: Number(diversity.toFixed(2))
    };
}
