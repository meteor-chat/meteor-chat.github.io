function interpolateRgb(c1, c2, factor) {
    const r = Math.round(c1[0] + (c2[0] - c1[0]) * factor);
    const g = Math.round(c1[1] + (c2[1] - c1[1]) * factor);
    const b = Math.round(c1[2] + (c2[2] - c1[2]) * factor);
    return `rgb(${r}, ${g}, ${b})`;
}

export function getHeatmapColor(t) {
    const clamped = Math.max(0, Math.min(1, t));
    const stops = [
        { t: 0.00, rgb: [49, 46, 129] },
        { t: 0.25, rgb: [124, 58, 237] },
        { t: 0.50, rgb: [219, 39, 119] },
        { t: 0.75, rgb: [249, 115, 22] },
        { t: 1.00, rgb: [250, 204, 21] }
    ];

    for (let i = 0; i < stops.length - 1; i++) {
        if (clamped >= stops[i].t && clamped <= stops[i + 1].t) {
            const span = stops[i + 1].t - stops[i].t;
            const factor = (clamped - stops[i].t) / span;
            return interpolateRgb(stops[i].rgb, stops[i + 1].rgb, factor);
        }
    }
    return "rgb(250, 204, 21)";
}

export function toCanvasCoords(pos, canvas) {
    const scaleX = canvas.width / 600;
    const scaleY = canvas.height / 400;
    return {
        x: pos.x * scaleX,
        y: pos.y * scaleY
    };
}

export function toLogicalCoords(pt, canvas) {
    const scaleX = canvas.width / 600;
    const scaleY = canvas.height / 400;
    return {
        x: pt.x / scaleX,
        y: pt.y / scaleY
    };
}

export function getNodeAt(graph, pt, canvas) {
    const logical = toLogicalCoords(pt, canvas);
    for (const u of graph.nodes) {
        const p = graph.positions[u];
        if (!p) continue;
        const dx = p.x - logical.x;
        const dy = p.y - logical.y;
        if (Math.hypot(dx, dy) <= 18) {
            return u;
        }
    }
    return null;
}

export function renderGraph(canvas, ctx, state) {
    const {
        graph,
        scores,
        maxScore,
        selectedA,
        selectedB,
        inspectedNode,
        shortestPaths,
        heatmapEnabled,
        draggingNode
    } = state;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const activeEdges = new Set();
    if (shortestPaths && shortestPaths.length > 0) {
        shortestPaths.forEach(path => {
            for (let i = 0; i < path.length - 1; i++) {
                const u = path[i];
                const v = path[i + 1];
                activeEdges.add(`${Math.min(u, v)}-${Math.max(u, v)}`);
            }
        });
    }

    graph.edges.forEach(([u, v]) => {
        const p1 = graph.positions[u];
        const p2 = graph.positions[v];
        if (!p1 || !p2) return;

        const c1 = toCanvasCoords(p1, canvas);
        const c2 = toCanvasCoords(p2, canvas);
        const edgeKey = `${Math.min(u, v)}-${Math.max(u, v)}`;
        const isActive = activeEdges.has(edgeKey);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(c1.x, c1.y);
        ctx.lineTo(c2.x, c2.y);

        if (isActive) {
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 3.5;
            ctx.shadowColor = "rgba(56, 189, 248, 0.8)";
            ctx.shadowBlur = 8;
        } else {
            ctx.strokeStyle = "rgba(100, 116, 139, 0.35)";
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 0;
        }
        ctx.stroke();
        ctx.restore();
    });

    graph.nodes.forEach(u => {
        const pos = graph.positions[u];
        if (!pos) return;
        const c = toCanvasCoords(pos, canvas);
        const score = scores[u] || 0;
        const norm = maxScore > 0 ? score / maxScore : 0;
        const radius = heatmapEnabled ? 11 + Math.sqrt(norm) * 12 : 13;

        ctx.save();

        if (heatmapEnabled && norm >= 0.5) {
            ctx.beginPath();
            ctx.arc(c.x, c.y, radius + 4, 0, Math.PI * 2);
            ctx.fillStyle = norm >= 0.8 ? "rgba(250, 204, 21, 0.25)" : "rgba(249, 115, 22, 0.2)";
            ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(c.x, c.y, radius, 0, Math.PI * 2);

        if (heatmapEnabled) {
            ctx.fillStyle = getHeatmapColor(norm);
        } else {
            ctx.fillStyle = "#1e293b";
        }
        ctx.fill();

        ctx.lineWidth = 2;
        if (u === selectedA) {
            ctx.strokeStyle = "#4ade80";
            ctx.lineWidth = 3.5;
        } else if (u === selectedB) {
            ctx.strokeStyle = "#f43f5e";
            ctx.lineWidth = 3.5;
        } else if (u === inspectedNode) {
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 3;
        } else {
            ctx.strokeStyle = heatmapEnabled && norm >= 0.7 ? "#ffffff" : "#475569";
        }
        ctx.stroke();

        ctx.font = `600 ${radius > 16 ? 12 : 11}px 'Google Sans', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = heatmapEnabled && norm >= 0.7 ? "#000000" : "#ffffff";
        ctx.fillText(String(u), c.x, c.y + 0.5);

        if (u === draggingNode) {
            ctx.beginPath();
            ctx.arc(c.x, c.y, radius + 6, 0, Math.PI * 2);
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
        }

        ctx.restore();
    });
}
