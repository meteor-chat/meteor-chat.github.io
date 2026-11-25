import { VILLAGER_HALF_WIDTH, VILLAGER_HEIGHT, stepMobPhysics } from "./voxel-mob-physics.js";

export const VILLAGER_STATE = Object.freeze({ IDLE: "idle", STROLL: "stroll", GREET: "greet" });

const STROLL_SPEED = 1.45;
const TURN_RATE = 5.5;
const STRIDE = 2.6;
const HOME_RADIUS = 22;
const DEFLECT_COOLDOWN = 0.45;
const TAU = Math.PI * 2;

const between = (rng, min, max) => min + rng() * (max - min);

function wrapAngle(a) {
    let v = a % TAU;
    if (v > Math.PI) v -= TAU;
    if (v < -Math.PI) v += TAU;
    return v;
}

export function createVillager(x, y, z, homeX, homeZ, rng = Math.random) {
    const yaw = rng() * TAU;
    return {
        kind: "villager",
        variant: "plains",
        pos: [x, y, z],
        vel: [0, 0, 0],
        homeX: homeX ?? x,
        homeZ: homeZ ?? z,
        hw: VILLAGER_HALF_WIDTH,
        h: VILLAGER_HEIGHT,
        yaw,
        targetYaw: yaw,
        phaseSeed: rng() * 100,
        deflectCooldown: 0,
        voiceCooldown: between(rng, 4, 10),
        onGround: false,
        inWater: false,
        blocked: false,
        state: VILLAGER_STATE.IDLE,
        timer: between(rng, 1.5, 4),
        speed: 0,
        anim: { phase: 0, moving: 0, headYaw: 0, nod: 0 }
    };
}

function enter(v, state, timer, speed) {
    v.state = state;
    v.timer = timer;
    v.speed = speed;
}

function chooseNext(v, rng, playerPos) {
    if (playerPos) {
        const dx = playerPos[0] - v.pos[0];
        const dz = playerPos[2] - v.pos[2];
        if (Math.hypot(dx, dz) < 5.5 && rng() < 0.45) {
            v.targetYaw = Math.atan2(dx, -dz);
            enter(v, VILLAGER_STATE.GREET, between(rng, 2.2, 4.2), 0);
            return;
        }
    }
    const homeDx = v.homeX - v.pos[0];
    const homeDz = v.homeZ - v.pos[2];
    const homeDist = Math.hypot(homeDx, homeDz);
    if (homeDist > HOME_RADIUS) {
        v.targetYaw = Math.atan2(homeDx, -homeDz) + (rng() - 0.5) * 0.5;
        enter(v, VILLAGER_STATE.STROLL, between(rng, 3, 5.5), STROLL_SPEED);
        return;
    }
    if (rng() < 0.6) {
        v.targetYaw = rng() * TAU;
        enter(v, VILLAGER_STATE.STROLL, between(rng, 2.5, 5.5), STROLL_SPEED);
    } else {
        enter(v, VILLAGER_STATE.IDLE, between(rng, 2, 4.5), 0);
    }
}

export function stepVillager(v, dt, ctx) {
    if (ctx.frozen) return;
    const stepDt = Math.min(0.05, Math.max(0.001, dt));
    v.timer -= stepDt;
    v.deflectCooldown = Math.max(0, (v.deflectCooldown || 0) - stepDt);
    v.voiceCooldown = Math.max(0, (v.voiceCooldown || 0) - stepDt);

    if (v.blocked && v.state === VILLAGER_STATE.STROLL && v.deflectCooldown <= 0) {
        const side = ctx.rng() < 0.5 ? -1 : 1;
        v.targetYaw = wrapAngle(v.yaw + side * (Math.PI * 0.55 + ctx.rng() * 0.8));
        v.deflectCooldown = DEFLECT_COOLDOWN;
    }
    if (v.timer <= 0) chooseNext(v, ctx.rng, ctx.playerPos);

    const diff = wrapAngle(v.targetYaw - v.yaw);
    const turn = Math.max(-TURN_RATE * stepDt, Math.min(TURN_RATE * stepDt, diff));
    v.yaw = wrapAngle(v.yaw + turn);

    const aligned = Math.max(0, Math.cos(wrapAngle(v.targetYaw - v.yaw)));
    const speed = v.speed * aligned;
    const sx = v.pos[0];
    const sz = v.pos[2];
    const res = stepMobPhysics(v, stepDt, Math.sin(v.yaw) * speed, -Math.cos(v.yaw) * speed, ctx.getBlock);
    const actualSpeed = Math.hypot(v.pos[0] - sx, v.pos[2] - sz) / stepDt;
    v.blocked = res.blocked && speed > 0;

    const anim = v.anim;
    const moveTarget = actualSpeed > 0.08 ? 1 : 0;
    anim.moving += (moveTarget - anim.moving) * Math.min(1, 9 * stepDt);
    anim.phase = (anim.phase + actualSpeed * STRIDE * stepDt) % (TAU * 100);

    let lookTarget = 0;
    if (ctx.playerPos) {
        const dx = ctx.playerPos[0] - v.pos[0];
        const dz = ctx.playerPos[2] - v.pos[2];
        const dist = Math.hypot(dx, dz);
        if (dist < 6.5 && dist > 0.4) {
            const rel = wrapAngle(Math.atan2(dx, -dz) - v.yaw);
            if (Math.abs(rel) < 1.25) lookTarget = rel;
            if (dist < 4.5 && v.voiceCooldown <= 0 && ctx.onVillagerHum) {
                v.voiceCooldown = between(ctx.rng, 9, 18);
                anim.nod = 1;
                ctx.onVillagerHum(v);
            }
        }
    }
    anim.headYaw = (anim.headYaw || 0) + (lookTarget - (anim.headYaw || 0)) * Math.min(1, 6 * stepDt);
    anim.nod = Math.max(0, (anim.nod || 0) - stepDt * 3);
}
