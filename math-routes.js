export const CATEGORY_SLUGS = {
    "Kecerdasan Artifisial": "ai",
    "Teori Peluang": "pt",
    "Matematika Dasar": "",
    "Kalkulus": "cal",
    "Matematika Diskrit": "dm",
    "Matriks Vektor": "vm",
    "Bangun Ruang": "g",
    "Manajemen Proyek": "pm"
};

export const SLUG_TO_CATEGORY = {
    ai: "Kecerdasan Artifisial",
    pt: "Teori Peluang",
    cal: "Kalkulus",
    dm: "Matematika Diskrit",
    vm: "Matriks Vektor",
    g: "Bangun Ruang",
    pm: "Manajemen Proyek"
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
    "Bangun Ruang",
    "Manajemen Proyek"
];

export const FORMULA_URLS = [
    null,
    "/math/ai/1",
    "/math/ai/2",
    "/math/ai/3",
    "/math/ai/4",
    "/math/ai/5",
    "/math/ai/6",
    "/math/ai/7",
    "/math/ai/8",
    "/math/ai/9",
    "/math/pt/1",
    "/math/pt/2",
    "/math/pt/3",
    "/math/pt/4",
    "/math/1",
    "/math/cal/1",
    "/math/cal/2",
    "/math/cal/3",
    "/math/cal/4",
    "/math/dm/1",
    "/math/vm/1",
    "/math/2",
    "/math/3",
    "/math/g/1",
    "/math/g/2",
    "/math/pm/1"
];

const URL_TO_ID = {
    "/math/ai/1": 1,
    "/math/ai/2": 2,
    "/math/ai/3": 3,
    "/math/ai/4": 4,
    "/math/ai/5": 5,
    "/math/ai/6": 6,
    "/math/ai/7": 7,
    "/math/ai/8": 8,
    "/math/ai/9": 9,
    "/math/pt/1": 10,
    "/math/pt/2": 11,
    "/math/pt/3": 12,
    "/math/pt/4": 13,
    "/math/1": 14,
    "/math/cal/1": 15,
    "/math/cal/2": 16,
    "/math/cal/3": 17,
    "/math/cal/4": 18,
    "/math/dm/1": 19,
    "/math/vm/1": 20,
    "/math/2": 21,
    "/math/3": 22,
    "/math/g/1": 23,
    "/math/g/2": 24,
    "/math/pt/10": 10,
    "/math/pt/11": 11,
    "/math/pt/12": 12,
    "/math/pt/13": 13,
    "/math/14": 14,
    "/math/cal/15": 15,
    "/math/cal/16": 16,
    "/math/cal/17": 17,
    "/math/cal/18": 18,
    "/math/dm/19": 19,
    "/math/vm/20": 20,
    "/math/21": 21,
    "/math/22": 22,
    "/math/g/23": 23,
    "/math/g/24": 24,
    "/math/pm/1": 25,
    "/math/pm/25": 25
};

export function getFormulaUrl(id) {
    const num = Number(id);
    if (!num || num < 1 || num >= FORMULA_URLS.length) return "/math";
    return FORMULA_URLS[num];
}

export function parseFormulaUrl(pathname) {
    if (!pathname) return null;
    const clean = pathname.replace(/\/+$/, "");
    const id = URL_TO_ID[clean];
    if (id) {
        return { id, category: FORMULA_CATEGORIES[id] };
    }
    return null;
}

export function isMathMenuUrl(pathname) {
    if (!pathname) return false;
    const clean = pathname.replace(/\/+$/, "");
    return clean === "/math" || clean === "/math.html" || clean === "math" || clean === "math.html";
}
