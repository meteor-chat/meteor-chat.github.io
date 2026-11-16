export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 128;
export const SUB_SIZE = 16;
export const SUB_COUNT = 8;
export const SEA_LEVEL = 42;

export const BLOCK = {
    AIR: 0,
    GRASS: 1,
    DIRT: 2,
    STONE: 3,
    SAND: 4,
    WATER: 5,
    WOOD: 6,
    LEAVES: 7,
    GLASS: 8,
    LAVA: 9,
    TORCH: 10,
    SNOW: 11,
    COAL_ORE: 12,
    GOLD_ORE: 13,
    BEDROCK: 14,
    CACTUS: 15,
    STONE_BRICK: 16,
    PLASTER: 17,
    ROOF_RED: 18,
    ROOF_GREEN: 19,
    WOOD_PLANKS: 20,
    WHEAT: 21,
    HAY_BALE: 22,
    COBBLESTONE: 23
};

export const TEX = {
    GRASS_TOP: 0,
    GRASS_SIDE: 1,
    DIRT: 2,
    STONE: 3,
    SAND: 4,
    WATER: 5,
    WOOD_SIDE: 6,
    WOOD_TOP: 7,
    LEAVES: 8,
    GLASS: 9,
    LAVA: 10,
    TORCH: 11,
    SNOW: 12,
    SNOW_SIDE: 13,
    COAL_ORE: 14,
    GOLD_ORE: 15,
    BEDROCK: 16,
    CACTUS: 17,
    CAT_FUR_ORANGE: 18,
    CAT_FUR_BLACK: 19,
    CAT_FUR_CALICO: 20,
    CAT_FUR_WHITE: 21,
    CAT_FUR_SAND: 22,
    CAT_FACE_ORANGE: 23,
    CAT_FACE_BLACK: 24,
    CAT_FACE_CALICO: 25,
    CAT_FACE_WHITE: 26,
    CAT_FACE_SAND: 27,
    CHICKEN_FEATHER: 28,
    CHICKEN_FACE: 29,
    CHICKEN_BEAK: 30,
    CHICKEN_WATTLE: 31,
    STONE_BRICK: 32,
    PLASTER: 33,
    ROOF_RED: 34,
    ROOF_GREEN: 35,
    WOOD_PLANKS: 36,
    WHEAT: 37,
    HAY_SIDE: 38,
    HAY_TOP: 39,
    COBBLESTONE: 40
};

export const HOTBAR_ITEMS = [
    { id: BLOCK.GRASS, label: "Grass", tex: TEX.GRASS_SIDE },
    { id: BLOCK.STONE_BRICK, label: "Stone Brick", tex: TEX.STONE_BRICK },
    { id: BLOCK.WOOD, label: "Wood", tex: TEX.WOOD_SIDE },
    { id: BLOCK.WOOD_PLANKS, label: "Planks", tex: TEX.WOOD_PLANKS },
    { id: BLOCK.PLASTER, label: "Plaster", tex: TEX.PLASTER },
    { id: BLOCK.ROOF_RED, label: "Red Roof", tex: TEX.ROOF_RED },
    { id: BLOCK.TORCH, label: "Torch", tex: TEX.TORCH },
    { id: BLOCK.GLASS, label: "Glass", tex: TEX.GLASS },
    { id: BLOCK.WATER, label: "Water", tex: TEX.WATER }
];

export function chunkIndex(x, y, z) {
    return x + (z << 4) + (y << 8);
}

export function isOpaque(id) {
    return id !== BLOCK.AIR && id !== BLOCK.WATER && id !== BLOCK.GLASS && id !== BLOCK.LEAVES && id !== BLOCK.WHEAT;
}

export function isTranslucent(id) {
    return id === BLOCK.WATER || id === BLOCK.GLASS;
}

export function isSolid(id) {
    return id !== BLOCK.AIR && id !== BLOCK.WATER && id !== BLOCK.LAVA && id !== BLOCK.WHEAT;
}

export function getEmissiveLight(id) {
    if (id === BLOCK.LAVA) return 15;
    if (id === BLOCK.TORCH) return 14;
    return 0;
}

export function getBlockFlags(id) {
    if (id === BLOCK.WATER) return 1;
    if (id === BLOCK.LAVA) return 2;
    if (id === BLOCK.GLASS) return 4;
    if (id === BLOCK.LEAVES) return 8;
    return 0;
}

export function getFaceTexture(id, face) {
    if (id === BLOCK.GRASS) {
        if (face === 2) return TEX.GRASS_TOP;
        if (face === 3) return TEX.DIRT;
        return TEX.GRASS_SIDE;
    }
    if (id === BLOCK.SNOW) {
        if (face === 2) return TEX.SNOW;
        if (face === 3) return TEX.DIRT;
        return TEX.SNOW_SIDE;
    }
    if (id === BLOCK.WOOD) return face === 2 || face === 3 ? TEX.WOOD_TOP : TEX.WOOD_SIDE;
    if (id === BLOCK.HAY_BALE) return face === 2 || face === 3 ? TEX.HAY_TOP : TEX.HAY_SIDE;
    if (id === BLOCK.DIRT) return TEX.DIRT;
    if (id === BLOCK.STONE) return TEX.STONE;
    if (id === BLOCK.SAND) return TEX.SAND;
    if (id === BLOCK.WATER) return TEX.WATER;
    if (id === BLOCK.LEAVES) return TEX.LEAVES;
    if (id === BLOCK.GLASS) return TEX.GLASS;
    if (id === BLOCK.LAVA) return TEX.LAVA;
    if (id === BLOCK.TORCH) return TEX.TORCH;
    if (id === BLOCK.COAL_ORE) return TEX.COAL_ORE;
    if (id === BLOCK.GOLD_ORE) return TEX.GOLD_ORE;
    if (id === BLOCK.BEDROCK) return TEX.BEDROCK;
    if (id === BLOCK.CACTUS) return TEX.CACTUS;
    if (id === BLOCK.STONE_BRICK) return TEX.STONE_BRICK;
    if (id === BLOCK.PLASTER) return TEX.PLASTER;
    if (id === BLOCK.ROOF_RED) return TEX.ROOF_RED;
    if (id === BLOCK.ROOF_GREEN) return TEX.ROOF_GREEN;
    if (id === BLOCK.WOOD_PLANKS) return TEX.WOOD_PLANKS;
    if (id === BLOCK.WHEAT) return TEX.WHEAT;
    if (id === BLOCK.COBBLESTONE) return TEX.COBBLESTONE;
    return TEX.STONE;
}
