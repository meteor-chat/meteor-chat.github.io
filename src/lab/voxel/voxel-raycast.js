import { BLOCK, isFluid } from "./voxel-blocks.js";

export function raycastVoxel(origin, dir, maxDist, getBlock, options = {}) {
    const dx = dir[0];
    const dy = dir[1];
    const dz = dir[2];
    const len = Math.hypot(dx, dy, dz);
    if (len < 1e-6) return { hit: false };
    const ndx = dx / len;
    const ndy = dy / len;
    const ndz = dz / len;

    const ox = origin[0] + ndx * 1e-5;
    const oy = origin[1] + ndy * 1e-5;
    const oz = origin[2] + ndz * 1e-5;

    let vx = Math.floor(ox);
    let vy = Math.floor(oy);
    let vz = Math.floor(oz);

    const stepX = ndx >= 0 ? 1 : -1;
    const stepY = ndy >= 0 ? 1 : -1;
    const stepZ = ndz >= 0 ? 1 : -1;

    const tDeltaX = ndx === 0 ? 1e30 : Math.abs(1 / ndx);
    const tDeltaY = ndy === 0 ? 1e30 : Math.abs(1 / ndy);
    const tDeltaZ = ndz === 0 ? 1e30 : Math.abs(1 / ndz);

    let tMaxX = ndx === 0 ? 1e30 : (vx + (stepX > 0 ? 1 : 0) - ox) / ndx;
    let tMaxY = ndy === 0 ? 1e30 : (vy + (stepY > 0 ? 1 : 0) - oy) / ndy;
    let tMaxZ = ndz === 0 ? 1e30 : (vz + (stepZ > 0 ? 1 : 0) - oz) / ndz;

    const includeFluids = Boolean(options.includeFluids);
    const maxSteps = Math.max(16, Math.ceil(maxDist * 3) + 6);

    let nx = 0;
    let ny = 0;
    let nz = 0;
    let t = 0;

    for (let step = 0; step < maxSteps; step += 1) {
        const id = getBlock(vx, vy, vz);
        if (id !== BLOCK.AIR && (includeFluids || !isFluid(id))) {
            return { hit: true, vx, vy, vz, nx, ny, nz, blockId: id, dist: t };
        }
        if (tMaxX < tMaxY && tMaxX < tMaxZ) {
            t = tMaxX;
            vx += stepX;
            tMaxX += tDeltaX;
            nx = -stepX;
            ny = 0;
            nz = 0;
        } else if (tMaxY < tMaxZ) {
            t = tMaxY;
            vy += stepY;
            tMaxY += tDeltaY;
            nx = 0;
            ny = -stepY;
            nz = 0;
        } else {
            t = tMaxZ;
            vz += stepZ;
            tMaxZ += tDeltaZ;
            nx = 0;
            ny = 0;
            nz = -stepZ;
        }
        if (t > maxDist) break;
    }
    return { hit: false };
}

export function raycastMob(origin, dir, maxDist, mobs) {
    if (!mobs || mobs.length === 0) return null;
    const len = Math.hypot(dir[0], dir[1], dir[2]);
    if (len < 1e-6) return null;
    const dx = dir[0] / len;
    const dy = dir[1] / len;
    const dz = dir[2] / len;

    let best = null;
    let bestT = maxDist;

    for (const mob of mobs) {
        const hw = mob.hw ?? 0.32;
        const h = mob.h ?? 0.9;
        const minX = mob.pos[0] - hw;
        const maxX = mob.pos[0] + hw;
        const minY = mob.pos[1];
        const maxY = mob.pos[1] + h;
        const minZ = mob.pos[2] - hw;
        const maxZ = mob.pos[2] + hw;

        let tMin = 0;
        let tMax = bestT;

        const axes = [
            [origin[0], dx, minX, maxX],
            [origin[1], dy, minY, maxY],
            [origin[2], dz, minZ, maxZ]
        ];
        let hit = true;
        for (const [o, d, lo, hi] of axes) {
            if (Math.abs(d) < 1e-8) {
                if (o < lo || o > hi) {
                    hit = false;
                    break;
                }
            } else {
                let t1 = (lo - o) / d;
                let t2 = (hi - o) / d;
                if (t1 > t2) {
                    const tmp = t1;
                    t1 = t2;
                    t2 = tmp;
                }
                tMin = Math.max(tMin, t1);
                tMax = Math.min(tMax, t2);
                if (tMin > tMax) {
                    hit = false;
                    break;
                }
            }
        }
        if (hit && tMin >= 0 && tMin < bestT) {
            bestT = tMin;
            best = { mob, dist: tMin };
        }
    }
    return best;
}
