import { describe, it, expect } from "vitest";
import { parseLineData, sliceDatasetWindow, computeSeriesStats, exportLineCSV, formatNumber } from "../src/plot/linechart/parser.js";
import { calculateScale, buildRunSegments, buildSeriesRuns, calculateLineLayout, hitTestNearestX } from "../src/plot/linechart/geometry.js";
import { generateLineSVG } from "../src/plot/linechart/exporter.js";
import { LINE_PRESETS } from "../src/plot/linechart/presets.js";

function evalCubicY(seg, t) {
    const u = 1 - t;
    return u * u * u * seg.y0 + 3 * u * u * t * seg.cy1 + 3 * u * t * t * seg.cy2 + t * t * t * seg.y1;
}

describe("Line Chart Engine", () => {
    it("parses multi-series CSV with missing values and numeric X detection", () => {
        const raw = "Tahun,Seri A,Seri B\n2020,10,20\n2021,null,25\n2022,-,30\n2023,40,35";
        const parsed = parseLineData(raw);
        expect(parsed.rowCount).toBe(4);
        expect(parsed.isNumericX).toBe(true);
        expect(parsed.xValues).toEqual([2020, 2021, 2022, 2023]);
        expect(parsed.nullCount).toBe(2);
        expect(parsed.series[0].values).toEqual([10, null, null, 40]);
        expect(parsed.series[1].values).toEqual([20, 25, 30, 35]);
    });

    it("handles categorical X, TSV delimiter, and single-column fallback", () => {
        const cat = parseLineData("Hari\tKunjungan\nSenin\t120\nSelasa\t150");
        expect(cat.isNumericX).toBe(false);
        expect(cat.xLabels).toEqual(["Senin", "Selasa"]);
        expect(cat.xValues).toEqual([0, 1]);

        const single = parseLineData("12\n18\n24");
        expect(single.series.length).toBe(1);
        expect(single.xValues).toEqual([1, 2, 3]);
        expect(single.series[0].values).toEqual([12, 18, 24]);
    });

    it("slices dataset window cleanly and preserves full sample fidelity", () => {
        const full = parseLineData(LINE_PRESETS.telemetry.data);
        expect(full.rowCount).toBe(160);
        const sliced = sliceDatasetWindow(full, 25, 75);
        expect(sliced.rowCount).toBeLessThan(full.rowCount);
        expect(sliced.rowCount).toBeGreaterThan(70);
        expect(sliced.series[0].values.length).toBe(sliced.rowCount);
    });

    it("computes OLS linear regression, delta, mean, and stdDev accurately", () => {
        const stats = computeSeriesStats([5, 7, 9, 11], [0, 1, 2, 3]);
        expect(stats.count).toBe(4);
        expect(stats.min).toBe(5);
        expect(stats.max).toBe(11);
        expect(stats.mean).toBe(8);
        expect(stats.delta).toBe(6);
        expect(stats.regression).not.toBeNull();
        expect(stats.regression.slope).toBeCloseTo(2, 6);
        expect(stats.regression.intercept).toBeCloseTo(5, 6);
        expect(stats.regression.r2).toBeCloseTo(1, 6);
    });

    it("prevents overshoot in Fritsch-Carlson monotone cubic spline on plateaus and spikes", () => {
        const pts = [
            { x: 0, y: 100 },
            { x: 100, y: 0 },
            { x: 200, y: 0 },
            { x: 300, y: 100 },
            { x: 400, y: 10 },
            { x: 500, y: 95 }
        ];
        const segs = buildRunSegments(pts, "monotone");
        expect(segs.length).toBe(pts.length - 1);
        expect(segs.every((s) => s.type === "cubic")).toBe(true);
        for (let i = 0; i < segs.length; i += 1) {
            const seg = segs[i];
            const lo = Math.min(seg.y0, seg.y1);
            const hi = Math.max(seg.y0, seg.y1);
            for (let t = 0; t <= 1.0001; t += 0.05) {
                const y = evalCubicY(seg, Math.min(1, t));
                expect(y).toBeGreaterThanOrEqual(lo - 1e-6);
                expect(y).toBeLessThanOrEqual(hi + 1e-6);
            }
        }
    });

    it("splits runs cleanly on nulls unless connectNull is true and supports step mode", () => {
        const pts = [
            { x: 0, y: 10, value: 10 },
            { x: 50, y: 20, value: 20 },
            { x: 100, y: null, value: null },
            { x: 150, y: 30, value: 30 },
            { x: 200, y: 40, value: 40 }
        ];
        const split = buildSeriesRuns(pts, { mode: "step", connectNull: false });
        expect(split.length).toBe(2);
        expect(split[0].segments[0].type).toBe("step");

        const joined = buildSeriesRuns(pts, { mode: "linear", connectNull: true });
        expect(joined.length).toBe(1);
        expect(joined[0].points.length).toBe(4);
    });

    it("builds adaptive layout, fits negative-positive bounds, and hits nearest X crosshair", () => {
        const scaleFit = calculateScale({ min: -0.4, max: 1.6, beginAtZero: false });
        expect(scaleFit.niceMin).toBeLessThanOrEqual(-0.4);
        expect(scaleFit.niceMax).toBeGreaterThanOrEqual(1.6);

        const ds = parseLineData(LINE_PRESETS.climate.data);
        const layout = calculateLineLayout({ dataset: ds, width: 880, height: 480, beginAtZero: false });
        expect(layout.xCoords.length).toBe(ds.rowCount);
        const midIdx = Math.floor(ds.rowCount / 2);
        const hit = hitTestNearestX(layout.xCoords[midIdx] + 1, layout.plotBox.y + 40, layout);
        expect(hit).not.toBeNull();
        expect(hit.index).toBe(midIdx);
        expect(hitTestNearestX(0, 0, layout)).toBeNull();
    });

    it("exports clean vector SVG with path splines, gradients, and formatted CSV", () => {
        const ds = parseLineData(LINE_PRESETS.traffic.data);
        const statsBySeries = {};
        ds.series.forEach((s) => {
            statsBySeries[s.id] = computeSeriesStats(s.values, ds.xValues);
        });
        const layout = calculateLineLayout({ dataset: ds, width: 880, height: 480, beginAtZero: true });
        const svg = generateLineSVG({
            dataset: ds,
            layout,
            statsBySeries,
            options: { areaFill: true, showMean: true, showTrendline: true, showRegion: true, title: "Test & Chart" }
        });
        expect(svg.startsWith("<svg")).toBe(true);
        expect(svg).toContain("<linearGradient");
        expect(svg).toContain("Test &amp; Chart");
        expect(svg).toContain(" C ");
        expect(exportLineCSV(ds)).toContain("1 Mei,1420,860,310");
        expect(formatNumber(1250000)).toBe("1.25M");
    });
});
