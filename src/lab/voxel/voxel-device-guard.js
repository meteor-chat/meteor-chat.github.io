const NARROW_WIDTH = 700;

function matches(win, query) {
    return typeof win.matchMedia === "function" && Boolean(win.matchMedia(query).matches);
}

export function isUnsupportedDevice(win) {
    const nav = win.navigator || {};
    const touchPrimary = matches(win, "(pointer: coarse)") && matches(win, "(hover: none)");
    const ipadDesktopMode = nav.platform === "MacIntel" && nav.maxTouchPoints > 1;
    const narrowTouch = win.innerWidth < NARROW_WIDTH && !matches(win, "(pointer: fine)");
    return touchPrimary || ipadDesktopMode || narrowTouch;
}
