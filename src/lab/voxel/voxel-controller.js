import { BLOCK, HOTBAR_ITEMS } from "./voxel-blocks.js";
import { buildCameraBasis, stepPlayerPhysics } from "./voxel-camera.js";
import { raycastVoxel } from "./voxel-raycast.js";
import { createVoxelRenderer } from "./voxel-renderer.js";
import { generateVoxelAtlasData } from "./voxel-textures.js";
import { createVoxelHud } from "./voxel-ui.js";
import { createVoxelWorld } from "./voxel-world.js";
import { getSpawnHeight } from "./voxel-world-gen.js";

function getEyePos(player) {
    return [player.pos[0], player.pos[1] + 1.54, player.pos[2]];
}

function getLookVector(yaw, pitch) {
    const cp = Math.cos(pitch);
    return [cp * Math.sin(yaw), Math.sin(pitch), -cp * Math.cos(yaw)];
}

export function createVoxelApp(root) {
    const canvas = root.querySelector("[data-voxel-gl]");
    if (!canvas) throw new Error("Missing voxel canvas");

    const seed = 2026;
    const atlas = generateVoxelAtlasData();
    const renderer = createVoxelRenderer(canvas, atlas);
    const world = createVoxelWorld({ seed, viewRadius: 3 });

    const spawnY = getSpawnHeight(8, 8, seed);
    world.warmAreaSync(8, 8, 0);

    const state = {
        timeSec: 0,
        timeOfDay: 0.28,
        autoCycle: false,
        selectedSlot: 6,
        actionMode: "break",
        destroyed: false,
        fps: 60,
        frameCount: 0,
        fpsTimer: 0,
        stats: { drawCalls: 0, culledSubs: 0, triCount: 0 }
    };

    const player = {
        pos: [8.5, spawnY, 8.5],
        vel: [0, 0, 0],
        yaw: 0.45,
        pitch: -0.22,
        flyMode: true,
        onGround: false,
        submerged: false
    };

    const keys = new Set();
    let dragging = false;
    let dragMoved = false;
    let lastX = 0;
    let lastY = 0;
    let rafId = 0;
    let lastTime = performance.now();

    const fallbackBanner = root.querySelector("[data-voxel-fallback]");
    if (!renderer && fallbackBanner) fallbackBanner.hidden = false;

    const hud = createVoxelHud(root, atlas, state, player, canvas);

    const performBlockAction = (place) => {
        const hit = raycastVoxel(getEyePos(player), getLookVector(player.yaw, player.pitch), 8.5, world.getBlock);
        if (!hit.hit) return;
        if (!place) {
            world.setBlock(hit.vx, hit.vy, hit.vz, BLOCK.AIR);
        } else {
            const tx = hit.vx + hit.nx;
            const ty = hit.vy + hit.ny;
            const tz = hit.vz + hit.nz;
            const item = HOTBAR_ITEMS[state.selectedSlot];
            if (!item) return;
            const insidePlayer =
                Math.abs(tx + 0.5 - player.pos[0]) < 0.72 &&
                Math.abs(tz + 0.5 - player.pos[2]) < 0.72 &&
                ty >= Math.floor(player.pos[1]) &&
                ty <= Math.floor(player.pos[1] + 1.65);
            if (!insidePlayer) world.setBlock(tx, ty, tz, item.id);
        }
        for (const msg of world.consumeMeshes()) {
            if (renderer) renderer.uploadMeshUpdate(msg.cx, msg.cz, msg.subs);
        }
    };

    const handleResize = () => {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const w = Math.max(2, Math.round(canvas.clientWidth * dpr));
        const h = Math.max(2, Math.round(canvas.clientHeight * dpr));
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
        }
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
        if (document.pointerLockElement === canvas) {
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
        if (document.pointerLockElement === canvas) {
            player.yaw += e.movementX * 0.0024;
            player.pitch = Math.max(-1.48, Math.min(1.48, player.pitch - e.movementY * 0.0024));
            return;
        }
        if (!dragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        if (Math.hypot(dx, dy) > 3) dragMoved = true;
        lastX = e.clientX;
        lastY = e.clientY;
        player.yaw += dx * 0.0045;
        player.pitch = Math.max(-1.48, Math.min(1.48, player.pitch - dy * 0.0045));
    };

    const onMouseUp = (e) => {
        if (dragging && !dragMoved && e.button === 0) {
            performBlockAction(e.shiftKey || state.actionMode === "place");
        }
        dragging = false;
    };

    const onWheel = (e) => {
        state.selectedSlot = (state.selectedSlot + (e.deltaY > 0 ? 1 : -1) + HOTBAR_ITEMS.length) % HOTBAR_ITEMS.length;
        hud.syncHud();
    };

    const onContextMenu = (e) => e.preventDefault();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("resize", handleResize);
    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("wheel", onWheel, { passive: true });
    canvas.addEventListener("contextmenu", onContextMenu);

    handleResize();
    hud.syncHud();
    for (const msg of world.consumeMeshes()) {
        if (renderer) renderer.uploadMeshUpdate(msg.cx, msg.cz, msg.subs);
    }

    const tick = (now) => {
        if (state.destroyed) return;
        const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) * 0.001));
        lastTime = now;
        state.timeSec += dt;
        if (state.autoCycle) state.timeOfDay = (state.timeOfDay + dt * 0.025) % 1;

        stepPlayerPhysics(player, keys, dt, world.getBlock);

        const unloaded = world.updateAround(player.pos[0], player.pos[2]);
        for (const u of unloaded) {
            if (renderer) renderer.unloadColumn(u.cx, u.cz);
        }
        for (const msg of world.consumeMeshes()) {
            if (renderer) renderer.uploadMeshUpdate(msg.cx, msg.cz, msg.subs);
        }

        handleResize();
        const eye = getEyePos(player);
        const look = getLookVector(player.yaw, player.pitch);
        const hit = raycastVoxel(eye, look, 8.5, world.getBlock);
        const aspect = canvas.width / Math.max(1, canvas.height);
        const cam = buildCameraBasis(eye, player.yaw, player.pitch, (70 * Math.PI) / 180, aspect);

        if (renderer) {
            state.stats = renderer.renderFrame(cam, eye, state.timeSec, state.timeOfDay, hit, player.submerged);
        }

        state.frameCount += 1;
        state.fpsTimer += dt;
        if (state.fpsTimer >= 0.45) {
            state.fps = Math.round(state.frameCount / state.fpsTimer);
            state.frameCount = 0;
            state.fpsTimer = 0;
            hud.updateTelemetry(world.getColumnCount());
        }
        rafId = requestAnimationFrame(tick);
    };

    hud.updateTelemetry(world.getColumnCount());
    rafId = requestAnimationFrame(tick);

    return {
        state,
        player,
        world,
        destroy() {
            state.destroyed = true;
            cancelAnimationFrame(rafId);
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
            window.removeEventListener("resize", handleResize);
            canvas.removeEventListener("mousedown", onMouseDown);
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
            canvas.removeEventListener("wheel", onWheel);
            canvas.removeEventListener("contextmenu", onContextMenu);
            world.destroy();
            if (renderer) renderer.destroy();
        }
    };
}
