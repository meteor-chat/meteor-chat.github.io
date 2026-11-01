export const PM_GUIDE_DATA_1 = {
    25: {
        title: "Rate of Performance (RP)",
        formula: "RP = (Actual Work Completed / Planned Work Completed) \u00d7 100%",
        inputs: [
            {
                name: "Actual Work Completed (Kerja Nyata)",
                meaning: "Pekerjaan fisik yang benar-benar sudah beres dibuat di lapangan.",
                source: "Didapat dari buku cek mandor atau laporan tugas yang selesai.",
                purpose: "Sebagai pembilang untuk membuktikan hasil kerja nyata kita hari ini."
            },
            {
                name: "Planned Work Completed (Rencana Kerja)",
                meaning: "Target pekerjaan yang dulu dijanjikan harus selesai hari ini.",
                source: "Didapat dari dokumen kalender jadwal rencana awal proyek.",
                purpose: "Sebagai penyebut atau patokan target janji awal."
            }
        ],
        outputs: {
            meaning: "Menunjukkan seberapa cepat tim bekerja dibanding janji awal.",
            interpretation: [
                { label: "RP = 100%", meaning: "Kerja tepat waktu dan sesuai target rencana.", status: "good" },
                { label: "RP < 100%", meaning: "Kerja lambat. Hasil kerja nyata kurang dari target.", status: "bad" },
                { label: "RP > 100%", meaning: "Kerja sangat cepat. Hasil kerja nyata melampaui target.", status: "good" }
            ],
            action: "Jika RP di bawah 100%, manajer wajib menambah pekerja atau jam lembur agar proyek tidak molor."
        },
        example: {
            title: "Contoh Kasus Proyek Server (Slide 30)",
            story: "Target jadwal harus selesai pasang 2 server (Planned = 2). Di lapangan baru selesai pasang 1 server (Actual = 1).",
            calc: "RP = (1 / 2) \u00d7 100% = 50%",
            meaning: "Proyek baru berjalan separuh dari janji awal (50%). Kinerja kerja terlambat dari jadwal."
        }
    },
    26: {
        title: "Planned Value (PV)",
        formula: "PV = BAC \u00d7 Planned Complete (%)",
        inputs: [
            {
                name: "BAC (Budget at Completion)",
                meaning: "Jumlah semua uang anggaran yang disetujui untuk mendanai proyek dari awal sampai selesai.",
                source: "Didapat dari tanda tangan kontrak kerja dan rencana biaya resmi.",
                purpose: "Sebagai angka patokan total biaya seluruh proyek."
            },
            {
                name: "Planned Complete (%)",
                meaning: "Porsi waktu jadwal yang seharusnya sudah berjalan sampai hari ini.",
                source: "Didapat dari jadwal pembagian waktu di kalender rencana proyek.",
                purpose: "Untuk menghitung nilai uang yang seharusnya sudah berwujud fisik hari ini."
            }
        ],
        outputs: {
            meaning: "Nilai uang dari pekerjaan yang semestinya sudah selesai hari ini menurut jadwal.",
            interpretation: [
                { label: "PV = Nilai Rencana", meaning: "Patokan uang yang seharusnya sudah terwujud dalam bentuk fisik proyek.", status: "info" }
            ],
            action: "Gunakan angka PV sebagai patokan baku untuk mengukur apakah proyek kita molor atau maju."
        },
        example: {
            title: "Contoh Kasus Kafe (Slide 26)",
            story: "Total dana kafe Rp 100 juta dengan waktu 2 bulan. Di akhir bulan ke-1 target rencana kerja adalah 50%.",
            calc: "PV = Rp 100 juta \u00d7 50% = Rp 50 juta",
            meaning: "Menurut rencana di atas kertas, hari ini kita semestinya sudah memegang hasil kerja fisik senilai Rp 50 juta."
        }
    },
    27: {
        title: "Earned Value (EV)",
        formula: "EV = BAC \u00d7 Actual Complete (%)",
        inputs: [
            {
                name: "BAC (Budget at Completion)",
                meaning: "Jumlah total uang anggaran yang disetujui bersama.",
                source: "Didapat dari dokumen kontrak kerja resmi.",
                purpose: "Sebagai patokan total nilai uang proyek."
            },
            {
                name: "Actual Complete (%)",
                meaning: "Persentase kerja fisik yang nyata-nyata sudah selesai dibangun di lapangan.",
                source: "Didapat dari inspeksi cek fisik langsung ke lokasi proyek.",
                purpose: "Untuk menghitung nilai uang nyata yang berhasil diwujudkan oleh tim."
            }
        ],
        outputs: {
            meaning: "Nilai uang nyata yang berhasil kita peroleh dari pekerjaan yang sudah beres.",
            interpretation: [
                { label: "EV < PV", meaning: "Pekerjaan fisik nyata tertinggal di belakang rencana jadwal.", status: "bad" },
                { label: "EV = PV", meaning: "Pekerjaan fisik nyata tepat sesuai jadwal yang direncanakan.", status: "good" },
                { label: "EV > PV", meaning: "Pekerjaan fisik nyata melampaui target rencana jadwal.", status: "good" }
            ],
            action: "Bandingkan EV dengan PV untuk memeriksa jadwal, dan bandingkan EV dengan AC untuk memeriksa uang."
        },
        example: {
            title: "Contoh Kasus Kafe (Slide 26)",
            story: "Total dana Rp 100 juta. Cek langsung ke kafe menunjukkan bangunan baru selesai 40%.",
            calc: "EV = Rp 100 juta \u00d7 40% = Rp 40 juta",
            meaning: "Fisik kafe yang nyata berdiri baru bernilai Rp 40 juta, meskipun rencana jadwal meminta Rp 50 juta."
        }
    },
    28: {
        title: "Cost Variance (CV)",
        formula: "CV = EV - AC",
        inputs: [
            {
                name: "EV (Earned Value)",
                meaning: "Nilai uang dari pekerjaan fisik yang sudah selesai dibangun.",
                source: "Didapat dari rumus EV = BAC \u00d7 Actual %.",
                purpose: "Sebagai angka nilai hasil kerja nyata yang kita miliki."
            },
            {
                name: "AC (Actual Cost)",
                meaning: "Total uang kas yang sudah nyata dibayarkan keluar dari kas proyek.",
                source: "Didapat dari buku kas bendahara, nota kuitansi belanja bahan, dan slip gaji pekerja.",
                purpose: "Sebagai angka pengurang untuk mengukur apakah uang kita sisa atau tekor."
            }
        ],
        outputs: {
            meaning: "Selisih antara nilai hasil kerja nyata dengan uang yang sudah ludes dibelanjakan.",
            interpretation: [
                { label: "CV > 0 (Positif)", meaning: "Hemat biaya (Under Budget). Nilai kerja nyata lebih besar dari uang kas keluar.", status: "good" },
                { label: "CV = 0 (Nol)", meaning: "Pas sesuai anggaran (On Budget). Uang keluar sebanding tepat dengan hasil kerja.", status: "good" },
                { label: "CV < 0 (Negatif)", meaning: "Tekor atau boros uang (Over Budget). Uang keluar lebih banyak dari nilai kerja.", status: "bad" }
            ],
            action: "Jika CV bernilai negatif, manajer wajib memangkas biaya yang tidak perlu atau mencari bahan bangunan yang lebih murah."
        },
        example: {
            title: "Contoh Kasus Kafe (Slide 30)",
            story: "Nilai kerja nyata yang beres adalah Rp 40 juta (EV), tetapi uang kas yang sudah dibelanjakan adalah Rp 57,5 juta (AC).",
            calc: "CV = Rp 40 juta - Rp 57,5 juta = -Rp 17,5 juta",
            meaning: "Proyek kafe tekor Rp 17,5 juta. Kita membayar lebih mahal dari hasil kerja yang diperoleh."
        }
    },
    29: {
        title: "Schedule Variance (SV)",
        formula: "SV = EV - PV",
        inputs: [
            {
                name: "EV (Earned Value)",
                meaning: "Nilai uang dari pekerjaan fisik yang nyata sudah beres di lapangan.",
                source: "Didapat dari rumus EV = BAC \u00d7 Actual %.",
                purpose: "Sebagai tolok ukur hasil kerja nyata yang sudah didapat."
            },
            {
                name: "PV (Planned Value)",
                meaning: "Nilai uang dari pekerjaan yang semestinya sudah beres hari ini menurut jadwal.",
                source: "Didapat dari rumus PV = BAC \u00d7 Planned %.",
                purpose: "Sebagai angka pembanding janji jadwal awal."
            }
        ],
        outputs: {
            meaning: "Selisih kemajuan jadwal proyek yang diukur dalam satuan nilai mata uang.",
            interpretation: [
                { label: "SV > 0 (Positif)", meaning: "Proyek maju lebih cepat dari jadwal rencana (Ahead of Schedule).", status: "good" },
                { label: "SV = 0 (Nol)", meaning: "Proyek berjalan tepat waktu persis sesuai kalender rencana (On Schedule).", status: "good" },
                { label: "SV < 0 (Negatif)", meaning: "Proyek terlambat atau molor dari jadwal (Behind Schedule).", status: "bad" }
            ],
            action: "Jika SV bernilai negatif, manajer harus mengecek tugas yang macet dan mempercepat jadwal pekerjaan utama."
        },
        example: {
            title: "Contoh Kasus Kafe (Slide 28)",
            story: "Nilai kerja nyata yang beres Rp 40 juta (EV), padahal target jadwal kalender hari ini adalah Rp 50 juta (PV).",
            calc: "SV = Rp 40 juta - Rp 50 juta = -Rp 10 juta",
            meaning: "Proyek kafe molor dari jadwal. Kita tertinggal pekerjaan fisik senilai Rp 10 juta rupiah."
        }
    }
};
