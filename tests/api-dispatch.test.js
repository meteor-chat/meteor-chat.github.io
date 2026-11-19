import { describe, it, expect } from "vitest";
import { rankModelsByIntent, selectModels, createTwoTierTimeoutSignal } from "../src/chat/api/api-dispatch.js";

describe("api-dispatch", () => {
    const models = [
        "other/fallback-model:free",
        "dots-studio/dots-3-note-preview:free",
        "cohere/north-mini-code:free",
        "nvidia/nemotron-3.5-lightning:free"
    ];

    it("ranks fast models first for micro and standard queries", () => {
        const microRank = rankModelsByIntent(models, "micro");
        expect(microRank[0]).toBe("nvidia/nemotron-3.5-lightning:free");
        expect(microRank[1]).toBe("cohere/north-mini-code:free");
        expect(microRank[2]).toBe("dots-studio/dots-3-note-preview:free");
        expect(microRank[3]).toBe("other/fallback-model:free");

        const standardRank = rankModelsByIntent(models, "standard");
        expect(standardRank[0]).toBe("nvidia/nemotron-3.5-lightning:free");
    });

    it("ranks heavy models first for heavy code/math queries", () => {
        const heavyRank = rankModelsByIntent(models, "heavy");
        expect(heavyRank[0]).toBe("cohere/north-mini-code:free");
        expect(heavyRank[1]).toBe("nvidia/nemotron-3.5-lightning:free");
        expect(heavyRank[2]).toBe("dots-studio/dots-3-note-preview:free");
    });

    it("accepts custom tiers and handles empty input", () => {
        const tiers = { heavy: ["a"], fast: ["b"], last: ["c"] };
        expect(rankModelsByIntent(["c", "b", "a"], "heavy", tiers)).toEqual(["a", "b", "c"]);
        expect(rankModelsByIntent(["c", "b", "a"], "micro", tiers)).toEqual(["b", "a", "c"]);
        expect(rankModelsByIntent([], "heavy")).toEqual([]);
        expect(rankModelsByIntent(null, "heavy")).toEqual([]);
    });

    it("selectModels handles rotation and selection count properly", () => {
        const { models: sel1, nextIndex: next1 } = selectModels(models, "heavy", 0, 2);
        expect(sel1.length).toBe(2);
        expect(sel1[0]).toBe("cohere/north-mini-code:free");
        expect(sel1[1]).toBe("nvidia/nemotron-3.5-lightning:free");
        expect(next1).toBe(1);

        const { models: sel2 } = selectModels(models, "heavy", next1, 2);
        expect(sel2[0]).toBe("nvidia/nemotron-3.5-lightning:free");
    });
    it("createTwoTierTimeoutSignal initializes and clears without error", () => {
        const { signal, resetTimeout, clear } = createTwoTierTimeoutSignal(8000, 15000);
        expect(signal.aborted).toBe(false);
        resetTimeout();
        expect(signal.aborted).toBe(false);
        clear();
    });

    it("createTwoTierTimeoutSignal respects parent signal abort", () => {
        const parent = new AbortController();
        const { signal } = createTwoTierTimeoutSignal(8000, 15000, parent.signal);
        expect(signal.aborted).toBe(false);
        parent.abort(new Error("User stopped"));
        expect(signal.aborted).toBe(true);
    });
});
