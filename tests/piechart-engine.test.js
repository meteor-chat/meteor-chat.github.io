import { describe, it, expect } from "vitest";
import { parsePieData, preparePieData, computePieStats, exportPieCSV } from "../src/plot/piechart/parser.js";
import { PIE_PRESETS, TRIPAL_PICK_ORDER, getSliceColor } from "../src/plot/piechart/presets.js";
import { calculatePieLayout, describeWedgePath, hitTestPie } from "../src/plot/piechart/geometry.js";
import { generatePieSVG } from "../src/plot/piechart/exporter.js";

describe("Pie Chart Engine", () => {
    it("parses single-series CSV, excludes non-positive rows, and aggregates duplicates", () => {
        const raw = [
            "Kategori, Nilai",
            "Alpha, 50%",
            "Beta, 30",
            "Alpha, 20",
            "Nol, 0",
            "Negatif, -15",
            "Kosong, -"
        ].join("\n");
        const ds = parsePieData(raw);
        expect(ds.seriesNames).toEqual(["Nilai"]);
        expect(ds.rows.length).toBe(2);
        expect(ds.excludedCount).toBe(3);
        expect(ds.rows[0].label).toBe("Alpha");
        expect(ds.rows[0].values).toEqual([70]);
        expect(ds.rows[1].label).toBe("Beta");
        expect(ds.rows[1].values).toEqual([30]);
    });

    it("renormalizes shares on hide, groups long-tail slices, and computes HHI", () => {
        const ds = parsePieData(PIE_PRESETS.market.data);
        const grouped = preparePieData(ds, { sortOrder: "desc", groupSmall: true, smallThresholdPct: 3 });
        const otherRow = grouped.activeRows.find((r) => r.isGrouped);
        expect(otherRow).toBeTruthy();
        expect(otherRow.groupedItems.length).toBeGreaterThanOrEqual(2);

        const hidden = new Set([ds.rows[0].id]);
        const filtered = preparePieData(ds, { hiddenCategories: hidden, sortOrder: "desc", groupSmall: false });
        const stats = computePieStats(filtered);
        const totalAll = ds.rows.reduce((acc, r) => acc + r.values[0], 0);
        expect(stats.total).toBe(totalAll - ds.rows[0].values[0]);
        expect(stats.hhi).toBeGreaterThan(0);
        expect(stats.hhi).toBeLessThanOrEqual(10000);
        expect(exportPieCSV(ds)).toContain("Chromium Desktop,4820");
    });

    it("applies Tripal contrast permutation order and neutral color for grouped Other slice", () => {
        expect(TRIPAL_PICK_ORDER).toEqual([3, 6, 1, 4, 5, 8, 2, 7, 0]);
        const c0 = getSliceColor("tripal", 0, { contrastOrder: true });
        const c1 = getSliceColor("tripal", 1, { contrastOrder: true });
        expect(c0).not.toBe(c1);
        expect(getSliceColor("okabe_ito", 4, { isGrouped: true })).toBe("#64748b");
    });

    it("supports unified pie, donut, multi-series concentric rings, polar area, and SVG arcs", () => {
        const dsMulti = parsePieData(PIE_PRESETS.cohort.data);
        const prepMulti = preparePieData(dsMulti, { sortOrder: "desc" });
        const multiLayout = calculatePieLayout({ prepared: prepMulti, mode: "multi", width: 820, height: 500, cutoutPct: 34 });
        expect(multiLayout.ringCount).toBe(3);
        expect(multiLayout.rings[0].outerR).toBeLessThan(multiLayout.rings[1].innerR);
        expect(multiLayout.rings[1].outerR).toBeLessThan(multiLayout.rings[2].innerR);

        const midR0 = (multiLayout.rings[0].innerR + multiLayout.rings[0].outerR) / 2;
        const innerHit = hitTestPie(multiLayout.cx + midR0, multiLayout.cy, multiLayout);
        expect(innerHit).toBeTruthy();
        expect(innerHit.seriesIndex).toBe(0);
        const holeHit = hitTestPie(multiLayout.cx, multiLayout.cy, multiLayout);
        expect(holeHit).toBeNull();

        const dsPolar = parsePieData(PIE_PRESETS.radar.data);
        const prepPolar = preparePieData(dsPolar, { sortOrder: "input" });
        const polarLayout = calculatePieLayout({ prepared: prepPolar, mode: "polar", width: 820, height: 500, cutoutPct: 16 });
        expect(polarLayout.polarTicks.length).toBe(4);
        const spans = polarLayout.rings[0].slices.map((s) => s.spanAngle);
        expect(Math.max(...spans) - Math.min(...spans)).toBeLessThan(1e-6);

        const singleArc = describeWedgePath(200, 200, 40, 100, -Math.PI / 2, (3 * Math.PI) / 2);
        expect(singleArc).toContain("A 100.00 100.00");
        expect(singleArc).toContain("A 40.00 40.00");

        const stats = computePieStats(prepMulti, 2);
        const svg = generatePieSVG({ prepared: prepMulti, layout: multiLayout, stats, options: { palette: "tripal", title: "Cohort" } });
        expect(svg).toContain("<svg");
        expect(svg).toContain("<path");
        expect(svg).toContain("Cohort");
    });

    it("prevents vertical collisions on clustered external labels", () => {
        const dense = Array.from({ length: 12 }, (_, idx) => `Item ${idx}, ${10 + idx}`).join("\n");
        const ds = parsePieData(`Nama, Skor\n${dense}`);
        const prepared = preparePieData(ds, { sortOrder: "asc" });
        const layout = calculatePieLayout({
            prepared,
            mode: "donut",
            width: 820,
            height: 480,
            cutoutPct: 68,
            labelMode: "outside",
            labelThresholdPct: 1
        });
        const leftLabels = layout.rings[0].slices.filter((s) => s.showLabel && s.side === "left").sort((a, b) => a.labelY - b.labelY);
        const rightLabels = layout.rings[0].slices.filter((s) => s.showLabel && s.side === "right").sort((a, b) => a.labelY - b.labelY);
        for (let i = 1; i < leftLabels.length; i += 1) {
            expect(leftLabels[i].labelY - leftLabels[i - 1].labelY).toBeGreaterThanOrEqual(18);
        }
        for (let i = 1; i < rightLabels.length; i += 1) {
            expect(rightLabels[i].labelY - rightLabels[i - 1].labelY).toBeGreaterThanOrEqual(18);
        }
    });
});
