import { BLOCK, CHUNK_SIZE, isSolid, isWater } from "./voxel-blocks.js";

export const PLAYER_HW = 0.28;
export const PLAYER_H = 1.68;
export const EYE_STAND = 1.54;
export const EYE_SNEAK = 1.28;

const SWIM_SPEED = 3.8;
const LAVA_SPEED = 1.9;
const WALK_SPEED = 6.2;
const SPRINT_FACTOR = 1.32;
const SNEAK_FACTOR = 0.35;
const GRAVITY = -24;
const TERMINAL_VEL = -54;
const WATER_GRAVITY = -7.5;
const WATER_DRAG = 0.92;
const LAVA_GRAVITY = -5.2;
const LAVA_DRAG = 0.72;
const SWIM_RESPONSE = 10;
const LIFT_STEP = 0.25;
const LAND_MAX_LIFT = 1.0;
const WATER_MAX_LIFT = 2.85;
const AUTO_JUMP_MAX_RISE_SPEED = 2;
const MAX_SUBSTEP = 0.22;
const EPS = 1e-5;

export function collidesAABB(px, py, pz, getBlock, hw = PLAYER_HW, h = PLAYER_H) {
    const minX = Math.floor(px - hw);
    const maxX = Math.floor(px + hw - EPS);
    const minY = Math.floor(py);
    const maxY = Math.floor(py + h - EPS);
    const minZ = Math.floor(pz - hw);
    const maxZ = Math.floor(pz + hw - EPS);
    for (let y = minY; y <= maxY; y += 1) {
        for (let z = minZ; z <= maxZ; z += 1) {
            for (let x = minX; x <= maxX; x += 1) {
                if (isSolid(getBlock(x, y, z))) return true;
            }
        }
    }
    return false;
}

function sampleFluidBox(px, py, pz, getBlock, yLow, yHigh) {
    const r = PLAYER_HW * 0.85;
    let water = false;
    let lava = false;
    for (let sy = 0; sy < 2; sy += 1) {
        const y = py + (sy === 0 ? yLow : yHigh);
        for (let sx = -1; sx <= 1; sx += 2) {
            for (let sz = -1; sz <= 1; sz += 2) {
                const id = getBlock(px + sx * r, y, pz + sz * r);
                if (isWater(id)) water = true;
                else if (id === BLOCK.LAVA) lava = true;
            }
        }
    }
    return { water, lava };
}

function steerSwim(player, moveF, stepDt, speed) {
    const target = Math.sin(player.pitch) * moveF * speed;
    const blend = 1 - Math.exp(-SWIM_RESPONSE * stepDt);
    player.vel[1] += (target - player.vel[1]) * blend;
}

function autoJump(player, inWater, tx, tz, getBlock) {
    if (player.vel[1] > AUTO_JUMP_MAX_RISE_SPEED) return;
    if (!player.onGround && !inWater) return;
    const maxLift = inWater ? WATER_MAX_LIFT : LAND_MAX_LIFT;
    for (let lift = LIFT_STEP; lift <= maxLift + 1e-6; lift += LIFT_STEP) {
        if (collidesAABB(tx, player.pos[1] + lift, tz, getBlock)) continue;
        player.vel[1] = inWater
            ? Math.min(11.2, 5.4 + lift * 2.1)
            : Math.sqrt(-2 * GRAVITY * (lift + 0.25));
        player.onGround = false;
        return;
    }
}

export function unstickPlayer(player, getBlock) {
    if (!collidesAABB(player.pos[0], player.pos[1], player.pos[2], getBlock)) return;
    for (let dy = 0.25; dy <= 20; dy += 0.25) {
        if (!collidesAABB(player.pos[0], player.pos[1] + dy, player.pos[2], getBlock)) {
            player.pos[1] += dy;
            player.vel[1] = 0;
            return;
        }
    }
}

function rescueFromVoid(player, getBlock) {
    const bx = Math.floor(player.pos[0]);
    const bz = Math.floor(player.pos[2]);
    for (let y = 120; y >= 2; y -= 1) {
        if (isSolid(getBlock(bx, y, bz)) && !isSolid(getBlock(bx, y + 1, bz)) && !isSolid(getBlock(bx, y + 2, bz))) {
            player.pos[1] = y + 1.02;
            player.vel[1] = 0;
            player.onGround = true;
            return;
        }
    }
    player.pos[1] = 64;
    player.vel[1] = 0;
}

