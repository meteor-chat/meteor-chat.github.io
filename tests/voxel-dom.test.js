import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync, existsSync, readdirSync } from "fs";
import { createVoxelApp } from "../src/lab/voxel/voxel-controller.js";

function createMock2dContext() {
    const noop = () => {};
    return {
        clearRect: noop,
        drawImage: noop,
        putImageData: noop,
        createImageData: (w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w) * Math.max(1, h) * 4) })
    };
}

describe("Voxel World 3D Routing, Compliance & DOM App", () => {
    let app = null;

    beforeEach(() => {
        document.documentElement.innerHTML = readFileSync("voxel.html", "utf8");
        window.HTMLCanvasElement.prototype.getContext = function getMockCtx(kind) {
            if (kind === "2d") return createMock2dContext();
            return null;
        };
    });

    afterEach(() => {
        if (app) {
            app.destroy();
            app = null;
        }
    });

    it("wires /lab card, standalone HTML pages, back link to /lab, and 404 SPA routes", () => {
        const labHtml = readFileSync("lab.html", "utf8");
        expect(labHtml).toContain('href="/voxel"');
        expect(labHtml).toContain("Voxel World Engine");

        const notFoundHtml = readFileSync("404.html", "utf8");
        expect(notFoundHtml).toContain('"/voxel"');
        expect(notFoundHtml).toContain('"/lab/voxel"');
        expect(notFoundHtml).toContain('"/voxel.html"');

        expect(existsSync("voxel.html")).toBe(true);
        expect(existsSync("voxel/index.html")).toBe(true);
        const pageHtml = readFileSync("voxel.html", "utf8");
        expect(pageHtml).toContain('href="/lab"');
        expect(pageHtml).toContain("assets/svg/back.svg");
        expect(pageHtml).toContain("VOXEL WORLD");
    });

    it("keeps every voxel source, stylesheet, HTML, and test file <= 300 lines with zero comments and zero em-dashes", () => {
        const files = [
            ...readdirSync("src/lab/voxel").map((f) => `src/lab/voxel/${f}`),
            "styles/voxel.css",
            "styles/voxel-guard.css",
            "voxel.html",
            "voxel/index.html",
            "tests/voxel-engine.test.js",
            "tests/voxel-dom.test.js",
            "tests/voxel-guard.test.js",
            "tests/voxel-perf.test.js",
            "tests/voxel-lifecycle.test.js",
            "tests/voxel-textures.test.js",
            "tests/voxel-shaders.test.js",
            "tests/voxel-render.test.js",
            "tests/voxel-streaming.test.js",
            "tests/voxel-sun-screen.test.js",
            "tests/voxel-physics.test.js",
            "tests/voxel-mob-physics.test.js",
            "tests/voxel-mob-ai.test.js",
            "tests/voxel-tex-mobs.test.js",
            "tests/voxel-mob-model.test.js",
            "tests/voxel-mob-system.test.js",
            "tests/voxel-mob-render.test.js",
            "tests/voxel-mob-spawn.test.js",
            "tests/helpers/mock-gl.js"
        ];
        const slashLineRe = new RegExp("(^|\\s)/" + "/");
        const blockComRe = new RegExp("/" + "\\*");
        const htmlComRe = new RegExp("<!" + "--");
        for (const file of files) {
            const raw = readFileSync(file, "utf8");
            const lines = raw.split(/\r?\n/);
            expect(lines.length, `${file} line count (${lines.length})`).toBeLessThanOrEqual(300);
            expect(raw, `${file} must contain zero line comments`).not.toMatch(slashLineRe);
            expect(raw, `${file} must contain zero block comments`).not.toMatch(blockComRe);
            expect(raw, `${file} must contain zero HTML comments`).not.toMatch(htmlComRe);
            expect(raw, `${file} must contain zero em-dashes`).not.toContain("\u2014");
        }
    });

    it("ships hidden GPU telemetry, resolution telemetry, and a hidden context-lost banner in both entrypoints", () => {
        for (const file of ["voxel.html", "voxel/index.html"]) {
            const html = readFileSync(file, "utf8");
            expect(html, file).toContain("data-tel-scale");
            expect(html, file).toMatch(/data-tel-gpu hidden/);
            expect(html, file).toMatch(/data-voxel-context-lost[^>]*hidden/);
        }
        expect(readFileSync("voxel.html", "utf8")).toBe(readFileSync("voxel/index.html", "utf8"));
    });

    it("renders 9 hotbar slots, toggles fly/action/time-of-day modes, and reveals fallback when WebGL 2 is absent", () => {
        const root = document.getElementById("voxel-app-root");
        app = createVoxelApp(root);

        const fallback = root.querySelector("[data-voxel-fallback]");
        expect(fallback.hidden).toBe(false);

        const slots = root.querySelectorAll(".voxel-slot");
        expect(slots.length).toBe(9);
        slots[4].click();
        expect(app.state.selectedSlot).toBe(4);
        expect(slots[4].getAttribute("aria-pressed")).toBe("true");

        const flyBtn = root.querySelector("[data-voxel-fly]");
        expect(app.player.flyMode).toBe(true);
        flyBtn.click();
        expect(app.player.flyMode).toBe(false);
        expect(flyBtn.textContent).toBe("Mode: Walk");

        const actBtn = root.querySelector("[data-voxel-action]");
        expect(app.state.actionMode).toBe("break");
        actBtn.click();
        expect(app.state.actionMode).toBe("place");
        expect(actBtn.textContent).toBe("Click: Place");

        const nightBtn = root.querySelector('[data-voxel-time="0.88"]');
        nightBtn.click();
        expect(app.state.timeOfDay).toBeCloseTo(0.88, 2);
        expect(nightBtn.getAttribute("aria-pressed")).toBe("true");
    });
});
