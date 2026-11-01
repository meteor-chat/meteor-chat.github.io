import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
    clamp,
    predict,
    computeOLS,
    computeResiduals,
    computeGradients,
    gradientDescentStep
} from "../src/lab/linear/linear-model.js";
import { computeMetrics } from "../src/lab/linear/linear-metrics.js";
import {
    getStudyHoursPreset,
    getCarAgePreset,
    getOutlierPreset,
    getRandomPreset,
    getHouseAreaPreset,
    PRESET_INFOS
} from "../src/lab/linear/linear-presets.js";
import { generateKatexBreakdown } from "../src/lab/linear/linear-katex.js";
import { CODE_SNIPPETS } from "../src/lab/linear/linear-code-snippets.js";

describe("linear regression core model", () => {
    it("clamps values within numeric bounds", () => {
        expect(clamp(5, 0, 10)).toBe(5);
        expect(clamp(-5, 0, 10)).toBe(0);
        expect(clamp(15, 0, 10)).toBe(10);
    });

    it("predicts y values accurately given slope and intercept", () => {
        expect(predict(4, 2, 3)).toBe(11);
        expect(predict(0, -1.5, 10)).toBe(10);
        expect(predict(-2, 3, -1)).toBe(-7);
    });

    it("computes exact closed-form OLS solution for collinear data", () => {
        const points = [
            { x: 1, y: 3 },
            { x: 2, y: 5 },
            { x: 3, y: 7 },
            { x: 4, y: 9 }
        ];
        const ols = computeOLS(points);
        expect(ols.valid).toBe(true);
        expect(ols.n).toBe(4);
        expect(ols.w).toBeCloseTo(2.0, 6);
        expect(ols.b).toBeCloseTo(1.0, 6);
    });

    it("handles OLS edge cases: insufficient points or identical x values", () => {
        expect(computeOLS([]).valid).toBe(false);
        expect(computeOLS([{ x: 2, y: 5 }]).valid).toBe(false);

        const verticalPoints = [
            { x: 3, y: 1 },
            { x: 3, y: 5 }
        ];
        const olsVertical = computeOLS(verticalPoints);
        expect(olsVertical.valid).toBe(false);
    });

    it("calculates residuals between observed and predicted values", () => {
        const points = [
            { x: 1, y: 4 },
            { x: 2, y: 4 }
        ];
        const residuals = computeResiduals(points, 2, 1);
        expect(residuals).toHaveLength(2);
        expect(residuals[0].yHat).toBe(3);
        expect(residuals[0].residual).toBe(1);
        expect(residuals[1].yHat).toBe(5);
        expect(residuals[1].residual).toBe(-1);
    });

    it("computes analytical MSE gradients correctly", () => {
        const points = [
            { x: 1, y: 3 },
            { x: 2, y: 5 }
        ];
        const perfectGrads = computeGradients(points, 2, 1);
        expect(perfectGrads.dw).toBeCloseTo(0, 6);
        expect(perfectGrads.db).toBeCloseTo(0, 6);

        const underGrads = computeGradients(points, 0, 0);
        expect(underGrads.dw).toBeLessThan(0);
        expect(underGrads.db).toBeLessThan(0);
    });

    it("reduces loss across gradient descent steps towards OLS solution", () => {
        const points = [
            { x: 1, y: 3 },
            { x: 2, y: 5 },
            { x: 3, y: 7 }
        ];
        let w = 0;
        let b = 1;
        const initialLoss = computeMetrics(points, w, b).mse;

        for (let i = 0; i < 300; i++) {
            const next = gradientDescentStep(points, w, b, 0.05);
            w = next.w;
            b = next.b;
        }
        const finalLoss = computeMetrics(points, w, b).mse;
        expect(finalLoss).toBeLessThan(initialLoss);

        const ols = computeOLS(points);
        expect(w).toBeCloseTo(ols.w, 1);
        expect(b).toBeCloseTo(ols.b, 1);
    });
});

describe("linear regression evaluation metrics", () => {
    it("evaluates perfect fit metrics with zero error and unit R2", () => {
        const points = [
            { x: 1, y: 2 },
            { x: 2, y: 4 },
            { x: 3, y: 6 }
        ];
        const m = computeMetrics(points, 2, 0);
        expect(m.sse).toBeCloseTo(0, 6);
        expect(m.mse).toBeCloseTo(0, 6);
        expect(m.rmse).toBeCloseTo(0, 6);
        expect(m.mae).toBeCloseTo(0, 6);
        expect(m.r2).toBeCloseTo(1.0, 6);
        expect(m.r).toBeCloseTo(1.0, 6);
    });

    it("handles negative R2 when model predicts worse than mean baseline", () => {
        const points = [
            { x: 1, y: 10 },
            { x: 2, y: 12 },
            { x: 3, y: 11 }
        ];
        const badMetrics = computeMetrics(points, 10, 50);
        expect(badMetrics.r2).toBeLessThan(0);
    });

    it("returns zero metrics safely on empty datasets", () => {
        const m = computeMetrics([], 1, 1);
        expect(m.mse).toBe(0);
        expect(m.r2).toBe(0);
        expect(m.r).toBe(0);
    });
});

