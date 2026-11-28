import {
    createOrthoMatrix,
    createTransformMatrix,
    getGeometryVertices,
    getWindowColors,
    generateWormholeSceneData
} from "./multiwindow-math.js";
import { buildWireframeRibbons, generateBridgeRibbons, getWindowCenter } from "./multiwindow-ribbons.js";

const VS_SRC = `
attribute vec3 aPos;
attribute vec3 aColor;
attribute float aSize;
uniform mat4 uMvp;
uniform float uDpr;
varying vec3 vColor;
varying float vEdge;
void main() {
    gl_Position = uMvp * vec4(aPos, 1.0);
    gl_PointSize = clamp(aSize * uDpr, 2.0, 48.0);
    vColor = aColor;
    vEdge = aSize;
}
`;

const FS_SRC = `
precision highp float;
varying vec3 vColor;
varying float vEdge;
uniform float uAlpha;
uniform float uMode;
void main() {
    if (uMode < 0.5) {
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord) * 2.0;
        if (dist > 1.0) discard;
        float glow = exp(-2.8 * dist * dist) * smoothstep(1.0, 0.0, dist);
        float core = smoothstep(0.32, 0.0, dist);
        vec3 finalCol = mix(vColor, vec3(1.0), core * 0.72);
        gl_FragColor = vec4(finalCol, glow * uAlpha);
    } else if (uMode < 1.5) {
        gl_FragColor = vec4(vColor, uAlpha);
    } else {
        float d = abs(vEdge);
        if (d > 1.0) discard;
        float intensity = clamp(max(vColor.r, max(vColor.g, vColor.b)), 0.0, 1.0);
        if (intensity < 0.002) discard;
        vec3 baseCol = vColor / intensity;
        float glow = exp(-3.1 * d * d) * smoothstep(1.0, 0.02, d);
        float core = exp(-16.0 * d * d);
        vec3 finalCol = mix(baseCol, vec3(1.0), core * 0.58);
        gl_FragColor = vec4(finalCol, (glow * 0.56 + core * 0.44) * intensity * uAlpha);
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
    let uDprLoc = null;
    let uAlphaLoc = null;
    let uModeLoc = null;
    let aPosLoc = -1;
    let aColorLoc = -1;
    let aSizeLoc = -1;

    let wormholeVbo = null;
    let ribbonVbo = null;
    const geoBuffers = new Map();

    if (gl) {
        program = createProgram(gl, VS_SRC, FS_SRC);
        if (program) {
            uMvpLoc = gl.getUniformLocation(program, "uMvp");
            uDprLoc = gl.getUniformLocation(program, "uDpr");
            uAlphaLoc = gl.getUniformLocation(program, "uAlpha");
            uModeLoc = gl.getUniformLocation(program, "uMode");
            aPosLoc = gl.getAttribLocation(program, "aPos");
            aColorLoc = gl.getAttribLocation(program, "aColor");
            aSizeLoc = gl.getAttribLocation(program, "aSize");

            wormholeVbo = gl.createBuffer();
            ribbonVbo = gl.createBuffer();
        }
    }

    let cssW = 800;
    let cssH = 600;
    let currentDpr = 1;

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

    const drawInterleaved = (vbo, data, mode, primitive, alpha) => {
        if (!data || data.length === 0) return;
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(aPosLoc);
        gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 28, 0);
        gl.enableVertexAttribArray(aColorLoc);
        gl.vertexAttribPointer(aColorLoc, 3, gl.FLOAT, false, 28, 12);
        gl.enableVertexAttribArray(aSizeLoc);
        gl.vertexAttribPointer(aSizeLoc, 1, gl.FLOAT, false, 28, 24);
        gl.uniform1f(uModeLoc, mode);
        gl.uniform1f(uAlphaLoc, alpha);
        gl.drawArrays(primitive, 0, data.length / 7);
        gl.disableVertexAttribArray(aColorLoc);
        gl.disableVertexAttribArray(aSizeLoc);
    };

    const render2DFallback = (ctx, windows, sceneOffset, state) => {
        ctx.fillStyle = "#030408";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        if (typeof ctx.scale === "function") ctx.scale(currentDpr, currentDpr);

        if (state.showBeams !== false && windows.length > 1) {
            for (let i = 0; i < windows.length; i += 1) {
                for (let j = i + 1; j < windows.length; j += 1) {
                    const ca = getWindowCenter(windows[i], sceneOffset);
                    const cb = getWindowCenter(windows[j], sceneOffset);
                    const grad = ctx.createLinearGradient(ca.x, ca.y, cb.x, cb.y);
                    const colA = getWindowColors(i, state.theme).outer;
                    const colB = getWindowColors(j, state.theme).outer;
                    grad.addColorStop(0, `rgba(${Math.floor(colA[0] * 255)}, ${Math.floor(colA[1] * 255)}, ${Math.floor(colA[2] * 255)}, 0.7)`);
                    grad.addColorStop(1, `rgba(${Math.floor(colB[0] * 255)}, ${Math.floor(colB[1] * 255)}, ${Math.floor(colB[2] * 255)}, 0.7)`);
                    ctx.strokeStyle = grad;
                    ctx.lineWidth = 10;
                    ctx.beginPath();
                    ctx.moveTo(ca.x, ca.y);
                    ctx.lineTo(cb.x, cb.y);
                    ctx.stroke();
                }
            }
        }

        for (let i = 0; i < windows.length; i += 1) {
            const c = getWindowCenter(windows[i], sceneOffset);
            const cols = getWindowColors(i, state.theme);
            const radGrad = ctx.createRadialGradient(c.x, c.y, 10, c.x, c.y, 120);
            radGrad.addColorStop(0, `rgba(${Math.floor(cols.core[0] * 255)}, ${Math.floor(cols.core[1] * 255)}, ${Math.floor(cols.core[2] * 255)}, 0.95)`);
            radGrad.addColorStop(0.5, `rgba(${Math.floor(cols.outer[0] * 255)}, ${Math.floor(cols.outer[1] * 255)}, ${Math.floor(cols.outer[2] * 255)}, 0.75)`);
            radGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = radGrad;
            ctx.beginPath();
            ctx.arc(c.x, c.y, 120, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    };

    const render = (windows, sceneOffset, state, time) => {
        if (!gl || !program) {
            const ctx = canvas.getContext ? canvas.getContext("2d") : null;
            if (ctx) render2DFallback(ctx, windows, sceneOffset, state);
            return;
        }

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.012, 0.016, 0.03, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.disable(gl.DEPTH_TEST);

        gl.useProgram(program);
        const ortho = createOrthoMatrix(cssW, cssH, -2000, 2000);
        gl.uniformMatrix4fv(uMvpLoc, false, ortho);
        if (uDprLoc) gl.uniform1f(uDprLoc, currentDpr);

        const geoType = state.geometryType || "wormhole";
        const showBeams = state.showBeams !== false;
        const showParticles = state.showParticles !== false;

        if (showBeams && windows.length > 1) {
            const ribbons = generateBridgeRibbons(windows, sceneOffset, time, state.theme, geoType === "wormhole");
            drawInterleaved(ribbonVbo, ribbons, 2.0, gl.TRIANGLES, 0.92);
        }

        if (geoType === "wormhole") {
            if (showParticles) {
                const wormholeData = generateWormholeSceneData(windows, sceneOffset, time, state.theme, true);
                drawInterleaved(wormholeVbo, wormholeData, 0.0, gl.POINTS, 0.88);
            }
        } else {
            for (let i = 0; i < windows.length; i += 1) {
                const geo = getOrCreateGeo(geoType, 120);
                const center = getWindowCenter(windows[i], sceneOffset);
                const rx = time * 0.65 + i * 0.4;
                const ry = time * 0.85 + i * 0.25;
                const rz = time * 0.35;
                const model = createTransformMatrix(center.x, center.y, 0, rx, ry, rz);
                const col = getWindowColors(i, state.theme).outer;
                const wireRibbons = buildWireframeRibbons(geo.data, model, col, 2.8, 0.9);
                drawInterleaved(ribbonVbo, wireRibbons, 2.0, gl.TRIANGLES, 0.95);
            }
        }
    };

    const resize = (width, height, dpr = 1) => {
        cssW = width;
        cssH = height;
        currentDpr = dpr;
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
        if (ribbonVbo) gl.deleteBuffer(ribbonVbo);
        if (program) gl.deleteProgram(program);
    };

    return {
        render,
        resize,
        destroy,
        hasWebGL: Boolean(gl && program)
    };
}
