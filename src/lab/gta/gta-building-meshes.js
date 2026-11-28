import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

function boxAt(w, h, d, x, y, z) {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(x, y, z);
    return g;
}

function normGeo(geo, keepUv = true, keepColor = false) {
    const raw = geo.index ? geo.toNonIndexed() : geo.clone();
    if (!raw.attributes.normal) raw.computeVertexNormals();
    const out = new THREE.BufferGeometry();
    out.setAttribute("position", raw.attributes.position);
    out.setAttribute("normal", raw.attributes.normal);
    if (keepUv && raw.attributes.uv) out.setAttribute("uv", raw.attributes.uv);
    if (keepColor && raw.attributes.color) out.setAttribute("color", raw.attributes.color);
    raw.dispose();
    return out;
}

function safeMerge(list, keepUv = true, keepColor = false) {
    const norm = list.map((g) => normGeo(g, keepUv, keepColor));
    for (const g of list) g.dispose();
    const merged = mergeGeometries(norm, false);
    for (const g of norm) g.dispose();
    return merged;
}

export function buildArchitecturalArchetypes() {
    const glassStruct = [];
    const glassCore = [];
    glassCore.push(boxAt(0.92, 0.86, 0.92, 0, -0.05, 0));
    glassCore.push(boxAt(0.72, 0.16, 0.72, 0, 0.42, 0));
    for (const sx of [-0.47, 0.47]) {
        for (const sz of [-0.47, 0.47]) {
            glassStruct.push(boxAt(0.08, 0.9, 0.08, sx, -0.05, sz));
        }
    }
    for (let f = 0; f <= 7; f += 1) {
        const y = -0.47 + (f / 7) * 0.86;
        glassStruct.push(boxAt(0.98, 0.018, 0.98, 0, y, 0));
    }
    for (const m of [-0.22, 0, 0.22]) {
        glassStruct.push(boxAt(0.025, 0.86, 0.96, m, -0.05, 0));
        glassStruct.push(boxAt(0.96, 0.86, 0.025, 0, -0.05, m));
    }
    glassStruct.push(boxAt(0.78, 0.035, 0.78, 0, 0.495, 0));
    glassStruct.push(boxAt(0.28, 0.06, 0.28, 0.12, 0.53, -0.1));

    const balconyStruct = [];
    const balconyCore = [];
    balconyCore.push(boxAt(0.84, 0.94, 0.84, 0, -0.02, 0));
    for (let f = 0; f <= 9; f += 1) {
        const y = -0.48 + (f / 9) * 0.94;
        balconyStruct.push(boxAt(1.02, 0.026, 1.02, 0, y, 0));
    }
    for (const sx of [-0.46, 0.46]) {
        for (const sz of [-0.46, 0.46]) {
            balconyStruct.push(boxAt(0.11, 0.98, 0.11, sx, -0.01, sz));
        }
    }
    balconyStruct.push(boxAt(0.46, 0.08, 0.42, 0, 0.51, 0));

    const commStruct = [];
    const commCore = [];
    const commTrim = [];
    commStruct.push(boxAt(0.98, 0.62, 0.98, 0, 0.17, 0));
    commStruct.push(boxAt(1.03, 0.07, 1.03, 0, 0.485, 0));
    for (const sx of [-0.44, -0.14, 0.14, 0.44]) {
        for (const sz of [-0.44, 0.44]) {
            commStruct.push(boxAt(0.08, 0.36, 0.08, sx, -0.32, sz));
        }
    }
    commCore.push(boxAt(0.88, 0.34, 0.88, 0, -0.32, 0));
    commCore.push(boxAt(0.995, 0.24, 0.82, 0, 0.17, 0));
    commCore.push(boxAt(0.82, 0.24, 0.995, 0, 0.17, 0));
    commTrim.push(boxAt(1.08, 0.045, 1.08, 0, -0.14, 0));
    commStruct.push(boxAt(0.24, 0.09, 0.24, -0.18, 0.55, 0.12));

    const aptStruct = [];
    const aptCore = [];
    aptStruct.push(boxAt(0.94, 0.96, 0.94, 0, -0.02, 0));
    aptStruct.push(boxAt(1.02, 0.055, 1.02, 0, 0.47, 0));
    for (let f = 0; f < 5; f += 1) {
        const y = -0.32 + f * 0.17;
        aptStruct.push(boxAt(1.0, 0.025, 1.0, 0, y - 0.06, 0));
        aptCore.push(boxAt(0.96, 0.095, 0.78, 0, y, 0));
        aptCore.push(boxAt(0.78, 0.095, 0.96, 0, y, 0));
    }

    const dinerStruct = [];
    const dinerCore = [];
    const dinerTrim = [];
    dinerStruct.push(boxAt(0.94, 0.72, 0.94, 0, -0.14, 0));
    dinerCore.push(boxAt(0.97, 0.42, 0.8, 0, -0.2, 0));
    dinerCore.push(boxAt(0.8, 0.42, 0.97, 0, -0.2, 0));
    dinerTrim.push(boxAt(1.12, 0.22, 1.12, 0, 0.34, 0));
    dinerStruct.push(boxAt(0.98, 0.08, 0.98, 0, 0.48, 0));

    return {
        glassTower: { struct: safeMerge(glassStruct), glass: safeMerge(glassCore) },
        officeLight: { struct: safeMerge(balconyStruct), glass: safeMerge(balconyCore) },
        commercial: { struct: safeMerge(commStruct), glass: safeMerge(commCore), trim: safeMerge(commTrim) },
        apartment: { struct: safeMerge(aptStruct), glass: safeMerge(aptCore) },
        diner: { struct: safeMerge(dinerStruct), glass: safeMerge(dinerCore), trim: safeMerge(dinerTrim) }
    };
}

