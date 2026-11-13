import { TEX } from "./voxel-blocks.js";
import { hash2 } from "./voxel-noise.js";
import { ridge, tileFbm, tileNoise } from "./voxel-tex-noise.js";
import { palettePick, shade } from "./voxel-tex-palette.js";

const GRASS = [[44, 82, 30], [62, 102, 34], [82, 124, 40], [104, 146, 46], [128, 166, 56]];
const DIRT = [[72, 48, 32], [96, 66, 42], [120, 84, 54], [142, 102, 66], [162, 120, 80]];
const STONE = [[78, 80, 86], [98, 100, 106], [118, 120, 126], [138, 140, 146], [158, 160, 166]];
const SAND = [[184, 164, 112], [204, 186, 132], [220, 204, 152], [234, 220, 176]];
const SNOW = [[190, 208, 228], [212, 226, 242], [232, 242, 252], [248, 252, 255]];
const BEDROCK = [[20, 20, 24], [36, 36, 42], [54, 54, 60], [74, 74, 82]];
const COAL = [[16, 16, 20], [34, 34, 40], [58, 58, 66]];
const GOLD = [[196, 148, 30], [230, 186, 52], [250, 218, 96], [255, 242, 168]];

function stoneBase(p) {
    const blotch = tileFbm(p.u, p.v, 3, 3, p.seed);
    const crack = ridge(tileFbm(p.u, p.v, 4, 2, p.seed + 7)) > 0.93 ? 0.18 : 1;
    const t = (blotch * 0.6 + p.px * 0.4) * crack;
    return { color: palettePick(STONE, t, p.x, p.y), height: crack < 1 ? 0.1 : 0.4 + blotch * 0.4 };
}

function fringeRow(p, fringeBase) {
    const fringe = fringeBase + Math.floor(hash2(p.x, 3, p.seed) * 4);
    return p.y >= 16 - fringe ? { fringe, edge: p.y === 16 - fringe } : null;
}

function dirtColor(p) {
    const t = tileFbm(p.u, p.v, 4, 2, p.seed) * 0.55 + p.px * 0.45;
    if (p.px > 0.94) return shade(DIRT[4], 12);
    if (p.px < 0.05) return shade(DIRT[0], -6);
    return palettePick(DIRT, t, p.x, p.y);
}

const grassTop = (p) => {
    const t = tileFbm(p.u, p.v, 4, 3, p.seed) * 0.5 + p.px * 0.5;
    return [...palettePick(GRASS, t, p.x, p.y), 255, 0.35 + p.px * 0.5, 0.88, 0];
};

const grassSide = (p) => {
    const row = fringeRow(p, 3);
    if (row) {
        const t = tileFbm(p.u, p.v, 4, 3, p.seed) * 0.5 + p.px * 0.5;
        const c = palettePick(GRASS, t - (row.edge ? 0.25 : 0), p.x, p.y);
        return [...c, 255, 0.55 + p.px * 0.3, 0.88, 0];
    }
    return [...dirtColor(p), 255, 0.3 + p.px * 0.4, 0.92, 0];
};

const dirt = (p) => [...dirtColor(p), 255, 0.3 + p.px * 0.5, 0.94, 0];

const stone = (p) => {
    const base = stoneBase(p);
    return [...base.color, 255, base.height, 0.78, 0];
};

const sand = (p) => {
    const ripple = Math.sin((p.u * 2 + tileNoise(p.u, p.v, 3, p.seed) * 0.6) * Math.PI * 4) * 0.12;
    const t = tileFbm(p.u, p.v, 3, 2, p.seed) * 0.45 + p.px * 0.45 + 0.1 + ripple;
    return [...palettePick(SAND, t, p.x, p.y), 255, 0.4 + p.px * 0.3, 0.9, 0];
};

const snow = (p) => {
    const t = tileFbm(p.u, p.v, 3, 2, p.seed) * 0.5 + p.px * 0.5;
    return [...palettePick(SNOW, t, p.x, p.y), 255, 0.5 + p.px * 0.2, 0.55, 0];
};

const snowSide = (p) => {
    const row = fringeRow(p, 3);
    if (row) return [...palettePick(SNOW, 0.55 + p.px * 0.45 - (row.edge ? 0.3 : 0), p.x, p.y), 255, 0.6, 0.55, 0];
    return [...dirtColor(p), 255, 0.3 + p.px * 0.4, 0.92, 0];
};

const bedrock = (p) => {
    const t = tileFbm(p.u, p.v, 3, 3, p.seed) * 0.6 + p.px * 0.4;
    return [...palettePick(BEDROCK, t, p.x, p.y), 255, t, 0.9, 0];
};

function oreCell(p, palette, threshold, emitPeak) {
    const base = stoneBase(p);
    const cluster = tileNoise(p.u, p.v, 5, p.seed + 41) + p.px * 0.18;
    if (cluster < threshold) return [...base.color, 255, base.height, 0.78, 0];
    const t = tileFbm(p.u, p.v, 6, 2, p.seed + 3) * 0.6 + p.px * 0.4;
    const color = palettePick(palette, t, p.x, p.y);
    return [...color, 255, 0.75 + t * 0.2, 0.35, t > 0.62 ? emitPeak : 0];
}

const coal = (p) => oreCell(p, COAL, 0.66, 0);
const gold = (p) => oreCell(p, GOLD, 0.68, 0.18);

export const TERRAIN_RECIPES = {
    [TEX.GRASS_TOP]: { seed: 101, fn: grassTop, bump: 1.4 },
    [TEX.GRASS_SIDE]: { seed: 103, fn: grassSide, bump: 1.6 },
    [TEX.DIRT]: { seed: 102, fn: dirt, bump: 1.6 },
    [TEX.STONE]: { seed: 104, fn: stone, bump: 2.2 },
    [TEX.SAND]: { seed: 105, fn: sand, bump: 1.0 },
    [TEX.SNOW]: { seed: 113, fn: snow, bump: 0.8 },
    [TEX.SNOW_SIDE]: { seed: 114, fn: snowSide, bump: 1.2 },
    [TEX.COAL_ORE]: { seed: 115, fn: coal, bump: 2.4 },
    [TEX.GOLD_ORE]: { seed: 116, fn: gold, bump: 2.4 },
    [TEX.BEDROCK]: { seed: 117, fn: bedrock, bump: 2.6 }
};
