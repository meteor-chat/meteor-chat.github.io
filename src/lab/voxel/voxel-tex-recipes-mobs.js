import { TEX } from "./voxel-blocks.js";
import { tileFbm, tileNoise } from "./voxel-tex-noise.js";
import { palettePick } from "./voxel-tex-palette.js";

const ORANGE = [[176, 92, 34], [204, 118, 48], [226, 146, 66], [240, 176, 100]];
const BLACK = [[16, 16, 20], [28, 28, 34], [42, 42, 50], [60, 60, 70]];
const WHITE = [[204, 204, 206], [224, 224, 226], [240, 240, 241], [252, 252, 252]];
const SAND = [[166, 138, 96], [188, 160, 116], [208, 182, 136], [228, 206, 162]];

const EYES = {
    orange: [120, 204, 70],
    black: [232, 202, 60],
    calico: [214, 152, 52],
    white: [96, 164, 232],
    sand: [222, 192, 72]
};
const NOSE = [226, 150, 156];
const MOUTH = [70, 40, 44];

const baseTone = (p) => tileFbm(p.u, p.v, 4, 3, p.seed) * 0.5 + p.px * 0.5;

const furOrange = (p) => {
    const base = baseTone(p);
    const shift = Math.floor(tileNoise(p.u, p.v, 3, p.seed + 5) * 3);
    const band = ((p.x + shift) & 3) === 0;
    return [...palettePick(ORANGE, band ? base * 0.45 : base, p.x, p.y), 255, 0.4 + base * 0.4, 0.92, 0];
};

const furBlack = (p) => {
    const base = baseTone(p);
    return [...palettePick(BLACK, base, p.x, p.y), 255, 0.5 + base * 0.3, 0.62, 0];
};

const furWhite = (p) => {
    const base = baseTone(p);
    return [...palettePick(WHITE, 0.35 + base * 0.65, p.x, p.y), 255, 0.35 + base * 0.4, 0.9, 0];
};

const furSand = (p) => {
    const base = baseTone(p);
    const shade = tileNoise(p.u, p.v, 2, p.seed + 9) * 0.25;
    return [...palettePick(SAND, base * 0.85 + shade, p.x, p.y), 255, 0.35 + base * 0.4, 0.92, 0];
};

const furCalico = (p) => {
    const patch = tileFbm(p.u, p.v, 3, 2, p.seed + 17);
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
            return pupil ? [14, 12, 14, 255, 0.3, 0.3, 0] : [...eye, 255, 0.35, 0.3, 0.18];
        }
        if (inBox(p, 7, 6, 8, 6)) return [...NOSE, 255, 0.45, 0.5, 0];
        if (inBox(p, 7, 4, 8, 5) && !(p.y === 5)) return [...MOUTH, 255, 0.3, 0.7, 0];
        if (p.y === 4 && (p.x === 6 || p.x === 9)) return [...MOUTH, 255, 0.3, 0.7, 0];
        return fur(p);
    };
}

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
    [TEX.CAT_FACE_SAND]: { seed: 205, fn: faceOf(furSand, "sand"), bump: 1.0 }
};
