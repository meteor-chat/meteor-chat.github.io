export const PM_GUIDE_DATA_3 = {
    37: {
        title: "Net Present Value (NPV)",
        formula: "NPV = \\frac{C_t}{1 + r} - C_0",
        inputs: [
            {
                name: "C0 (Investasi Awal)",
                meaning: "Jumlah total uang yang dikeluarkan di awal (tahun ke-0) untuk memulai proyek.",
                source: "Didapat dari rencana anggaran belanja modal (CAPEX) awal proyek.",
                purpose: "Sebagai modal awal yang harus ditutup oleh keuntungan masa depan."
            },
            {
                name: "Ct (Arus Kas Masuk Periode t)",
                meaning: "Jumlah uang masuk bersih yang diterima dari proyek pada periode ke-t.",
                source: "Didapat dari proyeksi pendapatan atau pemasukan bersih proyek.",
                purpose: "Sebagai uang masuk masa depan yang didiskon ke nilai uang saat ini."
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
            title: "Contoh Evaluasi Investasi Proyek",
            story: "Investasi awal modal $1.000 dengan suku bunga diskonto 10%. Kas masuk masa depan sebesar $1.200.",
            calc: "PV = $1.200 / (1 + 0,10) = $1.090,91. NPV = $1.090,91 - $1.000 = +$90,91.",
            meaning: "Nilai NPV positif (+$90,91). Proyek diterima karena menambah kekayaan bagi perusahaan."
        }
    }
};