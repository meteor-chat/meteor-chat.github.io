import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { buildHydrantGeometry } from "./gta-building-meshes.js";
import {
    buildLoftedHullGeometry,
    buildSplitWheelGeometries,
    buildVehicleDetailGeometries,
    createContactShadowTexture
} from "./gta-car-sculpt.js";
import { VEHICLE_PRESETS } from "./gta-vehicle-specs.js";

const FERRARI_WHEELS = new Set(["wheel_fl", "wheel_fr", "wheel_rl", "wheel_rr"]);

function normalizeGeo(geo, mat4 = null) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (mat4) g.applyMatrix4(mat4);
    if (!g.attributes.normal) g.computeVertexNormals();
    const out = new THREE.BufferGeometry();
    out.setAttribute("position", g.attributes.position);
    out.setAttribute("normal", g.attributes.normal);
    g.dispose();
    return out;
}

function mergeList(parts) {
    if (!parts.length) return null;
    const merged = mergeGeometries(parts, false);
    for (const p of parts) p.dispose();
    return merged;
}

function extractFerrariInstancedGeos(ferrariGltf) {
    if (!ferrariGltf || !ferrariGltf.scene) return null;
    const clone = ferrariGltf.scene.clone(true);
    for (const wn of FERRARI_WHEELS) {
        const w = clone.getObjectByName(wn);
        if (w && w.parent) w.parent.remove(w);
    }
    clone.updateMatrixWorld(true);
    const invRoot = new THREE.Matrix4().copy(clone.matrixWorld).invert();
    const align = new THREE.Matrix4()
        .makeTranslation(0, 0.04, 0.17)
        .multiply(new THREE.Matrix4().makeRotationY(Math.PI));
    const mLocal = new THREE.Matrix4();

    const buckets = { body: [], glass: [], trim: [], chrome: [], headlights: [], taillights: [] };
    clone.traverse((child) => {
        if (!child.isMesh || !child.geometry || Array.isArray(child.material)) return;
        const mName = child.material ? child.material.name || "" : "";
        const cName = child.name || "";
        mLocal.multiplyMatrices(invRoot, child.matrixWorld);
        mLocal.premultiply(align);
        const geo = normalizeGeo(child.geometry, mLocal);
        if (mName === "Body_Color" || cName === "body") buckets.body.push(geo);
        else if (mName === "Glass_Gray" || cName === "glass") buckets.glass.push(geo);
        else if (mName === "Taillight_Glass" || cName === "lights_red") buckets.taillights.push(geo);
        else if (mName === "Projector_Glass" || cName === "lights") buckets.headlights.push(geo);
        else if (/chrome|metal|silver|badge|exhaust|alu/i.test(mName)) buckets.chrome.push(geo);
        else buckets.trim.push(geo);
    });

    if (buckets.body.length === 0) return null;
    const plate = new THREE.PlaneGeometry(0.42, 0.2);
    plate.rotateY(Math.PI);
    plate.translate(0, 0.56, -2.14);

    return {
        hull: mergeList(buckets.body),
        glass: mergeList(buckets.glass),
        trim: mergeList(buckets.trim),
        chrome: mergeList(buckets.chrome),
        headlights: mergeList(buckets.headlights),
        taillights: mergeList(buckets.taillights),
        plate
    };
}

