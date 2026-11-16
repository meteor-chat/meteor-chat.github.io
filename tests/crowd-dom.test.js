import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync, existsSync, readdirSync } from "fs";
import { createCrowdController } from "../src/lab/crowd/crowd-controller.js";

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
        roundRect: noop,
        fill: noop,
        stroke: noop,
        translate: noop,
        rotate: noop,
        clip: noop,
        fillText: noop,
        setLineDash: noop,
        createRadialGradient: gradStub,
        createLinearGradient: gradStub,
        measureText: (txt) => ({ width: String(txt || "").length * 7 })
    };
}

describe("Obstacle Paradox Crowd Dynamics Routing, DOM & Compliance", () => {
    let controller = null;

    beforeEach(() => {
        vi.stubGlobal("requestAnimationFrame", (fn) => setTimeout(fn, 16));
        vi.stubGlobal("cancelAnimationFrame", (id) => clearTimeout(id));
        document.documentElement.innerHTML = readFileSync("crowd.html", "utf8");
        window.HTMLCanvasElement.prototype.getContext = function getMock(type) {
            if (type === "2d") return createMockCtx();
            return null;
        };
        window.HTMLCanvasElement.prototype.getBoundingClientRect = () => ({
            width: 800,
            height: 600,
            top: 0,
            left: 0,
            right: 800,
            bottom: 600
        });
    });

    afterEach(() => {
        if (controller) {
            controller.destroy();
            controller = null;
        }
        vi.unstubAllGlobals();
    });

    it("verifies routing and page parity", () => {
        const labHtml = readFileSync("lab.html", "utf8");
        expect(labHtml).toContain('href="/crowd"');
        expect(labHtml).toContain("The Obstacle Paradox");

        const notFoundHtml = readFileSync("404.html", "utf8");
        expect(notFoundHtml).toContain('"/crowd"');
        expect(notFoundHtml).toContain('"/lab/crowd"');
        expect(notFoundHtml).toContain('"/obstacle-paradox"');
        expect(notFoundHtml).toContain('"/crowd.html"');

        expect(existsSync("crowd.html")).toBe(true);
        expect(existsSync("crowd/index.html")).toBe(true);
        const htmlA = readFileSync("crowd.html", "utf8");
        const htmlB = readFileSync("crowd/index.html", "utf8");
        expect(htmlA).toBe(htmlB);
        expect(htmlA).toContain('href="/lab"');
        expect(htmlA).toContain("Back to Lab");
    });

    it("initializes crowd controller and handles interactions", () => {
        const root = document.getElementById("crowd-root");
        expect(root).not.toBeNull();

        controller = createCrowdController(root, { agentCount: 20 });
        const state = controller.getState();
        expect(state.mode).toBe("dual");
        expect(state.running).toBe(false);

        const alarmBtn = root.querySelector("[data-crowd-alarm]");
        expect(alarmBtn.textContent).toContain("Sound Alarm");
        alarmBtn.click();
        expect(controller.getState().running).toBe(true);
        expect(alarmBtn.textContent).toContain("Pause");

        const modeBtn = root.querySelector("[data-crowd-mode]");
        modeBtn.click();
        expect(controller.getState().mode).toBe("single");

        const colBtn = root.querySelector("[data-crowd-column]");
        expect(colBtn.style.display).not.toBe("none");
        colBtn.click();

        const panicInput = root.querySelector("[data-crowd-panic]");
        panicInput.value = "5.0";
        panicInput.dispatchEvent(new window.Event("input"));
        expect(controller.getState().desiredSpeed).toBe(5.0);

        const resetBtn = root.querySelector("[data-crowd-reset]");
        resetBtn.click();
        expect(controller.getState().simA.evacuatedCount).toBe(0);
    });

    it("satisfies strict file constraints: <= 300 lines, zero comments, zero em-dashes", () => {
        const files = [
            ...readdirSync("src/lab/crowd").map((f) => `src/lab/crowd/${f}`),
            "styles/crowd.css",
            "crowd.html",
            "crowd/index.html",
            "tests/crowd-engine.test.js",
            "tests/crowd-dom.test.js"
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
