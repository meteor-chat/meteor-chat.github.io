let dualRunning = false;
let dualStackBox = null;
let dualQueueBox = null;
let dualStackOut = null;
let dualQueueOut = null;
let dualStatus = null;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function initDual(stackBox, queueBox, stackOut, queueOut, statusEl) {
    dualStackBox = stackBox;
    dualQueueBox = queueBox;
    dualStackOut = stackOut;
    dualQueueOut = queueOut;
    dualStatus = statusEl;
    resetDual();
}

export function isDualRunning() {
    return dualRunning;
}

export function resetDual() {
    if (dualRunning) return;
    if (dualStackBox) dualStackBox.textContent = "";
    if (dualQueueBox) dualQueueBox.textContent = "";
    if (dualStackOut) dualStackOut.textContent = "-";
    if (dualQueueOut) dualQueueOut.textContent = "-";
    if (dualStatus) {
        dualStatus.textContent = "Masukkan deret angka lalu klik 'Jalankan Simulasi Stream' untuk melihat perbedaan pemrosesan.";
    }
}

function createBoxItem(val) {
    const el = document.createElement("div");
    el.className = "ds-dual-item";
    el.textContent = val;
    return el;
}

export async function runDualSimulation(inputValues) {
    if (dualRunning) return;
    dualRunning = true;

    resetDual();
    if (dualStatus) {
        dualStatus.textContent = `Memulai stream masukan: [${inputValues.join(", ")}]...`;
    }
    await sleep(400);

    const stackList = [];
    const queueList = [];

    for (let i = 0; i < inputValues.length; i++) {
        const val = inputValues[i];
        if (dualStatus) {
            dualStatus.textContent = `Push [${val}] ke Stack & Enqueue [${val}] ke Queue...`;
        }

        const stackEl = createBoxItem(val);
        stackEl.classList.add("ds-push-in");
        if (dualStackBox) dualStackBox.prepend(stackEl);
        stackList.unshift(val);

        const queueEl = createBoxItem(val);
        queueEl.classList.add("ds-enqueue-in");
        if (dualQueueBox) dualQueueBox.appendChild(queueEl);
        queueList.push(val);

        await sleep(500);
    }

    if (dualStatus) {
        dualStatus.textContent = "Tahap 1 selesai: Elemen telah dimuat. Sekarang memulai ekstraksi paralel...";
    }
    await sleep(700);

    const stackOutputs = [];
    const queueOutputs = [];

    while (stackList.length > 0 || queueList.length > 0) {
        const popped = stackList.shift();
        stackOutputs.push(popped);
        if (dualStackBox && dualStackBox.firstChild) {
            const first = dualStackBox.firstChild;
            first.classList.add("ds-pop-out");
            await sleep(250);
            if (first.parentNode) first.parentNode.removeChild(first);
        }
        if (dualStackOut) dualStackOut.textContent = stackOutputs.join(" ➔ ");

        const dequeued = queueList.shift();
        queueOutputs.push(dequeued);
        if (dualQueueBox && dualQueueBox.firstChild) {
            const first = dualQueueBox.firstChild;
            first.classList.add("ds-dequeue-out");
            await sleep(250);
            if (first.parentNode) first.parentNode.removeChild(first);
        }
        if (dualQueueOut) dualQueueOut.textContent = queueOutputs.join(" ➔ ");

        await sleep(350);
    }

    if (dualStatus) {
        dualStatus.textContent = `Simulasi Selesai! Stack membalik urutan ([${stackOutputs.join(", ")}]), sedangkan Queue melestarikan urutan asli ([${queueOutputs.join(", ")}]).`;
    }

    dualRunning = false;
}
