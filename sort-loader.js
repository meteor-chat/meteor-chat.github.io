const ALGORITHMS = {
    bubble: () => import("./sort-bubble.js?v=13").then((m) => m.bubbleSort),
    selection: () => import("./sort-selection.js?v=13").then((m) => m.selectionSort),
    insertion: () => import("./sort-insertion.js?v=13").then((m) => m.insertionSort),
    quick: () => import("./sort-quick.js?v=13").then((m) => m.quickSort),
    merge: () => import("./sort-merge.js?v=13").then((m) => m.mergeSort),
    shaker: () => import("./sort-shaker.js?v=13").then((m) => m.shakerSort)
};

let circlePromise = null;
let circleModule = null;

export function loadAlgorithm(type) {
    const load = ALGORITHMS[type];
    return load ? load() : Promise.resolve(null);
}

export function loadCircle() {
    if (!circlePromise) {
        circlePromise = import("./sort-circle-runner.js?v=13")
            .then((m) => {
                m.initCircleArray();
                circleModule = m;
                return m;
            })
            .catch((error) => {
                circlePromise = null;
                throw error;
            });
    }
    return circlePromise;
}

export function getLoadedCircle() {
    return circleModule;
}

function preloadAll() {
    Object.values(ALGORITHMS).forEach((load) => load().catch(() => {}));
    loadCircle().catch(() => {});
}

export function preloadWhenIdle() {
    if (navigator.connection && navigator.connection.saveData) return;
    const schedule = () => {
        if ("requestIdleCallback" in window) {
            window.requestIdleCallback(preloadAll, { timeout: 2000 });
        } else {
            setTimeout(preloadAll, 1000);
        }
    };
    if (document.readyState === "complete") {
        schedule();
    } else {
        window.addEventListener("load", schedule, { once: true });
    }
}
