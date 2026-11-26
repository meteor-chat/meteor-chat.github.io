import * as THREE from "three";
import {
    OCEAN_LEVEL,
    ROAD_HALF_WIDTH,
    WORLD_HALF,
    X_ROADS,
    Z_ROADS,
    getSignalState,
    heightAt
} from "./gta-road-graph.js";

function buildTerrainMesh() {
    const size = WORLD_HALF * 2;
    const segs = 96;
    const geo = new THREE.PlaneGeometry(size, size, segs, segs);
    geo.rotateX(-Math.PI * 0.5);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i += 1) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const y = heightAt(x, z);
        pos.setY(i, y - 0.04);
        if (z > 282) c.setHex(0xdcc79c);
        else if (z < -280) c.setHex(0x4f6d3c);
        else c.setHex(0x525760);
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.92,
        metalness: 0.02
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    return mesh;
}

function buildRoadRibbon(x0, z0, x1, z1, width, segs, yLift, mat) {
    const dx = x1 - x0;
    const dz = z1 - z0;
    const len = Math.hypot(dx, dz);
    const nx = -dz / len;
    const nz = dx / len;
    const hw = width * 0.5;
    const positions = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= segs; i += 1) {
        const t = i / segs;
        const cx = x0 + dx * t;
        const cz = z0 + dz * t;
        const lx = cx - nx * hw;
        const lz = cz - nz * hw;
        const rx = cx + nx * hw;
        const rz = cz + nz * hw;
        const ly = heightAt(lx, lz) + yLift;
        const ry = heightAt(rx, rz) + yLift;
        positions.push(lx, ly, lz, rx, ry, rz);
        const vCoord = (t * len) / 20;
        uvs.push(0, vCoord, 1, vCoord);
        if (i < segs) {
            const k = i * 2;
            indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    return mesh;
}

function buildPalmCrownGeometry() {
    const positions = [];
    const normals = [];
    const indices = [];
    let vOff = 0;

    const addFrond = (angle, length, width, rise, droop) => {
        const segs = 5;
        const ca = Math.cos(angle);
        const sa = Math.sin(angle);
        const px = -sa;
        const pz = ca;
        for (let s = 0; s <= segs; s += 1) {
            const t = s / segs;
            const r = t * length;
            const y = Math.sin(t * Math.PI * 0.68) * rise - t * t * droop;
            const w = Math.sin(Math.pow(t, 0.72) * Math.PI) * width;
            const cx = ca * r;
            const cz = sa * r;
            const edgeDrop = w * 0.24;
            positions.push(
                cx - px * w, y - edgeDrop, cz - pz * w,
                cx, y + 0.06, cz,
                cx + px * w, y - edgeDrop, cz + pz * w
            );
            normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
            if (s < segs) {
                const a = vOff + s * 3;
                const b = a + 3;
                indices.push(a, a + 1, b, a + 1, b + 1, b);
                indices.push(a + 1, a + 2, b + 1, a + 2, b + 2, b + 1);
            }
        }
        vOff += (segs + 1) * 3;
    };

    for (let i = 0; i < 7; i += 1) {
        addFrond((i / 7) * Math.PI * 2, 4.1, 0.72, 0.95, 2.15);
    }
    for (let i = 0; i < 5; i += 1) {
        addFrond((i / 5) * Math.PI * 2 + 0.35, 3.1, 0.6, 1.55, 1.25);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

function buildSafehouse(group, sh, textures) {
    const baseY = sh.y;
    const deckMat = new THREE.MeshStandardMaterial({
        color: 0xd9ba96,
        map: textures.deckPlanks,
        roughness: 0.48,
        metalness: 0.08
    });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xeae5dc, roughness: 0.72, metalness: 0.04 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x252b34, roughness: 0.45, metalness: 0.35 });
    const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xaad6f0,
        metalness: 0.1,
        roughness: 0.08,
        transparent: true,
        opacity: 0.36
    });
    const sconceMat = new THREE.MeshStandardMaterial({
        color: 0xfff0d4,
        emissive: 0xffd28c,
        emissiveIntensity: 2.2,
        roughness: 0.2
    });
    const artMat = new THREE.MeshStandardMaterial({
        map: textures.safehouseArt,
        roughness: 0.35,
        metalness: 0.05
    });

    const deck = new THREE.Mesh(new THREE.BoxGeometry(34, 1.2, 22), deckMat);
    deck.position.set(sh.x, baseY - 0.55, sh.z);
    deck.receiveShadow = true;
    group.add(deck);

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(34, 6.4, 1.6), wallMat);
    backWall.position.set(sh.x, baseY + 3.2, sh.z - 10.6);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    group.add(backWall);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(36, 0.9, 14), darkMat);
    roof.position.set(sh.x, baseY + 6.6, sh.z - 5.2);
    roof.castShadow = true;
    group.add(roof);

    for (const sx of [-16, 16]) {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(1.6, 6.4, 15), wallMat);
        wing.position.set(sh.x + sx, baseY + 3.2, sh.z - 3.6);
        wing.castShadow = true;
        wing.receiveShadow = true;
        group.add(wing);
    }

    const art = new THREE.Mesh(new THREE.BoxGeometry(6.4, 4.4, 0.18), artMat);
    art.position.set(sh.x + 15.1, baseY + 3.3, sh.z - 3.2);
    art.rotation.y = -Math.PI * 0.5;
    group.add(art);

    const backArt = new THREE.Mesh(new THREE.BoxGeometry(8.5, 4.0, 0.18), artMat);
    backArt.position.set(sh.x - 4, baseY + 3.4, sh.z - 9.7);
    group.add(backArt);

    for (const lx of [-11, -3, 5, 11]) {
        const sconce = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.28, 0.16), sconceMat);
        sconce.position.set(sh.x + lx, baseY + 0.8, sh.z - 9.7);
        group.add(sconce);
    }

    for (const rx of [-11.5, 11.5]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(10.5, 1.15, 0.14), glassMat);
        rail.position.set(sh.x + rx, baseY + 0.62, sh.z + 10.6);
        group.add(rail);
    }
}

