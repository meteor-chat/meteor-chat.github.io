import initJolt from "jolt-physics";
import * as THREE from "three";
import { loadGtaAssets } from "./gta-assets.js";
import { createGtaAudio } from "./gta-audio.js";
import { createGtaCamera } from "./gta-camera.js";
import { createGtaCharacter } from "./gta-character.js";
import { buildCityData } from "./gta-city-data.js";
import { createCityScene } from "./gta-city-gen.js";
import { createGtaHud } from "./gta-hud.js";
import { createGtaParticles } from "./gta-particles.js";
import { createPerfGovernor } from "./gta-perf-governor.js";
import { createJoltWorld } from "./gta-physics-world.js";
import { createGtaRenderer } from "./gta-renderer.js";
import {
    GPS_DESTINATIONS,
    computeGpsRoute,
    heightAt,
    lookupLocation,
    surfaceAt,
    waterLevelAt
} from "./gta-road-graph.js";
import { createGtaTextures } from "./gta-textures.js";
import { createTrafficSystem } from "./gta-traffic-ai.js";
import { createTrafficRenderer } from "./gta-traffic-render.js";
import { createVehicleVisual } from "./gta-vehicle-meshes.js";
import { JoltCar } from "./gta-vehicle-physics.js";
import { findNearestEnterableVehicle } from "./gta-vehicle-specs.js";

const GPS_KEYS = ["downtown", "strawberry", "construction", "beach", "safehouse", "none"];
const TIME_MAP = { day: 0.28, sunset: 0.67, night: 0.9 };

