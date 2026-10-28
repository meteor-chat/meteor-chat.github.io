const CODE_LOADERS = {
    bubble: () => import("./sort-code-bubble.js?v=1").then((m) => m.bubbleSortCode),
    insertion: () => import("./sort-code-insertion.js?v=1").then((m) => m.insertionSortCode),
    selection: () => import("./sort-code-selection.js?v=1").then((m) => m.selectionSortCode),
    quick: () => import("./sort-code-quick.js?v=1").then((m) => m.quickSortCode),
    merge: () => import("./sort-code-merge.js?v=1").then((m) => m.mergeSortCode),
    shaker: () => import("./sort-code-shaker.js?v=1").then((m) => m.shakerSortCode)
};

export function loadAlgorithmCode(algo) {
    const loader = CODE_LOADERS[algo];
    return loader ? loader() : Promise.resolve(null);
}

export function preloadAllCodes() {
    Object.values(CODE_LOADERS).forEach((loader) => loader().catch(() => {}));
}
