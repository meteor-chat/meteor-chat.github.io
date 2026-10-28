export function clearVisual12() {
    const canvas = document.getElementById("math12-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export function drawVennDiagram(pA, pBA, pB, pAB) {
    const canvas = document.getElementById("math12-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    if (isNaN(pA) || isNaN(pB) || isNaN(pBA) || isNaN(pAB) || pB <= 0) return;

    const pIntersection = pBA * pA;
    const ratio = Math.max(0, Math.min(pAB, 1));

    const cx = W / 2;
    const cy = H / 2 + 10;

    const boxX = 20;
    const boxY = 40;
    const boxW = W - 40;
    const boxH = H - 60;
    const radius = 10;

    ctx.beginPath();
    ctx.moveTo(boxX + radius, boxY);
    ctx.lineTo(boxX + boxW - radius, boxY);
    ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + radius);
    ctx.lineTo(boxX + boxW, boxY + boxH - radius);
    ctx.quadraticCurveTo(boxX + boxW, boxY + boxH, boxX + boxW - radius, boxY + boxH);
    ctx.lineTo(boxX + radius, boxY + boxH);
    ctx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - radius);
    ctx.lineTo(boxX, boxY + radius);
    ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
    ctx.closePath();
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#888";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("S (Semesta = 1.0)", boxX + 12, boxY + 22);

    const baseR = 85;
    const rA = Math.max(50, Math.min(105, baseR * Math.sqrt(Math.max(pA, 0.15) / 0.5)));
    const rB = Math.max(50, Math.min(105, baseR * Math.sqrt(Math.max(pB, 0.15) / 0.5)));

    const minD = Math.abs(rA - rB) + 20;
    const maxD = rA + rB;
    const d = maxD - ratio * (maxD - minD);

    const cAx = cx - d / 2;
    const cBx = cx + d / 2;

    ctx.beginPath();
    ctx.arc(cAx, cy, rA, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(79, 195, 247, 0.3)";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#4FC3F7";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cBx, cy, rB, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 183, 77, 0.3)";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#FFB74D";
    ctx.stroke();

    if (d < maxD) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cAx, cy, rA, 0, Math.PI * 2);
        ctx.clip();
        ctx.beginPath();
        ctx.arc(cBx, cy, rB, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = "rgba(129, 199, 132, 0.45)";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#81C784";
        ctx.stroke();
        ctx.restore();
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#4FC3F7";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("A", cAx - rA * 0.45, cy - rA * 0.3);
    ctx.font = "11px sans-serif";
    ctx.fillText(`P(A)=${pA.toFixed(2)}`, cAx - rA * 0.45, cy - rA * 0.3 + 16);

    ctx.fillStyle = "#FFB74D";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("B", cBx + rB * 0.45, cy - rB * 0.3);
    ctx.font = "11px sans-serif";
    ctx.fillText(`P(B)=${pB.toFixed(2)}`, cBx + rB * 0.45, cy - rB * 0.3 + 16);

    if (d < maxD) {
        ctx.fillStyle = "#fff";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText("A ∩ B", cx, cy - 6);
        ctx.font = "10px sans-serif";
        ctx.fillStyle = "#81C784";
        ctx.fillText(pIntersection.toFixed(3), cx, cy + 10);
    }

    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(`P(A|B) = ${(pAB * 100).toFixed(2)}%`, cx, 24);

    ctx.fillStyle = "#aaa";
    ctx.font = "10px sans-serif";
    ctx.fillText(`Irisan: P(A ∩ B) = ${pIntersection.toFixed(4)}`, cx, boxY + boxH - 12);
}
