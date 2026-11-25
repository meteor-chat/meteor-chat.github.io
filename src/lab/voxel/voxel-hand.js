import { getFaceTexture, isCrossPlant, isTorch } from "./voxel-blocks.js";

export const HAND_VERTEX_STRIDE = 8;

function pushTri(out, a, b, c, tex, shade, glow) {
    out.push(
        a[0], a[1], a[2], a[3], a[4], tex, shade, glow,
        b[0], b[1], b[2], b[3], b[4], tex, shade, glow,
        c[0], c[1], c[2], c[3], c[4], tex, shade, glow
    );
}

function pushQuad(out, p0, p1, p2, p3, tex, shade, glow) {
    pushTri(out, p0, p1, p2, tex, shade, glow);
    pushTri(out, p0, p2, p3, tex, shade, glow);
}

function pushBox(out, x0, y0, z0, x1, y1, z1, texForFace, glow = 0, uv = [0, 0, 1, 1]) {
    const [u0, v0, u1, v1] = uv;
    pushQuad(out, [x1, y0, z1, u0, v0], [x1, y0, z0, u1, v0], [x1, y1, z0, u1, v1], [x1, y1, z1, u0, v1], texForFace(0), 0.84, glow);
    pushQuad(out, [x0, y0, z0, u0, v0], [x0, y0, z1, u1, v0], [x0, y1, z1, u1, v1], [x0, y1, z0, u0, v1], texForFace(1), 0.78, glow);
    pushQuad(out, [x0, y1, z1, u0, v0], [x1, y1, z1, u1, v0], [x1, y1, z0, u1, v1], [x0, y1, z0, u0, v1], texForFace(2), 1.0, glow);
    pushQuad(out, [x0, y0, z0, u0, v0], [x1, y0, z0, u1, v0], [x1, y0, z1, u1, v1], [x0, y0, z1, u0, v1], texForFace(3), 0.62, glow);
    pushQuad(out, [x0, y0, z1, u0, v0], [x1, y0, z1, u1, v0], [x1, y1, z1, u1, v1], [x0, y1, z1, u0, v1], texForFace(4), 0.9, glow);
    pushQuad(out, [x1, y0, z0, u0, v0], [x0, y0, z0, u1, v0], [x0, y1, z0, u1, v1], [x1, y1, z0, u0, v1], texForFace(5), 0.72, glow);
}

export function buildHeldBlockMesh(blockId) {
    const out = [];
    if (isTorch(blockId)) {
        const tex = getFaceTexture(blockId, 0);
        pushBox(out, -0.055, -0.26, -0.055, 0.055, 0.26, 0.055, () => tex, 0.72, [0.38, 0.08, 0.62, 0.92]);
        return new Float32Array(out);
    }
    if (isCrossPlant(blockId)) {
        const tex = getFaceTexture(blockId, 0);
        pushQuad(out, [-0.22, -0.22, 0, 0, 0], [0.22, -0.22, 0, 1, 0], [0.22, 0.22, 0, 1, 1], [-0.22, 0.22, 0, 0, 1], tex, 0.96, 0);
        pushQuad(out, [0, -0.22, -0.22, 0, 0], [0, -0.22, 0.22, 1, 0], [0, 0.22, 0.22, 1, 1], [0, 0.22, -0.22, 0, 1], tex, 0.88, 0);
        return new Float32Array(out);
    }
    pushBox(out, -0.19, -0.19, -0.19, 0.19, 0.19, 0.19, (f) => getFaceTexture(blockId, f), 0);
    return new Float32Array(out);
}

export function createVoxelHand() {
    let currentBlock = -1;
    let mesh = new Float32Array(0);
    let swing = 0;
    let equip = 0;

    const triggerSwing = () => {
        swing = 1;
    };

    const setBlock = (blockId) => {
        if (blockId === currentBlock) return;
        currentBlock = blockId;
        mesh = buildHeldBlockMesh(blockId);
        equip = 1;
    };

    const step = (dt) => {
        const d = Math.min(0.05, Math.max(0.001, dt));
        swing = Math.max(0, swing - d * 4.4);
        equip = Math.max(0, equip - d * 4.8);
    };

    const buildModelMatrix = (walkDist, timeSec, moving) => {
        const bobAmp = moving ? 1 : 0.12;
        const bobX = Math.sin(walkDist * 2.15) * 0.024 * bobAmp;
        const bobY = Math.abs(Math.cos(walkDist * 2.15)) * 0.026 * bobAmp;
        const idleY = Math.sin(timeSec * 1.9) * 0.006;

        const sw = Math.sin(swing * Math.PI);
        const dipY = -equip * equip * 0.28;

        const tx = 0.44 + bobX - sw * 0.16;
        const ty = -0.36 - bobY + idleY + dipY + sw * 0.08;
        const tz = -0.78 - sw * 0.14;

        const rx = -0.24 - sw * 0.95;
        const ry = 0.62 + sw * 0.42;
        const rz = -0.12 + sw * 0.28;

        const cx = Math.cos(rx);
        const sx = Math.sin(rx);
        const cy = Math.cos(ry);
        const sy = Math.sin(ry);
        const cz = Math.cos(rz);
        const sz = Math.sin(rz);

        const m00 = cy * cz;
        const m01 = cy * sz;
        const m02 = -sy;
        const m10 = sx * sy * cz - cx * sz;
        const m11 = sx * sy * sz + cx * cz;
        const m12 = sx * cy;
        const m20 = cx * sy * cz + sx * sz;
        const m21 = cx * sy * sz - sx * cz;
        const m22 = cx * cy;

        return new Float32Array([
            m00, m01, m02, 0,
            m10, m11, m12, 0,
            m20, m21, m22, 0,
            tx, ty, tz, 1
        ]);
    };

    return {
        setBlock,
        triggerSwing,
        step,
        buildModelMatrix,
        getMesh: () => mesh,
        getBlockId: () => currentBlock
    };
}
