const NARROW_WIDTH = 700;

function matches(win, query) {
    return typeof win.matchMedia === "function" && Boolean(win.matchMedia(query).matches);
}

export function isUnsupportedDevice(win) {
    const nav = win.navigator || {};
    const anyFine = matches(win, "(any-pointer: fine)");
    const touchPrimary = matches(win, "(pointer: coarse)") && matches(win, "(hover: none)") && !anyFine;
    const ipadDesktopMode = nav.platform === "MacIntel" && nav.maxTouchPoints > 1 && !anyFine;
    const narrowTouch = win.innerWidth < NARROW_WIDTH && !matches(win, "(pointer: fine)") && !anyFine;
    return touchPrimary || ipadDesktopMode || narrowTouch;
}
