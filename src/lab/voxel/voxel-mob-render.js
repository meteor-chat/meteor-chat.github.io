import { buildCatVertices, FLOATS_PER_CAT, FLOATS_PER_VERTEX, MAX_CATS } from "./voxel-mob-cat-model.js";

const MOB_DRAW_DISTANCE = 64;
const FLOAT_BYTES = 4;
const NO_DRAW = Object.freeze({ drawCalls: 0, triCount: 0 });

export function createMobGeometry(gl) {
    const vao = gl.createVertexArray();
    const buf = gl.createBuffer();
    const stride = FLOATS_PER_VERTEX * FLOAT_BYTES;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, MAX_CATS * FLOATS_PER_CAT * FLOAT_BYTES, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride, 3 * FLOAT_BYTES);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, stride, 6 * FLOAT_BYTES);
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 2, gl.FLOAT, false, stride, 8 * FLOAT_BYTES);
    gl.bindVertexArray(null);
    return { vao, buf, stage: new Float32Array(MAX_CATS * FLOATS_PER_CAT) };
}

export function destroyMobGeometry(gl, geometry) {
    gl.deleteVertexArray(geometry.vao);
    gl.deleteBuffer(geometry.buf);
}

export function fillMobStage(cats, timeSec, eye, stage) {
    let cursor = 0;
    let count = 0;
    for (const cat of cats) {
        if (count >= MAX_CATS) break;
        const distance = Math.hypot(cat.pos[0] - eye[0], cat.pos[1] - eye[1], cat.pos[2] - eye[2]);
        if (distance > MOB_DRAW_DISTANCE) continue;
        cursor = buildCatVertices(cat, timeSec, stage, cursor);
        count += 1;
    }
    return { count, floats: cursor };
}

export function drawMobs(gl, geometry, cats, timeSec, eye) {
    const filled = fillMobStage(cats, timeSec, eye, geometry.stage);
    if (filled.count === 0) return NO_DRAW;
    gl.bindVertexArray(geometry.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, geometry.buf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, geometry.stage, 0, filled.floats);
    const vertexCount = filled.floats / FLOATS_PER_VERTEX;
    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
    return { drawCalls: 1, triCount: vertexCount / 3 };
}
