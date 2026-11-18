import {
    createOrthoMatrix,
    createTransformMatrix,
    multiplyMatrix,
    getGeometryVertices,
    getWindowColor
} from "./multiwindow-math.js";

const VS_SOURCE = `#version 300 es
precision highp float;
layout(location = 0) in vec3 aPos;
uniform mat4 uMvp;
void main() {
    gl_Position = uMvp * vec4(aPos, 1.0);
    gl_PointSize = 4.0;
}
`;

const FS_SOURCE = `#version 300 es
precision highp float;
uniform vec3 uColor;
uniform float uAlpha;
out vec4 fragColor;
void main() {
    fragColor = vec4(uColor, uAlpha);
}
`;

function createShader(gl, type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        gl.deleteShader(s);
        return null;
    }
    return s;
}

function createProgram(gl, vsSource, fsSource) {
    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return null;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        gl.deleteProgram(prog);
        return null;
    }
    return prog;
}

export function createMultiwindowRenderer(canvas) {
    if (!canvas) return null;
    let gl = null;
    try {
        gl = canvas.getContext("webgl2", { alpha: false, antialias: true })
            || canvas.getContext("webgl", { alpha: false, antialias: true });
    } catch {
        gl = null;
    }

    let program = null;
    let uMvpLoc = null;
    let uColorLoc = null;
    let uAlphaLoc = null;
    let vao = null;
    let lineVbo = null;
    let beamVbo = null;
    let particleVbo = null;
    const geoBuffers = new Map();

    if (gl) {
        program = createProgram(gl, VS_SOURCE, FS_SOURCE);
        if (program) {
            uMvpLoc = gl.getUniformLocation(program, "uMvp");
            uColorLoc = gl.getUniformLocation(program, "uColor");
            uAlphaLoc = gl.getUniformLocation(program, "uAlpha");
            vao = gl.createVertexArray ? gl.createVertexArray() : null;
            if (vao) gl.bindVertexArray(vao);
            lineVbo = gl.createBuffer();
            beamVbo = gl.createBuffer();
            particleVbo = gl.createBuffer();
            gl.enableVertexAttribArray(0);
            if (vao) gl.bindVertexArray(null);
        }
    }

    const getOrCreateGeoBuffer = (type, size = 110) => {
        const key = `${type}_${size}`;
        if (geoBuffers.has(key)) return geoBuffers.get(key);
        const data = getGeometryVertices(type, size);
        let buf = null;
        if (gl) {
            buf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        }
        const record = { buffer: buf, count: data.length / 3, data };
        geoBuffers.set(key, record);
        return record;
    };

    const render2DFallback = (ctx, windows, sceneOffset, state, time) => {
        ctx.fillStyle = "#090d16";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(sceneOffset.x, sceneOffset.y);

        if (state.showBeams && windows.length > 1) {
            ctx.strokeStyle = "rgba(79, 195, 247, 0.45)";
            ctx.lineWidth = 2;
            for (let i = 0; i < windows.length; i += 1) {
                for (let j = i + 1; j < windows.length; j += 1) {
                    const wa = windows[i].shape;
                    const wb = windows[j].shape;
                    ctx.beginPath();
                    ctx.moveTo(wa.x + wa.w * 0.5, wa.y + wa.h * 0.5);
                    ctx.lineTo(wb.x + wb.w * 0.5, wb.y + wb.h * 0.5);
                    ctx.stroke();
                }
            }
        }

        for (let i = 0; i < windows.length; i += 1) {
            const win = windows[i];
            const cx = win.shape.x + win.shape.w * 0.5;
            const cy = win.shape.y + win.shape.h * 0.5;
            const col = getWindowColor(i, state.theme);
            const r255 = Math.floor(col[0] * 255);
            const g255 = Math.floor(col[1] * 255);
            const b255 = Math.floor(col[2] * 255);
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(time * 0.5 + i * 0.3);
            ctx.strokeStyle = `rgb(${r255}, ${g255}, ${b255})`;
            ctx.lineWidth = 2.5;
            const s = 90 + i * 15;
            ctx.strokeRect(-s * 0.5, -s * 0.5, s, s);
            ctx.restore();
        }
        ctx.restore();
    };

    const render = (windows, sceneOffset, state, time, particles) => {
        if (!gl || !program) {
            const ctx = canvas.getContext ? canvas.getContext("2d") : null;
            if (ctx) render2DFallback(ctx, windows, sceneOffset, state, time);
            return;
        }

        const w = canvas.width;
        const h = canvas.height;
        gl.viewport(0, 0, w, h);
        gl.clearColor(0.035, 0.05, 0.085, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.disable(gl.DEPTH_TEST);

        gl.useProgram(program);
        if (vao) gl.bindVertexArray(vao);

        const ortho = createOrthoMatrix(w, h, -2000, 2000);

        if (state.showBeams && windows.length > 1) {
            const beamPoints = [];
            for (let i = 0; i < windows.length; i += 1) {
                for (let j = i + 1; j < windows.length; j += 1) {
                    const wa = windows[i].shape;
                    const wb = windows[j].shape;
                    const ax = wa.x + wa.w * 0.5 + sceneOffset.x;
                    const ay = wa.y + wa.h * 0.5 + sceneOffset.y;
                    const bx = wb.x + wb.w * 0.5 + sceneOffset.x;
                    const by = wb.y + wb.h * 0.5 + sceneOffset.y;
                    beamPoints.push(ax, ay, 0, bx, by, 0);
                }
            }
            if (beamPoints.length > 0) {
                const beamData = new Float32Array(beamPoints);
                gl.bindBuffer(gl.ARRAY_BUFFER, beamVbo);
                gl.bufferData(gl.ARRAY_BUFFER, beamData, gl.DYNAMIC_DRAW);
                gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
                gl.uniformMatrix4fv(uMvpLoc, false, ortho);
                gl.uniform3f(uColorLoc, 0.35, 0.78, 1.0);
                const pulse = 0.45 + 0.25 * Math.sin(time * 4.0);
                gl.uniform1f(uAlphaLoc, pulse);
                gl.drawArrays(gl.LINES, 0, beamPoints.length / 3);
            }
        }

        const geoType = state.geometryType || "box";
        for (let i = 0; i < windows.length; i += 1) {
            const win = windows[i];
            const size = 100 + (i % 4) * 15;
            const geo = getOrCreateGeoBuffer(geoType, size);
            if (!geo.buffer) continue;

            const cx = win.shape.x + win.shape.w * 0.5 + sceneOffset.x;
            const cy = win.shape.y + win.shape.h * 0.5 + sceneOffset.y;
            const rx = time * 0.65 + i * 0.4;
            const ry = time * 0.85 + i * 0.25;
            const rz = time * 0.35;

            const model = createTransformMatrix(cx, cy, 0, rx, ry, rz);
            const mvp = multiplyMatrix(ortho, model);

            const col = getWindowColor(i, state.theme);
            gl.bindBuffer(gl.ARRAY_BUFFER, geo.buffer);
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
            gl.uniformMatrix4fv(uMvpLoc, false, mvp);
            gl.uniform3f(uColorLoc, col[0], col[1], col[2]);
            gl.uniform1f(uAlphaLoc, 0.95);
            gl.drawArrays(gl.LINES, 0, geo.count);
        }

        if (state.showParticles && particles && particles.length > 0) {
            const count = particles.length / 6;
            const pts = new Float32Array(count * 3);
            for (let i = 0; i < count; i += 1) {
                pts[i * 3] = particles[i * 6] + sceneOffset.x;
                pts[i * 3 + 1] = particles[i * 6 + 1] + sceneOffset.y;
                pts[i * 3 + 2] = particles[i * 6 + 2];
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, particleVbo);
            gl.bufferData(gl.ARRAY_BUFFER, pts, gl.DYNAMIC_DRAW);
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
            gl.uniformMatrix4fv(uMvpLoc, false, ortho);
            gl.uniform3f(uColorLoc, 0.9, 0.95, 1.0);
            gl.uniform1f(uAlphaLoc, 0.7);
            gl.drawArrays(gl.POINTS, 0, count);
        }

        if (vao) gl.bindVertexArray(null);
    };

    const resize = (width, height, dpr = 1) => {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
    };

    const destroy = () => {
        if (!gl) return;
        for (const record of geoBuffers.values()) {
            if (record.buffer) gl.deleteBuffer(record.buffer);
        }
        geoBuffers.clear();
        if (lineVbo) gl.deleteBuffer(lineVbo);
        if (beamVbo) gl.deleteBuffer(beamVbo);
        if (particleVbo) gl.deleteBuffer(particleVbo);
        if (program) gl.deleteProgram(program);
    };

    return {
        render,
        resize,
        destroy,
        hasWebGL: Boolean(gl && program)
    };
}