function buildMazeBankTower(group, mt, glassMat, concreteMat) {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(mt.radius * 1.12, mt.radius * 1.24, 18, 24), concreteMat);
    base.position.set(mt.x, mt.y + 9, mt.z);
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(mt.radius * 0.9, mt.radius, mt.height - 28, 24), glassMat);
    shaft.position.set(mt.x, mt.y + 18 + (mt.height - 28) * 0.5, mt.z);
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    group.add(shaft);

    const crown = new THREE.Mesh(new THREE.CylinderGeometry(mt.radius * 1.02, mt.radius * 0.9, 12, 24), concreteMat);
    crown.position.set(mt.x, mt.y + mt.height - 6, mt.z);
    crown.castShadow = true;
    group.add(crown);

    const beaconMat = new THREE.MeshStandardMaterial({
        color: 0xff3b30,
        emissive: 0xff2d20,
        emissiveIntensity: 3.0
    });
    const beacon = new THREE.Mesh(new THREE.BoxGeometry(14, 2.2, 2.2), beaconMat);
    beacon.position.set(mt.x, mt.y + mt.height + 1.5, mt.z);
    group.add(beacon);
}

function buildConstructionSite(group, cs) {
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, metalness: 0.72, roughness: 0.42 });
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.35, roughness: 0.48 });
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.85 });

    for (let f = 0; f < cs.floors; f += 1) {
        const slab = new THREE.Mesh(new THREE.BoxGeometry(22, 0.7, 30), concreteMat);
        slab.position.set(cs.x - 10, cs.y + 0.5 + f * 5.2, cs.z);
        slab.castShadow = true;
        slab.receiveShadow = true;
        group.add(slab);
    }
    for (const px of [-20, -10, 0]) {
        for (const pz of [-14, 0, 14]) {
            const col = new THREE.Mesh(new THREE.BoxGeometry(0.9, cs.floors * 5.2, 0.9), steelMat);
            col.position.set(cs.x + px, cs.y + cs.floors * 2.6, cs.z + pz);
            col.castShadow = true;
            group.add(col);
        }
    }

    const mast = new THREE.Mesh(new THREE.BoxGeometry(2.4, cs.craneHeight, 2.4), yellowMat);
    mast.position.set(cs.x + 12, cs.y + cs.craneHeight * 0.5, cs.z - 6);
    mast.castShadow = true;
    group.add(mast);

    const jibPivot = new THREE.Group();
    jibPivot.position.set(cs.x + 12, cs.y + cs.craneHeight - 2, cs.z - 6);
    const jib = new THREE.Mesh(new THREE.BoxGeometry(44, 1.8, 1.8), yellowMat);
    jib.position.set(-10, 0, 0);
    jib.castShadow = true;
    jibPivot.add(jib);
    const weight = new THREE.Mesh(new THREE.BoxGeometry(5, 3.2, 3.2), concreteMat);
    weight.position.set(12, 0, 0);
    jibPivot.add(weight);
    group.add(jibPivot);
    return jibPivot;
}

