import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

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
                  { z: -2.22, y0: 1.03, y3: 1.56, w2: 0.99, w3: 0.81 },
                  { z: -1.48, y0: 1.04, y3: 1.65, w2: 1.03, w3: 0.85 },
                  { z: 0.36, y0: 1.04, y3: 1.66, w2: 1.03, w3: 0.85 },
                  { z: 1.04, y0: 1.03, y3: 1.19, w2: 1.01, w3: 0.88 }
              ]
            : [
                  { z: -1.36, y0: 0.92, y3: 1.06, w2: 0.96, w3: 0.84 },
                  { z: -0.86, y0: 0.93, y3: 1.38, w2: 0.97, w3: 0.79 },
                  { z: 0.18, y0: 0.93, y3: 1.4, w2: 0.97, w3: 0.79 },
                  { z: 0.84, y0: 0.91, y3: 1.04, w2: 0.95, w3: 0.83 }
              ];
    const stations = raw.map((s) => ({
        z: s.z,
        y0: s.y0,
        y1: s.y0 + 0.04,
        y2: s.y0 + 0.08,
        y3: s.y3,
        w0: s.w2,
        w1: s.w2 + 0.03,
        w2: s.w2 + 0.028,
        w3: s.w3 + 0.025
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

function normNoUv(geo) {
    const raw = geo.index ? geo.toNonIndexed() : geo.clone();
    if (!raw.attributes.normal) raw.computeVertexNormals();
    const out = new THREE.BufferGeometry();
    out.setAttribute("position", raw.attributes.position);
    out.setAttribute("normal", raw.attributes.normal);
    raw.dispose();
    return out;
}

function mergeNormalized(list) {
    const norm = list.map((g) => normNoUv(g));
    for (const g of list) g.dispose();
    const merged = mergeGeometries(norm, false);
    for (const g of norm) g.dispose();
    return merged;
}

export function buildVehicleDetailGeometries(kind = "sedan") {
    const isSuv = kind === "suv";
    const tailZ = isSuv ? -2.47 : -2.31;
    const headZ = isSuv ? 2.52 : 2.34;
    const hw = isSuv ? 0.78 : 0.68;

    const glassParts = [buildGlassCanopyGeometry(kind)];
    if (isSuv) {
        const rw = new THREE.PlaneGeometry(1.48, 0.56);
        rw.rotateY(Math.PI);
        rw.rotateX(-0.18);
        rw.translate(0, 1.28, tailZ + 0.14);
        glassParts.push(rw);
    }

    const trimParts = [];
    const fBumper = new THREE.BoxGeometry(isSuv ? 1.88 : 1.72, 0.24, 0.22);
    fBumper.translate(0, 0.34, headZ - 0.02);
    trimParts.push(fBumper);

    const rBumper = new THREE.BoxGeometry(isSuv ? 1.9 : 1.76, 0.26, 0.22);
    rBumper.translate(0, 0.36, tailZ + 0.04);
    trimParts.push(rBumper);

    const grille = new THREE.BoxGeometry(isSuv ? 1.18 : 1.02, isSuv ? 0.32 : 0.22, 0.12);
    grille.translate(0, isSuv ? 0.68 : 0.52, headZ + 0.02);
    trimParts.push(grille);

    const pillarZ = isSuv ? [-1.52, -0.52, 0.42] : [-0.88, -0.25, 0.24];
    for (const sx of [-1, 1]) {
        const skirt = new THREE.BoxGeometry(0.14, 0.14, isSuv ? 2.4 : 2.15);
        skirt.translate(sx * (isSuv ? 1.04 : 0.96), 0.24, -0.05);
        trimParts.push(skirt);

        const mirror = new THREE.BoxGeometry(0.24, 0.12, 0.16);
        mirror.translate(sx * (isSuv ? 1.1 : 1.02), isSuv ? 1.08 : 0.94, isSuv ? 0.68 : 0.42);
        trimParts.push(mirror);

        for (const pz of pillarZ) {
            const pil = new THREE.BoxGeometry(0.08, isSuv ? 0.58 : 0.44, 0.11);
            pil.translate(sx * (isSuv ? 0.93 : 0.88), isSuv ? 1.34 : 1.16, pz);
            trimParts.push(pil);
        }

        if (isSuv) {
            const rail = new THREE.BoxGeometry(0.06, 0.07, 2.2);
            rail.translate(sx * 0.72, 1.71, -0.55);
            trimParts.push(rail);
        }
    }

    const chromeParts = [];
    const grilleBar = new THREE.BoxGeometry(isSuv ? 1.16 : 0.98, 0.045, 0.15);
    grilleBar.translate(0, isSuv ? 0.72 : 0.54, headZ + 0.04);
    chromeParts.push(grilleBar);

    const rearBar = new THREE.BoxGeometry(isSuv ? 1.44 : 1.18, 0.045, 0.08);
    rearBar.translate(0, isSuv ? 0.76 : 0.64, tailZ - 0.03);
    chromeParts.push(rearBar);

    const headParts = [];
    const tailParts = [];
    for (const sx of [-hw, hw]) {
        const hl = new THREE.BoxGeometry(0.36, 0.13, 0.12);
        hl.translate(sx * 0.9, isSuv ? 0.74 : 0.58, headZ);
        headParts.push(hl);

        const tl = isSuv ? new THREE.BoxGeometry(0.14, 0.48, 0.12) : new THREE.BoxGeometry(0.44, 0.13, 0.1);
        tl.translate(sx * (isSuv ? 1.02 : 0.96), isSuv ? 0.88 : 0.68, tailZ - 0.01);
        tailParts.push(tl);

        const pipe = new THREE.CylinderGeometry(0.042, 0.042, 0.22, 8);
        pipe.rotateX(Math.PI * 0.5);
        pipe.translate(sx * 0.76, 0.25, tailZ - 0.06);
        chromeParts.push(pipe);
    }

    const plateGeo = new THREE.PlaneGeometry(0.44, 0.2);
    plateGeo.rotateY(Math.PI);
    plateGeo.translate(0, isSuv ? 0.58 : 0.5, tailZ - 0.08);

    return {
        glass: mergeNormalized(glassParts),
        trim: mergeNormalized(trimParts),
        chrome: mergeNormalized(chromeParts),
        headlights: mergeNormalized(headParts),
        taillights: mergeNormalized(tailParts),
        plate: plateGeo
    };
}

export function buildSplitWheelGeometries() {
    const tireGeo = new THREE.CylinderGeometry(0.37, 0.37, 0.27, 16);
    tireGeo.rotateZ(Math.PI * 0.5);
    const rimParts = [];
    const hub = new THREE.CylinderGeometry(0.245, 0.245, 0.285, 12);
    hub.rotateZ(Math.PI * 0.5);
    rimParts.push(hub);
    for (let s = 0; s < 5; s += 1) {
        const spoke = new THREE.BoxGeometry(0.295, 0.44, 0.045);
        spoke.rotateX((s * Math.PI) / 5);
        rimParts.push(spoke);
    }
    return { tireGeo: normNoUv(tireGeo), rimGeo: mergeNormalized(rimParts) };
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
