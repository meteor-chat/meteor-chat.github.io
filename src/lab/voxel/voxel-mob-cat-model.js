import { TEX } from "./voxel-blocks.js";

export const MAX_CATS = 8;
export const FLOATS_PER_VERTEX = 11;
export const VERTS_PER_BOX = 36;

export const CAT_LAYERS = Object.freeze({
    orange: { fur: TEX.CAT_FUR_ORANGE, face: TEX.CAT_FACE_ORANGE },
    black: { fur: TEX.CAT_FUR_BLACK, face: TEX.CAT_FACE_BLACK },
    calico: { fur: TEX.CAT_FUR_CALICO, face: TEX.CAT_FACE_CALICO },
    white: { fur: TEX.CAT_FUR_WHITE, face: TEX.CAT_FACE_WHITE },
    sand: { fur: TEX.CAT_FUR_SAND, face: TEX.CAT_FACE_SAND }
});

const UV_SCALE = 2;
const SIT_DROP = 0.165;
const PIVOTS = {
    body: [0, 0.18, 0.24],
    head: [0, 0.42, -0.28],
    tail1: [0, 0.34, 0.26],
    tail2: [0, 0.34, 0.46],
    legFL: [-0.08, 0.2, -0.195],
    legFR: [0.08, 0.2, -0.195],
    legBL: [-0.08, 0.2, 0.195],
    legBR: [0.08, 0.2, 0.195]
};

const PARTS = [
    { min: [-0.14, 0.18, -0.26], max: [0.14, 0.42, 0.26], chain: ["body"], uvOff: [0, 0] },
    { min: [-0.13, 0.34, -0.5], max: [0.13, 0.58, -0.24], chain: ["head", "body"], head: true, uvOff: [0.12, 0.08] },
    { min: [-0.065, 0.35, -0.55], max: [0.065, 0.45, -0.5], chain: ["head", "body"], snout: true, uvOff: [0, 0] },
    { min: [-0.11, 0.58, -0.42], max: [-0.04, 0.65, -0.35], chain: ["head", "body"], uvOff: [0.22, 0.3] },
    { min: [0.04, 0.58, -0.42], max: [0.11, 0.65, -0.35], chain: ["head", "body"], uvOff: [0.35, 0.18] },
    { min: [-0.125, 0, -0.24], max: [-0.035, 0.2, -0.15], chain: ["legFL", "body"], uvOff: [0.05, 0.4] },
    { min: [0.035, 0, -0.24], max: [0.125, 0.2, -0.15], chain: ["legFR", "body"], uvOff: [0.28, 0.12] },
    { min: [-0.125, 0, 0.15], max: [-0.035, 0.2, 0.24], chain: ["legBL", "body"], uvOff: [0.18, 0.35] },
    { min: [0.035, 0, 0.15], max: [0.125, 0.2, 0.24], chain: ["legBR", "body"], uvOff: [0.4, 0.22] },
    { min: [-0.04, 0.3, 0.26], max: [0.04, 0.38, 0.46], chain: ["tail1", "body"], uvOff: [0.32, 0.05] },
    { min: [-0.035, 0.3, 0.46], max: [0.035, 0.37, 0.66], chain: ["tail2", "tail1", "body"], uvOff: [0.1, 0.28] }
];

export const BOXES_PER_CAT = PARTS.length;
export const VERTS_PER_CAT = BOXES_PER_CAT * VERTS_PER_BOX;
export const FLOATS_PER_CAT = VERTS_PER_CAT * FLOATS_PER_VERTEX;

const CORNERS = [[0, 0], [1, 0], [1, 1], [0, 1]];
const AXES = [[1, 2], [2, 0], [0, 1]];
const scratch = [0, 0, 0];

export function catPose(cat, timeSec) {
    const { phase, moving, sit, headYaw = 0 } = cat.anim;
    const seed = cat.phaseSeed !== undefined ? cat.phaseSeed : 0;
    const stride = Math.sin(phase) * 0.85 * moving * (1 - sit);
    const bodyPitch = 0.42 * sit;
    const fore = -bodyPitch;
    const hind = -bodyPitch + 1.52 * sit;
    const sway = Math.sin(timeSec * 1.8 + seed);
    const idleHeadY = Math.sin(timeSec * 0.8 + seed) * 0.28 * (1 - moving * 0.7);
    return {
        drop: -SIT_DROP * sit,
        body: { rx: bodyPitch, ry: 0 },
        head: {
            rx: -bodyPitch * 0.8 + Math.sin(timeSec * 2 + seed) * 0.02,
            ry: headYaw !== 0 ? headYaw : idleHeadY
        },
        legFL: { rx: fore + stride, ry: 0 },
        legFR: { rx: fore - stride, ry: 0 },
        legBL: { rx: hind - stride, ry: 0 },
        legBR: { rx: hind + stride, ry: 0 },
        tail1: { rx: 0.25 - 0.65 * moving - 0.72 * sit, ry: sway * (0.25 + 0.15 * (1 - moving)) },
        tail2: { rx: -0.25 * moving - 0.22 * sit, ry: Math.sin(timeSec * 2.4 + seed + 1) * 0.35 }
    };
}

