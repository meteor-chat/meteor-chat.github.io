const MISSING_TOKENS = new Set(["", "null", "nan", "na", "n/a", "none", "-"]);

function detectDelimiter(line) {
    const counts = { "\t": 0, ";": 0, ",": 0 };
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
        const ch = line[i];
        if (ch === "\"") {
            inQuotes = !inQuotes;
        } else if (!inQuotes && counts[ch] !== undefined) {
            counts[ch] += 1;
        }
    }
    if (counts["\t"] > 0 && counts["\t"] >= counts[","] && counts["\t"] >= counts[";"]) {
        return "\t";
    }
    if (counts[";"] > 0 && counts[";"] >= counts[","]) {
        return ";";
    }
    if (counts[","] > 0) {
        return ",";
    }
    return line.includes(":") ? ":" : ",";
}

function splitDelimitedLine(line, delimiter) {
    const cells = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
        const ch = line[i];
        if (ch === "\"") {
            if (inQuotes && line[i + 1] === "\"") {
                current += "\"";
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === delimiter && !inQuotes) {
            cells.push(current.trim());
            current = "";
        } else {
            current += ch;
        }
    }
    cells.push(current.trim());
    return cells;
}

export function parseNonNegativeNumber(raw) {
    if (raw === null || raw === undefined) {
        return null;
    }
    const text = String(raw).trim().replace(/%$/, "");
    if (MISSING_TOKENS.has(text.toLowerCase())) {
        return null;
    }
    const num = Number(text.replace(/\s+/g, ""));
    if (!Number.isFinite(num) || num <= 0) {
        return null;
    }
    return num;
}

function isStrictNumberCell(raw) {
    if (raw === null || raw === undefined) {
        return false;
    }
    const text = String(raw).trim().replace(/%$/, "");
    return Boolean(text) && Number.isFinite(Number(text.replace(/\s+/g, "")));
}

function hasHeaderRow(rows) {
    if (rows.length < 2 || rows[0].length < 2) {
        return false;
    }
    for (let c = 1; c < rows[0].length; c += 1) {
        if (!isStrictNumberCell(rows[0][c])) {
            return true;
        }
    }
    return false;
}

