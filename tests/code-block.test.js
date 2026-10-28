import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import path from "path";
import process from "node:process";
import { copyCode } from "../src/chat/message-actions.js";

describe("code block font and asset integrity", () => {
    it("ensures roboto-mono-latin.woff2 font file exists and is valid", () => {
        const fontPath = path.resolve(process.cwd(), "fonts/roboto-mono-latin.woff2");
        expect(fs.existsSync(fontPath)).toBe(true);
        const stats = fs.statSync(fontPath);
        expect(stats.size).toBeGreaterThan(10000);
    });

    it("verifies tpl-code-block.html has modern IDE-style DOM elements", () => {
        const tplPath = path.resolve(process.cwd(), "templates/tpl-code-block.html");
        const content = fs.readFileSync(tplPath, "utf-8");
        expect(content).toContain("code-block-wrapper");
        expect(content).toContain("code-header");
        expect(content).toContain("code-dots");
        expect(content).toContain("code-dot red");
        expect(content).toContain("code-dot yellow");
        expect(content).toContain("code-dot green");
        expect(content).toContain("code-lang");
        expect(content).toContain("copy-btn");
        expect(content).toContain("copy-text");
    });

    it("verifies styles/chat.css includes Roboto Mono and syntax highlighting", () => {
        const cssPath = path.resolve(process.cwd(), "styles/chat.css");
        const css = fs.readFileSync(cssPath, "utf-8");
        expect(css).toContain("Roboto Mono");
        expect(css).toContain(".code-block-wrapper");
        expect(css).toContain(".code-header");
        expect(css).toContain(".hljs-keyword");
        expect(css).toContain(".hljs-string");
        expect(css).toContain(".hljs-number");
        expect(css).toContain("#bb9af7");
        expect(css).toContain("#9ece6a");
        expect(css).toContain("#ff9e64");
        expect(css).toContain("#131722");
    });
});

describe("copyCode action interaction", () => {
    it("updates copy text to Copied! and reverts back", async () => {
        vi.useFakeTimers();

        const wrapper = document.createElement("div");
        wrapper.className = "code-block-wrapper";
        wrapper.innerHTML = `
            <div class="code-header">
                <button class="copy-btn">
                    <img src="./assets/svg/copy.svg" width="14" height="14">
                    <span class="copy-text">Copy</span>
                </button>
            </div>
            <pre><code>print("hello")</code></pre>
        `;
        document.body.appendChild(wrapper);

        const btn = wrapper.querySelector(".copy-btn");
        const copyText = btn.querySelector(".copy-text");

        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn().mockResolvedValue(true)
            }
        });

        await copyCode(btn);

        expect(copyText.textContent).toBe("Copied!");

        vi.advanceTimersByTime(1600);

        expect(copyText.textContent).toBe("Copy");

        wrapper.remove();
        vi.useRealTimers();
    });
});
