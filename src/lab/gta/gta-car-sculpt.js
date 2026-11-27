import * as THREE from "three";

const SUV_STATIONS = [
    { z: -2.48, y0: 0.34, y1: 0.72, y2: 0.96, y3: 1.0, w0: 0.86, w1: 0.94, w2: 0.88, w3: 0.72 },
    { z: -2.26, y0: 0.24, y1: 0.76, y2: 1.02, y3: 1.56, w0: 0.96, w1: 1.03, w2: 0.96, w3: 0.78 },
    { z: -1.56, y0: 0.24, y1: 0.8, y2: 1.04, y3: 1.66, w0: 1.02, w1: 1.08, w2: 1.0, w3: 0.82 },
    { z: -0.65, y0: 0.22, y1: 0.82, y2: 1.05, y3: 1.68, w0: 1.04, w1: 1.08, w2: 1.0, w3: 0.83 },
    { z: 0.42, y0: 0.22, y1: 0.82, y2: 1.05, y3: 1.67, w0: 1.04, w1: 1.08, w2: 1.0, w3: 0.83 },
    { z: 1.08, y0: 0.24, y1: 0.82, y2: 1.04, y3: 1.18, w0: 1.02, w1: 1.07, w2: 0.99, w3: 0.86 },
    { z: 1.98, y0: 0.25, y1: 0.76, y2: 0.98, y3: 1.04, w0: 0.98, w1: 1.04, w2: 0.96, w3: 0.82 },
    { z: 2.42, y0: 0.29, y1: 0.68, y2: 0.9, y3: 0.94, w0: 0.9, w1: 0.96, w2: 0.88, w3: 0.74 },
    { z: 2.56, y0: 0.36, y1: 0.58, y2: 0.76, y3: 0.8, w0: 0.78, w1: 0.84, w2: 0.76, w3: 0.64 }
];

const SEDAN_STATIONS = [
    { z: -2.32, y0: 0.28, y1: 0.62, y2: 0.84, y3: 0.87, w0: 0.82, w1: 0.9, w2: 0.84, w3: 0.7 },
    { z: -2.06, y0: 0.22, y1: 0.66, y2: 0.9, y3: 0.96, w0: 0.91, w1: 0.98, w2: 0.92, w3: 0.8 },
    { z: -1.42, y0: 0.2, y1: 0.68, y2: 0.92, y3: 1.04, w0: 0.95, w1: 1.0, w2: 0.94, w3: 0.82 },
    { z: -0.92, y0: 0.19, y1: 0.7, y2: 0.93, y3: 1.38, w0: 0.96, w1: 1.0, w2: 0.93, w3: 0.76 },
    { z: 0.22, y0: 0.19, y1: 0.7, y2: 0.93, y3: 1.4, w0: 0.96, w1: 1.0, w2: 0.93, w3: 0.76 },
    { z: 0.84, y0: 0.2, y1: 0.68, y2: 0.91, y3: 1.02, w0: 0.95, w1: 0.99, w2: 0.92, w3: 0.8 },
    { z: 1.72, y0: 0.21, y1: 0.62, y2: 0.84, y3: 0.9, w0: 0.92, w1: 0.96, w2: 0.88, w3: 0.76 },
    { z: 2.22, y0: 0.24, y1: 0.54, y2: 0.72, y3: 0.76, w0: 0.84, w1: 0.88, w2: 0.8, w3: 0.68 },
    { z: 2.38, y0: 0.3, y1: 0.46, y2: 0.6, y3: 0.63, w0: 0.72, w1: 0.76, w2: 0.68, w3: 0.56 }
];

function sampleRing(st) {
    const pts = [
        [0, st.y0],
        [-st.w0 * 0.75, st.y0],
        [-st.w0, st.y0 + 0.06],
        [-st.w1, (st.y0 + st.y1) * 0.52],
        [-st.w1, st.y1],
        [-st.w2, st.y2],
        [-st.w3, st.y3 - 0.04],
        [-st.w3 * 0.68, st.y3],
        [0, st.y3 + 0.025],
        [st.w3 * 0.68, st.y3],
        [st.w3, st.y3 - 0.04],
        [st.w2, st.y2],
        [st.w1, st.y1],
        [st.w1, (st.y0 + st.y1) * 0.52],
        [st.w0, st.y0 + 0.06],
        [st.w0 * 0.75, st.y0]
    ];
    return pts;
}

function interpolateStations(rawStations, subSteps = 2) {
    const out = [];
    for (let i = 0; i < rawStations.length - 1; i += 1) {
        const a = rawStations[i];
        const b = rawStations[i + 1];
        for (let s = 0; s < subSteps; s += 1) {
            const t = s / subSteps;
            const sm = t * t * (3 - 2 * t);
            const lerp = (u, v) => u + (v - u) * sm;
            out.push({
                z: a.z + (b.z - a.z) * t,
                y0: lerp(a.y0, b.y0),
                y1: lerp(a.y1, b.y1),
                y2: lerp(a.y2, b.y2),
                y3: lerp(a.y3, b.y3),
                w0: lerp(a.w0, b.w0),
                w1: lerp(a.w1, b.w1),
                w2: lerp(a.w2, b.w2),
                w3: lerp(a.w3, b.w3)
            });
        }
    }
    out.push(rawStations[rawStations.length - 1]);
    return out;
}

