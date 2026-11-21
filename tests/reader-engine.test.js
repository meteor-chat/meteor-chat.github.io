import { describe, it, expect, vi } from "vitest";
import {
    cleanDomTree,
    findMainContentElement,
    extractArticleMetadata,
    htmlToMarkdown,
    applyMarkdownPreset,
    calculateStats,
    slugify,
    fetchArticleFromUrl
} from "../src/lab/reader/reader-engine.js";

describe("Reader Engine - Content Extraction & Markdown Conversion", () => {
    it("extracts article metadata accurately from DOM meta tags and title", () => {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Panduan Belajar JavaScript - Blog</title>
                <meta name="author" content="Aarif Rahmaan">
                <meta property="og:title" content="Panduan Belajar JavaScript Modern">
                <meta name="description" content="Tutorial lengkap JavaScript modern dari dasar hingga mahir.">
                <meta property="article:published_time" content="2026-11-20T10:00:00Z">
            </head>
            <body></body>
            </html>
        `;
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const meta = extractArticleMetadata(doc, "https://contoh.com/artikel");

        expect(meta.title).toBe("Panduan Belajar JavaScript Modern");
        expect(meta.author).toBe("Aarif Rahmaan");
        expect(meta.description).toBe("Tutorial lengkap JavaScript modern dari dasar hingga mahir.");
        expect(meta.date).toBe("2026-11-20T10:00:00Z");
        expect(meta.url).toBe("https://contoh.com/artikel");
    });

    it("cleans unwanted boilerplate DOM elements (scripts, nav, ads, footers)", () => {
        const div = document.createElement("div");
        div.innerHTML = `
            <nav>Menu Navigasi</nav>
            <div class="ads-banner">Iklan Sponsor</div>
            <article>
                <h1>Judul Utama</h1>
                <p>Isi artikel yang berharga.</p>
                <script>console.log("tracker")</script>
            </article>
            <footer>Hak Cipta</footer>
        `;
        cleanDomTree(div);
        expect(div.querySelector("nav")).toBeNull();
        expect(div.querySelector("footer")).toBeNull();
        expect(div.querySelector("script")).toBeNull();
        expect(div.querySelector(".ads-banner")).toBeNull();
        expect(div.querySelector("p").textContent).toBe("Isi artikel yang berharga.");
    });

    it("finds the primary content container using article or main tags", () => {
        const html = `
            <div>
                <header>Header</header>
                <article>
                    <p>Paragraf pertama artikel panjang yang informatif untuk pembaca di internet.</p>
                    <p>Paragraf kedua artikel yang memiliki bobot informasi penting dan relevan.</p>
                </article>
            </div>
        `;
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const main = findMainContentElement(doc);
        expect(main).not.toBeNull();
        expect(main.tagName.toLowerCase()).toBe("article");
    });

    it("converts HTML elements into clean GitHub Flavored Markdown", () => {
        const html = `
            <article>
                <h1>Pengantar Algoritma</h1>
                <p>Berikut adalah <strong>konsep penting</strong> dan <em>istilah dasar</em>.</p>
                <blockquote>Algoritma adalah langkah logis terstruktur.</blockquote>
                <ul>
                    <li>Pencarian biner</li>
                    <li>Pengurutan cepat</li>
                </ul>
                <pre><code class="language-js">const x = 42;</code></pre>
                <table>
                    <thead><tr><th>Nama</th><th>Nilai</th></tr></thead>
                    <tbody><tr><td>Alpha</td><td>100</td></tr></tbody>
                </table>
                <p>Baca di <a href="https://example.com">Tautan Resmi</a></p>
                <img src="https://example.com/banner.png" alt="Banner Algoritma">
            </article>
        `;
        const result = htmlToMarkdown(html);
        expect(result.markdown).toContain("# Pengantar Algoritma");
        expect(result.markdown).toContain("**konsep penting**");
        expect(result.markdown).toContain("*istilah dasar*");
        expect(result.markdown).toContain("> Algoritma adalah langkah logis terstruktur.");
        expect(result.markdown).toContain("- Pencarian biner");
        expect(result.markdown).toContain("```js\nconst x = 42;\n```");
        expect(result.markdown).toContain("| Nama | Nilai |");
        expect(result.markdown).toContain("| Alpha | 100 |");
        expect(result.markdown).toContain("[Tautan Resmi](https://example.com)");
        expect(result.markdown).toContain("![Banner Algoritma](https://example.com/banner.png)");
    });

    it("applies formatting presets (minimal, pkm, and custom)", () => {
        const sampleData = {
            title: "Belajar Rust",
            markdown: "Rust menjamin memory safety tanpa garbage collector.",
            metadata: {
                author: "Ferris",
                url: "https://rust-lang.org",
                date: "2026-01-15T00:00:00Z"
            }
        };

        const minimal = applyMarkdownPreset(sampleData, "minimal");
        expect(minimal).toBe("# Belajar Rust\n\nRust menjamin memory safety tanpa garbage collector.");

        const pkm = applyMarkdownPreset(sampleData, "pkm");
        expect(pkm).toContain("---");
        expect(pkm).toContain('title: "Belajar Rust"');
        expect(pkm).toContain('author: "Ferris"');
        expect(pkm).toContain("tags:");
        expect(pkm).toContain("- web-clip");
        expect(pkm).toContain("# Belajar Rust");

        const custom = applyMarkdownPreset(sampleData, "custom", { frontmatter: true });
        expect(custom).toContain("---");
        expect(custom).toContain('title: "Belajar Rust"');
    });

    it("calculates reading statistics and slugifies titles", () => {
        const text = "Satu dua tiga empat lima enam tujuh delapan sembilan sepuluh.";
        const stats = calculateStats(text);
        expect(stats.words).toBe(10);
        expect(stats.chars).toBe(text.length);
        expect(stats.readingTimeMinutes).toBe(1);

        expect(slugify("Cara Membuat Nasi Goreng Spesial 2026!"))
            .toBe("cara-membuat-nasi-goreng-spesial-2026");
    });

    it("fetches article from URL with reader service or proxy fallback", async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            text: async () => "# Judul Artikel Web\n\nKonten artikel dari layanan reader eksternal yang sangat bersih dan lengkap."
        });

        const res = await fetchArticleFromUrl("https://example.com/post", mockFetch);
        expect(res.success).toBe(true);
        expect(res.title).toBe("Judul Artikel Web");
        expect(res.markdown).toContain("layanan reader eksternal");
    });
});
