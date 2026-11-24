import { AURORA_VS, AURORA_FS, NOISE_PERIOD } from "./math-aurora-shaders.js";

export const TAU = Math.PI * 2;
export const MAX_DT_SEC = 0.05;
export const MAX_BACKING_DIM = 1280;

export const WAVE_SPEEDS = [0.76, 1.2297058, 0.5374011, 1.0067856];
export const DRIFT_SPEEDS = [0.54, 0.3818376, 0.2424871, 0.3117691];

const FULLSCREEN_TRIANGLE = new Float32Array([-1, -1, 3, -1, -1, 3]);

const FALLBACK_CURTAINS = [
    { x: -0.20, w: 0.17, lean: 0.14, phase: 0.35, alpha: 0.56, core: true },
    { x: -0.10, w: 0.22, lean: 0.10, phase: 1.75, alpha: 0.34, core: false },
    { x: 0.22, w: 0.22, lean: -0.05, phase: 2.95, alpha: 0.38, core: false },
    { x: 0.54, w: 0.26, lean: -0.11, phase: 4.25, alpha: 0.26, core: false },
    { x: -0.54, w: 0.26, lean: 0.09, phase: 5.15, alpha: 0.22, core: false }
];

export function createAuroraState() {
    return {
        wave: [0.4, 1.7, 2.9, 0.8],
        drift: [1.3, 4.1, 7.2, 2.5]
    };
}

export function stepAuroraState(state, dtSec) {
    if (!Number.isFinite(dtSec) || dtSec <= 0) return state;
    const dt = dtSec > MAX_DT_SEC ? MAX_DT_SEC : dtSec;
    for (let i = 0; i < 4; i += 1) {
        state.wave[i] = (state.wave[i] + dt * WAVE_SPEEDS[i]) % TAU;
        state.drift[i] = (state.drift[i] + dt * DRIFT_SPEEDS[i]) % NOISE_PERIOD;
    }
    return state;
}

export function computeAuroraCanvasSize(cssWidth, cssHeight, dpr = 1, maxDim = MAX_BACKING_DIM) {
    const safeW = Number.isFinite(cssWidth) && cssWidth > 0 ? cssWidth : 1;
    const safeH = Number.isFinite(cssHeight) && cssHeight > 0 ? cssHeight : 1;
    const clampedDpr = Number.isFinite(dpr) && dpr > 0 ? Math.min(dpr, 1.0) : 1.0;
    let width = safeW * clampedDpr;
    let height = safeH * clampedDpr;
    const longest = Math.max(width, height);
    if (longest > maxDim) {
        const scale = maxDim / longest;
        width *= scale;
        height *= scale;
    }
    return {
        width: Math.max(1, Math.round(width)),
        height: Math.max(1, Math.round(height))
    };
}

function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createAuroraProgram(gl) {
    const vs = compileShader(gl, gl.VERTEX_SHADER, AURORA_VS);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, AURORA_FS);
    if (!vs || !fs) {
        if (vs) gl.deleteShader(vs);
        if (fs) gl.deleteShader(fs);
        return null;
    }
    const program = gl.createProgram();
    if (!program) {
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        return null;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.deleteProgram(program);
        return null;
    }
    return program;
}

