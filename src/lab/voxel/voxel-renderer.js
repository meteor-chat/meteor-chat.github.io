import { CHUNK_SIZE, SUB_SIZE } from "./voxel-blocks.js";
import { extractFrustumPlanes, isBoxInFrustum } from "./voxel-camera.js";
import { computeSkyAtmosphere, createFboTarget, disposeFboTarget, linkProgram } from "./voxel-gl-utils.js";
import { BLOOM_BLUR_FS, BLOOM_EXTRACT_FS, COMPOSITE_FS, QUAD_VS, WIRE_FS, WIRE_VS } from "./voxel-shaders-fx.js";
import { SKY_FS, WORLD_FS, WORLD_VS } from "./voxel-shaders-world.js";
import { createVoxelTextureArray } from "./voxel-textures.js";

export { computeSkyAtmosphere };

export function createVoxelRenderer(canvas, atlas) {
    const gl = canvas.getContext("webgl2", { antialias: false, powerPreference: "high-performance" });
    if (!gl) return null;

    const floatExt = Boolean(gl.getExtension("EXT_color_buffer_float"));
    const worldProg = linkProgram(gl, WORLD_VS, WORLD_FS);
    const skyProg = linkProgram(gl, QUAD_VS, SKY_FS);
    const extractProg = linkProgram(gl, QUAD_VS, BLOOM_EXTRACT_FS);
    const blurProg = linkProgram(gl, QUAD_VS, BLOOM_BLUR_FS);
    const compProg = linkProgram(gl, QUAD_VS, COMPOSITE_FS);
    const wireProg = linkProgram(gl, WIRE_VS, WIRE_FS);

    const texArray = createVoxelTextureArray(gl, atlas);
    const quadVao = gl.createVertexArray();
    const wireVao = gl.createVertexArray();
    const wireBuf = gl.createBuffer();
    const wireVerts = new Float32Array([
        0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0,
        0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0,
        0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 0, 1, 0, 1, 1
    ]);
    gl.bindVertexArray(wireVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, wireBuf);
    gl.bufferData(gl.ARRAY_BUFFER, wireVerts, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    const subMeshes = new Map();
    let sceneTarget = null;
    let bloomA = null;
    let bloomB = null;

    const ensureTargets = (w, h) => {
        if (sceneTarget && sceneTarget.w === w && sceneTarget.h === h) return;
        disposeFboTarget(gl, sceneTarget);
        disposeFboTarget(gl, bloomA);
        disposeFboTarget(gl, bloomB);
        sceneTarget = createFboTarget(gl, w, h, floatExt, true);
        const bw = Math.max(2, w >> 1);
        const bh = Math.max(2, h >> 1);
        bloomA = createFboTarget(gl, bw, bh, floatExt, false);
        bloomB = createFboTarget(gl, bw, bh, floatExt, false);
    };

    const uploadBuffer = (arr) => {
        const vao = gl.createVertexArray();
        const buf = gl.createBuffer();
        gl.bindVertexArray(vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribIPointer(0, 2, gl.UNSIGNED_INT, 8, 0);
        gl.bindVertexArray(null);
        return { vao, buf, count: arr.length >>> 1 };
    };

    const freeEntry = (entry) => {
        if (!entry) return;
        if (entry.opq) {
            gl.deleteVertexArray(entry.opq.vao);
            gl.deleteBuffer(entry.opq.buf);
        }
        if (entry.trn) {
            gl.deleteVertexArray(entry.trn.vao);
            gl.deleteBuffer(entry.trn.buf);
        }
    };

    const uploadMeshUpdate = (cx, cz, subs) => {
        const ox = cx * CHUNK_SIZE;
        const oz = cz * CHUNK_SIZE;
        for (const sub of subs) {
            const key = `${cx},${sub.sy},${cz}`;
            freeEntry(subMeshes.get(key));
            if (sub.opaque.length === 0 && sub.translucent.length === 0) {
                subMeshes.delete(key);
                continue;
            }
            const oy = sub.sy * SUB_SIZE;
            subMeshes.set(key, {
                origin: [ox, oy, oz],
                box: [ox, oy, oz, ox + CHUNK_SIZE, oy + SUB_SIZE, oz + CHUNK_SIZE],
                opq: sub.opaque.length > 0 ? uploadBuffer(sub.opaque) : null,
                trn: sub.translucent.length > 0 ? uploadBuffer(sub.translucent) : null
            });
        }
    };

    const unloadColumn = (cx, cz) => {
        for (let sy = 0; sy < 8; sy += 1) {
            const key = `${cx},${sy},${cz}`;
            freeEntry(subMeshes.get(key));
            subMeshes.delete(key);
        }
    };

    const renderFrame = (cam, eye, timeSec, timeOfDay, targetHit, underwater) => {
        const w = canvas.width;
        const h = canvas.height;
        if (w < 2 || h < 2) return { drawCalls: 0, culledSubs: 0, triCount: 0 };
        ensureTargets(w, h);

        const atmo = computeSkyAtmosphere(timeOfDay);
        const planes = extractFrustumPlanes(cam.viewProj);
        const visible = [];
        let culledSubs = 0;
        for (const entry of subMeshes.values()) {
            const b = entry.box;
            if (isBoxInFrustum(planes, b[0], b[1], b[2], b[3], b[4], b[5])) {
                visible.push(entry);
            } else {
                culledSubs += 1;
            }
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, sceneTarget.fbo);
        gl.viewport(0, 0, w, h);
        gl.clearColor(atmo.horizonColor[0], atmo.horizonColor[1], atmo.horizonColor[2], 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.BLEND);
        gl.useProgram(skyProg);
        gl.uniform3fv(gl.getUniformLocation(skyProg, "uCamForward"), cam.forward);
        gl.uniform3fv(gl.getUniformLocation(skyProg, "uCamRight"), cam.right);
        gl.uniform3fv(gl.getUniformLocation(skyProg, "uCamUp"), cam.up);
        gl.uniform2fv(gl.getUniformLocation(skyProg, "uTanFov"), cam.tanHalfFov);
        gl.uniform3fv(gl.getUniformLocation(skyProg, "uSunDir"), atmo.sunDir);
        gl.uniform3fv(gl.getUniformLocation(skyProg, "uSunTint"), atmo.sunTint);
        gl.uniform3fv(gl.getUniformLocation(skyProg, "uSkyColor"), atmo.skyColor);
        gl.uniform3fv(gl.getUniformLocation(skyProg, "uHorizonColor"), atmo.horizonColor);
        gl.uniform1f(gl.getUniformLocation(skyProg, "uDayIntensity"), atmo.dayIntensity);
        gl.uniform1f(gl.getUniformLocation(skyProg, "uTime"), timeSec);
        gl.bindVertexArray(quadVao);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.depthMask(true);
        gl.useProgram(worldProg);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, texArray);
        gl.uniform1i(gl.getUniformLocation(worldProg, "uTexArray"), 0);
        gl.uniformMatrix4fv(gl.getUniformLocation(worldProg, "uViewProj"), false, cam.viewProj);
        gl.uniform3fv(gl.getUniformLocation(worldProg, "uCamPos"), eye);
        gl.uniform3fv(gl.getUniformLocation(worldProg, "uSunDir"), atmo.sunDir);
        gl.uniform3fv(gl.getUniformLocation(worldProg, "uSunTint"), atmo.sunTint);
        gl.uniform3fv(gl.getUniformLocation(worldProg, "uSkyColor"), atmo.skyColor);
        gl.uniform3fv(gl.getUniformLocation(worldProg, "uHorizonColor"), atmo.horizonColor);
        gl.uniform1f(gl.getUniformLocation(worldProg, "uDayIntensity"), atmo.dayIntensity);
        gl.uniform1f(gl.getUniformLocation(worldProg, "uTime"), timeSec);
        gl.uniform1f(gl.getUniformLocation(worldProg, "uFogStart"), 34);
        gl.uniform1f(gl.getUniformLocation(worldProg, "uFogEnd"), 68);

        const uOrigin = gl.getUniformLocation(worldProg, "uChunkOrigin");
        let drawCalls = 0;
        let triCount = 0;

        for (const e of visible) {
            if (!e.opq) continue;
            gl.uniform3fv(uOrigin, e.origin);
            gl.bindVertexArray(e.opq.vao);
            gl.drawArrays(gl.TRIANGLES, 0, e.opq.count);
            drawCalls += 1;
            triCount += Math.floor(e.opq.count / 3);
        }

        if (targetHit && targetHit.hit) {
            gl.useProgram(wireProg);
            gl.uniformMatrix4fv(gl.getUniformLocation(wireProg, "uViewProj"), false, cam.viewProj);
            gl.uniform3f(gl.getUniformLocation(wireProg, "uBlockPos"), targetHit.vx, targetHit.vy, targetHit.vz);
            gl.bindVertexArray(wireVao);
            gl.drawArrays(gl.LINES, 0, 24);
        }

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
        gl.disable(gl.CULL_FACE);
        gl.useProgram(worldProg);
        for (const e of visible) {
            if (!e.trn) continue;
            gl.uniform3fv(uOrigin, e.origin);
            gl.bindVertexArray(e.trn.vao);
            gl.drawArrays(gl.TRIANGLES, 0, e.trn.count);
            drawCalls += 1;
            triCount += Math.floor(e.trn.count / 3);
        }
        gl.depthMask(true);
        gl.disable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);

        gl.bindFramebuffer(gl.FRAMEBUFFER, bloomA.fbo);
        gl.viewport(0, 0, bloomA.w, bloomA.h);
        gl.useProgram(extractProg);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, sceneTarget.tex);
        gl.uniform1i(gl.getUniformLocation(extractProg, "uSceneTex"), 0);
        gl.bindVertexArray(quadVao);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        gl.useProgram(blurProg);
        gl.uniform1i(gl.getUniformLocation(blurProg, "uTex"), 0);
        const uStep = gl.getUniformLocation(blurProg, "uStep");
        for (let pass = 0; pass < 2; pass += 1) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, bloomB.fbo);
            gl.bindTexture(gl.TEXTURE_2D, bloomA.tex);
            gl.uniform2f(uStep, 1.35 / bloomA.w, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            gl.bindFramebuffer(gl.FRAMEBUFFER, bloomA.fbo);
            gl.bindTexture(gl.TEXTURE_2D, bloomB.tex);
            gl.uniform2f(uStep, 0, 1.35 / bloomA.h);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, w, h);
        gl.useProgram(compProg);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, sceneTarget.tex);
        gl.uniform1i(gl.getUniformLocation(compProg, "uSceneTex"), 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, bloomA.tex);
        gl.uniform1i(gl.getUniformLocation(compProg, "uBloomTex"), 1);
        gl.uniform1f(gl.getUniformLocation(compProg, "uTime"), timeSec);
        gl.uniform1f(gl.getUniformLocation(compProg, "uUnderwater"), underwater ? 1 : 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        return { drawCalls, culledSubs, triCount };
    };

    const destroy = () => {
        for (const entry of subMeshes.values()) freeEntry(entry);
        subMeshes.clear();
        disposeFboTarget(gl, sceneTarget);
        disposeFboTarget(gl, bloomA);
        disposeFboTarget(gl, bloomB);
        gl.deleteTexture(texArray);
        gl.deleteVertexArray(quadVao);
        gl.deleteVertexArray(wireVao);
        gl.deleteBuffer(wireBuf);
        gl.deleteProgram(worldProg);
        gl.deleteProgram(skyProg);
        gl.deleteProgram(extractProg);
        gl.deleteProgram(blurProg);
        gl.deleteProgram(compProg);
        gl.deleteProgram(wireProg);
    };

    return { uploadMeshUpdate, unloadColumn, renderFrame, destroy };
}
