import { describe, it, expect, vi } from "vitest";
import { rankModelsByIntent, selectModels, createTwoTierTimeoutSignal } from "./api-dispatch.js";

describe("api-dispatch", () => {
    const models = [
        "google/gemma-4-31b-it:free",
        "liquid/lfm-2.5-2.6b:free",
        "cohere/north-mini-code:free",
        "apodex/apodex-1.1-mini:free"
    ];

    it("ranks fast models first for micro and standard queries", () => {
        const microRank = rankModelsByIntent(models, "micro");
        expect(microRank[0]).toBe("liquid/lfm-2.5-2.6b:free");
        expect(microRank[1]).toBe("apodex/apodex-1.1-mini:free");

        const standardRank = rankModelsByIntent(models, "standard");
        expect(standardRank[0]).toBe("liquid/lfm-2.5-2.6b:free");
    });

    it("ranks heavy models first for heavy code/math queries", () => {
        const heavyRank = rankModelsByIntent(models, "heavy");
        expect(heavyRank[0]).toBe("cohere/north-mini-code:free");
        expect(heavyRank[1]).toBe("google/gemma-4-31b-it:free");
    });

    it("selectModels handles rotation and selection count properly", () => {
        const { models: sel1, nextIndex: next1 } = selectModels(models, "heavy", 0, 2);
        expect(sel1.length).toBe(2);
        expect(sel1[0]).toBe("cohere/north-mini-code:free");
        expect(sel1[1]).toBe("google/gemma-4-31b-it:free");
        expect(next1).toBe(1);

        const { models: sel2 } = selectModels(models, "heavy", next1, 2);
        expect(sel2[0]).toBe("google/gemma-4-31b-it:free");
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
