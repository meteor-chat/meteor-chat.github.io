import { TEX } from "./voxel-blocks.js";
import { tileFbm, tileNoise } from "./voxel-tex-noise.js";
import { palettePick } from "./voxel-tex-palette.js";

const ORANGE = [[176, 92, 34], [204, 118, 48], [226, 146, 66], [240, 176, 100]];
const BLACK = [[16, 16, 20], [28, 28, 34], [42, 42, 50], [60, 60, 70]];
const WHITE = [[204, 204, 206], [224, 224, 226], [240, 240, 241], [252, 252, 252]];
const SAND = [[166, 138, 96], [188, 160, 116], [208, 182, 136], [228, 206, 162]];
const ROBE = [[86, 56, 36], [108, 72, 46], [130, 88, 58], [148, 104, 70]];
const FARMER_ROBE = [[72, 92, 44], [94, 118, 56], [116, 142, 70], [138, 162, 86]];
const SMITH_ROBE = [[42, 44, 50], [58, 60, 68], [76, 78, 86], [94, 96, 104]];
const CLERIC_ROBE = [[74, 38, 96], [96, 52, 122], [118, 68, 148], [140, 86, 170]];
const GOLEM_METAL = [[164, 158, 150], [186, 180, 172], [208, 202, 194], [228, 224, 216]];
const GOLEM_VINE = [[46, 98, 42], [68, 128, 56], [92, 152, 72]];
const SKIN = [[166, 118, 86], [184, 136, 102], [202, 152, 118], [216, 168, 134]];

const EYES = {
    orange: [120, 204, 70],
    black: [232, 202, 60],
    calico: [214, 152, 52],
    white: [96, 164, 232],
    sand: [222, 192, 72]
};
const NOSE = [226, 150, 156];
const MOUTH = [70, 40, 44];
const BEAK = [[218, 142, 34], [238, 168, 48], [252, 192, 68], [255, 214, 98]];
const WATTLE = [[168, 28, 32], [204, 38, 44], [232, 54, 58], [248, 82, 86]];

const baseTone = (p) => tileFbm(p.u, p.v, 4, 3, p.seed) * 0.5 + p.px * 0.5;

const furOrange = (p) => {
    const base = baseTone(p);
    const shift = Math.floor(tileNoise(p.u, p.v, 4, p.seed + 5) * 3);
    const band = ((p.x + shift) & 3) === 0;
    return [...palettePick(ORANGE, band ? base * 0.45 : base, p.x, p.y), 255, 0.4 + base * 0.4, 0.92, 0];
};

const furBlack = (p) => {
    const base = baseTone(p);
    return [...palettePick(BLACK, base, p.x, p.y), 255, 0.5 + base * 0.3, 0.9, 0];
};

const furWhite = (p) => {
    const base = baseTone(p);
    return [...palettePick(WHITE, 0.35 + base * 0.65, p.x, p.y), 255, 0.35 + base * 0.4, 0.9, 0];
};

const furSand = (p) => {
    const base = baseTone(p);
    const shade = tileNoise(p.u, p.v, 4, p.seed + 9) * 0.25;
    return [...palettePick(SAND, base * 0.85 + shade, p.x, p.y), 255, 0.35 + base * 0.4, 0.92, 0];
};

const furCalico = (p) => {
    const patch = tileFbm(p.u, p.v, 4, 2, p.seed + 17);
    const base = baseTone(p);
    let palette = WHITE;
    let tone = 0.4 + base * 0.6;
    if (patch < 0.4) {
        palette = ORANGE;
        tone = base;
    } else if (patch > 0.6) {
        palette = BLACK;
        tone = base;
    }
    return [...palettePick(palette, tone, p.x, p.y), 255, 0.4 + base * 0.4, 0.9, 0];
};

const inBox = (p, x0, y0, x1, y1) => p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1;

function faceOf(fur, variant) {
    const eye = EYES[variant];
    return (p) => {
        if (inBox(p, 3, 8, 4, 9) || inBox(p, 11, 8, 12, 9)) {
            const pupil = p.y === 8 && (p.x === 4 || p.x === 11);
            return pupil ? [14, 12, 14, 255, 0.3, 0.35, 0] : [...eye, 255, 0.35, 0.35, 0.16];
        }
        if (inBox(p, 7, 6, 8, 6)) return [...NOSE, 255, 0.45, 0.55, 0];
        if (inBox(p, 7, 4, 8, 4)) return [...MOUTH, 255, 0.3, 0.72, 0];
        if (p.y === 4 && (p.x === 6 || p.x === 9)) return [...MOUTH, 255, 0.3, 0.72, 0];
        return fur(p);
    };
}

