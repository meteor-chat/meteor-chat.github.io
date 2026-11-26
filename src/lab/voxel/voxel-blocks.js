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
    COBBLESTONE: 23,
    TALL_GRASS: 24,
    FLOWER_RED: 25,
    FLOWER_YELLOW: 26,
    SEAGRASS: 27,
    LANTERN: 28,
    MOSSY_COBBLE: 29,
    BARREL: 30
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
    COBBLESTONE: 40,
    TALL_GRASS: 41,
    FLOWER_RED: 42,
    FLOWER_YELLOW: 43,
    VILLAGER_ROBE: 44,
    VILLAGER_SKIN: 45,
    VILLAGER_FACE: 46,
    CACTUS_TOP: 47,
    SEAGRASS: 48,
    LANTERN: 49,
    MOSSY_COBBLE: 50,
    BARREL_SIDE: 51,
    BARREL_TOP: 52,
    VILLAGER_FARMER: 53,
    VILLAGER_SMITH: 54,
    VILLAGER_CLERIC: 55,
    GOLEM_IRON: 56,
    GOLEM_FACE: 57
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

export const BLOCK_CATALOG = [
    { id: BLOCK.GRASS, label: "Grass", tex: TEX.GRASS_SIDE, group: "Nature" },
    { id: BLOCK.DIRT, label: "Dirt", tex: TEX.DIRT, group: "Nature" },
    { id: BLOCK.STONE, label: "Stone", tex: TEX.STONE, group: "Nature" },
    { id: BLOCK.COBBLESTONE, label: "Cobblestone", tex: TEX.COBBLESTONE, group: "Building" },
    { id: BLOCK.MOSSY_COBBLE, label: "Mossy Cobble", tex: TEX.MOSSY_COBBLE, group: "Building" },
    { id: BLOCK.STONE_BRICK, label: "Stone Brick", tex: TEX.STONE_BRICK, group: "Building" },
    { id: BLOCK.SAND, label: "Sand", tex: TEX.SAND, group: "Nature" },
    { id: BLOCK.SNOW, label: "Snow", tex: TEX.SNOW_SIDE, group: "Nature" },
    { id: BLOCK.WOOD, label: "Oak Log", tex: TEX.WOOD_SIDE, group: "Building" },
    { id: BLOCK.WOOD_PLANKS, label: "Planks", tex: TEX.WOOD_PLANKS, group: "Building" },
    { id: BLOCK.LEAVES, label: "Leaves", tex: TEX.LEAVES, group: "Nature" },
    { id: BLOCK.PLASTER, label: "Plaster", tex: TEX.PLASTER, group: "Building" },
    { id: BLOCK.ROOF_RED, label: "Red Roof", tex: TEX.ROOF_RED, group: "Building" },
    { id: BLOCK.ROOF_GREEN, label: "Green Roof", tex: TEX.ROOF_GREEN, group: "Building" },
    { id: BLOCK.GLASS, label: "Glass", tex: TEX.GLASS, group: "Building" },
    { id: BLOCK.TORCH, label: "Torch", tex: TEX.TORCH, group: "Light" },
    { id: BLOCK.LANTERN, label: "Lantern", tex: TEX.LANTERN, group: "Light" },
    { id: BLOCK.WATER, label: "Water", tex: TEX.WATER, group: "Fluid" },
    { id: BLOCK.LAVA, label: "Lava", tex: TEX.LAVA, group: "Fluid" },
    { id: BLOCK.COAL_ORE, label: "Coal Ore", tex: TEX.COAL_ORE, group: "Ore" },
    { id: BLOCK.GOLD_ORE, label: "Gold Ore", tex: TEX.GOLD_ORE, group: "Ore" },
    { id: BLOCK.HAY_BALE, label: "Hay Bale", tex: TEX.HAY_SIDE, group: "Village" },
    { id: BLOCK.BARREL, label: "Barrel", tex: TEX.BARREL_SIDE, group: "Village" },
    { id: BLOCK.WHEAT, label: "Wheat", tex: TEX.WHEAT, group: "Plants" },
    { id: BLOCK.CACTUS, label: "Cactus", tex: TEX.CACTUS, group: "Plants" },
    { id: BLOCK.TALL_GRASS, label: "Tall Grass", tex: TEX.TALL_GRASS, group: "Plants" },
    { id: BLOCK.SEAGRASS, label: "Seagrass", tex: TEX.SEAGRASS, group: "Plants" },
    { id: BLOCK.FLOWER_RED, label: "Poppy", tex: TEX.FLOWER_RED, group: "Plants" },
    { id: BLOCK.FLOWER_YELLOW, label: "Dandelion", tex: TEX.FLOWER_YELLOW, group: "Plants" }
];

export const CATALOG_BY_ID = new Map(BLOCK_CATALOG.map((item) => [item.id, item]));

export function chunkIndex(x, y, z) {
    return (x & 15) + ((z & 15) << 4) + (y << 8);
}

export function isCrossPlant(id) {
    return (
        id === BLOCK.WHEAT ||
        id === BLOCK.TALL_GRASS ||
        id === BLOCK.FLOWER_RED ||
        id === BLOCK.FLOWER_YELLOW ||
        id === BLOCK.SEAGRASS
    );
}

export function isTorch(id) {
    return id === BLOCK.TORCH;
}

export function isLantern(id) {
    return id === BLOCK.LANTERN;
}

export function isWaterlogged(id) {
    return id === BLOCK.SEAGRASS;
}

