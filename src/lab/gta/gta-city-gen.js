import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import {
    buildArchitecturalArchetypes,
    buildBroadleafTreeGeometries,
    buildCurvedPalmTrunkGeometry,
    buildFeatheryPalmCrownGeometry,
    buildJerseyBarrierGeometry,
    buildLatticeTrussSection,
    buildStreetlampGeometries,
    buildTrafficSignalGeometries
} from "./gta-building-meshes.js";
import { computeSectorIndex } from "./gta-perf-governor.js";
import {
    OCEAN_LEVEL,
    ROAD_HALF_WIDTH,
    WORLD_HALF,
    X_ROADS,
    Z_ROADS,
    getSignalState,
    heightAt
} from "./gta-road-graph.js";
import { createWetRoadMaterial } from "./gta-textures.js";

const SECTOR_GRID = 3;
const SECTOR_COUNT = SECTOR_GRID * SECTOR_GRID;

function normalizeForMerge(geo, keepUv = true) {
    const raw = geo.index ? geo.toNonIndexed() : geo.clone();
    if (!raw.attributes.normal) raw.computeVertexNormals();
    const out = new THREE.BufferGeometry();
    out.setAttribute("position", raw.attributes.position);
    out.setAttribute("normal", raw.attributes.normal);
    if (keepUv && raw.attributes.uv) out.setAttribute("uv", raw.attributes.uv);
    raw.dispose();
    return out;
}

function mergeStaticParts(parts, mat, castShadow = true, receiveShadow = true, keepUv = true) {
    if (parts.length === 0) return null;
    const norm = parts.map((g) => normalizeForMerge(g, keepUv));
    for (const g of parts) g.dispose();
    const merged = mergeGeometries(norm, false);
    for (const g of norm) g.dispose();
    if (!merged) return null;
    merged.computeBoundingSphere();
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
    return mesh;
}

function buildTerrainMesh(pbrSand) {
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
        pos.setY(i, y - 0.06);
        if (z > 282) c.setHex(0xdcc79c);
        else if (z < -280) c.setHex(0x4b6539);
        else c.setHex(0x63686f);
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        normalMap: pbrSand ? pbrSand.normalMap : null,
        normalScale: new THREE.Vector2(0.4, 0.4),
        roughness: 0.92,
        metalness: 0.02
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    return mesh;
}

function buildRoadRibbonGeometry(x0, z0, x1, z1, width, segs, yLift) {
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
        const vCoord = (t * len) / 22;
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
    return geo;
}

function addSegmentedRoad(buckets, x0, z0, x1, z1, width, totalSegs, yLift) {
    const splits = 3;
    const segPer = Math.max(4, Math.round(totalSegs / splits));
    for (let s = 0; s < splits; s += 1) {
        const t0 = s / splits;
        const t1 = (s + 1) / splits;
        const sx0 = x0 + (x1 - x0) * t0;
        const sz0 = z0 + (z1 - z0) * t0;
        const sx1 = x0 + (x1 - x0) * t1;
        const sz1 = z0 + (z1 - z0) * t1;
        const sec = computeSectorIndex((sx0 + sx1) * 0.5, (sz0 + sz1) * 0.5, SECTOR_GRID, WORLD_HALF);
        buckets[sec].push(buildRoadRibbonGeometry(sx0, sz0, sx1, sz1, width, segPer, yLift));
    }
}

function buildSafehouse(group, sh, textures, stuccoMat) {
    const baseY = sh.y;
    const deckMat = new THREE.MeshStandardMaterial({
        color: 0xd9bc98,
        map: textures.deckPlanks,
        roughness: 0.48,
        metalness: 0.06
    });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x20252d, roughness: 0.36, metalness: 0.45 });
    const glassMat = new THREE.MeshStandardMaterial({
        color: 0xaad6f0,
        metalness: 0.2,
        roughness: 0.08,
        transparent: true,
        opacity: 0.34,
        depthWrite: false
    });
    const sconceMat = new THREE.MeshStandardMaterial({
        color: 0xffedd5,
        emissive: 0xffb347,
        emissiveIntensity: 2.2
    });

    const deck = new THREE.Mesh(new THREE.BoxGeometry(34, 1.2, 22), deckMat);
    deck.position.set(sh.x, baseY - 0.55, sh.z);
    deck.receiveShadow = true;
    deck.castShadow = true;
    group.add(deck);

    const stuccoParts = [];
    const bw = new THREE.BoxGeometry(34, 6.2, 1.6);
    bw.translate(sh.x, baseY + 3.1, sh.z - 11.2);
    stuccoParts.push(bw);
    for (const sx of [-15.8, 15.8]) {
        const wing = new THREE.BoxGeometry(2.4, 6.2, 14);
        wing.translate(sh.x + sx, baseY + 3.1, sh.z - 4.2);
        stuccoParts.push(wing);
    }
    const stuccoMesh = mergeStaticParts(stuccoParts, stuccoMat, true, true, true);
    if (stuccoMesh) group.add(stuccoMesh);

    const darkParts = [];
    const roof = new THREE.BoxGeometry(36, 0.7, 13.5);
    roof.translate(sh.x, baseY + 6.4, sh.z - 5.2);
    darkParts.push(roof);

    const glassParts = [];
    for (const side of [-10.5, 10.5]) {
        const rail = new THREE.BoxGeometry(11.6, 1.15, 0.1);
        rail.translate(sh.x + side, baseY + 0.62, sh.z + 10.8);
        glassParts.push(rail);
        const cap = new THREE.CylinderGeometry(0.045, 0.045, 11.7, 6);
        cap.rotateZ(Math.PI * 0.5);
        cap.translate(sh.x + side, baseY + 1.22, sh.z + 10.8);
        darkParts.push(cap);
    }
    const darkMesh = mergeStaticParts(darkParts, darkMat, true, false, false);
    if (darkMesh) group.add(darkMesh);
    const glassMesh = mergeStaticParts(glassParts, glassMat, false, false, false);
    if (glassMesh) group.add(glassMesh);

    const sconceParts = [];
    for (const sx of [-15.8, 15.8]) {
        const s = new THREE.CylinderGeometry(0.18, 0.18, 0.72, 8);
        s.translate(sh.x + sx - Math.sign(sx) * 1.32, baseY + 3.2, sh.z - 1.5);
        sconceParts.push(s);
    }
    const sconceMesh = mergeStaticParts(sconceParts, sconceMat, false, false, false);
    if (sconceMesh) group.add(sconceMesh);

    const art = new THREE.Mesh(
        new THREE.PlaneGeometry(7.2, 4.4),
        new THREE.MeshStandardMaterial({ map: textures.safehouseArt, roughness: 0.35 })
    );
    art.position.set(sh.x, baseY + 3.1, sh.z - 10.32);
    group.add(art);
}

