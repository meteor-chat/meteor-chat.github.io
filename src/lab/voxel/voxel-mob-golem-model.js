import { TEX } from "./voxel-blocks.js";
import { FLOATS_PER_VERTEX } from "./voxel-mob-cat-model.js";

export { FLOATS_PER_VERTEX };
export const MAX_GOLEMS = 2;
export const VERTS_PER_BOX = 36;

export const GOLEM_LAYERS = Object.freeze({
    iron: TEX.GOLEM_IRON,
    face: TEX.GOLEM_FACE
});

const UV_SCALE = 1.1;
const PIVOTS = {
    body: [0, 0.95, 0],
    head: [0, 2.02, -0.06],
    armL: [-0.56, 1.9, 0],
    armR: [0.56, 1.9, 0],
    legL: [-0.22, 0.92, 0],
    legR: [0.22, 0.92, 0]
};

const PARTS = [
    { min: [-0.46, 1.24, -0.26], max: [0.46, 2.02, 0.26], chain: ["body"] },
    { min: [-0.28, 0.92, -0.18], max: [0.28, 1.24, 0.18], chain: ["body"] },
    { min: [-0.24, 2.02, -0.28], max: [0.24, 2.58, 0.18], chain: ["head", "body"], head: true },
    { min: [-0.06, 2.04, -0.37], max: [0.06, 2.24, -0.28], chain: ["head", "body"] },
    { min: [-0.7, 0.72, -0.15], max: [-0.46, 1.96, 0.15], chain: ["armL", "body"] },
    { min: [0.46, 0.72, -0.15], max: [0.7, 1.96, 0.15], chain: ["armR", "body"] },
    { min: [-0.36, 0, -0.16], max: [-0.08, 0.92, 0.16], chain: ["legL", "body"] },
    { min: [0.08, 0, -0.16], max: [0.36, 0.92, 0.16], chain: ["legR", "body"] }
];

export const BOXES_PER_GOLEM = PARTS.length;
export const VERTS_PER_GOLEM = BOXES_PER_GOLEM * VERTS_PER_BOX;
export const FLOATS_PER_GOLEM = VERTS_PER_GOLEM * FLOATS_PER_VERTEX;

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

export function golemPose(g, timeSec) {
    const { phase = 0, moving = 0, headYaw = 0 } = g.anim || {};
    const seed = g.phaseSeed || 0;
    const stride = Math.sin(phase) * 0.45 * moving;
    const armSwing = Math.sin(phase) * 0.52 * moving;
    const idleY = Math.sin(timeSec * 0.45 + seed) * 0.18 * (1 - moving);
    return {
        body: { rx: 0, ry: 0 },
        head: { rx: 0, ry: headYaw !== 0 ? headYaw : idleY },
        armL: { rx: -armSwing, ry: 0 },
        armR: { rx: armSwing, ry: 0 },
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

function placeInWorld(g, pose, chain, localPt, isPoint, c, s, dest) {
    scratch[0] = localPt[0];
    scratch[1] = localPt[1];
    scratch[2] = localPt[2];
    for (const name of chain) rotateStage(name, pose, scratch, isPoint);
    const x = scratch[0] * c - scratch[2] * s;
    const z = scratch[0] * s + scratch[2] * c;
    dest[0] = x + (isPoint ? g.pos[0] : 0);
    dest[1] = scratch[1] + (isPoint ? g.pos[1] : 0);
    dest[2] = z + (isPoint ? g.pos[2] : 0);
}

function emitFace(out, cursor, args) {
    const { g, pose, part, layer, sky, blk, k, sign, c, s } = args;
    const [uAxis, vAxis] = AXES[k];
    localNormal[0] = 0;
    localNormal[1] = 0;
    localNormal[2] = 0;
    localNormal[k] = sign;
    placeInWorld(g, pose, part.chain, localNormal, false, c, s, placedNormal);
    const order = sign > 0 ? [0, 1, 2, 3] : [0, 3, 2, 1];
    const sizeU = part.max[uAxis] - part.min[uAxis];
    const sizeV = part.max[vAxis] - part.min[vAxis];

    for (let idx = 0; idx < 4; idx += 1) {
        const [cu, cv] = CORNERS[order[idx]];
        localPos[k] = sign > 0 ? part.max[k] : part.min[k];
        localPos[uAxis] = cu ? part.max[uAxis] : part.min[uAxis];
        localPos[vAxis] = cv ? part.max[vAxis] : part.min[vAxis];
        placeInWorld(g, pose, part.chain, localPos, true, c, s, placed);
        const du = sign < 0 ? 1 - cu : cu;
        const fullFace = part.head && k === 2 && sign < 0;
        const u = fullFace ? du : du * sizeU * UV_SCALE;
        const vv = fullFace ? cv : cv * sizeV * UV_SCALE;
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

export function buildGolemVertices(g, timeSec, out, offset) {
    const pose = golemPose(g, timeSec);
    const sky = g.sky === undefined ? 1 : g.sky;
    const blk = g.blk === undefined ? 0 : g.blk;
    const c = Math.cos(g.yaw);
    const s = Math.sin(g.yaw);
    let cursor = offset;
    for (const part of PARTS) {
        for (let k = 0; k < 3; k += 1) {
            for (const sign of [1, -1]) {
                const layer = part.head && k === 2 && sign < 0 ? GOLEM_LAYERS.face : GOLEM_LAYERS.iron;
                cursor = emitFace(out, cursor, { g, pose, part, layer, sky, blk, k, sign, c, s });
            }
        }
    }
    return cursor;
}