function buildVinewoodSign(group) {
    const signMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.5,
        emissive: 0x334155,
        emissiveIntensity: 0.35
    });
    const baseZ = -352;
    const widths = [7, 3, 7, 6, 8, 7, 7, 7];
    let cursorX = -46;
    for (let i = 0; i < widths.length; i += 1) {
        const w = widths[i];
        const x = cursorX + w * 0.5;
        const y = heightAt(x, baseZ);
        const letter = new THREE.Mesh(new THREE.BoxGeometry(w, 12, 1.4), signMat);
        letter.position.set(x, y + 6.5, baseZ);
        letter.castShadow = true;
        group.add(letter);
        cursorX += w + 4.2;
    }
}

function buildBlimp(group) {
    const blimp = new THREE.Group();
    const hullMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.42, metalness: 0.15 });
    const stripeMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        emissive: 0x60a5fa,
        emissiveIntensity: 0.4,
        roughness: 0.35
    });
    const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), hullMat);
    hull.scale.set(11, 8.5, 28);
    blimp.add(hull);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(8.9, 8.9, 10, 20), stripeMat);
    band.rotation.x = Math.PI * 0.5;
    blimp.add(band);
    blimp.position.set(-80, 148, -60);
    group.add(blimp);
    return blimp;
}

export function createCityScene(scene, cityData, textures) {
    const root = new THREE.Group();
    scene.add(root);

    root.add(buildTerrainMesh());

    const roadMat = new THREE.MeshPhysicalMaterial({
        map: textures.roadMap,
        roughnessMap: textures.roadRough,
        roughness: 0.34,
        metalness: 0.22,
        clearcoat: 0.85,
        clearcoatRoughness: 0.09,
        envMapIntensity: 1.45
    });
    const interMat = new THREE.MeshPhysicalMaterial({
        map: textures.intersectionMap,
        roughnessMap: textures.roadRough,
        roughness: 0.36,
        metalness: 0.2,
        clearcoat: 0.8,
        clearcoatRoughness: 0.11,
        envMapIntensity: 1.4
    });
    const sidewalkMat = new THREE.MeshStandardMaterial({
        map: textures.sidewalkMap,
        roughness: 0.84,
        metalness: 0.04
    });

    for (const rz of Z_ROADS) {
        root.add(buildRoadRibbon(-278, rz, 278, rz, ROAD_HALF_WIDTH * 2, 24, 0.09, roadMat));
        root.add(buildRoadRibbon(-278, rz - 10.5, 278, rz - 10.5, 4.2, 20, 0.2, sidewalkMat));
        root.add(buildRoadRibbon(-278, rz + 10.5, 278, rz + 10.5, 4.2, 20, 0.2, sidewalkMat));
    }
    for (const rx of X_ROADS) {
        root.add(buildRoadRibbon(rx, -278, rx, 278, ROAD_HALF_WIDTH * 2, 24, 0.075, roadMat));
        root.add(buildRoadRibbon(rx - 10.5, -278, rx - 10.5, 278, 4.2, 20, 0.185, sidewalkMat));
        root.add(buildRoadRibbon(rx + 10.5, -278, rx + 10.5, 278, 4.2, 20, 0.185, sidewalkMat));
    }

    root.add(buildRoadRibbon(0, -300, 0, -270, 16, 12, 0.11, roadMat));

    const interGeo = new THREE.PlaneGeometry(ROAD_HALF_WIDTH * 2.08, ROAD_HALF_WIDTH * 2.08);
    interGeo.rotateX(-Math.PI * 0.5);
    const interInst = new THREE.InstancedMesh(interGeo, interMat, X_ROADS.length * Z_ROADS.length);
    interInst.receiveShadow = true;
    const dummy = new THREE.Object3D();
    let idx = 0;
    for (const rz of Z_ROADS) {
        for (const rx of X_ROADS) {
            dummy.position.set(rx, heightAt(rx, rz) + 0.115, rz);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            interInst.setMatrixAt(idx, dummy.matrix);
            idx += 1;
        }
    }
    interInst.instanceMatrix.needsUpdate = true;
    root.add(interInst);

    const facadeMats = {
        glassTower: new THREE.MeshPhysicalMaterial({
            map: textures.glassTower.map,
            emissiveMap: textures.glassTower.emissiveMap,
            emissive: new THREE.Color(0xffffff),
            emissiveIntensity: 0.18,
            metalness: 0.68,
            roughness: 0.18,
            clearcoat: 0.8,
            clearcoatRoughness: 0.12
        }),
        officeLight: new THREE.MeshStandardMaterial({
            map: textures.officeLight.map,
            emissiveMap: textures.officeLight.emissiveMap,
            emissive: new THREE.Color(0xffffff),
            emissiveIntensity: 0.15,
            roughness: 0.62,
            metalness: 0.18
        }),
        commercial: new THREE.MeshStandardMaterial({
            map: textures.commercial.map,
            emissiveMap: textures.commercial.emissiveMap,
            emissive: new THREE.Color(0xffffff),
            emissiveIntensity: 0.22,
            roughness: 0.72,
            metalness: 0.08
        }),
        diner: new THREE.MeshStandardMaterial({
            map: textures.diner.map,
            emissiveMap: textures.diner.emissiveMap,
            emissive: new THREE.Color(0xffffff),
            emissiveIntensity: 0.35,
            roughness: 0.55,
            metalness: 0.1
        }),
        apartment: new THREE.MeshStandardMaterial({
            map: textures.apartment.map,
            emissiveMap: textures.apartment.emissiveMap,
            emissive: new THREE.Color(0xffffff),
            emissiveIntensity: 0.18,
            roughness: 0.76,
            metalness: 0.06
        })
    };

    const grouped = { glassTower: [], officeLight: [], commercial: [], diner: [], apartment: [] };
    for (const b of cityData.buildings) {
        (grouped[b.style] || grouped.commercial).push(b);
    }

    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const col = new THREE.Color();
    for (const [style, list] of Object.entries(grouped)) {
        if (list.length === 0) continue;
        const inst = new THREE.InstancedMesh(boxGeo, facadeMats[style], list.length);
        inst.castShadow = true;
        inst.receiveShadow = true;
        for (let i = 0; i < list.length; i += 1) {
            const b = list[i];
            dummy.position.set(b.x, b.y + b.h * 0.5, b.z);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(b.w, b.h, b.d);
            dummy.updateMatrix();
            inst.setMatrixAt(i, dummy.matrix);
            col.setHex(b.tint);
            inst.setColorAt(i, col);
        }
        inst.instanceMatrix.needsUpdate = true;
        if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
        root.add(inst);
    }

    const concreteMat = new THREE.MeshStandardMaterial({ color: 0xcbd2da, roughness: 0.65, metalness: 0.15 });
    buildMazeBankTower(root, cityData.mazeTower, facadeMats.glassTower, concreteMat);
    const craneJib = buildConstructionSite(root, cityData.constructionSite);
    buildSafehouse(root, cityData.safehouse, textures);
    buildVinewoodSign(root);
    const blimp = buildBlimp(root);

    const pierMat = new THREE.MeshStandardMaterial({ map: textures.deckPlanks, roughness: 0.75 });
    const pier = new THREE.Mesh(new THREE.BoxGeometry(14, 1.4, 72), pierMat);
    pier.position.set(0, 0.2, 322);
    pier.castShadow = true;
    pier.receiveShadow = true;
    root.add(pier);

    const oceanGeo = new THREE.PlaneGeometry(1400, 420);
    oceanGeo.rotateX(-Math.PI * 0.5);
    const oceanMat = new THREE.MeshPhysicalMaterial({
        color: 0x0e4f7a,
        roughness: 0.12,
        metalness: 0.25,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.position.set(0, OCEAN_LEVEL, 510);
    root.add(ocean);

    const trunkGeo = new THREE.CylinderGeometry(0.16, 0.34, 1, 7);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6f543d, roughness: 0.92 });
    const frondGeo = buildPalmCrownGeometry();
    const frondMat = new THREE.MeshStandardMaterial({
        color: 0x357a34,
        roughness: 0.72,
        side: THREE.DoubleSide
    });
    const palmTrunks = new THREE.InstancedMesh(trunkGeo, trunkMat, cityData.palms.length);
    const palmCrowns = new THREE.InstancedMesh(frondGeo, frondMat, cityData.palms.length);
    palmTrunks.castShadow = true;
    palmCrowns.castShadow = true;
    for (let i = 0; i < cityData.palms.length; i += 1) {
        const p = cityData.palms[i];
        dummy.position.set(p.x, p.y + p.height * 0.5, p.z);
        dummy.rotation.set(p.lean, p.yaw, 0);
        dummy.scale.set(1, p.height, 1);
        dummy.updateMatrix();
        palmTrunks.setMatrixAt(i, dummy.matrix);

        dummy.position.set(p.x + Math.sin(p.yaw) * p.lean * p.height * 0.5, p.y + p.height - 0.15, p.z + Math.cos(p.yaw) * p.lean * p.height * 0.5);
        dummy.rotation.set(0, p.yaw, 0);
        dummy.scale.set(1.05, 1, 1.05);
        dummy.updateMatrix();
        palmCrowns.setMatrixAt(i, dummy.matrix);
    }
    palmTrunks.instanceMatrix.needsUpdate = true;
    palmCrowns.instanceMatrix.needsUpdate = true;
    root.add(palmTrunks, palmCrowns);

    const poleGeo = new THREE.CylinderGeometry(0.11, 0.16, 7.6, 6);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x3b424d, metalness: 0.65, roughness: 0.45 });
    const bulbGeo = new THREE.BoxGeometry(0.9, 0.25, 0.45);
    const bulbMat = new THREE.MeshStandardMaterial({
        color: 0xfff4d6,
        emissive: 0xffc66e,
        emissiveIntensity: 0.5
    });
    const lampPoles = new THREE.InstancedMesh(poleGeo, poleMat, cityData.lamps.length);
    const lampBulbs = new THREE.InstancedMesh(bulbGeo, bulbMat, cityData.lamps.length);
    for (let i = 0; i < cityData.lamps.length; i += 1) {
        const l = cityData.lamps[i];
        dummy.position.set(l.x, l.y + 3.8, l.z);
        dummy.rotation.set(0, l.yaw, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        lampPoles.setMatrixAt(i, dummy.matrix);

        dummy.position.set(l.x + Math.sin(l.yaw) * 1.1, l.y + 7.5, l.z + Math.cos(l.yaw) * 1.1);
        dummy.updateMatrix();
        lampBulbs.setMatrixAt(i, dummy.matrix);
    }
    lampPoles.instanceMatrix.needsUpdate = true;
    lampBulbs.instanceMatrix.needsUpdate = true;
    root.add(lampPoles, lampBulbs);

    const signalHeadGeo = new THREE.BoxGeometry(0.55, 1.4, 0.55);
    const signalMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 1.6 });
    const signalHeads = new THREE.InstancedMesh(signalHeadGeo, signalMat, cityData.trafficLights.length);
    const signalPoles = new THREE.InstancedMesh(poleGeo, poleMat, cityData.trafficLights.length);
    for (let i = 0; i < cityData.trafficLights.length; i += 1) {
        const t = cityData.trafficLights[i];
        dummy.position.set(t.x, t.y + 3.8, t.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        signalPoles.setMatrixAt(i, dummy.matrix);
        dummy.position.set(t.x, t.y + 6.4, t.z);
        dummy.updateMatrix();
        signalHeads.setMatrixAt(i, dummy.matrix);
    }
    signalPoles.instanceMatrix.needsUpdate = true;
    signalHeads.instanceMatrix.needsUpdate = true;
    root.add(signalPoles, signalHeads);

    const bbMats = [
        new THREE.MeshStandardMaterial({ map: textures.billboardA, emissiveMap: textures.billboardA, emissive: 0xffffff, emissiveIntensity: 0.35 }),
        new THREE.MeshStandardMaterial({ map: textures.billboardB, emissiveMap: textures.billboardB, emissive: 0xffffff, emissiveIntensity: 0.35 })
    ];
    for (const bb of cityData.billboards) {
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(bb.w, bb.h), bbMats[bb.variant]);
        mesh.position.set(bb.x, bb.y, bb.z);
        mesh.rotation.y = bb.yaw;
        root.add(mesh);
    }

    const rampMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.6, metalness: 0.2 });
    for (const r of cityData.ramps) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(r.w, 0.45, r.l), rampMat);
        mesh.position.set(r.x, r.y + r.h * 0.5, r.z);
        mesh.rotation.set(-Math.atan2(r.h, r.l), r.yaw, 0, "YXZ");
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        root.add(mesh);
    }

    const updateEnvironment = (timeSec, nightFactor, wetness) => {
        const roadRoughVal = 0.72 - wetness * 0.52;
        roadMat.roughness = roadRoughVal;
        roadMat.clearcoat = 0.14 + wetness * 0.84;
        roadMat.clearcoatRoughness = 0.32 - wetness * 0.26;
        interMat.roughness = roadRoughVal + 0.02;
        interMat.clearcoat = roadMat.clearcoat;
        interMat.clearcoatRoughness = roadMat.clearcoatRoughness;

        const em = 0.05 + nightFactor * 0.62;
        facadeMats.glassTower.emissiveIntensity = em;
        facadeMats.officeLight.emissiveIntensity = em * 0.82;
        facadeMats.commercial.emissiveIntensity = 0.1 + nightFactor * 0.68;
        facadeMats.diner.emissiveIntensity = 0.18 + nightFactor * 0.85;
        facadeMats.apartment.emissiveIntensity = em * 0.86;
        bulbMat.emissiveIntensity = 0.25 + nightFactor * 2.8;

        craneJib.rotation.y = Math.sin(timeSec * 0.08) * 0.55;
        blimp.position.x = Math.cos(timeSec * 0.025) * 190;
        blimp.position.z = -50 + Math.sin(timeSec * 0.025) * 160;
        blimp.rotation.y = -timeSec * 0.025;

        for (let i = 0; i < cityData.trafficLights.length; i += 1) {
            const tl = cityData.trafficLights[i];
            const st = getSignalState(tl.ix, tl.iz, timeSec);
            if (st === "ns_green") col.setHex(0x22c55e);
            else if (st === "ns_yellow" || st === "ew_yellow") col.setHex(0xf59e0b);
            else col.setHex(0xef4444);
            signalHeads.setColorAt(i, col);
        }
        if (signalHeads.instanceColor) signalHeads.instanceColor.needsUpdate = true;
    };

    const dispose = () => {
        root.traverse((obj) => {
            if (obj.geometry) obj.geometry.dispose();
            if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
            else if (obj.material) obj.material.dispose();
        });
        scene.remove(root);
    };

    return { root, updateEnvironment, dispose };
}
