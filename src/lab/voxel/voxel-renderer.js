import { extractFrustumPlanes } from "./voxel-camera.js";
import { createGpuResources, destroyGpuResources, SHADOW_MAP_SIZE } from "./voxel-gpu-resources.js";
import { createGpuTimer } from "./voxel-gpu-timer.js";
import {
    computeSkyAtmosphere,
    createDepthOnlyTarget,
    createFboTarget,
    disposeFboTarget,
    linearizeAtmosphere
} from "./voxel-gl-utils.js";
import { createMeshStore } from "./voxel-mesh-store.js";
import { drawBlobShadows, sunPowerOf } from "./voxel-mob-blob.js";
import { drawMobs } from "./voxel-mob-render.js";
import { buildShadowFrame, createShadowController } from "./voxel-shadow-math.js";
import { projectSunToScreen, raysStrength } from "./voxel-sun-screen.js";
import { drawShadowMap } from "./voxel-shadow-pass.js";
import {
    beginCutoutPass,
    beginMobPass,
    beginWorldPass,
    blitSceneDepth,
    drawCrack,
    drawCutout,
    drawHand,
    drawOpaque,
    drawParticles,
    drawPostFx,
    drawSky,
    drawTranslucent,
    drawWire
} from "./voxel-render-passes.js";

export { computeSkyAtmosphere };

const DEFAULT_FOG = [60, 96];
const DEFAULT_SHADOW_RADIUS = 72;
const EMPTY_STATS = Object.freeze({ drawCalls: 0, culledSubs: 0, triCount: 0, uploads: 0, queued: 0, gpuMs: null });

