import { TEX } from "./voxel-blocks.js";
import { hash2 } from "./voxel-noise.js";
import { tileFbm, tileNoise } from "./voxel-tex-noise.js";
import { palettePick, shade } from "./voxel-tex-palette.js";

const BARK = [[44, 30, 20], [64, 44, 28], [84, 58, 36], [104, 74, 46], [124, 90, 56]];
const WOOD = [[128, 96, 58], [152, 116, 70], [172, 134, 84], [190, 152, 98]];
const LEAF = [[22, 58, 22], [34, 84, 28], [50, 112, 34], [76, 144, 42], [112, 176, 56]];
const CACTUS = [[40, 92, 40], [56, 118, 48], [74, 144, 58], [98, 168, 72]];

const woodSide = (p) => {
    const groove = hash2(p.x, 1, p.seed);
    const along = tileFbm(p.u, p.v * 0.5, 3, 3, p.seed);
    const t = groove * 0.5 + along * 0.35 + p.px * 0.15;
    const crevice = groove < 0.22;
    const color = palettePick(BARK, crevice ? t * 0.5 : t, p.x, p.y);
    return [...color, 255, crevice ? 0.05 : 0.45 + along * 0.4, 0.9, 0];
};

const woodTop = (p) => {
    const edge = Math.min(p.x, p.y, 15 - p.x, 15 - p.y);
    if (edge < 2) {
        const t = tileFbm(p.u, p.v, 3, 2, p.seed) * 0.6 + p.px * 0.4;
        return [...palettePick(BARK, t, p.x, p.y), 255, 0.5 + (edge === 1 ? 0.2 : 0), 0.9, 0];
    }
    const d = Math.hypot(p.x - 7.5, p.y - 7.5) + tileNoise(p.u, p.v, 3, p.seed) * 1.6;
    const ring = (Math.sin(d * 1.9) + 1) * 0.5;
    const color = palettePick(WOOD, ring * 0.8 + p.px * 0.2, p.x, p.y);
    return [...color, 255, 0.35 + ring * 0.4, 0.8, 0];
};

const leaves = (p) => {
    const clump = tileFbm(p.u, p.v, 4, 3, p.seed);
    const t = clump * 0.55 + p.px * 0.45;
    const hole = p.px > 0.93 && clump < 0.55;
    if (hole) return [20, 52, 20, 0, 0.1, 0.9, 0];
    const color = palettePick(LEAF, t, p.x, p.y);
    return [...color, 255, 0.2 + t * 0.7, 0.8, 0];
};

const cactus = (p) => {
    const rib = p.x % 4 === 0 ? 0.15 : 0.7 + (p.x % 4 === 2 ? 0.1 : 0);
    const t = rib * 0.7 + tileFbm(p.u, p.v, 3, 2, p.seed) * 0.3;
    const spine = p.x % 4 === 1 && p.y % 5 === 2;
    if (spine) return [...shade(CACTUS[3], 60), 255, 0.95, 0.5, 0];
    return [...palettePick(CACTUS, t, p.x, p.y), 255, rib, 0.7, 0];
};

export const ORGANIC_RECIPES = {
    [TEX.WOOD_SIDE]: { seed: 107, fn: woodSide, bump: 2.4 },
    [TEX.WOOD_TOP]: { seed: 108, fn: woodTop, bump: 1.4 },
    [TEX.LEAVES]: { seed: 109, fn: leaves, bump: 2.2 },
    [TEX.CACTUS]: { seed: 118, fn: cactus, bump: 2.2 }
};
