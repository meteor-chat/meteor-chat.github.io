import { refs } from "./dom-refs.js";
import { loadForm } from "./math-modules.js";

const INPUTS = {
    1: ["inXmin", "inXmax"],
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

let eventsBound = false;
function disableNumberSpinAndScroll() {
    if (eventsBound) return;
    eventsBound = true;
    document.addEventListener("wheel", (e) => {
        if (e.target && e.target.tagName === "INPUT" && e.target.type === "number") {
            e.preventDefault();
            e.target.blur();
        }
    }, { passive: false });
    document.addEventListener("keydown", (e) => {
        if (e.target && e.target.tagName === "INPUT" && e.target.type === "number") {
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
            }
        }
    });
}

export function bindMathInputs() {
    disableNumberSpinAndScroll();
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
}

disableNumberSpinAndScroll();
