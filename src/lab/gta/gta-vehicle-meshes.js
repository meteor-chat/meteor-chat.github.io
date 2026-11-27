import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import {
    buildGlassCanopyGeometry,
    buildLoftedHullGeometry,
    buildSculptedWheelMesh,
    createContactShadowTexture
} from "./gta-car-sculpt.js";
import { VEHICLE_PRESETS } from "./gta-vehicle-specs.js";

const WHEEL_NAMES = ["wheel_fl", "wheel_fr", "wheel_rl", "wheel_rr"];
let sharedShadowTex = null;
let sharedSuvHull = null;
let sharedSuvGlass = null;
let sharedSedanHull = null;
let sharedSedanGlass = null;

function getShadowTex() {
    if (!sharedShadowTex) sharedShadowTex = createContactShadowTexture();
    return sharedShadowTex;
}

function getLoftedGeos(kind) {
    if (kind === "suv") {
        if (!sharedSuvHull) sharedSuvHull = buildLoftedHullGeometry("suv");
        if (!sharedSuvGlass) sharedSuvGlass = buildGlassCanopyGeometry("suv");
        return { hull: sharedSuvHull, glass: sharedSuvGlass };
    }
    if (!sharedSedanHull) sharedSedanHull = buildLoftedHullGeometry("sedan");
    if (!sharedSedanGlass) sharedSedanGlass = buildGlassCanopyGeometry("sedan");
    return { hull: sharedSedanHull, glass: sharedSedanGlass };
}

function normalizeGeoForMerge(geo, matrix, keepUv) {
    const raw = geo.index ? geo.toNonIndexed() : geo.clone();
    raw.applyMatrix4(matrix);
    if (!raw.attributes.normal) raw.computeVertexNormals();
    const out = new THREE.BufferGeometry();
    out.setAttribute("position", raw.attributes.position);
    out.setAttribute("normal", raw.attributes.normal);
    if (keepUv && raw.attributes.uv) out.setAttribute("uv", raw.attributes.uv);
    raw.dispose();
    return out;
}

function mergeStaticModelByMaterial(rootObj) {
    rootObj.updateMatrixWorld(true);
    const invRoot = new THREE.Matrix4().copy(rootObj.matrixWorld).invert();
    const groups = new Map();
    const toRemove = [];

    rootObj.traverse((child) => {
        if (!child.isMesh || !child.geometry || Array.isArray(child.material)) return;
        const mat = child.material;
        let bucket = groups.get(mat);
        if (!bucket) {
            bucket = { mat, meshes: [], castShadow: false, receiveShadow: false };
            groups.set(mat, bucket);
        }
        bucket.meshes.push(child);
        if (child.castShadow) bucket.castShadow = true;
        if (child.receiveShadow) bucket.receiveShadow = true;
    });

    const mergedRoot = new THREE.Group();
    const localMat = new THREE.Matrix4();
    for (const bucket of groups.values()) {
        if (bucket.meshes.length === 1) {
            const m = bucket.meshes[0];
            localMat.multiplyMatrices(invRoot, m.matrixWorld);
            const g = m.geometry.clone();
            g.applyMatrix4(localMat);
            const mesh = new THREE.Mesh(g, bucket.mat);
            mesh.castShadow = bucket.castShadow;
            mesh.receiveShadow = bucket.receiveShadow;
            mesh.matrixAutoUpdate = false;
            mesh.updateMatrix();
            mergedRoot.add(mesh);
            toRemove.push(m);
            continue;
        }
        const allHaveUv = bucket.meshes.every((m) => Boolean(m.geometry.attributes.uv));
        const parts = [];
        for (const m of bucket.meshes) {
            localMat.multiplyMatrices(invRoot, m.matrixWorld);
            parts.push(normalizeGeoForMerge(m.geometry, localMat, allHaveUv));
            toRemove.push(m);
        }
        const merged = mergeGeometries(parts, false);
        for (const p of parts) p.dispose();
        if (merged) {
            const mesh = new THREE.Mesh(merged, bucket.mat);
            mesh.castShadow = bucket.castShadow;
            mesh.receiveShadow = bucket.receiveShadow;
            mesh.matrixAutoUpdate = false;
            mesh.updateMatrix();
            mergedRoot.add(mesh);
        }
    }
    return toRemove.length > 0 ? mergedRoot : rootObj;
}

