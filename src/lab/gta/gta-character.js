import * as THREE from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { computeCameraRelativeMove, dampAngle } from "./gta-camera-math.js";
import { WORLD_HALF, heightAt } from "./gta-road-graph.js";

function canMoveStep(world, pos, dx, dz) {
    const dist = Math.hypot(dx, dz);
    if (dist <= 0.0005 || !world) return true;
    const ux = dx / dist;
    const uz = dz / dist;
    const px = -uz * 0.28;
    const pz = ux * 0.28;
    const reach = dist + 0.42;
    const probes = [
        [0, 0.55, 0],
        [0, 1.25, 0],
        [px, 0.85, pz],
        [-px, 0.85, -pz]
    ];
    for (let i = 0; i < probes.length; i += 1) {
        const [ox, oy, oz] = probes[i];
        const hit = world.castRay(
            { x: pos.x + ox, y: pos.y + oy, z: pos.z + oz },
            { x: ux, y: 0, z: uz },
            reach
        );
        if (hit) return false;
    }
    return true;
}

function buildSmoothFallbackCharacter() {
    const group = new THREE.Group();
    const jacketMat = new THREE.MeshStandardMaterial({ color: 0x1a1f28, roughness: 0.78 });
    const hoodMat = new THREE.MeshStandardMaterial({ color: 0xb82828, roughness: 0.82 });
    const jeansMat = new THREE.MeshStandardMaterial({ color: 0x202c3d, roughness: 0.84 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd6a47f, roughness: 0.72 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0xeef2f6, roughness: 0.55 });

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.21, 0.44, 6, 12), jacketMat);
    torso.position.y = 1.18;
    torso.scale.set(1.18, 1, 0.72);
    torso.castShadow = true;
    group.add(torso);

    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), hoodMat);
    hood.position.set(0, 1.44, -0.1);
    hood.scale.set(1.1, 0.7, 1.0);
    group.add(hood);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.135, 14, 12), skinMat);
    head.position.y = 1.66;
    head.castShadow = true;
    group.add(head);

    const leftArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.48, 5, 10), jacketMat);
    leftArm.position.set(-0.3, 1.16, 0);
    leftArm.castShadow = true;
    const rightArm = leftArm.clone();
    rightArm.position.x = 0.3;
    group.add(leftArm, rightArm);

    const leftLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.088, 0.62, 5, 10), jeansMat);
    leftLeg.position.set(-0.12, 0.46, 0);
    leftLeg.castShadow = true;
    const rightLeg = leftLeg.clone();
    rightLeg.position.x = 0.12;
    group.add(leftLeg, rightLeg);

    const shoeL = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.14, 5, 8), shoeMat);
    shoeL.rotation.x = Math.PI * 0.5;
    shoeL.position.set(-0.12, 0.07, 0.05);
    const shoeR = shoeL.clone();
    shoeR.position.x = 0.12;
    group.add(shoeL, shoeR);

    return { group, leftArm, rightArm, leftLeg, rightLeg };
}

