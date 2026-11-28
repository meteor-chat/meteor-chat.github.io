export const STALE_TIMEOUT_MS = 2800;

export function getWindowShape(calibration = null) {
    if (typeof window === "undefined") {
        return { x: 0, y: 0, w: 800, h: 600, cx: 400, cy: 300 };
    }
    const rawX = typeof window.screenX === "number" ? window.screenX : (window.screenLeft || 0);
    const rawY = typeof window.screenY === "number" ? window.screenY : (window.screenTop || 0);
    const innerW = window.innerWidth || 800;
    const innerH = window.innerHeight || 600;
    const outerW = typeof window.outerWidth === "number" ? window.outerWidth : innerW;
    const outerH = typeof window.outerHeight === "number" ? window.outerHeight : innerH;
    const dw = Math.max(0, outerW - innerW);
    const dh = Math.max(0, outerH - innerH);
    const borderX = dw * 0.5;
    let chromeX = borderX;
    let chromeY = Math.max(0, dh - borderX);
    if (calibration && Math.abs(calibration.dw - dw) <= 2 && Math.abs(calibration.dh - dh) <= 2) {
        chromeX = calibration.dx;
        chromeY = calibration.dy;
    }
    const x = Math.round(rawX + chromeX);
    const y = Math.round(rawY + chromeY);
    const cx = x + innerW * 0.5;
    const outerMidY = (rawY + (y + innerH)) * 0.5;
    const minCy = y + Math.min(innerH * 0.36, 120);
    const maxCy = y + innerH * 0.64;
    const cy = dh > 0 ? Math.max(minCy, Math.min(maxCy, outerMidY)) : y + innerH * 0.5;
    return { x, y, w: innerW, h: innerH, cx, cy };
}

export function calibrateChromeFromEvent(event, win = typeof window !== "undefined" ? window : null) {
    if (!event || !win) return null;
    if (typeof event.screenX !== "number" || typeof event.screenY !== "number") return null;
    if (typeof event.clientX !== "number" || typeof event.clientY !== "number") return null;
    const rawX = typeof win.screenX === "number" ? win.screenX : (win.screenLeft || 0);
    const rawY = typeof win.screenY === "number" ? win.screenY : (win.screenTop || 0);
    const innerW = win.innerWidth || 800;
    const innerH = win.innerHeight || 600;
    const outerW = typeof win.outerWidth === "number" ? win.outerWidth : innerW;
    const outerH = typeof win.outerHeight === "number" ? win.outerHeight : innerH;
    const dw = Math.max(0, outerW - innerW);
    const dh = Math.max(0, outerH - innerH);
    const dx = (event.screenX - event.clientX) - rawX;
    const dy = (event.screenY - event.clientY) - rawY;
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return null;
    if (dx < -24 || dx > dw + 32 || dy < -24 || dy > dh + 32) return null;
    return { dx, dy, dw, dh };
}

export function pruneStaleWindows(windows, maxAgeMs = STALE_TIMEOUT_MS, now = Date.now()) {
    if (!Array.isArray(windows)) return [];
    return windows.filter((w) => w && (now - (w.timestamp || 0)) < maxAgeMs);
}

export function areWindowListsDifferent(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) return true;
    if (a.length !== b.length) return true;
    for (let i = 0; i < a.length; i += 1) {
        if (!a[i] || !b[i] || a[i].id !== b[i].id) return true;
        const sa = a[i].shape;
        const sb = b[i].shape;
        if (!sa || !sb) return true;
        if (sa.x !== sb.x || sa.y !== sb.y || sa.w !== sb.w || sa.h !== sb.h
            || sa.cx !== sb.cx || sa.cy !== sb.cy) return true;
    }
    return false;
}

export function mergeWindowsByNewest(current, incoming, selfId) {
    const map = new Map();
    for (const w of current) {
        if (w && typeof w.id === "number") map.set(w.id, w);
    }
    for (const w of incoming) {
        if (!w || typeof w.id !== "number") continue;
        if (w.id === selfId && map.has(selfId)) continue;
        const prev = map.get(w.id);
        if (!prev || (w.timestamp || 0) >= (prev.timestamp || 0)) {
            map.set(w.id, w);
        }
    }
    return pruneStaleWindows(Array.from(map.values()));
}
