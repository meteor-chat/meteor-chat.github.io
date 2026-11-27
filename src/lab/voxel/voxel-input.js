import { HOTBAR_ITEMS } from "./voxel-blocks.js";

const MAX_PITCH = 1.555;
const DOUBLE_TAP_MS = 300;
const DRAG_THRESHOLD_PX = 5;
const MAX_MOUSE_DELTA = 180;
const WHEEL_STEP = 20;

const PREVENT_KEYS = new Set(["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

export function bindVisibility(doc, onHidden, onVisible) {
    const handler = () => (doc.hidden ? onHidden() : onVisible());
    doc.addEventListener("visibilitychange", handler);
    return () => doc.removeEventListener("visibilitychange", handler);
}

function isEditableElement(el) {
    if (!el || !el.tagName) return false;
    const tag = el.tagName.toUpperCase();
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || Boolean(el.isContentEditable);
}

export function createVoxelInput({
    canvas,
    player,
    state,
    hud,
    performBlockAction,
    onPickBlock = null,
    onToggleFly = null,
    onToggleCatalog = null,
    onToggleLan = null,
    onOpenChat = null,
    onToggleMute = null,
    onEscape = null,
    onUserGesture = null
}) {
    const keys = new Set();
    let dragging = false;
    let dragMoved = false;
    let holdingBreak = false;
    let downX = 0;
    let downY = 0;
    let lastX = 0;
    let lastY = 0;
    let lastSpaceTime = 0;
    let lastWTime = 0;
    let wheelAcc = 0;

    const clampPitch = (value) => Math.max(-MAX_PITCH, Math.min(MAX_PITCH, value));
    const clampDelta = (value) => Math.max(-MAX_MOUSE_DELTA, Math.min(MAX_MOUSE_DELTA, value));
    const isLocked = () => document.pointerLockElement === canvas;
    const isOverlayOpen = () => Boolean(state.catalogOpen || state.lanOpen || state.chatOpen);

    const getHotbarLength = () => (Array.isArray(state.hotbar) ? state.hotbar.length : HOTBAR_ITEMS.length);

    const toggleFly = () => {
        player.flyMode = !player.flyMode;
        if (onToggleFly) onToggleFly(player.flyMode);
        hud.syncHud();
    };

    const resetTransient = () => {
        keys.clear();
        dragging = false;
        dragMoved = false;
        holdingBreak = false;
        wheelAcc = 0;
    };

    const onKeyDown = (e) => {
        if (onUserGesture) onUserGesture();
        const editable = isEditableElement(e.target);

        if (e.code === "Escape") {
            if (onEscape) onEscape();
            return;
        }
        if (editable) return;

        if (e.code === "AltLeft" || e.code === "AltRight") e.preventDefault();
        if (PREVENT_KEYS.has(e.code) && !(e.target && e.target.tagName === "BUTTON")) {
            e.preventDefault();
        }

        const hasModifier = e.ctrlKey || e.metaKey || e.altKey;

        if (e.code === "KeyE" && !e.repeat && !hasModifier && !state.lanOpen && !state.chatOpen) {
            if (onToggleCatalog) {
                e.preventDefault();
                onToggleCatalog();
            }
            return;
        }

        if (e.code === "KeyL" && !e.repeat && !hasModifier && !state.catalogOpen && !state.chatOpen) {
            if (onToggleLan) {
                e.preventDefault();
                onToggleLan();
            }
            return;
        }

        if (e.code === "KeyT" && !e.repeat && !hasModifier && !isOverlayOpen()) {
            if (onOpenChat) {
                e.preventDefault();
                onOpenChat();
            }
            return;
        }

        if (isOverlayOpen()) return;

        const now = performance.now();
        if (e.code === "Space" && !e.repeat && !hasModifier) {
            if (lastSpaceTime > 0 && now - lastSpaceTime <= DOUBLE_TAP_MS) {
                lastSpaceTime = 0;
                toggleFly();
            } else {
                lastSpaceTime = now;
            }
        } else if (e.code === "KeyW" && !e.repeat && !hasModifier) {
            if (lastWTime > 0 && now - lastWTime <= DOUBLE_TAP_MS) {
                player.sprintLatch = true;
                lastWTime = 0;
            } else {
                lastWTime = now;
            }
        }

        keys.add(e.code);

        if (!hasModifier && e.code >= "Digit1" && e.code <= "Digit9") {
            const idx = Number(e.code.replace("Digit", "")) - 1;
            if (idx >= 0 && idx < getHotbarLength()) {
                state.selectedSlot = idx;
                hud.syncHud();
            }
        } else if (e.code === "KeyF" && !e.repeat && !hasModifier) {
            toggleFly();
        } else if (e.code === "KeyM" && !e.repeat && !hasModifier && onToggleMute) {
            onToggleMute();
        } else if (hud.layout && !e.repeat && !hasModifier) {
            if (e.code === "F1") {
                e.preventDefault();
                hud.layout.toggleHideAll();
            } else if (e.code === "F3") {
                e.preventDefault();
                hud.layout.toggle("stats");
            } else if (e.code === "KeyH") {
                hud.layout.toggle("hotbar");
            }
        }
    };

    const onKeyUp = (e) => {
        keys.delete(e.code);
        if (e.code === "KeyW") player.sprintLatch = false;
    };

    const onMouseDown = (e) => {
        if (onUserGesture) onUserGesture();
        if (isOverlayOpen()) return;

        if (e.button === 1) {
            e.preventDefault();
            if (onPickBlock) onPickBlock();
            return;
        }

        if (isLocked()) {
            const isPlace = e.button === 2 || state.actionMode === "place";
            if (!isPlace && e.button === 0 && !player.flyMode) {
                holdingBreak = true;
            }
            performBlockAction(isPlace);
            return;
        }

        if (e.button === 2) {
            performBlockAction(true);
            return;
        }

        if (e.button === 0) {
            dragging = true;
            dragMoved = false;
            downX = e.clientX;
            downY = e.clientY;
            lastX = e.clientX;
            lastY = e.clientY;
        }
    };

    const onMouseMove = (e) => {
        if (isOverlayOpen()) return;
        const sens = state.settings ? state.settings.sensitivity : 1;
        if (isLocked()) {
            const mx = clampDelta(e.movementX || 0);
            const my = clampDelta(e.movementY || 0);
            player.yaw += mx * 0.0024 * sens;
            player.pitch = clampPitch(player.pitch - my * 0.0024 * sens);
            return;
        }
        if (!dragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        if (Math.hypot(e.clientX - downX, e.clientY - downY) > DRAG_THRESHOLD_PX) {
            dragMoved = true;
        }
        lastX = e.clientX;
        lastY = e.clientY;
        player.yaw += dx * 0.0045 * sens;
        player.pitch = clampPitch(player.pitch - dy * 0.0045 * sens);
    };

    const onMouseUp = (e) => {
        if (e.button === 0) holdingBreak = false;
        if (dragging && !dragMoved && e.button === 0 && !isOverlayOpen()) {
            performBlockAction(state.actionMode === "place");
        }
        dragging = false;
    };

    const onWheel = (e) => {
        if (isOverlayOpen() || e.deltaY === 0) return;
        wheelAcc += e.deltaY;
        if (Math.abs(wheelAcc) < WHEEL_STEP) return;
        const dir = wheelAcc > 0 ? 1 : -1;
        wheelAcc = 0;
        const count = getHotbarLength();
        state.selectedSlot = (state.selectedSlot + dir + count) % count;
        hud.syncHud();
    };

    const onContextMenu = (e) => e.preventDefault();
    const onPointerLockChange = () => resetTransient();
    const onPointerLockError = () => resetTransient();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", resetTransient);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    document.addEventListener("pointerlockchange", onPointerLockChange);
    document.addEventListener("pointerlockerror", onPointerLockError);
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("wheel", onWheel, { passive: true });
    canvas.addEventListener("contextmenu", onContextMenu);

    const destroy = () => {
        resetTransient();
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
        window.removeEventListener("blur", resetTransient);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        document.removeEventListener("pointerlockchange", onPointerLockChange);
        document.removeEventListener("pointerlockerror", onPointerLockError);
        canvas.removeEventListener("mousedown", onMouseDown);
        canvas.removeEventListener("wheel", onWheel);
        canvas.removeEventListener("contextmenu", onContextMenu);
    };

    return {
        keys,
        isHoldingBreak: () => holdingBreak,
        isLocked,
        resetTransient,
        destroy
    };
}
