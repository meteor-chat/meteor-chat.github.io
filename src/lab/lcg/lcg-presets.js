export const LCG_PRESETS = [
    {
        id: "prompt",
        name: "Simulasi Sederhana (Contoh Prompt)",
        desc: "Nilai kecil m=8, a=5, c=3, X₀=1. Memenuhi Teorema Hull-Dobell dan memiliki periode penuh 8.",
        m: 8,
        a: 5,
        c: 3,
        x0: 1
    },
    {
        id: "short",
        name: "Periode Pendek (Gagal Hull-Dobell)",
        desc: "m=8, a=4, c=2, X₀=1. FPB(c, m)=2 ≠ 1. Terjebak dalam siklus pendek hanya beberapa angka.",
        m: 8,
        a: 4,
        c: 2,
        x0: 1
    },
    {
        id: "multiplicative",
        name: "Multiplicative Congruential (c = 0)",
        desc: "m=17, a=3, c=0, X₀=1. Generator murni pengali tanpa penambahan konstanta.",
        m: 17,
        a: 3,
        c: 0,
        x0: 1
    },
    {
        id: "zx",
        name: "ZX Spectrum ROM",
        desc: "m=65537 (2¹⁶+1), a=75, c=0, X₀=1. Algoritma bawaan mikrokomputer legendaris Sinclair ZX Spectrum.",
        m: 65537,
        a: 75,
        c: 0,
        x0: 1
    },
    {
        id: "ansic",
        name: "ANSI C (rand)",
        desc: "m=2³¹, a=1103515245, c=12345, X₀=12345. Implementasi klasik pustaka standar C stdlib.",
        m: 2147483648,
        a: 1103515245,
        c: 12345,
        x0: 12345
    },
    {
        id: "minstd",
        name: "MINSTD / Lehmer",
        desc: "m=2³¹-1 (prima Mersenne), a=16807, c=0, X₀=1. Generator standar Park-Miller.",
        m: 2147483647,
        a: 16807,
        c: 0,
        x0: 1
    }
];

export function getPresetById(id) {
    return LCG_PRESETS.find((p) => p.id === id) || LCG_PRESETS[0];
}
