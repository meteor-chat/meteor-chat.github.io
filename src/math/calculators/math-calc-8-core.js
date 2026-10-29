export const PARETO_PRESETS = [
    { label: "Slide 6: Strict", a: [3, 29], b: [4, 44], desc: "Dominasi mutlak (3,29) \u227a (4,44)" },
    { label: "Slide 6: Tie f1", a: [3, 44], b: [3, 45], desc: "Tie pada f1 diperbolehkan" },
    { label: "Slide 6: Trade-off", a: [5, 27], b: [3, 44], desc: "Incomparable (trade-off)" },
    { label: "Slide 6: Identik", a: [4, 41], b: [4, 41], desc: "Titik identik (neither)" },
    { label: "Slide 11: P5 vs P1", a: [3, 44], b: [4, 44], desc: "P5 mendominasi P1" },
    { label: "Slide 11: P2 vs P6", a: [5, 27], b: [4, 41], desc: "Front 1 trade-off" }
];

export function checkNoWorse(valA, valB, dir) {
    return dir === "max" ? valA >= valB : valA <= valB;
}

export function checkStrictlyBetter(valA, valB, dir) {
    return dir === "max" ? valA > valB : valA < valB;
}

export function evaluatePareto(vecA, vecB, directions = ["min", "min"]) {
    if (!vecA || !vecB || vecA.length !== 2 || vecB.length !== 2) return null;
    const [a1, a2] = vecA;
    const [b1, b2] = vecB;
    const [d1, d2] = directions;
    const dim1NoWorseA = checkNoWorse(a1, b1, d1);
    const dim2NoWorseA = checkNoWorse(a2, b2, d2);
    const dim1StrictA = checkStrictlyBetter(a1, b1, d1);
    const dim2StrictA = checkStrictlyBetter(a2, b2, d2);
    const aDominatesB = (dim1NoWorseA && dim2NoWorseA) && (dim1StrictA || dim2StrictA);

    const dim1NoWorseB = checkNoWorse(b1, a1, d1);
    const dim2NoWorseB = checkNoWorse(b2, a2, d2);
    const dim1StrictB = checkStrictlyBetter(b1, a1, d1);
    const dim2StrictB = checkStrictlyBetter(b2, a2, d2);
    const bDominatesA = (dim1NoWorseB && dim2NoWorseB) && (dim1StrictB || dim2StrictB);

    const identical = a1 === b1 && a2 === b2;
    let status = "incomparable";
    if (identical) {
        status = "identical";
    } else if (aDominatesB) {
        status = "a_dom_b";
    } else if (bDominatesA) {
        status = "b_dom_a";
    }

    return {
        vecA: [a1, a2],
        vecB: [b1, b2],
        directions: [d1, d2],
        dimDetailsA: [
            { idx: 1, valA: a1, valB: b1, dir: d1, noWorse: dim1NoWorseA, strictlyBetter: dim1StrictA },
            { idx: 2, valA: a2, valB: b2, dir: d2, noWorse: dim2NoWorseA, strictlyBetter: dim2StrictA }
        ],
        dimDetailsB: [
            { idx: 1, valA: b1, valB: a1, dir: d1, noWorse: dim1NoWorseB, strictlyBetter: dim1StrictB },
            { idx: 2, valA: b2, valB: a2, dir: d2, noWorse: dim2NoWorseB, strictlyBetter: dim2StrictB }
        ],
        aDominatesB,
        bDominatesA,
        identical,
        status
    };
}
