const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export function bayer(x, y) {
    return (BAYER4[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
}

export function palettePick(stops, t, x, y, spread = 0.55) {
    const last = stops.length - 1;
    const clamped = Math.max(0, Math.min(1, t));
    const f = clamped * last + (bayer(x, y) - 0.5) * spread;
    return stops[Math.max(0, Math.min(last, Math.round(f)))];
}

export function shade(color, amount) {
    return [color[0] + amount, color[1] + amount, color[2] + amount];
}
