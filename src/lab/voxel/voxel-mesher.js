import { BLOCK, SUB_SIZE, getBlockFlags, getFaceTexture, isOpaque, isTranslucent } from "./voxel-blocks.js";

const FACE_BASIS = [
    { dAxis: 0, uAxis: 2, vAxis: 1, step: 1, flipWinding: true },
    { dAxis: 0, uAxis: 2, vAxis: 1, step: -1, flipWinding: false },
    { dAxis: 1, uAxis: 0, vAxis: 2, step: 1, flipWinding: true },
    { dAxis: 1, uAxis: 0, vAxis: 2, step: -1, flipWinding: false },
    { dAxis: 2, uAxis: 0, vAxis: 1, step: 1, flipWinding: false },
    { dAxis: 2, uAxis: 0, vAxis: 1, step: -1, flipWinding: true }
];

export function packVertex(vx, vy, vz, face, ao, uvIdx, texId, sun, blk, qw, qh, flags) {
    const w0 =
        ((vx & 31) |
            ((vy & 31) << 5) |
            ((vz & 31) << 10) |
            ((face & 7) << 15) |
            ((ao & 3) << 18) |
            ((uvIdx & 3) << 20) |
            ((texId & 255) << 22)) >>>
        0;
    const w1 =
        ((sun & 15) |
            ((blk & 15) << 4) |
            ((qw & 31) << 8) |
            ((qh & 31) << 13) |
            ((flags & 15) << 18)) >>>
        0;
    return [w0, w1];
}

function vertexAO(s1, s2, c) {
    if (s1 && s2) return 0;
    return 3 - (s1 + s2 + c);
}

function isOccluding(id) {
    return isOpaque(id);
}

function buildCoord(dAxis, uAxis, vAxis, d, u, v) {
    const out = [0, 0, 0];
    out[dAxis] = d;
    out[uAxis] = u;
    out[vAxis] = v;
    return out;
}

function computeQuadAO(faceDef, getBlock, baseY, d, u, v) {
    const { dAxis, uAxis, vAxis, step } = faceDef;
    const nd = d + (step > 0 ? 1 : -1);
    const occ = (du, dv) => {
        const p = buildCoord(dAxis, uAxis, vAxis, nd, u + du, v + dv);
        return isOccluding(getBlock(p[0], baseY + p[1], p[2])) ? 1 : 0;
    };
    const m00 = occ(-1, -1);
    const m10 = occ(0, -1);
    const m20 = occ(1, -1);
    const m01 = occ(-1, 0);
    const m21 = occ(1, 0);
    const m02 = occ(-1, 1);
    const m12 = occ(0, 1);
    const m22 = occ(1, 1);
    return [
        vertexAO(m01, m10, m00),
        vertexAO(m21, m10, m20),
        vertexAO(m21, m12, m22),
        vertexAO(m01, m12, m02)
    ];
}

function pushVertex(arr, p, face, ao, uvIdx, texId, sun, blk, qw, qh, flags) {
    const [w0, w1] = packVertex(p[0], p[1], p[2], face, ao, uvIdx, texId, sun, blk, qw, qh, flags);
    arr.push(w0, w1);
}

