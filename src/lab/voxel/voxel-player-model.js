import { BLOCK, TEX, getFaceTexture } from "./voxel-blocks.js";
import { FLOATS_PER_VERTEX } from "./voxel-mob-cat-model.js";

export { FLOATS_PER_VERTEX };
export const MAX_REMOTE_PLAYERS = 8;
export const VERTS_PER_BOX = 36;

export const PLAYER_OUTFITS = Object.freeze([
    { id: "sky", label: "Sky", swatch: "#38bdf8", shirt: TEX.WATER, pants: TEX.VILLAGER_CLERIC, trim: TEX.PLASTER },
    { id: "crimson", label: "Red", swatch: "#ef4444", shirt: TEX.ROOF_RED, pants: TEX.VILLAGER_SMITH, trim: TEX.GOLD_ORE },
    { id: "emerald", label: "Green", swatch: "#22c55e", shirt: TEX.ROOF_GREEN, pants: TEX.VILLAGER_FARMER, trim: TEX.WOOD_PLANKS },
    { id: "amber", label: "Gold", swatch: "#f59e0b", shirt: TEX.HAY_TOP, pants: TEX.WOOD_SIDE, trim: TEX.GOLD_ORE },
    { id: "violet", label: "Royal", swatch: "#a855f7", shirt: TEX.VILLAGER_CLERIC, pants: TEX.STONE_BRICK, trim: TEX.PLASTER },
    { id: "iron", label: "Silver", swatch: "#cbd5e1", shirt: TEX.GOLEM_IRON, pants: TEX.COBBLESTONE, trim: TEX.STONE_BRICK },
    { id: "timber", label: "Oak", swatch: "#d97706", shirt: TEX.WOOD_PLANKS, pants: TEX.DIRT, trim: TEX.HAY_SIDE },
    { id: "slate", label: "Slate", swatch: "#64748b", shirt: TEX.STONE_BRICK, pants: TEX.BEDROCK, trim: TEX.GOLEM_IRON }
]);

const OUTFIT_BY_ID = new Map(PLAYER_OUTFITS.map((o) => [o.id, o]));

export function resolvePlayerOutfit(outfitId) {
    return OUTFIT_BY_ID.get(outfitId) || PLAYER_OUTFITS[0];
}

const UV_SCALE = 1.6;
const PIVOTS = {
    body: [0, 0.72, 0],
    head: [0, 1.4, 0],
    armL: [-0.29, 1.32, 0],
    armR: [0.29, 1.32, 0],
    legL: [-0.105, 0.72, 0],
    legR: [0.105, 0.72, 0]
};

const PARTS = [
    { min: [-0.22, 0.72, -0.12], max: [0.22, 1.4, 0.12], chain: ["body"], layerType: "shirt" },
    { min: [-0.22, 1.4, -0.22], max: [0.22, 1.84, 0.22], chain: ["head", "body"], head: true, layerType: "skin" },
    { min: [-0.36, 0.74, -0.1], max: [-0.22, 1.38, 0.1], chain: ["armL", "body"], layerType: "arm" },
    { min: [0.22, 0.74, -0.1], max: [0.36, 1.38, 0.1], chain: ["armR", "body"], layerType: "arm" },
    { min: [-0.2, 0, -0.1], max: [-0.01, 0.72, 0.1], chain: ["legL", "body"], layerType: "pants" },
    { min: [0.01, 0, -0.1], max: [0.2, 0.72, 0.1], chain: ["legR", "body"], layerType: "pants" },
    { min: [0.2, 0.62, -0.28], max: [0.42, 0.84, -0.06], chain: ["armR", "body"], layerType: "held" }
];

export const BOXES_PER_PLAYER = PARTS.length;
export const VERTS_PER_PLAYER = BOXES_PER_PLAYER * VERTS_PER_BOX;
export const FLOATS_PER_PLAYER = VERTS_PER_PLAYER * FLOATS_PER_VERTEX;

const CORNERS = [[0, 0], [1, 0], [1, 1], [0, 1]];
const AXES = [[1, 2], [2, 0], [0, 1]];
const scratch = [0, 0, 0];
const placed = [0, 0, 0];
const placedNormal = [0, 0, 0];
const localPos = [0, 0, 0];
const localNormal = [0, 0, 0];
const faceVerts = [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0]
];
const QUAD_IDX = [0, 1, 2, 0, 2, 3];

function faceIndexFromAxis(k, sign) {
    if (k === 0) return sign > 0 ? 0 : 1;
    if (k === 1) return sign > 0 ? 2 : 3;
    return sign > 0 ? 4 : 5;
}

export function playerPose(p, timeSec) {
    const anim = p.anim || {};
    const phase = anim.phase || 0;
    const moving = anim.moving || 0;
    const swing = anim.swing || 0;
    const sneak = anim.sneaking ? 1 : 0;
    const pitch = Number.isFinite(p.pitch) ? Math.max(-1.25, Math.min(1.25, p.pitch)) : 0;
    const stride = Math.sin(phase) * 0.68 * moving;
    const idleArm = Math.sin(timeSec * 1.9 + (p.phaseSeed || 0)) * 0.05;
    const punch = Math.sin(swing * Math.PI) * 1.45;
    return {
        body: { rx: -0.22 * sneak, ry: 0 },
        head: { rx: pitch + 0.16 * sneak, ry: 0 },
        armL: { rx: -stride * 0.85 - idleArm, ry: 0 },
        armR: { rx: stride * 0.85 + idleArm + punch, ry: 0 },
        legL: { rx: stride, ry: 0 },
        legR: { rx: -stride, ry: 0 },
        yOffset: -0.14 * sneak
    };
}

