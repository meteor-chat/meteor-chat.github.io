export function drawObjectiveCurve(x1, x2) {
    const canvas = document.getElementById("math2-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    if (isNaN(x1) || isNaN(x2)) return;
    
    const hFunc = (x) => Math.pow(x, 3) + (Math.pow(x2, 2) / 3);
    const span = Math.max(Math.abs(x1) * 1.5, 5);
    const minX = x1 - span;
    const maxX = x1 + span;
    
    let points = [];
    let minY = Infinity;
    let maxY = -Infinity;
    const steps = 200;
    
    for (let i = 0; i <= steps; i++) {
        const x = minX + (maxX - minX) * (i / steps);
        const y = hFunc(x);
        points.push({x, y});
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    }
    
    const ySpan = Math.max(maxY - minY, 1);
    let finalMinY = minY - ySpan * 0.2;
    let finalMaxY = maxY + ySpan * 0.2;
    if (finalMinY > 0 && finalMinY < ySpan * 0.5) finalMinY = 0;
    if (finalMaxY < 0 && finalMaxY > -ySpan * 0.5) finalMaxY = 0;
    
    const px = (x) => ((x - minX) / (maxX - minX)) * W;
    const py = (y) => H - ((y - finalMinY) / (finalMaxY - finalMinY)) * H;
    
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 1.5;
    if (minX <= 0 && maxX >= 0) {
        ctx.beginPath();
        ctx.moveTo(px(0), 0);
        ctx.lineTo(px(0), H);
        ctx.stroke();
    }
    if (finalMinY <= 0 && finalMaxY >= 0) {
        ctx.beginPath();
        ctx.moveTo(0, py(0));
        ctx.lineTo(W, py(0));
        ctx.stroke();
    }
    
    ctx.beginPath();
    ctx.strokeStyle = "#4FC3F7";
    ctx.lineWidth = 2.5;
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (i === 0) ctx.moveTo(px(p.x), py(p.y));
        else ctx.lineTo(px(p.x), py(p.y));
    }
    ctx.stroke();
    
    const actualY = hFunc(x1);
    ctx.beginPath();
    ctx.strokeStyle = "#FFCA28";
    ctx.setLineDash([5, 5]);
    ctx.moveTo(px(x1), py(0));
    ctx.lineTo(px(x1), py(actualY));
    ctx.lineTo(px(0), py(actualY));
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.beginPath();
    ctx.arc(px(x1), py(actualY), 6, 0, Math.PI * 2);
    ctx.fillStyle = "#FFCA28";
    ctx.fill();
    ctx.strokeStyle = "#FFF";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = "#E0E0E0";
    ctx.font = "14px 'Google Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(`x\u2081 = ${x1}`, px(x1), py(0) + 5);
    
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`h = ${actualY.toFixed(2)}`, px(0) + 5, py(actualY) - 15);
}

export function drawFitnessCurve(h, a) {
    const canvas = document.getElementById("math3-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    if (isNaN(h) || isNaN(a)) return;
    
    const fFunc = (x) => 1 / (x + a);
    const asymptote = -a;
    const minX = asymptote > h ? h - 5 : Math.max(asymptote + 0.1, h - 5);
    const maxX = Math.max(h + 5, asymptote + 10);
    
    let points = [];
    let minY = Infinity;
    let maxY = -Infinity;
    const steps = 200;
    
    for (let i = 0; i <= steps; i++) {
        const x = minX + (maxX - minX) * (i / steps);
        if (Math.abs(x - asymptote) < 0.05) continue;
        const y = fFunc(x);
        if (isFinite(y)) {
            points.push({x, y});
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
    }
    
    if (maxY > 10) maxY = 10;
    const ySpan = Math.max(maxY - Math.min(minY, 0), 1);
    let finalMinY = Math.min(minY, 0) - ySpan * 0.1;
    let finalMaxY = maxY + ySpan * 0.1;
    
    const px = (x) => ((x - minX) / (maxX - minX)) * W;
    const py = (y) => H - ((y - finalMinY) / (finalMaxY - finalMinY)) * H;
    
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 1.5;
    if (minX <= 0 && maxX >= 0) {
        ctx.beginPath();
        ctx.moveTo(px(0), 0);
        ctx.lineTo(px(0), H);
        ctx.stroke();
    }
    if (finalMinY <= 0 && finalMaxY >= 0) {
        ctx.beginPath();
        ctx.moveTo(0, py(0));
        ctx.lineTo(W, py(0));
        ctx.stroke();
    }
    
    ctx.beginPath();
    ctx.strokeStyle = "#4FC3F7";
    ctx.lineWidth = 2.5;
    let first = true;
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (p.y > finalMaxY * 2 || p.y < finalMinY * 2) continue;
        if (first) {
            ctx.moveTo(px(p.x), py(p.y));
            first = false;
        } else {
            ctx.lineTo(px(p.x), py(p.y));
        }
    }
    ctx.stroke();
    
    if (minX <= asymptote && maxX >= asymptote) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 82, 82, 0.5)";
        ctx.setLineDash([4, 4]);
        ctx.moveTo(px(asymptote), 0);
        ctx.lineTo(px(asymptote), H);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = "rgba(255, 82, 82, 0.8)";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("Asimtot h = -a", px(asymptote) + 5, 20);
    }
    
    const actualY = fFunc(h);
    ctx.beginPath();
    ctx.strokeStyle = "#FFCA28";
    ctx.setLineDash([5, 5]);
    ctx.moveTo(px(h), py(0));
    ctx.lineTo(px(h), py(actualY));
    ctx.lineTo(px(0), py(actualY));
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.beginPath();
    ctx.arc(px(h), py(actualY), 6, 0, Math.PI * 2);
    ctx.fillStyle = "#FFCA28";
    ctx.fill();
    ctx.strokeStyle = "#FFF";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = "rgba(79, 195, 247, 0.8)";
    ctx.font = "italic 13px 'Google Sans', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("\u2191 Puncak Fitness", px(minX + (maxX-minX)*0.15), py(finalMaxY * 0.9));
    
    ctx.fillStyle = "#E0E0E0";
    ctx.font = "14px 'Google Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(`h = ${h.toFixed(2)}`, px(h), py(0) + 5);
    
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`Fit = ${actualY.toFixed(3)}`, px(0) + 5, py(actualY) - 15);
}

export function clearVisual2() {
    const canvas = document.getElementById("math2-canvas");
    if(canvas) canvas.getContext("2d").clearRect(0,0,canvas.width,canvas.height);
}

export function clearVisual3() {
    const canvas = document.getElementById("math3-canvas");
    if(canvas) canvas.getContext("2d").clearRect(0,0,canvas.width,canvas.height);
}
