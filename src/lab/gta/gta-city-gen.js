import * as THREE from "three";
import {
    buildArchitecturalArchetypes,
    buildBroadleafTreeGeometries,
    buildCurvedPalmTrunkGeometry,
    buildFeatheryPalmCrownGeometry,
    buildJerseyBarrierGeometry,
    buildLatticeTrussSection
} from "./gta-building-meshes.js";
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
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    return mesh;
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
    const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xaad6f0,
        metalness: 0.1,
        roughness: 0.06,
        transparent: true,
        opacity: 0.34,
        clearcoat: 1.0
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

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(34, 6.2, 1.6), stuccoMat);
    backWall.position.set(sh.x, baseY + 3.1, sh.z - 11.2);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    group.add(backWall);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(36, 0.7, 13.5), darkMat);
    roof.position.set(sh.x, baseY + 6.4, sh.z - 5.2);
    roof.castShadow = true;
    group.add(roof);

    for (const sx of [-15.8, 15.8]) {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(2.4, 6.2, 14), stuccoMat);
        wing.position.set(sh.x + sx, baseY + 3.1, sh.z - 4.2);
        wing.castShadow = true;
        wing.receiveShadow = true;
        group.add(wing);

        const sconce = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.72, 10), sconceMat);
        sconce.position.set(sh.x + sx - Math.sign(sx) * 1.32, baseY + 3.2, sh.z - 1.5);
        group.add(sconce);
    }

    const art = new THREE.Mesh(
        new THREE.PlaneGeometry(7.2, 4.4),
        new THREE.MeshStandardMaterial({ map: textures.safehouseArt, roughness: 0.35 })
    );
    art.position.set(sh.x, baseY + 3.1, sh.z - 10.32);
    group.add(art);

    for (const side of [-10.5, 10.5]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(11.6, 1.15, 0.1), glassMat);
        rail.position.set(sh.x + side, baseY + 0.62, sh.z + 10.8);
        group.add(rail);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 11.7, 8), darkMat);
        cap.rotation.z = Math.PI * 0.5;
        cap.position.set(sh.x + side, baseY + 1.22, sh.z + 10.8);
        group.add(cap);
    }
}

function buildMazeBankTower(group, mt, glassMat, concreteMat) {
    const podium = new THREE.Mesh(new THREE.CylinderGeometry(mt.radius * 1.52, mt.radius * 1.62, 12, 32), concreteMat);
    podium.position.set(mt.x, mt.y + 6, mt.z);
    podium.castShadow = true;
    podium.receiveShadow = true;
    group.add(podium);

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(mt.radius * 0.92, mt.radius * 1.08, mt.height - 18, 32), glassMat);
    shaft.position.set(mt.x, mt.y + 12 + (mt.height - 18) * 0.5, mt.z);
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    group.add(shaft);

    for (let i = 0; i < 12; i += 1) {
        const a = (i / 12) * Math.PI * 2;
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.9, mt.height - 16, 1.8), concreteMat);
        fin.position.set(mt.x + Math.cos(a) * (mt.radius * 0.98), mt.y + 12 + (mt.height - 18) * 0.5, mt.z + Math.sin(a) * (mt.radius * 0.98));
        fin.rotation.y = -a;
        fin.castShadow = true;
        group.add(fin);
    }

    const crown = new THREE.Mesh(new THREE.CylinderGeometry(mt.radius * 1.02, mt.radius * 0.92, 12, 32), concreteMat);
    crown.position.set(mt.x, mt.y + mt.height - 5, mt.z);
    crown.castShadow = true;
    group.add(crown);

    const beaconMat = new THREE.MeshStandardMaterial({
        color: 0xff3b30,
        emissive: 0xff2d20,
        emissiveIntensity: 3.2
    });
    const beacon = new THREE.Mesh(new THREE.TorusGeometry(mt.radius * 0.72, 0.42, 8, 32), beaconMat);
    beacon.rotation.x = Math.PI * 0.5;
    beacon.position.set(mt.x, mt.y + mt.height + 1.4, mt.z);
    group.add(beacon);
}

