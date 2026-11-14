import { MAX_CATS } from "./voxel-mob-cat-model.js";

export const BLOB_FLOATS_PER_VERTEX = 6;
export const BLOB_VERTS_PER_CAT = 6;

const BLOB_STRENGTH = 0.46;
const BLOB_LIFT = 0.02;
const HALF_LENGTH = 0.55;
const HALF_WIDTH = 0.34;
const SIT_SHRINK = 0.2;
const FADE_HEIGHT = 2.5;
const DRAW_DISTANCE = 64;
const FLOAT_BYTES = 4;
const LOCAL = [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]];
const NO_DRAW = Object.freeze({ drawCalls: 0 });

const clamp01 = (v) => Math.max(0, Math.min(1, v));

export function sunPowerOf(sunY) {
    const t = clamp01((sunY + 0.04) / 0.26);
    return t * t * (3 - 2 * t);
}

function fogFade(distance, fog) {
    const t = clamp01((distance - fog[0]) / Math.max(1e-4, fog[1] - fog[0]));
    return 1 - t * t * (3 - 2 * t);
}

export function blobAlpha(cat, distance, sunPower, fog) {
    const ground = cat.groundY === undefined ? cat.pos[1] : cat.groundY;
    const height = Math.max(0, cat.pos[1] - ground);
    const lift = clamp01(1 - height / FADE_HEIGHT);
    return BLOB_STRENGTH * sunPower * lift * fogFade(distance, fog);
}

function writeBlob(stage, cursor, cat, alpha) {
    const ground = cat.groundY === undefined ? cat.pos[1] : cat.groundY;
    const scale = 1 - SIT_SHRINK * (cat.anim ? cat.anim.sit : 0);
    const c = Math.cos(cat.yaw);
    const s = Math.sin(cat.yaw);
    let o = cursor;
    for (const [lx, lz] of LOCAL) {
        const x = lx * HALF_WIDTH * scale;
        const z = lz * HALF_LENGTH * scale;
        stage[o] = cat.pos[0] + x * c - z * s;
        stage[o + 1] = ground + BLOB_LIFT;
        stage[o + 2] = cat.pos[2] + x * s + z * c;
        stage[o + 3] = lx;
        stage[o + 4] = lz;
        stage[o + 5] = alpha;
        o += BLOB_FLOATS_PER_VERTEX;
    }
    return o;
}

export function fillBlobStage(cats, eye, sunPower, fog, stage) {
    let cursor = 0;
    let count = 0;
    if (sunPower <= 0.001) return { count, floats: cursor };
    for (const cat of cats) {
        if (count >= MAX_CATS) break;
        const distance = Math.hypot(cat.pos[0] - eye[0], cat.pos[1] - eye[1], cat.pos[2] - eye[2]);
        if (distance > DRAW_DISTANCE) continue;
        const alpha = blobAlpha(cat, distance, sunPower, fog);
        if (alpha <= 0.002) continue;
        cursor = writeBlob(stage, cursor, cat, alpha);
        count += 1;
    }
    return { count, floats: cursor };
}

export function createBlobGeometry(gl) {
    const vao = gl.createVertexArray();
    const buf = gl.createBuffer();
    const stride = BLOB_FLOATS_PER_VERTEX * FLOAT_BYTES;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, MAX_CATS * BLOB_VERTS_PER_CAT * stride, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride, 3 * FLOAT_BYTES);
    gl.bindVertexArray(null);
    return { vao, buf, stage: new Float32Array(MAX_CATS * BLOB_VERTS_PER_CAT * BLOB_FLOATS_PER_VERTEX) };
}

export function destroyBlobGeometry(gl, geometry) {
    gl.deleteVertexArray(geometry.vao);
    gl.deleteBuffer(geometry.buf);
}

export function drawBlobShadows(gl, res, cam, cats, eye, shading) {
    const filled = fillBlobStage(cats, eye, shading.sunPower, shading.fog, res.blobGeo.stage);
    if (filled.count === 0) return NO_DRAW;
    const { program, u } = res.blob;
    gl.useProgram(program);
    gl.uniformMatrix4fv(u.uViewProj, false, cam.viewProj);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.bindVertexArray(res.blobGeo.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, res.blobGeo.buf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, res.blobGeo.stage, 0, filled.floats);
    gl.drawArrays(gl.TRIANGLES, 0, filled.floats / BLOB_FLOATS_PER_VERTEX);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.enable(gl.CULL_FACE);
    return { drawCalls: 1 };
}
