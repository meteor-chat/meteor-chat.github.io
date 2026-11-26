import { GOLEM_HALF_WIDTH, GOLEM_HEIGHT, stepMobPhysics } from "./voxel-mob-physics.js";

export const GOLEM_STATE = Object.freeze({ IDLE: "idle", PATROL: "patrol", WATCH: "watch" });

const PATROL_SPEED = 1.05;
const TURN_RATE = 3.2;
const STRIDE = 1.9;
const HOME_RADIUS = 44;
const DEFLECT_COOLDOWN = 0.65;
const TAU = Math.PI * 2;

const between = (rng, min, max) => min + rng() * (max - min);

function wrapAngle(a) {
    let v = a % TAU;
    if (v > Math.PI) v -= TAU;
    if (v < -Math.PI) v += TAU;
    return v;
}

export function createGolem(x, y, z, homeX, homeZ, rng = Math.random, pois = null) {
    const yaw = rng() * TAU;
    return {
        kind: "golem",
        variant: "iron",
        pos: [x, y, z],
        vel: [0, 0, 0],
        homeX: homeX ?? x,
        homeZ: homeZ ?? z,
        pois: Array.isArray(pois) ? pois : null,
        hw: GOLEM_HALF_WIDTH,
        h: GOLEM_HEIGHT,
        yaw,
        targetYaw: yaw,
        phaseSeed: rng() * 100,
        deflectCooldown: 0,
        onGround: false,
        inWater: false,
        blocked: false,
        state: GOLEM_STATE.PATROL,
        timer: between(rng, 2.5, 5.5),
        speed: PATROL_SPEED,
        anim: { phase: 0, moving: 0, headYaw: 0 }
    };
}

function enter(g, state, timer, speed) {
    g.state = state;
    g.timer = timer;
    g.speed = speed;
}

function chooseNext(g, rng, playerPos) {
    if (playerPos) {
        const dx = playerPos[0] - g.pos[0];
        const dz = playerPos[2] - g.pos[2];
        if (Math.hypot(dx, dz) < 7.5 && rng() < 0.35) {
            g.targetYaw = Math.atan2(dx, -dz);
            enter(g, GOLEM_STATE.WATCH, between(rng, 2.6, 5), 0);
            return;
        }
    }
    const homeDx = g.homeX - g.pos[0];
    const homeDz = g.homeZ - g.pos[2];
    if (Math.hypot(homeDx, homeDz) > HOME_RADIUS) {
        g.targetYaw = Math.atan2(homeDx, -homeDz) + (rng() - 0.5) * 0.4;
        enter(g, GOLEM_STATE.PATROL, between(rng, 4.5, 8), PATROL_SPEED);
        return;
    }
    if (g.pois && g.pois.length > 0 && rng() < 0.72) {
        const poi = g.pois[Math.floor(rng() * g.pois.length)];
        const dx = poi.x - g.pos[0];
        const dz = poi.z - g.pos[2];
        if (Math.hypot(dx, dz) > 4) {
            g.targetYaw = Math.atan2(dx, -dz) + (rng() - 0.5) * 0.35;
            enter(g, GOLEM_STATE.PATROL, between(rng, 4, 8), PATROL_SPEED);
            return;
        }
    }
    if (rng() < 0.65) {
        g.targetYaw = rng() * TAU;
        enter(g, GOLEM_STATE.PATROL, between(rng, 3.5, 6.5), PATROL_SPEED);
    } else {
        enter(g, GOLEM_STATE.IDLE, between(rng, 2.5, 5.5), 0);
    }
}

export function stepGolem(g, dt, ctx) {
    if (ctx.frozen) return;
    const stepDt = Math.min(0.05, Math.max(0.001, dt));
    g.timer -= stepDt;
    g.deflectCooldown = Math.max(0, (g.deflectCooldown || 0) - stepDt);

    if (g.blocked && g.state === GOLEM_STATE.PATROL && g.deflectCooldown <= 0) {
        const side = ctx.rng() < 0.5 ? -1 : 1;
        g.targetYaw = wrapAngle(g.yaw + side * (Math.PI * 0.5 + ctx.rng() * 0.7));
        g.deflectCooldown = DEFLECT_COOLDOWN;
    }
    if (g.timer <= 0) chooseNext(g, ctx.rng, ctx.playerPos);

    const diff = wrapAngle(g.targetYaw - g.yaw);
    const turn = Math.max(-TURN_RATE * stepDt, Math.min(TURN_RATE * stepDt, diff));
    g.yaw = wrapAngle(g.yaw + turn);

    const aligned = Math.max(0, Math.cos(wrapAngle(g.targetYaw - g.yaw)));
    const speed = g.speed * aligned;
    const sx = g.pos[0];
    const sz = g.pos[2];
    const res = stepMobPhysics(g, stepDt, Math.sin(g.yaw) * speed, -Math.cos(g.yaw) * speed, ctx.getBlock);
    const actualSpeed = Math.hypot(g.pos[0] - sx, g.pos[2] - sz) / stepDt;
    g.blocked = res.blocked && speed > 0;

    const anim = g.anim;
    const moveTarget = actualSpeed > 0.06 ? 1 : 0;
    anim.moving += (moveTarget - anim.moving) * Math.min(1, 7 * stepDt);
    anim.phase = (anim.phase + actualSpeed * STRIDE * stepDt) % (TAU * 100);

    let lookTarget = 0;
    if (ctx.playerPos) {
        const dx = ctx.playerPos[0] - g.pos[0];
        const dz = ctx.playerPos[2] - g.pos[2];
        const dist = Math.hypot(dx, dz);
        if (dist < 8 && dist > 0.5) {
            const rel = wrapAngle(Math.atan2(dx, -dz) - g.yaw);
            if (Math.abs(rel) < 1.15) lookTarget = rel;
        }
    }
    anim.headYaw = (anim.headYaw || 0) + (lookTarget - (anim.headYaw || 0)) * Math.min(1, 4.5 * stepDt);
}
