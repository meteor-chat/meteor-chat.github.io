import { gradientDescentStep, computeLoss } from "./logistic-model.js";
import { getBlobsPreset, getOverlapPreset, getImbalancedPreset, getXORPreset } from "./logistic-presets.js";
import { computeConfusionMatrix, computeMetrics } from "./logistic-metrics.js";
import { createLogisticCanvas } from "./logistic-canvas.js";
import { createLossCanvas } from "./logistic-loss-canvas.js";
import { LOGISTIC_CODE_SAMPLES } from "./logistic-code-snippets.js";

const state = {
    w1: 0.5,
    w2: 0.5,
    b: 0.0,
    lr: 0.1,
    lambda: 0.0,
    threshold: 0.5,
    autoTrain: false,
    clickClass: 1
};

let points = getBlobsPreset();
let lossHistory = [computeLoss(points, state.w1, state.w2, state.b, state.lambda)];
let animFrameId = null;
let hoverCoord = null;

const mainCanvas = document.getElementById("logistic-canvas");
const lossCanvas = document.getElementById("loss-canvas");
const visEngine = createLogisticCanvas(mainCanvas);
const lossEngine = createLossCanvas(lossCanvas);

const sliderW1 = document.getElementById("slider-w1");
const sliderW2 = document.getElementById("slider-w2");
const sliderB = document.getElementById("slider-b");
const sliderLr = document.getElementById("slider-lr");
const sliderLambda = document.getElementById("slider-lambda");
const sliderThreshold = document.getElementById("slider-threshold");

const txtW1 = document.getElementById("txt-w1");
const txtW2 = document.getElementById("txt-w2");
const txtB = document.getElementById("txt-b");
const txtLr = document.getElementById("txt-lr");
const txtLambda = document.getElementById("txt-lambda");
const txtThreshold = document.getElementById("txt-threshold");

const valTp = document.getElementById("val-tp");
const valFp = document.getElementById("val-fp");
const valTn = document.getElementById("val-tn");
const valFn = document.getElementById("val-fn");
const valAccuracy = document.getElementById("val-accuracy");
const valPrecision = document.getElementById("val-precision");
const valRecall = document.getElementById("val-recall");
const valF1 = document.getElementById("val-f1");
const valLoss = document.getElementById("val-loss");

const btnStep = document.getElementById("btn-step");
const btnPlay = document.getElementById("btn-play");
const btnReset = document.getElementById("btn-reset");

function syncControls() {
    sliderW1.value = state.w1;
    sliderW2.value = state.w2;
    sliderB.value = state.b;
    txtW1.textContent = state.w1.toFixed(2);
    txtW2.textContent = state.w2.toFixed(2);
    txtB.textContent = state.b.toFixed(2);

    sliderLr.value = state.lr;
    sliderLambda.value = state.lambda;
    sliderThreshold.value = state.threshold;
    txtLr.textContent = state.lr.toFixed(2);
    txtLambda.textContent = state.lambda.toFixed(2);
    txtThreshold.textContent = state.threshold.toFixed(2);
}

function updateMetricsUI() {
    const cm = computeConfusionMatrix(points, state.w1, state.w2, state.b, state.threshold);
    const m = computeMetrics(cm);

    valTp.textContent = cm.tp;
    valFp.textContent = cm.fp;
    valTn.textContent = cm.tn;
    valFn.textContent = cm.fn;

    valAccuracy.textContent = `${m.accuracy}%`;
    valPrecision.textContent = m.precision.toFixed(3);
    valRecall.textContent = m.recall.toFixed(3);
    valF1.textContent = m.f1.toFixed(3);

    const currentLoss = lossHistory.length > 0 ? lossHistory[lossHistory.length - 1] : 0;
    valLoss.textContent = currentLoss.toFixed(4);
}

function renderAll() {
    visEngine.render(state, points, hoverCoord);
    lossEngine.render(lossHistory);
    updateMetricsUI();
}

function performStep() {
    if (points.length === 0) return;
    const res = gradientDescentStep(state, points, state.lr, state.lambda);
    state.w1 = res.w1;
    state.w2 = res.w2;
    state.b = res.b;
    lossHistory.push(res.loss);
    if (lossHistory.length > 250) lossHistory.shift();
    syncControls();
    renderAll();
}

function trainLoop() {
    if (!state.autoTrain) return;
    performStep();
    animFrameId = requestAnimationFrame(trainLoop);
}

btnStep.addEventListener("click", () => {
    state.autoTrain = false;
    btnPlay.textContent = "Auto Run";
    performStep();
});

btnPlay.addEventListener("click", () => {
    state.autoTrain = !state.autoTrain;
    if (state.autoTrain) {
        btnPlay.textContent = "Pause";
        trainLoop();
    } else {
        btnPlay.textContent = "Auto Run";
        cancelAnimationFrame(animFrameId);
    }
});

