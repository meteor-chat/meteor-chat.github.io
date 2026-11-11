export const PRESETS = {
    benchmark: [
        "Apple M3 Max: 3120",
        "Intel i9-14900K: 2890",
        "AMD Ryzen 7950X: 2850",
        "Snapdragon X: 2420",
        "Apple M2 Ultra: 2800",
        "Intel Ultra 7: 2150",
        "Google Tensor G4: 1850"
    ].join("\n"),

    finance: [
        "Q1 2023: 420.5",
        "Q2 2023: -180.2",
        "Q3 2023: 310.8",
        "Q4 2023: 550.0",
        "Q1 2024: -95.4",
        "Q2 2024: 680.1",
        "Q3 2024: -45.0",
        "Q4 2024: 820.0"
    ].join("\n"),

    languages: [
        "Python: 68.2",
        "JavaScript: 62.5",
        "TypeScript: 38.8",
        "Rust: 31.4",
        "Go: 28.6",
        "C++: 22.4",
        "Java: 20.1",
        "Kotlin: 17.5",
        "Swift: 14.8"
    ].join("\n")
};

export function getPresetData(key) {
    if (Object.prototype.hasOwnProperty.call(PRESETS, key)) {
        return PRESETS[key];
    }
    return PRESETS.benchmark;
}
