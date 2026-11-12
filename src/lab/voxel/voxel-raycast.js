import { BLOCK } from "./voxel-blocks.js";

export function raycastVoxel(origin, dir, maxDist, getBlock) {
    const dx = dir[0];
    const dy = dir[1];
    const dz = dir[2];
    const len = Math.hypot(dx, dy, dz);
    if (len < 1e-6) return { hit: false };
    const ndx = dx / len;
    const ndy = dy / len;
    const ndz = dz / len;

    let vx = Math.floor(origin[0]);
    let vy = Math.floor(origin[1]);
    let vz = Math.floor(origin[2]);

    const stepX = ndx >= 0 ? 1 : -1;
    const stepY = ndy >= 0 ? 1 : -1;
    const stepZ = ndz >= 0 ? 1 : -1;

    const tDeltaX = ndx === 0 ? 1e30 : Math.abs(1 / ndx);
    const tDeltaY = ndy === 0 ? 1e30 : Math.abs(1 / ndy);
    const tDeltaZ = ndz === 0 ? 1e30 : Math.abs(1 / ndz);

    let tMaxX = ndx === 0 ? 1e30 : ((vx + (stepX > 0 ? 1 : 0) - origin[0]) / ndx);
    let tMaxY = ndy === 0 ? 1e30 : ((vy + (stepY > 0 ? 1 : 0) - origin[1]) / ndy);
    let tMaxZ = ndz === 0 ? 1e30 : ((vz + (stepZ > 0 ? 1 : 0) - origin[2]) / ndz);

    let nx = 0;
    let ny = 0;
    let nz = 0;
    let t = 0;

    for (let step = 0; step < 96; step += 1) {
        const id = getBlock(vx, vy, vz);
        if (id !== BLOCK.AIR && id !== BLOCK.WATER && id !== BLOCK.LAVA) {
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