function hasChunkLoaded(px, pz, isColumnLoaded) {
    if (!isColumnLoaded) return true;
    const cx = Math.floor(px / CHUNK_SIZE);
    const cz = Math.floor(pz / CHUNK_SIZE);
    return isColumnLoaded(cx, cz);
}

function moveHorizontalAxis(player, axis, delta, sneaking, inFluid, getBlock, isColumnLoaded) {
    if (Math.abs(delta) < 1e-7) return false;
    const steps = Math.max(1, Math.ceil(Math.abs(delta) / MAX_SUBSTEP));
    const step = delta / steps;
    let blocked = false;
    for (let i = 0; i < steps; i += 1) {
        const nx = axis === 0 ? player.pos[0] + step : player.pos[0];
        const nz = axis === 2 ? player.pos[2] + step : player.pos[2];
        if (!hasChunkLoaded(nx, nz, isColumnLoaded)) {
            blocked = true;
            break;
        }
        if (collidesAABB(nx, player.pos[1], nz, getBlock)) {
            blocked = true;
            break;
        }
        if (sneaking && player.onGround && !inFluid && !collidesAABB(nx, player.pos[1] - 0.18, nz, getBlock)) {
            blocked = true;
            break;
        }
        player.pos[0] = nx;
        player.pos[2] = nz;
    }
    return blocked;
}

function moveVertical(player, delta, getBlock) {
    if (Math.abs(delta) < 1e-7) return;
    const steps = Math.max(1, Math.ceil(Math.abs(delta) / MAX_SUBSTEP));
    const step = delta / steps;
    for (let i = 0; i < steps; i += 1) {
        const ny = player.pos[1] + step;
        if (!collidesAABB(player.pos[0], ny, player.pos[2], getBlock)) {
            player.pos[1] = ny;
            player.onGround = false;
        } else {
            if (player.vel[1] < 0) {
                const prevImpact = -player.vel[1];
                player.pos[1] = Math.floor(ny) + 1;
                if (collidesAABB(player.pos[0], player.pos[1], player.pos[2], getBlock)) {
                    player.pos[1] = ny - step;
                }
                if (!player.onGround && prevImpact > 4.5) {
                    player.justLanded = true;
                    player.landImpact = prevImpact;
                }
                player.onGround = true;
            } else if (player.vel[1] > 0) {
                const ceilY = Math.floor(ny + PLAYER_H - EPS) - PLAYER_H;
                if (!collidesAABB(player.pos[0], ceilY, player.pos[2], getBlock)) {
                    player.pos[1] = ceilY;
                }
            }
            player.vel[1] = 0;
            return;
        }
    }
}

