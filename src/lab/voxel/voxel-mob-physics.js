import { BLOCK, isSolid } from "./voxel-blocks.js";
import { collidesAABB } from "./voxel-physics.js";

export const CAT_HALF_WIDTH = 0.25;
export const CAT_HEIGHT = 0.62;

const GRAVITY = -24;
const MAX_DROP = 2;
const HOP_LIFT = 1.0;
const HOP_VELOCITY = 7.6;
const SWIM_RISE = 1.8;
const MAX_STEP_DT = 0.05;
const MAX_UNSTICK = 4;

const hits = (mob, x, y, z, getBlock) => collidesAABB(x, y, z, getBlock, mob.hw, mob.h);

const cell = (getBlock, x, y, z) => getBlock(Math.floor(x), Math.floor(y), Math.floor(z));

function safeFooting(x, y, z, getBlock) {
    const top = Math.floor(y + 0.001);
    for (let i = 0; i <= MAX_DROP + 1; i += 1) {
        const id = cell(getBlock, x, top - i, z);
        if (id === BLOCK.WATER || id === BLOCK.LAVA) return false;
        if (i > 0 && isSolid(id)) return true;
    }
    return false;
}

function unstick(mob, getBlock) {
    for (let i = 0; i < MAX_UNSTICK && hits(mob, mob.pos[0], mob.pos[1], mob.pos[2], getBlock); i += 1) {
        mob.pos[1] += 1;
        mob.vel[1] = 0;
    }
}

function tryHop(mob, nx, nz, getBlock) {
    if (!mob.onGround) return mob.vel[1] > 0;
    const y = mob.pos[1] + HOP_LIFT;
    if (hits(mob, nx, y, nz, getBlock) || !safeFooting(nx, y, nz, getBlock)) return false;
    mob.vel[1] = HOP_VELOCITY;
    mob.onGround = false;
    return true;
}

function tryMove(mob, nx, nz, getBlock) {
    const y = mob.pos[1];
    if (hits(mob, nx, y, nz, getBlock)) return tryHop(mob, nx, nz, getBlock);
    if (mob.onGround && !safeFooting(nx, y, nz, getBlock)) return false;
    mob.pos[0] = nx;
    mob.pos[2] = nz;
    return true;
}

function integrateVertical(mob, stepDt, getBlock) {
    const pos = mob.pos;
    const ny = pos[1] + mob.vel[1] * stepDt;
    if (!hits(mob, pos[0], ny, pos[2], getBlock)) {
        pos[1] = ny;
        mob.onGround = false;
        return;
    }
    if (mob.vel[1] < 0) {
        mob.onGround = true;
        const landed = Math.floor(ny) + 1;
        if (landed <= pos[1] + 1e-6) pos[1] = landed;
    }
    mob.vel[1] = 0;
}

export function stepMobPhysics(mob, dt, wishX, wishZ, getBlock) {
    const stepDt = Math.min(MAX_STEP_DT, Math.max(0.001, dt));
    const pos = mob.pos;
    unstick(mob, getBlock);
    mob.inWater = cell(getBlock, pos[0], pos[1] + 0.2, pos[2]) === BLOCK.WATER;
    if (mob.inWater) {
        mob.vel[1] += (SWIM_RISE - mob.vel[1]) * Math.min(1, 6 * stepDt);
    } else {
        mob.vel[1] += GRAVITY * stepDt;
    }
    let blocked = false;
    if (wishX !== 0 && !tryMove(mob, pos[0] + wishX * stepDt, pos[2], getBlock)) blocked = true;
    if (wishZ !== 0 && !tryMove(mob, pos[0], pos[2] + wishZ * stepDt, getBlock)) blocked = true;
    integrateVertical(mob, stepDt, getBlock);
    return { blocked };
}
