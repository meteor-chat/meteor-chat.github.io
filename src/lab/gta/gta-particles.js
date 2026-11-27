import * as THREE from "three";

const MAX_SMOKE = 140;
const MAX_SPARKS = 96;
const MAX_SKIDS = 200;
const RAIN_COUNT = 260;

export function createGtaParticles(scene) {
    const dummy = new THREE.Object3D();

    const smokeGeo = new THREE.DodecahedronGeometry(0.45, 0);
    const smokeMat = new THREE.MeshStandardMaterial({
        color: 0xdbe2ea,
        roughness: 0.95,
        transparent: true,
        opacity: 0.48,
        depthWrite: false
    });
    const smokeInst = new THREE.InstancedMesh(smokeGeo, smokeMat, MAX_SMOKE);
    smokeInst.frustumCulled = false;
    smokeInst.visible = false;
    scene.add(smokeInst);

    const smokePool = Array.from({ length: MAX_SMOKE }, () => ({
        x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 1, scale: 0.4
    }));
    let smokeCursor = 0;
    let activeSmoke = 0;

    const sparkGeo = new THREE.BoxGeometry(0.08, 0.08, 0.34);
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffb74d });
    const sparkInst = new THREE.InstancedMesh(sparkGeo, sparkMat, MAX_SPARKS);
    sparkInst.frustumCulled = false;
    sparkInst.visible = false;
    scene.add(sparkInst);

    const sparkPool = Array.from({ length: MAX_SPARKS }, () => ({
        x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 0.4
    }));
    let sparkCursor = 0;
    let activeSparks = 0;

    const skidGeo = new THREE.PlaneGeometry(0.32, 0.95);
    skidGeo.rotateX(-Math.PI * 0.5);
    const skidMat = new THREE.MeshBasicMaterial({
        color: 0x090b0f,
        transparent: true,
        opacity: 0.52,
        depthWrite: false
    });
    const skidInst = new THREE.InstancedMesh(skidGeo, skidMat, MAX_SKIDS);
    skidInst.frustumCulled = false;
    skidInst.visible = false;
    scene.add(skidInst);
    let skidCursor = 0;

    const rainGeo = new THREE.BoxGeometry(0.025, 1.35, 0.025);
    const rainMat = new THREE.MeshBasicMaterial({
        color: 0xb8dcff,
        transparent: true,
        opacity: 0.35,
        depthWrite: false
    });
    const rainInst = new THREE.InstancedMesh(rainGeo, rainMat, RAIN_COUNT);
    rainInst.frustumCulled = false;
    rainInst.visible = false;
    scene.add(rainInst);
    const rainDrops = Array.from({ length: RAIN_COUNT }, () => ({
        ox: (Math.random() - 0.5) * 58,
        oy: Math.random() * 28,
        oz: (Math.random() - 0.5) * 58,
        speed: 24 + Math.random() * 10
    }));

    const hideAll = (inst, count) => {
        dummy.position.set(0, -999, 0);
        dummy.scale.set(0.001, 0.001, 0.001);
        dummy.updateMatrix();
        for (let i = 0; i < count; i += 1) inst.setMatrixAt(i, dummy.matrix);
        inst.instanceMatrix.needsUpdate = true;
    };
    hideAll(smokeInst, MAX_SMOKE);
    hideAll(sparkInst, MAX_SPARKS);
    hideAll(skidInst, MAX_SKIDS);

    const spawnTireSmoke = (x, y, z, yaw = 0) => {
        const p = smokePool[smokeCursor % MAX_SMOKE];
        smokeCursor += 1;
        p.x = x + (Math.random() - 0.5) * 0.25;
        p.y = y + 0.18;
        p.z = z + (Math.random() - 0.5) * 0.25;
        p.vx = (Math.random() - 0.5) * 1.4 - Math.sin(yaw) * 0.8;
        p.vy = 0.7 + Math.random() * 1.1;
        p.vz = (Math.random() - 0.5) * 1.4 - Math.cos(yaw) * 0.8;
        p.maxLife = 0.65 + Math.random() * 0.45;
        p.life = p.maxLife;
        p.scale = 0.45 + Math.random() * 0.35;
        activeSmoke = MAX_SMOKE;
        smokeInst.visible = true;
    };

    const spawnSkid = (x, y, z, yaw) => {
        const idx = skidCursor % MAX_SKIDS;
        skidCursor += 1;
        dummy.position.set(x, y + 0.095, z);
        dummy.rotation.set(0, yaw, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        skidInst.setMatrixAt(idx, dummy.matrix);
        skidInst.instanceMatrix.needsUpdate = true;
        skidInst.visible = true;
    };

    const spawnSparks = (x, y, z, count = 14) => {
        for (let i = 0; i < count; i += 1) {
            const p = sparkPool[sparkCursor % MAX_SPARKS];
            sparkCursor += 1;
            const ang = Math.random() * Math.PI * 2;
            const sp = 3 + Math.random() * 7;
            p.x = x;
            p.y = y + 0.45;
            p.z = z;
            p.vx = Math.cos(ang) * sp;
            p.vy = 2.5 + Math.random() * 5.2;
            p.vz = Math.sin(ang) * sp;
            p.maxLife = 0.25 + Math.random() * 0.28;
            p.life = p.maxLife;
        }
        activeSparks = MAX_SPARKS;
        sparkInst.visible = true;
    };

    const update = (dt, focusPos, rainIntensity = 0) => {
        const d = Math.min(0.05, Math.max(0.001, dt));

        if (activeSmoke > 0) {
            let alive = 0;
            for (let i = 0; i < MAX_SMOKE; i += 1) {
                const p = smokePool[i];
                if (p.life > 0) {
                    p.life -= d;
                    if (p.life > 0) {
                        alive += 1;
                        p.x += p.vx * d;
                        p.y += p.vy * d;
                        p.z += p.vz * d;
                        const progress = 1 - Math.max(0, p.life / p.maxLife);
                        const s = p.scale * (0.7 + progress * 2.1) * Math.max(0.01, p.life / p.maxLife);
                        dummy.position.set(p.x, p.y, p.z);
                        dummy.rotation.set(progress * 2, progress * 1.4, 0);
                        dummy.scale.set(s, s, s);
                    } else {
                        dummy.position.set(0, -999, 0);
                        dummy.scale.set(0.001, 0.001, 0.001);
                    }
                    dummy.updateMatrix();
                    smokeInst.setMatrixAt(i, dummy.matrix);
                }
            }
            smokeInst.instanceMatrix.needsUpdate = true;
            activeSmoke = alive;
            if (alive === 0) smokeInst.visible = false;
        }

        if (activeSparks > 0) {
            let alive = 0;
            for (let i = 0; i < MAX_SPARKS; i += 1) {
                const p = sparkPool[i];
                if (p.life > 0) {
                    p.life -= d;
                    if (p.life > 0) {
                        alive += 1;
                        p.vy -= 18 * d;
                        p.x += p.vx * d;
                        p.y += p.vy * d;
                        p.z += p.vz * d;
                        const s = Math.max(0.05, p.life / p.maxLife);
                        dummy.position.set(p.x, p.y, p.z);
                        dummy.rotation.set(0, Math.atan2(p.vx, p.vz), 0);
                        dummy.scale.set(s, s, s * 1.6);
                    } else {
                        dummy.position.set(0, -999, 0);
                        dummy.scale.set(0.001, 0.001, 0.001);
                    }
                    dummy.updateMatrix();
                    sparkInst.setMatrixAt(i, dummy.matrix);
                }
            }
            sparkInst.instanceMatrix.needsUpdate = true;
            activeSparks = alive;
            if (alive === 0) sparkInst.visible = false;
        }

        rainInst.visible = rainIntensity > 0.05 && Boolean(focusPos);
        if (rainInst.visible) {
            rainMat.opacity = Math.min(0.45, rainIntensity * 0.45);
            for (let i = 0; i < RAIN_COUNT; i += 1) {
                const r = rainDrops[i];
                r.oy -= r.speed * d;
                if (r.oy < -2) {
                    r.oy = 24 + Math.random() * 8;
                    r.ox = (Math.random() - 0.5) * 58;
                    r.oz = (Math.random() - 0.5) * 58;
                }
                dummy.position.set(focusPos.x + r.ox, focusPos.y + r.oy, focusPos.z + r.oz);
                dummy.rotation.set(0.14, 0, 0.08);
                dummy.scale.set(1, 1, 1);
                dummy.updateMatrix();
                rainInst.setMatrixAt(i, dummy.matrix);
            }
            rainInst.instanceMatrix.needsUpdate = true;
        }
    };

    const dispose = () => {
        for (const inst of [smokeInst, sparkInst, skidInst, rainInst]) {
            inst.geometry.dispose();
            inst.material.dispose();
            scene.remove(inst);
        }
    };

    return { spawnTireSmoke, spawnSkid, spawnSparks, update, dispose };
}
