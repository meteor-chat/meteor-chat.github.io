import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { callChatAPI, getModelCooldowns, resetApiHealth } from "../src/chat/api/api-client.js";
import { state } from "../src/core/app-state.js";

const { Response, ReadableStream, TextEncoder } = globalThis;
const encoder = new TextEncoder();

function streamResponse(text = "Halo") {
    const body = new ReadableStream({
        start(controller) {
            const chunk = { choices: [{ delta: { content: text }, finish_reason: "stop" }] };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\ndata: [DONE]\n\n`));
            controller.close();
        }
    });
    return new Response(body, { status: 200 });
}

function errorResponse(status, message = "Provider returned error") {
    return new Response(JSON.stringify({ error: { message, code: status } }), { status });
}

function installFetch(responses) {
    const bodies = [];
    const mock = vi.fn(async (url, init) => {
        bodies.push(JSON.parse(init.body));
        const next = responses.shift();
        return typeof next === "function" ? next() : next;
    });
    globalThis.fetch = mock;
    return { bodies, mock };
}

async function run(messages = [{ role: "user", content: "halo" }]) {
    const promise = callChatAPI(messages, () => {});
    await vi.advanceTimersByTimeAsync(5000);
    return promise;
}

describe("chat api model pool", () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
        vi.useFakeTimers();
        resetApiHealth();
        state.jadwalData = {};
        state.usageLog = [];
        state.messages = [];
    });

    afterEach(() => {
        vi.useRealTimers();
        globalThis.fetch = originalFetch;
    });

    it("sends three distinct free models per request", async () => {
        const { bodies } = installFetch([() => streamResponse()]);
        const result = await run();
        expect(result.text).toBe("Halo");
        expect(bodies[0].models).toHaveLength(3);
        expect(new Set(bodies[0].models).size).toBe(3);
        for (const m of bodies[0].models) expect(m).toMatch(/:free$/);
        expect(getModelCooldowns()).toEqual([]);
    });

    it("skips the models that just hit an upstream 429 on the next attempt", async () => {
        const { bodies } = installFetch([() => errorResponse(429), () => streamResponse()]);
        const result = await run();
        expect(result.text).toBe("Halo");
        expect(bodies).toHaveLength(2);
        const overlap = bodies[0].models.filter((m) => bodies[1].models.includes(m));
        expect(overlap).toHaveLength(0);
        expect(getModelCooldowns().sort()).toEqual([...bodies[0].models].sort());
    });

    it("keeps model cooldowns out of platform wide free limits", async () => {
        const { bodies } = installFetch([
            () => errorResponse(429, "Rate limit exceeded: free-models-per-day"),
            () => streamResponse()
        ]);
        await run();
        expect(bodies).toHaveLength(2);
        expect(getModelCooldowns()).toEqual([]);
    });

    it("cools down models after a server error for a shorter time", async () => {
        const { bodies } = installFetch([() => errorResponse(503), () => streamResponse()]);
        await run();
        expect(getModelCooldowns().sort()).toEqual([...bodies[0].models].sort());
        await vi.advanceTimersByTimeAsync(24000);
        expect(getModelCooldowns()).toHaveLength(3);
        await vi.advanceTimersByTimeAsync(2000);
        expect(getModelCooldowns()).toEqual([]);
    });

    it("releases rate limited models after a minute", async () => {
        installFetch([() => errorResponse(429), () => streamResponse()]);
        await run();
        expect(getModelCooldowns()).toHaveLength(3);
        await vi.advanceTimersByTimeAsync(54000);
        expect(getModelCooldowns()).toHaveLength(3);
        await vi.advanceTimersByTimeAsync(2000);
        expect(getModelCooldowns()).toEqual([]);
    });

    it("walks through different models while several requests keep failing", async () => {
        const { bodies } = installFetch([
            () => errorResponse(429),
            () => errorResponse(429),
            () => streamResponse()
        ]);
        await run();
        expect(bodies).toHaveLength(3);
        const seen = new Set(bodies.flatMap((b) => b.models));
        expect(seen.size).toBeGreaterThan(5);
        expect(bodies[0].models.filter((m) => bodies[1].models.includes(m))).toHaveLength(0);
    });

    it("prefers the heavy tier for code questions and the fast tier for small talk", async () => {
        const heavy = installFetch([() => streamResponse()]);
        await run([{ role: "user", content: "Buatkan fungsi javascript untuk mengurutkan array dengan quicksort dan jelaskan kompleksitasnya" }]);
        const heavyFirst = heavy.bodies[0].models[0];
        resetApiHealth();
        const light = installFetch([() => streamResponse()]);
        await run([{ role: "user", content: "hai" }]);
        const lightFirst = light.bodies[0].models[0];
        expect(heavyFirst).not.toBe(lightFirst);
    });
});
