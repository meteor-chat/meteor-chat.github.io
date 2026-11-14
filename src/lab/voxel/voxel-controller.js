import { BLOCK, HOTBAR_ITEMS } from "./voxel-blocks.js";
import { buildCameraBasis } from "./voxel-camera.js";
import { stepPlayerPhysics } from "./voxel-physics.js";
import { bindVisibility, createVoxelInput } from "./voxel-input.js";
import { createMobSystem } from "./voxel-mob-system.js";
import { createCatSpawner } from "./voxel-mob-spawn.js";
import { mulberry32 } from "./voxel-noise.js";
import { createQualityController } from "./voxel-quality.js";
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
    const viewRadius = 3;
    const world = createVoxelWorld({ seed, viewRadius });
    const fallbackBanner = root.querySelector("[data-voxel-fallback]");
    const lostBanner = root.querySelector("[data-voxel-context-lost]");
    const setLostBanner = (visible) => {
        if (lostBanner) lostBanner.hidden = !visible;
    };
    const quality = createQualityController();
    const renderer = createVoxelRenderer(canvas, atlas, {
        fogRange: [viewRadius * 8, viewRadius * 16],
        onContextLost: () => setLostBanner(true),
        onContextRestored: () => {
            setLostBanner(false);
            quality.reset();
            world.remeshAll();
        },
        onContextError: () => setLostBanner(true)
    });
    if (!renderer && fallbackBanner) fallbackBanner.hidden = false;

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
        renderScale: 1,
        stats: { drawCalls: 0, culledSubs: 0, triCount: 0, uploads: 0, queued: 0, gpuMs: null }
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

    let rafId = 0;
    let paused = false;
    let lastTime = performance.now();

    const mobRng = mulberry32(seed ^ 0x2f6b9a1d);
    const isColumnLoaded = (wx, wz) => Boolean(world.getColumn(Math.floor(wx / 16), Math.floor(wz / 16)));
    const mobs = createMobSystem({ getBlock: world.getBlock, rng: mobRng, isLoaded: isColumnLoaded });
    const catSpawner = createCatSpawner({ mobs, world, seed, rng: mobRng });
    const hud = createVoxelHud(root, atlas, state, player, canvas);

    const uploadMeshes = (urgent) => {
        for (const msg of world.consumeMeshes()) {
            if (renderer) renderer.uploadMeshUpdate(msg.cx, msg.cz, msg.subs, urgent);
        }
    };

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
        uploadMeshes(true);
    };

    const input = createVoxelInput({ canvas, player, state, hud, performBlockAction });

    const handleResize = () => {
        const dpr = Math.min(2, window.devicePixelRatio || 1) * state.renderScale;
        const w = Math.max(2, Math.round(canvas.clientWidth * dpr));
        const h = Math.max(2, Math.round(canvas.clientHeight * dpr));
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
        }
    };
    window.addEventListener("resize", handleResize);

    handleResize();
    hud.syncHud();
    uploadMeshes(false);
    if (renderer) renderer.flushUploads();

    const tick = (now) => {
        if (state.destroyed || paused) return;
        const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) * 0.001));
        lastTime = now;
        state.timeSec += dt;
        state.renderScale = quality.update(dt);
        if (state.autoCycle) state.timeOfDay = (state.timeOfDay + dt * 0.025) % 1;

        stepPlayerPhysics(player, input.keys, dt, world.getBlock);
        mobs.update(dt, player.pos);
        catSpawner.update(dt, player.pos, player.yaw);

        const unloaded = world.updateAround(player.pos[0], player.pos[2]);
        for (const u of unloaded) {
            if (renderer) renderer.unloadColumn(u.cx, u.cz);
        }
        uploadMeshes(false);

        handleResize();
        const eye = getEyePos(player);
        const look = getLookVector(player.yaw, player.pitch);
        const hit = raycastVoxel(eye, look, 8.5, world.getBlock);
        const aspect = canvas.width / Math.max(1, canvas.height);
        const cam = buildCameraBasis(eye, player.yaw, player.pitch, (70 * Math.PI) / 180, aspect);

        if (renderer) {
            state.stats = renderer.renderFrame(cam, eye, state.timeSec, state.timeOfDay, hit, player.submerged, mobs.cats);
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

    const pauseLoop = () => {
        if (paused) return;
        paused = true;
        cancelAnimationFrame(rafId);
        input.resetTransient();
    };

    const resumeLoop = () => {
        if (!paused || state.destroyed) return;
        paused = false;
        lastTime = performance.now();
        quality.reset();
        rafId = requestAnimationFrame(tick);
    };

    const unbindVisibility = bindVisibility(document, pauseLoop, resumeLoop);

    hud.updateTelemetry(world.getColumnCount());
    rafId = requestAnimationFrame(tick);

    return {
        state,
        player,
        world,
        mobs,
        pause: pauseLoop,
        resume: resumeLoop,
        destroy() {
            state.destroyed = true;
            mobs.clear();
            cancelAnimationFrame(rafId);
            unbindVisibility();
            input.destroy();
            window.removeEventListener("resize", handleResize);
            world.destroy();
            if (renderer) renderer.destroy();
        }
    };
}
