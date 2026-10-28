import { describe, it, expect } from "vitest";
import { getFeatureContext } from "../src/chat/feature-context.js";

describe("Client-Side Intent JIT (Feature Context)", () => {
    it("should return pathfinding context when user asks about search, maze, or dijkstra", () => {
        const text1 = "Bagaimana simulasi Dijkstra di web ini?";
        const ctx1 = getFeatureContext(text1, []);
        expect(ctx1).toContain("/search");
        expect(ctx1).toContain("Pathfinding Arena");
        expect(ctx1).toContain("Dijkstra");

        const text2 = "Apakah ada fitur labirin atau BFS?";
        const ctx2 = getFeatureContext(text2, []);
        expect(ctx2).toContain("/search");
    });

    it("should return sorting visualizer context when user asks about sorting", () => {
        const text = "Bisakah kamu visualisasikan bubble sort?";
        const ctx = getFeatureContext(text, []);
        expect(ctx).toContain("/sort");
        expect(ctx).toContain("Sorting Visualizer");
        expect(ctx).toContain("Bubble Sort");
    });

    it("should return math laboratory context when user asks about math formulas or 3d shapes", () => {
        const text = "Ada kalkulator untuk integral riemann dan teorema bayes?";
        const ctx = getFeatureContext(text, []);
        expect(ctx).toContain("/math");
        expect(ctx).toContain("Interactive STEM Laboratory");
    });

    it("should return ecosystem context when user asks about global features or capabilities", () => {
        const text = "Fitur apa saja yang ada di website ini?";
        const ctx = getFeatureContext(text, []);
        expect(ctx).toContain("Ekosistem Web Meteor");
        expect(ctx).toContain("/math");
        expect(ctx).toContain("/sort");
        expect(ctx).toContain("/search");
    });

    it("should return null for unrelated generic chat queries to conserve tokens", () => {
        expect(getFeatureContext("Halo selamat pagi", [])).toBe(null);
        expect(getFeatureContext("Berapa jarak dari bumi ke bulan?", [])).toBe(null);
        expect(getFeatureContext("Tolong buatkan puisi tentang senja", [])).toBe(null);
        expect(getFeatureContext("", [])).toBe(null);
        expect(getFeatureContext(null, [])).toBe(null);
    });

    it("should deduplicate context if recently discussed in previous turns", () => {
        const recentMessages = [
            { role: "user", content: "Bagaimana cara kerja Dijkstra?" },
            { role: "assistant", content: "Kamu bisa membuka [Pathfinding Arena](/search) untuk mencobanya." }
        ];

        const ctx = getFeatureContext("Coba jelaskan lagi tentang Dijkstra", recentMessages);
        expect(ctx).toBe(null);
    });
});