function extractFerrariWheelTemplate(ferrariGltf, wheelName) {
    if (!ferrariGltf || !ferrariGltf.scene) return null;
    const node = ferrariGltf.scene.getObjectByName(wheelName);
    if (!node) return null;
    const clone = node.clone(true);
    clone.position.set(0, 0, 0);
    clone.traverse((child) => {
        if (child.isMesh) {
            const mName = child.material ? child.material.name : "";
            child.castShadow = mName === "Tires";
            child.receiveShadow = false;
        }
    });
    const merged = mergeStaticModelByMaterial(clone);
    const pivot = new THREE.Group();
    pivot.add(merged);
    return pivot;
}

function buildWheelsForSpec(spec, assets, lightweight = false) {
    const ferrari = !lightweight && assets && assets.models ? assets.models.ferrari : null;
    const scaleR = spec.wheelRadius / 0.358;
    const scaleW = spec.wheelWidth / 0.28;
    const out = [];
    for (let i = 0; i < 4; i += 1) {
        const tmpl = extractFerrariWheelTemplate(ferrari, WHEEL_NAMES[i]);
        if (tmpl) {
            tmpl.scale.set(scaleW, scaleR, scaleR);
            out.push(tmpl);
        } else {
            out.push(buildSculptedWheelMesh(spec.wheelRadius, spec.wheelWidth, lightweight));
        }
    }
    return out;
}

function addContactShadow(parent, spec) {
    const mat = new THREE.MeshBasicMaterial({
        map: getShadowTex(),
        transparent: true,
        depthWrite: false,
        opacity: 0.72
    });
    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(spec.halfExtents[0] * 2.55, spec.halfExtents[2] * 2.38),
        mat
    );
    plane.rotation.x = -Math.PI * 0.5;
    plane.position.y = -spec.restHeight + 0.04;
    plane.matrixAutoUpdate = false;
    plane.updateMatrix();
    parent.add(plane);
}

function buildFerrariBody(spec, ferrariGltf, paintHex, textures) {
    const bodyRoot = new THREE.Group();
    const clone = ferrariGltf.scene.clone(true);
    for (const wn of WHEEL_NAMES) {
        const w = clone.getObjectByName(wn);
        if (w && w.parent) w.parent.remove(w);
    }

    const paintMat = new THREE.MeshPhysicalMaterial({
        color: paintHex,
        metalness: 0.86,
        roughness: 0.14,
        clearcoat: 1.0,
        clearcoatRoughness: 0.025,
        envMapIntensity: 1.85
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x0b1524,
        metalness: 0.16,
        roughness: 0.04,
        transparent: true,
        opacity: 0.44,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        envMapIntensity: 2.0,
        depthWrite: false
    });
    const tailMat = new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        emissive: 0xff1a1a,
        emissiveIntensity: 1.65,
        roughness: 0.16,
        metalness: 0.2
    });
    const headMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        emissive: 0xfff5db,
        emissiveIntensity: 2.1,
        roughness: 0.12
    });

    clone.traverse((child) => {
        if (!child.isMesh) return;
        const mName = child.material ? child.material.name : "";
        child.castShadow = mName === "Body_Color" || child.name === "body";
        child.receiveShadow = true;
        if (mName === "Body_Color" || child.name === "body") {
            child.material = paintMat;
        } else if (mName === "Glass_Gray" || child.name === "glass") {
            child.material = glassMat;
        } else if (mName === "Taillight_Glass" || child.name === "lights_red") {
            child.material = tailMat;
        } else if (mName === "Projector_Glass" || child.name === "lights") {
            child.material = headMat;
        }
    });

    const mergedBody = mergeStaticModelByMaterial(clone);
    mergedBody.rotation.y = Math.PI;
    mergedBody.position.set(0, -spec.restHeight + 0.04, 0.17);
    mergedBody.matrixAutoUpdate = false;
    mergedBody.updateMatrix();
    bodyRoot.add(mergedBody);

    if (textures && textures.plate) {
        const plateMat = new THREE.MeshStandardMaterial({ map: textures.plate, roughness: 0.38, metalness: 0.15 });
        const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.2), plateMat);
        plate.position.set(0, -spec.restHeight + 0.56, -2.14);
        plate.rotation.y = Math.PI;
        plate.matrixAutoUpdate = false;
        plate.updateMatrix();
        bodyRoot.add(plate);
    }

    return { bodyRoot, tailMat };
}

