export function clearVisual10() {
    const canvas = document.getElementById("math10-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export function clearVisual11() {
    const canvas = document.getElementById("math11-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export function drawDistributionCurve(canvasId, data, mean, sigma, isSample) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    if (!data || data.length === 0 || isNaN(mean)) return;

    const padLeft = 45;
    const padRight = 45;
    const padTop = 45;
    const padBottom = 60;
    const baseline = H - padBottom;

    if (isSample && data.length <= 1) {
        ctx.textAlign = "center";
        ctx.fillStyle = "#aaa";
        ctx.font = "13px sans-serif";
        ctx.fillText("Butuh minimal 2 data untuk distribusi sampel", W / 2, H / 2);
        return;
    }

    if (sigma <= 0.00001) {
        ctx.beginPath();
        ctx.moveTo(padLeft, baseline);
        ctx.lineTo(W - padRight, baseline);
        ctx.strokeStyle = "#555";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const midX = W / 2;
        ctx.beginPath();
        ctx.moveTo(midX, baseline);
        ctx.lineTo(midX, padTop + 20);
        ctx.strokeStyle = "#FFB74D";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(midX, baseline, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#FF8A65";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.fillStyle = "#fff";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText(`${isSample ? "x̄" : "μ"} = ${mean.toFixed(2)} (σ = 0)`, midX, padTop + 10);
        return;
    }

    let xMin = mean - 3.5 * sigma;
    let xMax = mean + 3.5 * sigma;
    data.forEach(val => {
        if (val < xMin) xMin = val - 0.5 * sigma;
        if (val > xMax) xMax = val + 0.5 * sigma;
    });

    const span = Math.max(xMax - xMin, 0.0001);
    const toPx = (x) => padLeft + ((x - xMin) / span) * (W - padLeft - padRight);

    const maxDensity = 1 / (sigma * Math.sqrt(2 * Math.PI));
    const toPy = (density) => baseline - (density / maxDensity) * (baseline - padTop);

    const gaussian = (x) => {
        const z = (x - mean) / sigma;
        return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
    };

    const xMinus1 = mean - sigma;
    const xPlus1 = mean + sigma;

    ctx.beginPath();
    ctx.moveTo(toPx(xMinus1), baseline);
    const shadeSteps = 80;
    for (let i = 0; i <= shadeSteps; i++) {
        const currX = xMinus1 + (xPlus1 - xMinus1) * (i / shadeSteps);
        ctx.lineTo(toPx(currX), toPy(gaussian(currX)));
    }
    ctx.lineTo(toPx(xPlus1), baseline);
    ctx.closePath();
    ctx.fillStyle = isSample ? "rgba(129, 199, 132, 0.22)" : "rgba(79, 195, 247, 0.22)";
    ctx.fill();

    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = isSample ? "rgba(129, 199, 132, 0.8)" : "rgba(79, 195, 247, 0.8)";

    ctx.beginPath();
    ctx.moveTo(toPx(xMinus1), baseline);
    ctx.lineTo(toPx(xMinus1), toPy(gaussian(xMinus1)));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toPx(xPlus1), baseline);
    ctx.lineTo(toPx(xPlus1), toPy(gaussian(xPlus1)));
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    const curveSteps = 160;
    for (let i = 0; i <= curveSteps; i++) {
        const currX = xMin + span * (i / curveSteps);
        const px = toPx(currX);
        const py = toPy(gaussian(currX));
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = isSample ? "#81C784" : "#4FC3F7";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toPx(mean), baseline);
    ctx.lineTo(toPx(mean), toPy(gaussian(mean)));
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#FFB74D";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(toPx(mean), toPy(gaussian(mean)), 4.5, 0, Math.PI * 2);
    ctx.fillStyle = "#FFB74D";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(padLeft - 10, baseline);
    ctx.lineTo(W - padRight + 10, baseline);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#555";
    ctx.stroke();

    data.forEach(val => {
        const px = toPx(val);
        ctx.beginPath();
        ctx.arc(px, baseline, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#FF8A65";
        ctx.fill();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = "#fff";
        ctx.stroke();
    });

    ctx.textAlign = "center";
    ctx.font = "bold 11px sans-serif";
    ctx.fillStyle = "#FFB74D";
    ctx.fillText(`${isSample ? "x̄" : "μ"} = ${mean.toFixed(2)}`, toPx(mean), baseline + 18);

    ctx.font = "10px sans-serif";
    ctx.fillStyle = isSample ? "#81C784" : "#4FC3F7";
    ctx.fillText(`-1${isSample ? "s" : "σ"}`, toPx(xMinus1), baseline + 18);
    ctx.fillText(xMinus1.toFixed(2), toPx(xMinus1), baseline + 32);

    ctx.fillText(`+1${isSample ? "s" : "σ"}`, toPx(xPlus1), baseline + 18);
    ctx.fillText(xPlus1.toFixed(2), toPx(xPlus1), baseline + 32);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px sans-serif";
    const headerTitle = isSample
        ? `Kurva Normal Sampel (s = ${sigma.toFixed(3)})`
        : `Kurva Normal Populasi (σ = ${sigma.toFixed(3)})`;
    ctx.fillText(headerTitle, W / 2, 22);

    ctx.font = "10px sans-serif";
    ctx.fillStyle = "#aaa";
    ctx.fillText(`Rentang ±1${isSample ? "s" : "σ"}: [${xMinus1.toFixed(2)}, ${xPlus1.toFixed(2)}] (68.2%)`, W / 2, 36);
}
