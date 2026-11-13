const NEAR_BEHIND = 90;
const SUN_MOVED_DOT = 0.99995;

function normalize3(v) {
    const len = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / len, v[1] / len, v[2] / len];
}

function cross3(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function dot3(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function buildShadowFrame(center, sunDir, radius, mapSize) {
    const forward = normalize3([-sunDir[0], -sunDir[1], -sunDir[2]]);
    const helper = Math.abs(forward[1]) > 0.97 ? [0, 0, 1] : [0, 1, 0];
    const right = normalize3(cross3(forward, helper));
    const up = cross3(right, forward);
    const texel = (2 * radius) / mapSize;
    const snapX = Math.round(dot3(center, right) / texel) * texel - dot3(center, right);
    const snapY = Math.round(dot3(center, up) / texel) * texel - dot3(center, up);
    const snapped = [
        center[0] + right[0] * snapX + up[0] * snapY,
        center[1] + right[1] * snapX + up[1] * snapY,
        center[2] + right[2] * snapX + up[2] * snapY
    ];
    const depthSpan = radius + NEAR_BEHIND;
    const zScale = 2 / depthSpan;
    const zBias = (2 * (NEAR_BEHIND - dot3(snapped, forward))) / depthSpan - 1;
    const rows = [
        [right[0] / radius, right[1] / radius, right[2] / radius, -dot3(snapped, right) / radius],
        [up[0] / radius, up[1] / radius, up[2] / radius, -dot3(snapped, up) / radius],
        [forward[0] * zScale, forward[1] * zScale, forward[2] * zScale, zBias],
        [0, 0, 0, 1]
    ];
    const viewProj = new Float32Array(16);
    for (let row = 0; row < 4; row += 1) {
        for (let col = 0; col < 4; col += 1) viewProj[col * 4 + row] = rows[row][col];
    }
    return { viewProj, center: snapped, texel, radius, mapSize };
}

export function createShadowController({ radius, mapSize, recenterDist = 12, minFrames = 45 }) {
    let frame = null;
    let anchor = null;
    let lastSun = null;
    let lastVersion = -1;
    let framesSince = 0;
    let forced = false;

    const update = (sunDir, eye, version) => {
        framesSince += 1;
        const sunMoved = !lastSun || dot3(sunDir, lastSun) < SUN_MOVED_DOT;
        const far = !anchor || Math.hypot(eye[0] - anchor[0], eye[1] - anchor[1], eye[2] - anchor[2]) > recenterDist;
        const meshChanged = version !== lastVersion && framesSince >= minFrames;
        if (!frame || forced || sunMoved || far || meshChanged) {
            if (far) anchor = [eye[0], eye[1], eye[2]];
            frame = buildShadowFrame(anchor, sunDir, radius, mapSize);
            lastSun = [sunDir[0], sunDir[1], sunDir[2]];
            lastVersion = version;
            framesSince = 0;
            forced = false;
            return { refresh: true, frame };
        }
        return { refresh: false, frame };
    };

    const invalidate = () => {
        frame = null;
        anchor = null;
        lastSun = null;
    };

    const forceNext = () => {
        forced = true;
    };

    return { update, invalidate, forceNext };
}
