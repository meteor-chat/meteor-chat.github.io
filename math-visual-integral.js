export function drawIntegral(canvasId, fStr, a, b, mode) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    
    if (!fStr || isNaN(a) || typeof math === 'undefined') return;
    
    let actualB = isNaN(b) ? a + 4 : b;
    if (a === actualB) actualB = a + 4;
    
    let fNode;
    try {
        fNode = math.parse(fStr);
    } catch(e) {
        return;
    }
    
    const span = Math.abs(actualB - a);
    const margin = Math.max(span * 0.3, 1);
    const minX = Math.min(a, actualB) - margin;
    const maxX = Math.max(a, actualB) + margin;
    
    let points = [];
    let minY = Infinity;
    let maxY = -Infinity;
    const steps = 200;
    
    let transformedNode;
    try {
        transformedNode = fNode.transform(function (node) {
            if (node.isSymbolNode && node.name === 't') {
                return new math.SymbolNode('x');
            }
            return node;
        });
    } catch (e) {
        transformedNode = fNode;
    }
    
    for (let i = 0; i <= steps; i++) {
        const x = minX + (maxX - minX) * (i / steps);
        try {
            const y = transformedNode.evaluate({x: x});
            if (isFinite(y)) {
                points.push({x, y});
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        } catch (e) {}
    }
    
    if (points.length === 0) return;
    
    const ySpan = Math.max(maxY - minY, 1);
    let finalMinY = minY - ySpan * 0.2;
    let finalMaxY = maxY + ySpan * 0.2;
    
    if (finalMinY > 0) finalMinY = -ySpan * 0.1;
    if (finalMaxY < 0) finalMaxY = ySpan * 0.1;
    
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
    ctx.moveTo(px(a), py(0));
    
    let countAreaPoints = 0;
    
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (p.x >= Math.min(a, actualB) && p.x <= Math.max(a, actualB)) {
            ctx.lineTo(px(p.x), py(p.y));
            countAreaPoints++;
        }
    }
    ctx.lineTo(px(actualB), py(0));
    ctx.closePath();
    
    if (mode === "mean" && countAreaPoints > 0) {
        ctx.fillStyle = "rgba(79, 195, 247, 0.1)";
        ctx.fill();
    } else if (countAreaPoints > 0) {
        ctx.fillStyle = "rgba(79, 195, 247, 0.3)";
        ctx.fill();
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
    
    ctx.beginPath();
    ctx.strokeStyle = "#FFCA28";
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1.5;
    
    try {
        ctx.moveTo(px(a), py(0));
        let yA = transformedNode.evaluate({x: a});
        if(isFinite(yA)) ctx.lineTo(px(a), py(yA));
        
        if (mode !== "formula16") {
            ctx.moveTo(px(actualB), py(0));
            let yB = transformedNode.evaluate({x: actualB});
            if(isFinite(yB)) ctx.lineTo(px(actualB), py(yB));
        }
    } catch (e) {}
    ctx.stroke();
    ctx.setLineDash([]);
    
    if (mode === "mean" && countAreaPoints > 0) {
        const n = 1000;
        const h = (actualB - a) / n;
        try {
            let sum = transformedNode.evaluate({x: a}) + transformedNode.evaluate({x: actualB});
            for (let i = 1; i < n; i++) {
                const x = a + i * h;
                sum += (i % 2 === 0 ? 2 : 4) * transformedNode.evaluate({x: x});
            }
            const integral = (h / 3) * sum;
            const meanY = integral / (actualB - a);
            
            ctx.fillStyle = "rgba(255, 202, 40, 0.4)";
            const rectX = px(Math.min(a, actualB));
            const rectW = Math.abs(px(actualB) - px(a));
            const startY = py(0) < py(meanY) ? py(0) : py(meanY);
            const endY = py(0) > py(meanY) ? py(0) : py(meanY);
            const rectH = Math.abs(endY - startY);
            
            ctx.fillRect(rectX, startY, rectW, rectH);
            
            ctx.strokeStyle = "#FFCA28";
            ctx.lineWidth = 2;
            ctx.strokeRect(rectX, startY, rectW, rectH);
            
            ctx.fillStyle = "#FFCA28";
            ctx.font = "bold 14px 'Google Sans', sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(`f(c) = ${meanY.toFixed(2)}`, px((a + actualB)/2), startY - 10);
        } catch (e) {}
    }
    
    ctx.fillStyle = "#E0E0E0";
    ctx.font = "14px 'Google Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(`a=${a}`, px(a), py(0) + 5);
    if (mode !== "formula16") {
        ctx.fillText(`b=${actualB}`, px(actualB), py(0) + 5);
    } else {
        ctx.fillText(`x`, px(actualB), py(0) + 5);
    }
}

export function clearIntegral(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