function createWebGLBackend(canvas) {
    const opts = {
        alpha: false,
        depth: false,
        stencil: false,
        antialias: false,
        preserveDrawingBuffer: false,
        powerPreference: "low-power"
    };
    const gl = canvas.getContext("webgl2", opts)
        || canvas.getContext("webgl", opts)
        || canvas.getContext("experimental-webgl", opts);
    if (!gl) return null;

    let program = null;
    let buffer = null;
    let posLoc = -1;
    let uResolution = null;
    let uWavePhase = null;
    let uDriftPhase = null;

    function setup() {
        program = createAuroraProgram(gl);
        if (!program) return false;
        buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, FULLSCREEN_TRIANGLE, gl.STATIC_DRAW);
        posLoc = gl.getAttribLocation(program, "aPosition");
        uResolution = gl.getUniformLocation(program, "uResolution");
        uWavePhase = gl.getUniformLocation(program, "uWavePhase");
        uDriftPhase = gl.getUniformLocation(program, "uDriftPhase");
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
        return true;
    }

    function teardown() {
        if (buffer) {
            gl.deleteBuffer(buffer);
            buffer = null;
        }
        if (program) {
            gl.deleteProgram(program);
            program = null;
        }
        posLoc = -1;
        uResolution = null;
        uWavePhase = null;
        uDriftPhase = null;
    }

    if (!setup()) {
        teardown();
        return null;
    }

    return {
        mode: "webgl",
        restore() {
            teardown();
            return setup();
        },
        render(state, width, height) {
            if (!program || !buffer) return;
            if (typeof gl.isContextLost === "function" && gl.isContextLost()) return;
            gl.viewport(0, 0, width, height);
            gl.useProgram(program);
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            if (posLoc >= 0) {
                gl.enableVertexAttribArray(posLoc);
                gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
            }
            if (uResolution) gl.uniform2f(uResolution, width, height);
            if (uWavePhase) {
                gl.uniform4f(
                    uWavePhase,
                    state.wave[0],
                    state.wave[1],
                    state.wave[2],
                    state.wave[3]
                );
            }
            if (uDriftPhase) {
                gl.uniform4f(
                    uDriftPhase,
                    state.drift[0],
                    state.drift[1],
                    state.drift[2],
                    state.drift[3]
                );
            }
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        },
        destroy() {
            teardown();
        }
    };
}

function createCanvas2DBackend(canvas) {
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return null;

    return {
        mode: "2d",
        restore() {
            return true;
        },
        render(state, width, height) {
            const sky = ctx.createLinearGradient(0, 0, 0, height);
            sky.addColorStop(0, "#01030a");
            sky.addColorStop(0.55, "#030b24");
            sky.addColorStop(1, "#061c4e");
            ctx.globalCompositeOperation = "source-over";
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, width, height);

            ctx.globalCompositeOperation = "lighter";
            const aspect = width / Math.max(height, 1);
            const xScale = 1 + (aspect - 1) * 0.58;

            for (let i = 0; i < FALLBACK_CURTAINS.length; i += 1) {
                const c = FALLBACK_CURTAINS[i];
                const swayA = Math.sin(state.wave[0] + c.phase) * 0.055;
                const swayB = Math.cos(state.wave[1] - c.phase * 1.3) * 0.035;
                const cx = (0.5 + (c.x + swayA) / xScale) * width;
                const topX = cx + (c.lean + swayB) * width * 0.55;
                const bandW = (c.w / xScale) * width;
                const pulse = 0.72 + 0.28 * Math.sin(state.wave[3] + c.phase);
                const alpha = c.alpha * pulse;

                const grad = ctx.createLinearGradient(cx - bandW * 0.5, height * 0.88, topX + bandW * 0.5, height * 0.04);
                grad.addColorStop(0, "rgba(8, 42, 128, 0)");
                grad.addColorStop(0.28, `rgba(18, 118, 224, ${(alpha * 0.85).toFixed(3)})`);
                grad.addColorStop(0.56, c.core
                    ? `rgba(74, 212, 255, ${(alpha * 1.05).toFixed(3)})`
                    : `rgba(26, 150, 240, ${(alpha * 0.72).toFixed(3)})`);
                grad.addColorStop(1, "rgba(6, 28, 92, 0)");

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.moveTo(cx - bandW * 0.35, height * 0.92);
                ctx.bezierCurveTo(
                    cx - bandW * 0.6,
                    height * 0.62,
                    topX - bandW * 0.45,
                    height * 0.32,
                    topX - bandW * 0.25,
                    height * 0.02
                );
                ctx.lineTo(topX + bandW * 0.85, height * 0.02);
                ctx.bezierCurveTo(
                    topX + bandW * 0.95,
                    height * 0.36,
                    cx + bandW * 0.8,
                    height * 0.66,
                    cx + bandW * 0.55,
                    height * 0.92
                );
                ctx.closePath();
                ctx.fill();
            }
            ctx.globalCompositeOperation = "source-over";
        },
        destroy() {}
    };
}

