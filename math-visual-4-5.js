function getColor(index, total) {
    const palette = [
        "#4FC3F7",
        "#81C784",
        "#FFB74D",
        "#E57373",
        "#BA68C8",
        "#4DB6AC",
        "#FFF176",
        "#F06292"
    ];
    if (index < palette.length) return palette[index];
    const hue = Math.floor((index * 360) / Math.max(total, 1));
    return `hsl(${hue}, 70%, 65%)`;
}

export function clearWheel4() {
    const canvas = document.getElementById("math4-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export function clearWheel5() {
    const canvas = document.getElementById("math5-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export function drawRouletteWheel4(fitnessValues, probabilities) {
    const canvas = document.getElementById("math4-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    
    if (!probabilities || probabilities.length === 0) return;
    const totalP = probabilities.reduce((acc, v) => acc + v, 0);
    if (totalP <= 0) return;
    
    const cx = W / 2;
    const cy = H / 2;
    const R = 155;
    let currentAngle = -Math.PI / 2;
    
    for (let i = 0; i < probabilities.length; i++) {
        const p = probabilities[i];
        if (p <= 0) continue;
        const sliceAngle = (p / totalP) * Math.PI * 2;
        const endAngle = currentAngle + sliceAngle;
        const color = getColor(i, probabilities.length);
        
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, currentAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#121212";
        ctx.stroke();
        
        if (sliceAngle > 0.15) {
            const midAngle = currentAngle + sliceAngle / 2;
            const textR = R * 0.65;
            const tx = cx + Math.cos(midAngle) * textR;
            const ty = cy + Math.sin(midAngle) * textR;
            
            ctx.save();
            ctx.translate(tx, ty);
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#111";
            ctx.font = "bold 12px sans-serif";
            ctx.fillText(`I${i + 1}`, 0, -6);
            ctx.font = "10px sans-serif";
            ctx.fillText(`${(p * 100).toFixed(1)}%`, 0, 8);
            ctx.restore();
        }
        
        currentAngle = endAngle;
    }
    
    ctx.beginPath();
    ctx.arc(cx, cy, 38, 0, Math.PI * 2);
    ctx.fillStyle = "#1e1e1e";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#444";
    ctx.stroke();
    
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("RODA", cx, cy - 6);
    ctx.font = "10px sans-serif";
    ctx.fillStyle = "#aaa";
    ctx.fillText("ROLET", cx, cy + 8);
}

export function drawRouletteWheel5(probabilities, rows, r, selectedParent) {
    const canvas = document.getElementById("math5-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    
    if (!probabilities || probabilities.length === 0) return;
    const totalP = probabilities.reduce((acc, v) => acc + v, 0);
    if (totalP <= 0) return;
    
    const cx = W / 2;
    const cy = H / 2;
    const R = 150;
    let currentAngle = -Math.PI / 2;
    
    for (let i = 0; i < probabilities.length; i++) {
        const p = probabilities[i];
        if (p <= 0) continue;
        const sliceAngle = (p / Math.max(totalP, 1)) * Math.PI * 2;
        const endAngle = currentAngle + sliceAngle;
        const color = getColor(i, probabilities.length);
        const isSelected = selectedParent === (i + 1);
        
        let ox = 0;
        let oy = 0;
        if (isSelected) {
            const midA = currentAngle + sliceAngle / 2;
            ox = Math.cos(midA) * 10;
            oy = Math.sin(midA) * 10;
        }
        
        ctx.beginPath();
        ctx.moveTo(cx + ox, cy + oy);
        ctx.arc(cx + ox, cy + oy, R, currentAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.strokeStyle = isSelected ? "#fff" : "#121212";
        ctx.stroke();
        
        if (sliceAngle > 0.15) {
            const midAngle = currentAngle + sliceAngle / 2;
            const textR = R * 0.65;
            const tx = cx + ox + Math.cos(midAngle) * textR;
            const ty = cy + oy + Math.sin(midAngle) * textR;
            
            ctx.save();
            ctx.translate(tx, ty);
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#111";
            ctx.font = "bold 12px sans-serif";
            ctx.fillText(`I${i + 1}`, 0, -6);
            ctx.font = "10px sans-serif";
            ctx.fillText(`C: ${rows[i] ? rows[i].cumulative.toFixed(3) : ''}`, 0, 8);
            ctx.restore();
        }
        
        currentAngle = endAngle;
    }
    
    if (totalP < 0.999) {
        const remainingAngle = (Math.PI * 2) - (currentAngle - (-Math.PI / 2));
        if (remainingAngle > 0.01) {
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, R, currentAngle, currentAngle + remainingAngle);
            ctx.closePath();
            ctx.fillStyle = "#2a2a2a";
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = "#444";
            ctx.stroke();
        }
    }
    
    ctx.beginPath();
    ctx.arc(cx, cy, 38, 0, Math.PI * 2);
    ctx.fillStyle = "#1e1e1e";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#444";
    ctx.stroke();
    
    if (r !== null && !isNaN(r) && r >= 0 && r <= 1) {
        const rAngle = -Math.PI / 2 + r * Math.PI * 2;
        const needleLen = R + 12;
        const nx = cx + Math.cos(rAngle) * needleLen;
        const ny = cy + Math.sin(rAngle) * needleLen;
        
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(nx, ny);
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = "#FF5252";
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(nx, ny, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#FF5252";
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#fff";
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fillStyle = "#FF5252";
        ctx.fill();
        
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fff";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText(`r=${r}`, cx, cy - 6);
        ctx.fillStyle = selectedParent ? "#81C784" : "#aaa";
        ctx.font = "bold 9px sans-serif";
        ctx.fillText(selectedParent ? `I${selectedParent}` : "-", cx, cy + 8);
    } else {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fff";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText("RODA", cx, cy - 6);
        ctx.font = "10px sans-serif";
        ctx.fillStyle = "#aaa";
        ctx.fillText("ROLET", cx, cy + 8);
    }
}
