function lerpColor(c1, c2, t) {
    const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
    const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
    const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
    return `rgb(${r},${g},${b})`;
}

const CYAN_RGB = [0, 230, 255];
const MAGENTA_RGB = [217, 70, 239];
const JAM_RGB = [239, 68, 68];

export function renderRoom(ctx, sim, vp, title, options = {}) {
    const { x, y, width, height } = vp;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();

    ctx.fillStyle = "#070d18";
    ctx.fillRect(x, y, width, height);

    const worldW = sim.config.roomWidth + 2.0;
    const worldH = sim.config.roomLength + sim.config.doorDepth + 2.0;
    const scale = Math.min(width / worldW, height / worldH);
    const cx = x + width * 0.5;
    const cy = y + height * 0.22;

    const toScreen = (wx, wy) => [cx + wx * scale, cy + wy * scale];

    ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
    ctx.lineWidth = 1;
    for (let gx = -4; gx <= 4; gx += 1) {
        const [sx1, sy1] = toScreen(gx, -sim.config.doorDepth);
        const [sx2, sy2] = toScreen(gx, sim.config.roomLength);
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx2, sy2);
        ctx.stroke();
    }

    const halfW = sim.config.roomWidth * 0.5;
    const doorHalf = sim.config.doorWidth * 0.5;
    const rLen = sim.config.roomLength;
    const dDep = sim.config.doorDepth;

    const [exitX1, exitY1] = toScreen(-doorHalf, -dDep);
    const [exitX2, exitY2] = toScreen(doorHalf, 0);
    ctx.fillStyle = "rgba(16, 185, 129, 0.06)";
    ctx.fillRect(exitX1, exitY1, exitX2 - exitX1, exitY2 - exitY1);

    ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(exitX1, exitY1);
    ctx.lineTo(exitX2, exitY1);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = Math.max(2, scale * 0.12);
    ctx.lineCap = "round";

    const drawWall = (wx1, wy1, wx2, wy2) => {
        const [sx1, sy1] = toScreen(wx1, wy1);
        const [sx2, sy2] = toScreen(wx2, wy2);
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx2, sy2);
        ctx.stroke();
    };

    drawWall(-halfW, 0, -doorHalf, 0);
    drawWall(doorHalf, 0, halfW, 0);
    drawWall(-halfW, 0, -halfW, rLen);
    drawWall(halfW, 0, halfW, rLen);
    drawWall(-halfW, rLen, halfW, rLen);

    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = Math.max(1.5, scale * 0.08);
    drawWall(-doorHalf, 0, -doorHalf, -dDep);
    drawWall(doorHalf, 0, doorHalf, -dDep);

    const alarmGlow = Math.sin(sim.time * 8) > 0 ? 1 : 0.2;
    const [al1x, al1y] = toScreen(-doorHalf - 0.25, 0);
    const [al2x, al2y] = toScreen(doorHalf + 0.25, 0);

    ctx.fillStyle = `rgba(239, 68, 68, ${0.4 + alarmGlow * 0.5})`;
    ctx.beginPath();
    ctx.arc(al1x, al1y, 5 + alarmGlow * 3, 0, Math.PI * 2);
    ctx.arc(al2x, al2y, 5 + alarmGlow * 3, 0, Math.PI * 2);
    ctx.fill();

    if (sim.column.enabled) {
        const [colX, colY] = toScreen(sim.column.x, sim.column.y);
        const colR = sim.column.r * scale;

        ctx.fillStyle = "rgba(245, 158, 11, 0.18)";
        ctx.beginPath();
        ctx.arc(colX, colY, colR + 6, 0, Math.PI * 2);
        ctx.fill();

        const grad = ctx.createRadialGradient(colX - colR * 0.3, colY - colR * 0.3, colR * 0.1, colX, colY, colR);
        grad.addColorStop(0, "#fde68a");
        grad.addColorStop(0.5, "#f59e0b");
        grad.addColorStop(1, "#b45309");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(colX, colY, colR, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#fef3c7";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${Math.max(10, scale * 0.28)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("40%", colX, colY);
    }

    for (const a of sim.agents) {
        if (a.evacuated && a.y < -dDep - 1.5) continue;
        const [sx, sy] = toScreen(a.x, a.y);
        const sr = a.r * scale;

        const pressRatio = Math.min(1, Math.max(0, a.pressure / 3000));
        const baseColor = a.color === "cyan" ? CYAN_RGB : MAGENTA_RGB;
        const bodyColor = lerpColor(baseColor, JAM_RGB, pressRatio);

        let angle = Math.atan2(a.vy, a.vx);
        if (Math.hypot(a.vx, a.vy) < 0.1) {
            angle = -Math.PI / 2;
        }

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(angle);

        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(0, 0, sr, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.beginPath();
        ctx.arc(sr * 0.35, 0, sr * 0.42, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(0, -sr * 0.75, sr * 0.4, 0, Math.PI * 2);
        ctx.arc(0, sr * 0.75, sr * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    renderOverlay(ctx, sim, vp, title, options);
    ctx.restore();
}

function renderOverlay(ctx, sim, vp, title, options) {
    const { x, y, width } = vp;
    const padding = 14;

    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
    ctx.lineWidth = 1;
    const barH = 58;
    ctx.beginPath();
    ctx.roundRect(x + padding, y + padding, width - padding * 2, barH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(title, x + padding + 12, y + padding + 10);

    const isJammed = sim.jammed;
    const statusText = isJammed ? "JAMMED (ARCH LOCK)" : "FLOWING";
    const statusColor = isJammed ? "#ef4444" : "#10b981";
    const statusBg = isJammed ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)";

    ctx.font = "bold 11px system-ui, sans-serif";
    const stW = ctx.measureText(statusText).width;
    const stX = x + width - padding - 16 - stW - 14;
    const stY = y + padding + 9;

    ctx.fillStyle = statusBg;
    ctx.beginPath();
    ctx.roundRect(stX, stY, stW + 14, 20, 4);
    ctx.fill();

    ctx.fillStyle = statusColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(statusText, stX + (stW + 14) * 0.5, stY + 10);

    const evac = sim.evacuatedCount;
    const total = sim.agents.length;
    const rate = (sim.recentExits.length / 2.0).toFixed(1);
    ctx.font = "11px system-ui, monospace";
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`Evacuated: ${evac}/${total} | Flow: ${rate}/s | Jam Time: ${sim.jamTime.toFixed(1)}s`, x + padding + 12, y + padding + 34);

    if (options.label) {
        ctx.fillStyle = "#38bdf8";
        ctx.font = "10px system-ui, sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(options.label, x + width - padding - 12, y + padding + 34);
    }
}

export function renderSimulation(ctx, width, height, state) {
    ctx.clearRect(0, 0, width, height);
    if (state.mode === "dual") {
        const gap = 4;
        const w = (width - gap) * 0.5;
        const vpA = { x: 0, y: 0, width: w, height };
        const vpB = { x: w + gap, y: 0, width: w, height };
        renderRoom(ctx, state.simA, vpA, "Room A: Without Column", { label: "No Obstacle" });
        renderRoom(ctx, state.simB, vpB, "Room B: With Column", { label: "Off-center Column" });
    } else {
        const vp = { x: 0, y: 0, width, height };
        const title = state.simA.column.enabled ? "Room: With Column" : "Room: Without Column";
        renderRoom(ctx, state.simA, vp, title, {});
    }
}
