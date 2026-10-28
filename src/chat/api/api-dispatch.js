export function createTwoTierTimeoutSignal(firstByteMs = 8000, inStreamMs = 15000, parentSignal) {
    const controller = new AbortController();
    let timeoutId;

    const setTimer = (ms) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            controller.abort(new Error("Timeout"));
        }, ms);
    };

    setTimer(firstByteMs);

    const resetTimeout = () => {
        setTimer(inStreamMs);
    };

    const onParentAbort = () => {
        if (timeoutId) clearTimeout(timeoutId);
        controller.abort(parentSignal.reason);
    };

    if (parentSignal) {
        if (parentSignal.aborted) {
            onParentAbort();
        } else {
            parentSignal.addEventListener("abort", onParentAbort);
        }
    }

    return {
        signal: controller.signal,
        resetTimeout,
        clear: () => {
            if (timeoutId) clearTimeout(timeoutId);
            if (parentSignal) parentSignal.removeEventListener("abort", onParentAbort);
        }
    };
}

export function rankModelsByIntent(modelList, queryType) {
    if (!modelList || modelList.length === 0) return [];
    const isHeavy = queryType === "heavy";
    const fastList = [
        "nvidia/nemotron-3-super-120b-a12b:free",
        "dots-studio/dots-3-note-preview:free",
        "nvidia/nemotron-3-ultra-550b-a55b:free",
        "cohere/north-mini-code:free",
        "poolside/laguna-xs-2.1:free",
        "poolside/laguna-s-2.1:free"
    ];
    const heavyList = [
        "nvidia/nemotron-3-ultra-550b-a55b:free",
        "cohere/north-mini-code:free",
        "dots-studio/dots-3-note-preview:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
        "poolside/laguna-s-2.1:free",
        "poolside/laguna-xs-2.1:free"
    ];
    const priority = isHeavy ? [...heavyList, ...fastList] : [...fastList, ...heavyList];
    const ordered = [];
    for (const m of priority) {
        if (modelList.includes(m) && !ordered.includes(m)) ordered.push(m);
    }
    for (const m of modelList) {
        if (!ordered.includes(m)) ordered.push(m);
    }
    return ordered;
}

export function selectModels(modelList, queryType, currentIndex = 0, count = 3) {
    const ranked = rankModelsByIntent(modelList, queryType);
    if (ranked.length === 0) return { models: [], nextIndex: 0 };
    const num = Math.min(count, ranked.length);
    const selected = [];
    for (let i = 0; i < num; i++) {
        selected.push(ranked[(currentIndex + i) % ranked.length]);
    }
    const nextIndex = (currentIndex + 1) % ranked.length;
    return { models: selected, nextIndex };
}
