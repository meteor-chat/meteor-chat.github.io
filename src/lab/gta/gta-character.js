import * as THREE from "three";
import { OCEAN_LEVEL, WORLD_HALF, heightAt } from "./gta-road-graph.js";

const WALK_SPEED = 4.6;
const SPRINT_SPEED = 8.4;
const GRAVITY = -22;
const JUMP_SPEED = 7.6;

export function createGtaCharacter(scene, spawn) {
    const root = new THREE.Group();
    const jacketMat = new THREE.MeshPhysicalMaterial({
        color: 0x16181e,
        roughness: 0.38,
        metalness: 0.12,
        clearcoat: 0.55,
        clearcoatRoughness: 0.35
    });
    const hoodMat = new THREE.MeshStandardMaterial({ color: 0xc92a2a, roughness: 0.78 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xa47454, roughness: 0.72 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1f2630, roughness: 0.84 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0xbcb3a4, roughness: 0.8 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.66, 0.3), jacketMat);
    torso.position.y = 1.15;
    torso.castShadow = true;
    root.add(torso);

    const hood = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.22), hoodMat);
    hood.position.set(0, 1.44, -0.11);
    root.add(hood);

    const backEmblem = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.04), hoodMat);
    backEmblem.position.set(0, 1.16, -0.15);
    root.add(backEmblem);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.28), skinMat);
    head.position.y = 1.66;
    head.castShadow = true;
    root.add(head);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.31), capMat);
    cap.position.set(0, 1.78, -0.01);
    root.add(cap);

    const armGeo = new THREE.BoxGeometry(0.16, 0.58, 0.18);
    armGeo.translate(0, -0.24, 0);
    const armL = new THREE.Mesh(armGeo, jacketMat);
    armL.position.set(-0.36, 1.42, 0);
    armL.castShadow = true;
    const armR = new THREE.Mesh(armGeo, jacketMat);
    armR.position.set(0.36, 1.42, 0);
    armR.castShadow = true;
    root.add(armL, armR);

    const legGeo = new THREE.BoxGeometry(0.2, 0.72, 0.22);
    legGeo.translate(0, -0.36, 0);
    const legL = new THREE.Mesh(legGeo, pantsMat);
    legL.position.set(-0.14, 0.82, 0);
    legL.castShadow = true;
    const legR = new THREE.Mesh(legGeo, pantsMat);
    legR.position.set(0.14, 0.82, 0);
    legR.castShadow = true;
    root.add(legL, legR);

    const shoeGeo = new THREE.BoxGeometry(0.21, 0.12, 0.3);
    const shoeL = new THREE.Mesh(shoeGeo, shoeMat);
    shoeL.position.set(0, -0.7, 0.04);
    legL.add(shoeL);
    const shoeR = new THREE.Mesh(shoeGeo, shoeMat);
    shoeR.position.set(0, -0.7, 0.04);
    legR.add(shoeR);

    scene.add(root);

    const state = {
        pos: new THREE.Vector3(spawn.x, spawn.y, spawn.z),
        velY: 0,
        yaw: 0,
        onGround: true,
        stridePhase: 0,
        visible: true,
        moving: false
    };

    const setVisible = (v) => {
        state.visible = v;
        root.visible = v;
    };

    const place = (x, y, z, yaw = 0) => {
        state.pos.set(x, y, z);
        state.velY = 0;
        state.yaw = yaw;
        state.onGround = true;
        root.position.copy(state.pos);
        root.rotation.y = yaw;
    };

    const update = (dt, input, camYaw, world) => {
        if (!state.visible) return;
        const stepDt = Math.min(0.05, Math.max(0.001, dt));
        const forward = (input.forward ? 1 : 0) - (input.backward ? 1 : 0);
        const strafe = (input.right ? 1 : 0) - (input.left ? 1 : 0);
        const len = Math.hypot(forward, strafe);
        const speed = input.sprint ? SPRINT_SPEED : WALK_SPEED;

        let dx = 0;
        let dz = 0;
        if (len > 0.01) {
            const nf = forward / len;
            const ns = strafe / len;
            const sinY = Math.sin(camYaw);
            const cosY = Math.cos(camYaw);
            const wx = sinY * nf - cosY * ns;
            const wz = cosY * nf + sinY * ns;
            dx = wx * speed * stepDt;
            dz = wz * speed * stepDt;
            const targetYaw = Math.atan2(wx, wz);
            let diff = (targetYaw - state.yaw + Math.PI * 3) % (Math.PI * 2) - Math.PI;
            state.yaw += diff * Math.min(1, stepDt * 12);
            state.moving = true;
        } else {
            state.moving = false;
        }

        if (dx !== 0 || dz !== 0) {
            const moveLen = Math.hypot(dx, dz);
            const rayHit = world.castRay(
                { x: state.pos.x, y: state.pos.y + 0.9, z: state.pos.z },
                { x: dx / moveLen, y: 0, z: dz / moveLen },
                moveLen + 0.55
            );
            if (!rayHit) {
                state.pos.x = Math.max(-WORLD_HALF + 12, Math.min(WORLD_HALF - 12, state.pos.x + dx));
                state.pos.z = Math.max(-WORLD_HALF + 12, Math.min(WORLD_HALF - 12, state.pos.z + dz));
            }
        }

        if (input.jump && state.onGround) {
            state.velY = JUMP_SPEED;
            state.onGround = false;
        }
        state.velY += GRAVITY * stepDt;
        state.pos.y += state.velY * stepDt;

        let groundY = Math.max(OCEAN_LEVEL + 0.1, heightAt(state.pos.x, state.pos.z));
        const downHit = world.castRay(
            { x: state.pos.x, y: state.pos.y + 1.2, z: state.pos.z },
            { x: 0, y: -1, z: 0 },
            2.6
        );
        if (downHit && downHit.point.y > groundY - 0.1 && downHit.point.y <= state.pos.y + 0.75) {
            groundY = downHit.point.y;
        }
        if (state.pos.y <= groundY) {
            state.pos.y = groundY;
            state.velY = 0;
            state.onGround = true;
        }

        if (state.moving) {
            state.stridePhase += stepDt * (input.sprint ? 12.5 : 8.5);
        } else {
            state.stridePhase *= Math.max(0, 1 - stepDt * 10);
        }
        const swing = state.moving ? Math.sin(state.stridePhase) * (input.sprint ? 0.85 : 0.55) : 0;
        legL.rotation.x = swing;
        legR.rotation.x = -swing;
        armL.rotation.x = -swing * 0.8;
        armR.rotation.x = swing * 0.8;

        root.position.copy(state.pos);
        root.rotation.y = state.yaw;
    };

    const dispose = () => {
        root.traverse((obj) => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        });
        scene.remove(root);
    };

    place(spawn.x, spawn.y, spawn.z, 0);
    return { root, state, setVisible, place, update, dispose };
}
