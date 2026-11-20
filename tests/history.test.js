import { describe, it, expect } from "vitest";
import {
    compressUserMessage,
    compressAssistantMessage,
    trimMessages,
    getScheduleContext
} from "../src/chat/history.js";

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

    describe("getScheduleContext", () => {
        const dummyJadwal = {
            senin: [
                { nama_mata_kuliah: "implementasi dan pengujian perangkat lunak", jam: "11:30:00 - 14:30:00", lokasi: "DC-201" }
            ],
            selasa: [
                { nama_mata_kuliah: "manajemen projek tik", jam: "07:30:00 - 10:30:00", lokasi: "REK-402" }
            ]
        };

        it("returns schedule when query contains strong schedule keywords", () => {
            const res = getScheduleContext("jadwal kuliah?", dummyJadwal);
            expect(res).toContain("Senin 11:30-14:30 implementasi dan pengujian perangkat lunak DC-201");
            expect(res).toContain("Selasa 07:30-10:30 manajemen projek tik REK-402");
        });

        it("returns null for unrelated queries", () => {
            expect(getScheduleContext("halo apa kabar?", dummyJadwal)).toBeNull();
            expect(getScheduleContext("bagaimana cuaca hari ini?", dummyJadwal)).toBeNull();
        });

        it("filters by day when specific day is mentioned", () => {
            const res = getScheduleContext("jadwal kuliah hari senin?", dummyJadwal);
            expect(res).toContain("Senin 11:30-14:30");
            expect(res).not.toContain("Selasa");
        });

        it("preserves schedule context on continuation prompts with message history", () => {
            const history = [
                { role: "user", content: "jadwal kuliah?" },
                { role: "assistant", content: "Jadwal Kuliah:\nSenin | 11:30 – 14:30 | Implementasi dan Penguj" }
            ];
            const res = getScheduleContext("Lanjutkan dari titik terakhir.", dummyJadwal, history);
            expect(res).not.toBeNull();
            expect(res).toContain("Senin 11:30-14:30 implementasi dan pengujian perangkat lunak DC-201");
        });

        it("preserves specific day filter on continuation prompts", () => {
            const history = [
                { role: "user", content: "jadwal hari senin?" },
                { role: "assistant", content: "Senin: Implementasi dan Penguj" }
            ];
            const res = getScheduleContext("Lanjutkan", dummyJadwal, history);
            expect(res).not.toBeNull();
            expect(res).toContain("Senin 11:30-14:30");
            expect(res).not.toContain("Selasa");
        });
    });
});