export function meshSubchunk(sy, getBlock, getLight) {
    const baseY = sy * SUB_SIZE;
    const opaque = [];
    const translucent = [];
    const mask = new Array(SUB_SIZE * SUB_SIZE);

    for (let face = 0; face < 6; face += 1) {
        const fDef = FACE_BASIS[face];
        const { dAxis, uAxis, vAxis, step, flipWinding } = fDef;

        for (let d = 0; d < SUB_SIZE; d += 1) {
            mask.fill(null);

            for (let v = 0; v < SUB_SIZE; v += 1) {
                for (let u = 0; u < SUB_SIZE; u += 1) {
                    const c = buildCoord(dAxis, uAxis, vAxis, d, u, v);
                    const id = getBlock(c[0], baseY + c[1], c[2]);
                    if (id === BLOCK.AIR) continue;

                    const nbPos = buildCoord(dAxis, uAxis, vAxis, d + step, u, v);
                    const nbId = getBlock(nbPos[0], baseY + nbPos[1], nbPos[2]);
                    const trans = isTranslucent(id);

                    if (trans) {
                        if (nbId === id || (!trans && isOpaque(nbId)) || isOpaque(nbId)) continue;
                    } else if (isOpaque(nbId)) {
                        continue;
                    }

                    const lByte = getLight(nbPos[0], baseY + nbPos[1], nbPos[2]);
                    const sun = id === BLOCK.WATER ? Math.max((lByte >> 4) & 15, (getLight(c[0], baseY + c[1], c[2]) >> 4) & 15) : (lByte >> 4) & 15;
                    const blk = Math.max(lByte & 15, id === BLOCK.LAVA ? 15 : id === BLOCK.TORCH ? 14 : 0);
                    const texId = getFaceTexture(id, face);
                    const flags = getBlockFlags(id);
                    const ao = trans ? [3, 3, 3, 3] : computeQuadAO(fDef, getBlock, baseY, d, u, v);
                    const key =
                        ((texId & 255) << 20) |
                        ((flags & 15) << 16) |
                        ((sun & 15) << 12) |
                        ((blk & 15) << 8) |
                        (ao[0] << 6) |
                        (ao[1] << 4) |
                        (ao[2] << 2) |
                        ao[3];
                    mask[u + v * SUB_SIZE] = { key, texId, flags, sun, blk, ao, trans };
                }
            }

            for (let v = 0; v < SUB_SIZE; v += 1) {
                for (let u = 0; u < SUB_SIZE; u += 1) {
                    const cell = mask[u + v * SUB_SIZE];
                    if (!cell) continue;
                    let qw = 1;
                    while (u + qw < SUB_SIZE && mask[u + qw + v * SUB_SIZE]?.key === cell.key) {
                        qw += 1;
                    }
                    let qh = 1;
                    outer: while (v + qh < SUB_SIZE) {
                        for (let k = 0; k < qw; k += 1) {
                            if (mask[u + k + (v + qh) * SUB_SIZE]?.key !== cell.key) break outer;
                        }
                        qh += 1;
                    }
                    for (let dv = 0; dv < qh; dv += 1) {
                        for (let du = 0; du < qw; du += 1) {
                            mask[u + du + (v + dv) * SUB_SIZE] = null;
                        }
                    }

                    const dPlane = d + (step > 0 ? 1 : 0);
                    const p0 = buildCoord(dAxis, uAxis, vAxis, dPlane, u, v);
                    const p1 = buildCoord(dAxis, uAxis, vAxis, dPlane, u + qw, v);
                    const p2 = buildCoord(dAxis, uAxis, vAxis, dPlane, u + qw, v + qh);
                    const p3 = buildCoord(dAxis, uAxis, vAxis, dPlane, u, v + qh);
                    const target = cell.trans ? translucent : opaque;
                    const { texId, sun, blk, ao, flags } = cell;

                    const flipDiag = ao[0] + ao[2] < ao[1] + ao[3];
                    const emitTri = (ia, ib, ic, pa, pb, pc, ua, ub, uc) => {
                        if (flipWinding) {
                            pushVertex(target, pa, face, ao[ia], ua, texId, sun, blk, qw, qh, flags);
                            pushVertex(target, pc, face, ao[ic], uc, texId, sun, blk, qw, qh, flags);
                            pushVertex(target, pb, face, ao[ib], ub, texId, sun, blk, qw, qh, flags);
                        } else {
                            pushVertex(target, pa, face, ao[ia], ua, texId, sun, blk, qw, qh, flags);
                            pushVertex(target, pb, face, ao[ib], ub, texId, sun, blk, qw, qh, flags);
                            pushVertex(target, pc, face, ao[ic], uc, texId, sun, blk, qw, qh, flags);
                        }
                    };

                    if (flipDiag) {
                        emitTri(1, 2, 3, p1, p2, p3, 1, 2, 3);
                        emitTri(3, 0, 1, p3, p0, p1, 3, 0, 1);
                    } else {
                        emitTri(0, 1, 2, p0, p1, p2, 0, 1, 2);
                        emitTri(0, 2, 3, p0, p2, p3, 0, 2, 3);
                    }
                }
            }
        }
    }

    return {
        opaque: new Uint32Array(opaque),
        translucent: new Uint32Array(translucent)
    };
}
