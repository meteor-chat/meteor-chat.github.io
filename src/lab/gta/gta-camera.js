import * as THREE from "three";
import {
    CAMERA_MODES,
    computeCameraOffsets,
    computeDynamicFov,
    dampAngle,
    wrapAngle
} from "./gta-camera-math.js";

export function createGtaCamera(camera) {
    let modeIdx = 0;
    let followYaw = 0;
    let orbitYaw = 0;
    let orbitPitch = 0.08;
    let orbitIdle = 0;
    let shakePower = 0;
    const smoothPos = new THREE.Vector3(0, 15, -308);
    const smoothLook = new THREE.Vector3(0, 14, -295);
    const desiredPos = new THREE.Vector3();
    const desiredLook = new THREE.Vector3();

    const addOrbit = (dx, dy) => {
        orbitYaw = wrapAngle(orbitYaw - dx * 0.0042);
        orbitPitch = Math.max(-0.26, Math.min(0.55, orbitPitch + dy * 0.0032));
        orbitIdle = 0;
    };

    const addShake = (amount) => {
        shakePower = Math.min(0.65, shakePower + amount);
    };

    const cycleMode = () => {
        modeIdx = (modeIdx + 1) % CAMERA_MODES.length;
        return CAMERA_MODES[modeIdx];
    };

    const snap = (pos, yaw) => {
        followYaw = yaw;
        orbitYaw = 0;
        orbitPitch = 0.08;
        smoothPos.set(pos.x - Math.sin(yaw) * 4, pos.y + 2.2, pos.z - Math.cos(yaw) * 4);
        smoothLook.set(pos.x + Math.sin(yaw) * 6, pos.y + 1.4, pos.z + Math.cos(yaw) * 6);
        camera.position.copy(smoothPos);
        camera.lookAt(smoothLook);
    };

    const update = (dt, ctx) => {
        const stepDt = Math.min(0.05, Math.max(0.001, dt));
        const mode = CAMERA_MODES[modeIdx];
        const isDriving = Boolean(ctx.isDriving);
        const speed = ctx.speed || 0;
        const offsets = computeCameraOffsets(mode, isDriving);

        orbitIdle += stepDt;
        if (isDriving) {
            const targetYaw = ctx.targetYaw || 0;
            const followRate = speed > 2 ? 4.8 : 2.2;
            followYaw = dampAngle(followYaw, targetYaw, followRate, stepDt);
            if (orbitIdle > 1.8 && speed > 1.5) {
                orbitYaw = dampAngle(orbitYaw, 0, 3.2, stepDt);
                orbitPitch += (0.08 - orbitPitch) * Math.min(1, stepDt * 3.0);
            }
        } else {
            followYaw = wrapAngle(orbitYaw);
        }

        const viewYaw = isDriving ? wrapAngle(followYaw + orbitYaw) : followYaw;
        const sinY = Math.sin(viewYaw);
        const cosY = Math.cos(viewYaw);
        const rightX = -cosY;
        const rightZ = sinY;

        const pitchLift = Math.sin(orbitPitch) * offsets.back * 0.72;
        const tPos = ctx.targetPos;
        desiredPos.set(
            tPos.x - sinY * offsets.back + rightX * offsets.right,
            tPos.y + offsets.up + pitchLift,
            tPos.z - cosY * offsets.back + rightZ * offsets.right
        );

        if (ctx.world && offsets.back > 0.5) {
            const pivot = { x: tPos.x, y: tPos.y + 1.4, z: tPos.z };
            const dx = desiredPos.x - pivot.x;
            const dy = desiredPos.y - pivot.y;
            const dz = desiredPos.z - pivot.z;
            const dist = Math.hypot(dx, dy, dz);
            if (dist > 0.5) {
                const hit = ctx.world.castRay(pivot, { x: dx, y: dy, z: dz }, dist, {
                    ignoreBody: ctx.ignoreBody || null
                });
                if (hit && hit.distance > 1.0 && hit.distance < dist - 0.35) {
                    const f = (hit.distance - 0.35) / dist;
                    desiredPos.set(pivot.x + dx * f, pivot.y + dy * f, pivot.z + dz * f);
                }
            }
        }

        desiredLook.set(
            tPos.x + sinY * offsets.lookAhead + rightX * offsets.right * 0.35,
            tPos.y + offsets.lookUp - orbitPitch * 1.4,
            tPos.z + cosY * offsets.lookAhead + rightZ * offsets.right * 0.35
        );

        const posLerp = mode === "hood" ? 1 : 1 - Math.exp(-(isDriving ? 11 : 14) * stepDt);
        const lookLerp = mode === "hood" ? 1 : 1 - Math.exp(-15 * stepDt);
        smoothPos.lerp(desiredPos, posLerp);
        smoothLook.lerp(desiredLook, lookLerp);

        if (shakePower > 0.002) {
            const sx = (Math.random() - 0.5) * shakePower;
            const sy = (Math.random() - 0.5) * shakePower * 0.7;
            smoothPos.x += sx;
            smoothPos.y += sy;
            shakePower *= Math.exp(-9 * stepDt);
        } else {
            shakePower = 0;
        }

        const targetFov = computeDynamicFov(62, speed, ctx.nitroActive, isDriving ? mode : "onFoot");
        if (Math.abs(camera.fov - targetFov) > 0.05) {
            camera.fov += (targetFov - camera.fov) * Math.min(1, stepDt * 6.5);
            camera.updateProjectionMatrix();
        }

        camera.position.copy(smoothPos);
        camera.lookAt(smoothLook);
        return viewYaw;
    };

    return {
        update,
        addOrbit,
        addShake,
        cycleMode,
        snap,
        getMode: () => CAMERA_MODES[modeIdx],
        getViewYaw: () => wrapAngle(followYaw + orbitYaw)
    };
}
