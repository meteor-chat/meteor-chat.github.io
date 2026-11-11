import { describe, it, expect } from "vitest";
import { parseBarData, computeDatasetStats, sortBarData, formatNumber, exportToCSV } from "../src/plot/barchart/parser.js";
import { calculateScale, calculateBarLayout, hitTestBar } from "../src/plot/barchart/geometry.js";
import { PALETTES, getBarColor, generateBarSVG } from "../src/plot/barchart/renderer.js";
import { PRESETS, getPresetData } from "../src/plot/barchart/presets.js";

describe("Bar Chart Data Parser and Statistics", () => {
    it("parses colon, comma, and space separated key-value pairs including negatives", () => {
        const text = "Alpha: 150\nBeta, -45.5\nGamma 200\nDelta: 0";
        const items = parseBarData(text);
        expect(items.length).toBe(4);
        expect(items[0]).toEqual({ category: "Alpha", value: 150 });
        expect(items[1]).toEqual({ category: "Beta", value: -45.5 });
        expect(items[2]).toEqual({ category: "Gamma", value: 200 });
        expect(items[3]).toEqual({ category: "Delta", value: 0 });
    });

    it("handles empty lines and invalid inputs gracefully", () => {
        expect(parseBarData("")).toEqual([]);
        expect(parseBarData(null)).toEqual([]);
        const messy = "\n\n   \nItem Without Value\nValid: 42\n";
        const items = parseBarData(messy);
        expect(items.length).toBe(2);
        expect(items[0]).toEqual({ category: "Item Without Value", value: 0 });
        expect(items[1]).toEqual({ category: "Valid", value: 42 });
    });

    it("computes accurate descriptive statistics", () => {
        const items = [
            { category: "A", value: 10 },
            { category: "B", value: 20 },
            { category: "C", value: 30 }
        ];
        const stats = computeDatasetStats(items);
        expect(stats.count).toBe(3);
        expect(stats.sum).toBe(60);
        expect(stats.mean).toBe(20);
        expect(stats.min).toBe(10);
        expect(stats.max).toBe(30);
        expect(stats.variance).toBe(100);
        expect(stats.stdDev).toBe(10);
        expect(stats.hasNegative).toBe(false);
    });

    it("detects negative numbers in statistics and handles empty data", () => {
        const emptyStats = computeDatasetStats([]);
        expect(emptyStats.count).toBe(0);
        expect(emptyStats.mean).toBe(0);

        const mixed = [
            { category: "Profit", value: 100 },
            { category: "Loss", value: -50 }
        ];
        const stats = computeDatasetStats(mixed);
        expect(stats.hasNegative).toBe(true);
        expect(stats.min).toBe(-50);
        expect(stats.max).toBe(100);
        expect(stats.mean).toBe(25);
    });

    it("sorts data by value and category alphabetically", () => {
        const items = [
            { category: "Charlie", value: 30 },
            { category: "Alice", value: 10 },
            { category: "Bob", value: 20 }
        ];
        const desc = sortBarData(items, "desc");
        expect(desc[0].category).toBe("Charlie");
        expect(desc[2].category).toBe("Alice");

        const asc = sortBarData(items, "asc");
        expect(asc[0].category).toBe("Alice");
        expect(asc[2].category).toBe("Charlie");

        const alphaAsc = sortBarData(items, "alpha-asc");
        expect(alphaAsc[0].category).toBe("Alice");
        expect(alphaAsc[1].category).toBe("Bob");
        expect(alphaAsc[2].category).toBe("Charlie");
    });

    it("formats numbers and exports valid CSV", () => {
        expect(formatNumber(1500000)).toBe("1.5M");
        expect(formatNumber(2400)).toBe("2.4k");
        expect(formatNumber(42)).toBe("42");

        const items = [
            { category: "Tech, Inc.", value: 120 },
            { category: "Retail", value: 80 }
        ];
        const csv = exportToCSV(items);
        expect(csv).toContain('"Tech, Inc.",120');
        expect(csv).toContain("Retail,80");
    });
});

