const MISSING_TOKENS = new Set(["", "null", "nan", "na", "n/a", "none", "-"]);

function createEmptyDataset() {
    return { xLabel: "X", xLabels: [], xValues: [], isNumericX: false, series: [], rowCount: 0, nullCount: 0 };
}

function detectDelimiter(firstLine) {
    const counts = { "\t": 0, ";": 0, ",": 0 };
    let inQuotes = false;
    for (let i = 0; i < firstLine.length; i += 1) {
        const ch = firstLine[i];
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
    return firstLine.includes(":") ? ":" : ",";
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

function isStrictNumericToken(raw) {
    if (raw === null || raw === undefined) {
        return false;
    }
    const text = String(raw).trim();
    return Boolean(text) && Number.isFinite(Number(text.replace(/\s+/g, "")));
}

export function parseNullableNumber(raw) {
    if (raw === null || raw === undefined) {
        return null;
    }
    const text = String(raw).trim();
    if (MISSING_TOKENS.has(text.toLowerCase())) {
        return null;
    }
    const num = Number(text.replace(/\s+/g, ""));
    return Number.isFinite(num) ? num : null;
}

function isHeaderRow(row, hasMultipleRows) {
    if (!hasMultipleRows || row.length === 0) {
        return false;
    }
    if (row.length === 1) {
        return !isStrictNumericToken(row[0]);
    }
    for (let c = 1; c < row.length; c += 1) {
        const cell = row[c].trim();
        if (!MISSING_TOKENS.has(cell.toLowerCase()) && !isStrictNumericToken(cell)) {
            return true;
        }
    }
    return !isStrictNumericToken(row[0]);
}

function isMonotonicIncreasing(nums) {
    if (nums.length < 2) {
        return false;
    }
    for (let i = 1; i < nums.length; i += 1) {
        if (nums[i] <= nums[i - 1]) {
            return false;
        }
    }
    return true;
}

export function parseLineData(rawText) {
    if (typeof rawText !== "string" || !rawText.trim()) {
        return createEmptyDataset();
    }
    const rawLines = rawText.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);
    if (rawLines.length === 0) {
        return createEmptyDataset();
    }
    const delimiter = detectDelimiter(rawLines[0]);
    const rows = rawLines.map((line) => splitDelimitedLine(line, delimiter));
    const singleColumnMode = rows.every((r) => r.length === 1);
    const hasHeader = isHeaderRow(rows[0], rows.length > 1);
    const dataRows = hasHeader ? rows.slice(1) : rows;
    if (singleColumnMode) {
        const seriesName = hasHeader && rows[0][0] ? rows[0][0] : "Nilai";
        const xLabels = dataRows.map((_, i) => String(i + 1));
        const xValues = dataRows.map((_, i) => i + 1);
        const values = dataRows.map((r) => parseNullableNumber(r[0]));
        const nullCount = values.filter((v) => v === null).length;
        return { xLabel: "Indeks", xLabels, xValues, isNumericX: true, series: [{ id: "series-0", name: seriesName, values }], rowCount: values.length, nullCount };
    }
    let maxCols = 2;
    for (let r = 0; r < rows.length; r += 1) {
        if (rows[r].length > maxCols) {
            maxCols = rows[r].length;
        }
    }
    const xLabel = hasHeader && rows[0][0] ? rows[0][0] : "X";
    const seriesNames = [];
    for (let c = 1; c < maxCols; c += 1) {
        seriesNames.push(hasHeader && rows[0][c] ? rows[0][c] : `Seri ${c}`);
    }
    const xLabels = [];
    const parsedNumericX = [];
    let allXNumeric = true;
    const seriesValues = seriesNames.map(() => []);
    let nullCount = 0;
    for (let r = 0; r < dataRows.length; r += 1) {
        const row = dataRows[r];
        const xRaw = row[0] !== undefined ? row[0] : String(r + 1);
        xLabels.push(xRaw || String(r + 1));
        if (isStrictNumericToken(xRaw)) {
            parsedNumericX.push(Number(xRaw.replace(/\s+/g, "")));
        } else {
            allXNumeric = false;
        }
        for (let s = 0; s < seriesNames.length; s += 1) {
            const val = parseNullableNumber(row[s + 1]);
            seriesValues[s].push(val);
            if (val === null) {
                nullCount += 1;
            }
        }
    }
    const useNumericX = allXNumeric && isMonotonicIncreasing(parsedNumericX);
    const xValues = useNumericX ? parsedNumericX : xLabels.map((_, i) => i);
    const series = seriesNames.map((name, idx) => ({ id: `series-${idx}`, name, values: seriesValues[idx] }));
    return { xLabel, xLabels, xValues, isNumericX: useNumericX, series, rowCount: xLabels.length, nullCount };
}

export function sliceDatasetWindow(dataset, startPct = 0, endPct = 100) {
    const n = dataset.rowCount;
    if (n === 0) {
        return { ...dataset, startIndex: 0, endIndex: -1 };
    }
    const lo = Math.max(0, Math.min(100, startPct));
    const hi = Math.max(lo, Math.min(100, endPct));
    let startIndex = Math.floor((lo / 100) * (n - 1));
    let endIndex = Math.ceil((hi / 100) * (n - 1));
    if (n >= 2 && endIndex - startIndex < 1) {
        if (startIndex >= n - 1) {
            startIndex = n - 2;
            endIndex = n - 1;
        } else {
            endIndex = startIndex + 1;
        }
    }
    const xLabels = dataset.xLabels.slice(startIndex, endIndex + 1);
    const xValues = dataset.xValues.slice(startIndex, endIndex + 1);
    let nullCount = 0;
    const series = dataset.series.map((s) => {
        const sliced = s.values.slice(startIndex, endIndex + 1);
        for (let i = 0; i < sliced.length; i += 1) {
            if (sliced[i] === null) {
                nullCount += 1;
            }
        }
        return { ...s, values: sliced };
    });
    return { ...dataset, xLabels, xValues, series, rowCount: xLabels.length, nullCount, startIndex, endIndex };
}

export function computeSeriesStats(values, xValues = []) {
    const points = [];
    for (let i = 0; i < values.length; i += 1) {
        const y = values[i];
        if (y !== null && Number.isFinite(y)) {
            points.push({ index: i, x: Number.isFinite(xValues[i]) ? xValues[i] : i, y });
        }
    }
    const count = points.length;
    const missingCount = values.length - count;
    if (count === 0) {
        return { count: 0, missingCount, min: null, max: null, minIndex: -1, maxIndex: -1, mean: null, stdDev: null, first: null, last: null, delta: null, pctChange: null, regression: null };
    }
    let min = points[0].y;
    let max = points[0].y;
    let minIndex = points[0].index;
    let maxIndex = points[0].index;
    let sumY = 0;
    let sumX = 0;
    for (let i = 0; i < count; i += 1) {
        const pt = points[i];
        sumY += pt.y;
        sumX += pt.x;
        if (pt.y < min) {
            min = pt.y;
            minIndex = pt.index;
        }
        if (pt.y > max) {
            max = pt.y;
            maxIndex = pt.index;
        }
    }
    const mean = sumY / count;
    const meanX = sumX / count;
    let sxx = 0;
    let syy = 0;
    let sxy = 0;
    for (let i = 0; i < count; i += 1) {
        const dx = points[i].x - meanX;
        const dy = points[i].y - mean;
        sxx += dx * dx;
        syy += dy * dy;
        sxy += dx * dy;
    }
    const stdDev = Math.sqrt(syy / count);
    const first = points[0].y;
    const last = points[count - 1].y;
    const delta = last - first;
    const pctChange = first !== 0 ? (delta / Math.abs(first)) * 100 : null;
    let regression = null;
    if (count >= 2 && sxx > 0) {
        const slope = sxy / sxx;
        const intercept = mean - slope * meanX;
        const r2 = syy > 0 ? Math.min(1, Math.max(0, (sxy * sxy) / (sxx * syy))) : 1;
        regression = { slope, intercept, r2 };
    }
    return { count, missingCount, min, max, minIndex, maxIndex, mean, stdDev, first, last, delta, pctChange, regression };
}

export function formatNumber(val, decimals = 2) {
    if (val === null || val === undefined || !Number.isFinite(val)) {
        return "-";
    }
    if (Math.abs(val) >= 1e6) {
        return `${(val / 1e6).toFixed(2)}M`;
    }
    if (Math.abs(val) >= 1e4) {
        return Math.round(val).toLocaleString("en-US");
    }
    if (Number.isInteger(val)) {
        return val.toLocaleString("en-US");
    }
    const factor = 10 ** decimals;
    return String(Math.round(val * factor) / factor);
}

export function exportLineCSV(dataset) {
    const header = [dataset.xLabel || "X", ...dataset.series.map((s) => s.name)].join(",");
    const rows = [header];
    for (let i = 0; i < dataset.rowCount; i += 1) {
        const cols = [dataset.xLabels[i]];
        for (let s = 0; s < dataset.series.length; s += 1) {
            const v = dataset.series[s].values[i];
            cols.push(v === null ? "null" : String(v));
        }
        rows.push(cols.join(","));
    }
    return rows.join("\n");
}
