import { BLOCK, isSolid } from "./voxel-blocks.js";
import { MAX_CATS } from "./voxel-mob-cat-model.js";
import { createCat, stepCat } from "./voxel-mob-cat-ai.js";
import { MAX_CHICKENS } from "./voxel-mob-chicken-model.js";
import { createChicken, stepChicken } from "./voxel-mob-chicken-ai.js";

const COVER_SCAN = 14;
const COVERED_LIGHT = 0.32;
const LIGHT_RATE = 4;

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

export function createMobSystem({ getBlock, rng, isLoaded = () => true }) {
    const cats = [];
    const chickens = [];
    const ctx = { rng, getBlock, frozen: false };

    const spawnCat = (x, y, z, variant) => {
        if (cats.length >= MAX_CATS) return null;
        const cat = createCat(x, y, z, variant, rng);
        cat.sky = skyLightAt(cat.pos, getBlock);
        cat.groundY = groundBelow(cat.pos, getBlock);
        cats.push(cat);
        return cat;
    };

    const spawnChicken = (x, y, z, variant = "white") => {
        if (chickens.length >= MAX_CHICKENS) return null;
        const chicken = createChicken(x, y, z, variant, rng);
        chicken.sky = skyLightAt(chicken.pos, getBlock);
        chicken.groundY = groundBelow(chicken.pos, getBlock);
        chickens.push(chicken);
        return chicken;
    };

    const removeCat = (cat) => {
        const index = cats.indexOf(cat);
        if (index >= 0) cats.splice(index, 1);
    };

    const removeChicken = (chicken) => {
        const index = chickens.indexOf(chicken);
        if (index >= 0) chickens.splice(index, 1);
    };

    const update = (dt) => {
        const blend = Math.min(1, LIGHT_RATE * dt);
        for (const cat of cats) {
            ctx.frozen = !isLoaded(cat.pos[0], cat.pos[2]);
            stepCat(cat, dt, ctx);
            cat.sky += (skyLightAt(cat.pos, getBlock) - cat.sky) * blend;
            cat.groundY = groundBelow(cat.pos, getBlock);
        }
        for (const chicken of chickens) {
            ctx.frozen = !isLoaded(chicken.pos[0], chicken.pos[2]);
            stepChicken(chicken, dt, ctx);
            chicken.sky += (skyLightAt(chicken.pos, getBlock) - chicken.sky) * blend;
            chicken.groundY = groundBelow(chicken.pos, getBlock);
        }
    };

    const clear = () => {
        cats.splice(0, cats.length);
        chickens.splice(0, chickens.length);
    };

    return {
        cats,
        chickens,
        get all() {
            return [...cats, ...chickens];
        },
        spawnCat,
        spawnChicken,
        removeCat,
        removeChicken,
        update,
        clear
    };
}
