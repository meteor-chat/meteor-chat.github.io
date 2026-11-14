import { BLOCK, isSolid } from "./voxel-blocks.js";

export function collidesAABB(px, py, pz, getBlock) {
    const hw = 0.28;
    const h = 1.68;
    const minX = Math.floor(px - hw);
    const maxX = Math.floor(px + hw);
    const minY = Math.floor(py);
    const maxY = Math.floor(py + h);
    const minZ = Math.floor(pz - hw);
    const maxZ = Math.floor(pz + hw);
    for (let y = minY; y <= maxY; y += 1) {
        for (let z = minZ; z <= maxZ; z += 1) {
            for (let x = minX; x <= maxX; x += 1) {
                if (isSolid(getBlock(x, y, z))) return true;
            }
        }
    }
    return false;
}

export function stepPlayerPhysics(player, keys, dt, getBlock) {
    const stepDt = Math.min(0.05, Math.max(0.001, dt));
    const sy = Math.sin(player.yaw);
    const cy = Math.cos(player.yaw);
    let moveF = 0;
    let moveR = 0;
    if (keys.has("KeyW") || keys.has("ArrowUp")) moveF += 1;
    if (keys.has("KeyS") || keys.has("ArrowDown")) moveF -= 1;
    if (keys.has("KeyD") || keys.has("ArrowRight")) moveR += 1;
    if (keys.has("KeyA") || keys.has("ArrowLeft")) moveR -= 1;

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

    const inWater = getBlock(player.pos[0], player.pos[1] + 0.6, player.pos[2]) === BLOCK.WATER;
    const eyeInWater = getBlock(player.pos[0], player.pos[1] + 1.54, player.pos[2]) === BLOCK.WATER;
    player.submerged = eyeInWater;

    if (player.flyMode) {
        const speed = keys.has("ShiftLeft") ? 18 : 10.5;
        let moveY = 0;
        if (keys.has("Space") || keys.has("KeyE")) moveY += 1;
        if (keys.has("KeyC") || keys.has("ControlLeft")) moveY -= 1;
        player.pos[0] += wishX * speed * stepDt;
        player.pos[1] = Math.max(3, Math.min(124, player.pos[1] + moveY * speed * stepDt));
        player.pos[2] += wishZ * speed * stepDt;
        player.vel[1] = 0;
        player.onGround = false;
        return;
    }

    const walkSpeed = inWater ? 3.8 : 6.2;
    const vx = wishX * walkSpeed;
    const vz = wishZ * walkSpeed;
    const gravity = inWater ? -7.5 : -24;
    player.vel[1] += gravity * stepDt;
    if (inWater) player.vel[1] *= 0.92;

    if (keys.has("Space")) {
        if (player.onGround) {
            player.vel[1] = 8.4;
            player.onGround = false;
        } else if (inWater) {
            player.vel[1] = Math.min(4.2, player.vel[1] + 18 * stepDt);
        }
    }

    const nx = player.pos[0] + vx * stepDt;
    if (!collidesAABB(nx, player.pos[1], player.pos[2], getBlock)) {
        player.pos[0] = nx;
    }
    const nz = player.pos[2] + vz * stepDt;
    if (!collidesAABB(player.pos[0], player.pos[1], nz, getBlock)) {
        player.pos[2] = nz;
    }

    const ny = player.pos[1] + player.vel[1] * stepDt;
    if (!collidesAABB(player.pos[0], ny, player.pos[2], getBlock)) {
        player.pos[1] = ny;
        player.onGround = false;
    } else {
        if (player.vel[1] < 0) player.onGround = true;
        player.vel[1] = 0;
    }
}
