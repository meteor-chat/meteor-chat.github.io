export function parseBarData(rawText) {
    if (typeof rawText !== "string") return [];
    const lines = rawText.split(/\r?\n/);
    const results = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        let category = "";
        let valStr = "";
        if (line.includes(":")) {
            const idx = line.indexOf(":");
            category = line.slice(0, idx).trim();
            valStr = line.slice(idx + 1).trim();
        } else if (line.includes(",")) {
            const idx = line.lastIndexOf(",");
            category = line.slice(0, idx).trim();
            valStr = line.slice(idx + 1).trim();
        } else if (line.includes("\t")) {
            const idx = line.lastIndexOf("\t");
            category = line.slice(0, idx).trim();
            valStr = line.slice(idx + 1).trim();
        } else {
            const match = line.match(/^(.*?)[\s]+([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)$/);
            if (match) {
                category = match[1].trim();
                valStr = match[2].trim();
            } else {
                category = line;
                valStr = "0";
            }
        }
        const parsedVal = parseFloat(valStr);
        const value = Number.isFinite(parsedVal) ? parsedVal : 0;
        if (category.length > 0) {
            results.push({ category, value });
        }
    }
    return results;
}

export function computeDatasetStats(items) {
    if (!Array.isArray(items) || items.length === 0) {
        return {
            count: 0,
            sum: 0,
            mean: 0,
            min: 0,
            max: 0,
            variance: 0,
            stdDev: 0,
            hasNegative: false
        };
    }
    const count = items.length;
    let sum = 0;
    let min = items[0].value;
    let max = items[0].value;
    let hasNegative = false;
    for (let i = 0; i < count; i++) {
        const v = items[i].value;
        sum += v;
        if (v < min) min = v;
        if (v > max) max = v;
        if (v < 0) hasNegative = true;
    }
    const mean = sum / count;
    let sumSqDiff = 0;
    for (let i = 0; i < count; i++) {
        const diff = items[i].value - mean;
        sumSqDiff += diff * diff;
    }
    const variance = count > 1 ? sumSqDiff / (count - 1) : 0;
    const stdDev = Math.sqrt(variance);
    return {
        count,
        sum,
        mean,
        min,
        max,
        variance,
        stdDev,
        hasNegative
    };
}

export function sortBarData(items, sortMode = "none") {
    if (!Array.isArray(items)) return [];
    const copy = items.slice();
    if (sortMode === "asc") {
        copy.sort((a, b) => a.value - b.value);
    } else if (sortMode === "desc") {
        copy.sort((a, b) => b.value - a.value);
    } else if (sortMode === "alpha-asc") {
        copy.sort((a, b) => a.category.localeCompare(b.category));
    } else if (sortMode === "alpha-desc") {
        copy.sort((a, b) => b.category.localeCompare(a.category));
    }
    return copy;
}

export function formatNumber(val, decimals = 1) {
    if (!Number.isFinite(val)) return "0";
    if (Math.abs(val) >= 1e6) {
        return (val / 1e6).toFixed(decimals) + "M";
    }
    if (Math.abs(val) >= 1e3) {
        return (val / 1e3).toFixed(decimals) + "k";
    }
    return Number.isInteger(val) ? val.toString() : val.toFixed(decimals);
}

export function exportToCSV(items) {
    if (!Array.isArray(items)) return "Category,Value\n";
    const header = "Category,Value\n";
    const rows = items.map((item) => {
        const cat = item.category.includes(",") || item.category.includes('"')
            ? `"${item.category.replace(/"/g, '""')}"`
            : item.category;
        return `${cat},${item.value}`;
    });
    return header + rows.join("\n");
}
