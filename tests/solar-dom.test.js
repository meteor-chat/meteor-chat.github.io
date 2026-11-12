import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync, existsSync, readdirSync } from "fs";
import { createSolarSystemApp } from "../src/lab/solar/solar-controller.js";

function createMock2dContext() {
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
        arc: noop,
        ellipse: noop,
        fill: noop,
        stroke: noop,
        translate: noop,
        rotate: noop,
        fillText: noop,
        drawImage: noop,
        putImageData: noop,
        createImageData: (w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w) * Math.max(1, h) * 4) }),
        createRadialGradient: gradStub,
        createLinearGradient: gradStub,
        setTransform: noop,
        measureText: (txt) => ({ width: String(txt || "").length * 7 })
    };
}

describe("Solar System 3D Routing, Compliance & DOM App", () => {
    let app = null;

    beforeEach(() => {
        document.documentElement.innerHTML = readFileSync("solar-system.html", "utf8");
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
        expect(labHtml).toContain('href="/solar-system"');
        expect(labHtml).toContain("Solar System 3D");

        const notFoundHtml = readFileSync("404.html", "utf8");
        expect(notFoundHtml).toContain('"/solar-system"');
        expect(notFoundHtml).toContain('"/lab/solar-system"');
        expect(notFoundHtml).toContain('"/solar-system.html"');

        expect(existsSync("solar-system.html")).toBe(true);
        expect(existsSync("solar-system/index.html")).toBe(true);
        const pageHtml = readFileSync("solar-system.html", "utf8");
        expect(pageHtml).toContain('href="/lab"');
        expect(pageHtml).toContain("assets/svg/back.svg");
        expect(pageHtml).toContain("SOLAR SYSTEM");
    });

    it("keeps every solar source, stylesheet, HTML, and test file <= 300 lines with zero comments and zero em-dashes", () => {
        const files = [
            ...readdirSync("src/lab/solar").map((f) => `src/lab/solar/${f}`),
            "styles/solar-system.css",
            "solar-system.html",
            "solar-system/index.html",
            "tests/solar-engine.test.js",
            "tests/solar-dom.test.js"
        ];
        const slashLineRe = new RegExp("(^|\\s)/" + "/");
        const blockComRe = new RegExp("/" + "\\*");
        const htmlComRe = new RegExp("<" + "!--");

        for (const filePath of files) {
            const text = readFileSync(filePath, "utf8");
            const lineCount = text.split(/\r?\n/).length;
            expect(lineCount, `${filePath} line count`).toBeLessThanOrEqual(300);
            expect(text.includes("\u2014"), `${filePath} em-dash`).toBe(false);
            expect(slashLineRe.test(text), `${filePath} slash comment`).toBe(false);
            expect(blockComRe.test(text), `${filePath} block comment`).toBe(false);
            expect(htmlComRe.test(text), `${filePath} html comment`).toBe(false);
        }
    });

    it("renders all 8 planet showcase dock items and handles tracking, scale toggle, and time controls", () => {
        const root = document.getElementById("solar-app-root");
        app = createSolarSystemApp(root);
        expect(app).not.toBeNull();

        const dockButtons = root.querySelectorAll(".solar-dock-item");
        expect(dockButtons).toHaveLength(8);
        expect(Array.from(dockButtons).map((b) => b.dataset.planetId)).toEqual([
            "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune"
        ]);

        const saturnBtn = root.querySelector('[data-planet-id="saturn"]');
        saturnBtn.click();
        app.stepOnce();
        expect(app.getState().activeBodyId).toBe("saturn");
        expect(saturnBtn.classList.contains("is-active")).toBe(true);
        expect(root.querySelector("[data-tel-name]").textContent).toBe("Saturn");

        const realBtn = root.querySelector('[data-scale-mode="real"]');
        realBtn.click();
        expect(app.getState().scaleMode).toBe("real");
        expect(realBtn.getAttribute("aria-pressed")).toBe("true");

        const playBtn = root.querySelector("[data-solar-play]");
        playBtn.click();
        expect(app.getState().paused).toBe(true);
        expect(playBtn.textContent).toBe("Resume");

        const revBtn = root.querySelector("[data-solar-reverse]");
        revBtn.click();
        expect(app.getState().direction).toBe(-1);

        const speedSlider = root.querySelector("[data-solar-speed]");
        speedSlider.value = "48";
        speedSlider.dispatchEvent(new window.Event("input", { bubbles: true }));
        expect(app.getState().timeScale).toBe(48);

        window.dispatchEvent(new window.KeyboardEvent("keydown", { key: "3" }));
        expect(app.getState().activeBodyId).toBe("earth");

        root.querySelector("[data-solar-overview]").click();
        expect(app.getState().activeBodyId).toBe("sun");
        expect(app.getState().focusReticleVisible).toBe(false);
    });
});
