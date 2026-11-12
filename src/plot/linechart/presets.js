function buildTelemetryCSV() {
    const rows = ["Detik,Tegangan_Sensor,Batas_Filter"];
    for (let i = 0; i < 160; i += 1) {
        const wave = 2.4 + 0.85 * Math.sin(i * 0.14) + 0.32 * Math.cos(i * 0.43);
        const jitter = Math.sin(i * 1.93) * 0.18 + Math.cos(i * 3.17) * 0.09;
        const rawVal = (wave + jitter).toFixed(3);
        const smoothVal = (2.4 + 0.85 * Math.sin(i * 0.14)).toFixed(3);
        rows.push(`${i},${rawVal},${smoothVal}`);
    }
    return rows.join("\n");
}

export const LINE_PRESETS = {
    climate: {
        id: "climate",
        label: "Anomali Suhu Global",
        title: "Anomali Suhu Permukaan (C)",
        xTitle: "Tahun",
        yTitle: "Anomali (C)",
        mode: "monotone",
        beginAtZero: false,
        areaFill: false,
        connectNull: false,
        showMean: true,
        showTrendline: true,
        data: [
            "Tahun,Belahan Utara,Belahan Selatan,Rata-Rata Global",
            "2008,0.68,0.39,0.54",
            "2009,0.74,0.57,0.66",
            "2010,0.88,0.56,0.72",
            "2011,0.75,0.46,0.61",
            "2012,0.81,0.49,0.65",
            "2013,0.85,0.52,0.68",
            "2014,0.92,0.58,0.75",
            "2015,1.18,0.63,0.90",
            "2016,1.31,0.71,1.01",
            "2017,1.16,0.69,0.92",
            "2018,1.06,0.64,0.85",
            "2019,1.22,0.74,0.98",
            "2020,1.35,0.68,1.02",
            "2021,1.14,0.56,0.85",
            "2022,1.18,0.61,0.89",
            "2023,1.49,0.85,1.17",
            "2024,1.61,0.94,1.28"
        ].join("\n")
    },
    traffic: {
        id: "traffic",
        label: "Trafik & Celah Data",
        title: "Performa Kunjungan Harian",
        xTitle: "Tanggal",
        yTitle: "Pengguna Aktif",
        mode: "monotone",
        beginAtZero: true,
        areaFill: true,
        connectNull: false,
        showMean: true,
        showTrendline: false,
        data: [
            "Hari,Kunjungan Organik,Iklan Berbayar,Konversi",
            "1 Mei,1420,860,310",
            "2 Mei,1580,910,340",
            "3 Mei,1690,980,395",
            "4 Mei,1510,740,280",
            "5 Mei,1840,null,415",
            "6 Mei,2120,null,480",
            "7 Mei,2280,1180,530",
            "8 Mei,2150,1240,510",
            "9 Mei,2390,1360,575",
            "10 Mei,2610,1490,620",
            "11 Mei,2480,1410,590",
            "12 Mei,2740,1580,645",
            "13 Mei,2910,1620,690",
            "14 Mei,2830,1540,660"
        ].join("\n")
    },
    telemetry: {
        id: "telemetry",
        label: "Sinyal Sensor (160 Titik)",
        title: "Gelombang Tegangan & Filter IoT",
        xTitle: "Sampel (Detik)",
        yTitle: "Tegangan (V)",
        mode: "linear",
        beginAtZero: false,
        areaFill: false,
        connectNull: true,
        showMean: true,
        showTrendline: false,
        data: buildTelemetryCSV()
    },
    adoption: {
        id: "adoption",
        label: "Stabilitas Step SLA (%)",
        title: "Ketersediaan Layanan & Target SLA",
        xTitle: "Kuartal",
        yTitle: "Persentase (%)",
        mode: "step",
        beginAtZero: false,
        areaFill: true,
        connectNull: false,
        showMean: false,
        showTrendline: true,
        data: [
            "Kuartal,Uptime Aktual,Target SLA",
            "Q1-23,98.4,99.0",
            "Q2-23,98.9,99.0",
            "Q3-23,99.2,99.5",
            "Q4-23,99.6,99.5",
            "Q1-24,99.3,99.5",
            "Q2-24,99.7,99.5",
            "Q3-24,99.8,99.5",
            "Q4-24,99.9,99.5"
        ].join("\n")
    }
};
