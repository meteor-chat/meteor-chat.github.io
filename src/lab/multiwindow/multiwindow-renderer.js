import {
    createOrthoMatrix,
    createTransformMatrix,
    multiplyMatrix,
    getGeometryVertices,
    getWindowColors,
    generateWormholeSceneData
} from "./multiwindow-math.js";

const VS_SRC = `
attribute vec3 aPos;
attribute vec3 aColor;
attribute float aSize;
uniform mat4 uMvp;
varying vec3 vColor;
void main() {
    gl_Position = uMvp * vec4(aPos, 1.0);
    gl_PointSize = clamp(aSize, 2.0, 32.0);
    vColor = aColor;
}
`;

const FS_SRC = `
precision highp float;
varying vec3 vColor;
uniform float uAlpha;
uniform float uMode;
void main() {
    if (uMode < 0.5) {
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord) * 2.0;
        if (dist > 1.0) discard;
        float glow = exp(-2.2 * dist * dist) * (1.0 - dist);
        gl_FragColor = vec4(vColor, glow * uAlpha);
    } else {
        gl_FragColor = vec4(vColor, uAlpha);
    }
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
    let uAlphaLoc = null;
    let uModeLoc = null;
    let aPosLoc = -1;
    let aColorLoc = -1;
    let aSizeLoc = -1;

    let wormholeVbo = null;
    let lineVbo = null;
    let lineColorVbo = null;
    let lineSizeVbo = null;
    const geoBuffers = new Map();

    if (gl) {
        program = createProgram(gl, VS_SRC, FS_SRC);
        if (program) {
            uMvpLoc = gl.getUniformLocation(program, "uMvp");
            uAlphaLoc = gl.getUniformLocation(program, "uAlpha");
            uModeLoc = gl.getUniformLocation(program, "uMode");
            aPosLoc = gl.getAttribLocation(program, "aPos");
            aColorLoc = gl.getAttribLocation(program, "aColor");
            aSizeLoc = gl.getAttribLocation(program, "aSize");

            wormholeVbo = gl.createBuffer();
            lineVbo = gl.createBuffer();
            lineColorVbo = gl.createBuffer();
            lineSizeVbo = gl.createBuffer();
        }
    }

    const getOrCreateGeo = (type, size = 110) => {
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

    const render2DFallback = (ctx, windows, sceneOffset, state, _time) => {
        ctx.fillStyle = "#030408";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(sceneOffset.x, sceneOffset.y);

        if (windows.length > 1) {
            for (let i = 0; i < windows.length; i += 1) {
                for (let j = i + 1; j < windows.length; j += 1) {
                    const wa = windows[i].shape;
                    const wb = windows[j].shape;
                    const ax = wa.x + wa.w * 0.5;
                    const ay = wa.y + wa.h * 0.5;
                    const bx = wb.x + wb.w * 0.5;
                    const by = wb.y + wb.h * 0.5;
                    const grad = ctx.createLinearGradient(ax, ay, bx, by);
                    const ca = getWindowColors(i, state.theme).outer;
                    const cb = getWindowColors(j, state.theme).outer;
                    grad.addColorStop(0, `rgba(${Math.floor(ca[0]*255)}, ${Math.floor(ca[1]*255)}, ${Math.floor(ca[2]*255)}, 0.6)`);
                    grad.addColorStop(1, `rgba(${Math.floor(cb[0]*255)}, ${Math.floor(cb[1]*255)}, ${Math.floor(cb[2]*255)}, 0.6)`);
                    ctx.strokeStyle = grad;
                    ctx.lineWidth = 14;
                    ctx.beginPath();
                    ctx.moveTo(ax, ay);
                    ctx.lineTo(bx, by);
                    ctx.stroke();
                }
            }
        }

        for (let i = 0; i < windows.length; i += 1) {
            const win = windows[i];
            const cx = win.shape.x + win.shape.w * 0.5;
            const cy = win.shape.y + win.shape.h * 0.5;
            const cols = getWindowColors(i, state.theme);
            const radGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 120);
            radGrad.addColorStop(0, `rgba(${Math.floor(cols.core[0]*255)}, ${Math.floor(cols.core[1]*255)}, ${Math.floor(cols.core[2]*255)}, 0.95)`);
            radGrad.addColorStop(0.5, `rgba(${Math.floor(cols.outer[0]*255)}, ${Math.floor(cols.outer[1]*255)}, ${Math.floor(cols.outer[2]*255)}, 0.75)`);
            radGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = radGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, 120, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    };

    const render = (windows, sceneOffset, state, time) => {
        if (!gl || !program) {
            const ctx = canvas.getContext ? canvas.getContext("2d") : null;
            if (ctx) render2DFallback(ctx, windows, sceneOffset, state, time);
            return;
        }

        const w = canvas.width;
        const h = canvas.height;
        gl.viewport(0, 0, w, h);
        gl.clearColor(0.015, 0.02, 0.035, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.disable(gl.DEPTH_TEST);

        gl.useProgram(program);
        const ortho = createOrthoMatrix(w, h, -2000, 2000);
        gl.uniformMatrix4fv(uMvpLoc, false, ortho);

        const geoType = state.geometryType || "wormhole";
        if (geoType === "wormhole") {
            const wormholeData = generateWormholeSceneData(windows, sceneOffset, time, state.theme);
            if (wormholeData.length > 0) {
                gl.bindBuffer(gl.ARRAY_BUFFER, wormholeVbo);
                gl.bufferData(gl.ARRAY_BUFFER, wormholeData, gl.DYNAMIC_DRAW);

                gl.enableVertexAttribArray(aPosLoc);
                gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 28, 0);

                gl.enableVertexAttribArray(aColorLoc);
                gl.vertexAttribPointer(aColorLoc, 3, gl.FLOAT, false, 28, 12);

                gl.enableVertexAttribArray(aSizeLoc);
                gl.vertexAttribPointer(aSizeLoc, 1, gl.FLOAT, false, 28, 24);

                gl.uniform1f(uModeLoc, 0.0);
                gl.uniform1f(uAlphaLoc, 0.96);
                gl.drawArrays(gl.POINTS, 0, wormholeData.length / 7);

                gl.disableVertexAttribArray(aColorLoc);
                gl.disableVertexAttribArray(aSizeLoc);
            }
        } else {
            gl.uniform1f(uModeLoc, 1.0);
            gl.uniform1f(uAlphaLoc, 0.95);
            gl.disableVertexAttribArray(aColorLoc);
            gl.disableVertexAttribArray(aSizeLoc);

            for (let i = 0; i < windows.length; i += 1) {
                const win = windows[i];
                const geo = getOrCreateGeo(geoType, 120);
                if (!geo.buffer) continue;

                const cx = win.shape.x + win.shape.w * 0.5 + sceneOffset.x;
                const cy = win.shape.y + win.shape.h * 0.5 + sceneOffset.y;
                const rx = time * 0.65 + i * 0.4;
                const ry = time * 0.85 + i * 0.25;
                const rz = time * 0.35;

                const model = createTransformMatrix(cx, cy, 0, rx, ry, rz);
                const mvp = multiplyMatrix(ortho, model);
                gl.uniformMatrix4fv(uMvpLoc, false, mvp);

                const col = getWindowColors(i, state.theme).outer;
                gl.vertexAttrib3f(aColorLoc, col[0], col[1], col[2]);
                gl.vertexAttrib1f(aSizeLoc, 1.0);

                gl.bindBuffer(gl.ARRAY_BUFFER, geo.buffer);
                gl.enableVertexAttribArray(aPosLoc);
                gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);
                gl.drawArrays(gl.LINES, 0, geo.count);
            }
        }
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
        if (wormholeVbo) gl.deleteBuffer(wormholeVbo);
        if (lineVbo) gl.deleteBuffer(lineVbo);
        if (lineColorVbo) gl.deleteBuffer(lineColorVbo);
        if (lineSizeVbo) gl.deleteBuffer(lineSizeVbo);
        if (program) gl.deleteProgram(program);
    };

    return {
        render,
        resize,
        destroy,
        hasWebGL: Boolean(gl && program)
    };
}
