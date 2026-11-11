import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";

describe("Bar Chart Page and Routing", () => {
    it("verifies barchart HTML entrypoints exist and have uniform back buttons", () => {
        expect(existsSync("plot/bar.html")).toBe(true);
        expect(existsSync("plot/bar/index.html")).toBe(true);

        const html = readFileSync("plot/bar.html", "utf8");
        expect(html).toContain('<h1 class="bar-header-title">Bar Chart Studio</h1>');
        expect(html).toContain('<img src="./assets/svg/back.svg" alt="Kembali" width="36" height="36">');
        expect(html).toContain('href="/plot"');
        expect(html).toContain('id="bar-canvas"');
        expect(html).toContain('id="bar-input-text"');
        expect(html).toContain('id="bar-opt-orientation"');
        expect(html).toContain('id="bar-btn-export-png"');
        expect(html).toContain('id="bar-btn-export-svg"');
        expect(html).toContain('id="bar-btn-export-csv"');

        const folderHtml = readFileSync("plot/bar/index.html", "utf8");
        expect(folderHtml).toContain('<base href="/">');
        expect(folderHtml).toContain('<img src="./assets/svg/back.svg" alt="Kembali" width="36" height="36">');
    });

    it("verifies 404.html contains routing for /plot/bar", () => {
        const notFoundHtml = readFileSync("404.html", "utf8");
        expect(notFoundHtml).toContain('p === "/plot/bar"');
        expect(notFoundHtml).toContain("/plot/bar.html");
    });

    it("verifies barchart styles exist and adhere to constraints", () => {
        expect(existsSync("styles/barchart.css")).toBe(true);
        const css = readFileSync("styles/barchart.css", "utf8");
        expect(css.split("\n").length).toBeLessThanOrEqual(300);
        expect(css.includes(String.fromCharCode(47, 47))).toBe(false);
        expect(css.includes(String.fromCharCode(47, 42))).toBe(false);
        expect(css.includes("\u2014")).toBe(false);
    });

    it("verifies zero comments, no em-dashes, and line limits across all barchart source files", () => {
        const files = [
            "src/plot/barchart/parser.js",
            "src/plot/barchart/geometry.js",
            "src/plot/barchart/renderer.js",
            "src/plot/barchart/presets.js",
            "src/plot/barchart/barchart-app.js",
            "plot/bar.html",
            "plot/bar/index.html",
            "tests/barchart-engine.test.js",
            "tests/barchart-dom.test.js"
        ];

        const slashSlash = String.fromCharCode(47, 47);
        const slashStar = String.fromCharCode(47, 42);
        const htmlComment = String.fromCharCode(60, 33, 45, 45);

        files.forEach((file) => {
            expect(existsSync(file)).toBe(true);
            const content = readFileSync(file, "utf8");
            expect(content.split("\n").length).toBeLessThanOrEqual(300);

            const lines = content.split("\n");
            for (let i = 0; i < lines.length; i++) {
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