function rotateStage(name, pose, v, translate) {
    const stage = pose[name];
    const pivot = PIVOTS[name];
    if (translate) {
        v[0] -= pivot[0];
        v[1] -= pivot[1];
        v[2] -= pivot[2];
    }
    if (stage.rx) {
        const c = Math.cos(stage.rx);
        const s = Math.sin(stage.rx);
        const y = v[1] * c - v[2] * s;
        v[2] = v[1] * s + v[2] * c;
        v[1] = y;
    }
    if (stage.ry) {
        const c = Math.cos(stage.ry);
        const s = Math.sin(stage.ry);
        const x = v[0] * c + v[2] * s;
        v[2] = -v[0] * s + v[2] * c;
        v[0] = x;
    }
    if (translate) {
        v[0] += pivot[0];
        v[1] += pivot[1];
        v[2] += pivot[2];
    }
}

function writeVertex(out, o, px, py, pz, normal, u, v, layer, sky, blk) {
    out[o] = px;
    out[o + 1] = py;
    out[o + 2] = pz;
    out[o + 3] = normal[0];
    out[o + 4] = normal[1];
    out[o + 5] = normal[2];
    out[o + 6] = u;
    out[o + 7] = v;
    out[o + 8] = layer;
    out[o + 9] = sky;
    out[o + 10] = blk;
}

function placeInWorld(cat, pose, chain, local, isPoint, c, s, dest) {
    scratch[0] = local[0];
    scratch[1] = local[1];
    scratch[2] = local[2];
    for (const name of chain) rotateStage(name, pose, scratch, isPoint);
    const x = scratch[0] * c - scratch[2] * s;
    const z = scratch[0] * s + scratch[2] * c;
    dest[0] = x + (isPoint ? cat.pos[0] : 0);
    dest[1] = scratch[1] + (isPoint ? cat.pos[1] + pose.drop : 0);
    dest[2] = z + (isPoint ? cat.pos[2] : 0);
}

const placed = [0, 0, 0];
const placedNormal = [0, 0, 0];
const local = [0, 0, 0];
const localNormal = [0, 0, 0];
const faceVerts = [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0]
];
const QUAD_IDX = [0, 1, 2, 0, 2, 3];

function emitFace(out, cursor, args) {
    const { cat, pose, part, layer, sky, blk, k, sign, c, s } = args;
    const [uAxis, vAxis] = AXES[k];
    localNormal[0] = 0;
    localNormal[1] = 0;
    localNormal[2] = 0;
    localNormal[k] = sign;
    placeInWorld(cat, pose, part.chain, localNormal, false, c, s, placedNormal);
    const order = sign > 0 ? [0, 1, 2, 3] : [0, 3, 2, 1];
    const sizeU = part.max[uAxis] - part.min[uAxis];
    const sizeV = part.max[vAxis] - part.min[vAxis];
    const uvShift = cat.variant === "calico" && part.uvOff ? part.uvOff : [0, 0];

    for (let idx = 0; idx < 4; idx += 1) {
        const [cu, cv] = CORNERS[order[idx]];
        local[k] = sign > 0 ? part.max[k] : part.min[k];
        local[uAxis] = cu ? part.max[uAxis] : part.min[uAxis];
        local[vAxis] = cv ? part.max[vAxis] : part.min[vAxis];
        placeInWorld(cat, pose, part.chain, local, true, c, s, placed);
        const du = sign < 0 ? 1 - cu : cu;
        const full = part.head && k === 2 && sign < 0;
        const snoutFront = part.snout && k === 2 && sign < 0;
        let u;
        let v;
        if (full) {
            u = du;
            v = cv;
        } else if (snoutFront) {
            u = 0.34 + du * 0.32;
            v = 0.22 + cv * 0.26;
        } else if (k === 0) {
            u = cv * sizeV * UV_SCALE + uvShift[0];
            v = du * sizeU * UV_SCALE + uvShift[1];
        } else {
            u = du * sizeU * UV_SCALE + uvShift[0];
            v = cv * sizeV * UV_SCALE + uvShift[1];
        }
        const dst = faceVerts[idx];
        dst[0] = placed[0];
        dst[1] = placed[1];
        dst[2] = placed[2];
        dst[3] = u;
        dst[4] = v;
    }

    let o = cursor;
    for (let t = 0; t < 6; t += 1) {
        const vert = faceVerts[QUAD_IDX[t]];
        writeVertex(out, o, vert[0], vert[1], vert[2], placedNormal, vert[3], vert[4], layer, sky, blk);
        o += FLOATS_PER_VERTEX;
    }
    return o;
}

export function buildCatVertices(cat, timeSec, out, offset) {
    const pose = catPose(cat, timeSec);
    const layers = CAT_LAYERS[cat.variant] || CAT_LAYERS.orange;
    const sky = cat.sky === undefined ? 1 : cat.sky;
    const blk = cat.blk === undefined ? 0 : cat.blk;
    const c = Math.cos(cat.yaw);
    const s = Math.sin(cat.yaw);
    let cursor = offset;
    for (const part of PARTS) {
        for (let k = 0; k < 3; k += 1) {
            for (const sign of [1, -1]) {
                const front = (part.head || part.snout) && k === 2 && sign < 0;
                const layer = front ? layers.face : layers.fur;
                cursor = emitFace(out, cursor, { cat, pose, part, layer, sky, blk, k, sign, c, s });
            }
        }
    }
    return cursor;
}
