import { TEX } from "./voxel-blocks.js";

export const MAX_CHICKENS = 8;
export const FLOATS_PER_VERTEX = 10;
export const VERTS_PER_BOX = 36;

export const CHICKEN_LAYERS = Object.freeze({
    feather: TEX.CHICKEN_FEATHER,
    face: TEX.CHICKEN_FACE,
    beak: TEX.CHICKEN_BEAK,
    wattle: TEX.CHICKEN_WATTLE
});

const UV_SCALE = 2;
const PIVOTS = {
    body: [0, 0.18, 0],
    head: [0, 0.34, -0.16],
    wingL: [-0.12, 0.36, 0],
    wingR: [0.12, 0.36, 0],
    legL: [-0.05, 0.18, 0],
    legR: [0.05, 0.18, 0]
};

const PARTS = [
    { min: [-0.12, 0.18, -0.16], max: [0.12, 0.38, 0.16], chain: ["body"] },
    { min: [-0.08, 0.34, -0.32], max: [0.08, 0.52, -0.16], chain: ["head", "body"], head: true },
    { min: [-0.04, 0.40, -0.40], max: [0.04, 0.46, -0.32], chain: ["head", "body"], layerType: "beak" },
    { min: [-0.02, 0.34, -0.36], max: [0.02, 0.40, -0.32], chain: ["head", "body"], layerType: "wattle" },
    { min: [-0.15, 0.22, -0.12], max: [-0.12, 0.36, 0.12], chain: ["wingL", "body"] },
    { min: [0.12, 0.22, -0.12], max: [0.15, 0.36, 0.12], chain: ["wingR", "body"] },
    { min: [-0.07, 0, -0.03], max: [-0.03, 0.18, 0.03], chain: ["legL", "body"], layerType: "beak" },
    { min: [0.03, 0, -0.03], max: [0.07, 0.18, 0.03], chain: ["legR", "body"], layerType: "beak" }
];

export const BOXES_PER_CHICKEN = PARTS.length;
export const VERTS_PER_CHICKEN = BOXES_PER_CHICKEN * VERTS_PER_BOX;
export const FLOATS_PER_CHICKEN = VERTS_PER_CHICKEN * FLOATS_PER_VERTEX;

const CORNERS = [[0, 0], [1, 0], [1, 1], [0, 1]];
const AXES = [[1, 2], [2, 0], [0, 1]];
const scratch = [0, 0, 0];

export function chickenPose(chicken, timeSec) {
    const { phase = 0, moving = 0, peck = 0, flutter = 0 } = chicken.anim || {};
    const stride = Math.sin(phase) * 0.9 * moving;
    const headBob = Math.sin(phase) * 0.15 * moving;
    const peckDrop = peck * 0.75;
    const wingFlap = Math.sin(timeSec * 28) * 0.85 * flutter;
    return {
        drop: 0,
        body: { rx: peckDrop * 0.2, ry: 0, rz: 0 },
        head: { rx: peckDrop + headBob, ry: 0, rz: 0 },
        wingL: { rx: 0, ry: 0, rz: wingFlap },
        wingR: { rx: 0, ry: 0, rz: -wingFlap },
        legL: { rx: stride, ry: 0, rz: 0 },
        legR: { rx: -stride, ry: 0, rz: 0 }
    };
}

function rotateStage(name, pose, v, translate) {
    const stage = pose[name];
    if (!stage) return;
    const pivot = PIVOTS[name];
    if (translate && pivot) {
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
    if (stage.rz) {
        const c = Math.cos(stage.rz);
        const s = Math.sin(stage.rz);
        const x = v[0] * c - v[1] * s;
        v[1] = v[0] * s + v[1] * c;
        v[0] = x;
    }
    if (translate && pivot) {
        v[0] += pivot[0];
        v[1] += pivot[1];
        v[2] += pivot[2];
    }
}

function writeVertex(out, o, px, py, pz, normal, u, v, layer, sky) {
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
}

function placeInWorld(chicken, pose, chain, localPt, isPoint, c, s, dest) {
    scratch[0] = localPt[0];
    scratch[1] = localPt[1];
    scratch[2] = localPt[2];
    for (const name of chain) rotateStage(name, pose, scratch, isPoint);
    const x = scratch[0] * c - scratch[2] * s;
    const z = scratch[0] * s + scratch[2] * c;
    dest[0] = x + (isPoint ? chicken.pos[0] : 0);
    dest[1] = scratch[1] + (isPoint ? chicken.pos[1] + pose.drop : 0);
    dest[2] = z + (isPoint ? chicken.pos[2] : 0);
}

const placed = [0, 0, 0];
const placedNormal = [0, 0, 0];
const localPos = [0, 0, 0];
const localNormal = [0, 0, 0];

function emitFace(out, cursor, args) {
    const { chicken, pose, part, layer, sky, k, sign, c, s } = args;
    const [uAxis, vAxis] = AXES[k];
    localNormal[0] = 0;
    localNormal[1] = 0;
    localNormal[2] = 0;
    localNormal[k] = sign;
    placeInWorld(chicken, pose, part.chain, localNormal, false, c, s, placedNormal);
    const order = sign > 0 ? [0, 1, 2, 3] : [0, 3, 2, 1];
    const sizeU = part.max[uAxis] - part.min[uAxis];
    const sizeV = part.max[vAxis] - part.min[vAxis];
    const verts = order.map((index) => {
        const [cu, cv] = CORNERS[index];
        localPos[k] = sign > 0 ? part.max[k] : part.min[k];
        localPos[uAxis] = cu ? part.max[uAxis] : part.min[uAxis];
        localPos[vAxis] = cv ? part.max[vAxis] : part.min[vAxis];
        placeInWorld(chicken, pose, part.chain, localPos, true, c, s, placed);
        const du = sign < 0 ? 1 - cu : cu;
        const full = part.head && k === 2 && sign < 0;
        const u = full ? du : du * sizeU * UV_SCALE;
        const v = full ? cv : cv * sizeV * UV_SCALE;
        return [placed[0], placed[1], placed[2], u, v];
    });
    let o = cursor;
    for (const i of [0, 1, 2, 0, 2, 3]) {
        const vert = verts[i];
        writeVertex(out, o, vert[0], vert[1], vert[2], placedNormal, vert[3], vert[4], layer, sky);
        o += FLOATS_PER_VERTEX;
    }
    return o;
}

export function buildChickenVertices(chicken, timeSec, out, offset) {
    const pose = chickenPose(chicken, timeSec);
    const sky = chicken.sky === undefined ? 1 : chicken.sky;
    const c = Math.cos(chicken.yaw);
    const s = Math.sin(chicken.yaw);
    let cursor = offset;
    for (const part of PARTS) {
        for (let k = 0; k < 3; k += 1) {
            for (const sign of [1, -1]) {
                let layer = CHICKEN_LAYERS.feather;
                if (part.layerType === "beak") layer = CHICKEN_LAYERS.beak;
                else if (part.layerType === "wattle") layer = CHICKEN_LAYERS.wattle;
                else if (part.head && k === 2 && sign < 0) layer = CHICKEN_LAYERS.face;
                cursor = emitFace(out, cursor, { chicken, pose, part, layer, sky, k, sign, c, s });
            }
        }
    }
    return cursor;
}
