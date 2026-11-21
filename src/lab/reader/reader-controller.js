import {
    fetchArticleFromUrl,
    htmlToMarkdown,
    applyMarkdownPreset,
    calculateStats,
    slugify
} from "./reader-engine.js";

function escapeForHtml(str) {
    return (str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function renderSimpleMarkdown(md) {
    if (!md) return "<p class=\"reader-placeholder\">Hasil ekstraksi artikel akan tampil di sini...</p>";
    const lines = md.split("\n");
    let html = "";
    let inList = false;
    let inCode = false;
    let codeBuffer = [];

    for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        if (line.startsWith("```")) {
            if (inCode) {
                html += `<pre><code>${escapeForHtml(codeBuffer.join("\n"))}</code></pre>`;
                codeBuffer = [];
                inCode = false;
            } else {
                inCode = true;
            }
            continue;
        }
        if (inCode) {
            codeBuffer.push(line);
            continue;
        }
        if (line.startsWith("# ")) {
            html += `<h1>${escapeForHtml(line.slice(2))}</h1>`;
        } else if (line.startsWith("## ")) {
            html += `<h2>${escapeForHtml(line.slice(3))}</h2>`;
        } else if (line.startsWith("### ")) {
            html += `<h3>${escapeForHtml(line.slice(4))}</h3>`;
        } else if (line.startsWith("- ")) {
            if (!inList) { html += "<ul>"; inList = true; }
            html += `<li>${escapeForHtml(line.slice(2))}</li>`;
        } else if (/^\d+\.\s/.test(line)) {
            if (!inList) { html += "<ol>"; inList = true; }
            html += `<li>${escapeForHtml(line.replace(/^\d+\.\s/, ""))}</li>`;
        } else if (line.startsWith("> ")) {
            html += `<blockquote>${escapeForHtml(line.slice(2))}</blockquote>`;
        } else if (line.startsWith("---")) {
            html += "<hr>";
        } else if (line.trim().length > 0) {
            if (inList) { html += "</ul>"; inList = false; }
            html += `<p>${escapeForHtml(line)}</p>`;
        }
    }
    if (inList) html += "</ul>";
    return html;
}

export function createReaderApp(root = document.body) {
    if (!root) return null;

    const state = {
        inputTab: "url",
        preset: "custom",
        mobileView: "editor",
        options: { frontmatter: true, keepImages: true, keepLinks: true, keepTables: true },
        data: null,
        loading: false
    };

    const urlInput = root.querySelector("#reader-url-input");
    const htmlInput = root.querySelector("#reader-html-input");
    const urlWrap = root.querySelector("#reader-url-wrap");
    const htmlWrap = root.querySelector("#reader-html-wrap");
    const tabBtns = root.querySelectorAll("[data-reader-tab]");
    const presetBtns = root.querySelectorAll("[data-reader-preset]");
    const optBtns = root.querySelectorAll("[data-reader-opt]");
    const extractBtn = root.querySelector("[data-reader-action=\"extract\"]");
    const editorEl = root.querySelector("#reader-editor");
    const previewEl = root.querySelector("#reader-preview");
    const copyBtn = root.querySelector("[data-reader-action=\"copy\"]");
    const downloadBtn = root.querySelector("[data-reader-action=\"download\"]");
    const chatBtn = root.querySelector("[data-reader-action=\"chat\"]");
    const statWords = root.querySelector("[data-reader-stat=\"words\"]");
    const statChars = root.querySelector("[data-reader-stat=\"chars\"]");
    const statTime = root.querySelector("[data-reader-stat=\"time\"]");
    const viewBtns = root.querySelectorAll("[data-reader-view]");
    const toastEl = root.querySelector("#reader-toast");

    const showToast = (msg, duration = 2400) => {
        if (!toastEl) return;
        toastEl.textContent = msg;
        toastEl.classList.add("visible");
        setTimeout(() => toastEl.classList.remove("visible"), duration);
    };

    const updateStats = (text) => {
        const stats = calculateStats(text);
        if (statWords) statWords.textContent = String(stats.words);
        if (statChars) statChars.textContent = String(stats.chars);
        if (statTime) statTime.textContent = `${stats.readingTimeMinutes} mnt`;
    };

    const syncEditorAndPreview = () => {
        if (!state.data) return;
        const formatted = applyMarkdownPreset(state.data, state.preset, state.options);
        if (editorEl) editorEl.value = formatted;
        if (previewEl) previewEl.innerHTML = renderSimpleMarkdown(formatted);
        updateStats(formatted);
    };

    const handleExtract = async () => {
        if (state.loading) return;
        state.loading = true;
        if (extractBtn) {
            extractBtn.classList.add("loading");
            extractBtn.setAttribute("disabled", "true");
        }

        try {
            if (state.inputTab === "url") {
                const targetUrl = urlInput ? urlInput.value.trim() : "";
                if (!targetUrl) throw new Error("Silakan masukkan URL artikel web.");
                const result = await fetchArticleFromUrl(targetUrl);
                state.data = {
                    title: result.title,
                    markdown: result.markdown,
                    metadata: result.metadata || { url: targetUrl }
                };
            } else {
                const rawHtml = htmlInput ? htmlInput.value.trim() : "";
                if (!rawHtml) throw new Error("Silakan tempelkan kode HTML artikel.");
                const result = htmlToMarkdown(rawHtml, state.options);
                state.data = {
                    title: result.title || "Artikel Tempelan",
                    markdown: result.markdown,
                    metadata: result.metadata
                };
            }
            syncEditorAndPreview();
            showToast("Artikel berhasil diekstraksi!");
        } catch (err) {
            showToast(err.message || "Gagal mengekstrak artikel.");
        } finally {
            state.loading = false;
            if (extractBtn) {
                extractBtn.classList.remove("loading");
                extractBtn.removeAttribute("disabled");
            }
        }
    };

    tabBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            const tab = btn.getAttribute("data-reader-tab");
            if (!tab) return;
            state.inputTab = tab;
            tabBtns.forEach((b) => b.setAttribute("aria-selected", String(b === btn)));
            if (urlWrap) urlWrap.style.display = tab === "url" ? "flex" : "none";
            if (htmlWrap) htmlWrap.style.display = tab === "html" ? "flex" : "none";
        });
    });

    presetBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            const p = btn.getAttribute("data-reader-preset");
            if (!p) return;
            state.preset = p;
            presetBtns.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
            syncEditorAndPreview();
        });
    });

    optBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            const opt = btn.getAttribute("data-reader-opt");
            if (!opt) return;
            state.options[opt] = !state.options[opt];
            btn.setAttribute("aria-pressed", String(state.options[opt]));
            syncEditorAndPreview();
        });
    });

    if (editorEl) {
        editorEl.addEventListener("input", () => {
            const val = editorEl.value;
            if (previewEl) previewEl.innerHTML = renderSimpleMarkdown(val);
            updateStats(val);
        });
    }

    if (extractBtn) {
        extractBtn.addEventListener("click", handleExtract);
    }

    if (copyBtn) {
        copyBtn.addEventListener("click", async () => {
            const text = editorEl ? editorEl.value : "";
            if (!text) {
                showToast("Belum ada teks untuk disalin.");
                return;
            }
            try {
                await navigator.clipboard.writeText(text);
                showToast("Markdown berhasil disalin ke clipboard!");
            } catch {
                showToast("Gagal menyalin otomatis.");
            }
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener("click", () => {
            const text = editorEl ? editorEl.value : "";
            if (!text) {
                showToast("Belum ada konten untuk diunduh.");
                return;
            }
            const title = (state.data && state.data.title) ? state.data.title : "artikel";
            const filename = `${slugify(title)}.md`;
            const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            URL.revokeObjectURL(link.href);
            showToast(`Mengunduh ${filename}`);
        });
    }

    if (chatBtn) {
        chatBtn.addEventListener("click", () => {
            const text = editorEl ? editorEl.value : "";
            if (!text) {
                showToast("Ekstrak artikel terlebih dahulu.");
                return;
            }
            const title = (state.data && state.data.title) ? state.data.title : "artikel ini";
            const promptText = `Tolong rangkum dan jelaskan poin-poin utama dari artikel '${title}' berikut:\n\n${text.slice(0, 3000)}`;
            sessionStorage.setItem("meteor_prefill_prompt", promptText);
            window.location.href = `/?prompt=${encodeURIComponent(promptText.slice(0, 500))}`;
        });
    }

    viewBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            const v = btn.getAttribute("data-reader-view");
            if (!v) return;
            state.mobileView = v;
            viewBtns.forEach((b) => b.setAttribute("aria-selected", String(b === btn)));
            const editorCol = root.querySelector(".reader-pane-editor");
            const previewCol = root.querySelector(".reader-pane-preview");
            if (editorCol) editorCol.setAttribute("data-active", String(v === "editor"));
            if (previewCol) previewCol.setAttribute("data-active", String(v === "preview"));
        });
    });

    return {
        state,
        handleExtract,
        syncEditorAndPreview,
        showToast
    };
}
