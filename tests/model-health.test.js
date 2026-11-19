import { describe, it, expect } from "vitest";
import { classifyError } from "../src/chat/api/api-client.js";
import { MODEL_COOLDOWN, createModelHealth } from "../src/chat/api/api-dispatch.js";

function makeClock(start = 1000) {
    let value = start;
    return { now: () => value, advance: (ms) => { value += ms; } };
}

describe("model health", () => {
    it("starts empty", () => {
        const health = createModelHealth(makeClock().now);
        expect(health.excluded()).toEqual([]);
        expect(health.isCooling("a/b:free")).toBe(false);
    });

    it("marks models as cooling until the cooldown expires", () => {
        const clock = makeClock();
        const health = createModelHealth(clock.now);
        health.markFailed(["a/one:free", "b/two:free"], 60000);
        expect(health.excluded().sort()).toEqual(["a/one:free", "b/two:free"]);
        expect(health.isCooling("a/one:free")).toBe(true);
        clock.advance(59999);
        expect(health.isCooling("a/one:free")).toBe(true);
        clock.advance(1);
        expect(health.excluded()).toEqual([]);
        expect(health.isCooling("a/one:free")).toBe(false);
    });

    it("tracks different cooldown lengths per model and refreshes a repeated failure", () => {
        const clock = makeClock();
        const health = createModelHealth(clock.now);
        health.markFailed(["a/one:free"], MODEL_COOLDOWN.server_error);
        health.markFailed(["b/two:free"], MODEL_COOLDOWN.rate_limit);
        clock.advance(MODEL_COOLDOWN.server_error);
        expect(health.excluded()).toEqual(["b/two:free"]);
        clock.advance(20000);
        health.markFailed(["b/two:free"], MODEL_COOLDOWN.rate_limit);
        clock.advance(MODEL_COOLDOWN.rate_limit - 1);
        expect(health.isCooling("b/two:free")).toBe(true);
    });

    it("clears every failure on demand", () => {
        const health = createModelHealth(makeClock().now);
        health.markFailed(["a/one:free"], 60000);
        health.clear();
        expect(health.excluded()).toEqual([]);
    });

    it("uses a one minute cooldown for rate limits and half a minute for server errors", () => {
        expect(MODEL_COOLDOWN.rate_limit).toBe(60000);
        expect(MODEL_COOLDOWN.server_error).toBe(30000);
    });
});

describe("error scope classification", () => {
    it("treats free-model platform limits as platform scope", () => {
        const day = classifyError(429, null, "Rate limit exceeded: free-models-per-day");
        expect(day.type).toBe("RATE_LIMIT");
        expect(day.scope).toBe("platform");
        expect(day.cooldown).toBe(3600000);
        const minute = classifyError(429, null, "Rate limit exceeded: free-models-per-min");
        expect(minute.scope).toBe("platform");
        expect(minute.cooldown).toBe(10000);
        expect(classifyError(429, null, "limit of 20 requests per minute").scope).toBe("platform");
    });

    it("treats provider side limits as upstream scope and honors retry-after", () => {
        const err = classifyError(429, "7", "Provider returned error");
        expect(err.scope).toBe("upstream");
        expect(err.cooldown).toBe(7000);
        expect(classifyError(429, "500", "").cooldown).toBe(60000);
        expect(classifyError(429, null, "").cooldown).toBe(10000);
    });

    it("keeps other error types intact and defaults them to upstream scope", () => {
        expect(classifyError(401, null, "").type).toBe("AUTH");
        expect(classifyError(402, null, "").type).toBe("AUTH");
        expect(classifyError(503, null, "").type).toBe("SERVER");
        expect(classifyError(400, null, "").type).toBe("FATAL");
        expect(classifyError(503, null, "").scope).toBe("upstream");
    });
});
