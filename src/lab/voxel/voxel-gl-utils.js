export function compileGlShader(gl, type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        const err = gl.getShaderInfoLog(sh) || "Shader compile error";
        gl.deleteShader(sh);
        throw new Error(err);
    }
    return sh;
}

export function linkProgram(gl, vsSrc, fsSrc) {
    const vs = compileGlShader(gl, gl.VERTEX_SHADER, vsSrc);
    const fs = compileGlShader(gl, gl.FRAGMENT_SHADER, fsSrc);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(prog) || "Program link error");
    }
    return prog;
}

export function createUniformCache(gl, program, names) {
    const cache = {};
    for (const name of names) cache[name] = gl.getUniformLocation(program, name);
    return cache;
}

function mix3(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function computeSkyAtmosphere(timeOfDay) {
    const angle = (timeOfDay - 0.15) * Math.PI * 2;
    const sunDir = [Math.cos(angle) * 0.72, Math.sin(angle), 0.44];
    const len = Math.hypot(sunDir[0], sunDir[1], sunDir[2]);
    sunDir[0] /= len;
    sunDir[1] /= len;
    sunDir[2] /= len;

    const elev = sunDir[1];
    const dayIntensity = Math.max(0.08, Math.min(1.0, (elev + 0.14) * 1.4));
    const sunsetT = Math.max(0, 1 - Math.abs(elev - 0.04) * 4.5);

    const nightSky = [0.02, 0.04, 0.1];
    const daySky = [0.22, 0.56, 0.94];
    const baseSky = mix3(nightSky, daySky, Math.max(0, Math.min(1, (elev + 0.12) * 1.8)));
    const skyColor = mix3(baseSky, [0.38, 0.28, 0.52], sunsetT * 0.55);

    const nightHoriz = [0.04, 0.06, 0.14];
    const dayHoriz = [0.58, 0.78, 0.96];
    const baseHoriz = mix3(nightHoriz, dayHoriz, Math.max(0, Math.min(1, (elev + 0.12) * 1.8)));
    const horizonColor = mix3(baseHoriz, [0.96, 0.52, 0.28], sunsetT * 0.85);

    const sunTint = mix3([1.0, 0.95, 0.88], [1.0, 0.52, 0.22], sunsetT);
    return { sunDir, dayIntensity, skyColor, horizonColor, sunTint };
}

const toLinear = (c) => [Math.pow(c[0], 2.2), Math.pow(c[1], 2.2), Math.pow(c[2], 2.2)];

export function linearizeAtmosphere(atmo) {
    return {
        sunDir: atmo.sunDir,
        dayIntensity: atmo.dayIntensity,
        skyColor: toLinear(atmo.skyColor),
        horizonColor: toLinear(atmo.horizonColor),
        sunTint: toLinear(atmo.sunTint)
    };
}

export function createFboTarget(gl, w, h, useFloat, withDepth) {
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    const intFmt = useFloat ? gl.RGBA16F : gl.RGBA8;
    const typ = useFloat ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE;
    gl.texImage2D(gl.TEXTURE_2D, 0, intFmt, w, h, 0, gl.RGBA, typ, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

    let depthTex = null;
    if (withDepth) {
        depthTex = createDepthTexture(gl, w, h);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTex, 0);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fbo, tex, depthTex, w, h };
}

export function createDepthOnlyTarget(gl, w, h) {
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    const depthTex = createDepthTexture(gl, w, h);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTex, 0);
    gl.drawBuffers([gl.NONE]);
    gl.readBuffer(gl.NONE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fbo, tex: null, depthTex, w, h };
}

export function disposeFboTarget(gl, target) {
    if (!target) return;
    gl.deleteFramebuffer(target.fbo);
    if (target.tex) gl.deleteTexture(target.tex);
    if (target.depthTex) gl.deleteTexture(target.depthTex);
}

function createDepthTexture(gl, w, h) {
    const depthTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, depthTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, w, h, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return depthTex;
}
