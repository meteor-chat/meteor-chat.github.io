import { createVoxelAudio } from "./voxel-audio.js";
import {
    BLOCK,
    CATALOG_BY_ID,
    HOTBAR_ITEMS,
    getBlockHardness,
    getBlockMaterial,
    isSolid
} from "./voxel-blocks.js";
import { buildCameraBasis } from "./voxel-camera.js";
import { createVoxelHand } from "./voxel-hand.js";
import { bindVisibility, createVoxelInput } from "./voxel-input.js";
import {
    createCatSpawner,
    createChickenSpawner,
    createGolemSpawner,
    createVillagerSpawner
} from "./voxel-mob-spawn.js";
import { createMobSystem } from "./voxel-mob-system.js";
import { mulberry32 } from "./voxel-noise.js";
import { createVoxelParticles } from "./voxel-particles.js";
import { EYE_STAND, PLAYER_H, PLAYER_HW, stepPlayerPhysics, unstickPlayer } from "./voxel-physics.js";
import { createQualityController } from "./voxel-quality.js";
import { raycastMob, raycastVoxel } from "./voxel-raycast.js";
import { createVoxelRenderer } from "./voxel-renderer.js";
import { generateVoxelAtlasData } from "./voxel-textures.js";
import { createVoxelHud } from "./voxel-ui.js";
import { getNearbyVillages, getVillageMeta } from "./voxel-village-gen.js";
import { createVoxelWorld } from "./voxel-world.js";
import { findSafeSpawn } from "./voxel-world-gen.js";

function getEyePos(player) {
    const eyeH = typeof player.eyeHeight === "number" ? player.eyeHeight : EYE_STAND;
    return [player.pos[0], player.pos[1] + eyeH, player.pos[2]];
}

function getLookVector(yaw, pitch) {
    const cp = Math.cos(pitch);
    return [cp * Math.sin(yaw), Math.sin(pitch), -cp * Math.cos(yaw)];
}

function blockOverlapsBox(tx, ty, tz, px, py, pz, hw, h) {
    return (
        tx < px + hw &&
        tx + 1 > px - hw &&
        ty < py + h &&
        ty + 1 > py &&
        tz < pz + hw &&
        tz + 1 > pz - hw
    );
}

