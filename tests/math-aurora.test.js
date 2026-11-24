import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { createMockGl } from "./helpers/mock-gl.js";
import {
    AURORA_VS,
    AURORA_FS,
    AURORA_UNIFORMS,
    NOISE_PERIOD
} from "../src/math/math-aurora-shaders.js";
import {
    TAU,
    MAX_DT_SEC,
    MAX_BACKING_DIM,
    WAVE_SPEEDS,
    DRIFT_SPEEDS,
    createAuroraState,
    stepAuroraState,
    computeAuroraCanvasSize,
    initMathAurora
} from "../src/math/math-aurora.js";

const UNIFORM_DECL = /^\s*uniform\s+(?:highp\s+|mediump\s+|lowp\s+)?\w+\s+(\w+)(?:\[\d+\])?\s*;/gm;

function declaredUniforms(...sources) {
    const names = new Set();
    for (const source of sources) {
        for (const match of source.matchAll(UNIFORM_DECL)) names.add(match[1]);
    }
    return names;
}

function delimiterBalance(source) {
    let braces = 0;
    let parens = 0;
    for (const ch of source) {
        if (ch === "{") braces += 1;
        if (ch === "}") braces -= 1;
        if (ch === "(") parens += 1;
        if (ch === ")") parens -= 1;
    }
    return { braces, parens };
}

function createMock2DContext() {
    const grad = { addColorStop: vi.fn() };
    return {
        globalCompositeOperation: "source-over",
        fillStyle: "",
        createLinearGradient: vi.fn(() => grad),
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        bezierCurveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        fill: vi.fn()
    };
}

describe("Math Aurora GLSL Shaders", () => {
    it("has balanced delimiters and main entrypoints", () => {
        for (const source of [AURORA_VS, AURORA_FS]) {
            expect(delimiterBalance(source)).toEqual({ braces: 0, parens: 0 });
            expect(source).toContain("void main()");
        }
    });

    it("matches declared uniforms with AURORA_UNIFORMS exactly", () => {
        const declared = declaredUniforms(AURORA_VS, AURORA_FS);
        for (const uniform of AURORA_UNIFORMS) {
            expect(declared.has(uniform)).toBe(true);
        }
        for (const uniform of declared) {
            expect(AURORA_UNIFORMS).toContain(uniform);
        }
    });

    it("uses pure aurora without stars, trees, or mountains", () => {
        const lower = AURORA_FS.toLowerCase();
        expect(lower).not.toMatch(/\bstars?\b/);
        expect(lower).not.toMatch(/\btrees?\b/);
        expect(lower).not.toMatch(/\bmountains?\b/);
        expect(lower).not.toMatch(/\bsnow\b/);
    });
});

describe("Math Aurora Infinite Phase Engine", () => {
    it("advances continuously and stays bounded over 100000 simulated frames", () => {
        const state = createAuroraState();
        const initialWave0 = state.wave[0];
        const initialDrift0 = state.drift[0];

        stepAuroraState(state, 0.016);
        expect(state.wave[0]).not.toBe(initialWave0);
        expect(state.drift[0]).not.toBe(initialDrift0);

        for (let i = 0; i < 100000; i += 1) {
            stepAuroraState(state, 0.016);
        }
        for (let j = 0; j < 4; j += 1) {
            expect(Number.isFinite(state.wave[j])).toBe(true);
            expect(state.wave[j]).toBeGreaterThanOrEqual(0);
            expect(state.wave[j]).toBeLessThan(TAU);
            expect(Number.isFinite(state.drift[j])).toBe(true);
            expect(state.drift[j]).toBeGreaterThanOrEqual(0);
            expect(state.drift[j]).toBeLessThan(NOISE_PERIOD);
        }
    });

    it("clamps large dt spikes and ignores invalid dt values", () => {
        const clamped = createAuroraState();
        const reference = createAuroraState();
        stepAuroraState(clamped, 45.0);
        stepAuroraState(reference, MAX_DT_SEC);
        expect(clamped).toEqual(reference);

        const frozen = createAuroraState();
        const snapshot = JSON.parse(JSON.stringify(frozen));
        stepAuroraState(frozen, 0);
        stepAuroraState(frozen, -2);
        stepAuroraState(frozen, Number.NaN);
        stepAuroraState(frozen, Number.POSITIVE_INFINITY);
        expect(frozen).toEqual(snapshot);
        expect(WAVE_SPEEDS.length).toBe(4);
        expect(DRIFT_SPEEDS.length).toBe(4);
    });

    it("computes aspect-preserving bounded canvas dimensions", () => {
        expect(computeAuroraCanvasSize(1920, 1080, 2)).toEqual({ width: MAX_BACKING_DIM, height: 720 });
        expect(computeAuroraCanvasSize(390, 844, 3)).toEqual({ width: 390, height: 844 });
        expect(computeAuroraCanvasSize(0, -10, 0)).toEqual({ width: 1, height: 1 });
    });
});

