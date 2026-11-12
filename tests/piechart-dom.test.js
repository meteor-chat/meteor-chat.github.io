import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync, existsSync } from "fs";
import { createPieChartApp } from "../src/plot/piechart/piechart-app.js";

function createMockCtx() {
    const noop = () => {};
    return {
        save: noop,
        restore: noop,
        clearRect: noop,
        fillRect: noop,
        beginPath: noop,
        closePath: noop,
        moveTo: noop,
        lineTo: noop,
        quadraticCurveTo: noop,
        arc: noop,
        fill: noop,
        stroke: noop,
        strokeText: noop,
        setTransform: noop,
        setLineDash: noop,
        fillText: noop,
        measureText: (txt) => ({ width: String(txt || "").length * 7 })
    };
}

describe("Pie Chart Studio Page and DOM", () => {
    beforeEach(() => {
        document.documentElement.innerHTML = readFileSync("plot/pie.html", "utf8");
        const canvas = document.getElementById("pie-canvas");
        canvas.getContext = () => createMockCtx();
        canvas.toDataURL = () => "data:image/png;base64,test";
    });

    it("verifies piechart HTML entrypoints, /plot card, 404 route, and uniform back button", () => {
        expect(existsSync("plot/pie.html")).toBe(true);
        expect(existsSync("plot/pie/index.html")).toBe(true);
        const html = readFileSync("plot/pie.html", "utf8");
        expect(html).toContain('<h1 class="pie-header-title">Pie Chart Studio</h1>');
        expect(html).toContain('<img src="./assets/svg/back.svg" alt="Kembali" width="36" height="36">');
        expect(html).toContain('href="/plot"');
        expect(html).toContain('id="pie-canvas"');
        expect(html).toContain('id="pie-legend-bar"');

        const folderHtml = readFileSync("plot/pie/index.html", "utf8");
        expect(folderHtml).toContain('<base href="/">');
        expect(folderHtml).toContain('<img src="./assets/svg/back.svg" alt="Kembali" width="36" height="36">');

        const plotHubHtml = readFileSync("plot.html", "utf8");
        expect(plotHubHtml).toContain('href="/plot/pie"');
        expect(plotHubHtml).toContain("Pie Chart");

        const notFoundHtml = readFileSync("404.html", "utf8");
        expect(notFoundHtml).toContain('p === "/plot/pie"');
        expect(notFoundHtml).toContain("/plot/pie.html");
    });

    it("initializes studio app, renormalizes on legend click, and switches presets/modes", () => {
        const app = createPieChartApp();
        app.init();
        expect(document.getElementById("pie-stat-slices").textContent).toBe("6 / 6");
        expect(document.getElementById("pie-stat-dominant").textContent).toBe("Riset & AI");

        const pills = document.querySelectorAll("#pie-legend-bar .pie-legend-pill");
        expect(pills.length).toBe(6);
        const firstPctBefore = parseFloat(pills[1].querySelector(".pie-legend-pct").textContent);

        pills[0].click();
        expect(app.getState().hiddenCategories.has("cat-0")).toBe(true);
        expect(document.getElementById("pie-stat-slices").textContent).toBe("5 / 6");
        const updatedPills = document.querySelectorAll("#pie-legend-bar .pie-legend-pill");
        const secondPctAfter = parseFloat(updatedPills[1].querySelector(".pie-legend-pct").textContent);
        expect(secondPctAfter).toBeGreaterThan(firstPctBefore);

        document.getElementById("pie-preset-market").click();
        expect(app.getState().groupSmall).toBe(true);
        expect(app.getState().prepared.activeRows.some((r) => r.isGrouped)).toBe(true);

        document.getElementById("pie-preset-cohort").click();
        expect(app.getState().mode).toBe("multi");
        expect(app.getState().layout.ringCount).toBe(3);

        document.getElementById("pie-preset-radar").click();
        expect(app.getState().mode).toBe("polar");
        expect(app.getState().layout.polarTicks.length).toBe(4);
    });

    it("verifies zero comments, no em-dashes, and 300-line ceiling across all piechart files", () => {
        const files = [
            "src/plot/piechart/presets.js",
            "src/plot/piechart/parser.js",
            "src/plot/piechart/geometry.js",
            "src/plot/piechart/exporter.js",
            "src/plot/piechart/renderer.js",
            "src/plot/piechart/piechart-ui.js",
            "src/plot/piechart/piechart-app.js",
            "styles/piechart.css",
            "plot/pie.html",
            "plot/pie/index.html",
            "tests/piechart-engine.test.js",
            "tests/piechart-dom.test.js"
        ];
        const slashSlash = String.fromCharCode(47, 47);
        const slashStar = String.fromCharCode(47, 42);
        const htmlComment = String.fromCharCode(60, 33, 45, 45);
        files.forEach((file) => {
            expect(existsSync(file)).toBe(true);
            const content = readFileSync(file, "utf8");
            expect(content.split("\n").length).toBeLessThanOrEqual(300);
            expect(content.includes(slashSlash)).toBe(false);
            expect(content.includes(slashStar)).toBe(false);
            expect(content.includes(htmlComment)).toBe(false);
            expect(content.includes("\u2014")).toBe(false);
        });
    });
});