describe("Bar Chart Geometry and Scale System", () => {
    it("computes nice scales beginning at zero for positive sets", () => {
        const scale = calculateScale({ min: 12, max: 88, beginAtZero: true, targetTickCount: 5 });
        expect(scale.niceMin).toBe(0);
        expect(scale.niceMax).toBeGreaterThanOrEqual(88);
        expect(scale.ticks.length).toBeGreaterThan(1);
        expect(scale.ticks[0]).toBe(0);
    });

    it("computes nice scales spanning negative and positive values", () => {
        const scale = calculateScale({ min: -40, max: 60, beginAtZero: true, targetTickCount: 5 });
        expect(scale.niceMin).toBeLessThanOrEqual(-40);
        expect(scale.niceMax).toBeGreaterThanOrEqual(60);
        expect(scale.ticks).toContain(0);
    });

    it("calculates vertical bar layout accurately with zero baseline", () => {
        const items = [
            { category: "Positive", value: 50 },
            { category: "Negative", value: -25 }
        ];
        const layout = calculateBarLayout({
            items,
            width: 800,
            height: 500,
            orientation: "vertical",
            clusterRatio: 0.7
        });
        expect(layout.orientation).toBe("vertical");
        expect(layout.bars.length).toBe(2);
        const posBar = layout.bars[0];
        const negBar = layout.bars[1];
        expect(posBar.isNegative).toBe(false);
        expect(negBar.isNegative).toBe(true);
        expect(posBar.y + posBar.height).toBeCloseTo(layout.zeroPos, 1);
        expect(negBar.y).toBeCloseTo(layout.zeroPos, 1);
    });

    it("calculates horizontal bar layout accurately with zero baseline", () => {
        const items = [
            { category: "Positive", value: 80 },
            { category: "Negative", value: -40 }
        ];
        const layout = calculateBarLayout({
            items,
            width: 800,
            height: 500,
            orientation: "horizontal",
            clusterRatio: 0.6
        });
        expect(layout.orientation).toBe("horizontal");
        expect(layout.bars.length).toBe(2);
        const posBar = layout.bars[0];
        const negBar = layout.bars[1];
        expect(posBar.isNegative).toBe(false);
        expect(negBar.isNegative).toBe(true);
        expect(posBar.x).toBeCloseTo(layout.zeroPos, 1);
        expect(negBar.x + negBar.width).toBeCloseTo(layout.zeroPos, 1);
    });

    it("performs hit testing on computed bars", () => {
        const items = [{ category: "A", value: 100 }];
        const layout = calculateBarLayout({ items, width: 800, height: 500 });
        const b = layout.bars[0];
        const hit = hitTestBar(b.x + b.width / 2, b.y + b.height / 2, layout.bars);
        expect(hit).not.toBeNull();
        expect(hit.category).toBe("A");

        const miss = hitTestBar(0, 0, layout.bars);
        expect(miss).toBeNull();
    });
});

describe("Bar Chart Renderer and SVG Generation", () => {
    it("provides scientific color palettes and assigns negative color correctly", () => {
        expect(PALETTES.okabe_ito.length).toBe(7);
        const posColor = getBarColor(0, false, "okabe_ito", true);
        const negColor = getBarColor(0, true, "okabe_ito", true);
        expect(posColor).toBe(PALETTES.okabe_ito[0]);
        expect(negColor).toBe("#ef4444");

        const negColorPreserved = getBarColor(0, true, "okabe_ito", false);
        expect(negColorPreserved).toBe(PALETTES.okabe_ito[0]);
    });

    it("generates vector SVG string with axes, bars, and reference lines", () => {
        const items = [
            { category: "Alpha", value: 100 },
            { category: "Beta", value: -50 }
        ];
        const stats = computeDatasetStats(items);
        const layout = calculateBarLayout({ items, width: 800, height: 500, orientation: "vertical" });
        const svg = generateBarSVG({
            width: 800,
            height: 500,
            layout,
            stats,
            options: { showValues: true, showAverage: true, palette: "cyan" }
        });

        expect(svg).toContain("<svg");
        expect(svg).toContain("</svg>");
        expect(svg).toContain("<rect");
        expect(svg).toContain("<line");
        expect(svg).toContain("Alpha");
        expect(svg).toContain("Beta");
        expect(svg).toContain("Avg:");
    });

    it("loads presets properly", () => {
        expect(PRESETS.benchmark).toContain("Apple M3 Max");
        expect(PRESETS.finance).toContain("Q1 2023");
        expect(PRESETS.languages).toContain("Python");
        expect(getPresetData("unknown")).toBe(PRESETS.benchmark);
    });
});
