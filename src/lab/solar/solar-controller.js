import { SUN_DEF, PLANET_CATALOG } from "./solar-catalog.js";
import {
    getBodyRenderRadius,
    propagateKeplerian,
    sampleOrbitRingPoints,
    toObserverCentered,
    createCameraState
} from "./kepler-solver.js";
import {
    createStarfield,
    createAsteroidBelt,
    computeAsteroidPosition,
    createMeteorStreaks,
    stepMeteorStreaks,
    createCometStates,
    stepCometStates
} from "./particles-sim.js";
import { prewarmSolarTextures } from "./planet-textures.js";
import { createWebGLSolarRenderer } from "./webgl-renderer.js";
import { renderSolarOverlay2D } from "./overlay-2d.js";
import { createSolarDockButtons, syncSolarControlUi, updateSolarTelemetry, bindSolarControls, attachSolarViewportEvents } from "./solar-ui.js";

function hexToRgb01(hex) {
    const clean = (hex || "#ffffff").replace("#", "");
    const n = parseInt(clean.length === 3 ? clean.replace(/(.)/g, "$1$1") : clean, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function buildOrbitCache(scaleMode) {
    return PLANET_CATALOG.map((p) => ({
        id: p.id,
        points: sampleOrbitRingPoints(p, scaleMode, 144)
    }));
}

export function createSolarSystemApp(root) {
    if (!root) return null;
    prewarmSolarTextures();

    const glCanvas = root.querySelector("[data-solar-gl]");
    const overlayCanvas = root.querySelector("[data-solar-overlay]");
    const overlayCtx = overlayCanvas && typeof overlayCanvas.getContext === "function" ? overlayCanvas.getContext("2d") : null;
    const webgl = glCanvas ? createWebGLSolarRenderer(glCanvas) : null;

    const state = {
        width: 1280,
        height: 760,
        dpr: Math.min(2, (typeof window !== "undefined" && window.devicePixelRatio) || 1),
        hasWebGL: Boolean(webgl),
        scaleMode: "visual",
        simDays: 0,
        timeScale: 16,
        direction: 1,
        paused: false,
        autoCruise: true,
        showOrbits: true,
        showLabels: true,
        activeBodyId: "sun",
        hoverBodyId: null,
        focusReticleVisible: false,
        azimuth: -0.34,
        elevation: 0.44,
        distance: 76,
        targetAzimuth: -0.34,
        targetElevation: 0.44,
        targetDistance: 76,
        fovRad: 0.74,
        anchorPos: { x: 0, y: -2.2, z: 0 },
        lastProjected: [],
        timeSec: 0,
        rafId: 0,
        destroyed: false
    };

    const starPoints = createStarfield(760, 4201).map((s) => ({
        x: s.x,
        y: s.y,
        z: s.z,
        size: s.size,
        a: s.alpha,
        r: s.r,
        g: s.g,
        b: s.b,
        phase: s.phase
    }));
    const asteroids = createAsteroidBelt(880, 9103);
    const meteors = createMeteorStreaks(7, 7701);
    let comets = createCometStates(state.scaleMode);
    let orbitCache = buildOrbitCache(state.scaleMode);
    const bodyColors = Object.fromEntries([SUN_DEF, ...PLANET_CATALOG].map((b) => [b.id, hexToRgb01(b.color)]));

    let dockButtons = new Map();
    let latestWorldMap = new Map([["sun", { x: 0, y: 0, z: 0 }]]);
    const syncUi = () => syncSolarControlUi(root, state, dockButtons);

    function focusBody(id, overview = false) {
        if (overview || !id || id === "sun") {
            state.activeBodyId = "sun";
            state.focusReticleVisible = !overview && id === "sun";
            state.targetDistance = state.scaleMode === "real" ? (overview ? 390 : 28) : (overview ? 76 : 16);
            if (overview) {
                state.targetAzimuth = -0.34;
                state.targetElevation = 0.44;
            }
            syncUi();
            updateSolarTelemetry(root, state, latestWorldMap);
            return;
        }
        const target = PLANET_CATALOG.find((p) => p.id === id);
        if (!target) return;
        state.activeBodyId = target.id;
        state.focusReticleVisible = true;
        const r = getBodyRenderRadius(target, state.scaleMode);
        state.targetDistance = Math.max(4.8, Math.min(48, r * (target.hasRing ? 9.5 : 8.2)));
        syncUi();
        updateSolarTelemetry(root, state, latestWorldMap);
    }

    function setScaleMode(mode) {
        if ((mode !== "visual" && mode !== "real") || state.scaleMode === mode) return;
        state.scaleMode = mode;
        orbitCache = buildOrbitCache(mode);
        comets = createCometStates(mode);
        focusBody(state.activeBodyId, state.activeBodyId === "sun" && !state.focusReticleVisible);
        syncUi();
    }

    dockButtons = createSolarDockButtons(root, state, focusBody);

    function resize() {
        const rect = root.getBoundingClientRect ? root.getBoundingClientRect() : { width: 1280, height: 760 };
        state.width = Math.max(320, Math.round(rect.width || 1280));
        state.height = Math.max(240, Math.round(rect.height || 760));
        state.dpr = Math.min(2, (typeof window !== "undefined" && window.devicePixelRatio) || 1);
        if (webgl) webgl.resize(state.width, state.height, state.dpr);
        if (overlayCanvas) {
            overlayCanvas.width = Math.max(1, Math.round(state.width * state.dpr));
            overlayCanvas.height = Math.max(1, Math.round(state.height * state.dpr));
        }
    }

    let lastNow = typeof performance !== "undefined" ? performance.now() : Date.now();
    let frameCounter = 0;

    function tick(now = typeof performance !== "undefined" ? performance.now() : Date.now()) {
        if (state.destroyed) return;
        const dtSec = Math.min(0.05, Math.max(0.001, (now - lastNow) * 0.001));
        lastNow = now;
        state.timeSec += dtSec;

        const dtDays = state.paused ? 0 : dtSec * state.timeScale * state.direction;
        state.simDays += dtDays;
        if (state.autoCruise && !state.paused) state.targetAzimuth += dtSec * 0.032;

        const damp = 1 - Math.exp(-dtSec * 6.5);
        state.azimuth += (state.targetAzimuth - state.azimuth) * damp;
        state.elevation += (state.targetElevation - state.elevation) * damp;
        state.distance += (state.targetDistance - state.distance) * damp;

        const worldMap = new Map([["sun", { x: 0, y: 0, z: 0 }]]);
        for (const p of PLANET_CATALOG) worldMap.set(p.id, propagateKeplerian(p, state.simDays, state.scaleMode));
        latestWorldMap = worldMap;

        const rawTarget = worldMap.get(state.activeBodyId) || { x: 0, y: 0, z: 0 };
        const goalAnchor = state.activeBodyId === "sun" && !state.focusReticleVisible
            ? { x: rawTarget.x, y: rawTarget.y - (state.scaleMode === "real" ? 8 : 2.2), z: rawTarget.z }
            : rawTarget;
        const aDamp = 1 - Math.exp(-dtSec * 5.2);
        state.anchorPos.x += (goalAnchor.x - state.anchorPos.x) * aDamp;
        state.anchorPos.y += (goalAnchor.y - state.anchorPos.y) * aDamp;
        state.anchorPos.z += (goalAnchor.z - state.anchorPos.z) * aDamp;

        stepMeteorStreaks(meteors, dtSec, 7701 + Math.floor(state.timeSec * 10));
        stepCometStates(comets, state.simDays, dtDays, state.scaleMode);

        const camBasis = createCameraState({
            azimuth: state.azimuth,
            elevation: state.elevation,
            distance: state.distance,
            fovRad: state.fovRad,
            aspect: state.width / Math.max(1, state.height)
        });
        const sunPosRel = toObserverCentered({ x: 0, y: 0, z: 0 }, state.anchorPos);
        const sunRadius = getBodyRenderRadius(SUN_DEF, state.scaleMode);

        const bodies = [SUN_DEF, ...PLANET_CATALOG].map((b) => ({
            id: b.id,
            name: b.name,
            color: b.color,
            accentColor: b.accentColor,
            hasRing: Boolean(b.hasRing),
            ringInner: b.ringInner || 1.3,
            ringOuter: b.ringOuter || 2.1,
            ringYaw: 0.25,
            radius: getBodyRenderRadius(b, state.scaleMode),
            tiltDeg: b.tiltDeg,
            spinRad: state.timeSec * b.rotSpeed,
            posRel: toObserverCentered(worldMap.get(b.id), state.anchorPos)
        }));

        const asteroidPoints = asteroids.map((rock) => {
            const p = toObserverCentered(computeAsteroidPosition(rock, state.simDays, state.scaleMode), state.anchorPos);
            return { x: p.x, y: p.y, z: p.z, size: rock.size, r: rock.r, g: rock.g, b: rock.b, a: rock.alpha };
        });

        const cometPoints = [];
        for (const comet of comets) {
            const headRel = toObserverCentered(comet.state, state.anchorPos);
            cometPoints.push({ x: headRel.x, y: headRel.y, z: headRel.z, size: 7.5, r: 0.85, g: 0.96, b: 1.0, a: 0.98 });
            cometPoints.push({ x: headRel.x, y: headRel.y, z: headRel.z, size: 15, r: 0.35, g: 0.72, b: 1.0, a: 0.42 });
            for (const pt of comet.particles) {
                const pr = toObserverCentered(pt, state.anchorPos);
                const frac = Math.max(0, 1 - pt.age / Math.max(0.01, pt.maxAge));
                cometPoints.push({ x: pr.x, y: pr.y, z: pr.z, size: 4.8 * frac + 1.2, r: 0.42, g: 0.78, b: 1.0, a: frac * 0.72 });
            }
        }

        const relStars = starPoints.map((s) => ({ ...s, a: s.a * (0.78 + 0.22 * Math.sin(state.timeSec * 1.4 + s.phase)) }));
        const scene = {
            camBasis,
            dpr: state.dpr,
            sunPosRel,
            sunRadius,
            anchorPos: state.anchorPos,
            bodies,
            ringBodies: bodies.filter((b) => b.hasRing),
            orbitEntries: orbitCache,
            starPoints: relStars,
            asteroidPoints,
            cometPoints,
            meteorStreaks: meteors,
            bodyColors
        };

        if (webgl) webgl.renderFrame(scene);
        if (overlayCtx) state.lastProjected = renderSolarOverlay2D(overlayCtx, scene, state);
        if (frameCounter % 6 === 0) updateSolarTelemetry(root, state, worldMap);
        frameCounter += 1;

        if (!state.destroyed && typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
            state.rafId = window.requestAnimationFrame(tick);
        }
    }

    bindSolarControls(root, state, { syncUi, focusBody, setScaleMode });
    const detachViewport = attachSolarViewportEvents(overlayCanvas, state, { syncUi, focusBody });
    window.addEventListener("resize", resize);
    const ro = typeof window.ResizeObserver === "function" ? new window.ResizeObserver(resize) : null;
    if (ro) ro.observe(root);

    resize();
    syncUi();
    tick(lastNow);

    return {
        getState: () => ({ ...state }),
        focusBody,
        setScaleMode,
        setPaused: (v) => {
            state.paused = Boolean(v);
            syncUi();
        },
        stepOnce: () => tick((typeof performance !== "undefined" ? performance.now() : Date.now()) + 16),
        destroy: () => {
            state.destroyed = true;
            if (state.rafId && typeof window.cancelAnimationFrame === "function") window.cancelAnimationFrame(state.rafId);
            if (ro) ro.disconnect();
            if (webgl) webgl.dispose();
            detachViewport();
            window.removeEventListener("resize", resize);
        }
    };
}