export async function createGtaApp(root) {
    const canvas = root.querySelector("[data-gta-gl]");
    if (!canvas) throw new Error("Missing GTA canvas");

    const state = {
        destroyed: false,
        paused: false,
        timeSec: 0,
        timeOfDay: 0.28,
        autoCycle: false,
        weather: "wet",
        wetness: 0.82,
        rainIntensity: 0,
        gpsKey: "downtown",
        quality: "balanced",
        cash: 201300,
        hp: 100,
        armor: 100,
        nitro: 100,
        fps: 60,
        drawCalls: 0,
        activeCarIndex: -1
    };

    const audio = createGtaAudio();
    const perfGov = createPerfGovernor(state.quality);
    let hud = null;
    let rendererCtx = null;
    let world = null;
    let textures = null;
    let assets = null;
    let cityScene = null;
    let particles = null;
    let character = null;
    let cameraCtl = null;
    let traffic = null;
    let trafficRender = null;
    const cars = [];
    let propBodies = [];
    let rafId = 0;

    const getHeroPos = () => {
        if (state.activeCarIndex >= 0 && cars[state.activeCarIndex]) {
            return cars[state.activeCarIndex].physics.pose.position;
        }
        return character ? character.state.pos : new THREE.Vector3(0, 13, -304);
    };

    const spawnCarAt = (presetKey, x, z, yaw, colorOverride = null) => {
        const physics = new JoltCar(world, { preset: presetKey, spawn: { x, z }, yaw, heightAt });
        const visual = createVehicleVisual(presetKey, textures, colorOverride, false, assets);
        rendererCtx.scene.add(visual.chassis);
        for (const w of visual.wheels) rendererCtx.scene.add(w);
        physics.applyPoseTo(visual.chassis, visual.wheels, 1);
        const entry = { preset: presetKey, name: physics.preset.name, physics, visual };
        cars.push(entry);
        return entry;
    };

    const collectEnterableCandidates = () => {
        const list = cars.map((c, idx) => ({ kind: "jolt", idx, name: c.name, pos: c.physics.pose.position }));
        if (traffic) {
            for (let i = 0; i < traffic.cars.length; i += 1) {
                const tc = traffic.cars[i];
                list.push({
                    kind: "civ",
                    idx: i,
                    name: tc.preset === "cavalcade" ? "Cavalcade SUV" : tc.preset === "gauntlet" ? "Gauntlet ZL1" : "Elegy GT-R",
                    pos: tc.pos
                });
            }
        }
        return list;
    };

    const enterOrExitVehicle = () => {
        if (state.activeCarIndex >= 0) {
            const active = cars[state.activeCarIndex];
            const pose = active.physics.pose;
            const sideX = pose.position.x - Math.cos(pose.yaw) * 2.35;
            const sideZ = pose.position.z + Math.sin(pose.yaw) * 2.35;
            character.place(sideX, heightAt(sideX, sideZ) + 0.1, sideZ, pose.yaw);
            character.setVisible(true);
            state.activeCarIndex = -1;
            audio.playDoor();
            hud.showToast("On Foot - Explore Los Santos", 1.8);
            return;
        }
        const near = findNearestEnterableVehicle(character.state.pos.x, character.state.pos.z, collectEnterableCandidates(), 5.4);
        if (!near) return;
        if (near.kind === "jolt") {
            state.activeCarIndex = near.idx;
            character.setVisible(false);
            audio.playDoor();
            hud.showToast(`Driving ${near.name}`, 2.0);
        } else if (near.kind === "civ") {
            const tc = traffic.cars[near.idx];
            const entry = spawnCarAt(tc.preset, tc.pos.x, tc.pos.z, tc.yaw, tc.color);
            traffic.teleportCar(near.idx, 240, -240);
            state.activeCarIndex = cars.length - 1;
            character.setVisible(false);
            audio.playDoor();
            hud.showToast(`Driving ${entry.name}`, 2.0);
        }
    };

    const swapActiveVehicle = (presetKey) => {
        if (!world || !rendererCtx) return;
        const p = getHeroPos();
        const yaw = state.activeCarIndex >= 0 ? cars[state.activeCarIndex].physics.pose.yaw : character.state.yaw;
        if (state.activeCarIndex >= 0) {
            const old = cars[state.activeCarIndex];
            old.physics.dispose();
            old.visual.dispose(rendererCtx.scene);
            cars.splice(state.activeCarIndex, 1);
        }
        const entry = spawnCarAt(presetKey, p.x, p.z, yaw);
        state.activeCarIndex = cars.length - 1;
        character.setVisible(false);
        audio.playDoor();
        hud.showToast(`Spawned ${entry.name}`, 2.0);
    };

    const resetToSafehouse = () => {
        if (!character || !cars.length) return;
        const sh = cityData.safehouse;
        state.activeCarIndex = -1;
        character.setVisible(true);
        character.place(sh.spawnPlayer.x, sh.spawnPlayer.y, sh.spawnPlayer.z, 0);
        cameraCtl.snap(character.state.pos, 0);
        for (let i = 0; i < Math.min(cars.length, sh.parkedCars.length); i += 1) {
            const pc = sh.parkedCars[i];
            cars[i].physics.reset({ x: pc.x, z: pc.z }, pc.yaw);
        }
        state.hp = 100;
        state.armor = 100;
        state.nitro = 100;
        hud.showToast("Reset to Vinewood Safehouse Terrace", 2.0);
    };

    hud = createGtaHud(root, {
        onTime: (mode) => {
            state.autoCycle = mode === "auto";
            if (TIME_MAP[mode] !== undefined) state.timeOfDay = TIME_MAP[mode];
        },
        onWeather: (w) => {
            state.weather = w;
        },
        onQuality: (q) => {
            state.quality = q;
            const next = perfGov.setPreset(q);
            if (rendererCtx) rendererCtx.setQuality(next.preset.key, next.scale);
            hud.showToast(`Graphics: ${next.preset.label}`, 1.8);
        },
        onGps: (key) => {
            state.gpsKey = key;
            const dest = GPS_DESTINATIONS[key];
            hud.showToast(dest ? `GPS: ${dest.label}` : "GPS Cleared", 1.8);
        },
        onSpawnCar: swapActiveVehicle,
        onCamCycle: () => {
            const m = cameraCtl.cycleMode();
            hud.showToast(`Camera: ${m}`, 1.4);
        },
        onRadioToggle: () => {
            const next = !audio.isRadioOn();
            audio.setRadio(next);
            hud.showToast(next ? "Radio: West Coast Cruise FM" : "Radio Off", 1.8);
        },
        onAudioToggle: () => {
            audio.setMuted(!audio.isMuted());
        },
        onReset: resetToSafehouse
    });

    rendererCtx = createGtaRenderer(canvas, {
        onContextLost: () => hud.setLost(true),
        onContextRestored: () => hud.setLost(false)
    });
    if (!rendererCtx) {
        hud.setFallback("Your browser or device does not support WebGL 2.0 required to run Los Santos 3D.");
        return { state, destroy: () => hud.destroy() };
    }

    hud.setLoader("Initializing JoltPhysics.js WASM & Photorealistic Assets...", 26);
    const [Jolt, loadedAssets] = await Promise.all([
        initJolt(),
        loadGtaAssets((msg, pct) => hud.setLoader(msg, pct))
    ]);
    if (state.destroyed) {
        if (loadedAssets) loadedAssets.dispose();
        return { state, destroy: () => {} };
    }
    assets = loadedAssets;
    rendererCtx.setHdris(assets.hdris);

    hud.setLoader("Building 3x3 Spatial Los Santos Sectors & Wet Streets...", 76);
    const cityData = buildCityData(2026);
    textures = createGtaTextures();
    cityScene = createCityScene(rendererCtx.scene, cityData, textures, assets);
    world = createJoltWorld(Jolt);
    propBodies = world.populateCityColliders(cityData, heightAt);

    hud.setLoader("Spawning Supercar Fleet, Rigged Character & Instanced Traffic...", 88);
    for (const pc of cityData.safehouse.parkedCars) {
        spawnCarAt(pc.preset, pc.x, pc.z, pc.yaw);
    }

    character = createGtaCharacter(rendererCtx.scene, cityData.safehouse.spawnPlayer, assets);
    cameraCtl = createGtaCamera(rendererCtx.camera);
    cameraCtl.snap(character.state.pos, 0);
    particles = createGtaParticles(rendererCtx.scene);
    traffic = createTrafficSystem(cityData.graph, 2026);
    traffic.attachColliders(world);
    trafficRender = createTrafficRenderer(rendererCtx.scene, traffic, propBodies, assets, textures);

    hud.setLoader("Pre-Compiling WebGL 2.0 Shaders...", 95);
    rendererCtx.updateAtmosphere(state.timeOfDay, 0, character.state.pos);
    await rendererCtx.warmShaders();

    const keys = new Set();
    let dragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    const onKeyDown = (e) => {
        audio.unlock();
        keys.add(e.code);
        if (e.repeat) return;
        if (e.code === "KeyF") {
            enterOrExitVehicle();
        } else if (e.code === "KeyC") {
            const m = cameraCtl.cycleMode();
            hud.showToast(`Camera: ${m}`, 1.4);
        } else if (e.code === "KeyH") {
            audio.playHorn();
        } else if (e.code === "KeyM") {
            const idx = (GPS_KEYS.indexOf(state.gpsKey) + 1) % GPS_KEYS.length;
            state.gpsKey = GPS_KEYS[idx];
            hud.setActiveGroup("data-gta-gps", state.gpsKey);
            const d = GPS_DESTINATIONS[state.gpsKey];
            hud.showToast(d ? `GPS: ${d.label}` : "GPS Cleared", 1.8);
        } else if (e.code === "KeyR") {
            const next = !audio.isRadioOn();
            audio.setRadio(next);
            hud.showToast(next ? "Radio: West Coast Cruise FM" : "Radio Off", 1.8);
        } else if (e.code === "F1") {
            e.preventDefault();
            hud.toggleHudHidden();
        } else if (e.code === "F3") {
            e.preventDefault();
            hud.toggleStats();
        } else if (e.code === "Escape") {
            hud.toggleSettings(false);
        }
    };
    const onKeyUp = (e) => keys.delete(e.code);
    const onBlur = () => {
        keys.clear();
        dragging = false;
    };
    const onMouseDown = (e) => {
        audio.unlock();
        if (e.target !== canvas) return;
        dragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    };
    const onMouseMove = (e) => {
        if (!dragging && document.pointerLockElement !== canvas) return;
        const dx = document.pointerLockElement === canvas ? e.movementX : e.clientX - lastMouseX;
        const dy = document.pointerLockElement === canvas ? e.movementY : e.clientY - lastMouseY;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        cameraCtl.addOrbit(dx, dy);
    };
    const onMouseUp = () => {
        dragging = false;
    };
    const onResize = () => rendererCtx.resize();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("resize", onResize);

    hud.setLoader("Ready", 100, true);
    hud.showToast("Vinewood Safehouse - Walk to driveway & press F to drive", 3.4);

    const env = { heightAt, surfaceAt, waterLevelAt, wetness: state.wetness };
    let lastTime = performance.now();
    let fpsFrames = 0;
    let fpsAcc = 0;
    let gpsAcc = 0;
    let cachedRoute = computeGpsRoute(cityData.graph, 0, -290, state.gpsKey);
    let smokeAcc = 0;

    const tick = (now) => {
        if (state.destroyed || state.paused) return;
        const rawDt = Math.max(0.001, (now - lastTime) * 0.001);
        const dt = Math.min(0.05, rawDt);
        lastTime = now;
        state.timeSec += dt;

        const drs = perfGov.sample(rawDt);
        if (drs.changed) rendererCtx.resize(drs.scale);

        if (state.autoCycle) state.timeOfDay = (state.timeOfDay + dt * 0.014) % 1;
        const targetRain = state.weather === "rain" ? 1 : 0;
        const targetWet = state.weather === "clear" ? 0.05 : state.weather === "wet" ? 0.85 : 1.0;
        state.rainIntensity += (targetRain - state.rainIntensity) * Math.min(1, dt * 1.6);
        state.wetness += (targetWet - state.wetness) * Math.min(1, dt * 1.8);
        env.wetness = state.wetness;

        const isDriving = state.activeCarIndex >= 0;
        const activeCar = isDriving ? cars[state.activeCarIndex] : null;
        const wantThrottle = keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0;
        const wantBrake = keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0;
        const wantSteer = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
        const wantHandbrake = keys.has("Space");
        const wantNitro = (keys.has("ShiftLeft") || keys.has("ShiftRight")) && state.nitro > 4;

        if (isDriving && wantNitro && wantThrottle > 0) {
            state.nitro = Math.max(0, state.nitro - dt * 26);
        } else {
            state.nitro = Math.min(100, state.nitro + dt * 12);
        }

        const carInput = {
            throttle: wantThrottle,
            brake: wantBrake,
            steer: wantSteer,
            handbrake: wantHandbrake,
            nitro: wantNitro
        };
        const idleInput = { throttle: 0, brake: 0, steer: 0, handbrake: false, nitro: false };

        const alpha = world.step(dt, (h) => {
            if (traffic) traffic.syncPhysics(h);
            for (let i = 0; i < cars.length; i += 1) {
                cars[i].physics.update(h, i === state.activeCarIndex ? carInput : idleInput, env);
            }
        });

        const viewYaw = cameraCtl.getViewYaw();
        if (!isDriving) {
            character.update(
                dt,
                {
                    forward: keys.has("KeyW") || keys.has("ArrowUp"),
                    backward: keys.has("KeyS") || keys.has("ArrowDown"),
                    left: keys.has("KeyA") || keys.has("ArrowLeft"),
                    right: keys.has("KeyD") || keys.has("ArrowRight"),
                    sprint: keys.has("ShiftLeft") || keys.has("ShiftRight"),
                    jump: keys.has("Space")
                },
                viewYaw,
                world
            );
        }

        const activePose = activeCar ? activeCar.physics.pose : null;
        const heroPos = activePose ? activePose.position : character.state.pos;
        const heroYaw = activePose ? Math.atan2(activeCar.physics.renderFwd.x, activeCar.physics.renderFwd.z) : character.state.yaw;
        const heroSpeed = activeCar ? activeCar.physics.speed : 0;

        for (let i = 0; i < cars.length; i += 1) {
            const c = cars[i];
            const cp = c.physics.pose.position;
            const visible = i === state.activeCarIndex || Math.hypot(cp.x - heroPos.x, cp.z - heroPos.z) < 185;
            c.visual.chassis.visible = visible;
            for (const w of c.visual.wheels) w.visible = visible;
            if (visible) {
                c.physics.applyPoseTo(c.visual.chassis, c.visual.wheels, alpha);
                c.visual.setBrakeGlow(c.physics.braking);
            }
        }

        const headingYaw = cameraCtl.update(dt, {
            isDriving,
            targetPos: heroPos,
            targetYaw: heroYaw,
            speed: heroSpeed,
            nitroActive: activeCar ? activeCar.physics.nitroActive : false,
            world,
            ignoreBody: activeCar ? activeCar.physics.body : null
        });

        const playerSummary = { pos: heroPos, yaw: heroYaw, speed: heroSpeed, isDriving };

        traffic.update(dt, state.timeSec, playerSummary, (hitCar, impactSpd) => {
            particles.spawnSparks(hitCar.pos.x, hitCar.pos.y, hitCar.pos.z, 18);
            cameraCtl.addShake(Math.min(0.45, impactSpd * 0.015));
            audio.playCrash(impactSpd / 18);
        });
        trafficRender.update(dt);

        if (activeCar && activeCar.physics.drifting) {
            smokeAcc += dt;
            if (smokeAcc >= 0.035) {
                smokeAcc = 0;
                const wc2 = activeCar.physics.wheelContacts[2];
                const wc3 = activeCar.physics.wheelContacts[3];
                if (wc2.grounded) {
                    particles.spawnTireSmoke(wc2.x, wc2.y, wc2.z, heroYaw);
                    particles.spawnSkid(wc2.x, wc2.y, wc2.z, heroYaw);
                }
                if (wc3.grounded) {
                    particles.spawnTireSmoke(wc3.x, wc3.y, wc3.z, heroYaw);
                    particles.spawnSkid(wc3.x, wc3.y, wc3.z, heroYaw);
                }
                state.cash += 8;
            }
        }

        particles.update(dt, heroPos, state.rainIntensity);
        const mood = rendererCtx.updateAtmosphere(state.timeOfDay, state.rainIntensity, heroPos);
        cityScene.updateEnvironment(state.timeSec, mood.night, state.wetness);
        const rStats = rendererCtx.render();
        state.drawCalls = rStats.drawCalls;

        audio.update(dt, {
            isDriving,
            rpm: activeCar ? activeCar.physics.telemetry.rpm : 860,
            throttle: wantThrottle,
            drifting: activeCar ? activeCar.physics.drifting : false,
            lateralSpeed: activeCar ? Math.abs(activeCar.physics.lateralSpeed) : 0,
            timeSec: state.timeSec
        });

        gpsAcc += dt;
        if (gpsAcc >= 0.45) {
            gpsAcc = 0;
            cachedRoute = computeGpsRoute(cityData.graph, heroPos.x, heroPos.z, state.gpsKey);
        }

        fpsFrames += 1;
        fpsAcc += rawDt;
        if (fpsAcc >= 0.45) {
            state.fps = Math.round(fpsFrames / fpsAcc);
            fpsFrames = 0;
            fpsAcc = 0;
        }

        let promptText = "";
        if (!isDriving) {
            const near = findNearestEnterableVehicle(heroPos.x, heroPos.z, collectEnterableCandidates(), 5.4);
            if (near) {
                promptText = near.kind === "jolt" ? `Press F to Enter ${near.name}` : `Press F to Enter ${near.name}`;
            }
        }

        const loc = lookupLocation(heroPos.x, heroPos.z);
        hud.sync(dt, {
            fps: state.fps,
            isDriving,
            vehicleName: activeCar ? activeCar.name : "",
            drawCalls: state.drawCalls,
            scale: rendererCtx.getScale(),
            cash: state.cash,
            hp: state.hp,
            armor: state.armor,
            nitro: state.nitro,
            mph: activeCar ? activeCar.physics.telemetry.mph : 0,
            gear: activeCar ? activeCar.physics.telemetry.gear : "D1",
            district: loc.district,
            street: loc.street,
            promptText,
            radioOn: audio.isRadioOn(),
            muted: audio.isMuted(),
            timeSec: state.timeSec,
            px: heroPos.x,
            pz: heroPos.z,
            headingYaw,
            gpsPoints: cachedRoute.points,
            gpsMiles: cachedRoute.distanceMiles,
            parkedCars: cars.map((c) => {
                const pp = c.physics.pose.position;
                return { x: pp.x, z: pp.z };
            }),
            civCars: traffic.cars
        });

        rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return {
        state,
        destroy() {
            state.destroyed = true;
            if (rafId) cancelAnimationFrame(rafId);
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
            window.removeEventListener("blur", onBlur);
            window.removeEventListener("mousedown", onMouseDown);
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
            window.removeEventListener("resize", onResize);
            for (const c of cars) {
                c.physics.dispose();
                c.visual.dispose(rendererCtx.scene);
            }
            if (trafficRender) trafficRender.dispose();
            if (traffic) traffic.dispose();
            if (character) character.dispose();
            if (particles) particles.dispose();
            if (cityScene) cityScene.dispose();
            if (textures) textures.dispose();
            if (assets) assets.dispose();
            if (world) world.dispose();
            if (rendererCtx) rendererCtx.dispose();
            audio.destroy();
            hud.destroy();
        }
    };
}
