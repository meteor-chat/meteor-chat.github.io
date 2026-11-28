import {
    getWindowShape,
    calibrateChromeFromEvent,
    pruneStaleWindows,
    areWindowListsDifferent,
    mergeWindowsByNewest
} from "./window-coords.js";

export { getWindowShape, calibrateChromeFromEvent, pruneStaleWindows, areWindowListsDifferent };

const STORAGE_KEY = "meteor_multiwindow_state";
const COUNT_KEY = "meteor_multiwindow_count";
const CHANNEL_NAME = "meteor_multiwindow_bus";
const HEARTBEAT_INTERVAL_MS = 800;

export function createWindowManager(options = {}) {
    const hasStorage = typeof localStorage !== "undefined";
    const hasBroadcast = typeof globalThis.BroadcastChannel !== "undefined";
    let channel = hasBroadcast ? new globalThis.BroadcastChannel(CHANNEL_NAME) : null;
    let windows = [];
    let id = 0;
    let metaData = options.metaData || {};
    let chromeCal = null;
    let shape = getWindowShape(chromeCal);
    let sceneOffset = { x: -shape.x, y: -shape.y };
    let sceneOffsetTarget = { x: -shape.x, y: -shape.y };
    let falloff = options.falloff ?? 0.08;
    let onWindowsChange = options.onWindowsChange || null;
    let onShapeChange = options.onShapeChange || null;
    let heartbeatTimer = 0;

    const readStoredWindows = () => {
        if (!hasStorage) return [];
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return pruneStaleWindows(raw ? JSON.parse(raw) : []);
        } catch {
            return [];
        }
    };

    const persistWindows = () => {
        if (!hasStorage) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(windows));
        } catch {}
    };

    const broadcast = (type, payload = {}) => {
        if (channel) {
            try {
                channel.postMessage({ type, id, payload, timestamp: Date.now() });
            } catch {}
        }
    };

    const assignNextId = () => {
        if (!hasStorage) return 1;
        try {
            const cur = Number(localStorage.getItem(COUNT_KEY)) || 0;
            const next = cur + 1;
            localStorage.setItem(COUNT_KEY, String(next));
            return next;
        } catch {
            return Date.now() % 100000;
        }
    };

    const handlePointerCalibrate = (event) => {
        const nextCal = calibrateChromeFromEvent(event);
        if (!nextCal) return;
        const changed = !chromeCal
            || Math.abs(chromeCal.dx - nextCal.dx) > 0.5
            || Math.abs(chromeCal.dy - nextCal.dy) > 0.5
            || Math.abs(chromeCal.dw - nextCal.dw) > 1
            || Math.abs(chromeCal.dh - nextCal.dh) > 1;
        chromeCal = nextCal;
        if (changed) update(false);
    };

    const init = (initialMeta = {}) => {
        metaData = { ...metaData, ...initialMeta };
        id = assignNextId();
        shape = getWindowShape(chromeCal);
        sceneOffset = { x: -shape.x, y: -shape.y };
        sceneOffsetTarget = { x: -shape.x, y: -shape.y };

        windows = readStoredWindows();
        const thisWin = { id, shape, metaData, timestamp: Date.now() };
        windows = windows.filter((w) => w.id !== id);
        windows.push(thisWin);
        persistWindows();
        broadcast("joined", { window: thisWin });

        if (typeof window !== "undefined") {
            window.addEventListener("storage", handleStorageEvent);
            window.addEventListener("beforeunload", handleUnload);
            window.addEventListener("pagehide", handleUnload);
            window.addEventListener("pointermove", handlePointerCalibrate, { passive: true });
            window.addEventListener("pointerdown", handlePointerCalibrate, { passive: true });
            window.addEventListener("mousemove", handlePointerCalibrate, { passive: true });
            heartbeatTimer = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
        }
        if (channel) {
            channel.onmessage = handleChannelMessage;
        }
    };

    const handleStorageEvent = (event) => {
        if (event.key !== STORAGE_KEY || !event.newValue) return;
        try {
            const fresh = pruneStaleWindows(JSON.parse(event.newValue));
            const merged = mergeWindowsByNewest(windows, fresh, id);
            if (areWindowListsDifferent(windows, merged)) {
                windows = merged;
                if (onWindowsChange) onWindowsChange(windows);
            }
        } catch {}
    };

    const handleChannelMessage = (event) => {
        if (!event.data || event.data.id === id) return;
        const { type, payload } = event.data;
        if (type === "heartbeat" || type === "joined" || type === "shape") {
            const incoming = payload.window;
            if (!incoming) return;
            const idx = windows.findIndex((w) => w.id === incoming.id);
            if (idx >= 0) {
                if ((incoming.timestamp || 0) >= (windows[idx].timestamp || 0)) {
                    windows[idx] = incoming;
                }
            } else {
                windows.push(incoming);
            }
            windows = pruneStaleWindows(windows);
            if (onWindowsChange) onWindowsChange(windows);
        } else if (type === "left") {
            windows = windows.filter((w) => w.id !== payload.id);
            if (onWindowsChange) onWindowsChange(windows);
        } else if (type === "clear") {
            windows = windows.filter((w) => w.id === id);
            if (onWindowsChange) onWindowsChange(windows);
        }
    };

    const sendHeartbeat = () => {
        const idx = windows.findIndex((w) => w.id === id);
        if (idx >= 0) {
            windows[idx].timestamp = Date.now();
            windows[idx].shape = shape;
            windows[idx].metaData = metaData;
        }
        const cleaned = pruneStaleWindows(windows);
        if (cleaned.length !== windows.length) {
            windows = cleaned;
            persistWindows();
            if (onWindowsChange) onWindowsChange(windows);
        } else {
            persistWindows();
        }
        broadcast("heartbeat", { window: windows[idx] });
    };

    const handleUnload = () => {
        windows = windows.filter((w) => w.id !== id);
        persistWindows();
        broadcast("left", { id });
    };

    const update = (easing = true) => {
        const curShape = getWindowShape(chromeCal);
        const moved = curShape.x !== shape.x || curShape.y !== shape.y
            || curShape.w !== shape.w || curShape.h !== shape.h
            || curShape.cx !== shape.cx || curShape.cy !== shape.cy;

        shape = curShape;
        sceneOffsetTarget = { x: -shape.x, y: -shape.y };

        if (!easing) {
            sceneOffset.x = sceneOffsetTarget.x;
            sceneOffset.y = sceneOffsetTarget.y;
        } else {
            sceneOffset.x += (sceneOffsetTarget.x - sceneOffset.x) * falloff;
            sceneOffset.y += (sceneOffsetTarget.y - sceneOffset.y) * falloff;
        }

        if (moved) {
            const idx = windows.findIndex((w) => w.id === id);
            if (idx >= 0) {
                windows[idx].shape = shape;
                windows[idx].timestamp = Date.now();
                persistWindows();
                broadcast("shape", { window: windows[idx] });
            }
            if (onShapeChange) onShapeChange(shape);
        }
        return { shape, sceneOffset };
    };

    const setMetaData = (nextMeta, silent = false) => {
        metaData = {
            ...metaData,
            ...nextMeta,
            metaUpdatedAt: silent ? (nextMeta.metaUpdatedAt || metaData.metaUpdatedAt || 0) : Date.now()
        };
        const idx = windows.findIndex((w) => w.id === id);
        if (idx >= 0) {
            windows[idx].metaData = metaData;
            if (!silent) {
                windows[idx].timestamp = Date.now();
                persistWindows();
                broadcast("heartbeat", { window: windows[idx] });
            }
        }
    };

    const clearAll = () => {
        if (hasStorage) {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(COUNT_KEY);
        }
        windows = [];
        broadcast("clear");
        init(metaData);
    };

    const destroy = () => {
        handleUnload();
        if (heartbeatTimer && typeof window !== "undefined") {
            window.clearInterval(heartbeatTimer);
            heartbeatTimer = 0;
        }
        if (typeof window !== "undefined") {
            window.removeEventListener("storage", handleStorageEvent);
            window.removeEventListener("beforeunload", handleUnload);
            window.removeEventListener("pagehide", handleUnload);
            window.removeEventListener("pointermove", handlePointerCalibrate);
            window.removeEventListener("pointerdown", handlePointerCalibrate);
            window.removeEventListener("mousemove", handlePointerCalibrate);
        }
        if (channel) {
            channel.close();
            channel = null;
        }
    };

    return {
        init,
        update,
        setMetaData,
        getWindows: () => [...windows].sort((a, b) => a.id - b.id),
        getThisWindowId: () => id,
        getThisWindowData: () => windows.find((w) => w.id === id) || null,
        getShape: () => ({ ...shape }),
        getSceneOffset: () => ({ ...sceneOffset }),
        setOnWindowsChange: (fn) => { onWindowsChange = fn; },
        setOnShapeChange: (fn) => { onShapeChange = fn; },
        clearAll,
        destroy
    };
}
