import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import process from "node:process";
import {
    gcd,
    getPrimeFactors,
    checkHullDobell,
    nextLcg,
    stepDetail,
    detectCycle,
    generateLcgSeries
} from "../src/lab/lcg/lcg-logic.js";
import { LCG_PRESETS, getPresetById } from "../src/lab/lcg/lcg-presets.js";
import { LCG_CODE_SAMPLES } from "../src/lab/lcg/lcg-code.js";

describe("lcg-logic mathematical operations", () => {
    it("calculates greatest common divisor via Euclidean algorithm", () => {
        expect(gcd(3, 8)).toBe(1);
        expect(gcd(2, 8)).toBe(2);
        expect(gcd(12, 18)).toBe(6);
        expect(gcd(1013904223, 4294967296)).toBe(1);
    });

    it("extracts distinct prime factors of modulus m", () => {
        expect(getPrimeFactors(8)).toEqual([2]);
        expect(getPrimeFactors(12)).toEqual([2, 3]);
        expect(getPrimeFactors(17)).toEqual([17]);
        expect(getPrimeFactors(1)).toEqual([]);
    });

    it("verifies Hull-Dobell Theorem conditions for full period", () => {
        const full = checkHullDobell(5, 3, 8);
        expect(full.isFullPeriod).toBe(true);
        expect(full.cond1.passed).toBe(true);
        expect(full.cond2.passed).toBe(true);
        expect(full.cond3.passed).toBe(true);

        const failGcd = checkHullDobell(4, 2, 8);
        expect(failGcd.isFullPeriod).toBe(false);
        expect(failGcd.cond1.passed).toBe(false);

        const failMod4 = checkHullDobell(3, 1, 8);
        expect(failMod4.isFullPeriod).toBe(false);
        expect(failMod4.cond1.passed).toBe(true);
        expect(failMod4.cond2.passed).toBe(true);
        expect(failMod4.cond3.passed).toBe(false);
    });

    it("produces exact sequence from user prompt for m=8, a=5, c=3, X0=1", () => {
        const x1 = nextLcg(1, 5, 3, 8);
        expect(x1).toBe(0);

        const x2 = nextLcg(0, 5, 3, 8);
        expect(x2).toBe(3);

        const x3 = nextLcg(3, 5, 3, 8);
        expect(x3).toBe(2);

        const x4 = nextLcg(2, 5, 3, 8);
        expect(x4).toBe(5);

        const x5 = nextLcg(5, 5, 3, 8);
        expect(x5).toBe(4);

        const x6 = nextLcg(4, 5, 3, 8);
        expect(x6).toBe(7);

        const x7 = nextLcg(7, 5, 3, 8);
        expect(x7).toBe(6);

        const x8 = nextLcg(6, 5, 3, 8);
        expect(x8).toBe(1);
    });

    it("formats step calculations properly", () => {
        const detail = stepDetail(1, 5, 3, 8);
        expect(detail.current).toBe(1);
        expect(detail.next).toBe(0);
        expect(detail.formula).toBe("(5 × 1 + 3) mod 8");
        expect(detail.sum).toBe(8);
        expect(detail.stepText).toContain("8 mod 8 = 0");
    });

    it("detects full cycle and short cycle correctly", () => {
        const fullCycle = detectCycle(1, 5, 3, 8);
        expect(fullCycle.isFullPeriod).toBe(true);
        expect(fullCycle.period).toBe(8);
        expect(fullCycle.sequence).toEqual([1, 0, 3, 2, 5, 4, 7, 6]);

        const shortCycle = detectCycle(1, 4, 2, 8);
        expect(shortCycle.isFullPeriod).toBe(false);
        expect(shortCycle.period).toBeLessThan(8);

        const series = generateLcgSeries(1, 5, 3, 8, 4);
        expect(series.length).toBe(4);
        expect(series[0].next).toBe(0);
        expect(series[1].next).toBe(3);
        expect(series[2].next).toBe(2);
        expect(series[3].next).toBe(5);
    });
});

describe("lcg presets and multi-language codes", () => {
    it("provides valid presets including user prompt example", () => {
        expect(LCG_PRESETS.length).toBeGreaterThanOrEqual(5);
        const promptPreset = getPresetById("prompt");
        expect(promptPreset.m).toBe(8);
        expect(promptPreset.a).toBe(5);
        expect(promptPreset.c).toBe(3);
        expect(promptPreset.x0).toBe(1);
    });

    it("provides code implementations for all 6 target languages", () => {
        const langs = ["python", "javascript", "c", "cpp", "java", "golang"];
        langs.forEach((lang) => {
            const entry = LCG_CODE_SAMPLES[lang];
            expect(entry).toBeDefined();
            expect(typeof entry.code).toBe("string");
            expect(entry.code.length).toBeGreaterThan(20);
        });
    });
});

describe("lcg markup and routing", () => {
    it("ensures lcg.html exists and contains necessary UI components", () => {
        const html = fs.readFileSync(path.resolve(process.cwd(), "lcg.html"), "utf-8");
        expect(html).toContain("Linear Congruential Generator");
        expect(html).toContain("id=\"lcg-canvas\"");
        expect(html).toContain("id=\"lcg-in-m\"");
        expect(html).toContain("id=\"lcg-hull-badge\"");
        expect(html).toContain("id=\"lcg-steps-box\"");
        expect(html).toContain("id=\"sort-code-panel\"");
    });

    it("ensures lab.html links to /lcg", () => {
        const labHtml = fs.readFileSync(path.resolve(process.cwd(), "lab.html"), "utf-8");
        expect(labHtml).toContain("href=\"/lcg\"");
        expect(labHtml).toContain("Linear Congruential Generator");
    });

    it("ensures 404.html includes redirect for /lcg", () => {
        const notFoundHtml = fs.readFileSync(path.resolve(process.cwd(), "404.html"), "utf-8");
        expect(notFoundHtml).toContain("/lcg");
        expect(notFoundHtml).toContain("/lcg.html");
    });
});
