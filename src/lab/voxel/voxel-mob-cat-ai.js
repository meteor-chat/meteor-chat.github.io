import { CAT_HALF_WIDTH, CAT_HEIGHT, stepMobPhysics } from "./voxel-mob-physics.js";

export const CAT_STATE = Object.freeze({ IDLE: "idle", WALK: "walk", SIT: "sit" });

const WALK_SPEED = 1.6;
const TURN_RATE = 7;
const SIT_RATE = 4;
const STRIDE = 3.4;
const DEFLECT_COOLDOWN = 0.4;
const TAU = Math.PI * 2;

const between = (rng, min, max) => min + rng() * (max - min);

function wrapAngle(a) {
    let v = a % TAU;
    if (v > Math.PI) v -= TAU;
    if (v < -Math.PI) v += TAU;
    return v;
}

export function createCat(x, y, z, variant, rng) {
    const yaw = rng() * TAU;
    return {
        kind: "cat",
        variant,
        pos: [x, y, z],
        vel: [0, 0, 0],
        hw: CAT_HALF_WIDTH,
        h: CAT_HEIGHT,
        yaw,
        targetYaw: yaw,
        phaseSeed: yaw * 13.7 + x * 1.13 + z * 0.71,
        deflectCooldown: 0,
        onGround: false,
        inWater: false,
        blocked: false,
        state: CAT_STATE.IDLE,
        timer: between(rng, 1, 3),
        speed: 0,
        anim: { phase: 0, sit: 0, moving: 0, headYaw: 0 }
    };
}

function enter(cat, state, timer, speed) {
    cat.state = state;
    cat.timer = timer;
    cat.speed = speed;
}

function chooseNext(cat, rng) {
    const roll = rng();
    const canSit = cat.onGround && !cat.inWater;
    if (roll < 0.55) {
        cat.targetYaw = rng() * TAU;
        enter(cat, CAT_STATE.WALK, between(rng, 2, 5), WALK_SPEED);
    } else if (roll < 0.8 && canSit) {
        enter(cat, CAT_STATE.SIT, between(rng, 4, 9), 0);
    } else {
        enter(cat, CAT_STATE.IDLE, between(rng, 1, 3), 0);
    }
}

function deflect(cat, rng) {
    const side = rng() < 0.5 ? -1 : 1;
    cat.targetYaw = wrapAngle(cat.yaw + side * (Math.PI * 0.55 + rng() * 0.75));
    cat.deflectCooldown = DEFLECT_COOLDOWN;
}

function updateIntent(cat, dt, ctx) {
    cat.timer -= dt;
    cat.deflectCooldown = Math.max(0, (cat.deflectCooldown || 0) - dt);
    if (cat.state === CAT_STATE.SIT && (!cat.onGround || cat.inWater)) {
        enter(cat, CAT_STATE.IDLE, 1.2, 0);
    }
    if (cat.blocked && cat.state === CAT_STATE.WALK && cat.deflectCooldown <= 0) {
        deflect(cat, ctx.rng);
    }
    if (cat.timer <= 0) chooseNext(cat, ctx.rng);
}

function updateAnim(cat, dt, actualSpeed, playerPos) {
    const anim = cat.anim;
    const sitTarget = cat.state === CAT_STATE.SIT && cat.onGround && !cat.inWater ? 1 : 0;
    const sitStep = Math.max(-SIT_RATE * dt, Math.min(SIT_RATE * dt, sitTarget - anim.sit));
    anim.sit += sitStep;
    const moveTarget = actualSpeed > 0.08 ? 1 : 0;
    anim.moving += (moveTarget - anim.moving) * Math.min(1, 10 * dt);
    anim.phase = (anim.phase + actualSpeed * STRIDE * dt) % (TAU * 100);

    let lookTarget = 0;
    if (playerPos) {
        const dx = playerPos[0] - cat.pos[0];
        const dz = playerPos[2] - cat.pos[2];
        const dist = Math.hypot(dx, dz);
        if (dist < 5.5 && dist > 0.4) {
            const worldYaw = Math.atan2(dx, -dz);
            const rel = wrapAngle(worldYaw - cat.yaw);
            if (Math.abs(rel) < 1.2) lookTarget = rel;
        }
    }
    const prevHead = anim.headYaw || 0;
    anim.headYaw = prevHead + (lookTarget - prevHead) * Math.min(1, 6 * dt);
}

export function stepCat(cat, dt, ctx) {
    if (ctx.frozen) return;
    const stepDt = Math.min(0.05, Math.max(0.001, dt));
    updateIntent(cat, stepDt, ctx);
    const diff = wrapAngle(cat.targetYaw - cat.yaw);
    const turn = Math.max(-TURN_RATE * stepDt, Math.min(TURN_RATE * stepDt, diff));
    cat.yaw = wrapAngle(cat.yaw + turn);
    const aligned = Math.max(0, Math.cos(wrapAngle(cat.targetYaw - cat.yaw)));
    const speed = cat.speed * aligned;
    const wishX = Math.sin(cat.yaw) * speed;
    const wishZ = -Math.cos(cat.yaw) * speed;
    const sx = cat.pos[0];
    const sz = cat.pos[2];
    const result = stepMobPhysics(cat, stepDt, wishX, wishZ, ctx.getBlock);
    const actualSpeed = Math.hypot(cat.pos[0] - sx, cat.pos[2] - sz) / stepDt;
    cat.blocked = result.blocked && speed > 0;
    updateAnim(cat, stepDt, actualSpeed, ctx.playerPos);
}