export function buildCurvedPalmTrunkGeometry() {
    const pts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.05, 0.3, 0.02),
        new THREE.Vector3(0.11, 0.65, 0.04),
        new THREE.Vector3(0.14, 1.0, 0.05)
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, 14, 0.22, 8, false);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
        const y = pos.getY(i);
        const t = Math.max(0, Math.min(1, y));
        const ring = 1 + Math.sin(t * Math.PI * 26) * 0.06;
        const taper = (1.36 - t * 0.62) * ring;
        const center = curve.getPoint(t);
        pos.setX(i, center.x + (pos.getX(i) - center.x) * taper);
        pos.setZ(i, center.z + (pos.getZ(i) - center.z) * taper);
    }
    geo.computeVertexNormals();
    const tip = curve.getPoint(1).clone();
    return { geometry: geo, tip };
}

export function buildFeatheryPalmCrownGeometry() {
    const positions = [];
    const uvs = [];
    const indices = [];
    let vOff = 0;

    const addFrond = (angle, length, width, rise, droop) => {
        const segs = 8;
        const ca = Math.cos(angle);
        const sa = Math.sin(angle);
        const px = -sa;
        const pz = ca;
        for (let s = 0; s <= segs; s += 1) {
            const t = s / segs;
            const r = 0.14 + t * length;
            const y = Math.sin(t * Math.PI * 0.66) * rise - t * t * droop;
            const cx = ca * r;
            const cz = sa * r;
            const w = width * (0.28 + 0.72 * Math.sin(t * Math.PI));
            const fold = w * 0.3;
            positions.push(
                cx - px * w, y - fold, cz - pz * w,
                cx, y + 0.06, cz,
                cx + px * w, y - fold, cz + pz * w
            );
            uvs.push(0, t, 0.5, t, 1, t);
            if (s < segs) {
                const a = vOff + s * 3;
                const b = a + 3;
                indices.push(a, a + 1, b, a + 1, b + 1, b);
                indices.push(a + 1, a + 2, b + 1, a + 2, b + 2, b + 1);
            }
        }
        vOff += (segs + 1) * 3;
    };

    for (let i = 0; i < 9; i += 1) {
        addFrond((i / 9) * Math.PI * 2, 4.3, 1.02, 1.05, 2.3);
    }
    for (let i = 0; i < 7; i += 1) {
        addFrond((i / 7) * Math.PI * 2 + 0.35, 3.3, 0.88, 1.85, 1.3);
    }

    const frondGeo = new THREE.BufferGeometry();
    frondGeo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    frondGeo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    frondGeo.setIndex(indices);
    frondGeo.computeVertexNormals();

    const collar = new THREE.SphereGeometry(0.32, 8, 6);
    collar.scale(1.0, 1.25, 1.0);
    collar.translate(0, -0.14, 0);
    return { crown: frondGeo, collar };
}

