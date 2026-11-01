export function getStudyHoursPreset() {
    return [
        { x: 1.0, y: 52 },
        { x: 2.0, y: 58 },
        { x: 2.5, y: 61 },
        { x: 3.5, y: 67 },
        { x: 4.0, y: 72 },
        { x: 5.0, y: 77 },
        { x: 6.0, y: 83 },
        { x: 7.0, y: 88 },
        { x: 8.0, y: 92 },
        { x: 9.0, y: 97 }
    ];
}

export function getCarAgePreset() {
    return [
        { x: 1.0, y: 95 },
        { x: 2.0, y: 86 },
        { x: 3.0, y: 77 },
        { x: 4.0, y: 68 },
        { x: 5.0, y: 60 },
        { x: 6.0, y: 51 },
        { x: 7.0, y: 44 },
        { x: 8.0, y: 35 },
        { x: 9.0, y: 28 },
        { x: 10.0, y: 22 }
    ];
}

export function getOutlierPreset() {
    return [
        { x: 1.0, y: 20 },
        { x: 2.0, y: 26 },
        { x: 3.0, y: 31 },
        { x: 4.0, y: 37 },
        { x: 5.0, y: 42 },
        { x: 6.0, y: 48 },
        { x: 7.0, y: 53 },
        { x: 8.0, y: 59 },
        { x: 3.0, y: 95 }
    ];
}

export function getRandomPreset() {
    return [
        { x: 1.5, y: 78 },
        { x: 2.2, y: 34 },
        { x: 3.8, y: 85 },
        { x: 4.5, y: 40 },
        { x: 5.2, y: 92 },
        { x: 6.1, y: 30 },
        { x: 7.4, y: 75 },
        { x: 8.3, y: 45 },
        { x: 9.0, y: 82 }
    ];
}

export function getHouseAreaPreset() {
    return [
        { x: 2.0, y: 35 },
        { x: 3.0, y: 48 },
        { x: 4.0, y: 56 },
        { x: 5.0, y: 66 },
        { x: 6.0, y: 75 },
        { x: 7.0, y: 84 },
        { x: 8.0, y: 96 },
        { x: 9.5, y: 110 }
    ];
}

export const PRESET_INFOS = {
    "study-hours": {
        name: "Jam Belajar vs Nilai Ujian",
        xLabel: "Jam Belajar (jam)",
        yLabel: "Nilai Ujian (0-100)",
        desc: "Korelasi positif kuat. Semakin banyak jam belajar, semakin tinggi nilai ujian yang diraih."
    },
    "car-age": {
        name: "Usia Mobil vs Harga Jual",
        xLabel: "Usia Mobil (tahun)",
        yLabel: "Harga Jual (juta)",
        desc: "Korelasi negatif kuat. Semakin tua usia mobil, harga jualnya cenderung turun."
    },
    "outlier": {
        name: "Uji Distorsi Pencilan (Outlier)",
        xLabel: "Variabel X",
        yLabel: "Variabel Y",
        desc: "Satu titik pencilan ekstrem dapat menarik garis OLS dan menggeser kemiringan secara drastis."
    },
    "random": {
        name: "Data Acak / Noise Tinggi",
        xLabel: "Variabel X",
        yLabel: "Variabel Y",
        desc: "Hubungan linear sangat lemah, nilai R² mendekati 0."
    },
    "house-area": {
        name: "Luas Rumah vs Harga Jual",
        xLabel: "Luas (10 m²)",
        yLabel: "Harga (puluh juta)",
        desc: "Contoh regresi klasik dunia properti dengan tren kenaikan stabil."
    }
};