export function buildLoftedHullGeometry(kind = "sedan") {
    const base = kind === "suv" ? SUV_STATIONS : SEDAN_STATIONS;
    const stations = interpolateStations(base, 2);
    const ringLen = 16;
    const positions = [];
    const uvs = [];
    const indices = [];

    for (let si = 0; si < stations.length; si += 1) {
        const st = stations[si];
        const ring = sampleRing(st);
        const v = si / (stations.length - 1);
        for (let ri = 0; ri < ringLen; ri += 1) {
            const [x, y] = ring[ri];
            positions.push(x, y, st.z);
            uvs.push(ri / ringLen, v);
        }
    }

    for (let si = 0; si < stations.length - 1; si += 1) {
        for (let ri = 0; ri < ringLen; ri += 1) {
            const nextRi = (ri + 1) % ringLen;
            const a = si * ringLen + ri;
            const b = si * ringLen + nextRi;
            const c = (si + 1) * ringLen + ri;
            const d = (si + 1) * ringLen + nextRi;
            indices.push(a, c, b, b, c, d);
        }
    }

    const backCenter = positions.length / 3;
    const first = stations[0];
    positions.push(0, (first.y0 + first.y3) * 0.5, first.z - 0.04);
    uvs.push(0.5, 0);
    for (let ri = 0; ri < ringLen; ri += 1) {
        const nextRi = (ri + 1) % ringLen;
        indices.push(backCenter, ri, nextRi);
    }

    const frontCenter = positions.length / 3;
    const last = stations[stations.length - 1];
    const lastBase = (stations.length - 1) * ringLen;
    positions.push(0, (last.y0 + last.y3) * 0.5, last.z + 0.04);
    uvs.push(0.5, 1);
    for (let ri = 0; ri < ringLen; ri += 1) {
        const nextRi = (ri + 1) % ringLen;
        indices.push(frontCenter, lastBase + nextRi, lastBase + ri);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

export function buildGlassCanopyGeometry(kind = "suv") {
    const raw =
        kind === "suv"
            ? [
                  { z: -2.18, y0: 1.04, y3: 1.54, w2: 0.94, w3: 0.76 },
                  { z: -1.48, y0: 1.05, y3: 1.62, w2: 0.98, w3: 0.8 },
                  { z: 0.36, y0: 1.05, y3: 1.63, w2: 0.98, w3: 0.8 },
                  { z: 0.98, y0: 1.04, y3: 1.17, w2: 0.96, w3: 0.83 }
              ]
            : [
                  { z: -1.3, y0: 0.93, y3: 1.04, w2: 0.92, w3: 0.8 },
                  { z: -0.84, y0: 0.94, y3: 1.35, w2: 0.92, w3: 0.74 },
                  { z: 0.16, y0: 0.94, y3: 1.37, w2: 0.92, w3: 0.74 },
                  { z: 0.78, y0: 0.92, y3: 1.02, w2: 0.9, w3: 0.78 }
              ];
    const stations = raw.map((s) => ({
        z: s.z,
        y0: s.y0,
        y1: s.y0 + 0.04,
        y2: s.y0 + 0.08,
        y3: s.y3,
        w0: s.w2,
        w1: s.w2 + 0.025,
        w2: s.w2 + 0.02,
        w3: s.w3 + 0.02
    }));
    const ringLen = 16;
    const positions = [];
    const indices = [];
    for (const st of stations) {
        const ring = sampleRing(st);
        for (const [x, y] of ring) positions.push(x, y, st.z);
    }
    for (let si = 0; si < stations.length - 1; si += 1) {
        for (let ri = 0; ri < ringLen; ri += 1) {
            const nr = (ri + 1) % ringLen;
            const a = si * ringLen + ri;
            const b = si * ringLen + nr;
            const c = (si + 1) * ringLen + ri;
            const d = (si + 1) * ringLen + nr;
            indices.push(a, c, b, b, c, d);
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

export function buildSculptedWheelMesh(radius, width, lightweight = false) {
    const group = new THREE.Group();
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.82, metalness: 0.06 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xdbe3ec, roughness: 0.2, metalness: 0.92 });

    const tireGeo = new THREE.CylinderGeometry(radius, radius, width, lightweight ? 14 : 22);
    tireGeo.rotateZ(Math.PI * 0.5);
    const tire = new THREE.Mesh(tireGeo, tireMat);
    if (!lightweight) tire.castShadow = true;
    group.add(tire);

    const discGeo = new THREE.CylinderGeometry(radius * 0.68, radius * 0.68, width + 0.015, lightweight ? 12 : 18);
    discGeo.rotateZ(Math.PI * 0.5);
    group.add(new THREE.Mesh(discGeo, rimMat));

    if (!lightweight) {
        const spokeGeo = new THREE.CylinderGeometry(0.018, 0.026, radius * 1.24, 6);
        for (let s = 0; s < 5; s += 1) {
            const spoke = new THREE.Mesh(spokeGeo, rimMat);
            spoke.rotation.x = (s * Math.PI) / 5;
            spoke.position.x = width * 0.34;
            group.add(spoke);
        }
    }
    return group;
}

export function createContactShadowTexture() {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 256;
    const ctx = c.getContext("2d");
    const grad = ctx.createRadialGradient(64, 128, 12, 64, 128, 62);
    grad.addColorStop(0, "rgba(0, 0, 0, 0.72)");
    grad.addColorStop(0.55, "rgba(0, 0, 0, 0.42)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.scale(1, 2);
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
}