describe("Math Aurora WebGL Lifecycle and Catalog Scoping", () => {
    let rafQueue;
    let nextRafId;
    let origRaf;
    let origCancelRaf;

    beforeEach(() => {
        rafQueue = new Map();
        nextRafId = 1;
        origRaf = window.requestAnimationFrame;
        origCancelRaf = window.cancelAnimationFrame;
        window.requestAnimationFrame = vi.fn((cb) => {
            const id = nextRafId;
            nextRafId += 1;
            rafQueue.set(id, cb);
            return id;
        });
        window.cancelAnimationFrame = vi.fn((id) => {
            rafQueue.delete(id);
        });
        document.body.innerHTML = `<canvas id="math-aurora-bg" class="math-aurora-bg"></canvas><div id="math-menu-view"></div>`;
    });

    afterEach(() => {
        window.requestAnimationFrame = origRaf;
        window.cancelAnimationFrame = origCancelRaf;
        document.body.innerHTML = "";
    });

    it("runs WebGL render loop, syncs with #math-menu-view visibility, recovers context, and disposes cleanly", async () => {
        const mock = createMockGl();
        const canvas = document.getElementById("math-aurora-bg");
        const menuView = document.getElementById("math-menu-view");
        canvas.getContext = vi.fn((kind) => (kind === "webgl2" ? mock.gl : null));

        const ctrl = initMathAurora(canvas, { menuView });
        expect(ctrl).not.toBeNull();
        expect(ctrl.mode).toBe("webgl");
        expect(ctrl.isRunning()).toBe(true);
        expect(mock.liveCount("shader")).toBe(0);
        expect(mock.liveCount("program")).toBe(1);
        expect(mock.liveCount("buffer")).toBe(1);
        expect(mock.calls("drawArrays")).toBeGreaterThanOrEqual(1);

        const initialCalls = mock.calls("drawArrays");
        const [firstId, firstCb] = rafQueue.entries().next().value;
        rafQueue.delete(firstId);
        firstCb(performance.now() + 16);
        expect(mock.calls("drawArrays")).toBeGreaterThan(initialCalls);

        menuView.classList.add("hidden");
        await Promise.resolve();
        expect(canvas.classList.contains("hidden")).toBe(true);
        expect(ctrl.isActive()).toBe(false);
        expect(ctrl.isRunning()).toBe(false);

        menuView.classList.remove("hidden");
        await Promise.resolve();
        expect(canvas.classList.contains("hidden")).toBe(false);
        expect(ctrl.isActive()).toBe(true);
        expect(ctrl.isRunning()).toBe(true);

        const lostEvent = new window.Event("webglcontextlost", { cancelable: true });
        canvas.dispatchEvent(lostEvent);
        expect(lostEvent.defaultPrevented).toBe(true);
        expect(ctrl.isRunning()).toBe(false);

        canvas.dispatchEvent(new window.Event("webglcontextrestored"));
        expect(ctrl.isRunning()).toBe(true);
        expect(mock.liveCount("program")).toBe(1);
        expect(mock.liveCount("buffer")).toBe(1);

        ctrl.destroy();
        expect(ctrl.isRunning()).toBe(false);
        expect(mock.liveCount("program")).toBe(0);
        expect(mock.liveCount("buffer")).toBe(0);
    });

    it("falls back cleanly to 2D canvas animation when WebGL is unavailable", () => {
        const ctx2d = createMock2DContext();
        const canvas = document.getElementById("math-aurora-bg");
        const menuView = document.getElementById("math-menu-view");
        canvas.getContext = vi.fn((kind) => (kind === "2d" ? ctx2d : null));

        const ctrl = initMathAurora(canvas, { menuView });
        expect(ctrl).not.toBeNull();
        expect(ctrl.mode).toBe("2d");
        expect(ctrl.isRunning()).toBe(true);
        expect(ctx2d.fillRect).toHaveBeenCalled();
        expect(ctx2d.fill).toHaveBeenCalled();
        ctrl.destroy();
    });
});

describe("Math Aurora DOM Parity and Repository Rules", () => {
    it("embeds aurora canvas on /math catalog and hides it on calculator static routes", () => {
        const rootHtml = readFileSync("math.html", "utf8");
        const indexHtml = readFileSync("math/index.html", "utf8");
        const calcHtml = readFileSync("math/ai/1/index.html", "utf8");

        expect(rootHtml).toContain('<canvas id="math-aurora-bg" class="math-aurora-bg" aria-hidden="true"></canvas>');
        expect(indexHtml).toContain('<canvas id="math-aurora-bg" class="math-aurora-bg" aria-hidden="true"></canvas>');
        expect(calcHtml).toContain('<canvas id="math-aurora-bg" class="math-aurora-bg hidden" aria-hidden="true"></canvas>');
    });

    it("satisfies zero-comment and line-count rules across all aurora files", () => {
        const commentRegex = new RegExp("\\/\\*|\\/\\/");
        const files = [
            "src/math/math-aurora-shaders.js",
            "src/math/math-aurora.js",
            "src/math/math-main.js",
            "styles/math.css",
            "tests/math-aurora.test.js"
        ];
        for (const file of files) {
            const content = readFileSync(file, "utf8");
            expect(commentRegex.test(content), `${file} must have zero comments`).toBe(false);
            expect(content.split("\n").length, `${file} must be <= 1000 lines`).toBeLessThanOrEqual(1000);
        }
        const html = readFileSync("math.html", "utf8");
        const htmlCommentRegex = new RegExp("<" + "!-" + "-");
        expect(htmlCommentRegex.test(html)).toBe(false);
    });
});
