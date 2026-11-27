import * as THREE from "three";
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

function extractFerrariWheelTemplate(ferrariGltf, wheelName) {
    if (!ferrariGltf || !ferrariGltf.scene) return null;
    const node = ferrariGltf.scene.getObjectByName(wheelName);
    if (!node) return null;
    const clone = node.clone(true);
    clone.position.set(0, 0, 0);
    clone.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    const pivot = new THREE.Group();
    pivot.add(clone);
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
        metalness: 0.15,
        roughness: 0.04,
        transmission: 0.35,
        transparent: true,
        opacity: 0.78,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        envMapIntensity: 2.0
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
        child.castShadow = mName === "Body_Color" || child.name === "body" || mName === "Tires";
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

    clone.rotation.y = Math.PI;
    clone.position.set(0, -spec.restHeight + 0.04, 0.17);
    bodyRoot.add(clone);

    if (textures && textures.plate) {
        const plateMat = new THREE.MeshStandardMaterial({ map: textures.plate, roughness: 0.38, metalness: 0.15 });
        const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.2), plateMat);
        plate.position.set(0, -spec.restHeight + 0.56, -2.14);
        plate.rotation.y = Math.PI;
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
    const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x0a1320,
        metalness: 0.22,
        roughness: 0.04,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        envMapIntensity: 2.0
    });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe8eef5, metalness: 0.96, roughness: 0.1 });
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

    const glassMesh = new THREE.Mesh(glass, glassMat);
    bodyRoot.add(glassMesh);

    const tailZ = spec.suv ? -2.41 : -2.26;
    const headZ = spec.suv ? 2.48 : 2.3;
    const hw = spec.suv ? 0.8 : 0.68;

    for (const sx of [-hw, hw]) {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.08), headMat);
        hl.position.set(sx * 0.88, spec.suv ? 0.74 : 0.58, headZ);
        bodyRoot.add(hl);

        const tl = new THREE.Mesh(
            spec.suv ? new THREE.BoxGeometry(0.09, 0.54, 0.12) : new THREE.BoxGeometry(0.42, 0.12, 0.08),
            tailMat
        );
        tl.position.set(sx * (spec.suv ? 1.02 : 0.98), spec.suv ? 0.86 : 0.68, tailZ);
        bodyRoot.add(tl);

        const sign = Math.sign(sx);
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.2, 10), chromeMat);
        pipe.rotation.x = Math.PI * 0.5;
        pipe.position.set(sx * 0.78, 0.25, tailZ - 0.04);
        bodyRoot.add(pipe);

        const mirror = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), paintMat);
        mirror.scale.set(1.4, 0.65, 0.9);
        mirror.position.set(sign * (spec.suv ? 1.04 : 0.96), spec.suv ? 1.08 : 0.94, spec.suv ? 0.72 : 0.42);
        bodyRoot.add(mirror);
    }

    const chromeTrim = new THREE.Mesh(new THREE.BoxGeometry(spec.suv ? 1.48 : 1.18, 0.045, 0.05), chromeMat);
    chromeTrim.position.set(0, spec.suv ? 0.72 : 0.62, tailZ - 0.04);
    bodyRoot.add(chromeTrim);

    if (spec.suv) {
        const rearWindow = new THREE.Mesh(new THREE.PlaneGeometry(1.42, 0.52), glassMat);
        rearWindow.position.set(0, 1.24, tailZ + 0.04);
        rearWindow.rotation.set(-0.22, Math.PI, 0);
        bodyRoot.add(rearWindow);

        const railGeo = new THREE.CylinderGeometry(0.022, 0.022, 2.0, 6);
        railGeo.rotateX(Math.PI * 0.5);
        for (const rx of [-0.72, 0.72]) {
            const rail = new THREE.Mesh(railGeo, chromeMat);
            rail.position.set(rx, 1.7, -0.4);
            bodyRoot.add(rail);
        }
    }

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
