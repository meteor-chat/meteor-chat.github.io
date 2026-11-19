import { MODEL_TIERS } from "../../core/config.js";

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

export function rankModelsByIntent(modelList, queryType, tiers = MODEL_TIERS) {
    if (!modelList || modelList.length === 0) return [];
    const isHeavy = queryType === "heavy";
    const priority = isHeavy
        ? [...tiers.heavy, ...tiers.fast, ...tiers.last]
        : [...tiers.fast, ...tiers.heavy, ...tiers.last];
    const ordered = [];
    for (const m of priority) {
        if (modelList.includes(m) && !ordered.includes(m)) ordered.push(m);
    }
    for (const m of modelList) {
        if (!ordered.includes(m)) ordered.push(m);
    }
    return ordered;
}
function splitByTier(modelList, queryType, tiers) {
    const isHeavy = queryType === "heavy";
    const inPool = (list) => list.filter((m) => modelList.includes(m));
    const known = new Set([...tiers.heavy, ...tiers.fast, ...tiers.last]);
    const extras = modelList.filter((m) => !known.has(m));
    return {
        primary: inPool(isHeavy ? tiers.heavy : tiers.fast),
        rest: [...inPool(isHeavy ? tiers.fast : tiers.heavy), ...inPool(tiers.last), ...extras]
    };
}

export function selectModels(modelList, queryType, currentIndex = 0, count = 3, excluded = [], tiers = MODEL_TIERS) {
    const ranked = rankModelsByIntent(modelList, queryType, tiers);
    if (ranked.length === 0) return { models: [], nextIndex: 0 };
    const num = Math.min(count, ranked.length);
    const skip = new Set(excluded);
    const split = splitByTier(modelList, queryType, tiers);
    let primary = split.primary.filter((m) => !skip.has(m));
    let rest = split.rest.filter((m) => !skip.has(m));
    if (primary.length + rest.length === 0) {
        primary = split.primary;
        rest = split.rest;
    }
    const selected = [];
    for (let i = 0; i < Math.min(num, primary.length); i++) {
        selected.push(primary[(currentIndex + i) % primary.length]);
    }
    for (const m of [...rest, ...ranked]) {
        if (selected.length >= num) break;
        if (!selected.includes(m)) selected.push(m);
    }
    const nextIndex = (currentIndex + num) % Math.max(1, primary.length);
    return { models: selected, nextIndex };
}

export const MODEL_COOLDOWN = Object.freeze({ rate_limit: 60000, server_error: 30000 });

export function createModelHealth(now = () => Date.now()) {
    const failures = new Map();
    const excluded = () => {
        const current = now();
        const out = [];
        for (const [model, h] of failures) {
            if (current - h.failedAt >= h.cooldown) failures.delete(model);
            else out.push(model);
        }
        return out;
    };
    return {
        markFailed(models, cooldownMs) {
            const failedAt = now();
            for (const model of models) failures.set(model, { failedAt, cooldown: cooldownMs });
        },
        isCooling: (model) => excluded().includes(model),
        excluded,
        clear: () => failures.clear()
    };
}