import { describe, it, expect } from "vitest";
import {
    compressUserMessage,
    compressAssistantMessage,
    trimMessages,
    estimateTokens
} from "./history.js";

describe("history compression", () => {
    it("compressUserMessage strips greeting and polite fluff from older user queries", () => {
        expect(compressUserMessage("Halo Meteor, apa rumus luas lingkaran?")).toBe("apa rumus luas lingkaran?");
        expect(compressUserMessage("Tolong jelaskan algoritma Dijkstra, terima kasih.")).toBe("jelaskan algoritma Dijkstra");
        expect(compressUserMessage("Permisi bisa tolong hitung 10 * 5?")).toBe("hitung 10 * 5?");
    });

    it("compressUserMessage retains pure queries without greetings", () => {
        expect(compressUserMessage("Berapa massa bumi?")).toBe("Berapa massa bumi?");
    });

    it("compressAssistantMessage replaces code and formulas with tags", () => {
        const text = "Berikut kodenya:\n```python\nprint(123)\n```\nDan rumusnya:\n$$E = mc^2$$\nSelesai.";
        const res = compressAssistantMessage(text);
        expect(res).toContain("[kode]");
        expect(res).toContain("[rumus]");
        expect(res).not.toContain("print(123)");
        expect(res).not.toContain("E = mc^2");
    });

    it("compressAssistantMessage preserves sentence boundaries on long texts", () => {
        const longText = "Langkah pertama adalah inisialisasi variabel. Langkah kedua adalah menjalankan loop untuk memproses data. Langkah ketiga adalah menampilkan hasil akhir kepada pengguna.";
        const res = compressAssistantMessage(longText);
        expect(res.endsWith(".") || res.endsWith("…")).toBe(true);
    });

    it("trimMessages compresses older turns and preserves recent turns", () => {
        const messages = [
            { role: "user", content: "Halo bot, tolong jelaskan BFS." },
            { role: "assistant", content: "BFS adalah breadth-first search.\n```python\nbfs()\n```" },
            { role: "user", content: "Bagaimana dengan DFS?" },
            { role: "assistant", content: "DFS adalah depth-first search." },
            { role: "user", content: "Dan Dijkstra?" },
            { role: "assistant", content: "Dijkstra mencari lintasan terpendek." }
        ];

        const trimmed = trimMessages(messages);
        expect(trimmed.length).toBe(6);
        expect(trimmed[0].content).not.toContain("Halo bot");
        expect(trimmed[1].content).toContain("[kode]");
        expect(trimmed[4].content).toBe("Dan Dijkstra?");
    });
});