function rotateStage(name, pose, vec, translate) {
    const stage = pose[name];
    if (!stage) return;
    const pivot = PIVOTS[name];
    if (translate && pivot) {
        vec[0] -= pivot[0];
        vec[1] -= pivot[1];
        vec[2] -= pivot[2];
    }
    if (stage.rx) {
        const c = Math.cos(stage.rx);
        const s = Math.sin(stage.rx);
        const y = vec[1] * c - vec[2] * s;
        vec[2] = vec[1] * s + vec[2] * c;
        vec[1] = y;
    }
    if (stage.ry) {
        const c = Math.cos(stage.ry);
        const s = Math.sin(stage.ry);
        const x = vec[0] * c + vec[2] * s;
        vec[2] = -vec[0] * s + vec[2] * c;
        vec[0] = x;
    }
    if (translate && pivot) {
        vec[0] += pivot[0];
        vec[1] += pivot[1];
        vec[2] += pivot[2];
    }
}

function placeInWorld(p, pose, chain, localPt, isPoint, c, s, dest) {
    scratch[0] = localPt[0];
    scratch[1] = localPt[1];
    scratch[2] = localPt[2];
    for (const name of chain) rotateStage(name, pose, scratch, isPoint);
    const x = scratch[0] * c - scratch[2] * s;
    const z = scratch[0] * s + scratch[2] * c;
    dest[0] = x + (isPoint ? p.pos[0] : 0);
    dest[1] = scratch[1] + (isPoint ? p.pos[1] + pose.yOffset : 0);
    dest[2] = z + (isPoint ? p.pos[2] : 0);
}

function resolveLayer(p, outfit, part, k, sign) {
    if (part.layerType === "held") {
        return getFaceTexture(p.heldBlockId || BLOCK.GRASS, faceIndexFromAxis(k, sign));
    }
    if (part.head) {
        if (k === 2 && sign < 0) return TEX.VILLAGER_FACE;
        if (k === 1 && sign > 0) return outfit.trim;
        return TEX.VILLAGER_SKIN;
    }
    if (part.layerType === "shirt") return outfit.shirt;
    if (part.layerType === "arm") {
        if (k === 1 && sign < 0) return TEX.VILLAGER_SKIN;
        return outfit.shirt;
    }
    return outfit.pants;
}

function emitFace(out, cursor, args) {
    const { p, pose, part, layer, sky, blk, k, sign, c, s } = args;
    const [uAxis, vAxis] = AXES[k];
    localNormal[0] = 0;
    localNormal[1] = 0;
    localNormal[2] = 0;
    localNormal[k] = sign;
    placeInWorld(p, pose, part.chain, localNormal, false, c, s, placedNormal);
    const order = sign > 0 ? [0, 1, 2, 3] : [0, 3, 2, 1];
    const min = part.min;
    const max = part.max;
    const sizeU = max[uAxis] - min[uAxis];
    const sizeV = max[vAxis] - min[vAxis];

    for (let idx = 0; idx < 4; idx += 1) {
        const [cu, cv] = CORNERS[order[idx]];
        localPos[k] = sign > 0 ? max[k] : min[k];
        localPos[uAxis] = cu ? max[uAxis] : min[uAxis];
        localPos[vAxis] = cv ? max[vAxis] : min[vAxis];
        placeInWorld(p, pose, part.chain, localPos, true, c, s, placed);
        const du = sign < 0 ? 1 - cu : cu;
        const fullUv = (part.head && k === 2 && sign < 0) || part.layerType === "held";
        const u = fullUv ? du : du * sizeU * UV_SCALE;
        const vv = fullUv ? cv : cv * sizeV * UV_SCALE;
        const dst = faceVerts[idx];
        dst[0] = placed[0];
        dst[1] = placed[1];
        dst[2] = placed[2];
        dst[3] = u;
        dst[4] = vv;
    }

    let o = cursor;
    for (let t = 0; t < 6; t += 1) {
        const vert = faceVerts[QUAD_IDX[t]];
        out[o] = vert[0];
        out[o + 1] = vert[1];
        out[o + 2] = vert[2];
        out[o + 3] = placedNormal[0];
        out[o + 4] = placedNormal[1];
        out[o + 5] = placedNormal[2];
        out[o + 6] = vert[3];
        out[o + 7] = vert[4];
        out[o + 8] = layer;
        out[o + 9] = sky;
        out[o + 10] = blk;
        o += FLOATS_PER_VERTEX;
    }
    return o;
}

export function buildPlayerVertices(p, timeSec, out, offset) {
    const pose = playerPose(p, timeSec);
    const outfit = resolvePlayerOutfit(p.variant);
    const sky = p.sky === undefined ? 1 : p.sky;
    const blk = p.blk === undefined ? 0 : p.blk;
    const c = Math.cos(p.yaw || 0);
    const s = Math.sin(p.yaw || 0);
    const showHeld = Number.isInteger(p.heldBlockId) && p.heldBlockId > BLOCK.AIR;
    let cursor = offset;
    for (const part of PARTS) {
        if (part.layerType === "held" && !showHeld) continue;
        for (let k = 0; k < 3; k += 1) {
            for (const sign of [1, -1]) {
                const layer = resolveLayer(p, outfit, part, k, sign);
                cursor = emitFace(out, cursor, { p, pose, part, layer, sky, blk, k, sign, c, s });
            }
        }
    }
    return cursor;
}
