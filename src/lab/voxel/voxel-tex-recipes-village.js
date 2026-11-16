import { TEX } from "./voxel-blocks.js";
import { hash2 } from "./voxel-noise.js";
import { tileFbm, tileNoise } from "./voxel-tex-noise.js";
import { palettePick, shade } from "./voxel-tex-palette.js";

const STONE_BRICK_PALETTE = [[75, 78, 84], [96, 100, 108], [122, 126, 134], [148, 152, 160]];
const PLASTER_PALETTE = [[208, 202, 188], [224, 218, 206], [238, 234, 222], [248, 246, 236]];
const ROOF_RED_PALETTE = [[142, 50, 36], [172, 64, 46], [202, 80, 58], [226, 104, 76]];
const ROOF_GREEN_PALETTE = [[34, 74, 54], [46, 98, 72], [64, 128, 94], [84, 156, 118]];
const PLANKS_PALETTE = [[132, 94, 56], [156, 114, 70], [176, 132, 82], [196, 150, 96]];
const WHEAT_PALETTE = [[162, 118, 32], [192, 146, 40], [220, 172, 54], [244, 202, 78]];
const HAY_PALETTE = [[174, 134, 44], [202, 162, 58], [226, 186, 74], [244, 208, 96]];
const COBBLE_PALETTE = [[68, 70, 76], [90, 92, 100], [112, 114, 124], [136, 140, 150]];

const stoneBrick = (p) => {
    const row = Math.floor(p.y / 4);
    const colOffset = (row % 2 === 1) ? 4 : 0;
    const col = (p.x + colOffset) % 8;
    const isMortar = (p.y % 4 === 0) || (col === 0);
    if (isMortar) {
        return [...shade(STONE_BRICK_PALETTE[0], -28), 255, 0.1, 0.95, 0];
    }
    const noise = tileFbm(p.u, p.v, 4, 2, p.seed);
    const t = noise * 0.6 + p.px * 0.4;
    const color = palettePick(STONE_BRICK_PALETTE, t, p.x, p.y);
    return [...color, 255, 0.4 + t * 0.4, 0.8, 0];
};

const plaster = (p) => {
    const grain = tileFbm(p.u, p.v, 4, 3, p.seed);
    const t = grain * 0.5 + p.px * 0.5;
    const color = palettePick(PLASTER_PALETTE, t, p.x, p.y);
    return [...color, 255, 0.45 + grain * 0.2, 0.92, 0];
};

const roofRed = (p) => {
    const row = p.y % 4;
    const isShade = row === 0;
    const isHighlight = row === 3;
    const wave = Math.sin((p.x / 4) * Math.PI) * 0.15;
    const noise = tileNoise(p.u, p.v, 3, p.seed);
    let t = noise * 0.4 + p.px * 0.3 + 0.3 + wave;
    if (isShade) t -= 0.35;
    if (isHighlight) t += 0.25;
    const color = palettePick(ROOF_RED_PALETTE, Math.max(0, Math.min(1, t)), p.x, p.y);
    return [...color, 255, 0.3 + (isHighlight ? 0.4 : 0), 0.85, 0];
};

const roofGreen = (p) => {
    const row = p.y % 4;
    const isShade = row === 0;
    const patina = tileFbm(p.u, p.v, 4, 2, p.seed);
    let t = patina * 0.55 + p.px * 0.45;
    if (isShade) t -= 0.3;
    const color = palettePick(ROOF_GREEN_PALETTE, Math.max(0, Math.min(1, t)), p.x, p.y);
    return [...color, 255, 0.35 + patina * 0.3, 0.8, 0];
};

const woodPlanks = (p) => {
    const isSeam = (p.y % 4 === 0);
    const isNail = isSeam && ((p.x === 2) || (p.x === 13));
    if (isNail) {
        return [48, 34, 22, 255, 0.1, 0.7, 0];
    }
    if (isSeam) {
        return [72, 48, 26, 255, 0.15, 0.9, 0];
    }
    const grain = tileFbm(p.u * 3, p.v * 0.5, 3, 2, p.seed);
    const t = grain * 0.6 + p.px * 0.4;
    const color = palettePick(PLANKS_PALETTE, t, p.x, p.y);
    return [...color, 255, 0.4 + grain * 0.3, 0.88, 0];
};

const wheat = (p) => {
    const isCropHead = p.y >= 7;
    const stalk = (p.x % 3 === 1) || (p.x % 4 === 2);
    if (!stalk && p.y < 5) {
        return [60, 90, 30, 255, 0.2, 0.9, 0];
    }
    const noise = tileNoise(p.u, p.v, 4, p.seed);
    const t = noise * 0.4 + p.px * 0.6;
    const color = isCropHead
        ? palettePick(WHEAT_PALETTE, 0.5 + t * 0.5, p.x, p.y)
        : palettePick(WHEAT_PALETTE, t * 0.5, p.x, p.y);
    return [...color, 255, 0.3 + t * 0.4, 0.9, 0];
};

const haySide = (p) => {
    const isBand = (p.y === 4) || (p.y === 11);
    if (isBand) {
        return [128, 38, 28, 255, 0.3, 0.8, 0];
    }
    const fiber = hash2(p.x, 2, p.seed);
    const t = fiber * 0.4 + tileFbm(p.u, p.v * 0.5, 3, 2, p.seed) * 0.4 + p.px * 0.2;
    const color = palettePick(HAY_PALETTE, t, p.x, p.y);
    return [...color, 255, 0.4 + fiber * 0.3, 0.88, 0];
};

const hayTop = (p) => {
    const dist = Math.hypot(p.x - 7.5, p.y - 7.5);
    const ring = (Math.sin(dist * 2.2) + 1) * 0.5;
    const t = ring * 0.5 + p.px * 0.5;
    const color = palettePick(HAY_PALETTE, t, p.x, p.y);
    return [...color, 255, 0.4 + ring * 0.2, 0.88, 0];
};

const cobblestone = (p) => {
    const cx = Math.floor(p.x / 5);
    const cy = Math.floor(p.y / 5);
    const h = hash2(cx, cy, p.seed);
    const centerDist = Math.hypot((p.x % 5) - 2.5, (p.y % 5) - 2.5);
    const isCrevice = centerDist > 2.8;
    if (isCrevice) {
        return [...shade(COBBLE_PALETTE[0], -30), 255, 0.1, 0.96, 0];
    }
    const t = (h * 0.4 + tileFbm(p.u, p.v, 3, 2, p.seed) * 0.3 + p.px * 0.3);
    const color = palettePick(COBBLE_PALETTE, t, p.x, p.y);
    return [...color, 255, 0.35 + (3.0 - centerDist) * 0.15, 0.8, 0];
};

export const VILLAGE_RECIPES = {
    [TEX.STONE_BRICK]: { seed: 120, fn: stoneBrick, bump: 2.4 },
    [TEX.PLASTER]: { seed: 121, fn: plaster, bump: 0.8 },
    [TEX.ROOF_RED]: { seed: 122, fn: roofRed, bump: 2.2 },
    [TEX.ROOF_GREEN]: { seed: 123, fn: roofGreen, bump: 2.0 },
    [TEX.WOOD_PLANKS]: { seed: 124, fn: woodPlanks, bump: 1.5 },
    [TEX.WHEAT]: { seed: 125, fn: wheat, bump: 1.8 },
    [TEX.HAY_SIDE]: { seed: 126, fn: haySide, bump: 2.2 },
    [TEX.HAY_TOP]: { seed: 127, fn: hayTop, bump: 1.6 },
    [TEX.COBBLESTONE]: { seed: 128, fn: cobblestone, bump: 2.8 }
};
