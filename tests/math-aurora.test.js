import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import { initMathAurora, destroyMathAurora } from "../src/math/math-aurora.js";

describe("Math Aurora Background Engine Unit Tests", () => {
    let canvas;
    let mockCtx;

    beforeEach(() => {
        mockCtx = {
            clearRect: vi.fn(),
            createLinearGradient: vi.fn(() => ({
                addColorStop: vi.fn()
            })),
            fillRect: vi.fn(),
            beginPath: vi.fn(),
            arc: vi.fn(),
            fill: vi.fn(),
            save: vi.fn(),
            restore: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            bezierCurveTo: vi.fn(),
            ellipse: vi.fn(),
            closePath: vi.fn(),
            stroke: vi.fn(),
            setTransform: vi.fn(),
            globalCompositeOperation: "source-over"
        };

        canvas = {
            getContext: vi.fn((type) => (type === "2d" ? mockCtx : null)),
            getBoundingClientRect: vi.fn(() => ({
                width: 1200,
                height: 800
            })),
            width: 0,
            height: 0
        };

        global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
        global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id));

        window.matchMedia = vi.fn().mockImplementation((query) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn()
        }));
    });

    afterEach(() => {
        destroyMathAurora();
        vi.restoreAllMocks();
    });

    it("handles null or invalid canvas gracefully", () => {
        const resNull = initMathAurora(null);
        expect(resNull).toBeNull();

        const canvasNoCtx = { getContext: vi.fn(() => null) };
        const resNoCtx = initMathAurora(canvasNoCtx);
        expect(resNoCtx).toBeNull();
    });

    it("initializes canvas dimensions, scales for dpr, and starts animation loop", () => {
        const instance = initMathAurora(canvas);
        expect(instance).not.toBeNull();
        expect(instance.canvas).toBe(canvas);
        expect(canvas.width).toBeGreaterThan(0);
        expect(canvas.height).toBeGreaterThan(0);
        expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    it("respects prefers-reduced-motion and halts animation loop", () => {
        window.matchMedia = vi.fn().mockImplementation((query) => ({
            matches: query.includes("prefers-reduced-motion"),
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn()
        }));

        const instance = initMathAurora(canvas);
        expect(instance).not.toBeNull();
        expect(mockCtx.fillRect).toHaveBeenCalled();
        expect(global.requestAnimationFrame).not.toHaveBeenCalled();
    });

    it("handles window resize and updates canvas transform", () => {
        initMathAurora(canvas);
        const prevWidth = canvas.width;

        canvas.getBoundingClientRect = vi.fn(() => ({
            width: 1400,
            height: 900
        }));

        window.dispatchEvent(new Event("resize"));
        expect(canvas.width).toBeGreaterThanOrEqual(prevWidth);
        expect(mockCtx.setTransform).toHaveBeenCalled();
    });

    it("pauses animation on document hidden and resumes on visible", () => {
        initMathAurora(canvas);
        expect(global.requestAnimationFrame).toHaveBeenCalled();

        Object.defineProperty(document, "hidden", {
            configurable: true,
            get: () => true
        });
        document.dispatchEvent(new Event("visibilitychange"));
        expect(global.cancelAnimationFrame).toHaveBeenCalled();

        Object.defineProperty(document, "hidden", {
            configurable: true,
            get: () => false
        });
        document.dispatchEvent(new Event("visibilitychange"));
        expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    it("cleans up listeners and cancels animation on destroy", () => {
        const instance = initMathAurora(canvas);
        expect(instance).not.toBeNull();

        instance.destroy();
        expect(global.cancelAnimationFrame).toHaveBeenCalled();

        destroyMathAurora();
        expect(canvas.width).toBeGreaterThan(0);
    });

    it("verifies aurora container and canvas exist in math.html and math/index.html", () => {
        const mathHtml = fs.readFileSync(path.resolve(process.cwd(), "math.html"), "utf8");
        const indexHtml = fs.readFileSync(path.resolve(process.cwd(), "math/index.html"), "utf8");

        expect(mathHtml).toContain('id="math-aurora-canvas"');
        expect(mathHtml).toContain('class="math-aurora-container"');
        expect(indexHtml).toContain('id="math-aurora-canvas"');
        expect(indexHtml).toContain('class="math-aurora-container"');
    });
});
