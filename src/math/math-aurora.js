let animId = null;
let activeCanvas = null;
let resizeHandler = null;
let visibilityHandler = null;
let stars = [];

function createStars(width, height) {
    const count = Math.max(70, Math.min(150, Math.floor((width * height) / 10000)));
    const list = [];
    for (let i = 0; i < count; i++) {
        list.push({
            x: Math.random() * width,
            y: Math.random() * height,
            r: Math.random() * 0.9 + 0.35,
            baseAlpha: Math.random() * 0.5 + 0.2,
            speed: Math.random() * 0.0015 + 0.0008,
            phase: Math.random() * Math.PI * 2
        });
    }
    return list;
}

function drawCurtain(ctx, width, height, time, config) {
    const {
        anchorXRatio,
        baseWidthRatio,
        swaySpeed,
        swayAmplitude,
        curtainTop,
        curtainBottom,
        filamentCount,
        colorBase,
        colorMid,
        colorPeak,
        colorTop
    } = config;

    const anchorX = width * anchorXRatio;
    const curtainWidth = width * baseWidthRatio;
    const sway = Math.sin(time * swaySpeed + config.phase) * swayAmplitude * width;
    const centerX = anchorX + sway;

    const yStart = height * curtainTop;
    const yEnd = height * curtainBottom;
    const curtainHeight = yEnd - yStart;

    const ambientGrad = ctx.createLinearGradient(centerX, yStart, centerX, yEnd);
    ambientGrad.addColorStop(0, "rgba(2, 6, 23, 0)");
    ambientGrad.addColorStop(0.25, colorTop);
    ambientGrad.addColorStop(0.55, colorMid);
    ambientGrad.addColorStop(0.85, colorPeak);
    ambientGrad.addColorStop(1, colorBase);

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    ctx.fillStyle = ambientGrad;
    ctx.beginPath();
    const halfW = curtainWidth * 0.65;
    ctx.ellipse(centerX, yStart + curtainHeight * 0.55, halfW, curtainHeight * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    const filamentStep = curtainWidth / filamentCount;
    for (let i = 0; i < filamentCount; i++) {
        const xOffset = (i - filamentCount / 2) * filamentStep;
        const filamentTime = time * 0.001;
        const waveX = Math.sin(filamentTime * 0.8 + i * 0.4) * 14;
        const xBase = centerX + xOffset + waveX;

        const pulse = Math.sin(time * 0.0012 + i * 0.6) * 0.35 + 0.65;
        if (pulse <= 0.05) continue;

        const filTop = yStart + Math.sin(i * 0.5 + time * 0.0006) * 35;
        const filGrad = ctx.createLinearGradient(xBase, filTop, xBase, yEnd);
        filGrad.addColorStop(0, "rgba(6, 182, 212, 0)");
        filGrad.addColorStop(0.2, colorTop);
        filGrad.addColorStop(0.5, colorMid);
        filGrad.addColorStop(0.8, colorPeak);
        filGrad.addColorStop(1, "rgba(2, 6, 23, 0)");

        ctx.strokeStyle = filGrad;
        ctx.lineWidth = Math.max(1.5, filamentStep * 0.9);
        ctx.beginPath();
        ctx.moveTo(xBase, yEnd);

        const cp1x = xBase + Math.sin(time * 0.0007 + i * 0.3) * 22;
        const cp1y = yStart + curtainHeight * 0.65;
        const cp2x = xBase - Math.cos(time * 0.0009 + i * 0.4) * 18;
        const cp2y = yStart + curtainHeight * 0.35;

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, xBase + Math.sin(time * 0.001 + i) * 10, filTop);
        ctx.stroke();
    }

    ctx.restore();
}

