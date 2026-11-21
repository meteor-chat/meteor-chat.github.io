import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "fs";
import { callChatAPI, resetApiHealth } from "../src/chat/api/api-client.js";
import { parseStream } from "../src/chat/api/api-stream.js";
import { state } from "../src/core/app-state.js";

const { Response, ReadableStream, TextEncoder } = globalThis;
const encoder = new TextEncoder();

function sseBody(events) {
    const text = events.map((e) => `data: ${typeof e === "string" ? e : JSON.stringify(e)}\n\n`).join("");
    return new ReadableStream({
        start(controller) {
            controller.enqueue(encoder.encode(text));
            controller.close();
        }
    });
}

const content = (text, extra = {}) => ({ model: "nvidia/nemotron-3.5-lightning-20260807", choices: [{ delta: { content: text } }], ...extra });

describe("stream diagnostics", () => {
    it("returns the answering model, usage, and finish reason", async () => {
        const chunks = [];
        const events = [
            content("Ha"),
            content("lo", { choices: [{ delta: { content: "lo" }, finish_reason: "stop" }] }),
            { model: "ignored/later", choices: [], usage: { prompt_tokens: 5, completion_tokens: 9, completion_tokens_details: { reasoning_tokens: 4 } } },
            "[DONE]"
        ];
        const result = await parseStream(sseBody(events), (c) => chunks.push(c));        expect(chunks.join("")).toBe("Halo");
        expect(result.model).toBe("nvidia/nemotron-3.5-lightning-20260807");
        expect(result.finishReason).toBe("stop");
        expect(result.usage.completion_tokens_details.reasoning_tokens).toBe(4);
    });

    it("reports a null model when the provider never names one", async () => {
        const result = await parseStream(sseBody([{ choices: [{ delta: { content: "x" } }] }, "[DONE]"]), () => {});
        expect(result.model).toBeNull();
    });
});

describe("usage log diagnostics", () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
        vi.useFakeTimers();
        resetApiHealth();
        state.jadwalData = {};
        state.usageLog = [];
    });

    afterEach(() => {
        vi.useRealTimers();
        globalThis.fetch = originalFetch;
    });

    it("records the model, finish reason, and reasoning tokens of each answer", async () => {
        globalThis.fetch = vi.fn(async () => new Response(sseBody([
            content("Halo", { choices: [{ delta: { content: "Halo" }, finish_reason: "stop" }] }),
            { model: "x", choices: [], usage: { prompt_tokens: 12, completion_tokens: 30, total_tokens: 42, completion_tokens_details: { reasoning_tokens: 21 } } },
            "[DONE]"
        ]), { status: 200 }));
        const promise = callChatAPI([{ role: "user", content: "halo" }], () => {});
        await vi.advanceTimersByTimeAsync(2000);
        const result = await promise;
        expect(result.model).toBe("nvidia/nemotron-3.5-lightning-20260807");
        expect(state.usageLog).toHaveLength(1);
        expect(state.usageLog[0]).toMatchObject({
            model: "nvidia/nemotron-3.5-lightning-20260807",
            finishReason: "stop",
            reasoning_tokens: 21,
            completion_tokens: 30
        });
    });

    it("defaults reasoning tokens to zero when the provider omits the detail", async () => {
        globalThis.fetch = vi.fn(async () => new Response(sseBody([
            content("Halo"),
            { model: "x", choices: [], usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 } },
            "[DONE]"
        ]), { status: 200 }));
        const promise = callChatAPI([{ role: "user", content: "halo" }], () => {});
        await vi.advanceTimersByTimeAsync(2000);
        await promise;
        expect(state.usageLog[0].reasoning_tokens).toBe(0);
    });
});

describe("config formatting", () => {
    it("keeps the system message export on its own line", () => {
        const source = readFileSync("src/core/config.js", "utf8");
        expect(source).toMatch(/^export const SYSTEM_MESSAGE/m);
        expect(source).not.toMatch(/\};export const/);
    });
});