function buildCivilianPedGeometries() {
    const torsoParts = [];
    const chest = new THREE.CylinderGeometry(0.19, 0.15, 0.54, 10);
    chest.scale(1.18, 1, 0.68);
    torsoParts.push(normalizeGeo(chest));
    chest.dispose();
    const shoulders = new THREE.CapsuleGeometry(0.11, 0.26, 4, 8);
    shoulders.rotateZ(Math.PI * 0.5);
    shoulders.translate(0, 0.21, 0);
    torsoParts.push(normalizeGeo(shoulders));
    shoulders.dispose();
    const collar = new THREE.CylinderGeometry(0.085, 0.11, 0.08, 8);
    collar.translate(0, 0.29, 0);
    torsoParts.push(normalizeGeo(collar));
    collar.dispose();

    const headParts = [];
    const skull = new THREE.SphereGeometry(0.125, 10, 8);
    skull.scale(0.92, 1.08, 0.96);
    skull.translate(0, 0.08, 0);
    headParts.push(normalizeGeo(skull));
    skull.dispose();
    const neck = new THREE.CylinderGeometry(0.055, 0.068, 0.1, 8);
    neck.translate(0, -0.05, 0);
    headParts.push(normalizeGeo(neck));
    neck.dispose();

    const hairParts = [];
    const crown = new THREE.SphereGeometry(0.132, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.58);
    crown.scale(0.94, 1.06, 1.0);
    crown.translate(0, 0.095, -0.01);
    hairParts.push(normalizeGeo(crown));
    crown.dispose();
    const shades = new THREE.BoxGeometry(0.18, 0.045, 0.06);
    shades.translate(0, 0.09, 0.11);
    hairParts.push(normalizeGeo(shades));
    shades.dispose();

    const armParts = [];
    const upper = new THREE.CylinderGeometry(0.062, 0.052, 0.48, 8);
    upper.translate(0, -0.22, 0);
    armParts.push(normalizeGeo(upper));
    upper.dispose();
    const hand = new THREE.SphereGeometry(0.048, 6, 5);
    hand.translate(0, -0.47, 0.01);
    armParts.push(normalizeGeo(hand));
    hand.dispose();

    const legGeo = new THREE.CylinderGeometry(0.082, 0.062, 0.68, 8);
    legGeo.translate(0, -0.34, 0);
    const shoeGeo = new THREE.BoxGeometry(0.11, 0.08, 0.22);
    shoeGeo.translate(0, -0.68, 0.05);

    const pedShadowGeo = new THREE.PlaneGeometry(0.75, 0.75);
    pedShadowGeo.rotateX(-Math.PI * 0.5);

    return {
        torso: mergeList(torsoParts),
        head: mergeList(headParts),
        hair: mergeList(hairParts),
        arm: mergeList(armParts),
        leg: normalizeGeo(legGeo),
        shoe: normalizeGeo(shoeGeo),
        shadow: pedShadowGeo
    };
}

