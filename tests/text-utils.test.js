import { describe, it, expect } from "vitest";
import { stripThinkTags, escapeHTML, getMaxTokens, getQueryType } from "../src/core/text-utils.js";

describe("stripThinkTags", () => {
    it("removes complete think tags", () => {
        expect(stripThinkTags("<think>some thoughts</think>Hello")).toBe("Hello");
    });

    it("removes unclosed think tags", () => {
        expect(stripThinkTags("Hello<think>thinking...")).toBe("Hello");
    });

    it("removes closing think tags without opening", () => {
        expect(stripThinkTags("thoughts</think>Hello")).toBe("Hello");
    });

    it("removes partial opening think tag at the end (streaming)", () => {
        expect(stripThinkTags("Hello <thi")).toBe("Hello");
    });

    it("removes thought and reasoning tags", () => {
        expect(stripThinkTags("<thought>analysis</thought>Selamat pagi!")).toBe("Selamat pagi!");
        expect(stripThinkTags("<reasoning>evaluating rules</reasoning>Tentu.")).toBe("Tentu.");
    });

    it("removes raw thinking process header when answer follows", () => {
        const text = "Here's a thinking process:\n\nAnalyze User Input:\nUser says: 'halo'\n\nHalo! Senang bisa menyapa Anda.";
        expect(stripThinkTags(text)).toBe("Halo! Senang bisa menyapa Anda.");
    });

    it("removes raw thinking process with explicit answer label", () => {
        const text = "Thinking Process:\n1. Evaluating constraints\n2. User requests greeting\n\nFinal Answer:\nHalo! Ada yang bisa saya bantu hari ini?";
        expect(stripThinkTags(text)).toBe("Halo! Ada yang bisa saya bantu hari ini?");
    });

    it("returns empty string when output is 100% truncated CoT monologue", () => {
        const text = "Here's a thinking process:\n\nAnalyze User Input:\nUser says: 'halo'\nThere's a system note: Waktu saat ini\nRules summary:\n- Identity: Aku Meteor";
        expect(stripThinkTags(text)).toBe("");
    });

    it("preserves direct greetings without touching them", () => {
        const greeting = "Halo! Ada yang bisa saya bantu hari ini?";
        expect(stripThinkTags(greeting)).toBe(greeting);
    });
});

describe("escapeHTML", () => {
    it("escapes basic html", () => {
        expect(escapeHTML('<script>alert("x")</script>')).toBe("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    });
});

describe("getMaxTokens & getQueryType", () => {
    it("classifies micro queries and returns 384 tokens", () => {
        expect(getQueryType("Halo Meteor")).toBe("micro");
        expect(getMaxTokens("Halo Meteor")).toBe(384);
        expect(getMaxTokens("Apa ibukota Australia?")).toBe(384);
    });

    it("classifies standard queries and returns 1024 tokens", () => {
        expect(getQueryType("Jelaskan perbedaan fotosintesis dan kemosintesis")).toBe("standard");
        expect(getMaxTokens("Jelaskan perbedaan fotosintesis dan kemosintesis")).toBe(1024);
    });

    it("classifies procedural and recipe queries as standard", () => {
        expect(getQueryType("cara membuat nasi goreng")).toBe("standard");
        expect(getMaxTokens("cara membuat nasi goreng")).toBe(1024);
        expect(getQueryType("resep sambal matah")).toBe("standard");
        expect(getQueryType("tutorial git rebase")).toBe("standard");
        expect(getQueryType("panduan konfigurasi ssh")).toBe("standard");
    });

    it("classifies heavy code requests and returns 2560 tokens", () => {
        expect(getQueryType("Tolong buatkan kode python")).toBe("heavy");
        expect(getMaxTokens("Tolong buatkan kode python")).toBe(2560);
    });

    it("matches whole words only", () => {
        expect(getMaxTokens("buatkan program")).toBe(2560);
        expect(getMaxTokens("apakah ini bekerja?")).toBe(384);
    });
});