function buildMazeBankTower(group, mt, glassMat, concreteMat) {
    const concParts = [];
    const podium = new THREE.CylinderGeometry(mt.radius * 1.52, mt.radius * 1.62, 12, 28);
    podium.translate(mt.x, mt.y + 6, mt.z);
    concParts.push(podium);

    for (let i = 0; i < 12; i += 1) {
        const a = (i / 12) * Math.PI * 2;
        const fin = new THREE.BoxGeometry(0.9, mt.height - 16, 1.8);
        fin.rotateY(-a);
        fin.translate(
            mt.x + Math.cos(a) * (mt.radius * 0.98),
            mt.y + 12 + (mt.height - 18) * 0.5,
            mt.z + Math.sin(a) * (mt.radius * 0.98)
        );
        concParts.push(fin);
    }
    const crown = new THREE.CylinderGeometry(mt.radius * 1.02, mt.radius * 0.92, 12, 28);
    crown.translate(mt.x, mt.y + mt.height - 5, mt.z);
    concParts.push(crown);
    const concMesh = mergeStaticParts(concParts, concreteMat, true, true, true);
    if (concMesh) group.add(concMesh);

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(mt.radius * 0.92, mt.radius * 1.08, mt.height - 18, 28), glassMat);
    shaft.position.set(mt.x, mt.y + 12 + (mt.height - 18) * 0.5, mt.z);
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    group.add(shaft);

    const beaconMat = new THREE.MeshStandardMaterial({
        color: 0xff3b30,
        emissive: 0xff2d20,
        emissiveIntensity: 2.1
    });
    const beacon = new THREE.Mesh(new THREE.TorusGeometry(mt.radius * 0.72, 0.42, 8, 24), beaconMat);
    beacon.rotation.x = Math.PI * 0.5;
    beacon.position.set(mt.x, mt.y + mt.height + 1.4, mt.z);
    group.add(beacon);
}

