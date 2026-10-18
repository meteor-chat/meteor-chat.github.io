export const CATEGORY_SLUGS = {
    "Kecerdasan Artifisial": "ai",
    "Teori Peluang": "pt",
    "Matematika Dasar": "",
    "Kalkulus": "cal",
    "Matematika Diskrit": "dm",
    "Matriks Vektor": "vm",
    "Bangun Ruang": "g"
};

export const SLUG_TO_CATEGORY = {
    ai: "Kecerdasan Artifisial",
    pt: "Teori Peluang",
    cal: "Kalkulus",
    dm: "Matematika Diskrit",
    vm: "Matriks Vektor",
    g: "Bangun Ruang"
};

export const FORMULA_CATEGORIES = [
    null,
    "Kecerdasan Artifisial",
    "Kecerdasan Artifisial",
    "Kecerdasan Artifisial",
    "Kecerdasan Artifisial",
    "Kecerdasan Artifisial",
    "Kecerdasan Artifisial",
    "Kecerdasan Artifisial",
    "Kecerdasan Artifisial",
    "Kecerdasan Artifisial",
    "Teori Peluang",
    "Teori Peluang",
    "Teori Peluang",
    "Teori Peluang",
    "Matematika Dasar",
    "Kalkulus",
    "Kalkulus",
    "Kalkulus",
    "Kalkulus",
    "Matematika Diskrit",
    "Matriks Vektor",
    "Matematika Dasar",
    "Matematika Dasar",
    "Bangun Ruang",
    "Bangun Ruang"
];

export function getFormulaUrl(id) {
    const num = Number(id);
    if (!num || num < 1 || num >= FORMULA_CATEGORIES.length) return "/math";
    const cat = FORMULA_CATEGORIES[num];
    const slug = CATEGORY_SLUGS[cat];
    return slug ? `/math/${slug}/${num}` : `/math/${num}`;
}

export function parseFormulaUrl(pathname) {
    if (!pathname) return null;
    const clean = pathname.replace(/\/+$/, "");
    const parts = clean.split("/").filter(Boolean);
    if (parts.length < 2 || parts[0] !== "math") return null;
    if (parts.length === 2) {
        const id = Number(parts[1]);
        if (!isNaN(id) && id >= 1 && id < FORMULA_CATEGORIES.length) {
            const cat = FORMULA_CATEGORIES[id];
            if (CATEGORY_SLUGS[cat] === "") return { id, category: cat };
        }
        return null;
    }
    if (parts.length === 3) {
        const slug = parts[1];
        const id = Number(parts[2]);
        if (!isNaN(id) && id >= 1 && id < FORMULA_CATEGORIES.length) {
            const cat = FORMULA_CATEGORIES[id];
            if (CATEGORY_SLUGS[cat] === slug) return { id, category: cat };
        }
        return null;
    }
    return null;
}

export function isMathMenuUrl(pathname) {
    if (!pathname) return false;
    const clean = pathname.replace(/\/+$/, "");
    return clean === "/math" || clean === "/math.html" || clean === "math" || clean === "math.html";
}
