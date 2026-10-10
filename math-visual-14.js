export function drawPythagoras(a, b, c) {
    const canvas = document.getElementById("math14-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    
    if (a == null || b == null || c == null) return;
    
    const padding = 60;
    const availW = W - 2 * padding;
    const availH = H - 2 * padding;
    
    const scaleX = availW / a;
    const scaleY = availH / b;
    const scale = Math.min(scaleX, scaleY);
    
    const drawW = a * scale;
    const drawH = b * scale;
    
    const startX = (W - drawW) / 2;
    const startY = (H + drawH) / 2;
    
    const C = {x: startX, y: startY};
    const B = {x: startX + drawW, y: startY};
    const A = {x: startX, y: startY - drawH};
    
    ctx.beginPath();
    ctx.moveTo(C.x, C.y);
    ctx.lineTo(B.x, B.y);
    ctx.lineTo(A.x, A.y);
    ctx.closePath();
    ctx.fillStyle = "rgba(79, 195, 247, 0.15)";
    ctx.fill();
    
    ctx.strokeStyle = "#4FC3F7";
    ctx.lineWidth = 3;
    ctx.stroke();
    
    const rectSize = Math.min(20, drawW/3, drawH/3);
    ctx.beginPath();
    ctx.moveTo(C.x, C.y - rectSize);
    ctx.lineTo(C.x + rectSize, C.y - rectSize);
    ctx.lineTo(C.x + rectSize, C.y);
    ctx.strokeStyle = "#4FC3F7";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.font = "bold 16px 'Google Sans', sans-serif";
    ctx.fillStyle = "#E0E0E0";
    ctx.textBaseline = "middle";
    
    ctx.textAlign = "center";
    let textA = Number.isInteger(a) ? a.toString() : a.toFixed(2);
    ctx.fillText(`a = ${textA}`, C.x + drawW/2, C.y + 25);
    
    ctx.textAlign = "right";
    let textB = Number.isInteger(b) ? b.toString() : b.toFixed(2);
    ctx.fillText(`b = ${textB}`, C.x - 15, C.y - drawH/2);
    
    ctx.save();
    const midX = (A.x + B.x) / 2;
    const midY = (A.y + B.y) / 2;
    const angle = Math.atan2(B.y - A.y, B.x - A.x);
    ctx.translate(midX, midY);
    ctx.rotate(angle);
    ctx.textAlign = "center";
    let textC = Number.isInteger(c) ? c.toString() : c.toFixed(2);
    ctx.fillStyle = "#FFCA28"; 
    ctx.fillText(`c = ${textC}`, 0, -15);
    ctx.restore();
}

export function clearPythagoras() {
    const canvas = document.getElementById("math14-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
