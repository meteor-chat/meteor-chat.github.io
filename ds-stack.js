const MAX_STACK_SIZE = 6;

let stackItems = [];
let stackPerspective = "lifo";
let containerEl = null;
let statusEl = null;
let idCounter = 1;

export function initStack(container, status) {
    containerEl = container;
    statusEl = status;
    stackItems = [];
    renderStack();
}

export function setStackPerspective(persp) {
    stackPerspective = persp;
    renderStack();
    updateStackStatus();
}

function updateStackStatus(customMsg) {
    if (!statusEl) return;
    if (customMsg) {
        statusEl.textContent = customMsg;
        return;
    }
    if (stackItems.length === 0) {
        statusEl.textContent = "Stack kosong. Tekan 'Push' untuk memasukkan elemen.";
        return;
    }
    if (stackPerspective === "lifo") {
        const topVal = stackItems[stackItems.length - 1].val;
        statusEl.textContent = `Perspektif LIFO (Last-In, First-Out): Elemen teratas (${topVal}) adalah yang terakhir masuk dan akan pertama keluar saat Pop.`;
    } else {
        const bottomVal = stackItems[0].val;
        statusEl.textContent = `Perspektif FILO (First-In, Last-Out): Elemen terbawah (${bottomVal}) adalah yang pertama masuk dan terkunci hingga semua elemen di atasnya dikeluarkan.`;
    }
}

export function pushStack(val) {
    if (stackItems.length >= MAX_STACK_SIZE) {
        updateStackStatus(`Stack Overflow! Kapasitas maksimum (${MAX_STACK_SIZE}) tercapai.`);
        flashWarning();
        return false;
    }
    const item = { id: idCounter++, val };
    stackItems.push(item);
    renderStack(item.id, "push");
    updateStackStatus();
    return true;
}

export function popStack() {
    if (stackItems.length === 0) {
        updateStackStatus("Stack Underflow! Stack sudah kosong, tidak ada elemen untuk di-pop.");
        flashWarning();
        return null;
    }
    const popped = stackItems[stackItems.length - 1];
    animatePop(popped.id, () => {
        stackItems.pop();
        renderStack();
        updateStackStatus();
    });
    return popped.val;
}

export function peekStack() {
    if (stackItems.length === 0) {
        updateStackStatus("Stack kosong, tidak ada elemen untuk di-peek.");
        return null;
    }
    const topItem = stackItems[stackItems.length - 1];
    highlightItem(topItem.id);
    updateStackStatus(`Peek: Elemen teratas adalah [${topItem.val}].`);
    return topItem.val;
}

export function clearStack() {
    stackItems = [];
    renderStack();
    updateStackStatus();
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

function animatePop(id, callback) {
    const el = containerEl ? containerEl.querySelector(`[data-id="${id}"]`) : null;
    if (el) {
        el.classList.add("ds-pop-out");
        setTimeout(callback, 300);
    } else {
        callback();
    }
}

function renderStack(animateId, type) {
    if (!containerEl) return;
    containerEl.textContent = "";

    const len = stackItems.length;
    stackItems.forEach((item, index) => {
        const itemEl = document.createElement("div");
        itemEl.className = "ds-stack-item";
        itemEl.setAttribute("data-id", item.id);

        const valSpan = document.createElement("span");
        valSpan.className = "ds-item-val";
        valSpan.textContent = item.val;
        itemEl.appendChild(valSpan);

        const isTop = index === len - 1;
        const isBottom = index === 0;

        if (isTop) {
            const badge = document.createElement("span");
            badge.className = "ds-badge ds-badge-top";
            badge.textContent = stackPerspective === "lifo" ? "TOP (1st Out)" : "TOP";
            itemEl.appendChild(badge);
            if (stackPerspective === "lifo") {
                itemEl.classList.add("ds-primary-focus");
            }
        }

        if (isBottom) {
            const badge = document.createElement("span");
            badge.className = "ds-badge ds-badge-bottom";
            badge.textContent = stackPerspective === "filo" ? "BOTTOM (Last Out)" : "BOTTOM";
            itemEl.appendChild(badge);
            if (stackPerspective === "filo") {
                itemEl.classList.add("ds-primary-focus");
            }
        }

        if (item.id === animateId && type === "push") {
            itemEl.classList.add("ds-push-in");
        }

        containerEl.appendChild(itemEl);
    });
}
