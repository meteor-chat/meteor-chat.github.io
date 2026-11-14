function setAtmosphere(gl, u, atmo, timeSec) {
    gl.uniform3fv(u.uSunDir, atmo.sunDir);
    gl.uniform3fv(u.uSunTint, atmo.sunTint);
    gl.uniform3fv(u.uSkyColor, atmo.skyColor);
    gl.uniform3fv(u.uHorizonColor, atmo.horizonColor);
    gl.uniform1f(u.uDayIntensity, atmo.dayIntensity);
    gl.uniform1f(u.uTime, timeSec);
}

export function drawSky(gl, res, cam, atmo, timeSec) {
    const { program, u } = res.sky;
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(false);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.BLEND);
    gl.useProgram(program);
    gl.uniform3fv(u.uCamForward, cam.forward);
    gl.uniform3fv(u.uCamRight, cam.right);
    gl.uniform3fv(u.uCamUp, cam.up);
    gl.uniform2fv(u.uTanFov, cam.tanHalfFov);
    setAtmosphere(gl, u, atmo, timeSec);
    gl.bindVertexArray(res.quadVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.depthFunc(gl.LESS);
    gl.depthMask(true);
}

function bindSceneTextures(gl, res, extras) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, res.texArray);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, res.texData);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, res.shadowTarget.tex);
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, extras.depthTex);
    gl.activeTexture(gl.TEXTURE0);
}

function setSharedUniforms(gl, u, frame, atmo, timeSec, fog) {
    const { cam, eye, shadow } = frame;
    gl.uniform1i(u.uTexArray, 0);
    gl.uniform1i(u.uTexData, 2);
    gl.uniform1i(u.uShadowMap, 3);
    gl.uniformMatrix4fv(u.uShadowMat, false, shadow.viewProj);
    gl.uniform3fv(u.uShadowCenter, shadow.center);
    gl.uniform2f(u.uShadowParams, 1 / shadow.mapSize, shadow.radius);
    gl.uniformMatrix4fv(u.uViewProj, false, cam.viewProj);
    gl.uniform3fv(u.uCamPos, eye);
    setAtmosphere(gl, u, atmo, timeSec);
    gl.uniform1f(u.uFogStart, fog[0]);
    gl.uniform1f(u.uFogEnd, fog[1]);
}

export function beginWorldPass(gl, res, cam, eye, atmo, timeSec, fog, extras) {
    const { program, u } = res.world;
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.depthMask(true);
    gl.useProgram(program);
    bindSceneTextures(gl, res, extras);
    gl.uniform1i(u.uSceneDepth, 4);
    gl.uniform2f(u.uResolution, extras.width, extras.height);
    setSharedUniforms(gl, u, { cam, eye, shadow: extras.shadow }, atmo, timeSec, fog);
}

export function beginMobPass(gl, res, cam, eye, atmo, timeSec, fog, extras) {
    const { program, u } = res.mob;
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.depthMask(true);
    gl.useProgram(program);
    setSharedUniforms(gl, u, { cam, eye, shadow: extras.shadow }, atmo, timeSec, fog);
}
function drawLayer(gl, res, entries, layer) {
    const uOrigin = res.world.u.uChunkOrigin;
    let drawCalls = 0;
    let triCount = 0;
    for (const entry of entries) {
        const mesh = entry[layer];
        if (!mesh) continue;
        gl.uniform3fv(uOrigin, entry.origin);
        gl.bindVertexArray(mesh.vao);
        gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
        drawCalls += 1;
        triCount += Math.floor(mesh.count / 3);
    }
    return { drawCalls, triCount };
}

export function drawOpaque(gl, res, entries) {
    return drawLayer(gl, res, entries, "opq");
}

export function drawWire(gl, res, cam, hit) {
    if (!hit || !hit.hit) return;
    const { program, u } = res.wire;
    gl.useProgram(program);
    gl.uniformMatrix4fv(u.uViewProj, false, cam.viewProj);
    gl.uniform3f(u.uBlockPos, hit.vx, hit.vy, hit.vz);
    gl.bindVertexArray(res.wireVao);
    gl.drawArrays(gl.LINES, 0, 24);
}

export function blitSceneDepth(gl, targets, w, h) {
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, targets.scene.fbo);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, targets.depthCopy.fbo);
    gl.blitFramebuffer(0, 0, w, h, 0, 0, w, h, gl.DEPTH_BUFFER_BIT, gl.NEAREST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, targets.scene.fbo);
}

export function drawTranslucent(gl, res, entries) {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.disable(gl.CULL_FACE);
    gl.useProgram(res.world.program);
    const stats = drawLayer(gl, res, entries, "trn");
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    return stats;
}

export function drawPostFx(gl, res, targets, w, h, timeSec, underwater, post) {
    const { scene, bloomA, bloomB } = targets;
    gl.bindFramebuffer(gl.FRAMEBUFFER, bloomA.fbo);
    gl.viewport(0, 0, bloomA.w, bloomA.h);
    gl.useProgram(res.extract.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, scene.tex);
    gl.uniform1i(res.extract.u.uSceneTex, 0);
    gl.bindVertexArray(res.quadVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    const blur = res.blur;
    gl.useProgram(blur.program);
    gl.uniform1i(blur.u.uTex, 0);
    for (let pass = 0; pass < 2; pass += 1) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, bloomB.fbo);
        gl.bindTexture(gl.TEXTURE_2D, bloomA.tex);
        gl.uniform2f(blur.u.uStep, 1.35 / bloomA.w, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindFramebuffer(gl.FRAMEBUFFER, bloomA.fbo);
        gl.bindTexture(gl.TEXTURE_2D, bloomB.tex);
        gl.uniform2f(blur.u.uStep, 0, 1.35 / bloomA.h);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    if (post.raysOn) {
        const rays = res.rays;
        gl.bindFramebuffer(gl.FRAMEBUFFER, targets.rays.fbo);
        gl.viewport(0, 0, targets.rays.w, targets.rays.h);
        gl.useProgram(rays.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, scene.tex);
        gl.uniform1i(rays.u.uSceneTex, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, scene.depthTex);
        gl.uniform1i(rays.u.uDepthTex, 1);
        gl.uniform2f(rays.u.uSunUv, post.sunUv[0], post.sunUv[1]);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    const comp = res.comp;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, w, h);
    gl.useProgram(comp.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, scene.tex);
    gl.uniform1i(comp.u.uSceneTex, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, bloomA.tex);
    gl.uniform1i(comp.u.uBloomTex, 1);
    gl.uniform1f(comp.u.uTime, timeSec);
    gl.uniform1f(comp.u.uUnderwater, underwater ? 1 : 0);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, targets.rays.tex);
    gl.uniform1i(comp.u.uRaysTex, 2);
    const k = post.raysOn ? post.raysStrength : 0;
    gl.uniform3f(comp.u.uRaysColor, post.tint[0] * k, post.tint[1] * k, post.tint[2] * k);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}
