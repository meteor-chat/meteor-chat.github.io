import { BoidsEngine } from "./boids-engine.js?v=1";

const canvas = document.getElementById("boids-canvas");
const ctx = canvas ? canvas.getContext("2d") : null;
const engine = new BoidsEngine();

const toggleSep = document.getElementById("toggle-sep");
const sliderSep = document.getElementById("slider-sep");
const valSep = document.getElementById("val-sep");

const toggleAli = document.getElementById("toggle-ali");
const sliderAli = document.getElementById("slider-ali");
const valAli = document.getElementById("val-ali");

const toggleCoh = document.getElementById("toggle-coh");
const sliderCoh = document.getElementById("slider-coh");
const valCoh = document.getElementById("val-coh");

const sliderCount = document.getElementById("slider-count");
const valCount = document.getElementById("val-count");

const btnPresetNatural = document.getElementById("btn-preset-natural");
const btnPresetChaos = document.getElementById("btn-preset-chaos");
const btnPresetSwarm = document.getElementById("btn-preset-swarm");

const btnMouseNone = document.getElementById("btn-mouse-none");
const btnMousePredator = document.getElementById("btn-mouse-predator");
const btnMouseAttractor = document.getElementById("btn-mouse-attractor");

let width = 0;
let height = 0;

function resizeCanvas() {
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
}

function updateUIValues() {
    if (toggleSep) toggleSep.checked = engine.separationEnabled;
    if (sliderSep) sliderSep.value = engine.separationWeight;
    if (valSep) valSep.textContent = engine.separationWeight.toFixed(1);

    if (toggleAli) toggleAli.checked = engine.alignmentEnabled;
    if (sliderAli) sliderAli.value = engine.alignmentWeight;
    if (valAli) valAli.textContent = engine.alignmentWeight.toFixed(1);

    if (toggleCoh) toggleCoh.checked = engine.cohesionEnabled;
    if (sliderCoh) sliderCoh.value = engine.cohesionWeight;
    if (valCoh) valCoh.textContent = engine.cohesionWeight.toFixed(1);
}

function setMouseMode(mode) {
    engine.mouseMode = mode;
    if (btnMouseNone) btnMouseNone.classList.toggle("active", mode === "none");
    if (btnMousePredator) btnMousePredator.classList.toggle("active", mode === "predator");
    if (btnMouseAttractor) btnMouseAttractor.classList.toggle("active", mode === "attractor");
}

if (toggleSep) {
    toggleSep.addEventListener("change", (e) => {
        engine.separationEnabled = e.target.checked;
    });
}
if (sliderSep) {
    sliderSep.addEventListener("input", (e) => {
        engine.separationWeight = parseFloat(e.target.value);
        if (valSep) valSep.textContent = engine.separationWeight.toFixed(1);
    });
}

if (toggleAli) {
    toggleAli.addEventListener("change", (e) => {
        engine.alignmentEnabled = e.target.checked;
    });
}
if (sliderAli) {
    sliderAli.addEventListener("input", (e) => {
        engine.alignmentWeight = parseFloat(e.target.value);
        if (valAli) valAli.textContent = engine.alignmentWeight.toFixed(1);
    });
}

if (toggleCoh) {
    toggleCoh.addEventListener("change", (e) => {
        engine.cohesionEnabled = e.target.checked;
    });
}
if (sliderCoh) {
    sliderCoh.addEventListener("input", (e) => {
        engine.cohesionWeight = parseFloat(e.target.value);
        if (valCoh) valCoh.textContent = engine.cohesionWeight.toFixed(1);
    });
}

if (sliderCount) {
    sliderCount.addEventListener("input", (e) => {
        const count = parseInt(e.target.value, 10);
        if (valCount) valCount.textContent = count;
        engine.setBoidCount(count, width, height);
    });
}

if (btnPresetNatural) {
    btnPresetNatural.addEventListener("click", () => {
        engine.separationEnabled = true;
        engine.separationWeight = 1.5;
        engine.alignmentEnabled = true;
        engine.alignmentWeight = 1.0;
        engine.cohesionEnabled = true;
        engine.cohesionWeight = 1.0;
        updateUIValues();
    });
}

if (btnPresetChaos) {
    btnPresetChaos.addEventListener("click", () => {
        engine.separationEnabled = false;
        engine.alignmentEnabled = false;
        engine.cohesionEnabled = false;
        updateUIValues();
    });
}

if (btnPresetSwarm) {
    btnPresetSwarm.addEventListener("click", () => {
        engine.separationEnabled = true;
        engine.separationWeight = 1.0;
        engine.alignmentEnabled = true;
        engine.alignmentWeight = 1.4;
        engine.cohesionEnabled = true;
        engine.cohesionWeight = 2.2;
        updateUIValues();
    });
}

if (btnMouseNone) btnMouseNone.addEventListener("click", () => setMouseMode("none"));
if (btnMousePredator) btnMousePredator.addEventListener("click", () => setMouseMode("predator"));
if (btnMouseAttractor) btnMouseAttractor.addEventListener("click", () => setMouseMode("attractor"));

if (canvas) {
    const handleMove = (clientX, clientY) => {
        const rect = canvas.getBoundingClientRect();
        engine.mousePos.x = clientX - rect.left;
        engine.mousePos.y = clientY - rect.top;
        engine.mousePos.active = true;
    };

    canvas.addEventListener("mousemove", (e) => handleMove(e.clientX, e.clientY));
    canvas.addEventListener("mouseleave", () => {
        engine.mousePos.active = false;
    });

    canvas.addEventListener("touchmove", (e) => {
        if (e.touches.length > 0) {
            handleMove(e.touches[0].clientX, e.touches[0].clientY);
            e.preventDefault();
        }
    }, { passive: false });

    canvas.addEventListener("touchend", () => {
        engine.mousePos.active = false;
    });
}

window.addEventListener("resize", () => {
    resizeCanvas();
});

resizeCanvas();
const initialCount = sliderCount ? parseInt(sliderCount.value, 10) : 90;
engine.init(initialCount, width || 800, height || 500);
updateUIValues();

function loop() {
    if (ctx && width > 0 && height > 0) {
        engine.step(ctx, width, height);
    }
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
