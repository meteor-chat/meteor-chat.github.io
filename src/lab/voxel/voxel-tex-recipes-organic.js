import { TEX } from "./voxel-blocks.js";
import { hash2 } from "./voxel-noise.js";
import { tileFbm, tileNoise } from "./voxel-tex-noise.js";
import { palettePick, shade } from "./voxel-tex-palette.js";

const BARK = [[64, 44, 28], [88, 60, 38], [112, 78, 48], [134, 96, 60], [156, 116, 74]];
const WOOD = [[128, 96, 58], [152, 116, 70], [172, 134, 84], [190, 152, 98]];
const LEAF = [[20, 56, 18], [34, 82, 26], [52, 110, 34], [78, 142, 42], [108, 172, 52]];
const CACTUS = [[40, 92, 40], [56, 118, 48], [74, 144, 58], [98, 168, 72]];
const STEM = [[32, 74, 24], [48, 102, 32], [68, 132, 42]];
const RED_PETAL = [[148, 20, 22], [194, 30, 30], [234, 54, 46], [252, 98, 80]];
const YELLOW_PETAL = [[192, 138, 18], [228, 180, 28], [250, 218, 52], [255, 242, 118]];
const SEAGRASS_PALETTE = [[18, 76, 48], [28, 108, 62], [44, 142, 76], [72, 174, 96]];

const woodSide = (p) => {
    const groove = hash2(p.x, 1, p.seed);
    const along = tileFbm(p.u, p.v, 4, 3, p.seed);
    const t = groove * 0.5 + along * 0.35 + p.px * 0.15;
    const crevice = groove < 0.22;
    const color = palettePick(BARK, crevice ? t * 0.45 : t, p.x, p.y);
    return [...color, 255, crevice ? 0.05 : 0.45 + along * 0.45, 0.9, 0];
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
    const vein = tileNoise(p.u, p.v, 8, p.seed + 19);
    const t = clump * 0.5 + p.px * 0.35 + vein * 0.15;
    const hole = p.px > 0.84 && clump < 0.58;
    if (hole) return [18, 48, 16, 0, 0.08, 0.9, 0];
    const color = palettePick(LEAF, t, p.x, p.y);
    return [...color, 255, 0.15 + t * 0.78, 0.84, 0];
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
        [2, 9, -0.14],
        [4, 12, 0.08],
        [7, 14, -0.06],
        [10, 11, 0.1],
        [13, 13, 0.14]
    ];
    for (const [bx, bh, lean] of blades) {
        if (p.y > bh) continue;
        const cx = Math.round(bx + p.y * lean);
        const half = p.y < 3 ? 1 : 0;
        if (Math.abs(p.x - cx) <= half) {
            const t = Math.min(1, (p.y / bh) * 0.72 + p.px * 0.28);
            return [...palettePick(LEAF, t, p.x, p.y), 255, 0.35 + t * 0.45, 0.86, 0];
        }
    }
    return [34, 78, 24, 0, 0.2, 0.9, 0];
};

const flowerRed = (p) => {
    const stem = (p.y <= 7 && p.x === 7) || (p.y <= 2 && p.x === 8);
    const leaf = (p.y === 3 && p.x === 6) || (p.y === 4 && p.x === 5) || (p.y === 4 && p.x === 8) || (p.y === 5 && p.x === 9);
    if (stem || leaf) {
        return [...palettePick(STEM, (p.y / 8) * 0.7 + p.px * 0.3, p.x, p.y), 255, 0.45, 0.88, 0];
    }
    const inHead =
        (p.y >= 8 && p.y <= 12 && p.x >= 5 && p.x <= 9 &&
            !((p.x === 5 || p.x === 9) && (p.y === 8 || p.y === 12)));
    if (inHead) {
        if (p.x === 7 && p.y === 10) return [36, 18, 16, 255, 0.75, 0.8, 0];
        const edge = p.x === 5 || p.x === 9 || p.y === 8 || p.y === 12;
        const t = edge ? 0.25 + p.px * 0.25 : 0.65 + p.px * 0.35;
        return [...palettePick(RED_PETAL, t, p.x, p.y), 255, 0.65, 0.78, 0];
    }
    return [38, 78, 26, 0, 0.2, 0.9, 0];
};

const flowerYellow = (p) => {
    const stem = p.y <= 7 && p.x === 7;
    const leaf = (p.y === 2 && (p.x === 6 || p.x === 8)) || (p.y === 3 && (p.x === 5 || p.x === 9));
    if (stem || leaf) {
        return [...palettePick(STEM, (p.y / 8) * 0.7 + p.px * 0.3, p.x, p.y), 255, 0.45, 0.88, 0];
    }
    const inHead =
        (p.y >= 8 && p.y <= 11 && p.x >= 5 && p.x <= 9 &&
            !((p.x === 5 || p.x === 9) && p.y === 8));
    if (inHead) {
        const top = p.y >= 10;
        const t = (top ? 0.6 : 0.28) + p.px * 0.35;
        return [...palettePick(YELLOW_PETAL, t, p.x, p.y), 255, 0.65, 0.78, 0];
    }
    return [38, 78, 26, 0, 0.2, 0.9, 0];
};

const seagrass = (p) => {
    const blades = [
        [2, 13, 0.14],
        [5, 15, -0.11],
        [8, 14, 0.12],
        [11, 15, -0.13],
        [13, 12, 0.1]
    ];
    for (const [bx, bh, amp] of blades) {
        if (p.y > bh) continue;
        const cx = Math.round(bx + Math.sin(p.y * 0.45 + bx) * 1.25 + p.y * amp * 0.25);
        const half = p.y < 5 ? 1 : 0;
        if (Math.abs(p.x - cx) <= half) {
            const t = Math.min(1, (p.y / bh) * 0.65 + p.px * 0.35);
            return [...palettePick(SEAGRASS_PALETTE, t, p.x, p.y), 255, 0.35 + t * 0.4, 0.78, 0];
        }
    }
    return [20, 74, 44, 0, 0.2, 0.85, 0];
};

export const ORGANIC_RECIPES = {
    [TEX.WOOD_SIDE]: { seed: 107, fn: woodSide, bump: 2.6 },
    [TEX.WOOD_TOP]: { seed: 108, fn: woodTop, bump: 1.5 },
    [TEX.LEAVES]: { seed: 109, fn: leaves, bump: 2.5 },
    [TEX.CACTUS]: { seed: 118, fn: cactus, bump: 2.2, clampV: true },
    [TEX.CACTUS_TOP]: { seed: 119, fn: cactusTop, bump: 1.6 },
    [TEX.TALL_GRASS]: { seed: 261, fn: tallGrass, bump: 1.4, clampV: true },
    [TEX.SEAGRASS]: { seed: 264, fn: seagrass, bump: 1.3, clampV: true },
    [TEX.FLOWER_RED]: { seed: 262, fn: flowerRed, bump: 1.4, clampV: true },
    [TEX.FLOWER_YELLOW]: { seed: 263, fn: flowerYellow, bump: 1.4, clampV: true }
};
