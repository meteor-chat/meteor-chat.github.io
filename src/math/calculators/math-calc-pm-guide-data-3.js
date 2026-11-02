export const PM_GUIDE_DATA_3 = {
    37: {
        title: "Net Present Value (NPV)",
        formula: "NPV = \\sum_{t=1}^T \\frac{C_t}{(1 + r)^t} - C_0",
        inputs: [
            {
                name: "C0 (Biaya Investasi Awal)",
                meaning: "Jumlah total uang yang dikeluarkan di awal (tahun ke-0) untuk memulai proyek.",
                source: "Didapat dari rencana anggaran belanja modal (CAPEX) awal proyek.",
                purpose: "Sebagai modal awal yang harus ditutup oleh keuntungan masa depan."
            },
            {
                name: "r (Discount Rate / Suku Bunga)",
                meaning: "Tingkat bunga atau penurunan nilai waktu uang (Time Value of Money) per tahun.",
                source: "Didapat dari kebijakan bunga bank, biaya modal perusahaan, atau tingkat inflasi.",
                purpose: "Sebagai faktor pemotong (diskon) agar nilai uang masa depan setara uang tunai hari ini."
            },
            {
                name: "Ct (Arus Kas Bersih Tahun ke-t)",
                meaning: "Sisa uang masuk neto pada tahun ke-t, yaitu Manfaat (Benefit) dikurangi Biaya operasional (Cost).",
                source: "Didapat dari proyeksi laba rugi dan perkiraan pemasukan tahunan proyek.",
                purpose: "Sebagai arus uang masuk masa depan yang didiskon ke nilai sekarang."
            }
        ],
        outputs: {
            meaning: "Total keuntungan atau kerugian bersih yang sudah disesuaikan dengan nilai uang sekarang.",
            interpretation: [
                { label: "NPV > 0", meaning: "Proyek Layak / Diterima. Proyek menambah kekayaan dan nilai bagi perusahaan.", status: "good" },
                { label: "NPV = 0", meaning: "Proyek Netral (Impas). Tidak untung dan tidak rugi. Keputusan berdasarkan faktor strategis lain.", status: "warn" },
                { label: "NPV < 0", meaning: "Proyek Ditolak / Tidak Layak. Proyek mengurangi kekayaan perusahaan dan menimbulkan kerugian.", status: "bad" }
            ],
            action: "Pilih proyek dengan NPV positif terbesar. Periksa juga nilai ROI dan waktu Payback Period."
        },
        example: {
            title: "Contoh JWD Consulting (Figure 4-5)",
            story: "Investasi awal $140.000 dengan diskon 8%. Tiap tahun menghasilkan laba bersih $160.000 selama 3 tahun.",
            calc: "Total manfaat terdiskon ($516.000) - Total biaya terdiskon ($243.200) = NPV $272.800",
            meaning: "Proyek sangat menguntungkan. Memberikan ROI 112% dan modal awal sudah kembali lunas pada Tahun ke-1."
        }
    }
};
