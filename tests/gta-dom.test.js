import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync } from "fs";

describe("Los Santos 3D Routing, Importmap & Compliance", () => {
    it("wires /lab featured card, standalone HTML pages, back link to /lab, and 404 SPA routes", () => {
        const labHtml = readFileSync("lab.html", "utf8");
        expect(labHtml).toContain('href="/gta"');
        expect(labHtml).toContain("Los Santos 3D");
        expect(labHtml).toContain("GTA V Engine");

        const notFoundHtml = readFileSync("404.html", "utf8");
        expect(notFoundHtml).toContain('"/gta"');
        expect(notFoundHtml).toContain('"/lab/gta"');
        expect(notFoundHtml).toContain('"/los-santos"');
        expect(notFoundHtml).toContain('"/gta.html"');

        expect(existsSync("gta.html")).toBe(true);
        expect(existsSync("gta/index.html")).toBe(true);
        const pageHtml = readFileSync("gta.html", "utf8");
        expect(pageHtml).toBe(readFileSync("gta/index.html", "utf8"));
        expect(pageHtml).toContain('href="/lab"');
        expect(pageHtml).toContain("assets/svg/back.svg");
        expect(pageHtml).toContain("LOS SANTOS");
    });

    it("pins Three.js and JoltPhysics.js WASM-compat in importmap and includes desktop guard + HUD shell", () => {
        const html = readFileSync("gta.html", "utf8");
        expect(html).toContain('<script type="importmap">');
        expect(html).toContain("three@0.187.0/build/three.module.js");
        expect(html).toContain("jolt-physics@1.1.2/dist/jolt-physics.wasm-compat.js");
        expect(html).toContain("/styles/voxel-guard.css");
        expect(html).toContain("/styles/gta.css");
        expect(html).toContain("./src/lab/voxel/voxel-device-guard.js");
        expect(html).toContain("./src/lab/gta/gta-controller.js");
        expect(html).toContain("data-gta-gl");
        expect(html).toContain("data-gta-radar");
        expect(html).toContain("data-gta-wanted");
        expect(html).toContain("data-gta-cash");
        expect(html).toContain("data-gta-speedo");
        expect(html).toContain("data-gta-settings");
        expect(html).toMatch(/data-gta-context-lost[^>]*hidden/);
        expect(html).toMatch(/data-gta-gpu hidden/);
    });

    it("keeps every GTA file <= 1000 lines with zero comments, zero em-dashes, and font-weight <= 600", () => {
        const gtaTests = readdirSync("tests")
            .filter((f) => f.startsWith("gta-") && f.endsWith(".test.js"))
            .map((f) => `tests/${f}`);
        const files = [
            ...readdirSync("src/lab/gta").map((f) => `src/lab/gta/${f}`),
            "styles/gta.css",
            "gta.html",
            "gta/index.html",
            ...gtaTests
        ];
        const slashLineRe = new RegExp("(^|\\s)/" + "/");
        const blockComRe = new RegExp("/" + "\\*");
        const htmlComRe = new RegExp("<!" + "--");
        for (const file of files) {
            const raw = readFileSync(file, "utf8");
            const lines = raw.split(/\r?\n/);
            expect(lines.length, `${file} line count (${lines.length})`).toBeLessThanOrEqual(1000);
            expect(raw, `${file} must contain zero line comments`).not.toMatch(slashLineRe);
            expect(raw, `${file} must contain zero block comments`).not.toMatch(blockComRe);
            expect(raw, `${file} must contain zero HTML comments`).not.toMatch(htmlComRe);
            expect(raw, `${file} must contain zero em-dashes`).not.toContain("\u2014");
        }
        for (const file of ["gta.html", "styles/gta.css"]) {
            const raw = readFileSync(file, "utf8");
            for (const match of raw.matchAll(/font-weight\s*:\s*([^;]+)/g)) {
                const nums = match[1].match(/\d+/g) || [];
                for (const n of nums) {
                    expect(Number(n), `${file} weight ${n}`).toBeLessThanOrEqual(600);
                }
            }
        }
    });
});