export function buildLatticeTrussSection(width, height, bays, barRadius = 0.09) {
    const parts = [];
    const hw = width * 0.5;
    const bayH = height / bays;
    for (const sx of [-hw, hw]) {
        for (const sz of [-hw, hw]) {
            const c = new THREE.CylinderGeometry(barRadius, barRadius, height, 6);
            c.translate(sx, height * 0.5, sz);
            parts.push(c);
        }
    }
    const diagLen = Math.hypot(width, bayH);
    const diagAngle = Math.atan2(width, bayH);
    for (let b = 0; b < bays; b += 1) {
        const y0 = b * bayH;
        const ym = y0 + bayH * 0.5;
        for (const sz of [-hw, hw]) {
            const hBar = new THREE.CylinderGeometry(barRadius * 0.72, barRadius * 0.72, width, 5);
            hBar.rotateZ(Math.PI * 0.5);
            hBar.translate(0, y0 + bayH, sz);
            parts.push(hBar);

            const dBar = new THREE.CylinderGeometry(barRadius * 0.65, barRadius * 0.65, diagLen, 5);
            dBar.rotateZ(b % 2 === 0 ? diagAngle : -diagAngle);
            dBar.translate(0, ym, sz);
            parts.push(dBar);
        }
        for (const sx of [-hw, hw]) {
            const hBar = new THREE.CylinderGeometry(barRadius * 0.72, barRadius * 0.72, width, 5);
            hBar.rotateX(Math.PI * 0.5);
            hBar.translate(sx, y0 + bayH, 0);
            parts.push(hBar);

            const dBar = new THREE.CylinderGeometry(barRadius * 0.65, barRadius * 0.65, diagLen, 5);
            dBar.rotateX(b % 2 === 0 ? diagAngle : -diagAngle);
            dBar.translate(sx, ym, 0);
            parts.push(dBar);
        }
    }
    return safeMerge(parts);
}

function makeTubeBranch(points, rStart, rEnd, radialSegs = 7) {
    const curve = new THREE.CatmullRomCurve3(points);
    const geo = new THREE.TubeGeometry(curve, 7, 1, radialSegs, false);
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i += 1) {
        const t = Math.max(0, Math.min(1, uv.getX(i)));
        const r = rStart + (rEnd - rStart) * t;
        const c = curve.getPoint(t);
        pos.setXYZ(
            i,
            c.x + (pos.getX(i) - c.x) * r,
            c.y + (pos.getY(i) - c.y) * r,
            c.z + (pos.getZ(i) - c.z) * r
        );
    }
    geo.computeVertexNormals();
    return geo;
}

