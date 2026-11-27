import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

function boxAt(w, h, d, x, y, z) {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(x, y, z);
    return g;
}

function safeMerge(list) {
    const merged = mergeGeometries(list, false);
    for (const g of list) g.dispose();
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
        new THREE.Vector3(0.06, 0.28, 0.02),
        new THREE.Vector3(0.14, 0.62, 0.05),
        new THREE.Vector3(0.18, 1.0, 0.07)
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, 12, 0.22, 8, false);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
        const y = pos.getY(i);
        const taper = 1.38 - y * 0.64;
        const center = curve.getPoint(Math.max(0, Math.min(1, y)));
        pos.setX(i, center.x + (pos.getX(i) - center.x) * taper);
        pos.setZ(i, center.z + (pos.getZ(i) - center.z) * taper);
    }
    geo.computeVertexNormals();
    return geo;
}

export function buildFeatheryPalmCrownGeometry() {
    const positions = [];
    const uvs = [];
    const indices = [];
    let vOff = 0;

    const addFrond = (angle, length, width, rise, droop) => {
        const segs = 7;
        const ca = Math.cos(angle);
        const sa = Math.sin(angle);
        const px = -sa;
        const pz = ca;
        for (let s = 0; s <= segs; s += 1) {
            const t = s / segs;
            const r = t * length;
            const y = Math.sin(t * Math.PI * 0.66) * rise - t * t * droop;
            const cx = ca * r;
            const cz = sa * r;
            const w = width * (0.45 + 0.55 * Math.sin(t * Math.PI));
            const fold = w * 0.28;
            positions.push(
                cx - px * w, y - fold, cz - pz * w,
                cx, y + 0.05, cz,
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

    for (let i = 0; i < 8; i += 1) {
        addFrond((i / 8) * Math.PI * 2, 4.4, 1.05, 1.1, 2.35);
    }
    for (let i = 0; i < 6; i += 1) {
        addFrond((i / 6) * Math.PI * 2 + 0.28, 3.4, 0.92, 1.85, 1.35);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
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

export function buildBroadleafTreeGeometries() {
    const trunkParts = [];
    const main = new THREE.CylinderGeometry(0.16, 0.28, 3.6, 8);
    main.translate(0, 1.8, 0);
    trunkParts.push(main);
    for (let i = 0; i < 4; i += 1) {
        const a = (i / 4) * Math.PI * 2 + 0.4;
        const b = new THREE.CylinderGeometry(0.06, 0.12, 2.2, 6);
        b.rotateZ(0.55);
        b.rotateY(a);
        b.translate(Math.cos(a) * 0.65, 3.8, Math.sin(a) * 0.65);
        trunkParts.push(b);
    }

    const leafCards = [];
    const offsets = [
        [0, 5.4, 0, 3.8],
        [-1.3, 4.7, 0.7, 3.0],
        [1.3, 4.8, -0.6, 3.1],
        [0.4, 4.6, 1.3, 2.9],
        [-0.5, 4.9, -1.3, 2.8]
    ];
    for (const [ox, oy, oz, sz] of offsets) {
        for (let p = 0; p < 3; p += 1) {
            const card = new THREE.PlaneGeometry(sz, sz);
            card.rotateY((p * Math.PI) / 3);
            card.rotateX((p - 1) * 0.32);
            card.translate(ox, oy, oz);
            leafCards.push(card);
        }
    }
    return {
        trunk: safeMerge(trunkParts),
        canopy: safeMerge(leafCards)
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
