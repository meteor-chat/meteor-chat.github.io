import {
    BLOCK,
    SUB_SIZE,
    getBlockFlags,
    getEmissiveLight,
    getFaceTexture,
    isCrossPlant,
    isOpaque,
    isTorch,
    isTranslucent
} from "./voxel-blocks.js";

const FACE_BASIS = [
    { dAxis: 0, uAxis: 2, vAxis: 1, step: 1, flipWinding: true },
    { dAxis: 0, uAxis: 2, vAxis: 1, step: -1, flipWinding: false },
    { dAxis: 1, uAxis: 0, vAxis: 2, step: 1, flipWinding: true },
    { dAxis: 1, uAxis: 0, vAxis: 2, step: -1, flipWinding: false },
    { dAxis: 2, uAxis: 0, vAxis: 1, step: 1, flipWinding: false },
    { dAxis: 2, uAxis: 0, vAxis: 1, step: -1, flipWinding: true }
];

const WATER_SURFACE_FLAG = 16;

export function packVertex(vx, vy, vz, face, ao, uvIdx, texId, sun, blk, qw, qh, flags, tint = 128) {
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
            ((flags & 63) << 18) |
            ((tint & 255) << 24)) >>>
        0;
    return [w0, w1];
}

function vertexAO(s1, s2, c) {
    if (s1 && s2) return 0;
    return 3 - (s1 + s2 + c);
}

function isOccluding(id) {
    return isOpaque(id) && getEmissiveLight(id) === 0;
}

function coord3(dAxis, uAxis, vAxis, d, u, v, out) {
    out[dAxis] = d;
    out[uAxis] = u;
    out[vAxis] = v;
    return out;
}

const TMP_A = [0, 0, 0];
const TMP_B = [0, 0, 0];

function computeQuadAOLight(faceDef, getBlock, getLight, baseY, d, u, v, selfLight, forceFullAO) {
    const { dAxis, uAxis, vAxis, step } = faceDef;
    const nd = d + (step > 0 ? 1 : -1);
    const sGrid = new Uint8Array(9);
    const bGrid = new Uint8Array(9);
    const oGrid = new Uint8Array(9);

    for (let dv = -1; dv <= 1; dv += 1) {
        for (let du = -1; du <= 1; du += 1) {
            const p = coord3(dAxis, uAxis, vAxis, nd, u + du, v + dv, TMP_B);
            const id = getBlock(p[0], baseY + p[1], p[2]);
            const idx = (du + 1) + (dv + 1) * 3;
            oGrid[idx] = isOccluding(id) ? 1 : 0;
            const lb = getLight(p[0], baseY + p[1], p[2]);
            sGrid[idx] = (lb >> 4) & 15;
            bGrid[idx] = lb & 15;
        }
    }

    const cSun = Math.max(sGrid[4], (selfLight >> 4) & 15);
    const cBlk = Math.max(bGrid[4], selfLight & 15);

    const smoothCorner = (i1, i2, ic) => {
        let sSum = cSun;
        let bSum = cBlk;
        let count = 1;
        const o1 = oGrid[i1];
        const o2 = oGrid[i2];
        if (!o1) {
            sSum += sGrid[i1];
            bSum += bGrid[i1];
            count += 1;
        }
        if (!o2) {
            sSum += sGrid[i2];
            bSum += bGrid[i2];
            count += 1;
        }
        if (!(o1 && o2) && !oGrid[ic]) {
            sSum += sGrid[ic];
            bSum += bGrid[ic];
            count += 1;
        }
        return [Math.round(sSum / count), Math.round(bSum / count)];
    };

    const ao = forceFullAO
        ? [3, 3, 3, 3]
        : [
            vertexAO(oGrid[3], oGrid[1], oGrid[0]),
            vertexAO(oGrid[5], oGrid[1], oGrid[2]),
            vertexAO(oGrid[5], oGrid[7], oGrid[8]),
            vertexAO(oGrid[3], oGrid[7], oGrid[6])
        ];
    const c0 = smoothCorner(3, 1, 0);
    const c1 = smoothCorner(5, 1, 2);
    const c2 = smoothCorner(5, 7, 8);
    const c3 = smoothCorner(3, 7, 6);
    return {
        ao,
        sun: [c0[0], c1[0], c2[0], c3[0]],
        blk: [c0[1], c1[1], c2[1], c3[1]]
    };
}

function pushPacked(arr, px, py, pz, face, ao, uvIdx, texId, sun, blk, qw, qh, flags, tint) {
    const [w0, w1] = packVertex(px, py, pz, face, ao, uvIdx, texId, sun, blk, qw, qh, flags, tint);
    arr.push(w0, w1);
}

