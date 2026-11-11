export const PALETTES = {
    aurora: ["#38bdf8", "#818cf8", "#c084fc", "#f472b6", "#34d399", "#67e8f9", "#a78bfa"],
    okabe_ito: ["#56b4e9", "#e69f00", "#009e73", "#f0e442", "#0072b2", "#d55e00", "#cc79a7"],
    cyber: ["#22d3ee", "#a78bfa", "#f59e0b", "#10b981", "#ef4444", "#38bdf8", "#ec4899"],
    solar: ["#f97316", "#eab308", "#ec4899", "#8b5cf6", "#f43f5e", "#fb923c", "#fde047"],
    monochrome: ["#ffffff", "#e2e8f0", "#cbd5e1", "#94a3b8", "#71717a", "#cbd5e1"]
};

export function assignWordColors(words, paletteName = "aurora") {
    const palette = PALETTES[paletteName] || PALETTES.aurora;
    return words.map((w, idx) => {
        const color = palette[idx % palette.length];
        return {
            ...w,
            color: color
        };
    });
}

export function renderCloudToCanvas(canvas, layoutResult, options = {}) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const {
        width = 800,
        height = 500,
        hoveredWord = null,
        activeWord = null,
        palette = "aurora"
    } = options;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const words = layoutResult.placed || [];

    for (let i = 0; i < words.length; i++) {
        const w = words[i];
        const isHovered = hoveredWord && hoveredWord.text === w.text;
        const isActive = activeWord && activeWord.text === w.text;

        ctx.save();
        ctx.translate(w.x, w.y);
        if (w.box.rad !== 0) {
            ctx.rotate(w.box.rad);
        }

        ctx.font = `600 ${w.fontSize}px ${w.fontFamily}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (isHovered || isActive) {
            ctx.shadowColor = w.color;
            ctx.shadowBlur = 14;
            ctx.fillStyle = "#ffffff";
        } else {
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
            ctx.fillStyle = w.color;
        }

        ctx.fillText(w.text, 0, 0);
        ctx.restore();

        if (isHovered) {
            ctx.save();
            ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.strokeRect(w.box.x, w.box.y, w.box.w, w.box.h);
            ctx.restore();
        }
    }

    ctx.restore();
}

export function findWordAtPoint(layoutResult, px, py) {
    if (!layoutResult || !layoutResult.placed) return null;
    const words = layoutResult.placed;
    for (let i = words.length - 1; i >= 0; i--) {
        const b = words[i].box;
        if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) {
            return words[i];
        }
    }
    return null;
}

export function generateSVGString(layoutResult, width = 800, height = 500) {
    const words = layoutResult.placed || [];
    let textElements = "";

    for (let i = 0; i < words.length; i++) {
        const w = words[i];
        const rotStr = w.angle !== 0 ? ` transform="rotate(${w.angle} ${w.x} ${w.y})"` : "";
        const escaped = w.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        textElements += `    <text x="${w.x}" y="${w.y}" font-family="${w.fontFamily}" font-size="${w.fontSize}" font-weight="600" fill="${w.color}" text-anchor="middle" dominant-baseline="central"${rotStr}>${escaped}</text>\n`;
    }

    const svgNs = "http:" + String.fromCharCode(47, 47) + "www.w3.org/2000/svg";
    return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="${svgNs}" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n  <rect width="100%" height="100%" fill="#090a0f"/>\n${textElements}</svg>`;
}

export function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function downloadCanvasPNG(canvas, filename = "wordcloud.png") {
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
