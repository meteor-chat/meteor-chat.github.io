import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";

describe("Plot Route & Navigation", () => {
    it("verifies home page has Plot button", () => {
        const html = readFileSync("index.html", "utf8");
        expect(html).toContain('href="/plot"');
        expect(html).toContain('class="btn-home-nav">Plot</a>');
    });

    it("verifies plot.html and plot/index.html exist and contain uniform back button", () => {
        expect(existsSync("plot.html")).toBe(true);
        expect(existsSync("plot/index.html")).toBe(true);

        const plotHtml = readFileSync("plot.html", "utf8");
        expect(plotHtml).toContain('<h1 class="plot-title">Plot</h1>');
        expect(plotHtml).toContain('<img src="./assets/svg/back.svg" alt="Kembali" width="36" height="36">');
        expect(plotHtml).toContain('href="/"');
        expect(plotHtml).toContain("Word Cloud");
        expect(plotHtml).toContain("Bar Chart");
        expect(plotHtml).toContain("Line Chart");
        expect(plotHtml).toContain("Pie Chart");

        const plotDirHtml = readFileSync("plot/index.html", "utf8");
        expect(plotDirHtml).toContain('<base href="/">');
        expect(plotDirHtml).toContain('<img src="./assets/svg/back.svg" alt="Kembali" width="36" height="36">');
    });

    it("verifies 404.html contains redirection for /plot", () => {
        const notFoundHtml = readFileSync("404.html", "utf8");
        expect(notFoundHtml).toContain('p === "/plot"');
        expect(notFoundHtml).toContain('/plot.html');
    });

    it("verifies zero comments, no em-dashes, and max 300 lines limit", () => {
        const files = ["plot.html", "plot/index.html", "tests/plot-route.test.js"];
        const slashSlash = String.fromCharCode(47, 47);
        const slashStar = String.fromCharCode(47, 42);
        const htmlComment = String.fromCharCode(60, 33, 45, 45);
        files.forEach((file) => {
            const content = readFileSync(file, "utf8");
            expect(content.split("\n").length).toBeLessThanOrEqual(300);
            expect(content.includes(slashSlash)).toBe(false);
            expect(content.includes(slashStar)).toBe(false);
            expect(content.includes(htmlComment)).toBe(false);
            expect(content.includes("\u2014")).toBe(false);
        });
    });
});
