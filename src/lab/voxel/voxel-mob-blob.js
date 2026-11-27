import { MAX_CATS } from "./voxel-mob-cat-model.js";
import { MAX_CHICKENS } from "./voxel-mob-chicken-model.js";
import { MAX_GOLEMS } from "./voxel-mob-golem-model.js";
import { MAX_VILLAGERS } from "./voxel-mob-villager-model.js";
import { MAX_REMOTE_PLAYERS } from "./voxel-player-model.js";

export const BLOB_FLOATS_PER_VERTEX = 6;
export const BLOB_VERTS_PER_CAT = 6;
export const BLOB_TOTAL_MOBS = MAX_CATS + MAX_CHICKENS + MAX_VILLAGERS + MAX_GOLEMS + MAX_REMOTE_PLAYERS;

const BLOB_STRENGTH = 0.46;
const BLOB_LIFT = 0.02;
const HALF_LENGTH = 0.55;
const HALF_WIDTH = 0.34;
const CHICKEN_HALF_LENGTH = 0.28;
const CHICKEN_HALF_WIDTH = 0.24;
const VILLAGER_HALF_SIZE = 0.36;
const GOLEM_HALF_SIZE = 0.62;
const PLAYER_HALF_SIZE = 0.34;
const SIT_SHRINK = 0.2;
const FADE_HEIGHT = 2.5;
const DRAW_DISTANCE = 96;
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

export function blobAlpha(mob, distance, sunPower, fog, rainIntensity = 0) {
    const ground = mob.groundY === undefined ? mob.pos[1] : mob.groundY;
    const height = Math.max(0, mob.pos[1] - ground);
    const lift = clamp01(1 - height / FADE_HEIGHT);
    const skyAtten = Math.max(0.2, mob.sky === undefined ? 1 : mob.sky);
    const rainAtten = 1 - clamp01(rainIntensity) * 0.72;
    return BLOB_STRENGTH * sunPower * lift * fogFade(distance, fog) * skyAtten * rainAtten;
}

function writeBlob(stage, cursor, mob, alpha) {
    const ground = mob.groundY === undefined ? mob.pos[1] : mob.groundY;
    let hw = HALF_WIDTH;
    let hl = HALF_LENGTH;
    let scale = 1 - SIT_SHRINK * (mob.anim && mob.anim.sit ? mob.anim.sit : 0);
    if (mob.kind === "chicken") {
        hw = CHICKEN_HALF_WIDTH;
        hl = CHICKEN_HALF_LENGTH;
        scale = 1;
    } else if (mob.kind === "villager") {
        hw = VILLAGER_HALF_SIZE;
        hl = VILLAGER_HALF_SIZE;
        scale = 1;
    } else if (mob.kind === "golem") {
        hw = GOLEM_HALF_SIZE;
        hl = GOLEM_HALF_SIZE;
        scale = 1;
    } else if (mob.kind === "player") {
        hw = PLAYER_HALF_SIZE;
        hl = PLAYER_HALF_SIZE;
        scale = 1;
    }
    const c = Math.cos(mob.yaw);
    const s = Math.sin(mob.yaw);
    let o = cursor;
    for (const [lx, lz] of LOCAL) {
        const x = lx * hw * scale;
        const z = lz * hl * scale;
        stage[o] = mob.pos[0] + x * c - z * s;
        stage[o + 1] = ground + BLOB_LIFT;
        stage[o + 2] = mob.pos[2] + x * s + z * c;
        stage[o + 3] = lx;
        stage[o + 4] = lz;
        stage[o + 5] = alpha;
        o += BLOB_FLOATS_PER_VERTEX;
    }
    return o;
}

export function fillBlobStage(mobs, eye, sunPower, fog, stage, rainIntensity = 0) {
    let cursor = 0;
    let count = 0;
    let catCount = 0;
    let chickenCount = 0;
    let villagerCount = 0;
    let golemCount = 0;
    let playerCount = 0;
    if (sunPower <= 0.001) return { count, floats: cursor };
    for (const mob of mobs) {
        const kind = mob.kind;
        if (kind === "chicken") {
            if (chickenCount >= MAX_CHICKENS) continue;
        } else if (kind === "villager") {
            if (villagerCount >= MAX_VILLAGERS) continue;
        } else if (kind === "golem") {
            if (golemCount >= MAX_GOLEMS) continue;
        } else if (kind === "player") {
            if (playerCount >= MAX_REMOTE_PLAYERS) continue;
        } else if (catCount >= MAX_CATS) {
            continue;
        }
        const distance = Math.hypot(mob.pos[0] - eye[0], mob.pos[1] - eye[1], mob.pos[2] - eye[2]);
        if (distance > DRAW_DISTANCE) continue;
        const alpha = blobAlpha(mob, distance, sunPower, fog, rainIntensity);
        if (alpha <= 0.002) continue;
        cursor = writeBlob(stage, cursor, mob, alpha);
        if (kind === "chicken") chickenCount += 1;
        else if (kind === "villager") villagerCount += 1;
        else if (kind === "golem") golemCount += 1;
        else if (kind === "player") playerCount += 1;
        else catCount += 1;
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
    gl.bufferData(gl.ARRAY_BUFFER, BLOB_TOTAL_MOBS * BLOB_VERTS_PER_CAT * stride, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride, 3 * FLOAT_BYTES);
    gl.bindVertexArray(null);
    return { vao, buf, stage: new Float32Array(BLOB_TOTAL_MOBS * BLOB_VERTS_PER_CAT * BLOB_FLOATS_PER_VERTEX) };
}

export function destroyBlobGeometry(gl, geometry) {
    gl.deleteVertexArray(geometry.vao);
    gl.deleteBuffer(geometry.buf);
}

export function drawBlobShadows(gl, res, cam, mobs, eye, shading) {
    const filled = fillBlobStage(mobs, eye, shading.sunPower, shading.fog, res.blobGeo.stage, shading.rainIntensity || 0);
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