export function parsePieData(rawText) {
    const lines = String(rawText || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    if (lines.length === 0) {
        return { labelHeader: "Kategori", seriesNames: ["Nilai"], rows: [], excludedCount: 0 };
    }
    const delimiter = detectDelimiter(lines[0]);
    const table = lines.map((line) => splitDelimitedLine(line, delimiter));
    const withHeader = hasHeaderRow(table);
    const maxCols = Math.max(2, ...table.map((r) => r.length));
    const headerRow = withHeader ? table[0] : null;
    const labelHeader = headerRow && headerRow[0] ? headerRow[0] : "Kategori";
    const seriesNames = [];
    for (let c = 1; c < maxCols; c += 1) {
        seriesNames.push(headerRow && headerRow[c] ? headerRow[c] : `Seri ${c}`);
    }
    const startIdx = withHeader ? 1 : 0;
    const byLabel = new Map();
    let excludedCount = 0;
    for (let r = startIdx; r < table.length; r += 1) {
        const cells = table[r];
        const label = (cells[0] || "").trim();
        if (!label) {
            excludedCount += 1;
            continue;
        }
        const vals = seriesNames.map((_, sIdx) => parseNonNegativeNumber(cells[sIdx + 1]));
        const hasPositive = vals.some((v) => v !== null && v > 0);
        if (!hasPositive) {
            excludedCount += 1;
            continue;
        }
        if (byLabel.has(label)) {
            const existing = byLabel.get(label);
            for (let sIdx = 0; sIdx < seriesNames.length; sIdx += 1) {
                if (vals[sIdx] !== null) {
                    existing.values[sIdx] = (existing.values[sIdx] || 0) + vals[sIdx];
                }
            }
        } else {
            byLabel.set(label, {
                id: `cat-${byLabel.size}`,
                label,
                colorIndex: byLabel.size,
                values: vals.map((v) => v || 0)
            });
        }
    }
    return {
        labelHeader,
        seriesNames,
        rows: Array.from(byLabel.values()),
        excludedCount
    };
}

function getRowSortMetric(row) {
    if (!row.values || row.values.length === 0) {
        return 0;
    }
    if (row.values.length === 1) {
        return row.values[0];
    }
    let sum = 0;
    for (let i = 0; i < row.values.length; i += 1) {
        sum += row.values[i] || 0;
    }
    return sum;
}

export function preparePieData(dataset, options = {}) {
    const {
        hiddenCategories = new Set(),
        sortOrder = "desc",
        groupSmall = false,
        smallThresholdPct = 3
    } = options;
    const rows = dataset ? dataset.rows : [];
    const seriesNames = dataset ? dataset.seriesNames : ["Nilai"];
    const seriesCount = Math.max(1, seriesNames.length);
    const activeRows = rows.filter((row) => !hiddenCategories.has(row.id));
    let workingRows = activeRows.map((row) => ({ ...row, values: [...row.values], isGrouped: false, groupedItems: [] }));

    if (groupSmall && seriesCount === 1 && workingRows.length > 2) {
        const total = workingRows.reduce((acc, row) => acc + (row.values[0] || 0), 0);
        if (total > 0) {
            const thresholdFrac = Math.max(0.5, smallThresholdPct) / 100;
            const kept = [];
            const small = [];
            for (const row of workingRows) {
                ((row.values[0] || 0) / total < thresholdFrac ? small : kept).push(row);
            }
            if (small.length >= 2 && kept.length >= 1) {
                const smallSum = small.reduce((acc, row) => acc + (row.values[0] || 0), 0);
                kept.push({
                    id: "cat-other",
                    label: `Lainnya (${small.length})`,
                    colorIndex: rows.length,
                    values: [smallSum],
                    isGrouped: true,
                    groupedItems: small.map((s) => ({ label: s.label, value: s.values[0] || 0 }))
                });
                workingRows = kept;
            }
        }
    }

    if (sortOrder === "desc") {
        workingRows.sort((a, b) => getRowSortMetric(b) - getRowSortMetric(a));
    } else if (sortOrder === "asc") {
        workingRows.sort((a, b) => getRowSortMetric(a) - getRowSortMetric(b));
    }

    const ringTotals = new Array(seriesCount).fill(0);
    for (let r = 0; r < workingRows.length; r += 1) {
        for (let s = 0; s < seriesCount; s += 1) {
            ringTotals[s] += workingRows[r].values[s] || 0;
        }
    }
    return { labelHeader: dataset ? dataset.labelHeader : "Kategori", seriesNames, seriesCount, allRows: rows, activeRows: workingRows, ringTotals };
}

export function computePieStats(prepared, seriesIndex = 0) {
    if (!prepared || !prepared.activeRows || prepared.activeRows.length === 0) {
        return { total: 0, activeCount: 0, totalCategories: prepared?.allRows?.length || 0, maxSlice: null, minSlice: null, topSharePct: 0, hhi: 0 };
    }
    const idx = Math.min(seriesIndex, prepared.seriesCount - 1);
    const total = prepared.ringTotals[idx] || 0;
    let maxSlice = null;
    let minSlice = null;
    let hhi = 0;
    for (const row of prepared.activeRows) {
        const val = row.values[idx] || 0;
        if (val <= 0) {
            continue;
        }
        const pct = total > 0 ? (val / total) * 100 : 0;
        hhi += pct * pct;
        const item = { id: row.id, label: row.label, value: val, pct };
        if (!maxSlice || val > maxSlice.value) {
            maxSlice = item;
        }
        if (!minSlice || val < minSlice.value) {
            minSlice = item;
        }
    }
    return { total, activeCount: prepared.activeRows.length, totalCategories: prepared.allRows.length, maxSlice, minSlice, topSharePct: maxSlice ? maxSlice.pct : 0, hhi: Math.round(hhi) };
}

export function formatNumber(value, decimals = 2) {
    if (value === null || value === undefined || !Number.isFinite(value)) {
        return "-";
    }
    if (Math.abs(value) >= 100000) {
        return value.toLocaleString("id-ID", { maximumFractionDigits: 0 });
    }
    const abs = Math.abs(value);
    if (abs > 0 && abs < 0.01) {
        return value.toFixed(3);
    }
    return Number(value.toFixed(decimals)).toLocaleString("id-ID", { maximumFractionDigits: decimals });
}

export function exportPieCSV(dataset) {
    if (!dataset) {
        return "";
    }
    const esc = (v) => {
        const s = String(v ?? "");
        return s.includes(",") || s.includes("\"") ? `"${s.replace(/"/g, "\"\"")}"` : s;
    };
    const header = [dataset.labelHeader || "Kategori", ...dataset.seriesNames].map(esc).join(",");
    const lines = [header];
    for (let i = 0; i < dataset.rows.length; i += 1) {
        const row = dataset.rows[i];
        lines.push([row.label, ...row.values].map(esc).join(","));
    }
    return lines.join("\n");
}
