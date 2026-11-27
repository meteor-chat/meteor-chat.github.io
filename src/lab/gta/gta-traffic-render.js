import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { buildHydrantGeometry } from "./gta-building-meshes.js";
import {
    buildGlassCanopyGeometry,
    buildLoftedHullGeometry,
    createContactShadowTexture
} from "./gta-car-sculpt.js";
import { VEHICLE_PRESETS } from "./gta-vehicle-specs.js";

function normalizeGeo(geo) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (!g.attributes.normal) g.computeVertexNormals();
    const out = new THREE.BufferGeometry();
    out.setAttribute("position", g.attributes.position);
    out.setAttribute("normal", g.attributes.normal);
    g.dispose();
    return out;
}

function buildCombinedWheelGeo() {
    const tire = new THREE.CylinderGeometry(0.37, 0.37, 0.27, 14);
    tire.rotateZ(Math.PI * 0.5);
    const rim = new THREE.CylinderGeometry(0.24, 0.24, 0.285, 10);
    rim.rotateZ(Math.PI * 0.5);
    const merged = mergeGeometries([normalizeGeo(tire), normalizeGeo(rim)], false);
    tire.dispose();
    rim.dispose();
    return merged;
}

function buildTrimGeo(isSuv) {
    const parts = [normalizeGeo(buildGlassCanopyGeometry(isSuv ? "suv" : "sedan"))];
    const tailZ = isSuv ? -2.41 : -2.26;
    const headZ = isSuv ? 2.48 : 2.3;
    const hw = isSuv ? 0.78 : 0.68;

    for (const sx of [-hw, hw]) {
        const hl = new THREE.BoxGeometry(0.34, 0.12, 0.08);
        hl.translate(sx * 0.88, isSuv ? 0.74 : 0.58, headZ);
        parts.push(normalizeGeo(hl));
        hl.dispose();

        const tl = isSuv ? new THREE.BoxGeometry(0.09, 0.5, 0.1) : new THREE.BoxGeometry(0.4, 0.12, 0.08);
        tl.translate(sx, isSuv ? 0.86 : 0.68, tailZ);
        parts.push(normalizeGeo(tl));
        tl.dispose();
    }
    const merged = mergeGeometries(parts, false);
    for (const p of parts) p.dispose();
    return merged;
}

