import { CHICKEN_HALF_WIDTH, CHICKEN_HEIGHT, stepMobPhysics } from "./voxel-mob-physics.js";

export const CHICKEN_STATE = Object.freeze({ IDLE: "idle", WALK: "walk", PECK: "peck" });

const WALK_SPEED = 1.35;
const TURN_RATE = 6.5;
const PECK_RATE = 5;
const STRIDE = 4.2;
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
        onGround: false,
        inWater: false,
        blocked: false,
        state: CHICKEN_STATE.IDLE,
        timer: between(rng, 1, 3),
        speed: 0,
        anim: { phase: 0, peck: 0, flutter: 0, moving: 0 }
    };
}

function enter(chicken, state, timer, speed) {
    chicken.state = state;
    chicken.timer = timer;
    chicken.speed = speed;
}

function chooseNext(chicken, rng) {
    const roll = rng();
    if (roll < 0.5) {
        chicken.targetYaw = rng() * TAU;
        enter(chicken, CHICKEN_STATE.WALK, between(rng, 2, 4.5), WALK_SPEED);
    } else if (roll < 0.8) {
        enter(chicken, CHICKEN_STATE.PECK, between(rng, 1.5, 3.5), 0);
    } else {
        enter(chicken, CHICKEN_STATE.IDLE, between(rng, 1, 2.5), 0);
    }
}

function deflect(chicken, rng) {
    const side = rng() < 0.5 ? -1 : 1;
    chicken.targetYaw = chicken.yaw + side * (Math.PI * 0.5 + rng() * 0.8);
}

function updateIntent(chicken, dt, ctx) {
    chicken.timer -= dt;
    if (chicken.blocked && chicken.state === CHICKEN_STATE.WALK) deflect(chicken, ctx.rng);
    if (chicken.timer <= 0) chooseNext(chicken, ctx.rng);
}

function updateAnim(chicken, dt, moved) {
    const anim = chicken.anim;
    const peckTarget = chicken.state === CHICKEN_STATE.PECK ? 1 : 0;
    const peckStep = Math.max(-PECK_RATE * dt, Math.min(PECK_RATE * dt, peckTarget - anim.peck));
    anim.peck += peckStep;
    const flutterTarget = !chicken.onGround && chicken.vel[1] < -0.15 ? 1 : 0;
    anim.flutter += (flutterTarget - anim.flutter) * Math.min(1, 14 * dt);
    const moveTarget = moved > 0.05 ? 1 : 0;
    anim.moving += (moveTarget - anim.moving) * Math.min(1, 10 * dt);
    anim.phase = (anim.phase + moved * STRIDE * dt) % (TAU * 100);
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
    const result = stepMobPhysics(chicken, stepDt, wishX, wishZ, ctx.getBlock);
    chicken.blocked = result.blocked && speed > 0;
    updateAnim(chicken, stepDt, speed);
}
