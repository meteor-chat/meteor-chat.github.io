function createPseudoRandom(seed = 12345) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function() {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

function gaussianPair(rng) {
    let u = 0;
    let v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    const r = Math.sqrt(-2.0 * Math.log(u));
    const theta = 2.0 * Math.PI * v;
    return [r * Math.cos(theta), r * Math.sin(theta)];
}

export function getBlobsPreset() {
    const rng = createPseudoRandom(42);
    const points = [];
    for (let i = 0; i < 24; i++) {
        const [g1, g2] = gaussianPair(rng);
        points.push({
            x1: Math.round((-2.2 + g1 * 0.75) * 100) / 100,
            x2: Math.round((-1.8 + g2 * 0.75) * 100) / 100,
            y: 0
        });
    }
    for (let i = 0; i < 24; i++) {
        const [g1, g2] = gaussianPair(rng);
        points.push({
            x1: Math.round((2.0 + g1 * 0.75) * 100) / 100,
            x2: Math.round((2.0 + g2 * 0.75) * 100) / 100,
            y: 1
        });
    }
    return points;
}

export function getOverlapPreset() {
    const rng = createPseudoRandom(99);
    const points = [];
    for (let i = 0; i < 30; i++) {
        const [g1, g2] = gaussianPair(rng);
        points.push({
            x1: Math.round((-1.0 + g1 * 1.35) * 100) / 100,
            x2: Math.round((-0.8 + g2 * 1.35) * 100) / 100,
            y: 0
        });
    }
    for (let i = 0; i < 30; i++) {
        const [g1, g2] = gaussianPair(rng);
        points.push({
            x1: Math.round((1.0 + g1 * 1.35) * 100) / 100,
            x2: Math.round((1.0 + g2 * 1.35) * 100) / 100,
            y: 1
        });
    }
    return points;
}

export function getImbalancedPreset() {
    const rng = createPseudoRandom(77);
    const points = [];
    for (let i = 0; i < 45; i++) {
        const [g1, g2] = gaussianPair(rng);
        points.push({
            x1: Math.round((-0.5 + g1 * 1.4) * 100) / 100,
            x2: Math.round((-0.5 + g2 * 1.4) * 100) / 100,
            y: 0
        });
    }
    for (let i = 0; i < 5; i++) {
        const [g1, g2] = gaussianPair(rng);
        points.push({
            x1: Math.round((2.8 + g1 * 0.6) * 100) / 100,
            x2: Math.round((2.6 + g2 * 0.6) * 100) / 100,
            y: 1
        });
    }
    return points;
}

export function getXORPreset() {
    const rng = createPseudoRandom(333);
    const points = [];
    const centers = [
        { cx: -2.0, cy: -2.0, y: 0 },
        { cx: 2.0, cy: 2.0, y: 0 },
        { cx: -2.0, cy: 2.0, y: 1 },
        { cx: 2.0, cy: -2.0, y: 1 }
    ];
    for (let c = 0; c < centers.length; c++) {
        const { cx, cy, y } = centers[c];
        for (let i = 0; i < 14; i++) {
            const [g1, g2] = gaussianPair(rng);
            points.push({
                x1: Math.round((cx + g1 * 0.65) * 100) / 100,
                x2: Math.round((cy + g2 * 0.65) * 100) / 100,
                y
            });
        }
    }
    return points;
}
