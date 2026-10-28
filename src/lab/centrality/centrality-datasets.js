export const PRESETS = {
    bridge: {
        id: "bridge",
        title: "Dua Komunitas (Slide 2)",
        desc: "Dua kelompok padat yang komunikasi antar kelompoknya 100% bergantung pada node gatekeeper di tengah.",
        nodes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        labels: {
            8: "Gatekeeper A",
            9: "Gatekeeper B",
            4: "Penghubung Internal A",
            13: "Penghubung Internal B"
        },
        positions: {
            1: { x: 80, y: 130 },
            2: { x: 70, y: 220 },
            3: { x: 130, y: 90 },
            4: { x: 190, y: 150 },
            5: { x: 110, y: 280 },
            6: { x: 140, y: 210 },
            7: { x: 200, y: 260 },
            8: { x: 265, y: 200 },
            9: { x: 335, y: 200 },
            10: { x: 400, y: 150 },
            11: { x: 460, y: 90 },
            12: { x: 470, y: 200 },
            13: { x: 410, y: 260 },
            14: { x: 530, y: 140 },
            15: { x: 500, y: 280 },
            16: { x: 530, y: 230 }
        },
        edges: [
            [1, 2], [1, 3], [1, 4], [2, 3], [2, 5], [3, 4], [3, 6],
            [4, 5], [4, 7], [5, 6], [6, 7], [4, 8], [7, 8], [8, 9],
            [9, 10], [9, 13], [10, 11], [10, 12], [10, 13], [11, 12],
            [11, 14], [12, 13], [12, 15], [13, 14], [13, 16], [14, 15], [15, 16]
        ]
    },
    karate: {
        id: "karate",
        title: "Klub Karate Zachary (Slide 3)",
        desc: "Jejaring pertemanan 34 anggota klub karate yang terpecah menjadi 2 kubu (Instruktur vs Administrator).",
        nodes: Array.from({ length: 34 }, (_, i) => i + 1),
        labels: {
            1: "John A (Instruktur)",
            34: "Mr. Hi (Administrator)",
            33: "Wakil Instruktur",
            3: "Tokoh Sentral Kubu 1",
            32: "Tokoh Sentral Kubu 2"
        },
        positions: {
            1: { x: 250, y: 240 }, 2: { x: 190, y: 220 }, 3: { x: 290, y: 180 }, 4: { x: 310, y: 230 },
            5: { x: 280, y: 310 }, 6: { x: 180, y: 330 }, 7: { x: 240, y: 330 }, 8: { x: 340, y: 220 },
            9: { x: 200, y: 170 }, 10: { x: 390, y: 150 }, 11: { x: 200, y: 300 }, 12: { x: 400, y: 300 },
            13: { x: 400, y: 260 }, 14: { x: 250, y: 190 }, 15: { x: 70, y: 100 }, 16: { x: 60, y: 120 },
            17: { x: 190, y: 370 }, 18: { x: 140, y: 270 }, 19: { x: 90, y: 90 }, 20: { x: 160, y: 190 },
            21: { x: 140, y: 80 }, 22: { x: 90, y: 250 }, 23: { x: 190, y: 80 }, 24: { x: 350, y: 100 },
            25: { x: 530, y: 130 }, 26: { x: 490, y: 110 }, 27: { x: 270, y: 60 }, 28: { x: 390, y: 120 },
            29: { x: 310, y: 140 }, 30: { x: 270, y: 80 }, 31: { x: 140, y: 160 }, 32: { x: 360, y: 160 },
            33: { x: 200, y: 120 }, 34: { x: 230, y: 120 }
        },
        edges: [
            [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8], [1, 9],
            [1, 11], [1, 12], [1, 13], [1, 14], [1, 18], [1, 20], [1, 22], [1, 32],
            [2, 3], [2, 4], [2, 8], [2, 14], [2, 18], [2, 20], [2, 22], [2, 31],
            [3, 4], [3, 8], [3, 9], [3, 10], [3, 14], [3, 28], [3, 29], [3, 33],
            [4, 8], [4, 13], [4, 14], [5, 7], [5, 11], [6, 7], [6, 11], [6, 17],
            [7, 17], [9, 31], [9, 33], [9, 34], [10, 34], [14, 34], [15, 33], [15, 34],
            [16, 33], [16, 34], [19, 33], [19, 34], [20, 34], [21, 33], [21, 34],
            [23, 33], [23, 34], [24, 26], [24, 28], [24, 30], [24, 33], [24, 34],
            [25, 26], [25, 28], [25, 32], [26, 32], [27, 30], [27, 34], [28, 34],
            [29, 32], [29, 34], [30, 33], [30, 34], [31, 33], [31, 34], [32, 33], [32, 34],
            [33, 34]
        ]
    },
    kite: {
        id: "kite",
        title: "Krackhardt Kite",
        desc: "Graf 10 orang terkenal yang membuktikan bahwa memiliki teman terbanyak belum tentu menjadi jembatan informasi utama.",
        nodes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        labels: {
            4: "Diane (Pusat Derajat)",
            8: "Heather (Gatekeeper Utama)",
            9: "Ike (Perantara)",
            10: "Jane (Perifer)"
        },
        positions: {
            1: { x: 100, y: 130 },
            2: { x: 100, y: 270 },
            3: { x: 180, y: 70 },
            4: { x: 180, y: 200 },
            5: { x: 180, y: 330 },
            6: { x: 270, y: 130 },
            7: { x: 270, y: 270 },
            8: { x: 370, y: 200 },
            9: { x: 460, y: 200 },
            10: { x: 530, y: 200 }
        },
        edges: [
            [1, 2], [1, 3], [1, 4], [1, 6],
            [2, 4], [2, 5], [2, 7],
            [3, 4], [3, 6],
            [4, 5], [4, 6], [4, 7],
            [5, 7],
            [6, 7], [6, 8],
            [7, 8],
            [8, 9],
            [9, 10]
        ]
    },
    star: {
        id: "star",
        title: "Jaringan Bintang",
        desc: "Satu server/pemimpin sentral menghubungkan semua anggota perifer. Gatekeeper mutlak dengan nilai 1.0.",
        nodes: [1, 2, 3, 4, 5, 6, 7, 8],
        labels: {
            1: "Server Utama (Gatekeeper Mutlak)"
        },
        positions: {
            1: { x: 300, y: 200 },
            2: { x: 300, y: 65 },
            3: { x: 420, y: 110 },
            4: { x: 440, y: 240 },
            5: { x: 360, y: 330 },
            6: { x: 240, y: 330 },
            7: { x: 160, y: 240 },
            8: { x: 180, y: 110 }
        },
        edges: [
            [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8]
        ]
    }
};

export function clonePreset(key) {
    const p = PRESETS[key] || PRESETS.bridge;
    return {
        id: p.id,
        title: p.title,
        desc: p.desc,
        nodes: [...p.nodes],
        labels: { ...p.labels },
        positions: Object.fromEntries(
            Object.entries(p.positions).map(([k, v]) => [k, { x: v.x, y: v.y }])
        ),
        edges: p.edges.map(([u, v]) => [u, v])
    };
}