export function stepPlayerPhysics(player, keys, dt, getBlock, isColumnLoaded = null) {
    const stepDt = Math.min(0.05, Math.max(0.001, dt));
    const sy = Math.sin(player.yaw);
    const cy = Math.cos(player.yaw);
    let moveF = 0;
    let moveR = 0;
    if (keys.has("KeyW") || keys.has("ArrowUp")) moveF += 1;
    if (keys.has("KeyS") || keys.has("ArrowDown")) moveF -= 1;
    if (keys.has("KeyD") || keys.has("ArrowRight")) moveR += 1;
    if (keys.has("KeyA") || keys.has("ArrowLeft")) moveR -= 1;

    const rawForward = moveF;
    const len = Math.hypot(moveF, moveR);
    if (len > 0) {
        moveF /= len;
        moveR /= len;
    }

    const fwdX = sy;
    const fwdZ = -cy;
    const rightX = cy;
    const rightZ = sy;
    const wishX = fwdX * moveF + rightX * moveR;
    const wishZ = fwdZ * moveF + rightZ * moveR;

    player.justLanded = false;
    player.landImpact = 0;
    player.justSplashed = false;

    const prevInWater = Boolean(player.inWater);
    const bodyFluid = sampleFluidBox(player.pos[0], player.pos[1], player.pos[2], getBlock, 0.25, 0.95);
    const inWater = bodyFluid.water;
    const inLava = !inWater && bodyFluid.lava;
    const targetEye = player.sneaking && !player.flyMode ? EYE_SNEAK : EYE_STAND;
    if (typeof player.eyeHeight !== "number") player.eyeHeight = EYE_STAND;
    player.eyeHeight += (targetEye - player.eyeHeight) * Math.min(1, stepDt * 18);

    const eyeBlock = getBlock(player.pos[0], player.pos[1] + player.eyeHeight, player.pos[2]);
    player.submerged = isWater(eyeBlock);
    player.submergedLava = eyeBlock === BLOCK.LAVA;
    player.inWater = inWater;
    player.inLava = inLava;
    if (inWater !== prevInWater && Math.abs(player.vel[1]) > 1.2) {
        player.justSplashed = true;
    }

    if (player.flyMode) {
        const boost = keys.has("ShiftLeft") || keys.has("ShiftRight");
        const speed = boost ? 18 : 10.5;
        let moveY = 0;
        if (keys.has("Space")) moveY += 1;
        if (keys.has("KeyC") || keys.has("ControlLeft")) moveY -= 1;
        const nx = player.pos[0] + wishX * speed * stepDt;
        const nz = player.pos[2] + wishZ * speed * stepDt;
        if (hasChunkLoaded(nx, player.pos[2], isColumnLoaded)) player.pos[0] = nx;
        if (hasChunkLoaded(player.pos[0], nz, isColumnLoaded)) player.pos[2] = nz;
        player.pos[1] = Math.max(3, Math.min(124, player.pos[1] + moveY * speed * stepDt));
        player.vel[1] = 0;
        player.onGround = false;
        player.sneaking = false;
        player.sprinting = boost && len > 0;
        return;
    }

    const sneaking = keys.has("ShiftLeft") || keys.has("ShiftRight");
    if (rawForward <= 0) player.sprintLatch = false;
    const wantSprint =
        !sneaking &&
        !inWater &&
        !inLava &&
        rawForward > 0 &&
        (keys.has("ControlLeft") || keys.has("ControlRight") || Boolean(player.sprintLatch));
    player.sneaking = sneaking;
    player.sprinting = wantSprint;

    const baseSpeed = inWater ? SWIM_SPEED : inLava ? LAVA_SPEED : WALK_SPEED;
    const mult = sneaking ? SNEAK_FACTOR : wantSprint ? SPRINT_FACTOR : 1;
    const moveSpeed = baseSpeed * mult;
    const vx = wishX * moveSpeed;
    const vz = wishZ * moveSpeed;

    if ((inWater || inLava) && moveF !== 0) {
        steerSwim(player, moveF, stepDt, inWater ? SWIM_SPEED : LAVA_SPEED);
    } else if (inWater) {
        player.vel[1] += WATER_GRAVITY * stepDt;
        player.vel[1] *= Math.pow(WATER_DRAG, stepDt * 60);
    } else if (inLava) {
        player.vel[1] += LAVA_GRAVITY * stepDt;
        player.vel[1] *= Math.pow(LAVA_DRAG, stepDt * 60);
    } else {
        player.vel[1] = Math.max(TERMINAL_VEL, player.vel[1] + GRAVITY * stepDt);
    }

    if (keys.has("Space")) {
        if (player.onGround) {
            player.vel[1] = 8.4;
            player.onGround = false;
        } else if (inWater) {
            player.vel[1] = Math.min(4.2, player.vel[1] + 18 * stepDt);
        } else if (inLava) {
            player.vel[1] = Math.min(2.6, player.vel[1] + 10 * stepDt);
        }
    }

    const startX = player.pos[0];
    const startZ = player.pos[2];
    const inFluid = inWater || inLava;

    const blockedX = moveHorizontalAxis(player, 0, vx * stepDt, sneaking, inFluid, getBlock, isColumnLoaded);
    if (blockedX && moveF > 0 && !sneaking) {
        autoJump(player, inWater, player.pos[0] + vx * stepDt, player.pos[2], getBlock);
    }
    const blockedZ = moveHorizontalAxis(player, 2, vz * stepDt, sneaking, inFluid, getBlock, isColumnLoaded);
    if (blockedZ && moveF > 0 && !sneaking) {
        autoJump(player, inWater, player.pos[0], player.pos[2] + vz * stepDt, getBlock);
    }

    moveVertical(player, player.vel[1] * stepDt, getBlock);

    if (player.pos[1] < -12) {
        rescueFromVoid(player, getBlock);
    }

    const movedDist = Math.hypot(player.pos[0] - startX, player.pos[2] - startZ);
    if (typeof player.walkDist !== "number") player.walkDist = 0;
    if (player.onGround || inWater) {
        player.walkDist += movedDist;
    }
}
