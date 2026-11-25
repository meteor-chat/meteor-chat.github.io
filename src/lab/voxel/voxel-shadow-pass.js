export function createShadowTarget(gl, size) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, size, size, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, tex, 0);
    gl.drawBuffers([gl.NONE]);
    gl.readBuffer(gl.NONE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fbo, tex, size };
}

export function disposeShadowTarget(gl, target) {
    if (!target) return;
    gl.deleteFramebuffer(target.fbo);
    gl.deleteTexture(target.tex);
}

export function drawShadowMap(gl, res, frame, opaqueEntries, cutoutEntries = [], timeSec = 0) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, res.shadowTarget.fbo);
    gl.viewport(0, 0, res.shadowTarget.size, res.shadowTarget.size);
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.depthMask(true);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1, 1);

    let drawCalls = 0;
    const { program, u } = res.shadow;
    gl.useProgram(program);
    gl.uniformMatrix4fv(u.uLightViewProj, false, frame.viewProj);
    for (const entry of opaqueEntries) {
        gl.uniform3fv(u.uChunkOrigin, entry.origin);
        gl.bindVertexArray(entry.opq.vao);
        gl.drawArrays(gl.TRIANGLES, 0, entry.opq.count);
        drawCalls += 1;
    }

    if (cutoutEntries.length > 0 && res.shadowCutout) {
        const sc = res.shadowCutout;
        gl.disable(gl.CULL_FACE);
        gl.useProgram(sc.program);
        gl.uniformMatrix4fv(sc.u.uLightViewProj, false, frame.viewProj);
        gl.uniform1f(sc.u.uTime, timeSec);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, res.texArray);
        gl.uniform1i(sc.u.uTexArray, 0);
        for (const entry of cutoutEntries) {
            gl.uniform3fv(sc.u.uChunkOrigin, entry.origin);
            gl.bindVertexArray(entry.cut.vao);
            gl.drawArrays(gl.TRIANGLES, 0, entry.cut.count);
            drawCalls += 1;
        }
        gl.enable(gl.CULL_FACE);
    }

    gl.disable(gl.POLYGON_OFFSET_FILL);
    return drawCalls;
}