function pushCutoutVert(arr, x, y, z, u, v, face, texId, sun, blk, ao, flags, tint) {
    const metaA = (face & 7) | ((texId & 255) << 3) | ((flags & 63) << 11);
    const metaB = (sun & 15) | ((blk & 15) << 4) | ((ao & 3) << 8) | ((tint & 255) << 10);
    arr.push(x, y, z, u, v, metaA, metaB);
}

function emitCutoutQuad(arr, p0, p1, p2, p3, u0, v0, u1, v1, face, texId, sun, blk, ao, flags, tint) {
    pushCutoutVert(arr, p0[0], p0[1], p0[2], u0, v0, face, texId, sun, blk, ao, flags, tint);
    pushCutoutVert(arr, p1[0], p1[1], p1[2], u1, v0, face, texId, sun, blk, ao, flags, tint);
    pushCutoutVert(arr, p2[0], p2[1], p2[2], u1, v1, face, texId, sun, blk, ao, flags, tint);
    pushCutoutVert(arr, p0[0], p0[1], p0[2], u0, v0, face, texId, sun, blk, ao, flags, tint);
    pushCutoutVert(arr, p2[0], p2[1], p2[2], u1, v1, face, texId, sun, blk, ao, flags, tint);
    pushCutoutVert(arr, p3[0], p3[1], p3[2], u0, v1, face, texId, sun, blk, ao, flags, tint);
}

function emitCrossPlant(arr, lx, ly, lz, id, sun, blk, tint) {
    const texId = getFaceTexture(id, 4);
    const flags = getBlockFlags(id);
    const m = 0.14;
    const h = id === BLOCK.TALL_GRASS ? 0.88 : id === BLOCK.WHEAT ? 0.92 : 0.72;
    const x0 = lx + m;
    const x1 = lx + 1 - m;
    const z0 = lz + m;
    const z1 = lz + 1 - m;
    const y0 = ly;
    const y1 = ly + h;
    emitCutoutQuad(arr, [x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0], 0, 0, 1, 1, 4, texId, sun, blk, 3, flags, tint);
    emitCutoutQuad(arr, [x1, y0, z0], [x0, y0, z1], [x0, y1, z1], [x1, y1, z0], 0, 0, 1, 1, 0, texId, sun, blk, 3, flags, tint);
}

function emitTorch(arr, lx, ly, lz, sun, tint) {
    const texId = getFaceTexture(BLOCK.TORCH, 4);
    const flags = 2;
    const r = 0.085;
    const x0 = lx + 0.5 - r;
    const x1 = lx + 0.5 + r;
    const z0 = lz + 0.5 - r;
    const z1 = lz + 0.5 + r;
    const y0 = ly;
    const y1 = ly + 0.64;
    emitCutoutQuad(arr, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], 0.38, 0.0, 0.62, 0.86, 4, texId, sun, 14, 3, flags, tint);
    emitCutoutQuad(arr, [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], 0.38, 0.0, 0.62, 0.86, 5, texId, sun, 14, 3, flags, tint);
    emitCutoutQuad(arr, [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], 0.38, 0.0, 0.62, 0.86, 0, texId, sun, 14, 3, flags, tint);
    emitCutoutQuad(arr, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], 0.38, 0.0, 0.62, 0.86, 1, texId, sun, 14, 3, flags, tint);
    emitCutoutQuad(arr, [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], 0.42, 0.74, 0.58, 0.92, 2, texId, sun, 14, 3, flags, tint);
}

function emitLeafFace(arr, fDef, face, d, u, v, texId, sunArr, blkArr, aoArr, flags, tint) {
    const { dAxis, uAxis, vAxis, step, flipWinding } = fDef;
    const dPlane = d + (step > 0 ? 1 : 0);
    const p0 = coord3(dAxis, uAxis, vAxis, dPlane, u, v, [0, 0, 0]);
    const p1 = coord3(dAxis, uAxis, vAxis, dPlane, u + 1, v, [0, 0, 0]);
    const p2 = coord3(dAxis, uAxis, vAxis, dPlane, u + 1, v + 1, [0, 0, 0]);
    const p3 = coord3(dAxis, uAxis, vAxis, dPlane, u, v + 1, [0, 0, 0]);
    const pts = [p0, p1, p2, p3];
    const uvs = [[0, 0], [1, 0], [1, 1], [0, 1]];
    const emit = (i) => pushCutoutVert(arr, pts[i][0], pts[i][1], pts[i][2], uvs[i][0], uvs[i][1], face, texId, sunArr[i], blkArr[i], aoArr[i], flags, tint);
    const flipDiag = aoArr[0] + aoArr[2] < aoArr[1] + aoArr[3];
    const tris = flipDiag ? [[1, 2, 3], [3, 0, 1]] : [[0, 1, 2], [0, 2, 3]];
    for (const [ia, ib, ic] of tris) {
        if (flipWinding) {
            emit(ia);
            emit(ic);
            emit(ib);
        } else {
            emit(ia);
            emit(ib);
            emit(ic);
        }
    }
}

