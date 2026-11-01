export const PM_GUIDE_DATA_2 = {
    30: {
        title: "Cost Performance Index (CPI)",
        formula: "CPI = EV / AC",
        inputs: [
            {
                name: "EV (Earned Value)",
                meaning: "Nilai uang dari hasil kerja nyata yang sudah didapat.",
                source: "Didapat dari persentase kerja nyata dikali total anggaran (BAC).",
                purpose: "Sebagai pembilang efisiensi uang kerja."
            },
            {
                name: "AC (Actual Cost)",
                meaning: "Total seluruh uang kas yang sudah dibelanjakan keluar.",
                source: "Didapat dari nota belanja dan kuitansi pembayaran resmi kas proyek.",
                purpose: "Sebagai penyebut pengeluaran uang asli."
            }
        ],
        outputs: {
            meaning: "Angka efisiensi uang. Mengukur nilai hasil kerja yang diperoleh untuk setiap rupiah yang dikeluarkan.",
            interpretation: [
                { label: "CPI > 1,0", meaning: "Hemat biaya (Under Budget). Tiap uang keluar menghasilkan nilai lebih tinggi.", status: "good" },
                { label: "CPI = 1,0", meaning: "Pas sesuai anggaran (On Budget). Uang keluar sebanding tepat dengan hasil kerja.", status: "good" },
                { label: "CPI < 1,0", meaning: "Boros biaya (Over Budget). Tiap uang keluar menghasilkan nilai lebih sedikit.", status: "bad" }
            ],
            action: "Gunakan nilai CPI untuk meramal total biaya akhir proyek (EAC) saat proyek rampung."
        },
        example: {
            title: "Contoh Kasus Kafe (Slide 30)",
            story: "Nilai kerja nyata yang didapat Rp 40 juta (EV), uang kas yang dihabiskan Rp 57,5 juta (AC).",
            calc: "CPI = Rp 40 juta / Rp 57,5 juta = 0,70 (70%)",
            meaning: "Boros uang. Tiap keluar Rp 1.000 hanya menghasilkan bangunan senilai Rp 700. Kita rugi Rp 300 tiap Rp 1.000."
        }
    },
    31: {
        title: "Schedule Performance Index (SPI)",
        formula: "SPI = EV / PV",
        inputs: [
            {
                name: "EV (Earned Value)",
                meaning: "Nilai uang dari kerja fisik yang sudah selesai dibangun.",
                source: "Didapat dari hasil cek fisik lapangan dikali total anggaran (BAC).",
                purpose: "Sebagai pembilang laju kemajuan kerja nyata."
            },
            {
                name: "PV (Planned Value)",
                meaning: "Nilai uang dari kerja yang ditargetkan selesai hari ini.",
                source: "Didapat dari jadwal kalender rencana awal proyek.",
                purpose: "Sebagai penyebut patokan target waktu."
            }
        ],
        outputs: {
            meaning: "Angka kecepatan kerja tim proyek dibanding jadwal rencana awal.",
            interpretation: [
                { label: "SPI > 1,0", meaning: "Kerja lebih cepat dari jadwal (Ahead of Schedule).", status: "good" },
                { label: "SPI = 1,0", meaning: "Kerja tepat waktu persis sesuai kalender rencana (On Schedule).", status: "good" },
                { label: "SPI < 1,0", meaning: "Kerja lambat atau molor dari jadwal (Behind Schedule).", status: "bad" }
            ],
            action: "Gunakan nilai SPI untuk meramal total waktu yang dibutuhkan hingga seluruh proyek selesai."
        },
        example: {
            title: "Contoh Kasus Kafe (Slide 28)",
            story: "Pekerjaan fisik yang beres bernilai Rp 40 juta (EV), target rencana harusnya Rp 50 juta (PV).",
            calc: "SPI = Rp 40 juta / Rp 50 juta = 0,80 (80%)",
            meaning: "Kerja lambat. Tim baru bekerja pada kecepatan 80% dari kecepatan yang dijanjikan."
        }
    },
    32: {
        title: "Estimate at Completion (EAC)",
        formula: "EAC = BAC / CPI",
        inputs: [
            {
                name: "BAC (Budget at Completion)",
                meaning: "Anggaran awal yang dulu disetujui bersama dalam kontrak.",
                source: "Didapat dari dokumen kontrak kerja awal.",
                purpose: "Sebagai pembilang batas awal biaya yang direncanakan."
            },
            {
                name: "CPI (Cost Performance Index)",
                meaning: "Tingkat efisiensi uang kerja tim proyek saat ini.",
                source: "Didapat dari rumus CPI = EV / AC.",
                purpose: "Sebagai faktor pembagi pemborosan atau penghematan uang."
            }
        ],
        outputs: {
            meaning: "Ramalan total biaya akhir saat proyek selesai jika cara kerja tetap seperti sekarang.",
            interpretation: [
                { label: "EAC > BAC", meaning: "Biaya akhir membengkak melebihi anggaran awal (Cost Overrun).", status: "bad" },
                { label: "EAC = BAC", meaning: "Biaya akhir tetap pas sesuai anggaran kontrak awal.", status: "good" },
                { label: "EAC < BAC", meaning: "Biaya akhir lebih murah dari anggaran awal (Hemat).", status: "good" }
            ],
            action: "Jika EAC jauh melampaui BAC, segera ajukan revisi anggaran atau kurangi pekerjaan tambahan yang tidak wajib."
        },
        example: {
            title: "Contoh Kasus Kafe (Slide 32)",
            story: "Anggaran awal kafe Rp 100 juta (BAC), efisiensi uang kerja tim sangat boros yaitu CPI = 0,70.",
            calc: "EAC = Rp 100 juta / 0,70 = Rp 142,86 juta",
            meaning: "Proyek kafe diramal akan menghabiskan Rp 142,86 juta hingga tamat. Biaya membengkak Rp 42,86 juta."
        }
    },
    33: {
        title: "Estimated Time to Complete",
        formula: "Perkiraan Waktu = Waktu Rencana / SPI",
        inputs: [
            {
                name: "Original Time Estimate (Waktu Rencana)",
                meaning: "Lama waktu yang dulu direncanakan untuk menyelesaikan proyek.",
                source: "Didapat dari jadwal durasi pada kontrak kerja awal.",
                purpose: "Sebagai pembilang patokan waktu rencana awal."
            },
            {
                name: "SPI (Schedule Performance Index)",
                meaning: "Angka kecepatan kerja tim proyek saat ini.",
                source: "Didapat dari rumus SPI = EV / PV.",
                purpose: "Sebagai penyebut laju kemajuan kerja tim."
            }
        ],
        outputs: {
            meaning: "Ramalan total durasi waktu yang benar-benar dibutuhkan hingga proyek selesai seluruhnya.",
            interpretation: [
                { label: "Waktu > Rencana", meaning: "Waktu proyek molor dan telat selesai.", status: "bad" },
                { label: "Waktu = Rencana", meaning: "Waktu proyek selesai tepat sesuai jadwal.", status: "good" },
                { label: "Waktu < Rencana", meaning: "Waktu proyek selesai lebih awal dari jadwal rencana.", status: "good" }
            ],
            action: "Jika perkiraan waktu molor, manajer harus menambah sif pekerja malam atau membagi tugas yang rumit."
        },
        example: {
            title: "Contoh Kasus Proyek 12 Bulan (Slide 35)",
            story: "Rencana awal proyek adalah 12 bulan. Kecepatan kerja tim tercatat lambat dengan SPI = 0,96.",
            calc: "Perkiraan Waktu = 12 bulan / 0,96 = 12,5 bulan",
            meaning: "Proyek molor setengah bulan. Dibutuhkan waktu 12,5 bulan untuk merampungkan seluruh pekerjaan."
        }
    },
    34: {
        title: "Estimate to Complete (ETC)",
        formula: "ETC = EAC - AC",
        inputs: [
            {
                name: "EAC (Estimate at Completion)",
                meaning: "Ramalan total seluruh uang yang akan habis hingga proyek selesai.",
                source: "Didapat dari rumus EAC = BAC / CPI.",
                purpose: "Sebagai angka target total belanja akhir proyek."
            },
            {
                name: "AC (Actual Cost)",
                meaning: "Total uang kas yang sudah keluar dari kas sampai hari ini.",
                source: "Didapat dari catatan kas dan kuitansi pembayaran resmi.",
                purpose: "Sebagai pengurang uang yang sudah habis dibelanjakan."
            }
        ],
        outputs: {
            meaning: "Sisa uang tunai yang masih wajib disiapkan mulai hari ini hingga proyek rampung.",
            interpretation: [
                { label: "ETC > Sisa BAC", meaning: "Sisa anggaran lama tidak cukup. Wajib ada tambahan dana baru.", status: "bad" },
                { label: "ETC \u2264 Sisa BAC", meaning: "Sisa anggaran awal masih aman untuk menyelesaikan proyek.", status: "good" }
            ],
            action: "Segera laporkan nilai ETC ke pimpinan agar kas proyek tidak kosong di tengah jalan."
        },
        example: {
            title: "Contoh Kasus Kafe (Slide 32)",
            story: "Ramalan total biaya akhir kafe Rp 142,86 juta (EAC). Uang kas yang sudah keluar Rp 57,5 juta (AC).",
            calc: "ETC = Rp 142,86 juta - Rp 57,5 juta = Rp 85,36 juta",
            meaning: "Manajer masih membutuhkan dana tunai Rp 85,36 juta lagi untuk menyelesaikan seluruh kafe."
        }
    },
    35: {
        title: "Variance at Completion (VAC)",
        formula: "VAC = BAC - EAC",
        inputs: [
            {
                name: "BAC (Budget at Completion)",
                meaning: "Total uang anggaran yang dulu disepakati bersama dalam kontrak.",
                source: "Didapat dari kontrak perjanjian proyek awal.",
                purpose: "Sebagai angka patokan janji awal biaya."
            },
            {
                name: "EAC (Estimate at Completion)",
                meaning: "Ramalan total biaya akhir yang nyata akan keluar.",
                source: "Didapat dari rumus EAC = BAC / CPI.",
                purpose: "Sebagai angka pembanding kenyataan belanja akhir."
            }
        ],
        outputs: {
            meaning: "Selisih perkiraan uang pada akhir proyek: apakah rugi tekor atau ada sisa dana.",
            interpretation: [
                { label: "VAC > 0 (Positif)", meaning: "Proyek hemat (Cost Underrun). Uang anggaran ada sisa lebih.", status: "good" },
                { label: "VAC = 0 (Nol)", meaning: "Proyek pas persis sesuai anggaran kontrak awal.", status: "good" },
                { label: "VAC < 0 (Negatif)", meaning: "Proyek tekor bengkak (Cost Overrun). Biaya membengkak melebihi anggaran.", status: "bad" }
            ],
            action: "Jika VAC bernilai negatif besar, manajer harus melakukan audit belanja dan renegosiasi dengan klien."
        },
        example: {
            title: "Contoh Kasus Kafe (Slide 32)",
            story: "Janji anggaran awal Rp 100 juta (BAC), namun ramalan biaya akhir melonjak jadi Rp 142,86 juta (EAC).",
            calc: "VAC = Rp 100 juta - Rp 142,86 juta = -Rp 42,86 juta",
            meaning: "Proyek tekor parah sebesar Rp 42,86 juta dari anggaran kontrak yang disepakati."
        }
    }
};
