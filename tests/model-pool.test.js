import { describe, it, expect } from "vitest";
import { MODEL_TIERS, PROVIDERS } from "../src/core/config.js";
import { rankModelsByIntent } from "../src/chat/api/api-dispatch.js";

const REQUESTED = [
    "nvidia/nemotron-3.5-super-vl:free",
    "nvidia/nemotron-3-ultra-550b-a55b:free",
    "liquid/lfm-3-1.7b:free",
    "nvidia/nemotron-3.5-lightning:free",
    "google/gemma-4-31b-it:free",
    "cohere/north-mini-code:free",
    "inclusionai/ling-3.2-flash:free",
    "baidu/ernie-5.5-flash-preview:free",
    "particle-ai/particle-1:free",
    "recursive/flint-v1.0:free",
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    "google/gemma-4-26b-a4b-it:free"
];

const REMOVED = [
    "nvidia/nemotron-3-super-120b-a12b:free",
    "poolside/laguna-xs-2.1:free",
    "poolside/laguna-s-2.1:free"
];

const pool = PROVIDERS.openrouter.models;

describe("openrouter model pool", () => {
    it("contains every requested model", () => {
        for (const id of REQUESTED) expect(pool, id).toContain(id);
    });

    it("keeps the degraded dots model only as a last resort and drops models without endpoints", () => {
        expect(pool).toContain("dots-studio/dots-3-note-preview:free");
        expect(MODEL_TIERS.last).toContain("dots-studio/dots-3-note-preview:free");
        for (const id of REMOVED) expect(pool, id).not.toContain(id);
    });

    it("has no duplicates and only free variants", () => {
        expect(new Set(pool).size).toBe(pool.length);
        expect(pool).toHaveLength(13);
        for (const id of pool) expect(id, id).toMatch(/^[\w.-]+\/[\w.-]+:free$/);
    });

    it("assigns every model to exactly one tier and derives the pool from the tiers", () => {
        const all = [...MODEL_TIERS.heavy, ...MODEL_TIERS.fast, ...MODEL_TIERS.last];
        expect(new Set(all).size).toBe(all.length);
        expect([...all].sort()).toEqual([...pool].sort());
        expect(MODEL_TIERS.heavy.length).toBeGreaterThanOrEqual(3);
        expect(MODEL_TIERS.fast.length).toBeGreaterThanOrEqual(3);
    });

    it("puts the smallest models at the very end for every query type", () => {
        for (const type of ["micro", "standard", "heavy"]) {
            const ranked = rankModelsByIntent(pool, type);
            expect(ranked.slice(-2)).toEqual(MODEL_TIERS.last);
            expect(ranked.indexOf("liquid/lfm-3-1.7b:free")).toBe(ranked.length - 2);
        }
    });

    it("leads with the heavy tier for heavy queries and the fast tier otherwise", () => {
        expect(rankModelsByIntent(pool, "heavy")[0]).toBe("nvidia/nemotron-3-ultra-550b-a55b:free");
        expect(rankModelsByIntent(pool, "micro")[0]).toBe("nvidia/nemotron-3.5-lightning:free");
        expect(rankModelsByIntent(pool, "standard")[0]).toBe("nvidia/nemotron-3.5-lightning:free");
        const heavyTop = rankModelsByIntent(pool, "heavy").slice(0, MODEL_TIERS.heavy.length);
        expect(heavyTop).toEqual([...MODEL_TIERS.heavy]);
    });
});