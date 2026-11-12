const DEG2RAD = Math.PI / 180;
const TAU = Math.PI * 2;
export const REAL_AU_SCALE = 11.5;

export function wrapAngle(rad) {
    const wrapped = rad % TAU;
    return wrapped < 0 ? wrapped + TAU : wrapped;
}

export function solveKeplerElliptic(meanAnomalyRad, eccentricity) {
    const M = wrapAngle(meanAnomalyRad);
    let E = eccentricity > 0.8 ? Math.PI : M + eccentricity * Math.sin(M);
    for (let iter = 0; iter < 8; iter += 1) {
        const f = E - eccentricity * Math.sin(E) - M;
        const fp = 1 - eccentricity * Math.cos(E);
        const step = f / Math.max(1e-9, fp);
        E -= step;
        if (Math.abs(step) < 1e-11) {
            break;
        }
    }
    return E;
}

export function solveKeplerHyperbolic(meanAnomalyRad, eccentricity) {
    let H = Math.asinh(meanAnomalyRad / Math.max(1.01, eccentricity));
    for (let iter = 0; iter < 10; iter += 1) {
        const f = eccentricity * Math.sinh(H) - H - meanAnomalyRad;
        const fp = eccentricity * Math.cosh(H) - 1;
        const step = f / Math.max(1e-9, fp);
        H -= step;
        if (Math.abs(step) < 1e-10) {
            break;
        }
    }
    return H;
}

export function solveBarkerParabolic(meanAnomalyRad) {
    const W = 1.5 * meanAnomalyRad;
    const Y = Math.cbrt(W + Math.sqrt(W * W + 1));
    return Y - 1 / Y;
}

function rotatePerifocalToScene(px, py, vx, vy, omegaRad, incRad, nodeRad) {
    const cosO = Math.cos(omegaRad);
    const sinO = Math.sin(omegaRad);
    const cosI = Math.cos(incRad);
    const sinI = Math.sin(incRad);
    const cosN = Math.cos(nodeRad);
    const sinN = Math.sin(nodeRad);

    const pX = cosN * cosO - sinN * sinO * cosI;
    const pY = sinN * cosO + cosN * sinO * cosI;
    const pZ = sinO * sinI;

    const qX = -cosN * sinO - sinN * cosO * cosI;
    const qY = -sinN * sinO + cosN * cosO * cosI;
    const qZ = cosO * sinI;

    return {
        x: pX * px + qX * py,
        y: pZ * px + qZ * py,
        z: -(pY * px + qY * py),
        vx: pX * vx + qX * vy,
        vy: pZ * vx + qZ * vy,
        vz: -(pY * vx + qY * vy)
    };
}

export function getSemiMajorAxis(body, scaleMode = "visual") {
    return scaleMode === "real" ? body.aAU * REAL_AU_SCALE : body.visualA;
}

export function getBodyRenderRadius(body, scaleMode = "visual") {
    return scaleMode === "real" ? body.realRadiusScale : body.visualRadius;
}

export function propagateKeplerian(body, timeDays, scaleMode = "visual") {
    const a = getSemiMajorAxis(body, scaleMode);
    const e = body.e || 0;
    const omega = (body.omegaDeg || 0) * DEG2RAD;
    const inc = (body.iDeg || 0) * DEG2RAD;
    const node = (body.nodeDeg || 0) * DEG2RAD;
    const M0 = (body.M0Deg || 0) * DEG2RAD;
    const n = TAU / Math.max(0.01, body.periodDays || 365.25);
    const M = M0 + n * timeDays;

    let px;
    let py;
    let pvx;
    let pvy;

    if (Math.abs(e - 1) <= 1e-8) {
        const q = Math.max(0.1, a);
        const D = solveBarkerParabolic(M);
        px = q * (1 - D * D);
        py = 2 * q * D;
        const speedFactor = n * q / Math.max(1e-4, 1 + D * D);
        pvx = -2 * D * speedFactor;
        pvy = 2 * speedFactor;
    } else if (e > 1) {
        const H = solveKeplerHyperbolic(M, e);
        const absA = Math.abs(a);
        const sq = Math.sqrt(e * e - 1);
        px = absA * (e - Math.cosh(H));
        py = absA * sq * Math.sinh(H);
        const edot = n / Math.max(1e-4, e * Math.cosh(H) - 1);
        pvx = -absA * Math.sinh(H) * edot;
        pvy = absA * sq * Math.cosh(H) * edot;
    } else {
        const E = solveKeplerElliptic(M, e);
        const cosE = Math.cos(E);
        const sinE = Math.sin(E);
        const sq = Math.sqrt(Math.max(0, 1 - e * e));
        px = a * (cosE - e);
        py = a * sq * sinE;
        const edot = n / Math.max(1e-4, 1 - e * cosE);
        pvx = -a * sinE * edot;
        pvy = a * sq * cosE * edot;
    }

    return rotatePerifocalToScene(px, py, pvx, pvy, omega, inc, node);
}

