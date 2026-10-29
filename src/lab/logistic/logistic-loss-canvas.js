export function createLossCanvas(canvasElement) {
    const ctx = canvasElement.getContext("2d");

    return {
        render(history) {
            const w = canvasElement.width;
            const h = canvasElement.height;
            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = "#05070a";
            ctx.fillRect(0, 0, w, h);

            const padLeft = 46;
            const padRight = 16;
            const padTop = 20;
            const padBottom = 30;
            const plotW = w - padLeft - padRight;
            const plotH = h - padTop - padBottom;

            ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
            ctx.lineWidth = 1;
            for (let i = 0; i <= 4; i++) {
                const y = padTop + (plotH / 4) * i;
                ctx.beginPath();
                ctx.moveTo(padLeft, y);
                ctx.lineTo(padLeft + plotW, y);
                ctx.stroke();
            }

            if (!history || history.length === 0) {
                ctx.fillStyle = "#64748b";
                ctx.font = "12px 'Roboto Mono', monospace";
                ctx.textAlign = "center";
                ctx.fillText("Menunggu pelatihan...", w / 2, h / 2);
                ctx.textAlign = "start";
                return;
            }

            let minLoss = Infinity;
            let maxLoss = -Infinity;
            for (let i = 0; i < history.length; i++) {
                const v = history[i];
                if (v < minLoss) minLoss = v;
                if (v > maxLoss) maxLoss = v;
            }
            if (maxLoss === minLoss) {
                maxLoss += 0.5;
                minLoss = Math.max(0, minLoss - 0.5);
            }
            const range = maxLoss - minLoss;

            ctx.fillStyle = "#94a3b8";
            ctx.font = "10px 'Roboto Mono', monospace";
            ctx.textAlign = "right";
            for (let i = 0; i <= 4; i++) {
                const y = padTop + (plotH / 4) * i;
                const val = maxLoss - (range / 4) * i;
                ctx.fillText(val.toFixed(2), padLeft - 6, y + 3);
            }
            ctx.textAlign = "start";

            ctx.beginPath();
            const n = history.length;
            for (let i = 0; i < n; i++) {
                const fracX = n === 1 ? 0 : i / (n - 1);
                const px = padLeft + fracX * plotW;
                const fracY = (history[i] - minLoss) / range;
                const py = padTop + plotH - fracY * plotH;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.strokeStyle = "#4ade80";
            ctx.lineWidth = 2;
            ctx.stroke();

            const lastLoss = history[history.length - 1];
            const lastPx = padLeft + plotW;
            const lastFracY = (lastLoss - minLoss) / range;
            const lastPy = padTop + plotH - lastFracY * plotH;
            ctx.beginPath();
            ctx.arc(lastPx, lastPy, 4, 0, Math.PI * 2);
            ctx.fillStyle = "#4ade80";
            ctx.fill();

            ctx.fillStyle = "#cbd5e1";
            ctx.font = "11px 'Roboto Mono', monospace";
            ctx.fillText(`Epoch: ${history.length}  |  Loss: ${lastLoss.toFixed(4)}`, padLeft, padTop - 6);
            ctx.fillStyle = "#64748b";
            ctx.fillText("Iterasi", padLeft + plotW / 2 - 20, h - 8);
        }
    };
}