export function initMathAurora(canvas, options = {}) {
    if (!canvas || typeof canvas.getContext !== "function") return null;

    const backend = createWebGLBackend(canvas) || createCanvas2DBackend(canvas);
    if (!backend) return null;

    const menuView = options.menuView !== undefined
        ? options.menuView
        : document.getElementById("math-menu-view");
    const state = createAuroraState();
    let rafId = 0;
    let lastTs = 0;
    let contextLost = false;
    let destroyed = false;
    let active = true;

    function syncSize() {
        const cssW = window.innerWidth || canvas.clientWidth || 1280;
        const cssH = window.innerHeight || canvas.clientHeight || 720;
        const { width, height } = computeAuroraCanvasSize(cssW, cssH, window.devicePixelRatio || 1);
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }
    }

    function shouldAnimate() {
        return !destroyed && active && !contextLost && !document.hidden;
    }

    function stopLoop() {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = 0;
        }
        lastTs = 0;
    }

    function renderFrame(ts) {
        rafId = 0;
        if (!shouldAnimate()) return;
        const now = typeof ts === "number" ? ts : performance.now();
        if (lastTs > 0) {
            stepAuroraState(state, (now - lastTs) * 0.001);
        }
        lastTs = now;
        backend.render(state, canvas.width, canvas.height);
        rafId = requestAnimationFrame(renderFrame);
    }

    function startLoop() {
        if (rafId || !shouldAnimate()) return;
        syncSize();
        backend.render(state, canvas.width, canvas.height);
        lastTs = performance.now();
        rafId = requestAnimationFrame(renderFrame);
    }

    function setActive(nextActive) {
        active = Boolean(nextActive);
        canvas.classList.toggle("hidden", !active);
        if (active) {
            startLoop();
        } else {
            stopLoop();
        }
    }

    function syncWithMenuView() {
        if (!menuView) {
            setActive(true);
            return;
        }
        setActive(!menuView.classList.contains("hidden"));
    }

    const onResize = () => {
        if (destroyed) return;
        syncSize();
        if (shouldAnimate()) {
            backend.render(state, canvas.width, canvas.height);
        }
    };

    const onVisibility = () => {
        if (destroyed) return;
        if (document.hidden) {
            stopLoop();
        } else if (active && !contextLost) {
            startLoop();
        }
    };

    const onContextLost = (e) => {
        if (e && typeof e.preventDefault === "function") e.preventDefault();
        contextLost = true;
        stopLoop();
    };

    const onContextRestored = () => {
        contextLost = false;
        if (destroyed) return;
        if (backend.restore()) {
            syncSize();
            if (active && !document.hidden) startLoop();
        }
    };

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);

    let observer = null;
    if (menuView && typeof MutationObserver === "function") {
        observer = new MutationObserver(syncWithMenuView);
        observer.observe(menuView, { attributes: true, attributeFilter: ["class"] });
    }

    syncWithMenuView();

    return {
        mode: backend.mode,
        state,
        isRunning: () => rafId !== 0,
        isActive: () => active,
        resize: onResize,
        setActive,
        start: startLoop,
        stop: stopLoop,
        destroy() {
            if (destroyed) return;
            destroyed = true;
            stopLoop();
            if (observer) {
                observer.disconnect();
                observer = null;
            }
            window.removeEventListener("resize", onResize);
            window.removeEventListener("orientationchange", onResize);
            document.removeEventListener("visibilitychange", onVisibility);
            canvas.removeEventListener("webglcontextlost", onContextLost);
            canvas.removeEventListener("webglcontextrestored", onContextRestored);
            backend.destroy();
        }
    };
}
