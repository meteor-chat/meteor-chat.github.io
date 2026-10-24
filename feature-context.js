const MANIFESTS = {
    search: [
        "Fitur: Pathfinding Arena (/search)",
        "- Grid interaktif 22x40 sel Canvas 2D untuk simulasi graf.",
        "- Algoritma: BFS (Breadth-First), DFS (Depth-First), Dijkstra (Shortest Path).",
        "- Interaksi: Klik & geser untuk rintangan dinding, pindahkan Start (hijau) & Target (merah), Generate Maze otomatis, Clear Walls, Clear Path.",
        "- Arahkan pengguna dengan tautan markdown: [Buka Pathfinding Arena](/search)"
    ].join("\n"),

    sort: [
        "Fitur: Sorting Visualizer (/sort)",
        "- Animasi visualisasi algoritma pengurutan pada 60 FPS.",
        "- Algoritma: Bubble Sort, Selection Sort, Insertion Sort, Quick Sort, Merge Sort, Shaker Sort.",
        "- Mode: Bar 2D dan Lingkaran Disparitas Spektrum Warna 360 derajat.",
        "- Kontrol: Randomize & Skenario Terburuk (Worst Case).",
        "- Arahkan pengguna dengan tautan markdown: [Buka Sorting Visualizer](/sort)"
    ].join("\n"),

    math: [
        "Fitur: Interactive STEM Laboratory (/math)",
        "- 25 modul komputasi matematika dan kalkulator sains interaktif.",
        "- Topik: Kecerdasan Artifisial (Genetika), Teori Peluang (Bayes, Distribusi Normal), Kalkulus (Integral Riemann), Matriks & Vektor, Manajemen Proyek (Rate of Performance), serta Simulasi 3D Kerucut & Kubus berputar.",
        "- Arahkan pengguna dengan tautan markdown: [Buka Math Laboratory](/math)"
    ].join("\n"),

    ecosystem: [
        "Ekosistem Web Meteor:",
        "- [Math Lab](/math): 25 kalkulator STEM interaktif & simulasi 3D.",
        "- [Sort Visualizer](/sort): Visualisasi 6 algoritma sorting (Bar & Lingkaran 360 derajat).",
        "- [Pathfinding Arena](/search): Simulasi interaktif pencarian rute BFS, DFS, Dijkstra pada arena labirin.",
        "- Arahkan pengguna dengan tautan markdown ke halaman yang relevan."
    ].join("\n")
};

const PATTERNS = {
    search: /\b(search|pathfinding|rute|labirin|maze|bfs|dfs|dijkstra|jalur\s+terpendek|arena)\b/i,
    sort: /\b(sort|sorting|pengurutan|mengurutkan|bubble\s*sort|quicksort|quick\s*sort|merge\s*sort|shaker\s*sort|insertion\s*sort|selection\s*sort)\b/i,
    math: /\b(math|matematika|kalkulator|rumus|bayes|riemann|integral|determinan|matriks|vektor|kubus|kerucut|genetika|kromosom|manajemen\s*proyek|performance)\b/i,
    ecosystem: /\b(fitur|menu|halaman|bisa\s+apa|kemampuan|fasilitas|website\s+ini|web\s+ini|aplikasi\s+ini|navigation|navigasi)\b/i
};

function hasRecentContext(messages, pathKey) {
    if (!messages || messages.length === 0) return false;
    const checkCount = Math.min(messages.length, 4);
    for (let i = messages.length - checkCount; i < messages.length; i++) {
        const content = messages[i]?.content || "";
        if (content.includes(`/${pathKey}`)) {
            return true;
        }
    }
    return false;
}

export function getFeatureContext(userText, messages = []) {
    if (!userText || typeof userText !== "string") return null;

    if (PATTERNS.search.test(userText)) {
        if (!hasRecentContext(messages, "search")) {
            return MANIFESTS.search;
        }
    }

    if (PATTERNS.sort.test(userText)) {
        if (!hasRecentContext(messages, "sort")) {
            return MANIFESTS.sort;
        }
    }

    if (PATTERNS.math.test(userText)) {
        if (!hasRecentContext(messages, "math")) {
            return MANIFESTS.math;
        }
    }

    if (PATTERNS.ecosystem.test(userText)) {
        return MANIFESTS.ecosystem;
    }

    return null;
}
