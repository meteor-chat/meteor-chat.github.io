import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync, existsSync } from "fs";
import { createLineChartApp } from "../src/plot/linechart/linechart-app.js";

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
        bezierCurveTo: noop,
        quadraticCurveTo: noop,
        arc: noop,
        rect: noop,
        clip: noop,
        fill: noop,
        stroke: noop,
        translate: noop,
        rotate: noop,
        setTransform: noop,
        setLineDash: noop,
        fillText: noop,
        measureText: (txt) => ({ width: String(txt || "").length * 7 }),
        createLinearGradient: () => ({ addColorStop: noop })
    };
}

describe("Line Chart Studio Page and DOM", () => {
    beforeEach(() => {
        document.documentElement.innerHTML = readFileSync("plot/line.html", "utf8");
        const canvas = document.getElementById("line-canvas");
        canvas.getContext = () => createMockCtx();
        canvas.toDataURL = () => "data:image/png;base64,test";
    });

    it("verifies linechart HTML entrypoints and uniform back button", () => {
        expect(existsSync("plot/line.html")).toBe(true);
        expect(existsSync("plot/line/index.html")).toBe(true);
        const html = readFileSync("plot/line.html", "utf8");
        expect(html).toContain('<h1 class="line-header-title">Line Chart Studio</h1>');
        expect(html).toContain('<img src="./assets/svg/back.svg" alt="Kembali" width="36" height="36">');
        expect(html).toContain('href="/plot"');
        expect(html).toContain('id="line-canvas"');
        expect(html).toContain('id="line-legend-bar"');

        const folderHtml = readFileSync("plot/line/index.html", "utf8");
        expect(folderHtml).toContain('<base href="/">');
        expect(folderHtml).toContain('<img src="./assets/svg/back.svg" alt="Kembali" width="36" height="36">');

        const notFoundHtml = readFileSync("404.html", "utf8");
        expect(notFoundHtml).toContain('p === "/plot/line"');
        expect(notFoundHtml).toContain("/plot/line.html");
    });

    it("initializes studio app, populates stats/legend, switches presets and toggles series", () => {
        const app = createLineChartApp();
        app.init();
        expect(document.getElementById("line-stat-points").textContent).toContain("17");
        const pills = document.querySelectorAll("#line-legend-bar .line-legend-pill");
        expect(pills.length).toBe(3);

        pills[0].click();
        expect(app.getState().hiddenSeries.has("series-0")).toBe(true);

        document.getElementById("line-preset-telemetry").click();
        expect(app.getState().windowDataset.rowCount).toBe(160);
        expect(document.getElementById("line-stat-points").textContent).toContain("160");

        const rs = document.getElementById("line-opt-range-start");
        rs.value = "50";
        rs.dispatchEvent(new Event("input"));
        expect(app.getState().windowDataset.rowCount).toBeLessThan(100);
    });

    it("verifies zero comments, no em-dashes, and 300-line ceiling across all files", () => {
        const files = [
            "src/plot/linechart/presets.js",
            "src/plot/linechart/parser.js",
            "src/plot/linechart/geometry.js",
            "src/plot/linechart/exporter.js",
            "src/plot/linechart/renderer.js",
            "src/plot/linechart/linechart-ui.js",
            "src/plot/linechart/linechart-app.js",
            "styles/linechart.css",
            "plot/line.html",
            "plot/line/index.html",
            "tests/linechart-engine.test.js",
            "tests/linechart-dom.test.js"
        ];
        const slashSlash = String.fromCharCode(47, 47);
        const slashStar = String.fromCharCode(47, 42);
        const htmlComment = String.fromCharCode(60, 33, 45, 45);
        files.forEach((file) => {
            expect(existsSync(file)).toBe(true);
            const content = readFileSync(file, "utf8");
            expect(content.split("\n").length).toBeLessThanOrEqual(300);
            const lines = content.split("\n");
            for (let i = 0; i < lines.length; i += 1) {
                const line = lines[i].trim();
                if (line.includes(slashSlash)) {
                    const withoutUrl = line.replace(/https?:\/\/[^\s"]+/g, "");
                    expect(withoutUrl.includes(slashSlash)).toBe(false);
                }
            }
            expect(content.includes(slashStar)).toBe(false);
            expect(content.includes(htmlComment)).toBe(false);
            expect(content.includes("\u2014")).toBe(false);
        });
    });
});
