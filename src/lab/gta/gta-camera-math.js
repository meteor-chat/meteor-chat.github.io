export const CAMERA_MODES = Object.freeze(["chaseNear", "chaseFar", "hood", "cinematic"]);

const TAU = Math.PI * 2;

export function wrapAngle(a) {
    let v = a % TAU;
    if (v > Math.PI) v -= TAU;
    if (v < -Math.PI) v += TAU;
    return v;
}

export function dampAngle(current, target, lambda, dt) {
    const diff = wrapAngle(target - current);
    return wrapAngle(current + diff * (1 - Math.exp(-lambda * dt)));
}

export function computeDynamicFov(baseFov, speedMps, nitroActive = false, mode = "chaseNear") {
    if (mode === "onFoot") return baseFov;
    const speedFactor = Math.max(0, Math.min(1, speedMps / 46));
    const extra = speedFactor * 14 + (nitroActive ? 6 : 0);
    return Math.min(88, baseFov + extra);
}

export function computeCameraOffsets(mode, isDriving) {
    if (!isDriving) {
        return { back: 3.3, up: 1.85, right: 0.62, lookUp: 1.48, lookAhead: 4.5 };
    }
    if (mode === "chaseFar") {
        return { back: 8.6, up: 3.1, right: 0, lookUp: 1.15, lookAhead: 5.5 };
    }
    if (mode === "hood") {
        return { back: -0.45, up: 1.32, right: 0, lookUp: 1.1, lookAhead: 16 };
    }
    if (mode === "cinematic") {
        return { back: 6.4, up: 1.55, right: 1.45, lookUp: 0.95, lookAhead: 7 };
    }
    return { back: 6.2, up: 2.35, right: 0, lookUp: 1.1, lookAhead: 6.5 };
}

export function resolveCameraViewYaw(isDriving, followYaw, orbitYaw) {
    return isDriving ? wrapAngle(followYaw + orbitYaw) : wrapAngle(orbitYaw);
}

export function computeCameraRelativeMove(fwd, side, cameraYaw, speed) {
    const moveMag = Math.hypot(fwd, side);
    if (moveMag <= 0.01) return { mx: 0, mz: 0, moveMag: 0, desiredYaw: null };
    const nf = fwd / moveMag;
    const ns = side / moveMag;
    const sinY = Math.sin(cameraYaw);
    const cosY = Math.cos(cameraYaw);
    const mx = (sinY * nf - cosY * ns) * speed;
    const mz = (cosY * nf + sinY * ns) * speed;
    return { mx, mz, moveMag, desiredYaw: Math.atan2(mx, mz) };
}