export function buildBroadleafTreeGeometries() {
    const trunkParts = [];
    trunkParts.push(
        makeTubeBranch(
            [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0.04, 1.2, 0.02),
                new THREE.Vector3(-0.02, 2.4, -0.02),
                new THREE.Vector3(0, 3.65, 0)
            ],
            0.31,
            0.15,
            8
        )
    );
    for (let i = 0; i < 5; i += 1) {
        const a = (i / 5) * Math.PI * 2 + 0.35;
        const yBase = 2.55 + (i % 2) * 0.38;
        const reach = 1.45 + (i % 3) * 0.25;
        const yTip = 4.35 + (i % 3) * 0.3;
        trunkParts.push(
            makeTubeBranch(
                [
                    new THREE.Vector3(0, yBase, 0),
                    new THREE.Vector3(Math.cos(a) * reach * 0.48, (yBase + yTip) * 0.52, Math.sin(a) * reach * 0.48),
                    new THREE.Vector3(Math.cos(a) * reach, yTip, Math.sin(a) * reach)
                ],
                0.125,
                0.045,
                6
            )
        );
    }

    const clusters = [
        [0, 5.45, 0, 1.52, 1.18, 1.48],
        [0.15, 6.25, -0.1, 1.22, 0.95, 1.18],
        [-1.35, 4.95, 0.72, 1.24, 0.96, 1.2],
        [1.38, 5.05, -0.62, 1.26, 0.98, 1.22],
        [0.45, 4.88, 1.38, 1.2, 0.94, 1.18],
        [-0.55, 5.02, -1.35, 1.22, 0.95, 1.18],
        [-1.1, 5.75, -0.82, 1.1, 0.88, 1.08],
        [1.08, 5.78, 0.88, 1.12, 0.88, 1.1],
        [0.0, 4.55, -0.95, 1.05, 0.82, 1.05],
        [-0.95, 4.52, -0.15, 1.04, 0.82, 1.02],
        [0.98, 4.58, 0.22, 1.06, 0.82, 1.04],
        [-0.18, 4.48, 0.96, 1.02, 0.8, 1.04],
        [-1.65, 4.55, -0.35, 0.88, 0.72, 0.86],
        [1.62, 4.62, 0.42, 0.9, 0.74, 0.88],
        [0.72, 5.65, -1.18, 0.96, 0.78, 0.94],
        [-0.78, 5.68, 1.12, 0.96, 0.78, 0.94],
        [0.05, 6.68, 0.12, 0.86, 0.68, 0.86],
        [0.0, 4.28, 0.0, 1.18, 0.72, 1.18]
    ];

    const canopyParts = [];
    const tmpCol = new THREE.Color();
    const darkLeaf = new THREE.Color(0x6e8564);
    const midLeaf = new THREE.Color(0xb4ccaa);
    const sunLeaf = new THREE.Color(0xf2ffe6);

    for (let ci = 0; ci < clusters.length; ci += 1) {
        const [ox, oy, oz, rx, ry, rz] = clusters[ci];
        const g = new THREE.IcosahedronGeometry(1, 2);
        const pos = g.attributes.position;
        const colors = new Float32Array(pos.count * 3);
        for (let i = 0; i < pos.count; i += 1) {
            const vx = pos.getX(i);
            const vy = pos.getY(i);
            const vz = pos.getZ(i);
            const bump =
                1 +
                0.15 * Math.sin(vx * 5.2 + ci * 1.7) * Math.cos(vz * 5.4 - ci) +
                0.1 * Math.sin(vy * 6.8 + vx * 3.5);
            const wx = ox + vx * rx * bump;
            const wy = oy + vy * ry * bump;
            const wz = oz + vz * rz * bump;
            pos.setXYZ(i, wx, wy, wz);

            const radial = Math.hypot(wx, (wy - 5.1) * 1.15, wz);
            const topShade = Math.max(0, Math.min(1, (wy - 3.95) / 2.85));
            const outerShade = Math.max(0, Math.min(1, (radial - 0.5) / 1.9));
            const shade = topShade * 0.68 + outerShade * 0.32;
            tmpCol.copy(darkLeaf).lerp(midLeaf, Math.min(1, shade * 1.5)).lerp(sunLeaf, Math.max(0, shade - 0.45) * 1.3);
            colors[i * 3] = tmpCol.r;
            colors[i * 3 + 1] = tmpCol.g;
            colors[i * 3 + 2] = tmpCol.b;
        }
        g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        g.computeVertexNormals();
        canopyParts.push(g);
    }

    return {
        trunk: safeMerge(trunkParts, true, false),
        canopy: safeMerge(canopyParts, true, true)
    };
}

