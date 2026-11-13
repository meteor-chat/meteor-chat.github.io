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
    gl.disable(gl.DEPTH_TEST);
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
}

export function beginWorldPass(gl, res, cam, eye, atmo, timeSec) {
    const { program, u } = res.world;
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.depthMask(true);
    gl.useProgram(program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, res.texArray);
    gl.uniform1i(u.uTexArray, 0);
    gl.uniformMatrix4fv(u.uViewProj, false, cam.viewProj);
    gl.uniform3fv(u.uCamPos, eye);
    setAtmosphere(gl, u, atmo, timeSec);
    gl.uniform1f(u.uFogStart, 34);
    gl.uniform1f(u.uFogEnd, 68);
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

export function drawPostFx(gl, res, targets, w, h, timeSec, underwater) {
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
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}
