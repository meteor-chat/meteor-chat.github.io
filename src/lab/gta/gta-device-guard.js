export function isUnsupportedDevice(win) {
    if (!win) return false;
    const minSide = Math.min(win.innerWidth || 0, win.innerHeight || 0);
    const coarse = typeof win.matchMedia === "function" && win.matchMedia("(pointer: coarse)").matches;
    const touchPoints = win.navigator ? win.navigator.maxTouchPoints || 0 : 0;
    return (coarse && minSide < 900) || (touchPoints > 1 && minSide < 720);
}
