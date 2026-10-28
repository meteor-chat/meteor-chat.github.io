const MAX_QUEUE_SIZE = 6;

let queueItems = [];
let queuePerspective = "fifo";
let containerEl = null;
let statusEl = null;
let idCounter = 1;

export function initQueue(container, status) {
    containerEl = container;
    statusEl = status;
    queueItems = [];
    renderQueue();
}

export function setQueuePerspective(persp) {
    queuePerspective = persp;
    renderQueue();
    updateQueueStatus();
}

function updateQueueStatus(customMsg) {
    if (!statusEl) return;
    if (customMsg) {
        statusEl.textContent = customMsg;
        return;
    }
    if (queueItems.length === 0) {
        statusEl.textContent = "Queue kosong. Tekan 'Enqueue' untuk memasukkan elemen dari Rear.";
        return;
    }
    if (queuePerspective === "fifo") {
        const frontVal = queueItems[0].val;
        statusEl.textContent = `Perspektif FIFO (First-In, First-Out): Elemen terdepan (${frontVal}) adalah yang pertama masuk dan akan pertama keluar saat Dequeue.`;
    } else {
        const rearVal = queueItems[queueItems.length - 1].val;
        statusEl.textContent = `Perspektif LILO (Last-In, Last-Out): Elemen paling belakang (${rearVal}) adalah yang paling akhir masuk dan akan paling akhir keluar.`;
    }
}

export function enqueueQueue(val) {
    if (queueItems.length >= MAX_QUEUE_SIZE) {
        updateQueueStatus(`Queue Overflow! Kapasitas maksimum (${MAX_QUEUE_SIZE}) tercapai.`);
        flashWarning();
        return false;
    }
    const item = { id: idCounter++, val };
    queueItems.push(item);
    renderQueue(item.id, "enqueue");
    updateQueueStatus();
    return true;
}

export function dequeueQueue() {
    if (queueItems.length === 0) {
        updateQueueStatus("Queue Underflow! Queue sudah kosong, tidak ada elemen untuk di-dequeue.");
        flashWarning();
        return null;
    }
    const dequeued = queueItems[0];
    animateDequeue(dequeued.id, () => {
        queueItems.shift();
        renderQueue();
        updateQueueStatus();
    });
    return dequeued.val;
}

export function peekQueue() {
    if (queueItems.length === 0) {
        updateQueueStatus("Queue kosong, tidak ada elemen untuk di-peek.");
        return null;
    }
    const frontItem = queueItems[0];
    highlightItem(frontItem.id);
    updateQueueStatus(`Peek: Elemen terdepan (Front) adalah [${frontItem.val}].`);
    return frontItem.val;
}

export function clearQueue() {
    queueItems = [];
    renderQueue();
    updateQueueStatus();
}

function flashWarning() {
    if (!containerEl) return;
    containerEl.classList.add("ds-warning-flash");
    setTimeout(() => {
        containerEl.classList.remove("ds-warning-flash");
    }, 400);
}

function highlightItem(id) {
    const el = containerEl ? containerEl.querySelector(`[data-id="${id}"]`) : null;
    if (el) {
        el.classList.add("ds-highlight");
        setTimeout(() => el.classList.remove("ds-highlight"), 1000);
    }
}

function animateDequeue(id, callback) {
    const el = containerEl ? containerEl.querySelector(`[data-id="${id}"]`) : null;
    if (el) {
        el.classList.add("ds-dequeue-out");
        setTimeout(callback, 300);
    } else {
        callback();
    }
}

function renderQueue(animateId, type) {
    if (!containerEl) return;
    containerEl.textContent = "";

    const len = queueItems.length;
    queueItems.forEach((item, index) => {
        const itemEl = document.createElement("div");
        itemEl.className = "ds-queue-item";
        itemEl.setAttribute("data-id", item.id);

        const valSpan = document.createElement("span");
        valSpan.className = "ds-item-val";
        valSpan.textContent = item.val;
        itemEl.appendChild(valSpan);

        const isFront = index === 0;
        const isRear = index === len - 1;

        if (isFront) {
            const badge = document.createElement("span");
            badge.className = "ds-badge ds-badge-front";
            badge.textContent = queuePerspective === "fifo" ? "FRONT (1st Out)" : "FRONT";
            itemEl.appendChild(badge);
            if (queuePerspective === "fifo") {
                itemEl.classList.add("ds-primary-focus");
            }
        }

        if (isRear) {
            const badge = document.createElement("span");
            badge.className = "ds-badge ds-badge-rear";
            badge.textContent = queuePerspective === "lilo" ? "REAR (Last Out)" : "REAR";
            itemEl.appendChild(badge);
            if (queuePerspective === "lilo") {
                itemEl.classList.add("ds-primary-focus");
            }
        }

        if (item.id === animateId && type === "enqueue") {
            itemEl.classList.add("ds-enqueue-in");
        }

        containerEl.appendChild(itemEl);
    });
}