function buildSculptedBody(spec, paintHex, textures) {
    const bodyRoot = new THREE.Group();
    bodyRoot.position.y = -spec.restHeight + 0.02;

    const kind = spec.suv ? "suv" : "sedan";
    const { hull, glass } = getLoftedGeos(kind);

    const paintMat = new THREE.MeshPhysicalMaterial({
        color: paintHex,
        metalness: 0.84,
        roughness: 0.16,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
        envMapIntensity: 1.8
    });
    const glassMat = new THREE.MeshStandardMaterial({
        color: 0x0a1320,
        metalness: 0.72,
        roughness: 0.08,
        envMapIntensity: 1.9
    });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe8eef5, metalness: 0.94, roughness: 0.12 });
    const headMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        emissive: 0xfff4d6,
        emissiveIntensity: 2.2
    });
    const tailMat = new THREE.MeshStandardMaterial({
        color: 0xb91c1c,
        emissive: 0xdc2626,
        emissiveIntensity: 1.35,
        roughness: 0.18
    });

    const hullMesh = new THREE.Mesh(hull, paintMat);
    hullMesh.castShadow = true;
    hullMesh.receiveShadow = true;
    bodyRoot.add(hullMesh);

    const glassParts = [glass.clone()];
    const tailZ = spec.suv ? -2.41 : -2.26;
    const headZ = spec.suv ? 2.48 : 2.3;
    const hw = spec.suv ? 0.8 : 0.68;

    const headParts = [];
    const tailParts = [];
    const chromeParts = [];

    for (const sx of [-hw, hw]) {
        const hl = new THREE.BoxGeometry(0.34, 0.12, 0.08);
        hl.translate(sx * 0.88, spec.suv ? 0.74 : 0.58, headZ);
        headParts.push(hl);

        const tl = spec.suv ? new THREE.BoxGeometry(0.09, 0.54, 0.12) : new THREE.BoxGeometry(0.42, 0.12, 0.08);
        tl.translate(sx * (spec.suv ? 1.02 : 0.98), spec.suv ? 0.86 : 0.68, tailZ);
        tailParts.push(tl);

        const pipe = new THREE.CylinderGeometry(0.044, 0.044, 0.2, 10);
        pipe.rotateX(Math.PI * 0.5);
        pipe.translate(sx * 0.78, 0.25, tailZ - 0.04);
        chromeParts.push(pipe);
    }

    const trim = new THREE.BoxGeometry(spec.suv ? 1.48 : 1.18, 0.045, 0.05);
    trim.translate(0, spec.suv ? 0.72 : 0.62, tailZ - 0.04);
    chromeParts.push(trim);

    if (spec.suv) {
        const rw = new THREE.PlaneGeometry(1.42, 0.52);
        rw.rotateY(Math.PI);
        rw.rotateX(-0.22);
        rw.translate(0, 1.24, tailZ + 0.04);
        glassParts.push(rw);
        for (const rx of [-0.72, 0.72]) {
            const rail = new THREE.CylinderGeometry(0.022, 0.022, 2.0, 6);
            rail.rotateX(Math.PI * 0.5);
            rail.translate(rx, 1.7, -0.4);
            chromeParts.push(rail);
        }
    }

    const glassMerged = mergeGeometries(
        glassParts.map((g) => normalizeGeoForMerge(g, new THREE.Matrix4(), false)),
        false
    );
    for (const g of glassParts) g.dispose();
    if (glassMerged) bodyRoot.add(new THREE.Mesh(glassMerged, glassMat));

    const headMerged = mergeGeometries(headParts, false);
    for (const g of headParts) g.dispose();
    if (headMerged) bodyRoot.add(new THREE.Mesh(headMerged, headMat));

    const tailMerged = mergeGeometries(tailParts, false);
    for (const g of tailParts) g.dispose();
    if (tailMerged) bodyRoot.add(new THREE.Mesh(tailMerged, tailMat));

    const chromeMerged = mergeGeometries(
        chromeParts.map((g) => normalizeGeoForMerge(g, new THREE.Matrix4(), false)),
        false
    );
    for (const g of chromeParts) g.dispose();
    if (chromeMerged) bodyRoot.add(new THREE.Mesh(chromeMerged, chromeMat));

    if (textures && textures.plate) {
        const plateMat = new THREE.MeshStandardMaterial({ map: textures.plate, roughness: 0.4, metalness: 0.12 });
        const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.2), plateMat);
        plate.position.set(0, spec.suv ? 0.56 : 0.5, tailZ - 0.06);
        plate.rotation.y = Math.PI;
        bodyRoot.add(plate);
    }

    return { bodyRoot, tailMat };
}

