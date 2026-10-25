import { refs } from "./dom-refs.js";
import { loadScript, loadStylesheet } from "./lazy-assets.js";

export const KATEX_SRC = new URL("./vendor/katex/katex.min.js", import.meta.url).href;
export const CALC_CSS = new URL("./math.css", import.meta.url).href;
const MATHJS_SRC = "https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.11.0/math.min.js";

const FORMS = {
    1: { file: "math-calc-1", calc: "calculateMath", open: "initChromoView" },
    2: { file: "math-calc-1-3", calc: "calculateMath2" },
    3: { file: "math-calc-1-3", calc: "calculateMath3" },
    4: { file: "math-calc-4-6", calc: "calculateMath4", add: "addM4Input", box: "m4DynamicInputs" },
    5: { file: "math-calc-4-6", calc: "calculateMath5", add: "addM5Input", box: "m5DynamicInputs" },
    6: { file: "math-calc-4-6", calc: "calculateMath6", add: "addM6Input", box: "m6DynamicInputs" },
    7: { file: "math-calc-7-8", calc: "calculateMath7" },
    8: { file: "math-calc-7-8", calc: "calculateMath8" },
    9: { file: "math-calc-9", calc: "calculateMath9", add: "addM9Input", box: "m9DynamicInputs" },
    10: { file: "math-calc-10", calc: "calculateMath10", add: "addM10Input", box: "m10DynamicInputs" },
    11: { file: "math-calc-11", calc: "calculateMath11", add: "addM11Input", box: "m11DynamicInputs" },
    12: { file: "math-calc-12", calc: "calculateMath12" },
    13: { file: "math-calc-13", calc: "calculateMath13" },
    14: { file: "math-calc-14", calc: "calculateMath14" },
    15: { file: "math-calc-15", calc: "calculateMath15", mathjs: true },
    16: { file: "math-calc-16", calc: "calculateMath16", mathjs: true },
    17: { file: "math-calc-17", calc: "calculateMath17", mathjs: true },
    18: { file: "math-calc-18", calc: "calculateMath18", mathjs: true },
    19: { file: "math-calc-19", calc: "calculateMath19" },
    20: { file: "math-calc-20", calc: "calculateMath20", mathjs: true },
    21: { file: "math-calc-21", calc: "calculateMath21" },
    22: { file: "math-calc-22", calc: "calculateMath22" },
    23: { file: "math-calc-23", calc: "calculateMath23", open: "initCubeView" },
    24: { file: "math-calc-24", calc: "calculateMath24", open: "initConeView" },
    25: { file: "math-calc-25", calc: "calculateMath25" },
    26: { file: "math-calc-26", calc: "calculateMath26" },
    27: { file: "math-calc-27", calc: "calculateMath27" },
    28: { file: "math-calc-28", calc: "calculateMath28" }
};

const pending = new Map();

function importModule(file) {
    return import(`./${file}.js`);
}

function buildForm(spec, module) {
    const calc = () => module[spec.calc]();
    const open = () => {
        if (spec.open) {
            module[spec.open]();
            return;
        }
        if (spec.add && refs[spec.box] && refs[spec.box].children.length === 0) {
            module[spec.add]();
        }
        calc();
    };
    return { open, calc };
}

async function createForm(n) {
    const spec = FORMS[n];
    if (!spec) throw new Error(`Rumus ${n} tidak ditemukan.`);
    const tasks = [loadScript(KATEX_SRC), loadStylesheet(CALC_CSS), importModule(spec.file)];
    if (spec.mathjs) tasks.push(loadScript(MATHJS_SRC));
    const [, , module] = await Promise.all(tasks);
    return buildForm(spec, module);
}

export function loadForm(n) {
    if (!pending.has(n)) {
        const promise = createForm(n).catch((error) => {
            pending.delete(n);
            throw error;
        });
        pending.set(n, promise);
    }
    return pending.get(n);
}

export function hasForm(n) {
    return Boolean(FORMS[n]);
}
