import { describe, it, expect } from "vitest";
import { MODEL_TIERS, PROVIDERS } from "../src/core/config.js";
import { selectModels } from "../src/chat/api/api-dispatch.js";

const pool = PROVIDERS.openrouter.models;
const SMALLEST = "liquid/lfm-3-1.7b:free";

function simulate(queryType, requests, excluded = []) {
    const usage = new Map();
    const batches = [];
    let index = 0;
    for (let i = 0; i < requests; i += 1) {
        const { models, nextIndex } = selectModels(pool, queryType, index, 3, excluded);
        index = nextIndex;
        batches.push(models);
        for (const m of models) usage.set(m, (usage.get(m) || 0) + 1);
    }
    return { usage, batches };
}

describe("tier aware model selection", () => {
    it("always returns three distinct models from the full pool", () => {
        for (const type of ["micro", "standard", "heavy"]) {
            const { batches } = simulate(type, 40);
            for (const batch of batches) {
                expect(batch).toHaveLength(3);
                expect(new Set(batch).size).toBe(3);
                for (const m of batch) expect(pool).toContain(m);
            }
        }
    });

    it("draws the three slots from the intent tier and rotates across all of it", () => {
        const heavy = simulate("heavy", 12);
        for (const batch of heavy.batches) {
            for (const m of batch) expect(MODEL_TIERS.heavy).toContain(m);
        }
        for (const m of MODEL_TIERS.heavy) expect(heavy.usage.get(m), m).toBeGreaterThan(0);

        const fast = simulate("standard", 12);
        for (const batch of fast.batches) {
            for (const m of batch) expect(MODEL_TIERS.fast).toContain(m);
        }
        for (const m of MODEL_TIERS.fast) expect(fast.usage.get(m), m).toBeGreaterThan(0);
    });

    it("moves to a disjoint group of models on consecutive heavy requests", () => {
        const { batches } = simulate("heavy", 2);
        const overlap = batches[0].filter((m) => batches[1].includes(m));
        expect(overlap).toHaveLength(0);
    });

    it("spreads load evenly within a tier", () => {
        const { usage } = simulate("heavy", 60);
        const counts = MODEL_TIERS.heavy.map((m) => usage.get(m));
        expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
    });

    it("never puts the smallest model in front while other models are available", () => {
        for (const type of ["micro", "standard", "heavy"]) {
            const { batches } = simulate(type, 60);
            for (const batch of batches) expect(batch).not.toContain(SMALLEST);
        }
    });

    it("skips excluded models and borrows from the other tiers when a tier runs short", () => {
        const excluded = MODEL_TIERS.heavy.slice(0, 5);
        const { batches } = simulate("heavy", 10, excluded);
        for (const batch of batches) {
            expect(batch).toHaveLength(3);
            for (const m of excluded) expect(batch).not.toContain(m);
            expect(batch[0]).toBe(MODEL_TIERS.heavy[5]);
        }
    });

    it("still returns models when every model is excluded", () => {
        const { models } = selectModels(pool, "heavy", 0, 3, [...pool]);
        expect(models).toHaveLength(3);
        expect(MODEL_TIERS.heavy).toContain(models[0]);
    });

    it("tops up with excluded models when too few usable models remain", () => {
        const excluded = pool.filter((m) => m !== MODEL_TIERS.heavy[0]);
        const { models } = selectModels(pool, "heavy", 0, 3, excluded);
        expect(models).toHaveLength(3);
        expect(models[0]).toBe(MODEL_TIERS.heavy[0]);
        expect(new Set(models).size).toBe(3);
    });

    it("handles small pools, large counts, and empty input", () => {
        const two = ["a/one:free", "b/two:free"];
        expect(selectModels(two, "micro", 0, 5).models).toHaveLength(2);
        expect(selectModels([], "heavy", 3, 3)).toEqual({ models: [], nextIndex: 0 });
        expect(selectModels(null, "heavy")).toEqual({ models: [], nextIndex: 0 });
        const one = selectModels(["only/model:free"], "heavy", 7, 3);
        expect(one.models).toEqual(["only/model:free"]);
        expect(Number.isFinite(one.nextIndex)).toBe(true);
    });

    it("keeps working with unknown models that are not in any tier", () => {
        const custom = ["x/unknown:free", MODEL_TIERS.fast[0]];
        const { models } = selectModels(custom, "micro", 0, 2);
        expect(models).toEqual([MODEL_TIERS.fast[0], "x/unknown:free"]);
    });
});