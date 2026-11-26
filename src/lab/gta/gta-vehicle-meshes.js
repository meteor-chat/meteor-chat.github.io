import * as THREE from "three";
import { VEHICLE_PRESETS } from "./gta-vehicle-specs.js";

function buildWheelMesh(radius, width) {
    const group = new THREE.Group();
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x16181d, roughness: 0.86, metalness: 0.08 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.24, metalness: 0.88 });
    const hubMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.7 });

    const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 18);
    tireGeo.rotateZ(Math.PI * 0.5);
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.castShadow = true;
    group.add(tire);

    const rimGeo = new THREE.CylinderGeometry(radius * 0.64, radius * 0.64, width + 0.02, 12);
    rimGeo.rotateZ(Math.PI * 0.5);
    group.add(new THREE.Mesh(rimGeo, rimMat));

    const spokeGeo = new THREE.BoxGeometry(width + 0.03, radius * 1.12, 0.06);
    for (let s = 0; s < 3; s += 1) {
        const spoke = new THREE.Mesh(spokeGeo, hubMat);
        spoke.rotation.x = (s * Math.PI) / 3;
        group.add(spoke);
    }
    return group;
}

export function createVehicleVisual(presetKey, textures, colorOverride = null, attachWheels = false) {
    const spec = VEHICLE_PRESETS[presetKey] || VEHICLE_PRESETS.elegy;
    const chassis = new THREE.Group();
    const bodyRoot = new THREE.Group();
    bodyRoot.position.y = -spec.restHeight + 0.32;
    chassis.add(bodyRoot);

    const hw = spec.halfExtents[0];
    const hl = spec.halfExtents[2];
    const paintHex = colorOverride ?? spec.paint;

    const paintMat = new THREE.MeshPhysicalMaterial({
        color: paintHex,
        metalness: 0.88,
        roughness: 0.16,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
        envMapIntensity: 1.7
    });
    const trimMat = new THREE.MeshStandardMaterial({
        color: spec.secondary,
        metalness: 0.45,
        roughness: 0.32
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x0b1526,
        metalness: 0.24,
        roughness: 0.05,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
        envMapIntensity: 1.85
    });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.96, roughness: 0.12 });
    const headMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        emissive: 0xfff4d6,
        emissiveIntensity: 2.2
    });
    const tailMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xff1e24,
        emissiveIntensity: 1.8
    });

    const lowerH = spec.suv ? 0.62 : 0.44;
    const lower = new THREE.Mesh(new THREE.BoxGeometry(hw * 1.94, lowerH, hl * 1.92), paintMat);
    lower.position.set(0, lowerH * 0.5 + 0.1, 0);
    lower.castShadow = true;
    lower.receiveShadow = true;
    bodyRoot.add(lower);

    const shoulder = new THREE.Mesh(new THREE.BoxGeometry(hw * 1.84, 0.14, hl * 1.78), paintMat);
    shoulder.position.set(0, lowerH + 0.11, -0.02);
    shoulder.castShadow = true;
    bodyRoot.add(shoulder);

    const bumperMat = new THREE.MeshStandardMaterial({ color: 0x101319, roughness: 0.55, metalness: 0.28 });
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(hw * 2.0, 0.13, hl * 2.0), bumperMat);
    skirt.position.set(0, 0.13, 0);
    bodyRoot.add(skirt);

    const splitter = new THREE.Mesh(new THREE.BoxGeometry(hw * 1.96, 0.07, 0.34), bumperMat);
    splitter.position.set(0, 0.08, hl * 0.94);
    bodyRoot.add(splitter);

    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(hw * 1.78, 0.16, 0.24), bumperMat);
    diffuser.position.set(0, 0.14, -hl * 0.94);
    bodyRoot.add(diffuser);

    const grille = new THREE.Mesh(new THREE.BoxGeometry(hw * 1.24, lowerH * 0.48, 0.08), bumperMat);
    grille.position.set(0, lowerH * 0.42 + 0.1, hl * 0.96);
    bodyRoot.add(grille);

    const hood = new THREE.Mesh(new THREE.BoxGeometry(hw * 1.74, 0.14, hl * 0.72), paintMat);
    hood.position.set(0, lowerH + 0.14, hl * 0.54);
    hood.rotation.x = 0.11;
    hood.castShadow = true;
    bodyRoot.add(hood);

    const cabinH = spec.suv ? 0.62 : 0.42;
    const cabinL = spec.suv ? hl * 1.32 : hl * 0.88;
    const cabinZ = spec.suv ? -0.18 : -0.16;
    const cabinW = hw * (spec.suv ? 1.66 : 1.46);
    const cabinMat = spec.police ? trimMat : paintMat;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(cabinW, cabinH, cabinL), cabinMat);
    cabin.position.set(0, lowerH + cabinH * 0.5 + 0.12, cabinZ);
    cabin.castShadow = true;
    bodyRoot.add(cabin);

    const roofCap = new THREE.Mesh(new THREE.BoxGeometry(cabinW * 0.88, 0.07, cabinL * 0.82), cabinMat);
    roofCap.position.set(0, lowerH + cabinH + 0.14, cabinZ - 0.02);
    bodyRoot.add(roofCap);

    if (spec.police) {
        const doorStripe = new THREE.Mesh(new THREE.BoxGeometry(hw * 1.98, lowerH * 0.94, hl * 0.86), trimMat);
        doorStripe.position.set(0, lowerH * 0.5 + 0.1, -0.05);
        bodyRoot.add(doorStripe);
    }

    const glassInset = new THREE.Mesh(new THREE.BoxGeometry(cabinW + 0.03, cabinH * 0.74, cabinL * 0.86), glassMat);
    glassInset.position.set(0, lowerH + cabinH * 0.5 + 0.12, cabinZ);
    bodyRoot.add(glassInset);

    const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(cabinW * 0.94, cabinH * 0.88, 0.1), glassMat);
    frontGlass.position.set(0, lowerH + cabinH * 0.48 + 0.1, cabinZ + cabinL * 0.56);
    frontGlass.rotation.x = -0.62;
    bodyRoot.add(frontGlass);

    const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(cabinW * 0.92, cabinH * 0.92, 0.1), glassMat);
    rearGlass.position.set(0, lowerH + cabinH * 0.48 + 0.1, cabinZ - cabinL * 0.56);
    rearGlass.rotation.x = spec.suv ? 0.14 : 0.62;
    bodyRoot.add(rearGlass);

    for (const sx of [-hw * 0.98, hw * 0.98]) {
        const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.14), paintMat);
        mirror.position.set(sx, lowerH + 0.22, cabinZ + cabinL * 0.36);
        bodyRoot.add(mirror);
    }

    if (spec.spoiler) {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(hw * 1.82, 0.06, 0.28), paintMat);
        wing.position.set(0, lowerH + 0.32, -hl * 0.88);
        wing.castShadow = true;
        bodyRoot.add(wing);
        for (const sx of [-hw * 0.56, hw * 0.56]) {
            const strut = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.22, 0.16), bumperMat);
            strut.position.set(sx, lowerH + 0.2, -hl * 0.86);
            bodyRoot.add(strut);
        }
    }

    for (const sx of [-hw * 0.62, hw * 0.62]) {
        const hlMesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.13, 0.08), headMat);
        hlMesh.position.set(sx, lowerH * 0.66 + 0.12, hl * 0.97);
        bodyRoot.add(hlMesh);

        if (spec.key === "elegy") {
            const sign = Math.sign(sx);
            for (const off of [0, -0.22 * sign]) {
                const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.08, 12), tailMat);
                ring.rotation.x = Math.PI * 0.5;
                ring.position.set(sx + off, lowerH * 0.72 + 0.12, -hl * 0.96);
                bodyRoot.add(ring);
            }
        } else {
            const tlMesh = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.12, 0.08), tailMat);
            tlMesh.position.set(sx, lowerH * 0.72 + 0.12, -hl * 0.97);
            bodyRoot.add(tlMesh);
        }

        const sign = Math.sign(sx);
        for (const pOff of [0, -0.14 * sign]) {
            const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.22, 8), chromeMat);
            pipe.rotation.x = Math.PI * 0.5;
            pipe.position.set(sx * 0.9 + pOff, 0.14, -hl * 0.98);
            bodyRoot.add(pipe);
        }
    }

    if (textures && textures.plate) {
        const plateMat = new THREE.MeshStandardMaterial({ map: textures.plate, roughness: 0.45 });
        const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.22), plateMat);
        plate.position.set(0, lowerH * 0.46 + 0.1, -hl * 0.99);
        plate.rotation.y = Math.PI;
        bodyRoot.add(plate);
    }

    let sirenRedMat = null;
    let sirenBlueMat = null;
    let sirenLight = null;
    if (spec.police) {
        const barY = lowerH + cabinH + 0.12;
        sirenRedMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xff1122, emissiveIntensity: 0.2 });
        sirenBlueMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x1d6bff, emissiveIntensity: 0.2 });
        const redBar = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.14, 0.24), sirenRedMat);
        redBar.position.set(-0.3, barY, cabinZ + 0.05);
        const blueBar = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.14, 0.24), sirenBlueMat);
        blueBar.position.set(0.3, barY, cabinZ + 0.05);
        bodyRoot.add(redBar, blueBar);
        sirenLight = new THREE.PointLight(0xef4444, 0, 22, 1.8);
        sirenLight.position.set(0, barY + 0.5, cabinZ);
        bodyRoot.add(sirenLight);
    }

    const wheels = [0, 1, 2, 3].map(() => buildWheelMesh(spec.wheelRadius, spec.wheelWidth));
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
        tailMat.emissiveIntensity = braking ? 4.4 : 1.35;
    };

    const setSiren = (active, timeSec) => {
        if (!sirenRedMat || !sirenBlueMat || !sirenLight) return;
        if (!active) {
            sirenRedMat.emissiveIntensity = 0.2;
            sirenBlueMat.emissiveIntensity = 0.2;
            sirenLight.intensity = 0;
            return;
        }
        const flashRed = Math.floor(timeSec * 8) % 2 === 0;
        sirenRedMat.emissiveIntensity = flashRed ? 6.5 : 0.3;
        sirenBlueMat.emissiveIntensity = flashRed ? 0.3 : 6.5;
        sirenLight.color.setHex(flashRed ? 0xff2233 : 0x2277ff);
        sirenLight.intensity = 16;
    };

    const dispose = (scene) => {
        const clearObj = (obj) => {
            obj.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
                else if (child.material) child.material.dispose();
            });
            if (scene) scene.remove(obj);
        };
        clearObj(chassis);
        if (!attachWheels) {
            for (const w of wheels) clearObj(w);
        }
    };

    return { chassis, wheels, restHeight: spec.restHeight, spinWheels, setBrakeGlow, setSiren, dispose };
}