const chickenFeather = (p) => {
    const base = baseTone(p);
    return [...palettePick(WHITE, 0.45 + base * 0.55, p.x, p.y), 255, 0.35 + base * 0.4, 0.9, 0];
};

const chickenFace = (p) => {
    if (inBox(p, 3, 8, 4, 9) || inBox(p, 11, 8, 12, 9)) {
        const pupil = p.x === 4 || p.x === 11;
        return pupil ? [18, 18, 22, 255, 0.3, 0.35, 0] : [244, 244, 248, 255, 0.35, 0.4, 0];
    }
    return chickenFeather(p);
};

const chickenBeak = (p) => {
    const base = baseTone(p);
    return [...palettePick(BEAK, 0.35 + base * 0.65, p.x, p.y), 255, 0.45 + base * 0.4, 0.85, 0];
};

const chickenWattle = (p) => {
    const base = baseTone(p);
    return [...palettePick(WATTLE, 0.35 + base * 0.65, p.x, p.y), 255, 0.4 + base * 0.4, 0.72, 0];
};

const villagerRobe = (p) => {
    if (p.y === 5 || p.y === 6) {
        const buckle = p.x >= 7 && p.x <= 8;
        return buckle ? [196, 168, 72, 255, 0.75, 0.35, 0] : [48, 34, 24, 255, 0.35, 0.88, 0];
    }
    if (p.y >= 14 && p.x >= 5 && p.x <= 10) {
        return [64, 42, 28, 255, 0.3, 0.9, 0];
    }
    const base = baseTone(p);
    const fold = p.x === 7 || p.x === 8 ? -0.18 : 0;
    return [...palettePick(ROBE, base + fold, p.x, p.y), 255, 0.4 + base * 0.3, 0.9, 0];
};

const villagerSkin = (p) => {
    const base = baseTone(p);
    return [...palettePick(SKIN, base, p.x, p.y), 255, 0.4 + base * 0.25, 0.85, 0];
};

const villagerFace = (p) => {
    if (p.y === 11 && p.x >= 3 && p.x <= 12) {
        return [62, 42, 28, 255, 0.55, 0.88, 0];
    }
    if (inBox(p, 3, 8, 5, 9) || inBox(p, 10, 8, 12, 9)) {
        const emerald = (p.x === 4 || p.x === 11) && p.y === 8;
        return emerald ? [48, 152, 74, 255, 0.4, 0.4, 0] : [242, 242, 244, 255, 0.38, 0.45, 0];
    }
    if (p.y === 4 && p.x >= 6 && p.x <= 9) {
        return [112, 72, 54, 255, 0.32, 0.85, 0];
    }
    return villagerSkin(p);
};

const villagerFarmer = (p) => {
    if (p.y === 5 || p.y === 6) {
        const pouch = p.x >= 10 && p.x <= 12;
        return pouch ? [208, 172, 72, 255, 0.55, 0.82, 0] : [78, 52, 32, 255, 0.38, 0.88, 0];
    }
    if (p.y >= 13 && p.x >= 5 && p.x <= 10) {
        return [182, 146, 76, 255, 0.42, 0.86, 0];
    }
    const base = baseTone(p);
    const fold = p.x === 7 || p.x === 8 ? -0.16 : 0;
    return [...palettePick(FARMER_ROBE, base + fold, p.x, p.y), 255, 0.4 + base * 0.3, 0.9, 0];
};

const villagerSmith = (p) => {
    if (p.y === 6 && p.x >= 6 && p.x <= 9) {
        return [176, 182, 192, 255, 0.82, 0.32, 0];
    }
    if (p.y >= 13 && (p.x === 5 || p.x === 10)) {
        return [102, 66, 40, 255, 0.4, 0.86, 0];
    }
    const base = baseTone(p);
    const apron = p.x >= 4 && p.x <= 11 && p.y >= 2 && p.y <= 12;
    const pal = apron ? SMITH_ROBE : ROBE;
    return [...palettePick(pal, base, p.x, p.y), 255, 0.45 + base * 0.3, apron ? 0.72 : 0.9, 0];
};

const villagerCleric = (p) => {
    if (p.y === 5 || p.y === 6 || (p.x >= 7 && p.x <= 8 && p.y <= 13)) {
        return [212, 176, 68, 255, 0.72, 0.4, 0];
    }
    const base = baseTone(p);
    return [...palettePick(CLERIC_ROBE, base, p.x, p.y), 255, 0.42 + base * 0.3, 0.86, 0];
};