export function sampleOrbitRingPoints(body, scaleMode = "visual", segments = 128) {
    const a = getSemiMajorAxis(body, scaleMode);
    const e = Math.min(0.95, body.e || 0);
    const omega = (body.omegaDeg || 0) * DEG2RAD;
    const inc = (body.iDeg || 0) * DEG2RAD;
    const node = (body.nodeDeg || 0) * DEG2RAD;
    const sq = Math.sqrt(Math.max(0.01, 1 - e * e));
    const pts = [];
    for (let i = 0; i <= segments; i += 1) {
        const E = (i / segments) * TAU;
        const px = a * (Math.cos(E) - e);
        const py = a * sq * Math.sin(E);
        const rotated = rotatePerifocalToScene(px, py, 0, 0, omega, inc, node);
        pts.push({ x: rotated.x, y: rotated.y, z: rotated.z });
    }
    return pts;
}

export function toObserverCentered(posF64, anchorPosF64) {
    return {
        x: posF64.x - anchorPosF64.x,
        y: posF64.y - anchorPosF64.y,
        z: posF64.z - anchorPosF64.z
    };
}

export function computeBodyInfluenceWeight(radius, distance) {
    const d = Math.max(0, distance);
    return radius / Math.max(1e-6, radius + d);
}

export function createCameraState(camera) {
    const az = camera.azimuth;
    const el = camera.elevation;
    const dist = camera.distance;
    const cosEl = Math.cos(el);
    const eye = {
        x: dist * cosEl * Math.sin(az),
        y: dist * Math.sin(el),
        z: dist * cosEl * Math.cos(az)
    };
    const fLen = Math.hypot(eye.x, eye.y, eye.z) || 1;
    const fwd = { x: -eye.x / fLen, y: -eye.y / fLen, z: -eye.z / fLen };
    const rightLen = Math.hypot(fwd.z, 0, -fwd.x) || 1;
    const right = { x: -fwd.z / rightLen, y: 0, z: fwd.x / rightLen };
    const up = {
        x: right.y * fwd.z - right.z * fwd.y,
        y: right.z * fwd.x - right.x * fwd.z,
        z: right.x * fwd.y - right.y * fwd.x
    };
    return { eye, fwd, right, up, fovRad: camera.fovRad || 0.78, aspect: camera.aspect || 1.6 };
}

export function projectPoint3D(posRel, camBasis, width, height) {
    const dx = posRel.x - camBasis.eye.x;
    const dy = posRel.y - camBasis.eye.y;
    const dz = posRel.z - camBasis.eye.z;
    const cx = dx * camBasis.right.x + dy * camBasis.right.y + dz * camBasis.right.z;
    const cy = dx * camBasis.up.x + dy * camBasis.up.y + dz * camBasis.up.z;
    const cz = dx * camBasis.fwd.x + dy * camBasis.fwd.y + dz * camBasis.fwd.z;
    if (cz <= 0.15) {
        return null;
    }
    const f = 1 / Math.tan(camBasis.fovRad * 0.5);
    const ndcX = (cx * f) / (cz * camBasis.aspect);
    const ndcY = (cy * f) / cz;
    return {
        x: (ndcX * 0.5 + 0.5) * width,
        y: (-ndcY * 0.5 + 0.5) * height,
        depth: cz,
        ndcX,
        ndcY,
        scaleY: (f * height * 0.5) / cz
    };
}