export function createTrafficRenderer(scene, traffic, propBodies) {
    const dummy = new THREE.Object3D();
    const wheelDummy = new THREE.Object3D();
    const col = new THREE.Color();

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
        metalness: 0.72,
        roughness: 0.24,
        envMapIntensity: 1.45
    });
    const trimMat = new THREE.MeshStandardMaterial({
        color: 0x16202e,
        metalness: 0.68,
        roughness: 0.14,
        envMapIntensity: 1.6
    });
    const wheelMat = new THREE.MeshStandardMaterial({
        color: 0x2a303a,
        roughness: 0.62,
        metalness: 0.45
    });
    const shadowTex = createContactShadowTexture();
    const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.62
    });

    const sedanHullGeo = buildLoftedHullGeometry("sedan");
    const suvHullGeo = buildLoftedHullGeometry("suv");
    const sedanTrimGeo = buildTrimGeo(false);
    const suvTrimGeo = buildTrimGeo(true);
    const wheelGeo = buildCombinedWheelGeo();
    const shadowGeo = new THREE.PlaneGeometry(2.35, 4.95);
    shadowGeo.rotateX(-Math.PI * 0.5);

    const makePool = (geo, mat, count, castShadow = false) => {
        const inst = new THREE.InstancedMesh(geo, mat, Math.max(1, count));
        inst.castShadow = castShadow;
        inst.receiveShadow = castShadow;
        inst.frustumCulled = false;
        if (count === 0) inst.visible = false;
        scene.add(inst);
        return inst;
    };

    const sedanHulls = makePool(sedanHullGeo, hullMat, sedanCars.length, true);
    const sedanTrims = makePool(sedanTrimGeo, trimMat, sedanCars.length, false);
    const suvHulls = makePool(suvHullGeo, hullMat, suvCars.length, true);
    const suvTrims = makePool(suvTrimGeo, trimMat, suvCars.length, false);

    const totalCars = sedanCars.length + suvCars.length;
    const allWheels = makePool(wheelGeo, wheelMat, totalCars * 4, false);
    const allShadows = makePool(shadowGeo, shadowMat, totalCars, false);

    for (let i = 0; i < sedanCars.length; i += 1) {
        col.setHex(sedanCars[i].car.color);
        sedanHulls.setColorAt(i, col);
    }
    if (sedanHulls.instanceColor) sedanHulls.instanceColor.needsUpdate = true;

    for (let i = 0; i < suvCars.length; i += 1) {
        col.setHex(suvCars[i].car.color);
        suvHulls.setColorAt(i, col);
    }
    if (suvHulls.instanceColor) suvHulls.instanceColor.needsUpdate = true;

    const pedTorsoGeo = new THREE.CapsuleGeometry(0.18, 0.46, 4, 8);
    const pedHeadGeo = new THREE.SphereGeometry(0.13, 8, 6);
    const pedLegGeo = new THREE.CapsuleGeometry(0.08, 0.56, 4, 6);
    const pedTorsoMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78 });
    const pedSkinMat = new THREE.MeshStandardMaterial({ color: 0xd9a884, roughness: 0.72 });
    const pedPantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });

    const pedTorsos = makePool(pedTorsoGeo, pedTorsoMat, traffic.peds.length, false);
    const pedHeads = makePool(pedHeadGeo, pedSkinMat, traffic.peds.length, false);
    const pedLegs = makePool(pedLegGeo, pedPantsMat, traffic.peds.length * 2, false);

    for (let i = 0; i < traffic.peds.length; i += 1) {
        col.setHex(traffic.peds[i].shirtColor);
        pedTorsos.setColorAt(i, col);
    }
    if (pedTorsos.instanceColor) pedTorsos.instanceColor.needsUpdate = true;

    const hydrants = [];
    const bins = [];
    const cones = [];
    for (let i = 0; i < propBodies.length; i += 1) {
        const pb = propBodies[i];
        if (pb.kind === "hydrant") hydrants.push(pb.body);
        else if (pb.kind === "bollard") bins.push(pb.body);
        else cones.push(pb.body);
    }

    const hydrantGeo = buildHydrantGeometry();
    const hydrantMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.36, metalness: 0.55 });
    const binGeo = new THREE.CylinderGeometry(0.24, 0.2, 0.86, 10);
    const binMat = new THREE.MeshStandardMaterial({ color: 0x525a66, roughness: 0.42, metalness: 0.72 });
    const coneGeo = new THREE.ConeGeometry(0.22, 0.68, 10);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.45, metalness: 0.1 });

    const hydrantsInst = makePool(hydrantGeo, hydrantMat, hydrants.length, false);
    const binsInst = makePool(binGeo, binMat, bins.length, false);
    const conesInst = makePool(coneGeo, coneMat, cones.length, false);

    const syncPropPool = (bodies, inst, forceAll) => {
        if (bodies.length === 0) return;
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

    const writeCarGroup = (list, hullInst, trimInst, dt, wheelBaseIdx, shadowBaseIdx) => {
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
            hullInst.setMatrixAt(i, dummy.matrix);
            trimInst.setMatrixAt(i, dummy.matrix);

            dummy.position.set(c.pos.x, c.pos.y + 0.06, c.pos.z);
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
                allWheels.setMatrixAt(wi, wheelDummy.matrix);
                wi += 1;
            }
        }
        if (list.length > 0) {
            hullInst.instanceMatrix.needsUpdate = true;
            trimInst.instanceMatrix.needsUpdate = true;
        }
        return { wheelIdx: wi, shadowIdx: si };
    };

    const update = (dt) => {
        const r1 = writeCarGroup(sedanCars, sedanHulls, sedanTrims, dt, 0, 0);
        writeCarGroup(suvCars, suvHulls, suvTrims, dt, r1.wheelIdx, r1.shadowIdx);
        if (totalCars > 0) {
            allWheels.instanceMatrix.needsUpdate = true;
            allShadows.instanceMatrix.needsUpdate = true;
        }

        for (let i = 0; i < traffic.peds.length; i += 1) {
            const p = traffic.peds[i];
            const yaw = p.alongX ? (p.dir > 0 ? Math.PI * 0.5 : -Math.PI * 0.5) : p.dir > 0 ? 0 : Math.PI;
            const bob = Math.abs(Math.sin(p.phase)) * 0.06;
            const swing = Math.sin(p.phase) * 0.38;
            const cosY = Math.cos(yaw);
            const sinY = Math.sin(yaw);

            dummy.position.set(p.x, p.y + 1.12 + bob, p.z);
            dummy.rotation.set(0, yaw, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            pedTorsos.setMatrixAt(i, dummy.matrix);

            dummy.position.set(p.x, p.y + 1.62 + bob, p.z);
            dummy.updateMatrix();
            pedHeads.setMatrixAt(i, dummy.matrix);

            dummy.position.set(p.x - 0.09 * cosY, p.y + 0.42, p.z + 0.09 * sinY);
            dummy.rotation.set(swing, yaw, 0, "YXZ");
            dummy.updateMatrix();
            pedLegs.setMatrixAt(i * 2, dummy.matrix);

            dummy.position.set(p.x + 0.09 * cosY, p.y + 0.42, p.z - 0.09 * sinY);
            dummy.rotation.set(-swing, yaw, 0, "YXZ");
            dummy.updateMatrix();
            pedLegs.setMatrixAt(i * 2 + 1, dummy.matrix);
        }
        if (traffic.peds.length > 0) {
            pedTorsos.instanceMatrix.needsUpdate = true;
            pedHeads.instanceMatrix.needsUpdate = true;
            pedLegs.instanceMatrix.needsUpdate = true;
        }

        syncPropPool(hydrants, hydrantsInst, false);
        syncPropPool(bins, binsInst, false);
        syncPropPool(cones, conesInst, false);
    };

    const dispose = () => {
        const meshes = [
            sedanHulls, sedanTrims, suvHulls, suvTrims, allWheels, allShadows,
            pedTorsos, pedHeads, pedLegs, hydrantsInst, binsInst, conesInst
        ];
        for (const m of meshes) {
            scene.remove(m);
            m.geometry.dispose();
        }
        hullMat.dispose();
        trimMat.dispose();
        wheelMat.dispose();
        shadowMat.dispose();
        shadowTex.dispose();
        pedTorsoMat.dispose();
        pedSkinMat.dispose();
        pedPantsMat.dispose();
        hydrantMat.dispose();
        binMat.dispose();
        coneMat.dispose();
    };

    return { update, dispose };
}