export function buildTrafficSignalGeometries() {
    const housingParts = [];
    const body = boxAt(0.42, 1.24, 0.36, 0, 0, 0);
    housingParts.push(body);
    housingParts.push(boxAt(0.14, 0.48, 0.14, 0, 0.78, 0));
    housingParts.push(boxAt(0.32, 0.14, 0.24, 0, 0.96, 0));

    const lensY = [0.36, 0.0, -0.36];
    for (const faceSign of [1, -1]) {
        for (const ly of lensY) {
            const visor = new THREE.CylinderGeometry(0.145, 0.145, 0.22, 10, 1, true, -Math.PI * 0.55, Math.PI * 1.1);
            visor.rotateX(-Math.PI * 0.5);
            visor.translate(0, ly + 0.02, faceSign * 0.26);
            housingParts.push(visor);
        }
    }

    const backplateParts = [];
    backplateParts.push(boxAt(0.58, 1.4, 0.04, 0, 0, 0));

    const makeLensPair = (ly) => {
        const pair = [];
        for (const faceSign of [1, -1]) {
            const c = new THREE.CylinderGeometry(0.115, 0.115, 0.05, 14);
            c.rotateX(Math.PI * 0.5);
            c.translate(0, ly, faceSign * 0.175);
            pair.push(c);
        }
        return safeMerge(pair, false, false);
    };

    return {
        housing: safeMerge(housingParts, false, false),
        backplate: safeMerge(backplateParts, false, false),
        redLens: makeLensPair(0.36),
        yellowLens: makeLensPair(0.0),
        greenLens: makeLensPair(-0.36)
    };
}

export function buildStreetlampGeometries() {
    const poleParts = [];
    const base = new THREE.CylinderGeometry(0.18, 0.24, 0.45, 8);
    base.translate(0, 0.225, 0);
    poleParts.push(base);

    const shaft = new THREE.CylinderGeometry(0.095, 0.155, 7.45, 8);
    shaft.translate(0, 3.95, 0);
    poleParts.push(shaft);

    const armCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 7.42, 0),
        new THREE.Vector3(0, 7.82, 0.55),
        new THREE.Vector3(0, 7.9, 1.55),
        new THREE.Vector3(0, 7.84, 2.08)
    ]);
    const arm = new THREE.TubeGeometry(armCurve, 8, 0.055, 6, false);
    poleParts.push(arm);

    const hood = new THREE.BoxGeometry(0.42, 0.14, 0.78);
    hood.translate(0, 7.84, 2.26);
    poleParts.push(hood);

    const lens = new THREE.BoxGeometry(0.32, 0.08, 0.58);
    lens.translate(0, 7.75, 2.26);

    const cone = new THREE.CylinderGeometry(0.24, 2.75, 7.35, 16, 1, true);
    cone.translate(0, 4.02, 2.26);

    const pool = new THREE.PlaneGeometry(11.5, 11.5);
    pool.rotateX(-Math.PI * 0.5);
    pool.translate(0, 0.13, 2.26);

    return {
        pole: safeMerge(poleParts, false, false),
        lens,
        cone,
        pool
    };
}

export function buildJerseyBarrierGeometry() {
    const shape = new THREE.Shape();
    shape.moveTo(-0.34, 0);
    shape.lineTo(0.34, 0);
    shape.lineTo(0.34, 0.14);
    shape.lineTo(0.18, 0.34);
    shape.lineTo(0.11, 0.92);
    shape.lineTo(-0.11, 0.92);
    shape.lineTo(-0.18, 0.34);
    shape.lineTo(-0.34, 0.14);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 2.6, bevelEnabled: false });
    geo.translate(0, 0, -1.3);
    geo.rotateY(Math.PI * 0.5);
    geo.computeVertexNormals();
    return geo;
}

export function buildHydrantGeometry() {
    const pts = [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(0.22, 0.0),
        new THREE.Vector2(0.2, 0.08),
        new THREE.Vector2(0.15, 0.14),
        new THREE.Vector2(0.15, 0.62),
        new THREE.Vector2(0.19, 0.66),
        new THREE.Vector2(0.16, 0.72),
        new THREE.Vector2(0.11, 0.82),
        new THREE.Vector2(0.0, 0.86)
    ];
    const geo = new THREE.LatheGeometry(pts, 12);
    geo.computeVertexNormals();
    return geo;
}
