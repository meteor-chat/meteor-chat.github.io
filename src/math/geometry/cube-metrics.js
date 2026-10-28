export function formatVal(v) {
    if (isNaN(v) || !isFinite(v) || v <= 0) return "0";
    if (Number.isInteger(v)) return v.toString();
    return parseFloat(v.toFixed(2)).toString();
}

export function computeCubeMetrics(rawVal) {
    const raw = typeof rawVal === "string" ? rawVal.trim() : String(rawVal || "").trim();
    const s = parseFloat(raw);
    if (isNaN(s) || s <= 0) {
        return {
            valid: false,
            sisi: 0,
            sisiText: raw === "" ? "0" : raw,
            vol: "0",
            lp: "0",
            pr: "0",
            ds: "0",
            dr: "0",
            bd: "0"
        };
    }
    const vol = Math.pow(s, 3);
    const lp = 6 * s * s;
    const pr = 12 * s;
    const ds = parseFloat((s * Math.sqrt(2)).toFixed(2));
    const dr = parseFloat((s * Math.sqrt(3)).toFixed(2));
    const bd = parseFloat((s * ds).toFixed(2));
    return {
        valid: true,
        sisi: s,
        sisiText: raw,
        vol: formatVal(vol),
        lp: formatVal(lp),
        pr: formatVal(pr),
        ds: isNaN(ds) ? "0" : ds.toFixed(2),
        dr: isNaN(dr) ? "0" : dr.toFixed(2),
        bd: isNaN(bd) ? "0" : bd.toFixed(2)
    };
}
