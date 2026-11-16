import { buildCatVertices, FLOATS_PER_CAT, FLOATS_PER_VERTEX, MAX_CATS } from "./voxel-mob-cat-model.js";
import { buildChickenVertices, FLOATS_PER_CHICKEN, MAX_CHICKENS } from "./voxel-mob-chicken-model.js";

const MOB_DRAW_DISTANCE = 96;
const FLOAT_BYTES = 4;
const TOTAL_FLOATS = MAX_CATS * FLOATS_PER_CAT + MAX_CHICKENS * FLOATS_PER_CHICKEN;
const NO_DRAW = Object.freeze({ drawCalls: 0, triCount: 0 });

export function createMobGeometry(gl) {
    const vao = gl.createVertexArray();
    const buf = gl.createBuffer();
    const stride = FLOATS_PER_VERTEX * FLOAT_BYTES;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, TOTAL_FLOATS * FLOAT_BYTES, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride, 3 * FLOAT_BYTES);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, stride, 6 * FLOAT_BYTES);
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 2, gl.FLOAT, false, stride, 8 * FLOAT_BYTES);
    gl.bindVertexArray(null);
    return { vao, buf, stage: new Float32Array(TOTAL_FLOATS) };
}

export function destroyMobGeometry(gl, geometry) {
    gl.deleteVertexArray(geometry.vao);
    gl.deleteBuffer(geometry.buf);
}

export function fillMobStage(mobs, timeSec, eye, stage) {
    let cursor = 0;
    let count = 0;
    let catCount = 0;
    let chickenCount = 0;
    for (const mob of mobs) {
        const isChicken = mob.kind === "chicken";
        if (isChicken ? chickenCount >= MAX_CHICKENS : catCount >= MAX_CATS) continue;
        const distance = Math.hypot(mob.pos[0] - eye[0], mob.pos[1] - eye[1], mob.pos[2] - eye[2]);
        if (distance > MOB_DRAW_DISTANCE) continue;
        if (isChicken) {
            cursor = buildChickenVertices(mob, timeSec, stage, cursor);
            chickenCount += 1;
        } else {
            cursor = buildCatVertices(mob, timeSec, stage, cursor);
            catCount += 1;
        }
        count += 1;
    }
    return { count, floats: cursor };
}

export function drawMobs(gl, geometry, mobs, timeSec, eye) {
    const filled = fillMobStage(mobs, timeSec, eye, geometry.stage);
    if (filled.count === 0) return NO_DRAW;
    gl.bindVertexArray(geometry.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, geometry.buf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, geometry.stage, 0, filled.floats);
    const vertexCount = filled.floats / FLOATS_PER_VERTEX;
    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
    return { drawCalls: 1, triCount: vertexCount / 3 };
}
