import { describe, it, expect, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import process from "node:process";
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
import { highlightSortCode } from "../src/lab/sort/code/sort-code-highlighter.js";

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

describe("sort-code-highlighter", () => {
    it("highlights keywords, strings, numbers, and functions accurately", () => {
        const js = highlightSortCode("const btn = document.getElementById('btn');", "javascript");
        expect(js).toContain("sort-hl-keyword");
        expect(js).toContain("sort-hl-fn");
        expect(js).toContain("sort-hl-str");

        const java = highlightSortCode("public static int partition(int[] arr, int low, int high) {", "java");
        expect(java).toContain("sort-hl-keyword");
        expect(java).toContain("sort-hl-fn");
        expect(java).toContain("partition");

        const comment = highlightSortCode("// Count from 1 to 10.", "javascript");
        expect(comment).toContain("sort-hl-comment");

        const num = highlightSortCode("let count = 10;", "javascript");
        expect(num).toContain("sort-hl-num");
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

    it("includes a resizer handle element with proper ARIA attributes", async () => {
        await openCodePanel();
        const panel = document.getElementById("sort-code-panel");
        const resizer = panel.querySelector(".sort-code-resizer");
        expect(resizer).not.toBeNull();
        expect(resizer.getAttribute("role")).toBe("separator");
        expect(resizer.getAttribute("aria-orientation")).toBe("vertical");
    });

    it("resizes panel via keyboard navigation", async () => {
        await openCodePanel();
        const panel = document.getElementById("sort-code-panel");
        const resizer = panel.querySelector(".sort-code-resizer");
        panel.style.width = "400px";

        resizer.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowLeft" }));
        expect(parseInt(panel.style.width, 10)).toBe(420);

        resizer.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight" }));
        expect(parseInt(panel.style.width, 10)).toBe(400);

        resizer.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Home" }));
        expect(parseInt(panel.style.width, 10)).toBe(440);
    });

    it("resizes panel via pointer drag events", async () => {
        await openCodePanel();
        const panel = document.getElementById("sort-code-panel");
        const resizer = panel.querySelector(".sort-code-resizer");
        panel.style.width = "400px";

        resizer.dispatchEvent(new window.MouseEvent("pointerdown", { bubbles: true, clientX: 600, button: 0 }));
        expect(panel.classList.contains("is-resizing")).toBe(true);

        resizer.dispatchEvent(new window.MouseEvent("pointermove", { bubbles: true, clientX: 500 }));
        resizer.dispatchEvent(new window.MouseEvent("pointerup", { bubbles: true, clientX: 500 }));
        expect(panel.classList.contains("is-resizing")).toBe(false);
    });

    it("renders code lines with syntax highlight spans and switches languages", async () => {
        await openCodePanel();
        await setCodeAlgorithm("bubble");

        const panel = document.getElementById("sort-code-panel");
        const lines = panel.querySelectorAll(".sort-code-line");
        expect(lines.length).toBeGreaterThan(0);

        const highlightedSpans = panel.querySelectorAll(".sort-hl-keyword, .sort-hl-fn, .sort-hl-num");
        expect(highlightedSpans.length).toBeGreaterThan(0);

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

    it("ensures no per-line horizontal scrollbars and includes syntax styles in sort.html", () => {
        const html = fs.readFileSync(path.resolve(process.cwd(), "sort.html"), "utf-8");
        expect(html).toContain("overflow-x: hidden");
        expect(html).not.toMatch(/\.sort-code-line-text[^{]*\{[^}]*overflow-x:\s*auto/);
        expect(html).toContain(".sort-code-resizer");
        expect(html).toContain(".sort-hl-keyword");
        expect(html).toContain(".sort-hl-str");
        expect(html).toContain(".sort-hl-num");
    });
});
