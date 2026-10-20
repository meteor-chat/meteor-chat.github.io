export function formatMax3(val) {
    if (val === null || val === undefined || val === "") return "0";
    const num = typeof val === "number" ? val : parseFloat(val);
    if (isNaN(num)) return "0";
    if (!isFinite(num)) return num.toString();
    const parsed = parseFloat(num.toFixed(3));
    return Object.is(parsed, -0) || parsed === 0 ? "0" : parsed.toString();
}