function buildConstructionSite(group, cs, concreteWallMat) {
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x3b4452, metalness: 0.78, roughness: 0.36 });
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xd99b16, metalness: 0.42, roughness: 0.44 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5, metalness: 0.2 });

    for (let f = 0; f < cs.floors; f += 1) {
        const fy = cs.y + 0.5 + f * 5.2;
        const slab = new THREE.Mesh(new THREE.BoxGeometry(22, 0.72, 30), concreteWallMat);
        slab.position.set(cs.x - 10, fy, cs.z);
        slab.castShadow = true;
        slab.receiveShadow = true;
        group.add(slab);

        const railFront = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 22, 6), railMat);
        railFront.rotation.z = Math.PI * 0.5;
        railFront.position.set(cs.x - 10, fy + 1.15, cs.z + 14.8);
        group.add(railFront);
    }

    for (const px of [-20, -10, 0]) {
        for (const pz of [-14, 0, 14]) {
            const col = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, cs.floors * 5.2, 8), steelMat);
            col.position.set(cs.x + px, cs.y + cs.floors * 2.6, cs.z + pz);
            col.castShadow = true;
            group.add(col);
        }
    }

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

    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 24, 6), steelMat);
    cable.position.set(-18, -12, 0);
    jibPivot.add(cable);
    group.add(jibPivot);

    const barrierGeo = buildJerseyBarrierGeometry();
    for (let i = 0; i < 6; i += 1) {
        const b = new THREE.Mesh(barrierGeo, concreteWallMat);
        b.position.set(cs.x - 18 + i * 3.4, cs.y, cs.z + 18.2);
        b.castShadow = true;
        b.receiveShadow = true;
        group.add(b);
    }

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
    for (let i = 0; i < widths.length; i += 1) {
        const w = widths[i];
        const x = cursorX + w * 0.5;
        const y = heightAt(x, baseZ);
        const letter = new THREE.Mesh(new THREE.BoxGeometry(w, 12, 1.2), signMat);
        letter.position.set(x, y + 6.5, baseZ);
        letter.castShadow = true;
        group.add(letter);
        cursorX += w + 4.2;
    }
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
    const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), hullMat);
    hull.scale.set(11, 8.5, 28);
    blimp.add(hull);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(8.9, 8.9, 10, 24), stripeMat);
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

    for (const rz of Z_ROADS) {
        root.add(buildRoadRibbon(-278, rz, 278, rz, ROAD_HALF_WIDTH * 2, 24, 0.09, roadMat));
        root.add(buildRoadRibbon(-278, rz - 10.6, 278, rz - 10.6, 4.4, 20, 0.22, sidewalkMat));
        root.add(buildRoadRibbon(-278, rz + 10.6, 278, rz + 10.6, 4.4, 20, 0.22, sidewalkMat));
        root.add(buildRoadRibbon(-278, rz - 8.45, 278, rz - 8.45, 0.34, 20, 0.23, curbMat));
        root.add(buildRoadRibbon(-278, rz + 8.45, 278, rz + 8.45, 0.34, 20, 0.23, curbMat));
    }
    for (const rx of X_ROADS) {
        root.add(buildRoadRibbon(rx, -278, rx, 278, ROAD_HALF_WIDTH * 2, 24, 0.075, roadMat));
        root.add(buildRoadRibbon(rx - 10.6, -278, rx - 10.6, 278, 4.4, 20, 0.2, sidewalkMat));
        root.add(buildRoadRibbon(rx + 10.6, -278, rx + 10.6, 278, 4.4, 20, 0.2, sidewalkMat));
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

    const concreteTileMat = makePbrMat(pbr.concreteTile, 0xd8dce2, 0.58, 0.16, 0.95);
    const stuccoMat = makePbrMat(pbr.stucco, 0xeee9df, 0.72, 0.05, 0.85);
    const brickMat = makePbrMat(pbr.brick, 0xc9b49e, 0.84, 0.04, 1.0);
    const concreteWallMat = makePbrMat(pbr.concreteWall, 0xbabec4, 0.82, 0.08, 0.9);
    const awningMat = new THREE.MeshStandardMaterial({ color: 0xb92c25, roughness: 0.58, metalness: 0.1 });

    const facadeGlassMat = new THREE.MeshPhysicalMaterial({
        color: 0x9fc4dc,
        map: textures.glassInterior.map,
        emissiveMap: textures.glassInterior.emissiveMap,
        emissive: new THREE.Color(0xfff1d6),
        emissiveIntensity: 0.08,
        metalness: 0.72,
        roughness: 0.08,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        envMapIntensity: 1.85
    });

    const archetypes = buildArchitecturalArchetypes();
    const structMatByStyle = {
        glassTower: concreteTileMat,
        officeLight: stuccoMat,
        commercial: brickMat,
        apartment: stuccoMat,
        diner: stuccoMat
    };

    const grouped = { glassTower: [], officeLight: [], commercial: [], diner: [], apartment: [] };
    for (const b of cityData.buildings) {
        (grouped[b.style] || grouped.commercial).push(b);
    }

    const col = new THREE.Color();
    for (const [style, list] of Object.entries(grouped)) {
        if (list.length === 0) continue;
        const arch = archetypes[style] || archetypes.commercial;
        const sInst = new THREE.InstancedMesh(arch.struct, structMatByStyle[style], list.length);
        const gInst = new THREE.InstancedMesh(arch.glass, facadeGlassMat, list.length);
        const tInst = arch.trim ? new THREE.InstancedMesh(arch.trim, awningMat, list.length) : null;
        sInst.castShadow = true;
        sInst.receiveShadow = true;
        gInst.receiveShadow = true;
        if (tInst) tInst.castShadow = true;

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
        root.add(sInst, gInst);
        if (tInst) {
            tInst.instanceMatrix.needsUpdate = true;
            root.add(tInst);
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
    pier.castShadow = true;
    pier.receiveShadow = true;
    root.add(pier);

    const oceanGeo = new THREE.PlaneGeometry(1400, 420);
    oceanGeo.rotateX(-Math.PI * 0.5);
    const oceanMat = new THREE.MeshPhysicalMaterial({
        color: 0x0b4c73,
        roughness: 0.08,
        metalness: 0.28,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        envMapIntensity: 1.75
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.position.set(0, OCEAN_LEVEL, 510);
    root.add(ocean);

    const trunkGeo = buildCurvedPalmTrunkGeometry();
    const trunkMat = makePbrMat(pbr.palmBark, 0x8a7058, 0.9, 0.02, 1.1);
    const frondGeo = buildFeatheryPalmCrownGeometry();
    const frondMat = new THREE.MeshStandardMaterial({
        map: textures.palmFrond,
        alphaTest: 0.36,
        roughness: 0.68,
        metalness: 0.04,
        side: THREE.DoubleSide
    });
    const palmTrunks = new THREE.InstancedMesh(trunkGeo, trunkMat, cityData.palms.length);
    const palmCrowns = new THREE.InstancedMesh(frondGeo, frondMat, cityData.palms.length);
    palmTrunks.castShadow = true;
    palmCrowns.castShadow = true;
    for (let i = 0; i < cityData.palms.length; i += 1) {
        const p = cityData.palms[i];
        dummy.position.set(p.x, p.y, p.z);
        dummy.rotation.set(p.lean * 0.6, p.yaw, 0);
        dummy.scale.set(1, p.height, 1);
        dummy.updateMatrix();
        palmTrunks.setMatrixAt(i, dummy.matrix);

        const tipOffX = Math.cos(p.yaw) * 0.18 + Math.sin(p.yaw) * (0.07 + p.lean * 0.6 * p.height);
        const tipOffZ = -Math.sin(p.yaw) * 0.18 + Math.cos(p.yaw) * (0.07 + p.lean * 0.6 * p.height);
        dummy.position.set(p.x + tipOffX, p.y + p.height - 0.2, p.z + tipOffZ);
        dummy.rotation.set(0, p.yaw, 0);
        dummy.scale.setScalar(1.08);
        dummy.updateMatrix();
        palmCrowns.setMatrixAt(i, dummy.matrix);
    }
    palmTrunks.instanceMatrix.needsUpdate = true;
    palmCrowns.instanceMatrix.needsUpdate = true;
    root.add(palmTrunks, palmCrowns);

    const treeSpots = [
        [-14, -224], [14, -148], [-14, -52], [14, 38], [-14, 128],
        [76, -135], [-76, -45], [76, 45], [-76, 135], [14, -210],
        [-104, -135], [104, -45], [-104, 45], [104, 135]
    ];
    const blTree = buildBroadleafTreeGeometries();
    const blCanopyMat = new THREE.MeshStandardMaterial({
        map: textures.broadleaf,
        alphaTest: 0.35,
        roughness: 0.78,
        metalness: 0.02,
        side: THREE.DoubleSide
    });
    const blTrunks = new THREE.InstancedMesh(blTree.trunk, trunkMat, treeSpots.length);
    const blCanopies = new THREE.InstancedMesh(blTree.canopy, blCanopyMat, treeSpots.length);
    blTrunks.castShadow = true;
    blCanopies.castShadow = true;
    for (let i = 0; i < treeSpots.length; i += 1) {
        const [tx, tz] = treeSpots[i];
        const sc = 1.05 + (i % 3) * 0.18;
        dummy.position.set(tx, heightAt(tx, tz), tz);
        dummy.rotation.set(0, i * 1.4, 0);
        dummy.scale.setScalar(sc);
        dummy.updateMatrix();
        blTrunks.setMatrixAt(i, dummy.matrix);
        blCanopies.setMatrixAt(i, dummy.matrix);
    }
    blTrunks.instanceMatrix.needsUpdate = true;
    blCanopies.instanceMatrix.needsUpdate = true;
    root.add(blTrunks, blCanopies);

    const poleGeo = new THREE.CylinderGeometry(0.1, 0.15, 7.8, 8);
    const armGeo = new THREE.CylinderGeometry(0.06, 0.08, 2.2, 6);
    armGeo.rotateX(Math.PI * 0.5);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x4b535e, metalness: 0.72, roughness: 0.36 });
    const bulbGeo = new THREE.CapsuleGeometry(0.16, 0.56, 4, 8);
    bulbGeo.rotateX(Math.PI * 0.5);
    const bulbMat = new THREE.MeshStandardMaterial({
        color: 0xfff4d6,
        emissive: 0xffc66e,
        emissiveIntensity: 0.45
    });
    const lampPoles = new THREE.InstancedMesh(poleGeo, poleMat, cityData.lamps.length);
    const lampArms = new THREE.InstancedMesh(armGeo, poleMat, cityData.lamps.length);
    const lampBulbs = new THREE.InstancedMesh(bulbGeo, bulbMat, cityData.lamps.length);
    for (let i = 0; i < cityData.lamps.length; i += 1) {
        const l = cityData.lamps[i];
        dummy.position.set(l.x, l.y + 3.9, l.z);
        dummy.rotation.set(0, l.yaw, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        lampPoles.setMatrixAt(i, dummy.matrix);

        dummy.position.set(l.x + Math.sin(l.yaw) * 1.0, l.y + 7.75, l.z + Math.cos(l.yaw) * 1.0);
        dummy.updateMatrix();
        lampArms.setMatrixAt(i, dummy.matrix);

        dummy.position.set(l.x + Math.sin(l.yaw) * 1.9, l.y + 7.62, l.z + Math.cos(l.yaw) * 1.9);
        dummy.updateMatrix();
        lampBulbs.setMatrixAt(i, dummy.matrix);
    }
    lampPoles.instanceMatrix.needsUpdate = true;
    lampArms.instanceMatrix.needsUpdate = true;
    lampBulbs.instanceMatrix.needsUpdate = true;
    root.add(lampPoles, lampArms, lampBulbs);

    const gantryArmGeo = new THREE.CylinderGeometry(0.09, 0.13, 9.6, 8);
    gantryArmGeo.rotateZ(Math.PI * 0.5);
    const signalHeadGeo = new THREE.BoxGeometry(0.42, 1.15, 0.38);
    const signalMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 1.7 });
    const signalPoles = new THREE.InstancedMesh(poleGeo, poleMat, cityData.trafficLights.length);
    const signalArms = new THREE.InstancedMesh(gantryArmGeo, poleMat, cityData.trafficLights.length);
    const signalHeads = new THREE.InstancedMesh(signalHeadGeo, signalMat, cityData.trafficLights.length);
    for (let i = 0; i < cityData.trafficLights.length; i += 1) {
        const t = cityData.trafficLights[i];
        dummy.position.set(t.x, t.y + 3.9, t.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        signalPoles.setMatrixAt(i, dummy.matrix);

        dummy.position.set(t.x - 4.6, t.y + 7.1, t.z);
        dummy.updateMatrix();
        signalArms.setMatrixAt(i, dummy.matrix);

        dummy.position.set(t.x - 6.2, t.y + 6.45, t.z);
        dummy.updateMatrix();
        signalHeads.setMatrixAt(i, dummy.matrix);
    }
    signalPoles.instanceMatrix.needsUpdate = true;
    signalArms.instanceMatrix.needsUpdate = true;
    signalHeads.instanceMatrix.needsUpdate = true;
    root.add(signalPoles, signalArms, signalHeads);

    const bbMats = [
        new THREE.MeshStandardMaterial({ map: textures.billboardA, emissiveMap: textures.billboardA, emissive: 0xffffff, emissiveIntensity: 0.25 }),
        new THREE.MeshStandardMaterial({ map: textures.billboardB, emissiveMap: textures.billboardB, emissive: 0xffffff, emissiveIntensity: 0.25 })
    ];
    for (const bb of cityData.billboards) {
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(bb.w, bb.h), bbMats[bb.variant]);
        mesh.position.set(bb.x, bb.y, bb.z);
        mesh.rotation.y = bb.yaw;
        root.add(mesh);
    }

    const rampMat = makePbrMat(pbr.concreteWall, 0xcbd2da, 0.72, 0.14, 0.8);
    for (const r of cityData.ramps) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(r.w, 0.36, r.l), rampMat);
        mesh.position.set(r.x, r.y + r.h * 0.5, r.z);
        mesh.rotation.set(-Math.atan2(r.h, r.l), r.yaw, 0, "YXZ");
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        root.add(mesh);
    }

    const updateEnvironment = (timeSec, nightFactor, wetness) => {
        roadBuilt.wetnessUniform.value = wetness;
        interBuilt.wetnessUniform.value = wetness;
        facadeGlassMat.emissiveIntensity = 0.04 + nightFactor * 0.65;
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