function buildConstructionSite(group, cs, concreteWallMat) {
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x3b4452, metalness: 0.78, roughness: 0.36 });
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xd99b16, metalness: 0.42, roughness: 0.44 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5, metalness: 0.2 });

    const concParts = [];
    const railParts = [];
    for (let f = 0; f < cs.floors; f += 1) {
        const fy = cs.y + 0.5 + f * 5.2;
        const slab = new THREE.BoxGeometry(22, 0.72, 30);
        slab.translate(cs.x - 10, fy, cs.z);
        concParts.push(slab);

        const rail = new THREE.CylinderGeometry(0.06, 0.06, 22, 5);
        rail.rotateZ(Math.PI * 0.5);
        rail.translate(cs.x - 10, fy + 1.15, cs.z + 14.8);
        railParts.push(rail);
    }

    const barrierBase = buildJerseyBarrierGeometry();
    for (let i = 0; i < 6; i += 1) {
        const b = barrierBase.clone();
        b.translate(cs.x - 18 + i * 3.4, cs.y, cs.z + 18.2);
        concParts.push(b);
    }
    barrierBase.dispose();

    const concMesh = mergeStaticParts(concParts, concreteWallMat, true, true, true);
    if (concMesh) group.add(concMesh);
    const railMesh = mergeStaticParts(railParts, railMat, false, false, false);
    if (railMesh) group.add(railMesh);

    const colParts = [];
    for (const px of [-20, -10, 0]) {
        for (const pz of [-14, 0, 14]) {
            const col = new THREE.CylinderGeometry(0.44, 0.44, cs.floors * 5.2, 8);
            col.translate(cs.x + px, cs.y + cs.floors * 2.6, cs.z + pz);
            colParts.push(col);
        }
    }
    const colMesh = mergeStaticParts(colParts, steelMat, true, false, false);
    if (colMesh) group.add(colMesh);

    const mastGeo = buildLatticeTrussSection(2.4, cs.craneHeight, 22, 0.11);
    const mast = new THREE.Mesh(mastGeo, yellowMat);
    mast.position.set(cs.x + 12, cs.y, cs.z - 6);
    mast.castShadow = true;
    group.add(mast);

    const jibPivot = new THREE.Group();
    jibPivot.position.set(cs.x + 12, cs.y + cs.craneHeight - 1.5, cs.z - 6);
    const jibGeo = buildLatticeTrussSection(1.9, 46, 18, 0.09);
    jibGeo.rotateZ(Math.PI * 0.5);
    const jib = new THREE.Mesh(jibGeo, yellowMat);
    jib.position.set(14, 0, 0);
    jib.castShadow = true;
    jibPivot.add(jib);

    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.4, 2.2), concreteWallMat);
    cab.position.set(1.6, -1.6, 1.6);
    jibPivot.add(cab);

    const weight = new THREE.Mesh(new THREE.BoxGeometry(5.2, 3.0, 2.8), concreteWallMat);
    weight.position.set(11.5, 0.2, 0);
    jibPivot.add(weight);

    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 24, 5), steelMat);
    cable.position.set(-18, -12, 0);
    jibPivot.add(cable);
    group.add(jibPivot);

    return jibPivot;
}

function buildVinewoodSign(group) {
    const signMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.45,
        emissive: 0x334155,
        emissiveIntensity: 0.28
    });
    const baseZ = -352;
    const widths = [7, 3, 7, 6, 8, 7, 7, 7];
    let cursorX = -46;
    const parts = [];
    for (let i = 0; i < widths.length; i += 1) {
        const w = widths[i];
        const x = cursorX + w * 0.5;
        const y = heightAt(x, baseZ);
        const letter = new THREE.BoxGeometry(w, 12, 1.2);
        letter.translate(x, y + 6.5, baseZ);
        parts.push(letter);
        cursorX += w + 4.2;
    }
    const mesh = mergeStaticParts(parts, signMat, false, false, false);
    if (mesh) group.add(mesh);
}

function buildBlimp(group) {
    const blimp = new THREE.Group();
    const hullMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.36, metalness: 0.22 });
    const stripeMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        emissive: 0x60a5fa,
        emissiveIntensity: 0.35,
        roughness: 0.32
    });
    const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), hullMat);
    hull.scale.set(11, 8.5, 28);
    blimp.add(hull);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(8.9, 8.9, 10, 20), stripeMat);
    band.rotation.x = Math.PI * 0.5;
    blimp.add(band);
    blimp.position.set(-80, 148, -60);
    group.add(blimp);
    return blimp;
}

function makePbrMat(pbrSet, fallbackColor, roughness = 0.78, metalness = 0.06, normalStrength = 0.9) {
    return new THREE.MeshStandardMaterial({
        color: fallbackColor,
        map: pbrSet ? pbrSet.map : null,
        normalMap: pbrSet ? pbrSet.normalMap : null,
        normalScale: new THREE.Vector2(normalStrength, normalStrength),
        roughnessMap: pbrSet ? pbrSet.roughnessMap : null,
        roughness,
        metalness
    });
}

