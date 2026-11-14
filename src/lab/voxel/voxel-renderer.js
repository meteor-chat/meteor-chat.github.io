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
import { drawMobs } from "./voxel-mob-render.js";
import { createShadowController } from "./voxel-shadow-math.js";
import { projectSunToScreen, raysStrength } from "./voxel-sun-screen.js";
import { drawShadowMap } from "./voxel-shadow-pass.js";
import {
    beginMobPass,
    beginWorldPass,
    blitSceneDepth,
    drawOpaque,
    drawPostFx,
    drawSky,
    drawTranslucent,
    drawWire
} from "./voxel-render-passes.js";

export { computeSkyAtmosphere };

const DEFAULT_FOG = [24, 48];
const DEFAULT_SHADOW_RADIUS = 56;
const EMPTY_STATS = Object.freeze({ drawCalls: 0, culledSubs: 0, triCount: 0, uploads: 0, queued: 0, gpuMs: null });

export function createVoxelRenderer(canvas, atlas, hooks = {}) {
    const gl = canvas.getContext("webgl2", { antialias: false, powerPreference: "high-performance" });
    if (!gl) return null;

    let res = createGpuResources(gl, atlas);
    const store = createMeshStore(gl, hooks.store);
    const fogRange = hooks.fogRange || DEFAULT_FOG;
    const shadowCtl = createShadowController({ radius: hooks.shadowRadius || DEFAULT_SHADOW_RADIUS, mapSize: SHADOW_MAP_SIZE });
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
        lost = false;
        if (hooks.onContextRestored) hooks.onContextRestored();
    };

    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);

    const uploadMeshUpdate = (cx, cz, subs, urgent = false) => {
        if (urgent) shadowCtl.forceNext();
        store.queue(cx, cz, subs, urgent);
    };
    const flushUploads = () => store.flush(true);
    const unloadColumn = (cx, cz) => store.unloadColumn(cx, cz);

    const renderFrame = (cam, eye, timeSec, timeOfDay, targetHit, underwater, mobs = []) => {
        const w = canvas.width;
        const h = canvas.height;
        if (lost || w < 2 || h < 2 || gl.isContextLost()) return EMPTY_STATS;
        ensureTargets(w, h);

        if (timer) {
            timer.poll();
            timer.begin();
        }
        const upload = store.flush();
        const rawAtmo = computeSkyAtmosphere(timeOfDay);
        const atmo = linearizeAtmosphere(rawAtmo);
        const shadow = shadowCtl.update(rawAtmo.sunDir, eye, store.version());
        if (shadow.refresh && rawAtmo.sunDir[1] > -0.05) {
            const casters = store.collectOpaque(extractFrustumPlanes(shadow.frame.viewProj));
            drawShadowMap(gl, res, shadow.frame, casters);
        }
        const planes = extractFrustumPlanes(cam.viewProj);
        const visible = store.collectVisible(planes, eye);

        gl.bindFramebuffer(gl.FRAMEBUFFER, targets.scene.fbo);
        gl.viewport(0, 0, w, h);
        gl.clearColor(atmo.horizonColor[0], atmo.horizonColor[1], atmo.horizonColor[2], 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const passExtras = {
            shadow: shadow.frame,
            depthTex: targets.depthCopy.depthTex,
            width: w,
            height: h
        };
        beginWorldPass(gl, res, cam, eye, atmo, timeSec, fogRange, passExtras);
        const opaqueStats = drawOpaque(gl, res, visible.opaque);
        let mobStats = { drawCalls: 0, triCount: 0 };
        if (mobs.length > 0) {
            beginMobPass(gl, res, cam, eye, atmo, timeSec, fogRange, passExtras);
            mobStats = drawMobs(gl, res.mobGeo, mobs, timeSec, eye);
        }
        drawWire(gl, res, cam, targetHit);
        drawSky(gl, res, cam, atmo, timeSec);
        blitSceneDepth(gl, targets, w, h);
        const glassStats = drawTranslucent(gl, res, visible.translucent);
        const sun = projectSunToScreen(cam.viewProj, eye, rawAtmo.sunDir);
        const strength = raysStrength(rawAtmo.sunDir, sun.visibility);
        drawPostFx(gl, res, targets, w, h, timeSec, underwater, {
            raysOn: strength > 0.001 && !underwater,
            raysStrength: strength,
            sunUv: [sun.u, sun.v],
            tint: atmo.sunTint
        });
        if (timer) timer.end();

        return {
            drawCalls: opaqueStats.drawCalls + glassStats.drawCalls + mobStats.drawCalls,
            culledSubs: visible.culled,
            triCount: opaqueStats.triCount + glassStats.triCount + mobStats.triCount,
            uploads: upload.uploads,
            queued: upload.remaining,
            gpuMs: timer ? timer.getMs() : null
        };
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
        meshCount: () => store.size()
    };
}
