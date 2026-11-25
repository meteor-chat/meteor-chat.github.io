import { TEX } from "./voxel-blocks.js";
import { hash2 } from "./voxel-noise.js";
import { tileFbm, tileNoise } from "./voxel-tex-noise.js";
import { palettePick, shade } from "./voxel-tex-palette.js";

const BARK = [[70, 48, 32], [92, 64, 40], [114, 80, 50], [136, 98, 62], [158, 118, 76]];
const WOOD = [[128, 96, 58], [152, 116, 70], [172, 134, 84], [190, 152, 98]];
const LEAF = [[34, 78, 28], [52, 108, 36], [72, 136, 44], [98, 162, 54], [128, 188, 68]];
const CACTUS = [[40, 92, 40], [56, 118, 48], [74, 144, 58], [98, 168, 72]];
const STEM = [[38, 86, 28], [54, 114, 36], [72, 142, 46]];
const RED_PETAL = [[164, 24, 26], [208, 34, 34], [242, 62, 52], [255, 110, 88]];
const YELLOW_PETAL = [[206, 152, 22], [238, 192, 34], [254, 224, 62], [255, 244, 128]];

const woodSide = (p) => {
    const groove = hash2(p.x, 1, p.seed);
    const along = tileFbm(p.u, p.v, 4, 3, p.seed);
    const t = groove * 0.5 + along * 0.35 + p.px * 0.15;
    const crevice = groove < 0.22;
    const color = palettePick(BARK, crevice ? t * 0.5 : t, p.x, p.y);
    return [...color, 255, crevice ? 0.05 : 0.45 + along * 0.4, 0.9, 0];
};

const woodTop = (p) => {
    const edge = Math.min(p.x, p.y, 15 - p.x, 15 - p.y);
    if (edge < 2) {
        const t = tileFbm(p.u, p.v, 4, 2, p.seed) * 0.6 + p.px * 0.4;
        return [...palettePick(BARK, t, p.x, p.y), 255, 0.5 + (edge === 1 ? 0.2 : 0), 0.9, 0];
    }
    const d = Math.hypot(p.x - 7.5, p.y - 7.5) + tileNoise(p.u, p.v, 4, p.seed) * 1.4;
    const ring = (Math.sin(d * 1.9) + 1) * 0.5;
    const color = palettePick(WOOD, ring * 0.8 + p.px * 0.2, p.x, p.y);
    return [...color, 255, 0.35 + ring * 0.4, 0.8, 0];
};

const leaves = (p) => {
    const clump = tileFbm(p.u, p.v, 4, 3, p.seed);
    const t = clump * 0.55 + p.px * 0.45;
    const hole = p.px > 0.92 && clump < 0.55;
    if (hole) return [36, 82, 30, 0, 0.1, 0.9, 0];
    const color = palettePick(LEAF, t, p.x, p.y);
    return [...color, 255, 0.2 + t * 0.7, 0.82, 0];
};

const cactus = (p) => {
    const rib = p.x % 4 === 0 ? 0.15 : 0.7 + (p.x % 4 === 2 ? 0.1 : 0);
    const t = rib * 0.7 + tileFbm(p.u, p.v, 4, 2, p.seed) * 0.3;
    const spine = p.x % 4 === 1 && p.y % 5 === 2;
    if (spine) return [...shade(CACTUS[3], 60), 255, 0.95, 0.5, 0];
    return [...palettePick(CACTUS, t, p.x, p.y), 255, rib, 0.7, 0];
};

const cactusTop = (p) => {
    const d = Math.hypot(p.x - 7.5, p.y - 7.5);
    const rim = Math.min(p.x, p.y, 15 - p.x, 15 - p.y) <= 1;
    const t = rim ? 0.22 : Math.max(0, Math.min(1, 0.85 - d * 0.08 + p.px * 0.2));
    return [...palettePick(CACTUS, t, p.x, p.y), 255, rim ? 0.35 : 0.65, 0.75, 0];
};

const tallGrass = (p) => {
    const blades = [
        [2, 9, -0.15],
        [5, 13, 0.1],
        [8, 12, -0.08],
        [11, 14, 0.12],
        [13, 10, 0.18]
    ];
    for (const [bx, bh, lean] of blades) {
        if (p.y > bh) continue;
        const cx = bx + p.y * lean;
        if (Math.abs(p.x - cx) <= (p.y < bh - 2 ? 0.85 : 0.45)) {
            const t = Math.min(1, (p.y / bh) * 0.75 + p.px * 0.25);
            return [...palettePick(LEAF, t, p.x, p.y), 255, 0.4 + t * 0.4, 0.86, 0];
        }
    }
    return [48, 100, 34, 0, 0.2, 0.9, 0];
};

const flowerRed = (p) => {
    const inStem = p.y <= 8 && (p.x === 7 || p.x === 8) && (p.y < 7 || p.x === 7);
    const inLeaf = (p.y === 3 && p.x === 6) || (p.y === 4 && p.x === 5) || (p.y === 5 && p.x === 9) || (p.y === 6 && p.x === 10);
    if (inStem || inLeaf) {
        return [...palettePick(STEM, (p.y / 9) * 0.7 + p.px * 0.3, p.x, p.y), 255, 0.5, 0.88, 0];
    }
    const dx = p.x - 7.5;
    const dy = p.y - 10.5;
    const d = Math.hypot(dx, dy);
    if (d <= 3.1) {
        if (d < 1.1) return [42, 22, 18, 255, 0.7, 0.8, 0];
        const t = Math.min(1, (d / 3.1) * 0.7 + p.px * 0.3);
        return [...palettePick(RED_PETAL, t, p.x, p.y), 255, 0.65, 0.78, 0];
    }
    return [50, 95, 34, 0, 0.2, 0.9, 0];
};

const flowerYellow = (p) => {
    const inStem = p.y <= 8 && p.x === 7;
    const inLeaf = (p.y === 3 && (p.x === 6 || p.x === 8)) || (p.y === 4 && (p.x === 5 || p.x === 9));
    if (inStem || inLeaf) {
        return [...palettePick(STEM, (p.y / 9) * 0.7 + p.px * 0.3, p.x, p.y), 255, 0.5, 0.88, 0];
    }
    const dx = p.x - 7.5;
    const dy = p.y - 10.5;
    const d = Math.hypot(dx, dy);
    if (d <= 2.9) {
        const t = Math.min(1, 0.25 + (1 - d / 3.2) * 0.55 + p.px * 0.25);
        return [...palettePick(YELLOW_PETAL, t, p.x, p.y), 255, 0.65, 0.78, 0];
    }
    return [50, 95, 34, 0, 0.2, 0.9, 0];
};

export const ORGANIC_RECIPES = {
    [TEX.WOOD_SIDE]: { seed: 107, fn: woodSide, bump: 2.4 },
    [TEX.WOOD_TOP]: { seed: 108, fn: woodTop, bump: 1.4 },
    [TEX.LEAVES]: { seed: 109, fn: leaves, bump: 2.0 },
    [TEX.CACTUS]: { seed: 118, fn: cactus, bump: 2.2, clampV: true },
    [TEX.CACTUS_TOP]: { seed: 119, fn: cactusTop, bump: 1.6 },
    [TEX.TALL_GRASS]: { seed: 261, fn: tallGrass, bump: 1.2, clampV: true },
    [TEX.FLOWER_RED]: { seed: 262, fn: flowerRed, bump: 1.2, clampV: true },
    [TEX.FLOWER_YELLOW]: { seed: 263, fn: flowerYellow, bump: 1.2, clampV: true }
};