function renderFrame(ctx, width, height, time) {
    ctx.clearRect(0, 0, width, height);

    const spaceGrad = ctx.createLinearGradient(0, 0, 0, height);
    spaceGrad.addColorStop(0, "#010308");
    spaceGrad.addColorStop(0.4, "#020713");
    spaceGrad.addColorStop(0.75, "#030a1c");
    spaceGrad.addColorStop(1, "#02050e");
    ctx.fillStyle = spaceGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(6, 182, 212, 0.04)";
    ctx.beginPath();
    ctx.ellipse(width * 0.45, height * 0.45, width * 0.5, height * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        const alpha = Math.max(0.08, Math.min(0.85, star.baseAlpha + Math.sin(time * star.speed + star.phase) * 0.28));
        ctx.fillStyle = `rgba(224, 242, 254, ${alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
    }

    const curtains = [
        {
            anchorXRatio: 0.24,
            baseWidthRatio: 0.22,
            swaySpeed: 0.00028,
            swayAmplitude: 0.04,
            phase: 0.2,
            curtainTop: 0.05,
            curtainBottom: 0.82,
            filamentCount: 22,
            colorBase: "rgba(2, 6, 23, 0)",
            colorPeak: "rgba(14, 165, 233, 0.42)",
            colorMid: "rgba(6, 182, 212, 0.48)",
            colorTop: "rgba(34, 211, 238, 0.28)"
        },
        {
            anchorXRatio: 0.54,
            baseWidthRatio: 0.26,
            swaySpeed: 0.00035,
            swayAmplitude: 0.055,
            phase: 1.8,
            curtainTop: 0.02,
            curtainBottom: 0.88,
            filamentCount: 26,
            colorBase: "rgba(4, 12, 32, 0)",
            colorPeak: "rgba(20, 184, 166, 0.45)",
            colorMid: "rgba(45, 212, 191, 0.52)",
            colorTop: "rgba(56, 189, 248, 0.35)"
        },
        {
            anchorXRatio: 0.82,
            baseWidthRatio: 0.2,
            swaySpeed: 0.00022,
            swayAmplitude: 0.035,
            phase: 3.4,
            curtainTop: 0.08,
            curtainBottom: 0.78,
            filamentCount: 18,
            colorBase: "rgba(2, 6, 23, 0)",
            colorPeak: "rgba(59, 130, 246, 0.38)",
            colorMid: "rgba(79, 70, 229, 0.32)",
            colorTop: "rgba(125, 211, 252, 0.22)"
        }
    ];

    for (let c = 0; c < curtains.length; c++) {
        drawCurtain(ctx, width, height, time, curtains[c]);
    }

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const atmosphereGlow = ctx.createLinearGradient(0, height * 0.5, 0, height);
    atmosphereGlow.addColorStop(0, "rgba(6, 182, 212, 0)");
    atmosphereGlow.addColorStop(0.5, "rgba(6, 182, 212, 0.06)");
    atmosphereGlow.addColorStop(1, "rgba(3, 105, 161, 0.12)");
    ctx.fillStyle = atmosphereGlow;
    ctx.fillRect(0, height * 0.5, width, height * 0.5);
    ctx.restore();
}

export function initMathAurora(canvas) {
    if (!canvas) return null;
    destroyMathAurora();

    activeCanvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    let width = 0;
    let height = 0;

    function resize() {
        if (!activeCanvas) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = activeCanvas.getBoundingClientRect();
        width = Math.max(rect.width, window.innerWidth || 360);
        height = Math.max(rect.height, window.innerHeight || 640);

        activeCanvas.width = Math.floor(width * dpr);
        activeCanvas.height = Math.floor(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        stars = createStars(width, height);
    }

    resize();
    resizeHandler = () => {
        resize();
    };
    window.addEventListener("resize", resizeHandler, { passive: true });

    const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
        renderFrame(ctx, width, height, 1000);
        return { canvas, destroy: destroyMathAurora };
    }

    let isRunning = true;
    function loop(time) {
        if (!isRunning || !activeCanvas) return;
        renderFrame(ctx, width, height, time);
        animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);

    visibilityHandler = () => {
        if (document.hidden) {
            isRunning = false;
            if (animId) {
                cancelAnimationFrame(animId);
                animId = null;
            }
        } else {
            if (!isRunning) {
                isRunning = true;
                animId = requestAnimationFrame(loop);
            }
        }
    };
    document.addEventListener("visibilitychange", visibilityHandler);

    return {
        canvas,
        destroy: destroyMathAurora
    };
}

export function destroyMathAurora() {
    if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
    }
    if (resizeHandler) {
        window.removeEventListener("resize", resizeHandler);
        resizeHandler = null;
    }
    if (visibilityHandler) {
        document.removeEventListener("visibilitychange", visibilityHandler);
        visibilityHandler = null;
    }
    activeCanvas = null;
    stars = [];
}
