import { readFileSync, writeFileSync } from "node:fs";
import { FORMULAS } from "../src/math/math-formulas.js";
import { loadKatex } from "./lib/load-katex.mjs";
import { toInlineKatexCss } from "./lib/katex-css.mjs";
import { renderCards } from "./lib/render-cards.mjs";

const root = new URL("../", import.meta.url);
const page = new URL("math.html", root);
const KATEX_STYLE = /(<style id="katex-css">)[\s\S]*?(<\/style>)/;
const MATH_THEME_STYLE = /(<style id="math-theme-css">)[\s\S]*?(<\/style>)/;

const katex = loadKatex(new URL("vendor/katex/katex.min.js", root));
const css = toInlineKatexCss(
    readFileSync(new URL("vendor/katex/katex.min.css", root), "utf8"),
    "./vendor/katex/fonts/"
);
const mathCss = readFileSync(new URL("styles/math.css", root), "utf8");

const source = readFileSync(page, "utf8");
if (!KATEX_STYLE.test(source)) {
    throw new Error('math.html tidak memiliki <style id="katex-css">.');
}

let withCss = source.replace(KATEX_STYLE, (_match, open, close) => open + css + close);
if (MATH_THEME_STYLE.test(withCss)) {
    withCss = withCss.replace(MATH_THEME_STYLE, (_match, open, close) => open + mathCss + close);
}
const { output, count } = renderCards(withCss, FORMULAS, katex);
writeFileSync(page, output);
console.log(`math.html: ${count} kartu rumus dirender, CSS KaTeX ${css.length} byte.`);
