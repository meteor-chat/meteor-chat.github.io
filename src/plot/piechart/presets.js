export const TRIPAL_PICK_ORDER = [3, 6, 1, 4, 5, 8, 2, 7, 0];

export const PIE_PALETTES = {
    okabe_ito: ["#56b4e9", "#e69f00", "#009e73", "#cc79a7", "#f0e442", "#0072b2", "#d55e00", "#94a3b8", "#38bdf8"],
    tripal: ["#e15759", "#4e79a7", "#f28e2b", "#76b7b2", "#59a14f", "#edc948", "#b07aa1", "#ff9da7", "#9c755f"],
    ocean: ["#38bdf8", "#818cf8", "#2dd4bf", "#a78bfa", "#60a5fa", "#34d399", "#0ea5e9", "#6366f1", "#14b8a6"],
    aurora: ["#34d399", "#22d3ee", "#a78bfa", "#fb7185", "#fbbf24", "#60a5fa", "#10b981", "#f472b6", "#38bdf8"],
    ember: ["#fb923c", "#f43f5e", "#facc15", "#e879f9", "#38bdf8", "#4ade80", "#f97316", "#ec4899", "#eab308"],
    monochrome: ["#f8fafc", "#cbd5e1", "#94a3b8", "#64748b", "#e2e8f0", "#475569", "#f1f5f9", "#334155", "#bae6fd"]
};

export function getSliceColor(paletteId, index, options = {}) {
    if (options.isGrouped) {
        return "#64748b";
    }
    const pal = PIE_PALETTES[paletteId] || PIE_PALETTES.okabe_ito;
    const n = pal.length;
    const useContrast = options.contrastOrder !== false;
    if (useContrast && n === TRIPAL_PICK_ORDER.length) {
        const mapped = TRIPAL_PICK_ORDER[index % n];
        return pal[mapped];
    }
    if (useContrast && n > 2) {
        return pal[(index * 3) % n];
    }
    return pal[index % n];
}

export function hexToRgba(hex, alpha) {
    const clean = String(hex || "#38bdf8").replace("#", "");
    const full = clean.length === 3
        ? clean.split("").map((c) => c + c).join("")
        : clean;
    const r = parseInt(full.slice(0, 2), 16) || 56;
    const g = parseInt(full.slice(2, 4), 16) || 189;
    const b = parseInt(full.slice(4, 6), 16) || 248;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const PIE_PRESETS = {
    budget: {
        id: "budget",
        label: "Pangsa & Anggaran",
        title: "Alokasi Anggaran Riset & Produk (%)",
        mode: "donut",
        sortOrder: "desc",
        cutoutPct: 54,
        groupSmall: false,
        smallThresholdPct: 3,
        data: [
            "Divisi, Anggaran (Juta)",
            "Riset & AI, 420",
            "Infrastruktur Cloud, 285",
            "Rekayasa Frontend, 210",
            "Keamanan & Audit, 145",
            "Desain Produk, 110",
            "Operasional, 80"
        ].join("\n")
    },
    market: {
        id: "market",
        label: "Long-Tail (>3%)",
        title: "Distribusi Lalu Lintas Mesin & Browser",
        mode: "pie",
        sortOrder: "desc",
        cutoutPct: 0,
        groupSmall: true,
        smallThresholdPct: 3,
        data: [
            "Platform, Kunjungan",
            "Chromium Desktop, 4820",
            "Mobile Safari, 2410",
            "Firefox, 980",
            "Edge WebView, 640",
            "Samsung Internet, 210",
            "Opera, 165",
            "Brave Mobile, 130",
            "Lainnya Crawler, 85",
            "Terminal CLI, 45"
        ].join("\n")
    },
    cohort: {
        id: "cohort",
        label: "Multi-Seri Konsentris",
        title: "Pergeseran Pangsa Energi Bersih (2024 - 2026)",
        mode: "multi",
        sortOrder: "desc",
        cutoutPct: 34,
        groupSmall: false,
        smallThresholdPct: 3,
        data: [
            "Sumber Energi, 2024, 2025, 2026",
            "Surya PV, 145, 215, 310",
            "Angin Lepas Pantai, 190, 225, 265",
            "Hidro & Pompa, 210, 205, 195",
            "Panas Bumi, 95, 110, 128",
            "Baterai & Hidrogen, 42, 78, 122"
        ].join("\n")
    },
    radar: {
        id: "radar",
        label: "Indeks Polar 8 Sektor",
        title: "Skor Kapabilitas Infrastruktur Regional",
        mode: "polar",
        sortOrder: "input",
        cutoutPct: 16,
        groupSmall: false,
        smallThresholdPct: 3,
        data: [
            "Sektor, Skor Indeks",
            "Konektivitas, 92",
            "Latensi Edge, 78",
            "Kapasitas GPU, 86",
            "Keamanan Zero-Trust, 74",
            "Otomasi CI/CD, 65",
            "Observabilitas, 58",
            "Efisiensi Energi, 81",
            "Ketahanan Failover, 70"
        ].join("\n")
    }
};
