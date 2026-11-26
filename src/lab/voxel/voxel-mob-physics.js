import { BLOCK, isSolid, isWater } from "./voxel-blocks.js";
import { collidesAABB } from "./voxel-physics.js";

export const CAT_HALF_WIDTH = 0.25;
export const CAT_HEIGHT = 0.62;
export const CHICKEN_HALF_WIDTH = 0.2;
export const CHICKEN_HEIGHT = 0.5;
export const VILLAGER_HALF_WIDTH = 0.28;
export const VILLAGER_HEIGHT = 1.72;
export const GOLEM_HALF_WIDTH = 0.52;
export const GOLEM_HEIGHT = 2.65;

const GRAVITY = -24;
const TERMINAL_VEL = -40;
const GLIDE_GRAVITY = -6;
const MAX_GLIDE_FALL = -2.2;
const MAX_DROP = 2;
const HOP_LIFT = 1.0;
const HOP_VELOCITY = 7.6;
const WATER_HOP_VELOCITY = 6.4;
const SWIM_RISE = 1.8;
const MAX_STEP_DT = 0.05;
const MAX_SUBSTEP = 0.25;
const MAX_UNSTICK = 4;

const hits = (mob, x, y, z, getBlock) => collidesAABB(x, y, z, getBlock, mob.hw, mob.h);

const cell = (getBlock, x, y, z) => getBlock(Math.floor(x), Math.floor(y), Math.floor(z));

function columnSafe(x, y, z, getBlock) {
    const top = Math.floor(y + 0.001);
    for (let i = 0; i <= MAX_DROP + 1; i += 1) {
        const id = cell(getBlock, x, top - i, z);
        if (isWater(id) || id === BLOCK.LAVA) return false;
        if (i > 0 && isSolid(id)) return true;
    }
    return false;
}

function safeFooting(x, y, z, hw, getBlock) {
    if (!columnSafe(x, y, z, getBlock)) return false;
    const r = hw * 0.7;
    return (
        columnSafe(x - r, y, z - r, getBlock) &&
        columnSafe(x + r, y, z - r, getBlock) &&
        columnSafe(x - r, y, z + r, getBlock) &&
        columnSafe(x + r, y, z + r, getBlock)
    );
}

function unstick(mob, getBlock) {
    for (let i = 0; i < MAX_UNSTICK && hits(mob, mob.pos[0], mob.pos[1], mob.pos[2], getBlock); i += 1) {
        mob.pos[1] += 1;
        mob.vel[1] = 0;
    }
}

function tryHop(mob, nx, nz, getBlock) {
    if (mob.inWater) {
        const y = mob.pos[1] + HOP_LIFT;
        if (hits(mob, nx, y, nz, getBlock)) return false;
        mob.vel[1] = Math.max(mob.vel[1], WATER_HOP_VELOCITY);
        mob.onGround = false;
        return true;
    }
    if (!mob.onGround) return mob.vel[1] > 0;
    const y = mob.pos[1] + HOP_LIFT;
    if (hits(mob, nx, y, nz, getBlock) || !safeFooting(nx, y, nz, mob.hw, getBlock)) return false;
    mob.vel[1] = HOP_VELOCITY;
    mob.onGround = false;
    return true;
}

function tryMove(mob, nx, nz, getBlock) {
    const y = mob.pos[1];
    if (hits(mob, nx, y, nz, getBlock)) return tryHop(mob, nx, nz, getBlock);
    if (!mob.inWater && (mob.onGround || mob.vel[1] <= 0) && !safeFooting(nx, y, nz, mob.hw, getBlock)) {
        return false;
    }
    mob.pos[0] = nx;
    mob.pos[2] = nz;
    return true;
}

