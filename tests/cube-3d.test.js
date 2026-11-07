import { describe, it, expect, beforeEach, vi } from "vitest";
import fs from "fs";
import { computeCubeMetrics, formatVal } from "../src/math/geometry/cube-metrics.js";
import { evaluateCubeCritical, renderCubeCriticalCards } from "../src/math/geometry/cube-critical.js";
import {
    setCubeProjection,
    setCubeHighlight,
    getCube3dState
} from "../src/math/geometry/cube-3d.js";

describe("cube-3d math calculations and scientific analysis", () => {
    beforeEach(() => {
        window.katex = {
            render: vi.fn((tex, el) => {
                el.innerHTML = tex;
            })
        };
    });

    it("computes all 6 metrics correctly for sisi = 12 matching illustration", () => {
        const res = computeCubeMetrics("12");
        expect(res.vol).toBe("1728");
        expect(res.lp).toBe("864");
        expect(res.pr).toBe("144");
        expect(res.ds).toBe("16.97");
        expect(res.dr).toBe("20.78");
        expect(res.bd).toBe("203.64");
    });

    it("computes all 6 metrics correctly for s = 9 matching user prompt", () => {
        const res = computeCubeMetrics("9");
        expect(res.vol).toBe("729");
        expect(res.lp).toBe("486");
        expect(res.pr).toBe("108");
        expect(res.ds).toBe("12.73");
        expect(res.dr).toBe("15.59");
        expect(res.bd).toBe("114.57");
    });

    it("computes all 6 metrics correctly for s = 6 matching user screenshot", () => {
        const res = computeCubeMetrics("6");
        expect(res.vol).toBe("216");
        expect(res.lp).toBe("216");
        expect(res.pr).toBe("72");
        expect(res.ds).toBe("8.49");
        expect(res.dr).toBe("10.39");
        expect(res.bd).toBe("50.94");
    });

    it("computes correctly for s = 5", () => {
        const res = computeCubeMetrics("5");
        expect(res.vol).toBe("125");
        expect(res.lp).toBe("150");
        expect(res.pr).toBe("60");
        expect(res.ds).toBe("7.07");
        expect(res.dr).toBe("8.66");
        expect(res.bd).toBe("35.35");
    });

    it("handles zero and negative or invalid sisi correctly", () => {
        const zeroRes = computeCubeMetrics("0");
        expect(zeroRes.vol).toBe("0");
        expect(zeroRes.lp).toBe("0");
        expect(zeroRes.pr).toBe("0");

        const emptyRes = computeCubeMetrics("");
        expect(emptyRes.vol).toBe("0");

        const invalidRes = computeCubeMetrics("abc");
        expect(invalidRes.vol).toBe("0");
    });

    it("formats values properly with formatVal", () => {
        expect(formatVal(0)).toBe("0");
        expect(formatVal(100)).toBe("100");
        expect(formatVal(12.3456)).toBe("12.35");
        expect(formatVal(-5)).toBe("0");
    });

    it("evaluates scientific critical metrics and Square-Cube law accurately", () => {
        const crit12 = evaluateCubeCritical(12);
        expect(crit12.valid).toBe(true);
        expect(crit12.vol).toBe(1728);
        expect(crit12.lp).toBe(864);
        expect(crit12.ratioSAV).toBeCloseTo(0.5, 4);
        expect(crit12.euler).toBe(2);
        expect(crit12.magicAngleDeg).toBeCloseTo(54.7356, 2);
        expect(crit12.bodyAngleDeg).toBeCloseTo(70.5288, 2);
        expect(crit12.errorMultiplierV).toBe(3);
        expect(crit12.errorMultiplierLp).toBe(2);

        const crit6 = evaluateCubeCritical(6);
        expect(crit6.vol).toBe(216);
        expect(crit6.lp).toBe(216);
        expect(crit6.ratioSAV).toBeCloseTo(1.0, 4);

        const crit3 = evaluateCubeCritical(3);
        expect(crit3.ratioSAV).toBeCloseTo(2.0, 4);

        const critInvalid = evaluateCubeCritical(0);
        expect(critInvalid.valid).toBe(false);
    });

    it("renders critical scientific cards into container", () => {
        const container = document.createElement("div");
        renderCubeCriticalCards(12, container);
        expect(container.innerHTML).toContain("Penurunan Matematis 6 Metrik Silabus");
        expect(container.innerHTML).toContain("Hukum Kuadrat-Kubik Galileo");
        expect(container.innerHTML).toContain("Karakteristik Euler");
        expect(container.innerHTML).toContain("Perambatan Ketidakpastian Pengukuran Fisik");
    });

    it("toggles 3D projection and spotlight element states", () => {
        setCubeProjection("orthographic");
        expect(getCube3dState().projection).toBe("orthographic");
        setCubeProjection("perspective");
        expect(getCube3dState().projection).toBe("perspective");

        setCubeHighlight("ds");
        expect(getCube3dState().highlight).toBe("ds");
        setCubeHighlight("dr");
        expect(getCube3dState().highlight).toBe("dr");
        setCubeHighlight("bd");
        expect(getCube3dState().highlight).toBe("bd");
        setCubeHighlight("lp");
        expect(getCube3dState().highlight).toBe("lp");
        setCubeHighlight("pr");
        expect(getCube3dState().highlight).toBe("pr");
        setCubeHighlight("all");
        expect(getCube3dState().highlight).toBe("all");
    });

    it("verifies math.html contains enhanced scientific geometry layout and uniform back button", () => {
        const html = fs.readFileSync("math.html", "utf8");
        expect(html).toContain('id="math-calc-form-23"');
        expect(html).toContain('id="cube-calc-layout"');
        expect(html).toContain('id="cube-canvas"');
        expect(html).toContain('id="cube-lines-svg"');
        expect(html).toContain('class="cube-sci-toolbar"');
        expect(html).toContain('id="cube-proj-persp"');
        expect(html).toContain('id="cube-proj-ortho"');
        expect(html).toContain('id="cube-btn-spot-all"');
        expect(html).toContain('id="cube-btn-spot-lp"');
        expect(html).toContain('id="cube-btn-spot-pr"');
        expect(html).toContain('id="cube-btn-spot-ds"');
        expect(html).toContain('id="cube-btn-spot-dr"');
        expect(html).toContain('id="cube-btn-spot-bd"');
        expect(html).toContain('id="cube-chart-canvas"');
        expect(html).toContain('id="cube-critical-container"');
        expect(html).toContain('id="btn-math-calc-back-23"');
        expect(html).toContain('<img src="./assets/svg/back.svg" alt="Kembali" width="36" height="36">');
    });
});
