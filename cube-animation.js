let animCanvas = null;
let animCtx = null;
let animFrameId = null;
const pulses = [];

export function initCubeAnimation(canvas) {
    animCanvas = canvas || document.getElementById("cube-anim-canvas");
    if (!animCanvas) return;
    animCtx = animCanvas.getContext("2d");
    resizeAnimCanvas();
    window.addEventListener("resize", resizeAnimCanvas);
}

function resizeAnimCanvas() {
    if (!animCanvas) return;
    const layout = document.getElementById("cube-calc-layout");
    if (!layout) return;
    const rect = layout.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const dpr = window.devicePixelRatio || 1;
    animCanvas.width = rect.width * dpr;
    animCanvas.height = rect.height * dpr;
}

export function triggerCubeAnimation() {
    resizeAnimCanvas();
    pulses.push({
        startTime: performance.now(),
        duration: 950
    });
    if (!animFrameId) {
        animFrameId = requestAnimationFrame(animLoop);
    }
}

function drawGlowDot(ctx, x, y, r, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.8);
    g.addColorStop(0, "rgba(255, 255, 255, 1)");
    g.addColorStop(0.25, "rgba(254, 240, 138, 0.95)");
    g.addColorStop(0.55, "rgba(245, 158, 11, 0.8)");
    g.addColorStop(1, "rgba(245, 158, 11, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function animLoop(now) {
    if (!animCanvas || !animCtx) return;
    const layout = document.getElementById("cube-calc-layout");
    if (!layout) return;
    const layoutRect = layout.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    animCtx.save();
    animCtx.clearRect(0, 0, animCanvas.width, animCanvas.height);
    animCtx.scale(dpr, dpr);

    const leftPanel = document.getElementById("cube-left-panel");
    const centerCanvas = document.getElementById("cube-canvas");
    if (!leftPanel || !centerCanvas) {
        animCtx.restore();
        animFrameId = null;
        return;
    }

    const leftRect = leftPanel.getBoundingClientRect();
    const centerRect = centerCanvas.getBoundingClientRect();

    const lx1 = leftRect.right - layoutRect.left;
    const ly1 = leftRect.top + leftRect.height / 2 - layoutRect.top;
    const lx2 = centerRect.left - layoutRect.left;
    const ly2 = centerRect.top + centerRect.height / 2 - layoutRect.top;
    const rx1 = centerRect.right - layoutRect.left;
    const ry1 = centerRect.top + centerRect.height / 2 - layoutRect.top;

    const paths = [];
    for (let i = 0; i < 6; i++) {
        const p = document.getElementById(`cube-path-r${i}`);
        paths.push(p);
    }

    for (let i = pulses.length - 1; i >= 0; i--) {
        const pulse = pulses[i];
        const elapsed = now - pulse.startTime;
        const p = elapsed / pulse.duration;

        if (p >= 1) {
            pulses.splice(i, 1);
            continue;
        }

        if (p < 0.28) {
            const u = p / 0.28;
            const x = lx1 + (lx2 - lx1) * u;
            const y = ly1 + (ly2 - ly1) * u;
            drawGlowDot(animCtx, x, y, 5, 1);
        } else if (p < 0.44) {
            const u = (p - 0.28) / 0.16;
            const x = lx2 + (rx1 - lx2) * u;
            const y = ly2 + (ry1 - ly2) * u;
            drawGlowDot(animCtx, x, y, 6, 0.9);
        } else {
            const rawU = (p - 0.44) / 0.56;
            const u = Math.min(1, rawU * (2 - rawU));
            const fade = p > 0.9 ? (1 - p) / 0.1 : 1;
            paths.forEach((pathEl) => {
                if (pathEl && typeof pathEl.getTotalLength === "function") {
                    const totalLen = pathEl.getTotalLength();
                    const pt = pathEl.getPointAtLength(u * totalLen);
                    drawGlowDot(animCtx, pt.x, pt.y, 5, fade);
                }
            });
        }
    }

    animCtx.restore();

    if (pulses.length > 0) {
        animFrameId = requestAnimationFrame(animLoop);
    } else {
        animFrameId = null;
    }
}
