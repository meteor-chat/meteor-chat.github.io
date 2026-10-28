import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getFormulaUrl, CATEGORY_SLUGS } from "../src/math/math-routes.js";
import { FORMULA_NAMES } from "../src/math/math-formula-names.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const mathHtml = readFileSync(join(root, "math.html"), "utf8");

mkdirSync(join(root, "math"), { recursive: true });
writeFileSync(join(root, "math", "index.html"), mathHtml);

const staleDirs = [
    "math/14", "math/21", "math/22",
    "math/pt/10", "math/pt/11", "math/pt/12", "math/pt/13",
    "math/cal/15", "math/cal/16", "math/cal/17", "math/cal/18",
    "math/dm/19", "math/vm/20", "math/g/23", "math/g/24", "math/pm/12", "math/pm/25", "math/pm/26", "math/pm/27", "math/pm/28", "math/pm/29", "math/pm/30", "math/pm/31", "math/pm/32", "math/pm/33", "math/pm/34", "math/pm/35", "math/pm/36"
];
for (const dir of staleDirs) {
    const full = join(root, dir);
    if (existsSync(full)) rmSync(full, { recursive: true, force: true });
}

let catCount = 0;
for (const [category, slug] of Object.entries(CATEGORY_SLUGS)) {
    if (!slug) continue;
    const outDir = join(root, "math", slug);
    mkdirSync(outDir, { recursive: true });

    let html = mathHtml.replace(/<title>[\s\S]*?<\/title>/, `<title>${category} - Meteor</title>`);
    const oldBtn = `<button type="button" class="math-filter-btn" data-filter="${category}" aria-pressed="false">`;
    const newBtn = `<button type="button" class="math-filter-btn active" data-filter="${category}" aria-pressed="true">`;
    html = html.replace(oldBtn, newBtn);

    html = html.replace(/<button\b([^>]*\bdata-category="([^"]+)"[^>]*)>/g, (match, attrs, cat) => {
        if (cat !== category) {
            return `<button${attrs.replace('class="math-card active"', 'class="math-card active math-hidden"')}>`;
        }
        return match;
    });
    html = html.replace(/class="math-card disabled"/g, 'class="math-card disabled math-hidden"');

    writeFileSync(join(outDir, "index.html"), html);
    catCount++;

    if (slug === "bm") {
        const mdDir = join(root, "math", "md");
        mkdirSync(mdDir, { recursive: true });
        writeFileSync(join(mdDir, "index.html"), html);
        catCount++;
    }
}

let count = 0;
for (let id = 1; id <= 36; id++) {
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

console.log(`Generated math/index.html, ${catCount} category routes, and ${count} formula static routes.`);
