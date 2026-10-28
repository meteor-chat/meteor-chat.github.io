const LIBRARIES = [
    "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js",
    "https://cdn.jsdelivr.net/npm/marked/marked.min.js",
    "https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js",
    "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"
];

const STYLESHEETS = [
    new URL("../../styles/chat.css", import.meta.url).href,
    new URL("../../styles/fonts.css", import.meta.url).href,
    "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
];

const pending = new Map();

function once(key, create) {
    if (!pending.has(key)) {
        const promise = create().catch((error) => {
            pending.delete(key);
            throw error;
        });
        pending.set(key, promise);
    }
    return pending.get(key);
}

export function loadScript(src) {
    return once(src, () => new Promise((resolve, reject) => {
        const el = document.createElement("script");
        el.src = src;
        el.async = true;
        el.onload = () => resolve();
        el.onerror = () => {
            el.remove();
            reject(new Error(`Library CDN gagal dimuat: ${src}`));
        };
        document.head.appendChild(el);
    }));
}

export function loadStylesheet(href) {
    if (document.getElementById("math-theme-css") || document.querySelector(`link[href="${href}"]`)) {
        return Promise.resolve();
    }
    return once(href, () => new Promise((resolve, reject) => {
        const el = document.createElement("link");
        el.rel = "stylesheet";
        el.href = href;
        el.onload = () => resolve();
        el.onerror = () => {
            el.remove();
            reject(new Error(`Stylesheet gagal dimuat: ${href}`));
        };
        document.head.appendChild(el);
    }));
}

export function ensureChatAssets() {
    return once("chat-assets", async () => {
        const styles = Promise.allSettled(STYLESHEETS.map(loadStylesheet));
        await Promise.all(LIBRARIES.map(loadScript));
        await styles;
    });
}
