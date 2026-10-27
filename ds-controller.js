import { initStack, pushStack, popStack, peekStack, clearStack, setStackPerspective } from "./ds-stack.js?v=1";
import { initQueue, enqueueQueue, dequeueQueue, peekQueue, clearQueue, setQueuePerspective } from "./ds-queue.js?v=1";
import { initDual, runDualSimulation, resetDual, isDualRunning } from "./ds-dual.js?v=1";

let currentMode = "stack";

const btnModeStack = document.getElementById("btn-mode-stack");
const btnModeQueue = document.getElementById("btn-mode-queue");
const btnModeDual = document.getElementById("btn-mode-dual");

const viewStack = document.getElementById("view-stack");
const viewQueue = document.getElementById("view-queue");
const viewDual = document.getElementById("view-dual");

const stackContainer = document.getElementById("stack-container");
const stackStatus = document.getElementById("stack-status");
const btnStackPush = document.getElementById("btn-stack-push");
const btnStackPop = document.getElementById("btn-stack-pop");
const btnStackPeek = document.getElementById("btn-stack-peek");
const btnStackClear = document.getElementById("btn-stack-clear");
const btnStackLifo = document.getElementById("btn-stack-lifo");
const btnStackFilo = document.getElementById("btn-stack-filo");
const inputStackVal = document.getElementById("input-stack-val");
const btnStackRand = document.getElementById("btn-stack-rand");

const queueContainer = document.getElementById("queue-container");
const queueStatus = document.getElementById("queue-status");
const btnQueueEnqueue = document.getElementById("btn-queue-enqueue");
const btnQueueDequeue = document.getElementById("btn-queue-dequeue");
const btnQueuePeek = document.getElementById("btn-queue-peek");
const btnQueueClear = document.getElementById("btn-queue-clear");
const btnQueueFifo = document.getElementById("btn-queue-fifo");
const btnQueueLilo = document.getElementById("btn-queue-lilo");
const inputQueueVal = document.getElementById("input-queue-val");
const btnQueueRand = document.getElementById("btn-queue-rand");

const dualStackBox = document.getElementById("dual-stack-box");
const dualQueueBox = document.getElementById("dual-queue-box");
const dualStackOut = document.getElementById("dual-stack-out");
const dualQueueOut = document.getElementById("dual-queue-out");
const dualStatus = document.getElementById("dual-status");
const inputDualStream = document.getElementById("input-dual-stream");
const btnDualRun = document.getElementById("btn-dual-run");
const btnDualReset = document.getElementById("btn-dual-reset");

const btnLeanVerify = document.getElementById("btn-lean-verify");
const leanBadgeText = document.getElementById("lean-badge-text");

function getRandomVal() {
    return Math.floor(Math.random() * 90) + 10;
}

function updateLeanBadge() {
    if (!leanBadgeText) return;
    if (currentMode === "stack") {
        leanBadgeText.textContent = "Stack (LIFO / FILO): Formally Verified in Lean 4";
    } else if (currentMode === "queue") {
        leanBadgeText.textContent = "Queue (FIFO / LILO): Formally Verified in Lean 4";
    } else {
        leanBadgeText.textContent = "Stacks & Queues: Formally Verified in Lean 4";
    }
}

function setMode(mode) {
    if (isDualRunning()) return;
    currentMode = mode;

    if (btnModeStack) btnModeStack.classList.toggle("active", mode === "stack");
    if (btnModeQueue) btnModeQueue.classList.toggle("active", mode === "queue");
    if (btnModeDual) btnModeDual.classList.toggle("active", mode === "dual");

    if (viewStack) viewStack.classList.toggle("ds-hidden", mode !== "stack");
    if (viewQueue) viewQueue.classList.toggle("ds-hidden", mode !== "queue");
    if (viewDual) viewDual.classList.toggle("ds-hidden", mode !== "dual");

    updateLeanBadge();
}

if (btnModeStack) btnModeStack.addEventListener("click", () => setMode("stack"));
if (btnModeQueue) btnModeQueue.addEventListener("click", () => setMode("queue"));
if (btnModeDual) btnModeDual.addEventListener("click", () => setMode("dual"));

if (btnStackPush) {
    btnStackPush.addEventListener("click", () => {
        const val = inputStackVal && inputStackVal.value.trim() ? inputStackVal.value.trim() : getRandomVal();
        const success = pushStack(val);
        if (success && inputStackVal) inputStackVal.value = "";
    });
}
if (btnStackPop) btnStackPop.addEventListener("click", popStack);
if (btnStackPeek) btnStackPeek.addEventListener("click", peekStack);
if (btnStackClear) btnStackClear.addEventListener("click", clearStack);
if (btnStackRand && inputStackVal) {
    btnStackRand.addEventListener("click", () => {
        inputStackVal.value = getRandomVal();
    });
}
if (btnStackLifo) {
    btnStackLifo.addEventListener("click", () => {
        btnStackLifo.classList.add("active");
        if (btnStackFilo) btnStackFilo.classList.remove("active");
        setStackPerspective("lifo");
    });
}
if (btnStackFilo) {
    btnStackFilo.addEventListener("click", () => {
        btnStackFilo.classList.add("active");
        if (btnStackLifo) btnStackLifo.classList.remove("active");
        setStackPerspective("filo");
    });
}

if (btnQueueEnqueue) {
    btnQueueEnqueue.addEventListener("click", () => {
        const val = inputQueueVal && inputQueueVal.value.trim() ? inputQueueVal.value.trim() : getRandomVal();
        const success = enqueueQueue(val);
        if (success && inputQueueVal) inputQueueVal.value = "";
    });
}
if (btnQueueDequeue) btnQueueDequeue.addEventListener("click", dequeueQueue);
if (btnQueuePeek) btnQueuePeek.addEventListener("click", peekQueue);
if (btnQueueClear) btnQueueClear.addEventListener("click", clearQueue);
if (btnQueueRand && inputQueueVal) {
    btnQueueRand.addEventListener("click", () => {
        inputQueueVal.value = getRandomVal();
    });
}
if (btnQueueFifo) {
    btnQueueFifo.addEventListener("click", () => {
        btnQueueFifo.classList.add("active");
        if (btnQueueLilo) btnQueueLilo.classList.remove("active");
        setQueuePerspective("fifo");
    });
}
if (btnQueueLilo) {
    btnQueueLilo.addEventListener("click", () => {
        btnQueueLilo.classList.add("active");
        if (btnQueueFifo) btnQueueFifo.classList.remove("active");
        setQueuePerspective("lilo");
    });
}

if (btnDualRun) {
    btnDualRun.addEventListener("click", () => {
        if (isDualRunning()) return;
        const raw = inputDualStream && inputDualStream.value.trim() ? inputDualStream.value.trim() : "10, 20, 30, 40";
        const items = raw.split(/[\s,]+/).filter(Boolean).slice(0, 5);
        runDualSimulation(items);
    });
}
if (btnDualReset) btnDualReset.addEventListener("click", resetDual);

if (btnLeanVerify) {
    btnLeanVerify.addEventListener("click", () => {
        import("./ds-lean-modal.js?v=1")
            .then((m) => m.openLeanDsModal(currentMode === "queue" ? "queue" : "stack"))
            .catch(() => {});
    });
}

initStack(stackContainer, stackStatus);
initQueue(queueContainer, queueStatus);
initDual(dualStackBox, dualQueueBox, dualStackOut, dualQueueOut, dualStatus);
updateLeanBadge();
