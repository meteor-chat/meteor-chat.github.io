import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getFormulaUrl } from "../math-routes.js";
import { FORMULA_NAMES } from "../math-formula-names.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const mathHtml = readFileSync(join(root, "math.html"), "utf8");

mkdirSync(join(root, "math"), { recursive: true });
writeFileSync(join(root, "math", "index.html"), mathHtml);

let count = 0;
for (let id = 1; id <= 24; id++) {
    const url = getFormulaUrl(id);
    const relDir = url.replace(/^\/+/, "");
    const outDir = join(root, relDir);
    mkdirSync(outDir, { recursive: true });

    const name = FORMULA_NAMES[id] || "Math";
    let html = mathHtml.replace(/<title>[\s\S]*?<\/title>/, `<title>${name} - Meteor</title>`);
    html = html.replace('<div id="math-menu-view">', '<div id="math-menu-view" class="hidden">');
    html = html.replace('<div id="math-calc-view" class="hidden">', '<div id="math-calc-view">');

    const formRegex = new RegExp(`(<div\\s+id="math-calc-form-${id}"[^>]*class="[^"]*)\\bhidden\\b([^"]*")`);
    html = html.replace(formRegex, (_m, before, after) => `${before}${after}`.replace(/\s{2,}/g, " "));

    writeFileSync(join(outDir, "index.html"), html);
    count++;
}

console.log(`Generated math/index.html and ${count} formula static routes.`);
