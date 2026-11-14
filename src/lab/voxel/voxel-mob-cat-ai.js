import { CAT_HALF_WIDTH, CAT_HEIGHT, stepMobPhysics } from "./voxel-mob-physics.js";

export const CAT_STATE = Object.freeze({ IDLE: "idle", WALK: "walk", SIT: "sit", FLEE: "flee" });
export const FLEE_START = 5;
export const FLEE_END = 7;

const WALK_SPEED = 1.6;
const FLEE_SPEED = 4.4;
const TURN_RATE = 7;
const SIT_RATE = 4;
const STRIDE = 3.4;
const VERTICAL_RANGE = 6;
const TAU = Math.PI * 2;
const DETOUR_TIME = 0.7;

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
        onGround: false,
        inWater: false,
        blocked: false,
        detour: 0,
        state: CAT_STATE.IDLE,
        timer: between(rng, 1, 3),
        speed: 0,
        anim: { phase: 0, sit: 0, moving: 0 }
    };
}

function enter(cat, state, timer, speed) {
    cat.state = state;
    cat.timer = timer;
    cat.speed = speed;
}

function chooseNext(cat, rng) {
    const roll = rng();
    if (roll < 0.55) {
        cat.targetYaw = rng() * TAU;
        enter(cat, CAT_STATE.WALK, between(rng, 2, 5), WALK_SPEED);
    } else if (roll < 0.8) {
        enter(cat, CAT_STATE.SIT, between(rng, 4, 9), 0);
    } else {
        enter(cat, CAT_STATE.IDLE, between(rng, 1, 3), 0);
    }
}

function playerThreat(cat, player) {
    const dx = cat.pos[0] - player[0];
    const dz = cat.pos[2] - player[2];
    const limit = cat.state === CAT_STATE.FLEE ? FLEE_END : FLEE_START;
    const near = Math.hypot(dx, dz) < limit && Math.abs(cat.pos[1] - player[1]) < VERTICAL_RANGE;
    return { near, dx, dz };
}

function deflect(cat, rng) {
    const side = rng() < 0.5 ? -1 : 1;
    cat.targetYaw = cat.yaw + side * (Math.PI * 0.5 + rng() * 0.8);
}

function updateIntent(cat, dt, ctx) {
    const threat = playerThreat(cat, ctx.playerPos);
    if (threat.near) {
        if (cat.state !== CAT_STATE.FLEE) enter(cat, CAT_STATE.FLEE, 0, FLEE_SPEED);
        if (cat.detour > 0) {
            cat.detour -= dt;
        } else if (cat.blocked) {
            deflect(cat, ctx.rng);
            cat.detour = DETOUR_TIME;
        } else if (threat.dx !== 0 || threat.dz !== 0) {
            cat.targetYaw = Math.atan2(threat.dx, -threat.dz);
        }
        return;
    }
    if (cat.state === CAT_STATE.FLEE) enter(cat, CAT_STATE.IDLE, between(ctx.rng, 1, 3), 0);
    cat.timer -= dt;
    if (cat.blocked && cat.state === CAT_STATE.WALK) deflect(cat, ctx.rng);
    if (cat.timer <= 0) chooseNext(cat, ctx.rng);
}

function updateAnim(cat, dt, moved) {
    const anim = cat.anim;
    const sitTarget = cat.state === CAT_STATE.SIT ? 1 : 0;
    const sitStep = Math.max(-SIT_RATE * dt, Math.min(SIT_RATE * dt, sitTarget - anim.sit));
    anim.sit += sitStep;
    const moveTarget = moved > 0.05 ? 1 : 0;
    anim.moving += (moveTarget - anim.moving) * Math.min(1, 10 * dt);
    anim.phase = (anim.phase + moved * STRIDE * dt) % (TAU * 100);
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
    const result = stepMobPhysics(cat, stepDt, wishX, wishZ, ctx.getBlock);
    cat.blocked = result.blocked && speed > 0;
    updateAnim(cat, stepDt, speed);
}
