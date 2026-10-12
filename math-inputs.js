import { refs } from "./dom-refs.js";
import { loadForm } from "./math-modules.js";

const INPUTS = {
    1: ["inN", "inKromosom", "inXmin", "inXmax"],
    2: ["m2InX1", "m2InX2"],
    3: ["m3InH", "m3InA"],
    5: ["m5InR"],
    7: ["m7InP1", "m7InP2", "m7InType", "m7InK", "m7InK1", "m7InK2", "m7InMask"],
    8: ["m8InA", "m8InB"],
    12: ["m12InPa", "m12InPba", "m12InPb"],
    13: ["m13InN", "m13InK"],
    14: ["m14InA", "m14InB", "m14InC"],
    15: ["m15InF", "m15InG", "m15InC"],
    16: ["m16InF", "m16InA"],
    17: ["m17InF", "m17InBigF", "m17InA", "m17InB"],
    18: ["m18InF", "m18InA", "m18InB"],
    19: ["m19InN", "m19InR"],
    20: ["m20InA", "m20InB"],
    21: ["m21InD"],
    22: ["m22InN"],
    23: ["cubeInSisi"],
    24: ["coneInA", "coneInB"]
};

function recalc(n) {
    loadForm(n)
        .then((form) => form.calc())
        .catch(() => {});
}

function syncCrossoverType() {
    const type = refs.m7InType.value;
    if (refs.m7ContainerK) refs.m7ContainerK.classList.toggle("hidden", type !== "single");
    if (refs.m7ContainerK1) refs.m7ContainerK1.classList.toggle("hidden", type !== "two");
    if (refs.m7ContainerK2) refs.m7ContainerK2.classList.toggle("hidden", type !== "two");
    if (refs.m7ContainerMask) refs.m7ContainerMask.classList.toggle("hidden", type !== "uniform");
}

function stepKromosom(e, delta) {
    const n = parseInt(refs.inN.value, 10);
    if (isNaN(n) || n < 1) return;
    e.preventDefault();
    let v = parseInt(refs.inKromosom.value || "0", 2);
    if (isNaN(v)) v = 0;
    v += delta;
    const max = Math.pow(2, n) - 1;
    if (v < 0) v = max;
    if (v > max) v = 0;
    refs.inKromosom.value = v.toString(2).padStart(n, "0");
    recalc(1);
}

function bindKromosom() {
    if (refs.inN) {
        refs.inN.addEventListener("input", () => {
            const n = parseInt(refs.inN.value, 10);
            if (!isNaN(n) && n > 0 && !refs.inKromosom.value) {
                refs.inKromosom.value = "0".repeat(n);
                recalc(1);
            }
        });
    }
    if (!refs.inKromosom) return;
    refs.inKromosom.addEventListener("keydown", (e) => {
        if (e.key === "ArrowUp") stepKromosom(e, 1);
        if (e.key === "ArrowDown") stepKromosom(e, -1);
    });
    refs.inKromosom.addEventListener("wheel", (e) => stepKromosom(e, e.deltaY < 0 ? 1 : -1), {
        passive: false
    });
}

export function bindMathInputs() {
    Object.entries(INPUTS).forEach(([key, names]) => {
        const n = Number(key);
        names.forEach((name) => {
            const el = refs[name];
            if (!el) return;
            el.addEventListener("input", () => {
                if (el === refs.m7InType) syncCrossoverType();
                recalc(n);
            });
        });
    });
    bindKromosom();
}
