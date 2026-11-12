import { BLOCK, isSolid } from "./voxel-blocks.js";

export function multiplyMat4(a, b) {
    const out = new Float32Array(16);
    for (let col = 0; col < 4; col += 1) {
        const b0 = b[col * 4];
        const b1 = b[col * 4 + 1];
        const b2 = b[col * 4 + 2];
        const b3 = b[col * 4 + 3];
        out[col * 4] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3;
        out[col * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3;
        out[col * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
        out[col * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
    }
    return out;
}

export function buildCameraBasis(eye, yaw, pitch, fovRad, aspect, near = 0.1, far = 260) {
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);

    const fx = cp * sy;
    const fy = sp;
    const fz = -cp * cy;

    let rx = -fz;
    let rz = fx;
    const rLen = Math.hypot(rx, rz) || 1;
    rx /= rLen;
    rz /= rLen;

    const ux = -fy * rz;
    const uy = rz * fx - rx * fz;
    const uz = fy * rx;
    const uLen = Math.hypot(ux, uy, uz) || 1;
    const up = [ux / uLen, uy / uLen, uz / uLen];

    const forward = [fx, fy, fz];
    const right = [rx, 0, rz];

    const view = new Float32Array([
        right[0], up[0], -forward[0], 0,
        right[1], up[1], -forward[1], 0,
        right[2], up[2], -forward[2], 0,
        -(right[0] * eye[0] + right[1] * eye[1] + right[2] * eye[2]),
        -(up[0] * eye[0] + up[1] * eye[1] + up[2] * eye[2]),
        forward[0] * eye[0] + forward[1] * eye[1] + forward[2] * eye[2],
        1
    ]);

    const f = 1 / Math.tan(fovRad * 0.5);
    const nf = 1 / (near - far);
    const proj = new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, 2 * far * near * nf, 0
    ]);

    return {
        viewProj: multiplyMat4(proj, view),
        forward,
        right,
        up,
        tanHalfFov: [Math.tan(fovRad * 0.5) * aspect, Math.tan(fovRad * 0.5)]
    };
}

export function extractFrustumPlanes(m) {
    const planes = [];
    const push = (a, b, c, d) => {
        const len = Math.hypot(a, b, c) || 1;
        planes.push([a / len, b / len, c / len, d / len]);
    };
    push(m[3] + m[0], m[7] + m[4], m[11] + m[8], m[15] + m[12]);
    push(m[3] - m[0], m[7] - m[4], m[11] - m[8], m[15] - m[12]);
    push(m[3] + m[1], m[7] + m[5], m[11] + m[9], m[15] + m[13]);
    push(m[3] - m[1], m[7] - m[5], m[11] - m[9], m[15] - m[13]);
    push(m[3] + m[2], m[7] + m[6], m[11] + m[10], m[15] + m[14]);
    push(m[3] - m[2], m[7] - m[6], m[11] - m[10], m[15] - m[14]);
    return planes;
}

export function isBoxInFrustum(planes, minX, minY, minZ, maxX, maxY, maxZ) {
    for (let i = 0; i < 6; i += 1) {
        const p = planes[i];
        const px = p[0] >= 0 ? maxX : minX;
        const py = p[1] >= 0 ? maxY : minY;
        const pz = p[2] >= 0 ? maxZ : minZ;
        if (p[0] * px + p[1] * py + p[2] * pz + p[3] < 0) return false;
    }
    return true;
}

function collidesAABB(px, py, pz, getBlock) {
    const hw = 0.28;
    const h = 1.68;
    const minX = Math.floor(px - hw);
    const maxX = Math.floor(px + hw);
    const minY = Math.floor(py);
    const maxY = Math.floor(py + h);
    const minZ = Math.floor(pz - hw);
    const maxZ = Math.floor(pz + hw);
    for (let y = minY; y <= maxY; y += 1) {
        for (let z = minZ; z <= maxZ; z += 1) {
            for (let x = minX; x <= maxX; x += 1) {
                if (isSolid(getBlock(x, y, z))) return true;
            }
        }
    }
    return false;
}

export function stepPlayerPhysics(player, keys, dt, getBlock) {
    const stepDt = Math.min(0.05, Math.max(0.001, dt));
    const sy = Math.sin(player.yaw);
    const cy = Math.cos(player.yaw);
    let moveF = 0;
    let moveR = 0;
    if (keys.has("KeyW") || keys.has("ArrowUp")) moveF += 1;
    if (keys.has("KeyS") || keys.has("ArrowDown")) moveF -= 1;
    if (keys.has("KeyD") || keys.has("ArrowRight")) moveR += 1;
    if (keys.has("KeyA") || keys.has("ArrowLeft")) moveR -= 1;

    const len = Math.hypot(moveF, moveR);
    if (len > 0) {
        moveF /= len;
        moveR /= len;
    }

    const fwdX = sy;
    const fwdZ = -cy;
    const rightX = cy;
    const rightZ = sy;
    const wishX = fwdX * moveF + rightX * moveR;
    const wishZ = fwdZ * moveF + rightZ * moveR;

    const inWater = getBlock(player.pos[0], player.pos[1] + 0.6, player.pos[2]) === BLOCK.WATER;
    const eyeInWater = getBlock(player.pos[0], player.pos[1] + 1.54, player.pos[2]) === BLOCK.WATER;
    player.submerged = eyeInWater;

    if (player.flyMode) {
        const speed = keys.has("ShiftLeft") ? 18 : 10.5;
        let moveY = 0;
        if (keys.has("Space") || keys.has("KeyE")) moveY += 1;
        if (keys.has("KeyC") || keys.has("ControlLeft")) moveY -= 1;
        player.pos[0] += wishX * speed * stepDt;
        player.pos[1] = Math.max(3, Math.min(124, player.pos[1] + moveY * speed * stepDt));
        player.pos[2] += wishZ * speed * stepDt;
        player.vel[1] = 0;
        player.onGround = false;
        return;
    }

    const walkSpeed = inWater ? 3.8 : 6.2;
    const vx = wishX * walkSpeed;
    const vz = wishZ * walkSpeed;
    const gravity = inWater ? -7.5 : -24;
    player.vel[1] += gravity * stepDt;
    if (inWater) player.vel[1] *= 0.92;

    if (keys.has("Space")) {
        if (player.onGround) {
            player.vel[1] = 8.4;
            player.onGround = false;
        } else if (inWater) {
            player.vel[1] = Math.min(4.2, player.vel[1] + 18 * stepDt);
        }
    }

    const nx = player.pos[0] + vx * stepDt;
    if (!collidesAABB(nx, player.pos[1], player.pos[2], getBlock)) {
        player.pos[0] = nx;
    }
    const nz = player.pos[2] + vz * stepDt;
    if (!collidesAABB(player.pos[0], player.pos[1], nz, getBlock)) {
        player.pos[2] = nz;
    }

    const ny = player.pos[1] + player.vel[1] * stepDt;
    if (!collidesAABB(player.pos[0], ny, player.pos[2], getBlock)) {
        player.pos[1] = ny;
        player.onGround = false;
    } else {
        if (player.vel[1] < 0) player.onGround = true;
        player.vel[1] = 0;
    }
}
