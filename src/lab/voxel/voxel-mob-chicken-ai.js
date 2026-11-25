import { CHICKEN_HALF_WIDTH, CHICKEN_HEIGHT, stepMobPhysics } from "./voxel-mob-physics.js";

export const CHICKEN_STATE = Object.freeze({ IDLE: "idle", WALK: "walk", PECK: "peck" });

const WALK_SPEED = 1.35;
const TURN_RATE = 6.5;
const PECK_RATE = 5;
const STRIDE = 4.2;
const DEFLECT_COOLDOWN = 0.4;
const TAU = Math.PI * 2;

const between = (rng, min, max) => min + rng() * (max - min);

function wrapAngle(a) {
    let v = a % TAU;
    if (v > Math.PI) v -= TAU;
    if (v < -Math.PI) v += TAU;
    return v;
}

export function createChicken(x, y, z, variant = "white", rng = Math.random) {
    const yaw = rng() * TAU;
    return {
        kind: "chicken",
        variant,
        pos: [x, y, z],
        vel: [0, 0, 0],
        hw: CHICKEN_HALF_WIDTH,
        h: CHICKEN_HEIGHT,
        slowFall: true,
        yaw,
        targetYaw: yaw,
        phaseSeed: yaw * 13.7 + x * 1.13 + z * 0.71,
        deflectCooldown: 0,
        onGround: false,
        inWater: false,
        blocked: false,
        state: CHICKEN_STATE.IDLE,
        timer: between(rng, 1, 3),
        speed: 0,
        anim: { phase: 0, peck: 0, flutter: 0, moving: 0, headYaw: 0 }
    };
}

function enter(chicken, state, timer, speed) {
    chicken.state = state;
    chicken.timer = timer;
    chicken.speed = speed;
}

function chooseNext(chicken, rng) {
    const roll = rng();
    const canPeck = chicken.onGround && !chicken.inWater;
    if (roll < 0.5) {
        chicken.targetYaw = rng() * TAU;
        enter(chicken, CHICKEN_STATE.WALK, between(rng, 2, 4.5), WALK_SPEED);
    } else if (roll < 0.8 && canPeck) {
        enter(chicken, CHICKEN_STATE.PECK, between(rng, 1.5, 3.5), 0);
    } else {
        enter(chicken, CHICKEN_STATE.IDLE, between(rng, 1, 2.5), 0);
    }
}

function deflect(chicken, rng) {
    const side = rng() < 0.5 ? -1 : 1;
    chicken.targetYaw = wrapAngle(chicken.yaw + side * (Math.PI * 0.55 + rng() * 0.75));
    chicken.deflectCooldown = DEFLECT_COOLDOWN;
}

function updateIntent(chicken, dt, ctx) {
    chicken.timer -= dt;
    chicken.deflectCooldown = Math.max(0, (chicken.deflectCooldown || 0) - dt);
    if (chicken.state === CHICKEN_STATE.PECK && (!chicken.onGround || chicken.inWater)) {
        enter(chicken, CHICKEN_STATE.IDLE, 1.0, 0);
    }
    if (chicken.blocked && chicken.state === CHICKEN_STATE.WALK && chicken.deflectCooldown <= 0) {
        deflect(chicken, ctx.rng);
    }
    if (chicken.timer <= 0) chooseNext(chicken, ctx.rng);
}

function updateAnim(chicken, dt, actualSpeed, playerPos) {
    const anim = chicken.anim;
    const peckTarget = chicken.state === CHICKEN_STATE.PECK && chicken.onGround && !chicken.inWater ? 1 : 0;
    const peckStep = Math.max(-PECK_RATE * dt, Math.min(PECK_RATE * dt, peckTarget - anim.peck));
    anim.peck += peckStep;
    const flutterTarget = !chicken.onGround && chicken.vel[1] < -0.15 ? 1 : 0;
    anim.flutter += (flutterTarget - anim.flutter) * Math.min(1, 14 * dt);
    const moveTarget = actualSpeed > 0.08 ? 1 : 0;
    anim.moving += (moveTarget - anim.moving) * Math.min(1, 10 * dt);
    anim.phase = (anim.phase + actualSpeed * STRIDE * dt) % (TAU * 100);

    let lookTarget = 0;
    if (playerPos && anim.peck < 0.1) {
        const dx = playerPos[0] - chicken.pos[0];
        const dz = playerPos[2] - chicken.pos[2];
        const dist = Math.hypot(dx, dz);
        if (dist < 4.5 && dist > 0.4) {
            const rel = wrapAngle(Math.atan2(dx, -dz) - chicken.yaw);
            if (Math.abs(rel) < 1.1) lookTarget = rel;
        }
    }
    const prevHead = anim.headYaw || 0;
    anim.headYaw = prevHead + (lookTarget - prevHead) * Math.min(1, 7 * dt);
}

export function stepChicken(chicken, dt, ctx) {
    if (ctx.frozen) return;
    const stepDt = Math.min(0.05, Math.max(0.001, dt));
    updateIntent(chicken, stepDt, ctx);
    const diff = wrapAngle(chicken.targetYaw - chicken.yaw);
    const turn = Math.max(-TURN_RATE * stepDt, Math.min(TURN_RATE * stepDt, diff));
    chicken.yaw = wrapAngle(chicken.yaw + turn);
    const aligned = Math.max(0, Math.cos(wrapAngle(chicken.targetYaw - chicken.yaw)));
    const speed = chicken.speed * aligned;
    const wishX = Math.sin(chicken.yaw) * speed;
    const wishZ = -Math.cos(chicken.yaw) * speed;
    const sx = chicken.pos[0];
    const sz = chicken.pos[2];
    const result = stepMobPhysics(chicken, stepDt, wishX, wishZ, ctx.getBlock);
    const actualSpeed = Math.hypot(chicken.pos[0] - sx, chicken.pos[2] - sz) / stepDt;
    chicken.blocked = result.blocked && speed > 0;
    updateAnim(chicken, stepDt, actualSpeed, ctx.playerPos);
}