export function createCityScene(scene, cityData, textures, assets = null) {
    const root = new THREE.Group();
    scene.add(root);

    const pbr = assets && assets.pbr ? assets.pbr : {};
    root.add(buildTerrainMesh(pbr.sand));

    const roadBuilt = createWetRoadMaterial(pbr.asphalt, textures.fallbackAsphalt, false);
    const interBuilt = createWetRoadMaterial(pbr.asphalt, textures.fallbackAsphalt, true);
    const roadMat = roadBuilt.material;
    const interMat = interBuilt.material;

    const sidewalkMat = makePbrMat(pbr.sidewalk, 0xc7c3ba, 0.85, 0.04, 0.85);
    const curbMat = new THREE.MeshStandardMaterial({ color: 0xa6a39c, roughness: 0.82, metalness: 0.05 });

    const roadBuckets = Array.from({ length: SECTOR_COUNT }, () => []);
    const walkBuckets = Array.from({ length: SECTOR_COUNT }, () => []);
    const curbBuckets = Array.from({ length: SECTOR_COUNT }, () => []);

    for (const rz of Z_ROADS) {
        addSegmentedRoad(roadBuckets, -278, rz, 278, rz, ROAD_HALF_WIDTH * 2, 24, 0.032);
        addSegmentedRoad(walkBuckets, -278, rz - 10.6, 278, rz - 10.6, 4.4, 18, 0.068);
        addSegmentedRoad(walkBuckets, -278, rz + 10.6, 278, rz + 10.6, 4.4, 18, 0.068);
        addSegmentedRoad(curbBuckets, -278, rz - 8.45, 278, rz - 8.45, 0.34, 15, 0.076);
        addSegmentedRoad(curbBuckets, -278, rz + 8.45, 278, rz + 8.45, 0.34, 15, 0.076);
    }
    for (const rx of X_ROADS) {
        addSegmentedRoad(roadBuckets, rx, -278, rx, 278, ROAD_HALF_WIDTH * 2, 24, 0.024);
        addSegmentedRoad(walkBuckets, rx - 10.6, -278, rx - 10.6, 278, 4.4, 18, 0.062);
        addSegmentedRoad(walkBuckets, rx + 10.6, -278, rx + 10.6, 278, 4.4, 18, 0.062);
    }
    const driveSec = computeSectorIndex(0, -285, SECTOR_GRID, WORLD_HALF);
    roadBuckets[driveSec].push(buildRoadRibbonGeometry(0, -300, 0, -270, 16, 12, 0.045));

    for (let s = 0; s < SECTOR_COUNT; s += 1) {
        const rm = mergeStaticParts(roadBuckets[s], roadMat, false, true, true);
        if (rm) root.add(rm);
        const wm = mergeStaticParts(walkBuckets[s], sidewalkMat, false, true, true);
        if (wm) root.add(wm);
        const cm = mergeStaticParts(curbBuckets[s], curbMat, false, false, false);
        if (cm) root.add(cm);
    }

    const interGeo = new THREE.PlaneGeometry(ROAD_HALF_WIDTH * 2.08, ROAD_HALF_WIDTH * 2.08);
    interGeo.rotateX(-Math.PI * 0.5);
    const interInst = new THREE.InstancedMesh(interGeo, interMat, X_ROADS.length * Z_ROADS.length);
    interInst.receiveShadow = true;
    const dummy = new THREE.Object3D();
    let idx = 0;
    for (const rz of Z_ROADS) {
        for (const rx of X_ROADS) {
            dummy.position.set(rx, heightAt(rx, rz) + 0.046, rz);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            interInst.setMatrixAt(idx, dummy.matrix);
            idx += 1;
        }
    }
    interInst.instanceMatrix.needsUpdate = true;
    interInst.computeBoundingSphere();
    root.add(interInst);

    const concreteTileMat = makePbrMat(pbr.concreteTile, 0xc8ced6, 0.64, 0.12, 0.85);
    const stuccoMat = makePbrMat(pbr.stucco, 0xddd6ca, 0.78, 0.04, 0.8);
    const brickMat = makePbrMat(pbr.brick, 0xc4ae98, 0.86, 0.04, 0.9);
    const concreteWallMat = makePbrMat(pbr.concreteWall, 0xb2b7be, 0.84, 0.06, 0.85);
    const awningMat = new THREE.MeshStandardMaterial({ color: 0xb92c25, roughness: 0.62, metalness: 0.08 });

    const facadeGlassMat = new THREE.MeshStandardMaterial({
        color: 0x82a7c2,
        map: textures.glassInterior.map,
        emissiveMap: textures.glassInterior.emissiveMap,
        emissive: new THREE.Color(0xfff1d6),
        emissiveIntensity: 0.06,
        metalness: 0.62,
        roughness: 0.18,
        envMapIntensity: 0.82
    });

    const archetypes = buildArchitecturalArchetypes();
    const structMatByStyle = {
        glassTower: concreteTileMat,
        officeLight: stuccoMat,
        commercial: brickMat,
        apartment: stuccoMat,
        diner: stuccoMat
    };

    const sectorBuildings = Array.from({ length: SECTOR_COUNT }, () => ({
        glassTower: [],
        officeLight: [],
        commercial: [],
        diner: [],
        apartment: []
    }));
    for (const b of cityData.buildings) {
        const s = computeSectorIndex(b.x, b.z, SECTOR_GRID, WORLD_HALF);
        (sectorBuildings[s][b.style] || sectorBuildings[s].commercial).push(b);
    }

    const col = new THREE.Color();
    for (let s = 0; s < SECTOR_COUNT; s += 1) {
        for (const [style, list] of Object.entries(sectorBuildings[s])) {
            if (list.length === 0) continue;
            const arch = archetypes[style] || archetypes.commercial;
            const sInst = new THREE.InstancedMesh(arch.struct, structMatByStyle[style], list.length);
            const gInst = new THREE.InstancedMesh(arch.glass, facadeGlassMat, list.length);
            const tInst = arch.trim ? new THREE.InstancedMesh(arch.trim, awningMat, list.length) : null;
            sInst.castShadow = true;
            sInst.receiveShadow = true;
            gInst.castShadow = false;
            gInst.receiveShadow = false;
            if (tInst) tInst.castShadow = false;

            for (let i = 0; i < list.length; i += 1) {
                const b = list[i];
                dummy.position.set(b.x, b.y + b.h * 0.5, b.z);
                dummy.rotation.set(0, 0, 0);
                dummy.scale.set(b.w, b.h, b.d);
                dummy.updateMatrix();
                sInst.setMatrixAt(i, dummy.matrix);
                gInst.setMatrixAt(i, dummy.matrix);
                if (tInst) tInst.setMatrixAt(i, dummy.matrix);
                col.setHex(b.tint);
                sInst.setColorAt(i, col);
            }
            sInst.instanceMatrix.needsUpdate = true;
            gInst.instanceMatrix.needsUpdate = true;
            if (sInst.instanceColor) sInst.instanceColor.needsUpdate = true;
            sInst.computeBoundingSphere();
            gInst.computeBoundingSphere();
            root.add(sInst, gInst);
            if (tInst) {
                tInst.instanceMatrix.needsUpdate = true;
                tInst.computeBoundingSphere();
                root.add(tInst);
            }
        }
    }

    buildMazeBankTower(root, cityData.mazeTower, facadeGlassMat, concreteTileMat);
    const craneJib = buildConstructionSite(root, cityData.constructionSite, concreteWallMat);
    buildSafehouse(root, cityData.safehouse, textures, stuccoMat);
    buildVinewoodSign(root);
    const blimp = buildBlimp(root);

    const pierMat = new THREE.MeshStandardMaterial({ map: textures.deckPlanks, roughness: 0.72 });
    const pier = new THREE.Mesh(new THREE.BoxGeometry(14, 1.4, 72), pierMat);
    pier.position.set(0, 0.2, 322);
    pier.receiveShadow = true;
    root.add(pier);

    const oceanGeo = new THREE.PlaneGeometry(1400, 420);
    oceanGeo.rotateX(-Math.PI * 0.5);
    const oceanMat = new THREE.MeshStandardMaterial({
        color: 0x0b4c73,
        roughness: 0.18,
        metalness: 0.28,
        envMapIntensity: 0.8
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.position.set(0, OCEAN_LEVEL, 510);
    root.add(ocean);

    const { geometry: trunkGeo, tip: palmTip } = buildCurvedPalmTrunkGeometry();
    const trunkMat = makePbrMat(pbr.palmBark, 0x8a7058, 0.9, 0.02, 1.1);
    const { crown: frondGeo, collar: palmCollarGeo } = buildFeatheryPalmCrownGeometry();
    const frondMat = new THREE.MeshStandardMaterial({
        map: textures.palmFrond,
        alphaTest: 0.36,
        roughness: 0.68,
        metalness: 0.04,
        side: THREE.DoubleSide
    });

    const tipWorld = new THREE.Vector3();
    const palmSectors = Array.from({ length: SECTOR_COUNT }, () => []);
    for (const p of cityData.palms) {
        palmSectors[computeSectorIndex(p.x, p.z, SECTOR_GRID, WORLD_HALF)].push(p);
    }
    for (let s = 0; s < SECTOR_COUNT; s += 1) {
        const list = palmSectors[s];
        if (list.length === 0) continue;
        const pTrunks = new THREE.InstancedMesh(trunkGeo, trunkMat, list.length);
        const pCollars = new THREE.InstancedMesh(palmCollarGeo, trunkMat, list.length);
        const pCrowns = new THREE.InstancedMesh(frondGeo, frondMat, list.length);
        pTrunks.castShadow = true;
        pCollars.castShadow = false;
        pCrowns.castShadow = false;
        for (let i = 0; i < list.length; i += 1) {
            const p = list[i];
            dummy.position.set(p.x, p.y, p.z);
            dummy.rotation.set(p.lean * 0.6, p.yaw, 0, "YXZ");
            dummy.scale.set(1, p.height, 1);
            dummy.updateMatrix();
            pTrunks.setMatrixAt(i, dummy.matrix);

            tipWorld.copy(palmTip).applyMatrix4(dummy.matrix);
            dummy.position.copy(tipWorld);
            dummy.rotation.set(p.lean * 0.35, p.yaw, 0, "YXZ");
            dummy.scale.setScalar(1.0);
            dummy.updateMatrix();
            pCollars.setMatrixAt(i, dummy.matrix);

            dummy.scale.setScalar(1.06);
            dummy.updateMatrix();
            pCrowns.setMatrixAt(i, dummy.matrix);
        }
        pTrunks.instanceMatrix.needsUpdate = true;
        pCollars.instanceMatrix.needsUpdate = true;
        pCrowns.instanceMatrix.needsUpdate = true;
        pTrunks.computeBoundingSphere();
        pCollars.computeBoundingSphere();
        pCrowns.computeBoundingSphere();
        root.add(pTrunks, pCollars, pCrowns);
    }

    const blList = cityData.broadleafTrees || [];
    const blTree = buildBroadleafTreeGeometries();
    const blCanopyMat = new THREE.MeshStandardMaterial({
        map: textures.broadleaf,
        vertexColors: true,
        roughness: 0.78,
        metalness: 0.02
    });
    if (blList.length > 0) {
        const blTrunks = new THREE.InstancedMesh(blTree.trunk, trunkMat, blList.length);
        const blCanopies = new THREE.InstancedMesh(blTree.canopy, blCanopyMat, blList.length);
        blTrunks.castShadow = true;
        blCanopies.castShadow = true;
        blCanopies.receiveShadow = true;
        for (let i = 0; i < blList.length; i += 1) {
            const t = blList[i];
            dummy.position.set(t.x, t.y, t.z);
            dummy.rotation.set(0, t.yaw, 0);
            dummy.scale.setScalar(t.scale);
            dummy.updateMatrix();
            blTrunks.setMatrixAt(i, dummy.matrix);
            blCanopies.setMatrixAt(i, dummy.matrix);
        }
        blTrunks.instanceMatrix.needsUpdate = true;
        blCanopies.instanceMatrix.needsUpdate = true;
        blTrunks.computeBoundingSphere();
        blCanopies.computeBoundingSphere();
        root.add(blTrunks, blCanopies);
    }

    const lampGeos = buildStreetlampGeometries();
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x3b424d, metalness: 0.72, roughness: 0.36 });
    const bulbMat = new THREE.MeshStandardMaterial({
        color: 0xfff6dc,
        emissive: 0xffb84d,
        emissiveIntensity: 0.25,
        roughness: 0.2,
        toneMapped: false
    });
    const coneUniforms = {
        uColor: { value: new THREE.Color(0xffc66e) },
        uOpacity: { value: 0 }
    };
    const coneMat = new THREE.ShaderMaterial({
        uniforms: coneUniforms,
        vertexShader: `
varying vec2 vUv;
varying vec3 vViewNorm;
varying vec3 vViewPos;
void main() {
    vUv = uv;
    vec4 lp = vec4(position, 1.0);
    vec3 ln = normal;
    #ifdef USE_INSTANCING
        lp = instanceMatrix * lp;
        ln = mat3(instanceMatrix) * ln;
    #endif
    vec4 mvPos = modelViewMatrix * lp;
    vViewPos = -mvPos.xyz;
    vViewNorm = normalize(normalMatrix * ln);
    gl_Position = projectionMatrix * mvPos;
}`,
        fragmentShader: `
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vUv;
varying vec3 vViewNorm;
varying vec3 vViewPos;
void main() {
    float ndotv = abs(dot(normalize(vViewNorm), normalize(vViewPos)));
    float edgeFade = pow(clamp(ndotv, 0.0, 1.0), 2.35);
    float topSoft = smoothstep(1.0, 0.9, vUv.y);
    float vFalloff = pow(clamp(vUv.y, 0.0, 1.0), 2.05) * topSoft;
    float a = edgeFade * vFalloff * uOpacity;
    if (a < 0.003) discard;
    gl_FragColor = vec4(uColor * a, a);
}`,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.FrontSide
    });
    const poolMat = new THREE.MeshBasicMaterial({
        map: textures.lightPool,
        color: 0xffc066,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2
    });

    const lampConesList = [];
    const lampPoolsList = [];
    const lampLightsData = [];
    const lampSectors = Array.from({ length: SECTOR_COUNT }, () => []);
    for (const l of cityData.lamps) {
        lampSectors[computeSectorIndex(l.x, l.z, SECTOR_GRID, WORLD_HALF)].push(l);
        lampLightsData.push({
            x: l.x + Math.sin(l.yaw) * 2.26,
            y: l.y + 7.45,
            z: l.z + Math.cos(l.yaw) * 2.26
        });
    }
    for (let s = 0; s < SECTOR_COUNT; s += 1) {
        const list = lampSectors[s];
        if (list.length === 0) continue;
        const lampPoles = new THREE.InstancedMesh(lampGeos.pole, poleMat, list.length);
        const lampBulbs = new THREE.InstancedMesh(lampGeos.lens, bulbMat, list.length);
        const lampCones = new THREE.InstancedMesh(lampGeos.cone, coneMat, list.length);
        const lampPools = new THREE.InstancedMesh(lampGeos.pool, poolMat, list.length);
        lampCones.visible = false;
        lampPools.visible = false;
        for (let i = 0; i < list.length; i += 1) {
            const l = list[i];
            dummy.position.set(l.x, l.y, l.z);
            dummy.rotation.set(0, l.yaw, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            lampPoles.setMatrixAt(i, dummy.matrix);
            lampBulbs.setMatrixAt(i, dummy.matrix);
            lampCones.setMatrixAt(i, dummy.matrix);
            lampPools.setMatrixAt(i, dummy.matrix);
        }
        lampPoles.instanceMatrix.needsUpdate = true;
        lampBulbs.instanceMatrix.needsUpdate = true;
        lampCones.instanceMatrix.needsUpdate = true;
        lampPools.instanceMatrix.needsUpdate = true;
        lampPoles.computeBoundingSphere();
        lampBulbs.computeBoundingSphere();
        lampCones.computeBoundingSphere();
        lampPools.computeBoundingSphere();
        lampConesList.push(lampCones);
        lampPoolsList.push(lampPools);
        root.add(lampPoles, lampBulbs, lampCones, lampPools);
    }

    const streetPointLights = [];
    for (let i = 0; i < 3; i += 1) {
        const pl = new THREE.PointLight(0xffbc62, 0, 28, 1.45);
        pl.visible = false;
        root.add(pl);
        streetPointLights.push(pl);
    }

    const gantryPoleGeo = new THREE.CylinderGeometry(0.11, 0.16, 7.8, 8);
    const gantryArmGeo = new THREE.CylinderGeometry(0.085, 0.125, 9.6, 8);
    gantryArmGeo.rotateZ(Math.PI * 0.5);
    const sigGeos = buildTrafficSignalGeometries();
    const sigHousingMat = new THREE.MeshStandardMaterial({
        color: 0x1b2028,
        roughness: 0.52,
        metalness: 0.42,
        side: THREE.DoubleSide
    });
    const sigBackplateMat = new THREE.MeshStandardMaterial({
        color: 0x101419,
        roughness: 0.7,
        metalness: 0.18
    });
    const sigLensMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });

    const tlCount = cityData.trafficLights.length;
    const headCount = tlCount * 2;
    const signalPoles = new THREE.InstancedMesh(gantryPoleGeo, poleMat, tlCount);
    const signalArms = new THREE.InstancedMesh(gantryArmGeo, poleMat, tlCount);
    const sigHousings = new THREE.InstancedMesh(sigGeos.housing, sigHousingMat, headCount);
    const sigBackplates = new THREE.InstancedMesh(sigGeos.backplate, sigBackplateMat, headCount);
    const sigReds = new THREE.InstancedMesh(sigGeos.redLens, sigLensMat, headCount);
    const sigYellows = new THREE.InstancedMesh(sigGeos.yellowLens, sigLensMat, headCount);
    const sigGreens = new THREE.InstancedMesh(sigGeos.greenLens, sigLensMat, headCount);

    const headOffsets = [-3.6, -7.8];
    for (let i = 0; i < tlCount; i += 1) {
        const t = cityData.trafficLights[i];
        dummy.position.set(t.x, t.y + 3.9, t.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        signalPoles.setMatrixAt(i, dummy.matrix);

        dummy.position.set(t.x - 4.75, t.y + 7.28, t.z);
        dummy.updateMatrix();
        signalArms.setMatrixAt(i, dummy.matrix);

        for (let h = 0; h < 2; h += 1) {
            const hi = i * 2 + h;
            dummy.position.set(t.x + headOffsets[h], t.y + 6.32, t.z);
            dummy.updateMatrix();
            sigHousings.setMatrixAt(hi, dummy.matrix);
            sigBackplates.setMatrixAt(hi, dummy.matrix);
            sigReds.setMatrixAt(hi, dummy.matrix);
            sigYellows.setMatrixAt(hi, dummy.matrix);
            sigGreens.setMatrixAt(hi, dummy.matrix);
        }
    }
    for (const inst of [signalPoles, signalArms, sigHousings, sigBackplates, sigReds, sigYellows, sigGreens]) {
        inst.instanceMatrix.needsUpdate = true;
        inst.computeBoundingSphere();
    }
    root.add(signalPoles, signalArms, sigHousings, sigBackplates, sigReds, sigYellows, sigGreens);

    const bbMats = [
        new THREE.MeshStandardMaterial({ map: textures.billboardA, emissiveMap: textures.billboardA, emissive: 0xffffff, emissiveIntensity: 0.25 }),
        new THREE.MeshStandardMaterial({ map: textures.billboardB, emissiveMap: textures.billboardB, emissive: 0xffffff, emissiveIntensity: 0.25 })
    ];
    const bbParts = [[], []];
    for (const bb of cityData.billboards) {
        const g = new THREE.PlaneGeometry(bb.w, bb.h);
        g.rotateY(bb.yaw);
        g.translate(bb.x, bb.y, bb.z);
        bbParts[bb.variant].push(g);
    }
    for (let v = 0; v < 2; v += 1) {
        const bm = mergeStaticParts(bbParts[v], bbMats[v], false, false, true);
        if (bm) root.add(bm);
    }

    const rampMat = makePbrMat(pbr.concreteWall, 0xcbd2da, 0.72, 0.14, 0.8);
    const rampParts = [];
    const rampEuler = new THREE.Euler();
    const rampMat4 = new THREE.Matrix4();
    const rampQuat = new THREE.Quaternion();
    for (const r of cityData.ramps) {
        const g = new THREE.BoxGeometry(r.w, 0.36, r.l);
        rampEuler.set(-Math.atan2(r.h, r.l), r.yaw, 0, "YXZ");
        rampQuat.setFromEuler(rampEuler);
        rampMat4.compose(new THREE.Vector3(r.x, r.y + r.h * 0.5, r.z), rampQuat, new THREE.Vector3(1, 1, 1));
        g.applyMatrix4(rampMat4);
        rampParts.push(g);
    }
    const rampMesh = mergeStaticParts(rampParts, rampMat, true, true, true);
    if (rampMesh) root.add(rampMesh);

    const animatedRoots = new Set([craneJib, blimp, ...streetPointLights]);
    root.traverse((obj) => {
        if (obj === root || animatedRoots.has(obj)) return;
        let cur = obj.parent;
        while (cur) {
            if (animatedRoots.has(cur)) return;
            cur = cur.parent;
        }
        obj.matrixAutoUpdate = false;
        obj.updateMatrix();
    });

    const redOn = new THREE.Color().setRGB(1.85, 0.16, 0.12);
    const redOff = new THREE.Color(0x240909);
    const yellowOn = new THREE.Color().setRGB(1.85, 1.15, 0.1);
    const yellowOff = new THREE.Color(0x261c07);
    const greenOn = new THREE.Color().setRGB(0.14, 1.75, 0.45);
    const greenOff = new THREE.Color(0x072012);
    const nearestIdx = [-1, -1, -1];
    const nearestD2 = [Infinity, Infinity, Infinity];
    let lastSignalBucket = -1;
    let lastLightBucket = -1;

    const updateEnvironment = (timeSec, nightFactor, wetness, sunsetFactor = 0, focusPos = null) => {
        roadBuilt.wetnessUniform.value = wetness;
        interBuilt.wetnessUniform.value = wetness;
        const lampPower = Math.max(sunsetFactor * 0.92, nightFactor);
        facadeGlassMat.emissiveIntensity = 0.04 + lampPower * 0.65;
        bulbMat.emissiveIntensity = 0.18 + lampPower * 3.8;
        bulbMat.color.setHex(lampPower > 0.1 ? 0xfff8e2 : 0xcbd2da);

        const showGlow = lampPower > 0.05;
        coneUniforms.uOpacity.value = lampPower * 0.28;
        poolMat.opacity = lampPower * 0.48;
        for (let i = 0; i < lampConesList.length; i += 1) {
            lampConesList[i].visible = showGlow;
            lampPoolsList[i].visible = showGlow;
        }

        const lightBucket = Math.floor(timeSec * 4);
        if (!showGlow || !focusPos) {
            for (let i = 0; i < streetPointLights.length; i += 1) {
                streetPointLights[i].visible = false;
                streetPointLights[i].intensity = 0;
            }
        } else if (lightBucket !== lastLightBucket) {
            lastLightBucket = lightBucket;
            nearestIdx[0] = -1;
            nearestIdx[1] = -1;
            nearestIdx[2] = -1;
            nearestD2[0] = Infinity;
            nearestD2[1] = Infinity;
            nearestD2[2] = Infinity;
            for (let i = 0; i < lampLightsData.length; i += 1) {
                const ld = lampLightsData[i];
                const dx = ld.x - focusPos.x;
                const dz = ld.z - focusPos.z;
                const d2 = dx * dx + dz * dz;
                if (d2 < nearestD2[0]) {
                    nearestD2[2] = nearestD2[1];
                    nearestIdx[2] = nearestIdx[1];
                    nearestD2[1] = nearestD2[0];
                    nearestIdx[1] = nearestIdx[0];
                    nearestD2[0] = d2;
                    nearestIdx[0] = i;
                } else if (d2 < nearestD2[1]) {
                    nearestD2[2] = nearestD2[1];
                    nearestIdx[2] = nearestIdx[1];
                    nearestD2[1] = d2;
                    nearestIdx[1] = i;
                } else if (d2 < nearestD2[2]) {
                    nearestD2[2] = d2;
                    nearestIdx[2] = i;
                }
            }
            for (let k = 0; k < streetPointLights.length; k += 1) {
                const idxL = nearestIdx[k];
                const pl = streetPointLights[k];
                if (idxL >= 0 && nearestD2[k] < 65 * 65) {
                    const ld = lampLightsData[idxL];
                    pl.position.set(ld.x, ld.y, ld.z);
                    pl.intensity = lampPower * 24;
                    pl.visible = true;
                } else {
                    pl.visible = false;
                    pl.intensity = 0;
                }
            }
        }

        craneJib.rotation.y = Math.sin(timeSec * 0.08) * 0.55;
        blimp.position.x = Math.cos(timeSec * 0.025) * 190;
        blimp.position.z = -50 + Math.sin(timeSec * 0.025) * 160;
        blimp.rotation.y = -timeSec * 0.025;

        const sigBucket = Math.floor(timeSec * 2);
        if (sigBucket !== lastSignalBucket) {
            lastSignalBucket = sigBucket;
            for (let i = 0; i < tlCount; i += 1) {
                const tl = cityData.trafficLights[i];
                const st = getSignalState(tl.ix, tl.iz, timeSec);
                const isGreen = st === "ns_green";
                const isYellow = st === "ns_yellow" || st === "ew_yellow";
                const isRed = !isGreen && !isYellow;
                for (let h = 0; h < 2; h += 1) {
                    const hi = i * 2 + h;
                    sigReds.setColorAt(hi, isRed ? redOn : redOff);
                    sigYellows.setColorAt(hi, isYellow ? yellowOn : yellowOff);
                    sigGreens.setColorAt(hi, isGreen ? greenOn : greenOff);
                }
            }
            if (sigReds.instanceColor) sigReds.instanceColor.needsUpdate = true;
            if (sigYellows.instanceColor) sigYellows.instanceColor.needsUpdate = true;
            if (sigGreens.instanceColor) sigGreens.instanceColor.needsUpdate = true;
        }
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