export function meshSubchunk(sy, getBlock, getLight, getTint = null) {
    const baseY = sy * SUB_SIZE;
    const opaque = [];
    const cutout = [];
    const translucent = [];
    const mask = new Array(SUB_SIZE * SUB_SIZE);
    let minX = 16;
    let minY = 16;
    let minZ = 16;
    let maxX = 0;
    let maxY = 0;
    let maxZ = 0;

    const expandBounds = (x0, y0, z0, x1, y1, z1) => {
        if (x0 < minX) minX = x0;
        if (y0 < minY) minY = y0;
        if (z0 < minZ) minZ = z0;
        if (x1 > maxX) maxX = x1;
        if (y1 > maxY) maxY = y1;
        if (z1 > maxZ) maxZ = z1;
    };

    for (let ly = 0; ly < SUB_SIZE; ly += 1) {
        for (let lz = 0; lz < SUB_SIZE; lz += 1) {
            for (let lx = 0; lx < SUB_SIZE; lx += 1) {
                const id = getBlock(lx, baseY + ly, lz);
                if (id === BLOCK.AIR) continue;
                if (isCrossPlant(id)) {
                    const lb = getLight(lx, baseY + ly, lz);
                    const tint = getTint ? getTint(lx, lz) : 128;
                    emitCrossPlant(cutout, lx, ly, lz, id, (lb >> 4) & 15, lb & 15, tint);
                    expandBounds(lx, ly, lz, lx + 1, ly + 1, lz + 1);
                } else if (isTorch(id)) {
                    const lb = getLight(lx, baseY + ly, lz);
                    emitTorch(cutout, lx, ly, lz, (lb >> 4) & 15, 128);
                    expandBounds(lx, ly, lz, lx + 1, ly + 1, lz + 1);
                }
            }
        }
    }

    for (let face = 0; face < 6; face += 1) {
        const fDef = FACE_BASIS[face];
        const { dAxis, uAxis, vAxis, step, flipWinding } = fDef;

        for (let d = 0; d < SUB_SIZE; d += 1) {
            mask.fill(null);

            for (let v = 0; v < SUB_SIZE; v += 1) {
                for (let u = 0; u < SUB_SIZE; u += 1) {
                    const c = coord3(dAxis, uAxis, vAxis, d, u, v, TMP_A);
                    const wy = baseY + c[1];
                    const id = getBlock(c[0], wy, c[2]);
                    if (id === BLOCK.AIR || isCrossPlant(id) || isTorch(id)) continue;

                    const nbPos = coord3(dAxis, uAxis, vAxis, d + step, u, v, TMP_B);
                    const nwy = baseY + nbPos[1];
                    if (nwy < 0) continue;
                    const nbId = getBlock(nbPos[0], nwy, nbPos[2]);
                    const trans = isTranslucent(id);
                    const cut = id === BLOCK.LEAVES;

                    if (trans) {
                        if (nbId === id || isOpaque(nbId)) continue;
                        if (id === BLOCK.WATER && nbId === BLOCK.GLASS) continue;
                    } else if (cut) {
                        if (isOpaque(nbId) || nbId === BLOCK.LEAVES) continue;
                    } else if (isOpaque(nbId)) {
                        continue;
                    }

                    const selfLight =
                        id === BLOCK.WATER
                            ? getLight(c[0], wy, c[2])
                            : id === BLOCK.LAVA
                                ? 15
                                : 0;
                    const texId = getFaceTexture(id, face);
                    let flags = getBlockFlags(id);
                    if (id === BLOCK.WATER && face === 2 && nbId !== BLOCK.WATER) {
                        flags |= WATER_SURFACE_FLAG;
                    }
                    const tint = (flags & 32) !== 0 && getTint ? getTint(c[0], c[2]) : 128;

                    if (cut) {
                        const ql = computeQuadAOLight(fDef, getBlock, getLight, baseY, d, u, v, selfLight, false);
                        emitLeafFace(cutout, fDef, face, d, u, v, texId, ql.sun, ql.blk, ql.ao, flags, tint);
                        expandBounds(c[0], c[1], c[2], c[0] + 1, c[1] + 1, c[2] + 1);
                        continue;
                    }

                    const ql = computeQuadAOLight(fDef, getBlock, getLight, baseY, d, u, v, selfLight, trans);
                    const uniformLight =
                        ql.sun[0] === ql.sun[1] &&
                        ql.sun[0] === ql.sun[2] &&
                        ql.sun[0] === ql.sun[3] &&
                        ql.blk[0] === ql.blk[1] &&
                        ql.blk[0] === ql.blk[2] &&
                        ql.blk[0] === ql.blk[3];
                    const uniformAo = ql.ao[0] === ql.ao[1] && ql.ao[0] === ql.ao[2] && ql.ao[0] === ql.ao[3];
                    const mergeKey =
                        uniformLight && uniformAo
                            ? `${texId}:${flags}:${tint}:${ql.sun[0]}:${ql.blk[0]}:${ql.ao[0]}`
                            : null;
                    mask[u + v * SUB_SIZE] = {
                        mergeKey,
                        texId,
                        flags,
                        tint,
                        sun: ql.sun,
                        blk: ql.blk,
                        ao: ql.ao,
                        trans
                    };
                }
            }

            for (let v = 0; v < SUB_SIZE; v += 1) {
                for (let u = 0; u < SUB_SIZE; u += 1) {
                    const cell = mask[u + v * SUB_SIZE];
                    if (!cell) continue;
                    let qw = 1;
                    let qh = 1;
                    if (cell.mergeKey !== null) {
                        while (u + qw < SUB_SIZE && mask[u + qw + v * SUB_SIZE]?.mergeKey === cell.mergeKey) {
                            qw += 1;
                        }
                        outer: while (v + qh < SUB_SIZE) {
                            for (let k = 0; k < qw; k += 1) {
                                if (mask[u + k + (v + qh) * SUB_SIZE]?.mergeKey !== cell.mergeKey) break outer;
                            }
                            qh += 1;
                        }
                    }
                    for (let dv = 0; dv < qh; dv += 1) {
                        for (let du = 0; du < qw; du += 1) {
                            mask[u + du + (v + dv) * SUB_SIZE] = null;
                        }
                    }

                    const dPlane = d + (step > 0 ? 1 : 0);
                    const p0 = coord3(dAxis, uAxis, vAxis, dPlane, u, v, [0, 0, 0]);
                    const p1 = coord3(dAxis, uAxis, vAxis, dPlane, u + qw, v, [0, 0, 0]);
                    const p2 = coord3(dAxis, uAxis, vAxis, dPlane, u + qw, v + qh, [0, 0, 0]);
                    const p3 = coord3(dAxis, uAxis, vAxis, dPlane, u, v + qh, [0, 0, 0]);
                    expandBounds(
                        Math.min(p0[0], p2[0]),
                        Math.min(p0[1], p2[1]),
                        Math.min(p0[2], p2[2]),
                        Math.max(p0[0], p2[0]),
                        Math.max(p0[1], p2[1]),
                        Math.max(p0[2], p2[2])
                    );

                    const target = cell.trans ? translucent : opaque;
                    const { texId, sun, blk, ao, flags, tint } = cell;
                    const flipDiag = ao[0] + ao[2] < ao[1] + ao[3];
                    const emitTri = (ia, ib, ic, pa, pb, pc, ua, ub, uc) => {
                        if (flipWinding) {
                            pushPacked(target, pa[0], pa[1], pa[2], face, ao[ia], ua, texId, sun[ia], blk[ia], qw, qh, flags, tint);
                            pushPacked(target, pc[0], pc[1], pc[2], face, ao[ic], uc, texId, sun[ic], blk[ic], qw, qh, flags, tint);
                            pushPacked(target, pb[0], pb[1], pb[2], face, ao[ib], ub, texId, sun[ib], blk[ib], qw, qh, flags, tint);
                        } else {
                            pushPacked(target, pa[0], pa[1], pa[2], face, ao[ia], ua, texId, sun[ia], blk[ia], qw, qh, flags, tint);
                            pushPacked(target, pb[0], pb[1], pb[2], face, ao[ib], ub, texId, sun[ib], blk[ib], qw, qh, flags, tint);
                            pushPacked(target, pc[0], pc[1], pc[2], face, ao[ic], uc, texId, sun[ic], blk[ic], qw, qh, flags, tint);
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

    const bounds = minX < maxX || minY < maxY || minZ < maxZ
        ? [minX, minY, minZ, maxX, maxY, maxZ]
        : null;

    return {
        opaque: new Uint32Array(opaque),
        cutout: new Float32Array(cutout),
        translucent: new Uint32Array(translucent),
        bounds
    };
}
