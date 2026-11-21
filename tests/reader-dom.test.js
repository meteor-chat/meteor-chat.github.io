import { describe, it, expect, beforeEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import { createReaderApp } from "../src/lab/reader/reader-controller.js";

describe("Reader DOM, Routing & Compliance", () => {
    let container;

    beforeEach(() => {
        const html = fs.readFileSync(path.resolve(process.cwd(), "reader.html"), "utf8");
        const bodyContent = html.match(/<body>([\s\S]*?)<\/body>/i)[1];
        document.body.innerHTML = bodyContent;
        container = document.body;

        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn().mockResolvedValue()
            }
        });
        global.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
        global.URL.revokeObjectURL = vi.fn();
    });

    it("verifies lab routing and page parity", () => {
        const rootPage = fs.readFileSync(path.resolve(process.cwd(), "reader.html"), "utf8");
        const subPage = fs.readFileSync(path.resolve(process.cwd(), "reader/index.html"), "utf8");
        expect(rootPage).toBe(subPage);

        const labPage = fs.readFileSync(path.resolve(process.cwd(), "lab.html"), "utf8");
        expect(labPage).toContain('href="/reader"');
        expect(labPage).toContain("Web to Markdown Studio");
    });

    it("initializes app with default custom preset and handles tab switches", () => {
        const app = createReaderApp(container);
        expect(app.state.inputTab).toBe("url");
        expect(app.state.preset).toBe("custom");

        const tabHtml = container.querySelector('[data-reader-tab="html"]');
        const urlWrap = container.querySelector("#reader-url-wrap");
        const htmlWrap = container.querySelector("#reader-html-wrap");

        tabHtml.click();
        expect(app.state.inputTab).toBe("html");
        expect(urlWrap.style.display).toBe("none");
        expect(htmlWrap.style.display).toBe("flex");
    });

    it("extracts HTML input, updates editor, and syncs live preview", async () => {
        const app = createReaderApp(container);
        const tabHtml = container.querySelector('[data-reader-tab="html"]');
        tabHtml.click();

        const htmlInput = container.querySelector("#reader-html-input");
        htmlInput.value = "<article><h1>Tutorial Meteor</h1><p>Meteor adalah platform AI super cepat.</p></article>";

        const extractBtn = container.querySelector('[data-reader-action="extract"]');
        await extractBtn.click();

        const editor = container.querySelector("#reader-editor");
        const preview = container.querySelector("#reader-preview");

        expect(editor.value).toContain("# Tutorial Meteor");
        expect(editor.value).toContain("Meteor adalah platform AI super cepat.");
        expect(preview.innerHTML).toContain("Tutorial Meteor");

        const statWords = container.querySelector('[data-reader-stat="words"]');
        expect(Number(statWords.textContent)).toBeGreaterThan(0);
    });

    it("handles copy, download, and chat meteor actions", async () => {
        createReaderApp(container);
        const editor = container.querySelector("#reader-editor");
        editor.value = "# Artikel Uji Coba\n\nIsi konten markdown teruji.";

        const copyBtn = container.querySelector('[data-reader-action="copy"]');
        await copyBtn.click();
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(editor.value);

        const downloadBtn = container.querySelector('[data-reader-action="download"]');
        downloadBtn.click();
        expect(global.URL.createObjectURL).toHaveBeenCalled();

        const chatBtn = container.querySelector('[data-reader-action="chat"]');
        chatBtn.click();
        expect(sessionStorage.getItem("meteor_prefill_prompt")).toContain("Tolong rangkum dan jelaskan");
    });

    it("toggles mobile views between editor and preview", () => {
        const app = createReaderApp(container);
        const previewTab = container.querySelector('[data-reader-view="preview"]');
        previewTab.click();

        expect(app.state.mobileView).toBe("preview");
        const editorPane = container.querySelector(".reader-pane-editor");
        const previewPane = container.querySelector(".reader-pane-preview");
        expect(editorPane.getAttribute("data-active")).toBe("false");
        expect(previewPane.getAttribute("data-active")).toBe("true");
    });

    it("satisfies strict file constraints: <= 300 lines, zero comments, zero em-dashes", () => {
        const files = [
            "src/lab/reader/reader-engine.js",
            "src/lab/reader/reader-controller.js",
            "styles/reader.css",
            "reader.html",
            "reader/index.html",
            "tests/reader-engine.test.js",
            "tests/reader-dom.test.js"
        ];
        const slashLineRe = new RegExp("(^|\\s)/" + "/");
        const blockComRe = new RegExp("/" + "\\*");

        for (const file of files) {
            const filePath = path.resolve(process.cwd(), file);
            const content = fs.readFileSync(filePath, "utf8");
            const lines = content.split("\n");

            expect(lines.length).toBeLessThanOrEqual(300);
            expect(content).not.toContain("\u2014");

            for (let i = 0; i < lines.length; i += 1) {
                const line = lines[i];
                expect(slashLineRe.test(line)).toBe(false);
                expect(blockComRe.test(line)).toBe(false);
                expect(line.includes("<!-" + "-")).toBe(false);
            }
        }
    });
});
