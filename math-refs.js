import { refs } from "./dom-refs.js";

const IDS = {
    inXmin: "math-in-xmin",
    inXmax: "math-in-xmax",
    mathSteps: "math-steps-container",
    m2InX1: "math2-in-x1",
    m2InX2: "math2-in-x2",
    m2Table: "math2-table-container",
    m3InH: "math3-in-h",
    m3InA: "math3-in-a",
    m3Steps: "math3-steps-container",
    m4DynamicInputs: "math4-dynamic-inputs",
    m4Steps: "math4-steps-container",
    m5InR: "math5-in-r",
    m5DynamicInputs: "math5-dynamic-inputs",
    m5Steps: "math5-steps-container",
    m6DynamicInputs: "math6-dynamic-inputs",
    m6Steps: "math6-steps-container",
    m7InP1: "math7-in-p1",
    m7InP2: "math7-in-p2",
    m7InType: "math7-in-type",
    m7InK: "math7-in-k",
    m7InK1: "math7-in-k1",
    m7InK2: "math7-in-k2",
    m7InMask: "math7-in-mask",
    m7ContainerK: "math7-k-container",
    m7ContainerK1: "math7-k1-container",
    m7ContainerK2: "math7-k2-container",
    m7ContainerMask: "math7-mask-container",
    m7Steps: "math7-steps-container",
    m8InA: "math8-in-a",
    m8InB: "math8-in-b",
    m8Steps: "math8-steps-container",
    m9DynamicInputs: "math9-dynamic-inputs",
    m9Steps: "math9-steps-container",
    m10DynamicInputs: "math10-dynamic-inputs",
    m10Steps: "math10-steps-container",
    m11DynamicInputs: "math11-dynamic-inputs",
    m11Steps: "math11-steps-container",
    m12InPa: "math12-in-pa",
    m12InPba: "math12-in-pba",
    m12InPb: "math12-in-pb",
    m12Steps: "math12-steps-container",
    m13InN: "math13-in-n",
    m13InK: "math13-in-k",
    m13Steps: "math13-steps-container",
    m14InA: "math14-in-a",
    m14InB: "math14-in-b",
    m14InC: "math14-in-c",
    m14Steps: "math14-steps-container",
    m15InF: "math15-in-f",
    m15InG: "math15-in-g",
    m15InC: "math15-in-c",
    m15Steps: "math15-steps-container",
    m16InF: "math16-in-f",
    m16InA: "math16-in-a",
    m16Steps: "math16-steps-container",
    m17InF: "math17-in-f",
    m17InBigF: "math17-in-bigf",
    m17InA: "math17-in-a",
    m17InB: "math17-in-b",
    m17Steps: "math17-steps-container",
    m18InF: "math18-in-f",
    m18InA: "math18-in-a",
    m18InB: "math18-in-b",
    m18Steps: "math18-steps-container",
    m19InN: "math19-in-n",
    m19InR: "math19-in-r",
    m19Steps: "math19-steps-container",
    m20InA: "math20-in-a",
    m20InB: "math20-in-b",
    m20Steps: "math20-steps-container",
    m21InD: "math21-in-d",
    m21Steps: "math21-steps-container",
    m22InN: "math22-in-n",
    m22Steps: "math22-steps-container",
    cubeInSisi: "cube-in-sisi",
    cubeOutVolume: "cube-out-volume",
    cubeCanvas: "cube-canvas",
    coneInMode: "cone-in-mode",
    coneInA: "cone-in-a",
    coneInB: "cone-in-b",
    coneLabelA: "cone-label-a",
    coneLabelB: "cone-label-b",
    coneCanvas: "cone-canvas",
    m25InActual: "math25-in-actual",
    m25InPlanned: "math25-in-planned",
    m25Steps: "math25-steps-container",
    m25Canvas: "math25-canvas"
};

export const FORM_COUNT = 25;

export function bindMathRefs() {
    refs.mathMenu = document.getElementById("math-menu-view");
    refs.mathCalc = document.getElementById("math-calc-view");
    for (let i = 1; i <= FORM_COUNT; i++) {
        refs[`form${i}`] = document.getElementById(`math-calc-form-${i}`);
        refs[`mathFormulaDisplay${i === 1 ? "" : i}`] = document.getElementById(
            i === 1 ? "math-calc-formula-display" : `math-calc-formula-display-${i}`
        );
    }
    Object.entries(IDS).forEach(([key, id]) => {
        refs[key] = document.getElementById(id);
    });
}