export function createVoxelApp(root) {
    const canvas = root.querySelector("[data-voxel-gl]");
    if (!canvas) throw new Error("Missing voxel canvas");

    const seed = 2026;
    const atlas = generateVoxelAtlasData();
    const viewRadius = 6;
    const fallbackBanner = root.querySelector("[data-voxel-fallback]");
    const lostBanner = root.querySelector("[data-voxel-context-lost]");
    const setLostBanner = (visible) => {
        if (lostBanner) lostBanner.hidden = !visible;
    };
    const quality = createQualityController();
    const renderer = createVoxelRenderer(canvas, atlas, {
        fogRange: [viewRadius * 10, viewRadius * 16],
        onContextLost: () => setLostBanner(true),
        onContextRestored: () => {
            setLostBanner(false);
            quality.reset();
            world.remeshAll();
        },
        onContextError: () => setLostBanner(true)
    });
    if (!renderer && fallbackBanner) fallbackBanner.hidden = false;

    const world = createVoxelWorld({ seed, viewRadius, useWorker: Boolean(renderer) });
    world.warmAreaSync(8, 8, renderer ? 1 : 0);
    const spawnPos = findSafeSpawn(world, 8, 8, seed);

    const state = {
        timeSec: 0,
        timeOfDay: 0.28,
        autoCycle: false,
        rain: false,
        rainIntensity: 0,
        selectedSlot: 6,
        hotbar: HOTBAR_ITEMS.map((item) => ({ ...item })),
        actionMode: "break",
        catalogOpen: false,
        destroyed: false,
        fps: 60,
        frameCount: 0,
        fpsTimer: 0,
        renderScale: 1,
        stats: { drawCalls: 0, culledSubs: 0, triCount: 0, uploads: 0, queued: 0, gpuMs: null }
    };

    state.settings = { sensitivity: 1, fov: 70, viewRadius: 6, resMode: "auto", lockedRes: 1.0, muted: false };

    const player = {
        pos: [spawnPos[0], spawnPos[1], spawnPos[2]],
        vel: [0, 0, 0],
        yaw: 2.35,
        pitch: -0.12,
        eyeHeight: EYE_STAND,
        walkDist: 0,
        flyMode: false,
        onGround: true,
        submerged: false,
        sneaking: false,
        sprinting: false
    };

    let rafId = 0;
    let manualPaused = false;
    let tabHidden = false;
    let lastTime = performance.now();
    let currentFov = state.settings.fov;
    let lastStepDist = 0;
    let torchParticleAcc = 0;
    let chimneyAcc = 0;
    let forgeAudioAcc = 6;
    let saveTimer = 0;
    let breakTarget = "";
    let breakElapsed = 0;
    let breakProgress = 0;
    const handLightBuf = new Float32Array(4);

    const audio = createVoxelAudio();
    const particles = createVoxelParticles();
    const hand = createVoxelHand();

    const mobRng = mulberry32(seed ^ 0x2f6b9a1d);
    const isLoadedWorld = (wx, wz) => world.isColumnLoaded(Math.floor(wx / 16), Math.floor(wz / 16));
    const mobs = createMobSystem({
        getBlock: world.getBlock,
        getLight: world.getLight,
        rng: mobRng,
        isLoaded: isLoadedWorld,
        onVillagerHum: () => audio.playMob("villager")
    });
    const catSpawner = createCatSpawner({ mobs, world, seed, rng: mobRng });
    const chickenSpawner = createChickenSpawner({ mobs, world, seed, rng: mobRng });
    const villagerSpawner = createVillagerSpawner({ mobs, world, seed, rng: mobRng });
    const golemSpawner = createGolemSpawner({ mobs, world, seed, rng: mobRng });

    const syncSelectedHand = () => {
        const item = state.hotbar[state.selectedSlot];
        if (item) hand.setBlock(item.id);
    };

    const handleResize = () => {
        const dpr = Math.min(2, window.devicePixelRatio || 1) * state.renderScale;
        const w = Math.max(2, Math.round(canvas.clientWidth * dpr));
        const h = Math.max(2, Math.round(canvas.clientHeight * dpr));
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
        }
    };

    const hud = createVoxelHud(root, atlas, state, player, canvas, {
        onViewDistance: (radius) => {
            world.setViewRadius(radius);
            if (renderer) renderer.setFogRange(radius * 10, radius * 16);
        },
        onResolutionChange: () => {
            if (state.settings.resMode === "lock") {
                state.renderScale = state.settings.lockedRes;
            } else {
                quality.reset();
                state.renderScale = quality.getScale();
            }
            handleResize();
        },
        onToggleFly: (fly) => {
            if (!fly) unstickPlayer(player, world.getBlock);
        },
        onHotbarChange: syncSelectedHand,
        onAudioToggle: (muted) => audio.setMuted(muted),
        onResetWorld: () => {
            world.resetEdits().then(() => {
                if (state.destroyed) return;
                const resetPos = findSafeSpawn(world, 8, 8, seed);
                player.pos[0] = resetPos[0];
                player.pos[1] = resetPos[1];
                player.pos[2] = resetPos[2];
                player.vel[1] = 0;
                uploadMeshes(true);
            });
        }
    });
    audio.setMuted(state.settings.muted);
    syncSelectedHand();

    const uploadMeshes = (urgent) => {
        for (const msg of world.consumeMeshes()) {
            if (renderer) renderer.uploadMeshUpdate(msg.cx, msg.cz, msg.subs, urgent);
        }
    };

    const breakVoxelAt = (vx, vy, vz, oldId) => {
        if (oldId === BLOCK.BEDROCK) return false;
        const ok = world.setBlock(vx, vy, vz, BLOCK.AIR);
        if (!ok) return false;
        audio.playBreak(getBlockMaterial(oldId));
        particles.spawnBlockBreak(vx, vy, vz, oldId);
        hand.triggerSwing();
        uploadMeshes(true);
        return true;
    };

    const performBlockAction = (place) => {
        const eye = getEyePos(player);
        const look = getLookVector(player.yaw, player.pitch);
        const mobHit = raycastMob(eye, look, 5.5, mobs.all);
        const hit = raycastVoxel(eye, look, 8.5, world.getBlock, {
            includeFluids: !place && input.keys.has("ShiftLeft")
        });

        if (mobHit && (!hit.hit || mobHit.dist < hit.dist)) {
            hand.triggerSwing();
            audio.playMob(mobHit.mob.kind);
            return;
        }
        if (!hit.hit) return;

        if (!place) {
            if (!player.flyMode && input.isLocked() && input.isHoldingBreak()) {
                const hardness = getBlockHardness(hit.blockId);
                if (hardness > 0.05) {
                    hand.triggerSwing();
                    return;
                }
            }
            breakVoxelAt(hit.vx, hit.vy, hit.vz, hit.blockId);
            breakProgress = 0;
            breakElapsed = 0;
        } else {
            const tx = hit.vx + hit.nx;
            const ty = hit.vy + hit.ny;
            const tz = hit.vz + hit.nz;
            const item = state.hotbar[state.selectedSlot];
            if (!item) return;
            if (isSolid(item.id)) {
                if (blockOverlapsBox(tx, ty, tz, player.pos[0], player.pos[1], player.pos[2], PLAYER_HW, PLAYER_H)) {
                    return;
                }
                for (const m of mobs.all) {
                    if (blockOverlapsBox(tx, ty, tz, m.pos[0], m.pos[1], m.pos[2], m.hw, m.h)) return;
                }
            }
            if (world.setBlock(tx, ty, tz, item.id)) {
                audio.playPlace(getBlockMaterial(item.id));
                hand.triggerSwing();
                uploadMeshes(true);
            }
        }
    };

    const pickBlock = () => {
        const hit = raycastVoxel(getEyePos(player), getLookVector(player.yaw, player.pitch), 8.5, world.getBlock);
        if (!hit.hit) return;
        const entry = CATALOG_BY_ID.get(hit.blockId);
        if (!entry) return;
        const existingIdx = state.hotbar.findIndex((slot) => slot.id === entry.id);
        if (existingIdx >= 0) {
            state.selectedSlot = existingIdx;
        } else {
            state.hotbar[state.selectedSlot] = { ...entry };
            hud.renderHotbarSlot(state.selectedSlot);
        }
        hud.syncHud();
    };

    const input = createVoxelInput({
        canvas,
        player,
        state,
        hud,
        performBlockAction,
        onPickBlock: pickBlock,
        onToggleFly: (fly) => {
            if (!fly) unstickPlayer(player, world.getBlock);
        },
        onToggleCatalog: () => hud.toggleCatalog(),
        onToggleMute: () => {
            state.settings.muted = !state.settings.muted;
            audio.setMuted(state.settings.muted);
            hud.syncHud();
        },
        onEscape: () => hud.closeOverlays(),
        onUserGesture: () => audio.unlock()
    });

    window.addEventListener("resize", handleResize);
    handleResize();
    hud.syncHud();
    uploadMeshes(false);
    if (renderer) renderer.flushUploads();

    if (renderer) {
        world.hydrateStorage().then((loaded) => {
            if (!state.destroyed && loaded > 0) uploadMeshes(false);
        });
        world.getStorage().loadPlayer().then((saved) => {
            if (state.destroyed || !saved || !Array.isArray(saved.pos)) return;
            if (saved.pos.every(Number.isFinite) && saved.pos[1] > 2 && saved.pos[1] < 124) {
                world.warmAreaSync(saved.pos[0], saved.pos[2], 1);
                player.pos[0] = saved.pos[0];
                player.pos[1] = saved.pos[1];
                player.pos[2] = saved.pos[2];
                if (Number.isFinite(saved.yaw)) player.yaw = saved.yaw;
                if (Number.isFinite(saved.pitch)) player.pitch = saved.pitch;
                if (typeof saved.flyMode === "boolean") player.flyMode = saved.flyMode;
                if (!player.flyMode) unstickPlayer(player, world.getBlock);
                hud.syncHud();
                uploadMeshes(false);
            }
        });
    }

    const stepNearbyTorchParticles = (dt) => {
        torchParticleAcc += dt;
        if (torchParticleAcc < 0.16) return;
        torchParticleAcc = 0;
        const px = Math.floor(player.pos[0]);
        const py = Math.floor(player.pos[1]);
        const pz = Math.floor(player.pos[2]);
        for (let i = 0; i < 16; i += 1) {
            const x = px + Math.floor(Math.random() * 17) - 8;
            const y = py + Math.floor(Math.random() * 7) - 2;
            const z = pz + Math.floor(Math.random() * 17) - 8;
            if (world.getBlock(x, y, z) === BLOCK.TORCH) {
                particles.spawnTorchEmber(x, y, z);
            }
        }
    };

    const stepVillageAtmosphere = (dt) => {
        chimneyAcc += dt;
        forgeAudioAcc -= dt;
        if (chimneyAcc < 0.34) return;
        chimneyAcc = 0;
        const px = player.pos[0];
        const pz = player.pos[2];
        const nearby = getNearbyVillages(px - 72, pz - 72, px + 72, pz + 72, seed);
        if (nearby.length === 0) return;
        let nearForge = false;
        for (const v of nearby) {
            const meta = getVillageMeta(v.vx, v.vz, seed);
            for (const ch of meta.chimneys) {
                const dist = Math.hypot(ch.x - px, ch.z - pz);
                if (dist > 64) continue;
                if (ch.isForge && dist < 24) nearForge = true;
                if (Math.random() < (ch.isForge ? 0.55 : 0.24)) {
                    particles.spawnChimneySmoke(ch.x, ch.y, ch.z);
                    if (ch.isForge && Math.random() < 0.45) {
                        particles.spawnForgeSpark(ch.x, ch.y, ch.z);
                    }
                }
            }
        }
        if (nearForge && forgeAudioAcc <= 0) {
            forgeAudioAcc = 7 + Math.random() * 9;
            audio.playVillageForge();
        }
    };

    const isLoopPaused = () => manualPaused || tabHidden;

    const tick = (now) => {
        if (state.destroyed || isLoopPaused()) return;
        const rawDt = Math.max(0.0005, (now - lastTime) * 0.001);
        const dt = Math.min(0.05, rawDt);
        lastTime = now;
        state.timeSec += dt;

        if (state.settings.resMode === "lock") {
            state.renderScale = state.settings.lockedRes;
        } else {
            state.renderScale = quality.update(dt);
        }
        if (state.autoCycle) state.timeOfDay = (state.timeOfDay + dt * 0.025) % 1;
        const targetRain = state.rain ? 1 : 0;
        state.rainIntensity += (targetRain - state.rainIntensity) * Math.min(1, dt * 1.8);

        stepPlayerPhysics(player, input.keys, dt, world.getBlock, world.isColumnLoaded);

        if (player.onGround && !player.flyMode && player.walkDist - lastStepDist >= 1.85) {
            lastStepDist = player.walkDist;
            const below = world.getBlock(player.pos[0], player.pos[1] - 0.1, player.pos[2]);
            audio.playFootstep(getBlockMaterial(below));
        }
        if (player.justLanded) {
            const below = world.getBlock(player.pos[0], player.pos[1] - 0.1, player.pos[2]);
            audio.playLand(getBlockMaterial(below), player.landImpact);
        }
        if (player.justSplashed) {
            audio.playSplash(Math.abs(player.vel[1]) / 8);
            particles.spawnSplash(player.pos[0], player.pos[1] + 0.5, player.pos[2]);
        }

        const fovTarget = state.settings.fov + (player.sprinting ? 7 : 0);
        currentFov += (fovTarget - currentFov) * Math.min(1, dt * 10);
        const fovRad = (currentFov * Math.PI) / 180;

        mobs.update(dt, player.pos, state.timeOfDay);
        catSpawner.update(dt, player.pos, player.yaw, fovRad);
        chickenSpawner.update(dt, player.pos, player.yaw, fovRad);
        villagerSpawner.update(dt, player.pos);
        golemSpawner.update(dt, player.pos);

        world.stepDynamic(dt);
        const unloaded = world.updateAround(player.pos[0], player.pos[2]);
        for (const u of unloaded) {
            if (renderer) renderer.unloadColumn(u.cx, u.cz);
        }
        uploadMeshes(false);

        handleResize();
        const eye = getEyePos(player);
        const look = getLookVector(player.yaw, player.pitch);
        const hit = raycastVoxel(eye, look, 8.5, world.getBlock);

        if (input.isHoldingBreak() && !player.flyMode && hit.hit && hit.blockId !== BLOCK.BEDROCK) {
            const key = `${hit.vx},${hit.vy},${hit.vz}`;
            const hardness = Math.max(0.05, getBlockHardness(hit.blockId));
            if (key !== breakTarget) {
                breakTarget = key;
                breakElapsed = 0;
            }
            breakElapsed += dt;
            breakProgress = Math.min(1, breakElapsed / hardness);
            if (Math.floor(breakElapsed * 6) !== Math.floor((breakElapsed - dt) * 6)) {
                hand.triggerSwing();
            }
            if (breakElapsed >= hardness) {
                breakVoxelAt(hit.vx, hit.vy, hit.vz, hit.blockId);
                breakTarget = "";
                breakElapsed = 0;
                breakProgress = 0;
            }
        } else {
            breakTarget = "";
            breakElapsed = 0;
            breakProgress = 0;
        }

        hand.step(dt);
        particles.step(dt);
        stepNearbyTorchParticles(dt);
        stepVillageAtmosphere(dt);

        const aspect = canvas.width / Math.max(1, canvas.height);
        const cam = buildCameraBasis(eye, player.yaw, player.pitch, fovRad, aspect);

        const eyeLight = world.getLight(eye[0], eye[1], eye[2]);
        const eyeSky = ((eyeLight >> 4) & 15) / 15;
        const eyeBlk = (eyeLight & 15) / 15;
        const indoorFactor = 1 - eyeSky;
        audio.updateAmbience(state.rainIntensity, indoorFactor, player.submerged);

        const heldItem = state.hotbar[state.selectedSlot];
        const heldEmits = heldItem && (heldItem.id === BLOCK.TORCH || heldItem.id === BLOCK.LANTERN || heldItem.id === BLOCK.LAVA);
        handLightBuf[0] = eye[0] + cam.right[0] * 0.25 + cam.forward[0] * 0.35;
        handLightBuf[1] = eye[1] - 0.14 + cam.forward[1] * 0.35;
        handLightBuf[2] = eye[2] + cam.right[2] * 0.25 + cam.forward[2] * 0.35;
        handLightBuf[3] = heldEmits ? 0.92 : 0;

        const movingNow = !player.flyMode && player.onGround && (
            input.keys.has("KeyW") || input.keys.has("KeyS") ||
            input.keys.has("KeyA") || input.keys.has("KeyD") ||
            input.keys.has("ArrowUp") || input.keys.has("ArrowDown") ||
            input.keys.has("ArrowLeft") || input.keys.has("ArrowRight")
        );
        const dayShade = 0.22 + 0.78 * eyeSky * (0.28 + 0.72 * Math.max(0.15, Math.sin((state.timeOfDay - 0.15) * Math.PI * 2) * 0.7 + 0.5));
        const warmAdd = Math.max(eyeBlk, heldEmits ? 0.85 : 0);
        const handTint = [
            Math.min(1.3, dayShade + warmAdd * 0.95),
            Math.min(1.2, dayShade + warmAdd * 0.62),
            Math.min(1.15, dayShade + warmAdd * 0.28)
        ];

        const particleBuf = particles.buildBillboardBuffer(cam.right, cam.up);

        if (renderer) {
            state.stats = renderer.renderFrame(
                cam,
                eye,
                state.timeSec,
                state.timeOfDay,
                hit,
                player.submerged,
                mobs.all,
                state.rainIntensity,
                {
                    breakProgress,
                    handLight: handLightBuf,
                    rainVis: eyeSky > 0.3 ? 1 : 0,
                    particles: particleBuf,
                    hand: {
                        blockId: hand.getBlockId(),
                        mesh: hand.getMesh(),
                        model: hand.buildModelMatrix(player.walkDist, state.timeSec, movingNow)
                    },
                    handTint
                }
            );
        }

        saveTimer += dt;
        if (saveTimer >= 3.5) {
            saveTimer = 0;
            world.getStorage().savePlayer({
                pos: [...player.pos],
                yaw: player.yaw,
                pitch: player.pitch,
                flyMode: player.flyMode
            });
        }

        state.frameCount += 1;
        state.fpsTimer += rawDt;
        if (state.fpsTimer >= 0.45) {
            state.fps = Math.round(state.frameCount / state.fpsTimer);
            state.frameCount = 0;
            state.fpsTimer = 0;
            hud.updateTelemetry(world.getColumnCount());
        }
        rafId = requestAnimationFrame(tick);
    };

    const scheduleIfActive = () => {
        if (!renderer || state.destroyed || isLoopPaused() || rafId !== 0) return;
        lastTime = performance.now();
        quality.reset();
        rafId = requestAnimationFrame(tick);
    };

    const stopLoop = () => {
        if (rafId !== 0) {
            cancelAnimationFrame(rafId);
            rafId = 0;
        }
        input.resetTransient();
    };

    const pauseLoop = () => {
        if (manualPaused) return;
        manualPaused = true;
        stopLoop();
    };

    const resumeLoop = () => {
        if (!manualPaused || state.destroyed) return;
        manualPaused = false;
        scheduleIfActive();
    };

    const onTabHidden = () => {
        tabHidden = true;
        stopLoop();
    };

    const onTabVisible = () => {
        tabHidden = false;
        scheduleIfActive();
    };

    const unbindVisibility = bindVisibility(document, onTabHidden, onTabVisible);

    hud.updateTelemetry(world.getColumnCount());
    scheduleIfActive();

    return {
        state,
        player,
        world,
        mobs,
        audio,
        pause: pauseLoop,
        resume: resumeLoop,
        destroy() {
            state.destroyed = true;
            mobs.clear();
            particles.clear();
            stopLoop();
            unbindVisibility();
            input.destroy();
            hud.destroy();
            audio.destroy();
            window.removeEventListener("resize", handleResize);
            world.destroy();
            if (renderer) renderer.destroy();
        }
    };
}