btnReset.addEventListener("click", () => {
    state.autoTrain = false;
    btnPlay.textContent = "Auto Run";
    cancelAnimationFrame(animFrameId);
    state.w1 = 0.5;
    state.w2 = 0.5;
    state.b = 0.0;
    lossHistory = [computeLoss(points, state.w1, state.w2, state.b, state.lambda)];
    syncControls();
    renderAll();
});

sliderW1.addEventListener("input", (e) => {
    state.w1 = parseFloat(e.target.value);
    txtW1.textContent = state.w1.toFixed(2);
    lossHistory.push(computeLoss(points, state.w1, state.w2, state.b, state.lambda));
    renderAll();
});

sliderW2.addEventListener("input", (e) => {
    state.w2 = parseFloat(e.target.value);
    txtW2.textContent = state.w2.toFixed(2);
    lossHistory.push(computeLoss(points, state.w1, state.w2, state.b, state.lambda));
    renderAll();
});

sliderB.addEventListener("input", (e) => {
    state.b = parseFloat(e.target.value);
    txtB.textContent = state.b.toFixed(2);
    lossHistory.push(computeLoss(points, state.w1, state.w2, state.b, state.lambda));
    renderAll();
});

sliderLr.addEventListener("input", (e) => {
    state.lr = parseFloat(e.target.value);
    txtLr.textContent = state.lr.toFixed(2);
});

sliderLambda.addEventListener("input", (e) => {
    state.lambda = parseFloat(e.target.value);
    txtLambda.textContent = state.lambda.toFixed(2);
    lossHistory.push(computeLoss(points, state.w1, state.w2, state.b, state.lambda));
    renderAll();
});

sliderThreshold.addEventListener("input", (e) => {
    state.threshold = parseFloat(e.target.value);
    txtThreshold.textContent = state.threshold.toFixed(2);
    renderAll();
});

mainCanvas.addEventListener("mousemove", (e) => {
    const rect = mainCanvas.getBoundingClientRect();
    const scaleX = mainCanvas.width / rect.width;
    const scaleY = mainCanvas.height / rect.height;
    hoverCoord = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
    renderAll();
});

mainCanvas.addEventListener("mouseleave", () => {
    hoverCoord = null;
    renderAll();
});

mainCanvas.addEventListener("click", (e) => {
    const rect = mainCanvas.getBoundingClientRect();
    const scaleX = mainCanvas.width / rect.width;
    const scaleY = mainCanvas.height / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;
    const mapPt = visEngine.pixelToMap(px, py);
    points.push({ x1: mapPt.x1, x2: mapPt.x2, y: state.clickClass });
    lossHistory.push(computeLoss(points, state.w1, state.w2, state.b, state.lambda));
    renderAll();
});

document.querySelectorAll(".btn-preset").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".btn-preset").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const type = btn.getAttribute("data-preset");
        if (type === "blobs") points = getBlobsPreset();
        else if (type === "overlap") points = getOverlapPreset();
        else if (type === "imbalanced") points = getImbalancedPreset();
        else if (type === "xor") points = getXORPreset();
        else if (type === "clear") points = [];

        lossHistory = points.length > 0 ? [computeLoss(points, state.w1, state.w2, state.b, state.lambda)] : [];
        renderAll();
    });
});

document.querySelectorAll(".btn-class-pick").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".btn-class-pick").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        state.clickClass = parseInt(btn.getAttribute("data-class"), 10);
    });
});

document.querySelectorAll(".btn-view-mode").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".btn-view-mode").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        visEngine.setViewMode(btn.getAttribute("data-mode"));
        renderAll();
    });
});

const codePanel = document.getElementById("sort-code-panel");
const codeBody = document.getElementById("logistic-code-body");
const codeTitle = document.getElementById("logistic-code-title");
const btnToggleCode = document.getElementById("btn-toggle-code");
const btnCodeFloating = document.getElementById("btn-code-floating");
const btnCloseCode = document.getElementById("logistic-code-close");

function showCode(lang) {
    if (!LOGISTIC_CODE_SAMPLES[lang]) return;
    codeTitle.textContent = `Logistic Regression Code (${lang.toUpperCase()})`;
    codeBody.textContent = LOGISTIC_CODE_SAMPLES[lang];
    document.querySelectorAll(".code-tab").forEach(tab => {
        tab.classList.toggle("active", tab.getAttribute("data-lang") === lang);
    });
}

function toggleCodePanel(open) {
    const shouldOpen = open !== undefined ? open : codePanel.classList.contains("sort-code-hidden");
    codePanel.classList.toggle("sort-code-hidden", !shouldOpen);
}

btnToggleCode?.addEventListener("click", () => toggleCodePanel());
btnCodeFloating?.addEventListener("click", () => toggleCodePanel());
btnCloseCode?.addEventListener("click", () => toggleCodePanel(false));

document.querySelectorAll(".code-tab").forEach(tab => {
    tab.addEventListener("click", () => {
        showCode(tab.getAttribute("data-lang"));
    });
});

showCode("python");
syncControls();
renderAll();
