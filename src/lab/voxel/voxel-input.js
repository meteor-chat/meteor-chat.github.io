import { HOTBAR_ITEMS } from "./voxel-blocks.js";

const MAX_PITCH = 1.48;

export function bindVisibility(doc, onHidden, onVisible) {
    const handler = () => (doc.hidden ? onHidden() : onVisible());
    doc.addEventListener("visibilitychange", handler);
    return () => doc.removeEventListener("visibilitychange", handler);
}

export function createVoxelInput({ canvas, player, state, hud, performBlockAction }) {
    const keys = new Set();
    let dragging = false;
    let dragMoved = false;
    let lastX = 0;
    let lastY = 0;

    const clampPitch = (value) => Math.max(-MAX_PITCH, Math.min(MAX_PITCH, value));
    const isLocked = () => document.pointerLockElement === canvas;

    const resetTransient = () => {
        keys.clear();
        dragging = false;
        dragMoved = false;
    };

    const onKeyDown = (e) => {
        keys.add(e.code);
        if (e.code >= "Digit1" && e.code <= "Digit9") {
            const idx = Number(e.code.replace("Digit", "")) - 1;
            if (idx >= 0 && idx < HOTBAR_ITEMS.length) {
                state.selectedSlot = idx;
                hud.syncHud();
            }
        } else if (e.code === "KeyF") {
            player.flyMode = !player.flyMode;
            hud.syncHud();
        }
    };
    const onKeyUp = (e) => keys.delete(e.code);

    const onMouseDown = (e) => {
        if (isLocked()) {
            performBlockAction(e.button === 2 || e.shiftKey || state.actionMode === "place");
            return;
        }
        if (e.button === 2) {
            performBlockAction(true);
            return;
        }
        dragging = true;
        dragMoved = false;
        lastX = e.clientX;
        lastY = e.clientY;
    };

    const onMouseMove = (e) => {
        if (isLocked()) {
            player.yaw += e.movementX * 0.0024;
            player.pitch = clampPitch(player.pitch - e.movementY * 0.0024);
            return;
        }
        if (!dragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        if (Math.hypot(dx, dy) > 3) dragMoved = true;
        lastX = e.clientX;
        lastY = e.clientY;
        player.yaw += dx * 0.0045;
        player.pitch = clampPitch(player.pitch - dy * 0.0045);
    };

    const onMouseUp = (e) => {
        if (dragging && !dragMoved && e.button === 0) {
            performBlockAction(e.shiftKey || state.actionMode === "place");
        }
        dragging = false;
    };

    const onWheel = (e) => {
        const count = HOTBAR_ITEMS.length;
        state.selectedSlot = (state.selectedSlot + (e.deltaY > 0 ? 1 : -1) + count) % count;
        hud.syncHud();
    };

    const onContextMenu = (e) => e.preventDefault();
    const onPointerLockChange = () => {
        dragging = false;
        dragMoved = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", resetTransient);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    document.addEventListener("pointerlockchange", onPointerLockChange);
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("wheel", onWheel, { passive: true });
    canvas.addEventListener("contextmenu", onContextMenu);

    const destroy = () => {
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
        window.removeEventListener("blur", resetTransient);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        document.removeEventListener("pointerlockchange", onPointerLockChange);
        canvas.removeEventListener("mousedown", onMouseDown);
        canvas.removeEventListener("wheel", onWheel);
        canvas.removeEventListener("contextmenu", onContextMenu);
    };

    return { keys, resetTransient, destroy };
}
