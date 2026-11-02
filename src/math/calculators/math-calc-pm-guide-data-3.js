export const PM_GUIDE_DATA_3 = {
    37: {
        title: "Net Present Value (NPV)",
        formula: "NPV = \\sum_{t=1}^T \\frac{C_t}{(1 + r)^t} - C_0",
        inputs: [
            {
                name: "C0 (Investasi Awal)",
                meaning: "Jumlah total modal yang dikeluarkan di awal (tahun ke-0) untuk memulai proyek.",
                source: "Didapat dari rencana anggaran belanja modal (CAPEX) awal proyek.",
                purpose: "Sebagai modal awal yang harus ditutup oleh keuntungan masa depan."
            },
            {
                name: "Ct (Arus Kas Masuk Tiap Periode)",
                meaning: "Jumlah uang masuk bersih yang diterima dari proyek pada tahun ke-1, 2, dan seterusnya. Kolom baru bertambah otomatis.",
                source: "Didapat dari proyeksi arus kas masuk dan keuntungan operasional tahunan.",
                purpose: "Sebagai arus uang masuk masa depan yang didiskon ke nilai uang saat ini."
            },
            {
                name: "r (Discount Rate / Suku Bunga)",
                meaning: "Tingkat bunga atau penurunan nilai waktu uang (Time Value of Money) per tahun.",
                source: "Didapat dari suku bunga bank, biaya modal perusahaan, atau target keuntungan minimum.",
                purpose: "Sebagai faktor pemotong (diskon) agar nilai uang masa depan setara uang tunai hari ini."
            }
        ],
        outputs: {
            meaning: "Total keuntungan atau kerugian bersih yang sudah disesuaikan dengan nilai uang sekarang.",
            interpretation: [
                { label: "NPV > 0", meaning: "Proyek Diterima (Layak). Investasi menambah nilai dan kekayaan bagi perusahaan.", status: "good" },
                { label: "NPV = 0", meaning: "Proyek Netral (Impas). Tidak untung dan tidak rugi secara nilai waktu uang.", status: "warn" },
                { label: "NPV < 0", meaning: "Proyek Ditolak (Tidak Layak). Investasi mengurangi kekayaan dan menimbulkan kerugian.", status: "bad" }
            ],
            action: "Pilih proyek dengan NPV positif terbesar. Jika NPV negatif, tolak proyek atau negosiasikan modal awal."
        },
        example: {
            title: "Contoh Multi-Tahun Project 1 (Slide Fig 4-4)",
            story: "Investasi awal $5.000 dengan diskonto 10%. Kas masuk tahun 1-4 berturut-turut $1.000, $2.000, $3.000, $4.000.",
            calc: "Total PV ($7.547,98) - Investasi Awal ($5.000) = NPV +$2.547,98.",
            meaning: "Nilai NPV positif (+$2.547,98). Proyek layak diterima karena menambah nilai perusahaan."
        }
    }
};