import { describe, it, expect } from "vitest";
import { isStopword, parseCustomStopwords } from "../src/plot/wordcloud/stopwords.js";
import { extractTokens, parseFrequencyList, computeFrequencies, scaleFontSize } from "../src/plot/wordcloud/tokenizer.js";
import { calculateLayout, measureWord, computeRotatedBox, checkOverlap, pickAngle } from "../src/plot/wordcloud/layout.js";
import { PALETTES, assignWordColors, generateSVGString, findWordAtPoint } from "../src/plot/wordcloud/renderer.js";

describe("Word Cloud Tokenizer and NLP", () => {
    it("identifies Indonesian and English stopwords", () => {
        expect(isStopword("dan", "id")).toBe(true);
        expect(isStopword("yang", "id")).toBe(true);
        expect(isStopword("algoritma", "id")).toBe(false);

        expect(isStopword("the", "en")).toBe(true);
        expect(isStopword("learning", "en")).toBe(false);

        const custom = parseCustomStopwords("special,ignore;test");
        expect(isStopword("special", "none", custom)).toBe(true);
        expect(isStopword("learning", "none", custom)).toBe(false);
    });

    it("extracts tokens and counts frequencies accurately", () => {
        const sample = "Kuantum mekanika kuantum partikel kuantum gelombang partikel";
        const res = computeFrequencies(sample, { stopwordMode: "none", minWordLength: 2 });
        expect(res.words.length).toBe(4);
        expect(res.words[0].text).toBe("kuantum");
        expect(res.words[0].count).toBe(3);
        expect(res.words[0].rank).toBe(1);
        expect(res.totalRawTokens).toBe(7);
        expect(res.uniqueTokens).toBe(4);
        expect(res.typeTokenRatio).toBeCloseTo(4 / 7, 2);
    });

    it("parses direct frequency lists with colons and commas", () => {
        const text = "ai: 40\nmachine: 35\nlearning, 30\nneural= 25";
        const map = parseFrequencyList(text);
        expect(map).not.toBeNull();
        expect(map.get("ai")).toBe(40);
        expect(map.get("learning")).toBe(30);

        const res = computeFrequencies(text, { minWordLength: 2 });
        expect(res.words.length).toBe(4);
        expect(res.words[0].text).toBe("ai");
        expect(res.words[0].count).toBe(40);
    });

    it("scales font size appropriately with linear, sqrt, and log", () => {
        const sLinear = scaleFontSize(10, 0, 100, 10, 50, "linear");
        const sSqrt = scaleFontSize(10, 0, 100, 10, 50, "sqrt");
        const sLog = scaleFontSize(10, 0, 100, 10, 50, "log");

        expect(sLinear).toBe(14);
        expect(sSqrt).toBeGreaterThan(sLinear);
        expect(sLog).toBeGreaterThan(sLinear);
    });
});

describe("Word Cloud Layout and Geometry", () => {
    it("measures word bounding box and rotates correctly", () => {
        const m = measureWord("TensorFlow", 30, "sans-serif");
        expect(m.width).toBeGreaterThan(0);
        expect(m.height).toBeGreaterThan(0);

        const boxH = computeRotatedBox(100, 100, m.width, m.height, 0);
        expect(boxH.w).toBeGreaterThan(m.width);

        const boxV = computeRotatedBox(100, 100, m.width, m.height, 90);
        expect(boxV.w).toBe(boxH.h);
        expect(boxV.h).toBe(boxH.w);
    });

    it("detects AABB bounding box overlaps", () => {
        const b1 = { x: 10, y: 10, w: 50, h: 20 };
        const b2 = { x: 30, y: 15, w: 40, h: 20 };
        const b3 = { x: 100, y: 100, w: 20, h: 20 };

        expect(checkOverlap(b1, b2)).toBe(true);
        expect(checkOverlap(b1, b3)).toBe(false);
    });

    it("picks angle modes according to specification", () => {
        expect(pickAngle("horizontal", 0)).toBe(0);
        expect(pickAngle("horizontal", 2)).toBe(0);
        expect(pickAngle("vertical", 0)).toBe(90);
        expect(pickAngle("mixed", 0)).toBe(0);
        expect(pickAngle("mixed", 2)).toBe(90);
    });

    it("computes word cloud layout and compactness metric", () => {
        const words = [
            { text: "Intelligence", count: 50 },
            { text: "Artificial", count: 45 },
            { text: "Neural", count: 40 },
            { text: "Network", count: 35 },
            { text: "Deep", count: 30 },
            { text: "Learning", count: 25 },
            { text: "Model", count: 20 },
            { text: "Data", count: 15 }
        ];

        const layout = calculateLayout(words, {
            width: 600,
            height: 400,
            minFontSize: 14,
            maxFontSize: 48,
            angleMode: "horizontal"
        });

        expect(layout.placed.length).toBe(8);
        expect(layout.compactness).toBeGreaterThan(0);
        expect(layout.compactness).toBeLessThanOrEqual(1);

        for (let i = 0; i < layout.placed.length; i++) {
            for (let j = i + 1; j < layout.placed.length; j++) {
                expect(checkOverlap(layout.placed[i].box, layout.placed[j].box)).toBe(false);
            }
        }
    });
});

describe("Word Cloud Renderer and Export", () => {
    it("assigns palette colors cyclically", () => {
        const words = [{ text: "w1" }, { text: "w2" }, { text: "w3" }];
        const colored = assignWordColors(words, "okabe_ito");
        expect(colored[0].color).toBe(PALETTES.okabe_ito[0]);
        expect(colored[1].color).toBe(PALETTES.okabe_ito[1]);
        expect(colored[2].color).toBe(PALETTES.okabe_ito[2]);
    });

    it("generates valid SVG string with XML declaration and text tags", () => {
        const layout = {
            placed: [
                { text: "Gravity", x: 100, y: 150, fontSize: 32, fontFamily: "sans-serif", color: "#38bdf8", angle: 0 },
                { text: "Quantum", x: 250, y: 180, fontSize: 24, fontFamily: "sans-serif", color: "#818cf8", angle: 90 }
            ]
        };

        const svg = generateSVGString(layout, 500, 300);
        expect(svg).toContain('<?xml version="1.0" encoding="UTF-8"?>');
        expect(svg).toContain('<svg xmlns=');
        expect(svg).toContain('www.w3.org/2000/svg"');
        expect(svg).toContain("Gravity");
        expect(svg).toContain("Quantum");
        expect(svg).toContain('transform="rotate(90 250 180)"');
    });

    it("detects mouse click / hover hit on placed word box", () => {
        const layout = {
            placed: [
                { text: "Entropy", box: { x: 50, y: 50, w: 100, h: 30 } }
            ]
        };

        expect(findWordAtPoint(layout, 60, 60)?.text).toBe("Entropy");
        expect(findWordAtPoint(layout, 10, 10)).toBeNull();
    });
});
