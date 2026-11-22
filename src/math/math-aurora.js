let animId = null;
let activeCanvas = null;
let resizeHandler = null;
let visibilityHandler = null;
let stars = [];
let mountainPoints = [];

function createStars(width, height) {
    const count = Math.max(80, Math.min(180, Math.floor((width * height) / 8000)));
    const list = [];
    for (let i = 0; i < count; i++) {
        list.push({
            x: Math.random() * width,
            y: Math.random() * (height * 0.85),
            r: Math.random() * 1.2 + 0.4,
            baseAlpha: Math.random() * 0.6 + 0.25,
            speed: Math.random() * 0.002 + 0.001,
            phase: Math.random() * Math.PI * 2
        });
    }
    return list;
}

function createMountains(width, height) {
    const points = [];
    const baseY = height * 0.86;
    const step = 40;
    const steps = Math.ceil(width / step) + 2;
    for (let i = 0; i <= steps; i++) {
        const x = i * step;
        const peak = Math.sin(i * 0.35) * 45 + Math.cos(i * 0.8) * 25 + Math.sin(i * 1.5) * 12;
        points.push({ x, y: baseY - Math.abs(peak) });
    }
    return points;
}

function renderFrame(ctx, width, height, time) {
    ctx.clearRect(0, 0, width, height);

    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, "#01040a");
    skyGrad.addColorStop(0.35, "#030a18");
    skyGrad.addColorStop(0.7, "#041428");
    skyGrad.addColorStop(1, "#020712");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        const alpha = Math.max(0.1, Math.min(0.95, star.baseAlpha + Math.sin(time * star.speed + star.phase) * 0.35));
        ctx.fillStyle = `rgba(224, 242, 254, ${alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    const ribbons = [
        {
            baseY: height * 0.32,
            height: height * 0.28,
            speed1: 0.00045,
            speed2: 0.0003,
            k1: 0.0018,
            k2: 0.0042,
            colorTop: "rgba(14, 165, 233, 0)",
            colorMid: "rgba(6, 182, 212, 0.28)",
            colorCore: "rgba(34, 211, 238, 0.45)",
            colorBot: "rgba(13, 148, 136, 0.08)"
        },
        {
            baseY: height * 0.42,
            height: height * 0.32,
            speed1: 0.0006,
            speed2: 0.0004,
            k1: 0.0022,
            k2: 0.0055,
            colorTop: "rgba(56, 189, 248, 0)",
            colorMid: "rgba(20, 184, 166, 0.35)",
            colorCore: "rgba(45, 212, 191, 0.52)",
            colorBot: "rgba(67, 56, 202, 0.12)"
        },
        {
            baseY: height * 0.25,
            height: height * 0.24,
            speed1: 0.00035,
            speed2: 0.0005,
            k1: 0.0015,
            k2: 0.0035,
            colorTop: "rgba(99, 102, 241, 0)",
            colorMid: "rgba(56, 189, 248, 0.22)",
            colorCore: "rgba(125, 211, 252, 0.38)",
            colorBot: "rgba(2, 6, 23, 0)"
        }
    ];

    const stepX = 14;
    for (let r = 0; r < ribbons.length; r++) {
        const rb = ribbons[r];
        const pointsBottom = [];
        const pointsTop = [];

        for (let x = 0; x <= width + stepX; x += stepX) {
            const wave1 = Math.sin(x * rb.k1 + time * rb.speed1) * 38;
            const wave2 = Math.cos(x * rb.k2 - time * rb.speed2) * 22;
            const wave3 = Math.sin(x * 0.0008 + time * 0.0002) * 16;
            const yBot = rb.baseY + wave1 + wave2 + wave3;
            const curtainVar = Math.sin(x * 0.006 + time * 0.0008) * 18;
            const yTop = Math.max(10, yBot - rb.height + curtainVar);

            pointsBottom.push({ x, y: yBot });
            pointsTop.push({ x, y: yTop });
        }

        const grad = ctx.createLinearGradient(0, rb.baseY - rb.height, 0, rb.baseY + 40);
        grad.addColorStop(0, rb.colorTop);
        grad.addColorStop(0.35, rb.colorMid);
        grad.addColorStop(0.7, rb.colorCore);
        grad.addColorStop(1, rb.colorBot);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(pointsBottom[0].x, pointsBottom[0].y);
        for (let i = 1; i < pointsBottom.length; i++) {
            ctx.lineTo(pointsBottom[i].x, pointsBottom[i].y);
        }
        for (let i = pointsTop.length - 1; i >= 0; i--) {
            ctx.lineTo(pointsTop[i].x, pointsTop[i].y);
        }
        ctx.closePath();
        ctx.fill();

        const rayCount = 18;
        const raySpacing = width / rayCount;
        for (let j = 0; j < rayCount; j++) {
            const rx = (j * raySpacing + (time * 0.015 * (r + 1))) % width;
            const rayAlpha = Math.max(0, Math.sin(j * 1.3 + time * 0.001) * 0.12);
            if (rayAlpha > 0.01) {
                const rayGrad = ctx.createLinearGradient(rx, rb.baseY - rb.height, rx, rb.baseY);
                rayGrad.addColorStop(0, "rgba(34, 211, 238, 0)");
                rayGrad.addColorStop(0.5, `rgba(165, 243, 252, ${rayAlpha})`);
                rayGrad.addColorStop(1, "rgba(6, 182, 212, 0)");
                ctx.fillStyle = rayGrad;
                ctx.fillRect(rx - 8, rb.baseY - rb.height, 16, rb.height);
            }
        }
    }

    ctx.restore();

    if (mountainPoints.length > 0) {
        const horizonGlow = ctx.createLinearGradient(0, height * 0.78, 0, height * 0.88);
        horizonGlow.addColorStop(0, "rgba(6, 182, 212, 0)");
        horizonGlow.addColorStop(0.5, "rgba(6, 182, 212, 0.08)");
        horizonGlow.addColorStop(1, "rgba(2, 6, 23, 0.6)");
        ctx.fillStyle = horizonGlow;
        ctx.fillRect(0, height * 0.78, width, height * 0.1);

        ctx.fillStyle = "#02050e";
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(0, mountainPoints[0].y);
        for (let i = 1; i < mountainPoints.length; i++) {
            ctx.lineTo(mountainPoints[i].x, mountainPoints[i].y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = "rgba(34, 211, 238, 0.08)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(mountainPoints[0].x, mountainPoints[0].y);
        for (let i = 1; i < mountainPoints.length; i++) {
            ctx.lineTo(mountainPoints[i].x, mountainPoints[i].y);
        }
        ctx.stroke();
    }
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
        mountainPoints = createMountains(width, height);
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
    mountainPoints = [];
}
