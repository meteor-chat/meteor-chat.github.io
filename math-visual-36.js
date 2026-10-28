import { formatMax3 } from "./math-format.js";

function getCanvasContext() {
    const canvas = document.getElementById("math36-canvas");
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    return { canvas, ctx };
}

export function clearVisual36() {
    const bundle = getCanvasContext();
    if (!bundle) return;
    const { canvas, ctx } = bundle;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function getTempTheme(c) {
    if (c <= 0) {
        return { color: "#38bdf8", glow: "rgba(56, 189, 248, 0.45)" };
    }
    if (c <= 25) {
        return { color: "#2dd4bf", glow: "rgba(45, 212, 191, 0.45)" };
    }
    if (c <= 40) {
        return { color: "#fbbf24", glow: "rgba(251, 191, 36, 0.45)" };
    }
    if (c <= 75) {
        return { color: "#fb923c", glow: "rgba(251, 146, 60, 0.45)" };
    }
    return { color: "#f87171", glow: "rgba(248, 113, 113, 0.45)" };
}

export function drawThermometers(c, r, f, k) {
    const bundle = getCanvasContext();
    if (!bundle) return;
    const { canvas, ctx } = bundle;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    const theme = getTempTheme(c);
    const u = c / 100;
    const freezeY = 230;
    const boilY = 90;
    const span = freezeY - boilY;
    let targetY = freezeY - u * span;
    if (targetY < 55) targetY = 55;
    if (targetY > 265) targetY = 265;

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);

    ctx.beginPath();
    ctx.moveTo(20, boilY);
    ctx.lineTo(W - 20, boilY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(20, freezeY);
    ctx.lineTo(W - 20, freezeY);
    ctx.stroke();

    ctx.restore();

    ctx.save();
    ctx.strokeStyle = theme.color;
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur = 8;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(22, targetY);
    ctx.lineTo(W - 22, targetY);
    ctx.stroke();
    ctx.restore();

    const scales = [
        { label: "°C", name: "Celcius", val: c, boil: "100°", freeze: "0°", x: 55, unit: "°C" },
        { label: "°R", name: "Reamur", val: r, boil: "80°", freeze: "0°", x: 150, unit: "°R" },
        { label: "°F", name: "Fahrenheit", val: f, boil: "212°", freeze: "32°", x: 245, unit: "°F" },
        { label: "K", name: "Kelvin", val: k, boil: "373.15", freeze: "273.15", x: 340, unit: "K" }
    ];

    const tubeWidth = 14;
    const tubeRadius = tubeWidth / 2;
    const tubeTop = 60;
    const tubeBottom = 262;
    const bulbCenterY = 280;
    const bulbRadius = 14;

    scales.forEach((scale) => {
        const x = scale.x;

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 15px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(scale.label, x, 24);

        ctx.fillStyle = theme.color;
        ctx.font = "bold 12px sans-serif";
        ctx.fillText(`${formatMax3(scale.val)} ${scale.unit}`, x, 42);

        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(scale.boil, x + 12, boilY + 3);
        ctx.fillText(scale.freeze, x + 12, freezeY + 3);

        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 7, boilY);
        ctx.lineTo(x + 10, boilY);
        ctx.moveTo(x + 7, freezeY);
        ctx.lineTo(x + 10, freezeY);
        ctx.stroke();

        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.arc(x, tubeTop + tubeRadius, tubeRadius, Math.PI, 0);
        ctx.lineTo(x + tubeRadius, tubeBottom);
        ctx.lineTo(x - tubeRadius, tubeBottom);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, bulbCenterY, bulbRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.save();
        ctx.fillStyle = theme.color;
        ctx.shadowColor = theme.glow;
        ctx.shadowBlur = 6;

        ctx.beginPath();
        ctx.arc(x, bulbCenterY, bulbRadius - 1.5, 0, Math.PI * 2);
        ctx.fill();

        const fillTop = Math.min(targetY, tubeBottom);
        const fillHeight = tubeBottom - fillTop + 4;
        if (fillHeight > 0) {
            ctx.beginPath();
            if (targetY <= tubeTop + tubeRadius) {
                ctx.arc(x, tubeTop + tubeRadius, tubeRadius - 1.5, Math.PI, 0);
                ctx.lineTo(x + tubeRadius - 1.5, tubeBottom);
                ctx.lineTo(x - tubeRadius + 1.5, tubeBottom);
            } else {
                ctx.rect(x - tubeRadius + 1.5, fillTop, tubeWidth - 3, fillHeight);
            }
            ctx.fill();
        }
        ctx.restore();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - tubeRadius + 3, tubeTop + 6);
        ctx.lineTo(x - tubeRadius + 3, tubeBottom - 4);
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(x, targetY, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
        ctx.font = "11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(scale.name, x, 314);
    });
}
