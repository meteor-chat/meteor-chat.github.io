import { BLOCK, isSolid } from "./voxel-blocks.js";
import { MAX_CATS } from "./voxel-mob-cat-model.js";
import { createCat, stepCat } from "./voxel-mob-cat-ai.js";
import { MAX_CHICKENS } from "./voxel-mob-chicken-model.js";
import { createChicken, stepChicken } from "./voxel-mob-chicken-ai.js";
import { separateMobs } from "./voxel-mob-physics.js";
import { MAX_VILLAGERS } from "./voxel-mob-villager-model.js";
import { createVillager, stepVillager } from "./voxel-mob-villager-ai.js";

const COVER_SCAN = 14;
const COVERED_LIGHT = 0.32;
const LIGHT_RATE = 6;

function isCover(id) {
    return isSolid(id) || id === BLOCK.LEAVES;
}

export function skyLightAt(pos, getBlock) {
    const x = Math.floor(pos[0]);
    const z = Math.floor(pos[2]);
    const start = Math.floor(pos[1] + 0.9);
    for (let i = 0; i < COVER_SCAN; i += 1) {
        if (isCover(getBlock(x, start + i, z))) return COVERED_LIGHT;
    }
    return 1;
}

function sampleMobLight(pos, getBlock, getLight) {
    if (getLight) {
        const lb = getLight(pos[0], pos[1] + 0.5, pos[2]);
        return {
            sky: ((lb >> 4) & 15) / 15,
            blk: (lb & 15) / 15
        };
    }
    return {
        sky: skyLightAt(pos, getBlock),
        blk: 0
    };
}

const GROUND_SCAN = 8;

export function groundBelow(pos, getBlock) {
    const x = Math.floor(pos[0]);
    const z = Math.floor(pos[2]);
    const top = Math.floor(pos[1] - 0.01);
    for (let i = 0; i < GROUND_SCAN; i += 1) {
        if (isSolid(getBlock(x, top - i, z))) return top - i + 1;
    }
    return pos[1] - GROUND_SCAN - 1;
}

export function createMobSystem({ getBlock, getLight = null, rng, isLoaded = () => true, onVillagerHum = null }) {
    const cats = [];
    const chickens = [];
    const villagers = [];
    const ctx = { rng, getBlock, frozen: false, playerPos: null, onVillagerHum };

    const initLighting = (mob) => {
        const l = sampleMobLight(mob.pos, getBlock, getLight);
        mob.sky = l.sky;
        mob.blk = l.blk;
        mob.groundY = groundBelow(mob.pos, getBlock);
    };

    const spawnCat = (x, y, z, variant) => {
        if (cats.length >= MAX_CATS) return null;
        const cat = createCat(x, y, z, variant, rng);
        initLighting(cat);
        cats.push(cat);
        return cat;
    };

    const spawnChicken = (x, y, z, variant = "white") => {
        if (chickens.length >= MAX_CHICKENS) return null;
        const chicken = createChicken(x, y, z, variant, rng);
        initLighting(chicken);
        chickens.push(chicken);
        return chicken;
    };

    const spawnVillager = (x, y, z, homeX, homeZ) => {
        if (villagers.length >= MAX_VILLAGERS) return null;
        const v = createVillager(x, y, z, homeX, homeZ, rng);
        initLighting(v);
        villagers.push(v);
        return v;
    };

    const removeCat = (cat) => {
        const index = cats.indexOf(cat);
        if (index >= 0) cats.splice(index, 1);
    };

    const removeChicken = (chicken) => {
        const index = chickens.indexOf(chicken);
        if (index >= 0) chickens.splice(index, 1);
    };

    const removeVillager = (v) => {
        const index = villagers.indexOf(v);
        if (index >= 0) villagers.splice(index, 1);
    };

    const blendLight = (mob, blend) => {
        const l = sampleMobLight(mob.pos, getBlock, getLight);
        mob.sky += (l.sky - mob.sky) * blend;
        mob.blk = (mob.blk || 0) + (l.blk - (mob.blk || 0)) * blend;
        mob.groundY = groundBelow(mob.pos, getBlock);
    };

    const update = (dt, playerPos = null) => {
        const blend = Math.min(1, LIGHT_RATE * dt);
        ctx.playerPos = playerPos;
        for (const cat of cats) {
            ctx.frozen = !isLoaded(cat.pos[0], cat.pos[2]);
            stepCat(cat, dt, ctx);
            blendLight(cat, blend);
        }
        for (const chicken of chickens) {
            ctx.frozen = !isLoaded(chicken.pos[0], chicken.pos[2]);
            stepChicken(chicken, dt, ctx);
            blendLight(chicken, blend);
        }
        for (const v of villagers) {
            ctx.frozen = !isLoaded(v.pos[0], v.pos[2]);
            stepVillager(v, dt, ctx);
            blendLight(v, blend);
        }
        const combined = [...cats, ...chickens, ...villagers];
        if (combined.length > 0) separateMobs(combined, playerPos, getBlock);
    };

    const clear = () => {
        cats.splice(0, cats.length);
        chickens.splice(0, chickens.length);
        villagers.splice(0, villagers.length);
    };

    return {
        cats,
        chickens,
        villagers,
        get all() {
            return [...cats, ...chickens, ...villagers];
        },
        spawnCat,
        spawnChicken,
        spawnVillager,
        removeCat,
        removeChicken,
        removeVillager,
        update,
        clear
    };
}