export function createTrafficRenderer(scene, traffic, propBodies, assets = null, textures = null) {
    const dummy = new THREE.Object3D();
    const wheelDummy = new THREE.Object3D();
    const col = new THREE.Color();
    const ownedGeos = [];
    const ownedMats = [];
    const ownedMeshes = [];

    const sedanCars = [];
    const suvCars = [];
    for (let i = 0; i < traffic.cars.length; i += 1) {
        const c = traffic.cars[i];
        const spec = VEHICLE_PRESETS[c.preset] || VEHICLE_PRESETS.elegy;
        const entry = { car: c, spec, spin: 0 };
        if (spec.suv) suvCars.push(entry);
        else sedanCars.push(entry);
    }

    const hullMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.56,
        roughness: 0.28,
        envMapIntensity: 0.72
    });
    const glassMat = new THREE.MeshStandardMaterial({
        color: 0x0c1624,
        metalness: 0.58,
        roughness: 0.12,
        envMapIntensity: 0.92
    });
    const trimMat = new THREE.MeshStandardMaterial({
        color: 0x1b2028,
        metalness: 0.25,
        roughness: 0.72,
        envMapIntensity: 0.45
    });
    const chromeMat = new THREE.MeshStandardMaterial({
        color: 0xc9d2dc,
        metalness: 0.82,
        roughness: 0.22,
        envMapIntensity: 0.85
    });
    const headMat = new THREE.MeshStandardMaterial({
        color: 0xf4f6fa,
        emissive: 0xfff0cc,
        emissiveIntensity: 1.2,
        roughness: 0.18
    });
    const tailMat = new THREE.MeshStandardMaterial({
        color: 0xa81c1c,
        emissive: 0xdc2626,
        emissiveIntensity: 1.35,
        roughness: 0.2
    });
    const plateMat = new THREE.MeshStandardMaterial({
        map: textures ? textures.plate : null,
        color: textures ? 0xffffff : 0xdbe2ea,
        roughness: 0.48,
        metalness: 0.1
    });
    const tireMat = new THREE.MeshStandardMaterial({
        color: 0x171a20,
        roughness: 0.86,
        metalness: 0.08
    });
    const rimMat = new THREE.MeshStandardMaterial({
        color: 0xbcc6d2,
        roughness: 0.24,
        metalness: 0.84,
        envMapIntensity: 0.8
    });
    const shadowTex = createContactShadowTexture();
    const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.6
    });
    ownedMats.push(hullMat, glassMat, trimMat, chromeMat, headMat, tailMat, plateMat, tireMat, rimMat, shadowMat);

    const makePool = (geo, mat, count, castShadow = false) => {
        if (!geo) return null;
        ownedGeos.push(geo);
        const inst = new THREE.InstancedMesh(geo, mat, Math.max(1, count));
        inst.castShadow = castShadow;
        inst.receiveShadow = castShadow;
        inst.frustumCulled = false;
        if (count === 0) inst.visible = false;
        scene.add(inst);
        ownedMeshes.push(inst);
        return inst;
    };

    const buildCarPools = (geos, list) => {
        const n = list.length;
        const pools = {
            hull: makePool(geos.hull, hullMat, n, true),
            glass: makePool(geos.glass, glassMat, n, false),
            trim: makePool(geos.trim, trimMat, n, false),
            chrome: makePool(geos.chrome, chromeMat, n, false),
            headlights: makePool(geos.headlights, headMat, n, false),
            taillights: makePool(geos.taillights, tailMat, n, false),
            plate: makePool(geos.plate, plateMat, n, false)
        };
        if (pools.hull && n > 0) {
            for (let i = 0; i < n; i += 1) {
                col.setHex(list[i].car.color);
                pools.hull.setColorAt(i, col);
            }
            if (pools.hull.instanceColor) pools.hull.instanceColor.needsUpdate = true;
        }
        return pools;
    };

    const ferrariGeos = assets && assets.models ? extractFerrariInstancedGeos(assets.models.ferrari) : null;
    const sedanDetail = ferrariGeos ? null : buildVehicleDetailGeometries("sedan");
    const sedanGeos = ferrariGeos || {
        hull: buildLoftedHullGeometry("sedan"),
        ...sedanDetail
    };
    const suvDetail = buildVehicleDetailGeometries("suv");
    const suvGeos = {
        hull: buildLoftedHullGeometry("suv"),
        ...suvDetail
    };

    const sedanPools = buildCarPools(sedanGeos, sedanCars);
    const suvPools = buildCarPools(suvGeos, suvCars);

    const totalCars = sedanCars.length + suvCars.length;
    const { tireGeo, rimGeo } = buildSplitWheelGeometries();
    const allTires = makePool(tireGeo, tireMat, totalCars * 4, false);
    const allRims = makePool(rimGeo, rimMat, totalCars * 4, false);
    const shadowGeo = new THREE.PlaneGeometry(2.35, 4.95);
    shadowGeo.rotateX(-Math.PI * 0.5);
    const allShadows = makePool(shadowGeo, shadowMat, totalCars, false);

    const pedCount = traffic.peds.length;
    const pedShadowGeo = new THREE.PlaneGeometry(0.75, 0.75);
    pedShadowGeo.rotateX(-Math.PI * 0.5);
    const pedShadows = makePool(pedShadowGeo, shadowMat, pedCount, false);

    const civAsset = assets && assets.models && assets.models.civilian && assets.models.civilian.scene ? assets.models.civilian : null;
    const riggedSlots = [];
    const RIGGED_PED_POOL = 10;
    const RIGGED_TINTS = [0xffffff, 0xe8dfd5, 0xd8e2ec, 0xf2e4d8, 0xdde5dc, 0xe5dce8, 0xf0e8d4, 0xd6e6e4, 0xead8d8, 0xe4e8d8];

    let pedTorsos = null;
    let pedHeads = null;
    let pedHairs = null;
    let pedArms = null;
    let pedLegs = null;
    let pedShoes = null;

    if (civAsset && pedCount > 0) {
        const poolCount = Math.min(RIGGED_PED_POOL, pedCount);
        for (let i = 0; i < poolCount; i += 1) {
            const clone = SkeletonUtils.clone(civAsset.scene);
            clone.scale.setScalar(1.22);
            const tint = RIGGED_TINTS[i % RIGGED_TINTS.length];
            clone.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.frustumCulled = false;
                    if (child.material && !Array.isArray(child.material)) {
                        const mat = child.material.clone();
                        if (mat.color) mat.color.multiply(new THREE.Color(tint));
                        if (typeof mat.roughness === "number") mat.roughness = 0.76;
                        if (typeof mat.metalness === "number") mat.metalness = 0.04;
                        child.material = mat;
                        ownedMats.push(mat);
                    }
                }
            });
            clone.visible = false;
            scene.add(clone);
            ownedMeshes.push(clone);

            const mixer = new THREE.AnimationMixer(clone);
            let action = null;
            if (civAsset.animations && civAsset.animations.length > 0) {
                action = mixer.clipAction(civAsset.animations[0]);
                action.play();
                action.time = (i * 0.37) % Math.max(0.1, civAsset.animations[0].duration || 1);
            }
            riggedSlots.push({ root: clone, mixer, action, pedIdx: -1 });
        }
    } else if (pedCount > 0) {
        const pedGeos = buildCivilianPedGeometries();
        const pedShirtMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78, metalness: 0.04 });
        const pedSkinMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.72, metalness: 0.02 });
        const pedHairMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.65, metalness: 0.1 });
        const pedPantsMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0.04 });
        const pedShoeMat = new THREE.MeshStandardMaterial({ color: 0x262b33, roughness: 0.72, metalness: 0.06 });
        ownedMats.push(pedShirtMat, pedSkinMat, pedHairMat, pedPantsMat, pedShoeMat);

        pedTorsos = makePool(pedGeos.torso, pedShirtMat, pedCount, true);
        pedHeads = makePool(pedGeos.head, pedSkinMat, pedCount, false);
        pedHairs = makePool(pedGeos.hair, pedHairMat, pedCount, false);
        pedArms = makePool(pedGeos.arm, pedShirtMat, pedCount * 2, false);
        pedLegs = makePool(pedGeos.leg, pedPantsMat, pedCount * 2, false);
        pedShoes = makePool(pedGeos.shoe, pedShoeMat, pedCount * 2, false);
        pedGeos.shadow.dispose();

        for (let i = 0; i < pedCount; i += 1) {
            const p = traffic.peds[i];
            col.setHex(p.shirtColor || 0x2a4d7a);
            pedTorsos.setColorAt(i, col);
            pedArms.setColorAt(i * 2, col);
            pedArms.setColorAt(i * 2 + 1, col);
            col.setHex(p.skinColor || 0xd9a884);
            pedHeads.setColorAt(i, col);
            col.setHex(p.hairColor || 0x241d18);
            pedHairs.setColorAt(i, col);
            col.setHex(p.pantsColor || 0x1e293b);
            pedLegs.setColorAt(i * 2, col);
            pedLegs.setColorAt(i * 2 + 1, col);
        }
        for (const inst of [pedTorsos, pedHeads, pedHairs, pedArms, pedLegs]) {
            if (inst && inst.instanceColor) inst.instanceColor.needsUpdate = true;
        }
    }

    const hydrants = [];
    const bins = [];
    const cones = [];
    for (let i = 0; i < propBodies.length; i += 1) {
        const pb = propBodies[i];
        if (pb.kind === "hydrant") hydrants.push(pb.body);
        else if (pb.kind === "bollard") bins.push(pb.body);
        else cones.push(pb.body);
    }

    const hydrantMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.42, metalness: 0.48 });
    const binMat = new THREE.MeshStandardMaterial({ color: 0x525a66, roughness: 0.46, metalness: 0.62 });
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.48, metalness: 0.08 });
    ownedMats.push(hydrantMat, binMat, coneMat);

    const hydrantsInst = makePool(buildHydrantGeometry(), hydrantMat, hydrants.length, false);
    const binsInst = makePool(new THREE.CylinderGeometry(0.24, 0.2, 0.86, 10), binMat, bins.length, false);
    const conesInst = makePool(new THREE.ConeGeometry(0.22, 0.68, 10), coneMat, cones.length, false);

    const syncPropPool = (bodies, inst, forceAll) => {
        if (!inst || bodies.length === 0) return;
        let dirty = false;
        for (let i = 0; i < bodies.length; i += 1) {
            const b = bodies[i];
            if (!forceAll && !b.IsActive()) continue;
            const p = b.GetPosition();
            const q = b.GetRotation();
            dummy.position.set(p.GetX(), p.GetY() - 0.5, p.GetZ());
            dummy.quaternion.set(q.GetX(), q.GetY(), q.GetZ(), q.GetW());
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            inst.setMatrixAt(i, dummy.matrix);
            dirty = true;
        }
        if (dirty) inst.instanceMatrix.needsUpdate = true;
    };

    syncPropPool(hydrants, hydrantsInst, true);
    syncPropPool(bins, binsInst, true);
    syncPropPool(cones, conesInst, true);

    const writeCarGroup = (list, pools, dt, wheelBaseIdx, shadowBaseIdx) => {
        const poolList = [pools.hull, pools.glass, pools.trim, pools.chrome, pools.headlights, pools.taillights, pools.plate].filter(Boolean);
        let wi = wheelBaseIdx;
        let si = shadowBaseIdx;
        for (let i = 0; i < list.length; i += 1) {
            const item = list[i];
            const c = item.car;
            const spec = item.spec;
            item.spin += (c.speed * dt) / Math.max(0.2, spec.wheelRadius);

            dummy.position.set(c.pos.x, c.pos.y + 0.02, c.pos.z);
            dummy.rotation.set(0, c.yaw, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            for (let p = 0; p < poolList.length; p += 1) {
                poolList[p].setMatrixAt(i, dummy.matrix);
            }

            dummy.position.set(c.pos.x, c.pos.y + 0.05, c.pos.z);
            dummy.updateMatrix();
            allShadows.setMatrixAt(si, dummy.matrix);
            si += 1;

            const sinY = Math.sin(c.yaw);
            const cosY = Math.cos(c.yaw);
            const ht = spec.halfTrack;
            const hw = spec.halfWheelbase;
            const wy = c.pos.y + spec.wheelRadius;
            const offsets = [
                [-ht, hw],
                [ht, hw],
                [-ht, -hw],
                [ht, -hw]
            ];
            for (let w = 0; w < 4; w += 1) {
                const lx = offsets[w][0];
                const lz = offsets[w][1];
                wheelDummy.position.set(c.pos.x + lx * cosY + lz * sinY, wy, c.pos.z - lx * sinY + lz * cosY);
                wheelDummy.rotation.set(item.spin, c.yaw, 0, "YXZ");
                wheelDummy.scale.set(1, spec.wheelRadius / 0.37, spec.wheelRadius / 0.37);
                wheelDummy.updateMatrix();
                allTires.setMatrixAt(wi, wheelDummy.matrix);
                allRims.setMatrixAt(wi, wheelDummy.matrix);
                wi += 1;
            }
        }
        if (list.length > 0) {
            for (let p = 0; p < poolList.length; p += 1) {
                poolList[p].instanceMatrix.needsUpdate = true;
            }
        }
        return { wheelIdx: wi, shadowIdx: si };
    };

    const pedOrder = Array.from({ length: pedCount }, (_, i) => ({ idx: i, d2: 0 }));

    const update = (dt, focusPos = null) => {
        const r1 = writeCarGroup(sedanCars, sedanPools, dt, 0, 0);
        writeCarGroup(suvCars, suvPools, dt, r1.wheelIdx, r1.shadowIdx);
        if (totalCars > 0) {
            allTires.instanceMatrix.needsUpdate = true;
            allRims.instanceMatrix.needsUpdate = true;
            allShadows.instanceMatrix.needsUpdate = true;
        }

        if (riggedSlots.length > 0) {
            const fx = focusPos ? focusPos.x : 0;
            const fz = focusPos ? focusPos.z : 0;
            for (let i = 0; i < pedCount; i += 1) {
                const p = traffic.peds[i];
                const dx = p.x - fx;
                const dz = p.z - fz;
                pedOrder[i].idx = i;
                pedOrder[i].d2 = dx * dx + dz * dz;
            }
            pedOrder.sort((a, b) => a.d2 - b.d2);

            const maxDist2 = 125 * 125;
            const activePeds = new Set();
            for (let s = 0; s < riggedSlots.length && s < pedCount; s += 1) {
                if (pedOrder[s].d2 <= maxDist2) activePeds.add(pedOrder[s].idx);
            }
            const assigned = new Set();
            for (let s = 0; s < riggedSlots.length; s += 1) {
                const slot = riggedSlots[s];
                if (slot.pedIdx >= 0 && activePeds.has(slot.pedIdx)) {
                    assigned.add(slot.pedIdx);
                } else {
                    slot.pedIdx = -1;
                }
            }
            let freeCursor = 0;
            for (const pedIdx of activePeds) {
                if (assigned.has(pedIdx)) continue;
                while (freeCursor < riggedSlots.length && riggedSlots[freeCursor].pedIdx >= 0) {
                    freeCursor += 1;
                }
                if (freeCursor < riggedSlots.length) {
                    riggedSlots[freeCursor].pedIdx = pedIdx;
                    assigned.add(pedIdx);
                }
            }
            for (let s = 0; s < riggedSlots.length; s += 1) {
                const slot = riggedSlots[s];
                if (slot.pedIdx >= 0) {
                    const p = traffic.peds[slot.pedIdx];
                    const yaw = p.alongX ? (p.dir > 0 ? Math.PI * 0.5 : -Math.PI * 0.5) : p.dir > 0 ? 0 : Math.PI;
                    slot.root.visible = true;
                    slot.root.position.set(p.x, p.y + 0.04, p.z);
                    slot.root.rotation.set(0, yaw, 0);
                    if (slot.action) slot.action.timeScale = Math.max(0.65, p.speed / 1.45);
                    slot.mixer.update(dt);
                } else {
                    slot.root.visible = false;
                }
            }

            for (let i = 0; i < pedCount; i += 1) {
                const p = traffic.peds[i];
                dummy.position.set(p.x, p.y + 0.08, p.z);
                dummy.rotation.set(0, 0, 0);
                dummy.scale.set(1, 1, 1);
                dummy.updateMatrix();
                pedShadows.setMatrixAt(i, dummy.matrix);
            }
            if (pedShadows) pedShadows.instanceMatrix.needsUpdate = true;
        } else if (pedCount > 0 && pedTorsos) {
            for (let i = 0; i < pedCount; i += 1) {
                const p = traffic.peds[i];
                const yaw = p.alongX ? (p.dir > 0 ? Math.PI * 0.5 : -Math.PI * 0.5) : p.dir > 0 ? 0 : Math.PI;
                const bob = Math.abs(Math.sin(p.phase)) * 0.045;
                const swing = Math.sin(p.phase) * 0.42;
                const cosY = Math.cos(yaw);
                const sinY = Math.sin(yaw);

                dummy.position.set(p.x, p.y + 1.08 + bob, p.z);
                dummy.rotation.set(0, yaw, 0);
                dummy.scale.set(1, 1, 1);
                dummy.updateMatrix();
                pedTorsos.setMatrixAt(i, dummy.matrix);

                dummy.position.set(p.x, p.y + 1.48 + bob, p.z);
                dummy.updateMatrix();
                pedHeads.setMatrixAt(i, dummy.matrix);
                pedHairs.setMatrixAt(i, dummy.matrix);

                dummy.position.set(p.x, p.y + 0.08, p.z);
                dummy.rotation.set(0, 0, 0);
                dummy.updateMatrix();
                pedShadows.setMatrixAt(i, dummy.matrix);

                const armOff = 0.255;
                dummy.position.set(p.x - armOff * cosY, p.y + 1.32 + bob, p.z + armOff * sinY);
                dummy.rotation.set(-swing * 0.85, yaw, 0, "YXZ");
                dummy.updateMatrix();
                pedArms.setMatrixAt(i * 2, dummy.matrix);

                dummy.position.set(p.x + armOff * cosY, p.y + 1.32 + bob, p.z - armOff * sinY);
                dummy.rotation.set(swing * 0.85, yaw, 0, "YXZ");
                dummy.updateMatrix();
                pedArms.setMatrixAt(i * 2 + 1, dummy.matrix);

                const legOff = 0.105;
                dummy.position.set(p.x - legOff * cosY, p.y + 0.78 + bob * 0.4, p.z + legOff * sinY);
                dummy.rotation.set(swing, yaw, 0, "YXZ");
                dummy.updateMatrix();
                pedLegs.setMatrixAt(i * 2, dummy.matrix);
                pedShoes.setMatrixAt(i * 2, dummy.matrix);

                dummy.position.set(p.x + legOff * cosY, p.y + 0.78 + bob * 0.4, p.z - legOff * sinY);
                dummy.rotation.set(-swing, yaw, 0, "YXZ");
                dummy.updateMatrix();
                pedLegs.setMatrixAt(i * 2 + 1, dummy.matrix);
                pedShoes.setMatrixAt(i * 2 + 1, dummy.matrix);
            }
            pedTorsos.instanceMatrix.needsUpdate = true;
            pedHeads.instanceMatrix.needsUpdate = true;
            pedHairs.instanceMatrix.needsUpdate = true;
            pedArms.instanceMatrix.needsUpdate = true;
            pedLegs.instanceMatrix.needsUpdate = true;
            pedShoes.instanceMatrix.needsUpdate = true;
            pedShadows.instanceMatrix.needsUpdate = true;
        }

        syncPropPool(hydrants, hydrantsInst, false);
        syncPropPool(bins, binsInst, false);
        syncPropPool(cones, conesInst, false);
    };

    const dispose = () => {
        for (const s of riggedSlots) s.mixer.stopAllAction();
        for (const m of ownedMeshes) scene.remove(m);
        for (const g of ownedGeos) g.dispose();
        for (const mat of ownedMats) mat.dispose();
        shadowTex.dispose();
    };

    return { update, dispose };
}