function integrateVertical(mob, stepDt, getBlock) {
    const pos = mob.pos;
    const delta = mob.vel[1] * stepDt;
    if (Math.abs(delta) < 1e-7) return;
    const steps = Math.max(1, Math.ceil(Math.abs(delta) / MAX_SUBSTEP));
    const step = delta / steps;
    for (let i = 0; i < steps; i += 1) {
        const ny = pos[1] + step;
        if (!hits(mob, pos[0], ny, pos[2], getBlock)) {
            pos[1] = ny;
            mob.onGround = false;
        } else {
            if (mob.vel[1] < 0) {
                mob.onGround = true;
                const landed = Math.floor(ny) + 1;
                if (landed <= pos[1] + 1e-6 && !hits(mob, pos[0], landed, pos[2], getBlock)) {
                    pos[1] = landed;
                }
            }
            mob.vel[1] = 0;
            return;
        }
    }
}

export function separateMobs(mobs, playerPos, getBlock) {
    const count = mobs.length;
    for (let i = 0; i < count; i += 1) {
        const a = mobs[i];
        for (let j = i + 1; j < count; j += 1) {
            const b = mobs[j];
            if (Math.abs(a.pos[1] - b.pos[1]) > Math.max(a.h, b.h)) continue;
            const dx = b.pos[0] - a.pos[0];
            const dz = b.pos[2] - a.pos[2];
            const minDist = a.hw + b.hw + 0.06;
            const dist = Math.hypot(dx, dz);
            if (dist >= minDist) continue;
            const nx = dist > 1e-4 ? dx / dist : 1;
            const nz = dist > 1e-4 ? dz / dist : 0;
            const push = (minDist - dist) * 0.25;
            const ax = a.pos[0] - nx * push;
            const az = a.pos[2] - nz * push;
            const bx = b.pos[0] + nx * push;
            const bz = b.pos[2] + nz * push;
            if (!hits(a, ax, a.pos[1], az, getBlock)) {
                a.pos[0] = ax;
                a.pos[2] = az;
            }
            if (!hits(b, bx, b.pos[1], bz, getBlock)) {
                b.pos[0] = bx;
                b.pos[2] = bz;
            }
        }
        if (playerPos && Math.abs(a.pos[1] - playerPos[1]) < 1.6) {
            const dx = a.pos[0] - playerPos[0];
            const dz = a.pos[2] - playerPos[2];
            const minDist = a.hw + 0.34;
            const dist = Math.hypot(dx, dz);
            if (dist < minDist && dist > 1e-4) {
                const push = (minDist - dist) * 0.35;
                const ax = a.pos[0] + (dx / dist) * push;
                const az = a.pos[2] + (dz / dist) * push;
                if (!hits(a, ax, a.pos[1], az, getBlock)) {
                    a.pos[0] = ax;
                    a.pos[2] = az;
                }
            }
        }
    }
}

export function stepMobPhysics(mob, dt, wishX, wishZ, getBlock) {
    const stepDt = Math.min(MAX_STEP_DT, Math.max(0.001, dt));
    const pos = mob.pos;
    unstick(mob, getBlock);
    mob.inWater = isWater(cell(getBlock, pos[0], pos[1] + 0.2, pos[2]));
    if (mob.inWater) {
        mob.vel[1] += (SWIM_RISE - mob.vel[1]) * Math.min(1, 6 * stepDt);
    } else if (mob.slowFall && mob.vel[1] < 0) {
        mob.vel[1] = Math.max(MAX_GLIDE_FALL, mob.vel[1] + GLIDE_GRAVITY * stepDt);
    } else {
        mob.vel[1] = Math.max(TERMINAL_VEL, mob.vel[1] + GRAVITY * stepDt);
    }
    let blocked = false;
    if (wishX !== 0 && !tryMove(mob, pos[0] + wishX * stepDt, pos[2], getBlock)) blocked = true;
    if (wishZ !== 0 && !tryMove(mob, pos[0], pos[2] + wishZ * stepDt, getBlock)) blocked = true;
    integrateVertical(mob, stepDt, getBlock);
    return { blocked };
}
