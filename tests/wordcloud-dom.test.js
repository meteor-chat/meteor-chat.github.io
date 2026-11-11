import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";

describe("Word Cloud Page and Routing", () => {
    it("verifies wordcloud HTML entrypoints exist and have uniform back buttons", () => {
        expect(existsSync("plot/wordcloud.html")).toBe(true);
        expect(existsSync("plot/wordcloud/index.html")).toBe(true);

        const html = readFileSync("plot/wordcloud.html", "utf8");
        expect(html).toContain('<h1 class="wc-header-title">Word Cloud Studio</h1>');
        expect(html).toContain('<img src="./assets/svg/back.svg" alt="Kembali" width="36" height="36">');
        expect(html).toContain('href="/plot"');
        expect(html).toContain('id="wc-canvas"');
        expect(html).toContain('id="wc-input-text"');
        expect(html).toContain('id="wc-btn-export-png"');
        expect(html).toContain('id="wc-btn-export-svg"');
        expect(html).toContain('id="wc-btn-export-csv"');

        const folderHtml = readFileSync("plot/wordcloud/index.html", "utf8");
        expect(folderHtml).toContain('<base href="/">');
        expect(folderHtml).toContain('<img src="./assets/svg/back.svg" alt="Kembali" width="36" height="36">');
    });

    it("verifies 404.html contains routing for /plot/wordcloud", () => {
        const notFoundHtml = readFileSync("404.html", "utf8");
        expect(notFoundHtml).toContain('p === "/plot/wordcloud"');
        expect(notFoundHtml).toContain("/plot/wordcloud.html");
    });

    it("verifies wordcloud styles exist and adhere to constraints", () => {
        expect(existsSync("styles/wordcloud.css")).toBe(true);
        const css = readFileSync("styles/wordcloud.css", "utf8");
        expect(css.split("\n").length).toBeLessThanOrEqual(300);
        expect(css.includes(String.fromCharCode(47, 47))).toBe(false);
        expect(css.includes(String.fromCharCode(47, 42))).toBe(false);
        expect(css.includes("\u2014")).toBe(false);
    });

    it("verifies zero comments, no em-dashes, and line limits across all wordcloud source files", () => {
        const files = [
            "src/plot/wordcloud/stopwords.js",
            "src/plot/wordcloud/tokenizer.js",
            "src/plot/wordcloud/layout.js",
            "src/plot/wordcloud/renderer.js",
            "src/plot/wordcloud/presets.js",
            "src/plot/wordcloud/wordcloud-app.js",
            "plot/wordcloud.html",
            "plot/wordcloud/index.html",
            "tests/wordcloud-engine.test.js",
            "tests/wordcloud-dom.test.js"
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