describe("presets data and descriptions integrity", () => {
    it("provides 5 valid non-empty preset datasets", () => {
        const p1 = getStudyHoursPreset();
        const p2 = getCarAgePreset();
        const p3 = getOutlierPreset();
        const p4 = getRandomPreset();
        const p5 = getHouseAreaPreset();

        expect(p1.length).toBeGreaterThanOrEqual(5);
        expect(p2.length).toBeGreaterThanOrEqual(5);
        expect(p3.length).toBeGreaterThanOrEqual(5);
        expect(p4.length).toBe(9);
        expect(p5.length).toBeGreaterThanOrEqual(5);

        for (const pt of [...p1, ...p2, ...p3, ...p4, ...p5]) {
            expect(typeof pt.x).toBe("number");
            expect(typeof pt.y).toBe("number");
            expect(Number.isFinite(pt.x)).toBe(true);
            expect(Number.isFinite(pt.y)).toBe(true);
        }
    });

    it("contains complete metadata descriptions for all presets", () => {
        const keys = ["study-hours", "car-age", "outlier", "random", "house-area"];
        for (const key of keys) {
            expect(PRESET_INFOS[key]).toBeDefined();
            expect(PRESET_INFOS[key].desc.length).toBeGreaterThan(10);
            expect(PRESET_INFOS[key].xLabel).toBeDefined();
            expect(PRESET_INFOS[key].yLabel).toBeDefined();
        }
    });
});

describe("KaTeX formulas and multi-language code snippets", () => {
    it("generates structured LaTeX breakdowns for valid and invalid states", () => {
        const invalidBreakdown = generateKatexBreakdown(null, null);
        expect(invalidBreakdown.summaryTex).toContain("Minimal butuh");

        const points = [
            { x: 1, y: 2 },
            { x: 2, y: 4 }
        ];
        const ols = computeOLS(points);
        const metrics = computeMetrics(points, ols.w, ols.b);
        const validBreakdown = generateKatexBreakdown(ols, metrics);

        expect(validBreakdown.slopeTex).toContain("\\sum xy");
        expect(validBreakdown.interceptTex).toContain("\\bar{y}");
        expect(validBreakdown.lineTex).toContain("\\hat{y}");
        expect(validBreakdown.r2Tex).toContain("R^2");
    });

    it("contains robust snippets across 5 target programming languages", () => {
        const languages = ["python", "javascript", "cpp", "java", "go"];
        for (const lang of languages) {
            expect(CODE_SNIPPETS[lang]).toBeDefined();
            expect(CODE_SNIPPETS[lang].length).toBeGreaterThan(50);
        }
    });
});

describe("file architecture integrity and zero comments", () => {
    const dir = path.resolve(process.cwd(), "src/lab/linear");
    const files = fs.readdirSync(dir);
    const slash = String.fromCharCode(47);
    const star = String.fromCharCode(42);
    const blockStart = slash + star;
    const blockEnd = star + slash;
    const linePrefix = slash + slash;

    it("guarantees all files in src/lab/linear have zero comments and under 300 lines", () => {
        expect(files.length).toBeGreaterThanOrEqual(9);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const content = fs.readFileSync(fullPath, "utf-8");
            const lines = content.split("\n");

            expect(lines.length).toBeLessThanOrEqual(300);
            expect(content.includes(blockStart)).toBe(false);
            expect(content.includes(blockEnd)).toBe(false);
            expect(content.includes(linePrefix)).toBe(false);
        }
    });

    it("guarantees linear.html has zero comments, under 300 lines, and uses assets/svg/back.svg", () => {
        const htmlPath = path.resolve(process.cwd(), "linear.html");
        const htmlContent = fs.readFileSync(htmlPath, "utf-8");
        const lines = htmlContent.split("\n");

        expect(lines.length).toBeLessThanOrEqual(300);
        const htmlCommentStart = "<" + "!--";
        const htmlCommentEnd = "--" + ">";
        expect(htmlContent.includes(htmlCommentStart)).toBe(false);
        expect(htmlContent.includes(htmlCommentEnd)).toBe(false);
        expect(htmlContent.includes(blockStart)).toBe(false);
        expect(htmlContent.includes(blockEnd)).toBe(false);
        expect(htmlContent.includes(linePrefix)).toBe(false);
        expect(htmlContent).toContain("./assets/svg/back.svg");
    });
});
