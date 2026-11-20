import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync, existsSync, readdirSync } from "fs";
import { createMultiwindowApp } from "../src/lab/multiwindow/multiwindow-controller.js";

function createMockCtx() {
    const noop = () => {};
    const gradStub = () => ({ addColorStop: noop });
    return {
        save: noop,
        restore: noop,
        clearRect: noop,
        fillRect: noop,
        beginPath: noop,
        closePath: noop,
        moveTo: noop,
        lineTo: noop,
        rect: noop,
        arc: noop,
        fill: noop,
        stroke: noop,
        translate: noop,
        rotate: noop,
        createLinearGradient: gradStub,
        createRadialGradient: gradStub
    };
}

describe("Multiple Window DOM, Routing & Compliance", () => {
    let app = null;

    beforeEach(() => {
        vi.stubGlobal("requestAnimationFrame", (fn) => setTimeout(fn, 16));
        vi.stubGlobal("cancelAnimationFrame", (id) => clearTimeout(id));
        document.documentElement.innerHTML = readFileSync("multiwindow.html", "utf8");
        window.HTMLCanvasElement.prototype.getContext = function getMock(type) {
            if (type === "2d") return createMockCtx();
            return null;
        };
    });

    afterEach(() => {
        if (app) {
            app.destroy();
            app = null;
        }
        vi.unstubAllGlobals();
    });

    it("verifies lab routing and page parity", () => {
        const labHtml = readFileSync("lab.html", "utf8");
        expect(labHtml).toContain('href="/multiwindow"');
        expect(labHtml).toContain("Multiple Window 3D Scene");

        const notFoundHtml = readFileSync("404.html", "utf8");
        expect(notFoundHtml).toContain('"/multiwindow"');
        expect(notFoundHtml).toContain('"/lab/multiwindow"');

        expect(existsSync("multiwindow.html")).toBe(true);
        expect(existsSync("multiwindow/index.html")).toBe(true);
        const htmlA = readFileSync("multiwindow.html", "utf8");
        const htmlB = readFileSync("multiwindow/index.html", "utf8");
        expect(htmlA).toBe(htmlB);
    });

    it("initializes app with default wormhole geometry and handles controls", () => {
        app = createMultiwindowApp(document.body);
        expect(app).not.toBeNull();
        expect(app.state.geometryType).toBe("wormhole");
        expect(app.state.theme).toBe("staal");

        const sphereBtn = document.querySelector('[data-multiwindow-geo="sphere"]');
        if (sphereBtn) {
            sphereBtn.click();
            expect(app.state.geometryType).toBe("sphere");
        }

        const themeBtn = document.querySelector("[data-multiwindow-theme]");
        if (themeBtn) {
            themeBtn.click();
            expect(app.state.theme).not.toBe("staal");
        }
    });

    it("satisfies strict file constraints: <= 300 lines, zero comments, zero em-dashes", () => {
        const files = [
            ...readdirSync("src/lab/multiwindow").map((f) => `src/lab/multiwindow/${f}`),
            "styles/multiwindow.css",
            "multiwindow.html",
            "multiwindow/index.html",
            "tests/multiwindow-manager.test.js",
            "tests/multiwindow-math.test.js",
            "tests/multiwindow-dom.test.js"
        ];
        const slashLineRe = new RegExp("(^|\\s)/" + "/");
        const blockComRe = new RegExp("/" + "\\*");

        for (const filePath of files) {
            const content = readFileSync(filePath, "utf8");
            const lines = content.split(/\r?\n/);
            expect(lines.length).toBeLessThanOrEqual(300);
            expect(content.includes("\u2014")).toBe(false);

            for (let i = 0; i < lines.length; i += 1) {
                const line = lines[i];
                expect(slashLineRe.test(line)).toBe(false);
                expect(blockComRe.test(line)).toBe(false);
                expect(line.includes("<!-" + "-")).toBe(false);
            }
        }
    });
});
