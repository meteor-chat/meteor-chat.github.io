export function formatVal(v) {
    if (isNaN(v) || !isFinite(v) || v <= 0) return "0";
    if (Number.isInteger(v)) return v.toString();
    return parseFloat(v.toFixed(2)).toString();
}

export function resolveConeDimensions(mode, aRaw, bRaw) {
    const a = parseFloat(typeof aRaw === "string" ? aRaw.trim() : aRaw);
    const b = parseFloat(typeof bRaw === "string" ? bRaw.trim() : bRaw);

    let r = NaN;
    let t = NaN;
    let s = NaN;

    if (mode === "rt") {
        r = a;
        t = b;
        if (r > 0 && t > 0) s = Math.sqrt(r * r + t * t);
    } else if (mode === "rs") {
        r = a;
        s = b;
        if (r > 0 && s > r) t = Math.sqrt(s * s - r * r);
    } else if (mode === "ts") {
        t = a;
        s = b;
        if (t > 0 && s > t) r = Math.sqrt(s * s - t * t);
    }

    const valid =
        r > 0 && t > 0 && s > 0 &&
        isFinite(r) && isFinite(t) && isFinite(s);

    return { valid, r, t, s };
}

export function computeConeMetrics(mode, aRaw, bRaw) {
    const dims = resolveConeDimensions(mode, aRaw, bRaw);

    if (!dims.valid) {
        return {
            valid: false,
            r: 0,
            t: 0,
            s: 0,
            rText: "0",
            tText: "0",
            sText: "0",
            vol: "0",
            la: "0",
            ls: "0",
            lp: "0"
        };
    }

    const { r, t, s } = dims;
    const vol = (1 / 3) * Math.PI * r * r * t;
    const la = Math.PI * r * r;
    const ls = Math.PI * r * s;
    const lp = Math.PI * r * (r + s);

    return {
        valid: true,
        r,
        t,
        s,
        rText: formatVal(r),
        tText: formatVal(t),
        sText: formatVal(s),
        vol: formatVal(vol),
        la: formatVal(la),
        ls: formatVal(ls),
        lp: formatVal(lp)
    };
}
