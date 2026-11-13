import { TEX } from "./voxel-blocks.js";
import { tileFbm, tileNoise } from "./voxel-tex-noise.js";
import { palettePick } from "./voxel-tex-palette.js";

const WATER = [[26, 78, 128], [34, 98, 150], [44, 120, 170], [66, 148, 192]];
const LAVA = [[120, 24, 8], [196, 54, 10], [250, 112, 18], [255, 188, 52], [255, 236, 130]];
const STICK = [[84, 56, 32], [108, 76, 44], [130, 94, 54]];
const FLAME = [[255, 170, 40], [255, 208, 80], [255, 240, 150]];

const water = (p) => {
    const wave = tileFbm(p.u, p.v, 3, 3, p.seed);
    const color = palettePick(WATER, wave * 0.7 + p.px * 0.3, p.x, p.y);
    return [...color, 200, wave, 0.04, 0];
};

const glass = (p) => {
    const rim = p.x === 0 || p.y === 0 || p.x === 15 || p.y === 15;
    const streak = p.x + p.y === 19 || p.x + p.y === 11;
    if (rim) return [214, 238, 252, 225, 0.9, 0.05, 0];
    if (streak) return [236, 250, 255, 170, 0.7, 0.04, 0];
    return [164 + p.px * 20, 216 + p.px * 14, 244, 78, 0.3, 0.04, 0];
};

const lava = (p) => {
    const flow = tileFbm(p.u, p.v, 3, 3, p.seed);
    const vein = tileNoise(p.u, p.v, 4, p.seed + 9);
    const t = flow * 0.6 + vein * 0.4;
    const color = palettePick(LAVA, t, p.x, p.y);
    return [...color, 255, 1 - t, 0.5, 0.75 + t * 0.25];
};

const torch = (p) => {
    const flame = p.y >= 10 && p.x >= 4 && p.x <= 11;
    if (flame) {
        const t = (p.y - 10) / 5 + p.px * 0.3;
        return [...palettePick(FLAME, t, p.x, p.y), 255, 0.8, 0.5, 1];
    }
    const t = tileFbm(p.u, p.v, 3, 2, p.seed) * 0.5 + p.px * 0.5;
    return [...palettePick(STICK, t, p.x, p.y), 255, 0.4 + t * 0.4, 0.9, 0];
};

export const FX_RECIPES = {
    [TEX.WATER]: { seed: 106, fn: water, bump: 0.6 },
    [TEX.GLASS]: { seed: 110, fn: glass, bump: 0.8 },
    [TEX.LAVA]: { seed: 111, fn: lava, bump: 1.2 },
    [TEX.TORCH]: { seed: 112, fn: torch, bump: 1.4 }
};