export function createVoxelRenderer(canvas, atlas, hooks = {}) {
    const gl = canvas.getContext("webgl2", { antialias: false, powerPreference: "high-performance" });
    if (!gl) return null;

    let res = createGpuResources(gl, atlas);
    const store = createMeshStore(gl, hooks.store);
    const fogRange = hooks.fogRange ? [...hooks.fogRange] : [...DEFAULT_FOG];
    const shadowRadius = hooks.shadowRadius || DEFAULT_SHADOW_RADIUS;
    const shadowCtl = createShadowController({ radius: shadowRadius, mapSize: SHADOW_MAP_SIZE });
    let lastShadowFrame = null;
    let timer = createGpuTimer(gl);
    let targets = null;
    let lost = false;

    const disposeTargets = () => {
        if (!targets) return;
        disposeFboTarget(gl, targets.scene);
        disposeFboTarget(gl, targets.bloomA);
        disposeFboTarget(gl, targets.bloomB);
        disposeFboTarget(gl, targets.depthCopy);
        disposeFboTarget(gl, targets.rays);
        targets = null;
    };

    const ensureTargets = (w, h) => {
        if (targets && targets.scene.w === w && targets.scene.h === h) return;
        disposeTargets();
        const bw = Math.max(2, w >> 1);
        const bh = Math.max(2, h >> 1);
        targets = {
            scene: createFboTarget(gl, w, h, res.floatExt, true),
            bloomA: createFboTarget(gl, bw, bh, res.floatExt, false),
            bloomB: createFboTarget(gl, bw, bh, res.floatExt, false),
            depthCopy: createDepthOnlyTarget(gl, w, h),
            rays: createFboTarget(gl, bw, bh, res.floatExt, false)
        };
    };

    const onContextLost = (event) => {
        event.preventDefault();
        lost = true;
        targets = null;
        timer = null;
        if (hooks.onContextLost) hooks.onContextLost();
    };

    const onContextRestored = () => {
        store.reset();
        targets = null;
        try {
            res = createGpuResources(gl, atlas);
        } catch (error) {
            if (hooks.onContextError) hooks.onContextError(error);
            return;
        }
        timer = createGpuTimer(gl);
        shadowCtl.invalidate();
        lastShadowFrame = null;
        lost = false;
        if (hooks.onContextRestored) hooks.onContextRestored();
    };

    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);

    const uploadMeshUpdate = (cx, cz, subs, urgent = false) => {
        if (lost) return;
        if (urgent) shadowCtl.forceNext();
        store.queue(cx, cz, subs, urgent);
    };
    const flushUploads = () => (lost ? { uploads: 0, bytes: 0, remaining: 0 } : store.flush(true));
    const unloadColumn = (cx, cz) => {
        if (lost) return;
        store.unloadColumn(cx, cz);
    };

    const renderFrame = (cam, eye, timeSec, timeOfDay, targetHit, underwater, mobs = [], rainIntensity = 0, fx = null) => {
        const w = canvas.width;
        const h = canvas.height;
        if (lost || w < 2 || h < 2 || gl.isContextLost()) return EMPTY_STATS;
        ensureTargets(w, h);

        if (timer) {
            timer.poll();
            timer.begin();
        }
        try {
            const upload = store.flush();
            const rawAtmo = computeSkyAtmosphere(timeOfDay, rainIntensity);
            const atmo = linearizeAtmosphere(rawAtmo);
            let shadowFrame = lastShadowFrame;
            if (rawAtmo.sunDir[1] > -0.05) {
                const shadow = shadowCtl.update(rawAtmo.sunDir, eye, store.version());
                shadowFrame = shadow.frame;
                lastShadowFrame = shadowFrame;
                if (shadow.refresh) {
                    const sPlanes = extractFrustumPlanes(shadowFrame.viewProj);
                    const casters = store.collectOpaque(sPlanes);
                    const cutCasters = store.collectCutout(sPlanes);
                    drawShadowMap(gl, res, shadowFrame, casters, cutCasters, timeSec);
                }
            } else if (!shadowFrame) {
                shadowFrame = buildShadowFrame(eye, rawAtmo.sunDir, shadowRadius, SHADOW_MAP_SIZE);
                lastShadowFrame = shadowFrame;
            }

            const planes = extractFrustumPlanes(cam.viewProj);
            const visible = store.collectVisible(planes, eye);

            gl.bindFramebuffer(gl.FRAMEBUFFER, targets.scene.fbo);
            gl.viewport(0, 0, w, h);
            gl.clearColor(atmo.horizonColor[0], atmo.horizonColor[1], atmo.horizonColor[2], 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            const curFog = [
                fogRange[0] * (1 - rainIntensity * 0.55),
                fogRange[1] * (1 - rainIntensity * 0.42)
            ];
            const passExtras = {
                shadow: shadowFrame,
                depthTex: targets.depthCopy.depthTex,
                width: w,
                height: h,
                underwater,
                handLight: fx ? fx.handLight : null
            };
            beginWorldPass(gl, res, cam, eye, atmo, timeSec, curFog, passExtras);
            const opaqueStats = drawOpaque(gl, res, visible.opaque);

            let cutoutStats = { drawCalls: 0, triCount: 0 };
            if (visible.cutout.length > 0) {
                beginCutoutPass(gl, res, cam, eye, atmo, timeSec, curFog, passExtras);
                cutoutStats = drawCutout(gl, res, visible.cutout);
            }

            let mobStats = { drawCalls: 0, triCount: 0 };
            if (mobs.length > 0) {
                beginMobPass(gl, res, cam, eye, atmo, timeSec, curFog, passExtras);
                mobStats = drawMobs(gl, res.mobGeo, mobs, timeSec, eye);
                drawBlobShadows(gl, res, cam, mobs, eye, {
                    sunPower: sunPowerOf(rawAtmo.sunDir[1]),
                    fog: curFog,
                    rainIntensity
                });
            }

            drawSky(gl, res, cam, atmo, timeSec);

            let glassStats = { drawCalls: 0, triCount: 0 };
            if (visible.translucent.length > 0) {
                blitSceneDepth(gl, targets, w, h);
                if (visible.cutout.length > 0 || mobs.length > 0) {
                    beginWorldPass(gl, res, cam, eye, atmo, timeSec, curFog, passExtras);
                }
                glassStats = drawTranslucent(gl, res, visible.translucent);
            }

            drawWire(gl, res, cam, targetHit);
            if (fx && fx.breakProgress > 0) {
                drawCrack(gl, res, cam, targetHit, fx.breakProgress);
            }
            if (fx && fx.particles && fx.particles.vertCount > 0) {
                drawParticles(gl, res, cam, fx.particles, rawAtmo.dayIntensity);
            }
            if (fx && fx.hand && fx.hand.mesh && fx.hand.mesh.length > 0) {
                const handLight = fx.handTint || [0.85, 0.88, 0.92];
                drawHand(gl, res, cam, fx.hand, handLight);
            }

            const sun = projectSunToScreen(cam.viewProj, eye, rawAtmo.sunDir);
            const strength = raysStrength(rawAtmo.sunDir, sun.visibility);
            drawPostFx(gl, res, targets, w, h, timeSec, underwater, {
                raysOn: strength > 0.001 && !underwater && rainIntensity < 0.2,
                raysStrength: strength * (1 - rainIntensity),
                sunUv: [sun.u, sun.v],
                tint: atmo.sunTint,
                rainIntensity,
                rainVis: fx && fx.rainVis !== undefined ? fx.rainVis : 1,
                dayIntensity: rawAtmo.dayIntensity,
                camPos: eye,
                camForward: cam.forward,
                camRight: cam.right,
                camUp: cam.up,
                tanFov: cam.tanHalfFov
            });

            return {
                drawCalls: opaqueStats.drawCalls + cutoutStats.drawCalls + glassStats.drawCalls + mobStats.drawCalls,
                culledSubs: visible.culled,
                triCount: opaqueStats.triCount + cutoutStats.triCount + glassStats.triCount + mobStats.triCount,
                uploads: upload.uploads,
                queued: upload.remaining,
                gpuMs: timer ? timer.getMs() : null
            };
        } finally {
            if (timer) timer.end();
        }
    };

    const destroy = () => {
        canvas.removeEventListener("webglcontextlost", onContextLost);
        canvas.removeEventListener("webglcontextrestored", onContextRestored);
        if (timer) timer.dispose();
        store.release();
        disposeTargets();
        destroyGpuResources(gl, res);
    };

    return {
        uploadMeshUpdate,
        flushUploads,
        unloadColumn,
        renderFrame,
        destroy,
        isLost: () => lost,
        meshCount: () => store.size(),
        setFogRange: (near, far) => {
            fogRange[0] = near;
            fogRange[1] = far;
        },
        getFogRange: () => [...fogRange]
    };
}
