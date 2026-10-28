export function setupCanvasDpi(canvas, cssWidth, cssHeight) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    return ctx;
}

export function drawStateRing(ctx, width, height, m, sequence, currentIndex) {
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.38;
    const numM = Math.max(Number(m) || 1, 1);

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 2;
    ctx.stroke();

    const maxNodes = Math.min(numM, 40);
    const stepAngle = (Math.PI * 2) / maxNodes;

    const getNodePos = (val) => {
        const norm = (Number(val) % numM) / numM;
        const angle = norm * Math.PI * 2 - Math.PI / 2;
        return {
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle)
        };
    };

    if (numM <= 40) {
        for (let i = 0; i < maxNodes; i++) {
            const angle = i * stepAngle - Math.PI / 2;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);

            ctx.beginPath();
            ctx.arc(x, y, 9, 0, Math.PI * 2);
            ctx.fillStyle = "#111827";
            ctx.fill();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = "#94a3b8";
            ctx.font = "10px 'Roboto Mono', monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(String(i), x, y);
        }
    }

    if (sequence.length > 1) {
        ctx.beginPath();
        const limit = Math.min(sequence.length, currentIndex + 1);
        for (let i = 0; i < limit - 1; i++) {
            const p1 = getNodePos(sequence[i]);
            const p2 = getNodePos(sequence[i + 1]);

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            const midX = (p1.x + p2.x) / 2 + (cx - (p1.x + p2.x) / 2) * 0.25;
            const midY = (p1.y + p2.y) / 2 + (cy - (p1.y + p2.y) / 2) * 0.25;
            ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
            ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }

    if (sequence.length > 0 && currentIndex >= 0) {
        const currVal = sequence[Math.min(currentIndex, sequence.length - 1)];
        const curPos = getNodePos(currVal);

        ctx.beginPath();
        ctx.arc(curPos.x, curPos.y, 16, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(34, 197, 94, 0.25)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(curPos.x, curPos.y, 11, 0, Math.PI * 2);
        ctx.fillStyle = "#22c55e";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#000000";
        ctx.font = "bold 11px 'Roboto Mono', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(currVal), curPos.x, curPos.y);

        ctx.fillStyle = "#ffffff";
        ctx.font = "13px 'Google Sans', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`State Saat Ini (Xₙ): ${currVal}`, cx, cy - 8);

        ctx.fillStyle = "#38bdf8";
        ctx.font = "12px 'Roboto Mono', monospace";
        ctx.fillText(`Langkah: ${currentIndex + 1} / Periode: ${numM}`, cx, cy + 14);
    }
}

export function drawLatticePlot(ctx, width, height, sequence, m) {
    ctx.clearRect(0, 0, width, height);

    const pad = 36;
    const plotW = width - pad * 2;
    const plotH = height - pad * 2;
    const numM = Math.max(Number(m) || 1, 1);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
        const ratio = i / 4;
        const x = pad + plotW * ratio;
        const y = pad + plotH * ratio;

        ctx.beginPath();
        ctx.moveTo(x, pad);
        ctx.lineTo(x, pad + plotH);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(pad, y);
        ctx.lineTo(pad + plotW, y);
        ctx.stroke();
    }

    ctx.fillStyle = "#64748b";
    ctx.font = "10px 'Roboto Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("0.0", pad, pad + plotH + 16);
    ctx.fillText("0.5", pad + plotW * 0.5, pad + plotH + 16);
    ctx.fillText("1.0 (Xₙ)", pad + plotW, pad + plotH + 16);

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText("1.0", pad - 8, pad);
    ctx.fillText("0.5", pad - 8, pad + plotH * 0.5);
    ctx.fillText("0.0 (Xₙ₊₁)", pad - 8, pad + plotH);

    if (!sequence || sequence.length < 2) return;

    for (let i = 0; i < sequence.length - 1; i++) {
        const u1 = sequence[i] / numM;
        const u2 = sequence[i + 1] / numM;

        const px = pad + u1 * plotW;
        const py = pad + plotH - u2 * plotH;

        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(56, 189, 248, 0.75)";
        ctx.fill();
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 0.8;
        ctx.stroke();
    }
}
