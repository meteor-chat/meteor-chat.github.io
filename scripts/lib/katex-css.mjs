const COMMENT = /\/\*[\s\S]*?\*\//g;
const FONT_SRC = /src:url\(fonts\/([^)]+?)\.woff2\) format\("woff2"\)(?:,url\([^)]+\) format\("[^"]+"\))*/g;
const FONT_FACE = /@font-face\{/g;

export function toInlineKatexCss(css, fontBase) {
    const inlined = css
        .replace(COMMENT, "")
        .replace(FONT_SRC, (_match, name) => `src:url(${fontBase}${name}.woff2) format("woff2")`)
        .replace(FONT_FACE, "@font-face{font-display:swap;")
        .trim();
    if (/url\(fonts\//.test(inlined)) {
        throw new Error("Masih ada URL font KaTeX yang belum diubah.");
    }
    return inlined;
}
