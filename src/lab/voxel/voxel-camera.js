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

export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 260;

export function buildCameraBasis(eye, yaw, pitch, fovRad, aspect, near = CAMERA_NEAR, far = CAMERA_FAR) {
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
