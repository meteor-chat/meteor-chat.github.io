import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { callChatAPI, resetApiHealth } from "../src/chat/api/api-client.js";
import { CHOICE_GUIDE } from "../src/core/config.js";
import { state } from "../src/core/app-state.js";
import { getMaxTokens, getQueryType, isChoiceQuery } from "../src/core/text-utils.js";

const { Response, ReadableStream, TextEncoder } = globalThis;

const POSITIVE = [
    "untuk urusan backend, lebih baik pakai javascript atau pakai python?",
    "python vs javascript untuk backend?",
    "Python VS JavaScript",
    "mending MySQL atau PostgreSQL untuk proyek kecil?",
    "React versus Vue untuk pemula?",
    "sebaiknya belajar Linux atau Windows untuk programmer pemula?",
    "apa perbedaan let dan const di JavaScript?",
    "apa bedanya http dan https",
    "bagusan laptop atau pc?",
    "enakan pakai tab atau spasi?",
    "pilih yang mana, ps5 atau xbox?",
    "Flask dibandingkan Django, gimana?",
    "lebih  baik kuliah atau kerja dulu?"
];

const NEGATIVE = [
    "",
    "   ",
    "halo",
    "ibukota Jepang?",
    "apakah ini bekerja atau tidak?",
    "apakah HTML harus selalu didampingi dengan CSS?",
    "jelaskan cara kerja fotosintesis",
    "aku suka vsync di game",
    "pilihan warna favoritmu apa",
    "buatkan kode python untuk sorting"
];

describe("choice query detection", () => {
    it("detects choice and comparison questions", () => {
        for (const text of POSITIVE) expect(isChoiceQuery(text), text).toBe(true);
    });

    it("ignores ordinary questions and handles empty input", () => {
        for (const text of NEGATIVE) expect(isChoiceQuery(text), text).toBe(false);
        expect(isChoiceQuery(null)).toBe(false);
        expect(isChoiceQuery(undefined)).toBe(false);
    });

    it("classifies short choice questions as standard instead of micro", () => {
        expect(getQueryType("python vs javascript?")).toBe("standard");
        expect(getQueryType("React vs Vue")).toBe("standard");
        expect(getMaxTokens("python vs javascript?")).toBe(1024);
    });

    it("keeps heavy requests heavy and light requests light", () => {
        expect(getQueryType("buatkan kode python untuk sorting")).toBe("heavy");
        expect(getQueryType("buatkan program vs code extension")).toBe("heavy");
        expect(getQueryType("Halo Meteor")).toBe("micro");
        expect(getQueryType("Apa ibukota Australia?")).toBe("micro");
        expect(getQueryType("apakah ini bekerja?")).toBe("micro");
    });
});

describe("choice guide injection", () => {
    const originalFetch = globalThis.fetch;
    const encoder = new TextEncoder();

    function mockFetch() {
        const bodies = [];
        globalThis.fetch = vi.fn(async (url, init) => {
            bodies.push(JSON.parse(init.body));
            const chunk = { model: "m/x", choices: [{ delta: { content: "Jawaban" }, finish_reason: "stop" }] };
            const body = new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\ndata: [DONE]\n\n`));
                    controller.close();
                }
            });
            return new Response(body, { status: 200 });
        });
        return bodies;
    }

    async function ask(text) {
        const promise = callChatAPI([{ role: "user", content: text }], () => {});
        await vi.advanceTimersByTimeAsync(2000);
        await promise;
    }

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

    const systemOf = (body) => body.messages.find((m) => m.role === "system").content;

    it("adds the guide to the system message for choice questions only", async () => {
        const bodies = mockFetch();
        await ask("untuk urusan backend, lebih baik pakai javascript atau pakai python?");
        await ask("halo");
        await ask("ibukota Jepang?");
        expect(systemOf(bodies[0])).toContain(CHOICE_GUIDE);
        expect(systemOf(bodies[1])).not.toContain(CHOICE_GUIDE);
        expect(systemOf(bodies[2])).not.toContain(CHOICE_GUIDE);
    });

    it("keeps the base system message and time note when the guide is added", async () => {
        const bodies = mockFetch();
        await ask("python vs javascript untuk backend?");
        const system = systemOf(bodies[0]);
        expect(system).toContain("Kamu Meteor");
        expect(system).toContain("Waktu saat ini");
        expect(system.indexOf("Waktu saat ini")).toBeLessThan(system.indexOf(CHOICE_GUIDE));
    });

    it("describes the target answer shape without forbidding short answers elsewhere", () => {
        expect(CHOICE_GUIDE).toContain("150 sampai 300 kata");
        expect(CHOICE_GUIDE).toContain("tegas");
        expect(CHOICE_GUIDE.startsWith("[System Note:")).toBe(true);
        expect(CHOICE_GUIDE.endsWith("]")).toBe(true);
    });
});
