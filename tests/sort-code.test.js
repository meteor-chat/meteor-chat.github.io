import { describe, it, expect, beforeEach } from "vitest";
import { loadAlgorithmCode } from "../src/lab/sort/code/sort-code-registry.js";
import {
    openCodePanel,
    closeCodePanel,
    toggleCodePanel,
    setCodeAlgorithm,
    setCodeLanguage,
    highlightCodeStep,
    clearCodeHighlight
} from "../src/lab/sort/code/sort-code-panel.js";

const ALGOS = ["bubble", "insertion", "selection", "quick", "merge", "shaker"];
const LANGS = ["python", "javascript", "c", "cpp", "java", "golang"];

describe("sort-code-registry", () => {
    it.each(ALGOS)("loads code data for %s with all 6 languages and valid line mappings", async (algo) => {
        const data = await loadAlgorithmCode(algo);
        expect(data).toBeDefined();

        LANGS.forEach((lang) => {
            const entry = data[lang];
            expect(entry).toBeDefined();
            expect(typeof entry.code).toBe("string");
            expect(entry.code.length).toBeGreaterThan(0);
            expect(entry.steps).toBeDefined();

            const lines = entry.code.split("\n");
            const totalLines = lines.length;

            Object.entries(entry.steps).forEach(([, targetLines]) => {
                expect(Array.isArray(targetLines)).toBe(true);
                targetLines.forEach((lineNum) => {
                    expect(lineNum).toBeGreaterThanOrEqual(1);
                    expect(lineNum).toBeLessThanOrEqual(totalLines);
                });
            });
        });
    });

    it("returns null for unknown algorithm", async () => {
        const data = await loadAlgorithmCode("unknown");
        expect(data).toBeNull();
    });
});

describe("sort-code-panel DOM operations", () => {
    beforeEach(async () => {
        await closeCodePanel();
    });

    it("opens, closes, and toggles code panel", async () => {
        await openCodePanel();
        const panel = document.getElementById("sort-code-panel");
        expect(panel).not.toBeNull();
        expect(panel.classList.contains("sort-code-hidden")).toBe(false);

        closeCodePanel();
        expect(panel.classList.contains("sort-code-hidden")).toBe(true);

        toggleCodePanel();
        expect(panel.classList.contains("sort-code-hidden")).toBe(false);

        toggleCodePanel();
        expect(panel.classList.contains("sort-code-hidden")).toBe(true);
    });

    it("renders code lines and switches languages", async () => {
        await openCodePanel();
        await setCodeAlgorithm("bubble");

        const panel = document.getElementById("sort-code-panel");
        const lines = panel.querySelectorAll(".sort-code-line");
        expect(lines.length).toBeGreaterThan(0);

        setCodeLanguage("golang");
        const golangLines = panel.querySelectorAll(".sort-code-line");
        expect(golangLines.length).toBeGreaterThan(0);
    });

    it("highlights steps and clears highlights", async () => {
        await openCodePanel();
        await setCodeAlgorithm("insertion");

        highlightCodeStep("temp");
        const activeLines = document.querySelectorAll(".sort-code-line.active");
        expect(activeLines.length).toBeGreaterThan(0);

        clearCodeHighlight();
        const clearedLines = document.querySelectorAll(".sort-code-line.active");
        expect(clearedLines.length).toBe(0);
    });
});