const golemIron = (p) => {
    const seam = p.y === 0 || p.y === 8 || (p.x === 0 && (p.y & 7) > 0);
    if (seam) return [116, 112, 106, 255, 0.25, 0.65, 0];
    const vine = tileFbm(p.u, p.v, 4, 2, p.seed + 19);
    if (vine > 0.73 && p.x >= 2 && p.x <= 13) {
        const vt = (vine - 0.73) / 0.27;
        return [...palettePick(GOLEM_VINE, vt * 0.65 + p.px * 0.35, p.x, p.y), 255, 0.48, 0.86, 0];
    }
    const rivet = (p.x === 2 || p.x === 13) && (p.y === 2 || p.y === 10);
    if (rivet) return [134, 130, 124, 255, 0.82, 0.4, 0];
    const base = baseTone(p);
    return [...palettePick(GOLEM_METAL, base, p.x, p.y), 255, 0.55 + base * 0.3, 0.46, 0];
};

const golemFace = (p) => {
    if (p.y >= 11 && p.y <= 12 && p.x >= 2 && p.x <= 13) {
        return [122, 116, 110, 255, 0.35, 0.62, 0];
    }
    if (inBox(p, 3, 8, 5, 9) || inBox(p, 10, 8, 12, 9)) {
        const glow = (p.x === 4 || p.x === 11) && p.y === 8;
        return glow ? [246, 142, 46, 255, 0.6, 0.28, 0.92] : [48, 34, 28, 255, 0.2, 0.75, 0];
    }
    if (p.y >= 4 && p.y <= 7 && p.x >= 6 && p.x <= 9) {
        return [148, 142, 134, 255, 0.68, 0.52, 0];
    }
    return golemIron(p);
};

export const MOB_RECIPES = {
    [TEX.CAT_FUR_ORANGE]: { seed: 201, fn: furOrange, bump: 1.2 },
    [TEX.CAT_FUR_BLACK]: { seed: 202, fn: furBlack, bump: 1.0 },
    [TEX.CAT_FUR_CALICO]: { seed: 203, fn: furCalico, bump: 1.2 },
    [TEX.CAT_FUR_WHITE]: { seed: 204, fn: furWhite, bump: 1.0 },
    [TEX.CAT_FUR_SAND]: { seed: 205, fn: furSand, bump: 1.0 },
    [TEX.CAT_FACE_ORANGE]: { seed: 201, fn: faceOf(furOrange, "orange"), bump: 1.2 },
    [TEX.CAT_FACE_BLACK]: { seed: 202, fn: faceOf(furBlack, "black"), bump: 1.0 },
    [TEX.CAT_FACE_CALICO]: { seed: 203, fn: faceOf(furCalico, "calico"), bump: 1.2 },
    [TEX.CAT_FACE_WHITE]: { seed: 204, fn: faceOf(furWhite, "white"), bump: 1.0 },
    [TEX.CAT_FACE_SAND]: { seed: 205, fn: faceOf(furSand, "sand"), bump: 1.0 },
    [TEX.CHICKEN_FEATHER]: { seed: 251, fn: chickenFeather, bump: 1.0 },
    [TEX.CHICKEN_FACE]: { seed: 252, fn: chickenFace, bump: 1.0 },
    [TEX.CHICKEN_BEAK]: { seed: 253, fn: chickenBeak, bump: 0.8 },
    [TEX.CHICKEN_WATTLE]: { seed: 254, fn: chickenWattle, bump: 0.8 },
    [TEX.VILLAGER_ROBE]: { seed: 271, fn: villagerRobe, bump: 1.2, clampV: true },
    [TEX.VILLAGER_SKIN]: { seed: 272, fn: villagerSkin, bump: 0.8 },
    [TEX.VILLAGER_FACE]: { seed: 273, fn: villagerFace, bump: 1.0, clampV: true },
    [TEX.VILLAGER_FARMER]: { seed: 274, fn: villagerFarmer, bump: 1.2, clampV: true },
    [TEX.VILLAGER_SMITH]: { seed: 275, fn: villagerSmith, bump: 1.3, clampV: true },
    [TEX.VILLAGER_CLERIC]: { seed: 276, fn: villagerCleric, bump: 1.2, clampV: true },
    [TEX.GOLEM_IRON]: { seed: 281, fn: golemIron, bump: 1.8 },
    [TEX.GOLEM_FACE]: { seed: 282, fn: golemFace, bump: 1.5, clampV: true }
};