export function createGtaCharacter(scene, spawn = { x: 0, y: 12.6, z: -304 }, assets = null) {
    const root = new THREE.Group();
    root.position.set(spawn.x, spawn.y, spawn.z);

    let mixer = null;
    let actions = null;
    let activeClip = "Idle";
    let fallbackRig = null;

    const soldierGltf = assets && assets.models ? assets.models.soldier : null;
    if (soldierGltf && soldierGltf.scene) {
        const model = SkeletonUtils.clone(soldierGltf.scene);
        model.rotation.y = Math.PI;
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        root.add(model);

        if (soldierGltf.animations && soldierGltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            actions = {};
            for (const clip of soldierGltf.animations) {
                actions[clip.name] = mixer.clipAction(clip);
            }
            if (actions.Idle) {
                actions.Idle.play();
                activeClip = "Idle";
            }
        }
    } else {
        fallbackRig = buildSmoothFallbackCharacter();
        root.add(fallbackRig.group);
    }

    scene.add(root);

    const state = {
        pos: new THREE.Vector3(spawn.x, spawn.y, spawn.z),
        vel: new THREE.Vector3(),
        yaw: 0,
        grounded: true,
        walkPhase: 0,
        visible: true
    };

    const switchAnim = (nextName) => {
        if (!actions || activeClip === nextName || !actions[nextName]) return;
        const prev = actions[activeClip];
        const next = actions[nextName];
        next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();
        if (prev) prev.crossFadeTo(next, 0.22, false);
        activeClip = nextName;
    };

    const setVisible = (v) => {
        state.visible = v;
        root.visible = v;
    };

    const place = (x, y, z, yaw = 0) => {
        state.pos.set(x, y, z);
        state.vel.set(0, 0, 0);
        state.yaw = yaw;
        state.grounded = true;
        root.position.copy(state.pos);
        root.rotation.y = yaw;
    };

    const update = (dt, input, cameraYaw, world) => {
        if (!state.visible) return;
        const fwd = (input.forward ? 1 : 0) - (input.backward ? 1 : 0);
        const side = (input.right ? 1 : 0) - (input.left ? 1 : 0);
        const sprint = Boolean(input.sprint);
        const speed = sprint ? 9.8 : 4.9;
        const mv = computeCameraRelativeMove(fwd, side, cameraYaw, speed);
        const moveMag = mv.moveMag;
        const mx = mv.mx;
        const mz = mv.mz;
        if (mv.desiredYaw !== null) {
            state.yaw = dampAngle(state.yaw, mv.desiredYaw, 14, dt);
        }

        const stepX = mx * dt;
        const stepZ = mz * dt;
        if (canMoveStep(world, state.pos, stepX, stepZ)) {
            state.pos.x += stepX;
            state.pos.z += stepZ;
        } else {
            if (Math.abs(stepX) > 0.0005 && canMoveStep(world, state.pos, stepX, 0)) {
                state.pos.x += stepX;
            }
            if (Math.abs(stepZ) > 0.0005 && canMoveStep(world, state.pos, 0, stepZ)) {
                state.pos.z += stepZ;
            }
        }

        state.pos.x = Math.max(-WORLD_HALF + 8, Math.min(WORLD_HALF - 8, state.pos.x));
        state.pos.z = Math.max(-WORLD_HALF + 8, Math.min(WORLD_HALF - 8, state.pos.z));

        if (input.jump && state.grounded) {
            state.vel.y = 6.8;
            state.grounded = false;
        }
        state.vel.y -= 19.6 * dt;
        state.pos.y += state.vel.y * dt;

        let groundY = heightAt(state.pos.x, state.pos.z);
        if (world) {
            const downHit = world.castRay(
                { x: state.pos.x, y: state.pos.y + 1.4, z: state.pos.z },
                { x: 0, y: -1, z: 0 },
                4.2
            );
            if (downHit && downHit.point.y > groundY - 0.5) {
                groundY = Math.max(groundY, downHit.point.y);
            }
        }
        if (state.pos.y <= groundY + 0.02) {
            state.pos.y = groundY + 0.02;
            state.vel.y = 0;
            state.grounded = true;
        }

        root.position.copy(state.pos);
        root.rotation.y = state.yaw;

        if (mixer) {
            const targetClip = moveMag < 0.05 ? "Idle" : sprint ? "Run" : "Walk";
            switchAnim(targetClip);
            mixer.update(dt);
        } else if (fallbackRig) {
            if (moveMag > 0.05 && state.grounded) {
                state.walkPhase += dt * (sprint ? 12.5 : 8.2);
                const swing = Math.sin(state.walkPhase) * (sprint ? 0.65 : 0.4);
                fallbackRig.leftLeg.rotation.x = swing;
                fallbackRig.rightLeg.rotation.x = -swing;
                fallbackRig.leftArm.rotation.x = -swing * 0.8;
                fallbackRig.rightArm.rotation.x = swing * 0.8;
            } else {
                fallbackRig.leftLeg.rotation.x *= 0.84;
                fallbackRig.rightLeg.rotation.x *= 0.84;
                fallbackRig.leftArm.rotation.x *= 0.84;
                fallbackRig.rightArm.rotation.x *= 0.84;
            }
        }
    };

    const dispose = () => {
        if (mixer) mixer.stopAllAction();
        scene.remove(root);
    };

    return { root, state, setVisible, place, update, dispose };
}
