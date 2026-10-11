import { refs } from "./dom-refs.js";
import { initCube, renderCube } from "./cube-3d.js";

let cubeInitialized = false;

export function getCubeSisiValue() {
    if (!refs.cubeInSisi) return "12";
    const v = refs.cubeInSisi.value.trim();
    return v === "" ? "12" : v;
}

export function calculateMath23() {
    if (!refs.cubeInSisi || !refs.cubeOutVolume) return;
    const raw = refs.cubeInSisi.value.trim();
    const s = parseFloat(raw);
    if (isNaN(s) || s < 0) {
        refs.cubeOutVolume.textContent = "0";
    } else {
        const v = Math.pow(s, 3);
        const formatted = Number.isInteger(v) ? v.toString() : parseFloat(v.toFixed(6)).toString();
        refs.cubeOutVolume.textContent = formatted;
    }
    renderCube();
}

export function initCubeView() {
    if (!cubeInitialized && refs.cubeCanvas) {
        initCube(refs.cubeCanvas, getCubeSisiValue);
        cubeInitialized = true;
    }
    calculateMath23();
}
