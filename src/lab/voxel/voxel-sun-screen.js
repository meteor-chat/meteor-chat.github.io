const SUN_DISTANCE = 500;

export function projectSunToScreen(viewProj, eye, sunDir) {
    const x = eye[0] + sunDir[0] * SUN_DISTANCE;
    const y = eye[1] + sunDir[1] * SUN_DISTANCE;
    const z = eye[2] + sunDir[2] * SUN_DISTANCE;
    const w = viewProj[3] * x + viewProj[7] * y + viewProj[11] * z + viewProj[15];
    if (w <= 0.0001) return { u: 0.5, v: 0.5, visibility: 0 };
    const ndcX = (viewProj[0] * x + viewProj[4] * y + viewProj[8] * z + viewProj[12]) / w;
    const ndcY = (viewProj[1] * x + viewProj[5] * y + viewProj[9] * z + viewProj[13]) / w;
    const edge = Math.max(Math.abs(ndcX), Math.abs(ndcY));
    const onScreen = Math.max(0, Math.min(1, (1.6 - edge) / 0.9));
    const rising = Math.max(0, Math.min(1, (sunDir[1] + 0.02) / 0.12));
    return { u: ndcX * 0.5 + 0.5, v: ndcY * 0.5 + 0.5, visibility: onScreen * rising };
}

export function raysStrength(sunDir, visibility) {
    const low = 1 - Math.max(0, Math.min(1, sunDir[1] * 1.4));
    return visibility * (0.16 + 0.34 * low);
}
