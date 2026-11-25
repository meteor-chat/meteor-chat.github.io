import { TEX } from "./voxel-blocks.js";
import { FLOATS_PER_VERTEX } from "./voxel-mob-cat-model.js";

export { FLOATS_PER_VERTEX };
export const MAX_VILLAGERS = 6;
export const VERTS_PER_BOX = 36;

export const VILLAGER_LAYERS = Object.freeze({
    robe: TEX.VILLAGER_ROBE,
    skin: TEX.VILLAGER_SKIN,
    face: TEX.VILLAGER_FACE
});

const UV_SCALE = 1.6;
const PIVOTS = {
    body: [0, 0.56, 0],
    head: [0, 1.32, 0],
    legL: [-0.1, 0.56, 0],
    legR: [0.1, 0.56, 0]
};

const PARTS = [
    { min: [-0.22, 0.56, -0.14], max: [0.22, 1.32, 0.14], chain: ["body"], layerType: "robe" },
    { min: [-0.21, 1.32, -0.21], max: [0.21, 1.82, 0.21], chain: ["head", "body"], head: true, layerType: "skin" },
    { min: [-0.055, 1.33, -0.31], max: [0.055, 1.49, -0.21], chain: ["head", "body"], layerType: "skin" },
    { min: [-0.28, 0.9, -0.24], max: [0.28, 1.1, -0.1], chain: ["body"], layerType: "robe" },
    { min: [-0.32, 0.94, -0.14], max: [-0.22, 1.28, 0.12], chain: ["body"], layerType: "robe" },
    { min: [0.22, 0.94, -0.14], max: [0.32, 1.28, 0.12], chain: ["body"], layerType: "robe" },
    { min: [-0.18, 0, -0.1], max: [-0.02, 0.56, 0.1], chain: ["legL", "body"], layerType: "robe" },
    { min: [0.02, 0, -0.1], max: [0.18, 0.56, 0.1], chain: ["legR", "body"], layerType: "robe" }
];

export const BOXES_PER_VILLAGER = PARTS.length;
export const VERTS_PER_VILLAGER = BOXES_PER_VILLAGER * VERTS_PER_BOX;
export const FLOATS_PER_VILLAGER = VERTS_PER_VILLAGER * FLOATS_PER_VERTEX;

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

export function villagerPose(v, timeSec) {
    const { phase = 0, moving = 0, headYaw = 0, nod = 0 } = v.anim || {};
    const seed = v.phaseSeed !== undefined ? v.phaseSeed : 0;
    const stride = Math.sin(phase) * 0.62 * moving;
    const nodRx = Math.sin(nod * Math.PI * 2) * 0.14;
    const idleY = Math.sin(timeSec * 0.7 + seed) * 0.12 * (1 - moving);
    return {
        body: { rx: 0, ry: 0 },
        head: { rx: nodRx, ry: headYaw !== 0 ? headYaw : idleY },
        legL: { rx: stride, ry: 0 },
        legR: { rx: -stride, ry: 0 }
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

function placeInWorld(v, pose, chain, localPt, isPoint, c, s, dest) {
    scratch[0] = localPt[0];
    scratch[1] = localPt[1];
    scratch[2] = localPt[2];
    for (const name of chain) rotateStage(name, pose, scratch, isPoint);
    const x = scratch[0] * c - scratch[2] * s;
    const z = scratch[0] * s + scratch[2] * c;
    dest[0] = x + (isPoint ? v.pos[0] : 0);
    dest[1] = scratch[1] + (isPoint ? v.pos[1] : 0);
    dest[2] = z + (isPoint ? v.pos[2] : 0);
}

function emitFace(out, cursor, args) {
    const { v, pose, part, layer, sky, blk, k, sign, c, s } = args;
    const [uAxis, vAxis] = AXES[k];
    localNormal[0] = 0;
    localNormal[1] = 0;
    localNormal[2] = 0;
    localNormal[k] = sign;
    placeInWorld(v, pose, part.chain, localNormal, false, c, s, placedNormal);
    const order = sign > 0 ? [0, 1, 2, 3] : [0, 3, 2, 1];
    const sizeU = part.max[uAxis] - part.min[uAxis];
    const sizeV = part.max[vAxis] - part.min[vAxis];

    for (let idx = 0; idx < 4; idx += 1) {
        const [cu, cv] = CORNERS[order[idx]];
        localPos[k] = sign > 0 ? part.max[k] : part.min[k];
        localPos[uAxis] = cu ? part.max[uAxis] : part.min[uAxis];
        localPos[vAxis] = cv ? part.max[vAxis] : part.min[vAxis];
        placeInWorld(v, pose, part.chain, localPos, true, c, s, placed);
        const du = sign < 0 ? 1 - cu : cu;
        const fullFace = part.head && k === 2 && sign < 0;
        const robeFront = part.layerType === "robe" && k === 2;
        const u = fullFace || robeFront ? du : du * sizeU * UV_SCALE;
        const vv = fullFace || robeFront ? cv : cv * sizeV * UV_SCALE;
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

export function buildVillagerVertices(v, timeSec, out, offset) {
    const pose = villagerPose(v, timeSec);
    const sky = v.sky === undefined ? 1 : v.sky;
    const blk = v.blk === undefined ? 0 : v.blk;
    const c = Math.cos(v.yaw);
    const s = Math.sin(v.yaw);
    let cursor = offset;
    for (const part of PARTS) {
        for (let k = 0; k < 3; k += 1) {
            for (const sign of [1, -1]) {
                let layer = VILLAGER_LAYERS.robe;
                if (part.head && k === 2 && sign < 0) layer = VILLAGER_LAYERS.face;
                else if (part.layerType === "skin") layer = VILLAGER_LAYERS.skin;
                cursor = emitFace(out, cursor, { v, pose, part, layer, sky, blk, k, sign, c, s });
            }
        }
    }
    return cursor;
}