export function isWater(id) {
    return id === BLOCK.WATER || id === BLOCK.SEAGRASS;
}

export function isCutout(id) {
    return id === BLOCK.LEAVES || isTorch(id) || isLantern(id) || isCrossPlant(id);
}

export function isOpaque(id) {
    return id !== BLOCK.AIR && id !== BLOCK.WATER && id !== BLOCK.GLASS && !isCutout(id);
}

export function isTranslucent(id) {
    return id === BLOCK.WATER || id === BLOCK.GLASS;
}

export function isFluid(id) {
    return id === BLOCK.WATER || id === BLOCK.LAVA;
}

export function isSolid(id) {
    return id !== BLOCK.AIR && !isFluid(id) && !isCrossPlant(id) && !isTorch(id) && !isLantern(id);
}

export function isGravityBlock(id) {
    return id === BLOCK.SAND;
}

export function getEmissiveLight(id) {
    if (id === BLOCK.LAVA || id === BLOCK.LANTERN) return 15;
    if (id === BLOCK.TORCH) return 14;
    return 0;
}

export function getBlockFlags(id) {
    if (id === BLOCK.WATER) return 1;
    if (id === BLOCK.LAVA) return 2;
    if (id === BLOCK.GLASS) return 4;
    if (id === BLOCK.LEAVES) return 8 | 32;
    if (id === BLOCK.TALL_GRASS) return 8 | 32;
    if (id === BLOCK.WHEAT || id === BLOCK.FLOWER_RED || id === BLOCK.FLOWER_YELLOW || id === BLOCK.SEAGRASS) return 8;
    if (id === BLOCK.GRASS) return 32;
    return 0;
}

export function getBlockHardness(id) {
    if (id === BLOCK.BEDROCK) return Infinity;
    if (isCrossPlant(id) || isTorch(id)) return 0.08;
    if (id === BLOCK.LEAVES || id === BLOCK.GLASS) return 0.22;
    if (id === BLOCK.LANTERN) return 0.35;
    if (id === BLOCK.GRASS || id === BLOCK.DIRT || id === BLOCK.SAND || id === BLOCK.SNOW || id === BLOCK.HAY_BALE) return 0.35;
    if (id === BLOCK.WOOD || id === BLOCK.WOOD_PLANKS || id === BLOCK.CACTUS || id === BLOCK.BARREL) return 0.55;
    if (id === BLOCK.COAL_ORE || id === BLOCK.GOLD_ORE) return 0.85;
    return 0.68;
}

export function getBlockMaterial(id) {
    if (id === BLOCK.GRASS || id === BLOCK.LEAVES || isCrossPlant(id)) return "grass";
    if (id === BLOCK.DIRT) return "dirt";
    if (id === BLOCK.SAND) return "sand";
    if (id === BLOCK.SNOW) return "snow";
    if (id === BLOCK.WOOD || id === BLOCK.WOOD_PLANKS || id === BLOCK.TORCH || id === BLOCK.HAY_BALE || id === BLOCK.CACTUS || id === BLOCK.BARREL) return "wood";
    if (id === BLOCK.GLASS) return "glass";
    if (id === BLOCK.WATER) return "water";
    return "stone";
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
    if (id === BLOCK.BARREL) return face === 2 || face === 3 ? TEX.BARREL_TOP : TEX.BARREL_SIDE;
    if (id === BLOCK.CACTUS) return face === 2 || face === 3 ? TEX.CACTUS_TOP : TEX.CACTUS;
    if (id === BLOCK.DIRT) return TEX.DIRT;
    if (id === BLOCK.STONE) return TEX.STONE;
    if (id === BLOCK.SAND) return TEX.SAND;
    if (id === BLOCK.WATER) return TEX.WATER;
    if (id === BLOCK.LEAVES) return TEX.LEAVES;
    if (id === BLOCK.GLASS) return TEX.GLASS;
    if (id === BLOCK.LAVA) return TEX.LAVA;
    if (id === BLOCK.TORCH) return TEX.TORCH;
    if (id === BLOCK.LANTERN) return TEX.LANTERN;
    if (id === BLOCK.COAL_ORE) return TEX.COAL_ORE;
    if (id === BLOCK.GOLD_ORE) return TEX.GOLD_ORE;
    if (id === BLOCK.BEDROCK) return TEX.BEDROCK;
    if (id === BLOCK.STONE_BRICK) return TEX.STONE_BRICK;
    if (id === BLOCK.PLASTER) return TEX.PLASTER;
    if (id === BLOCK.ROOF_RED) return TEX.ROOF_RED;
    if (id === BLOCK.ROOF_GREEN) return TEX.ROOF_GREEN;
    if (id === BLOCK.WOOD_PLANKS) return TEX.WOOD_PLANKS;
    if (id === BLOCK.WHEAT) return TEX.WHEAT;
    if (id === BLOCK.COBBLESTONE) return TEX.COBBLESTONE;
    if (id === BLOCK.MOSSY_COBBLE) return TEX.MOSSY_COBBLE;
    if (id === BLOCK.TALL_GRASS) return TEX.TALL_GRASS;
    if (id === BLOCK.SEAGRASS) return TEX.SEAGRASS;
    if (id === BLOCK.FLOWER_RED) return TEX.FLOWER_RED;
    if (id === BLOCK.FLOWER_YELLOW) return TEX.FLOWER_YELLOW;
    return TEX.STONE;
}