export function createVehicleVisual(presetKey, textures, colorOverride = null, attachWheels = false, assets = null) {
    const spec = VEHICLE_PRESETS[presetKey] || VEHICLE_PRESETS.elegy;
    const chassis = new THREE.Group();
    const paintHex = colorOverride ?? spec.paint;
    const ferrariGltf = !attachWheels && assets && assets.models ? assets.models.ferrari : null;
    const useFerrari = Boolean(ferrariGltf && !spec.suv);

    const built = useFerrari
        ? buildFerrariBody(spec, ferrariGltf, paintHex, textures)
        : buildSculptedBody(spec, paintHex, textures);
    chassis.add(built.bodyRoot);
    addContactShadow(chassis, spec);

    const wheels = buildWheelsForSpec(spec, assets, attachWheels);
    if (attachWheels) {
        const wy = -spec.restHeight + spec.wheelRadius;
        const offsets = [
            [-spec.halfTrack, wy, spec.halfWheelbase],
            [spec.halfTrack, wy, spec.halfWheelbase],
            [-spec.halfTrack, wy, -spec.halfWheelbase],
            [spec.halfTrack, wy, -spec.halfWheelbase]
        ];
        for (let i = 0; i < 4; i += 1) {
            wheels[i].position.set(offsets[i][0], offsets[i][1], offsets[i][2]);
            chassis.add(wheels[i]);
        }
    }

    const spinWheels = (distMeters) => {
        const dAngle = distMeters / Math.max(0.15, spec.wheelRadius);
        for (let i = 0; i < wheels.length; i += 1) {
            wheels[i].rotation.x += dAngle;
        }
    };

    const setBrakeGlow = (braking) => {
        if (built.tailMat) built.tailMat.emissiveIntensity = braking ? 4.4 : 1.55;
    };

    const dispose = (scene) => {
        if (scene) {
            scene.remove(chassis);
            if (!attachWheels) {
                for (const w of wheels) scene.remove(w);
            }
        }
    };

    return { chassis, wheels, restHeight: spec.restHeight, spinWheels, setBrakeGlow, dispose };
}
