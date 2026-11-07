function hexToRgb(hex) {
    const num = parseInt(hex.replace("#", ""), 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

const COLORMAP_STOPS = {
    viridis: [
        { t: 0.0, c: hexToRgb("#440154") },
        { t: 0.15, c: hexToRgb("#482878") },
        { t: 0.3, c: hexToRgb("#3e4a89") },
        { t: 0.45, c: hexToRgb("#31688e") },
        { t: 0.6, c: hexToRgb("#26828e") },
        { t: 0.75, c: hexToRgb("#1f9e89") },
        { t: 0.88, c: hexToRgb("#6ece58") },
        { t: 1.0, c: hexToRgb("#fde725") }
    ],
    cividis: [
        { t: 0.0, c: hexToRgb("#00204d") },
        { t: 0.2, c: hexToRgb("#2e4065") },
        { t: 0.4, c: hexToRgb("#566479") },
        { t: 0.6, c: hexToRgb("#808988") },
        { t: 0.8, c: hexToRgb("#b3b27b") },
        { t: 1.0, c: hexToRgb("#ffea46") }
    ],
    rdbu: [
        { t: 0.0, c: hexToRgb("#053061") },
        { t: 0.25, c: hexToRgb("#4393c3") },
        { t: 0.5, c: hexToRgb("#f7f7f7") },
        { t: 0.75, c: hexToRgb("#d6604d") },
        { t: 1.0, c: hexToRgb("#67001f") }
    ]
};

export function sampleColormap(name, normT) {
    const stops = COLORMAP_STOPS[name] || COLORMAP_STOPS.viridis;
    const t = Math.max(0, Math.min(1, normT));

    let lower = stops[0];
    let upper = stops[stops.length - 1];

    for (let i = 0; i < stops.length - 1; i++) {
        if (t >= stops[i].t && t <= stops[i + 1].t) {
            lower = stops[i];
            upper = stops[i + 1];
            break;
        }
    }

    const range = upper.t - lower.t;
    const frac = range > 0 ? (t - lower.t) / range : 0;
    const r = Math.round(lower.c[0] + frac * (upper.c[0] - lower.c[0]));
    const g = Math.round(lower.c[1] + frac * (upper.c[1] - lower.c[1]));
    const b = Math.round(lower.c[2] + frac * (upper.c[2] - lower.c[2]));

    return { r, g, b, css: `rgb(${r},${g},${b})` };
}
