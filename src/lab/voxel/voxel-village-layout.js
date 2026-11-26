import { BLOCK, CHUNK_HEIGHT, CHUNK_SIZE, SEA_LEVEL } from "./voxel-blocks.js";
import { mulberry32 } from "./voxel-noise.js";
import { buildFountain, buildLamp, buildTower, buildWindmill } from "./voxel-village-blueprints.js";
import {
    buildBlacksmith,
    buildChurch,
    buildHarborPier,
    buildLanternPost,
    buildMarketStall,
    buildTerracedFarm,
    buildTimberHouse,
    buildTownhouse,
    rotatedFootprint
} from "./voxel-village-structures.js";

export const TOWN_RADIUS = 64;
const GRID_RADIUS = 72;
const GRID_SIZE = GRID_RADIUS * 2 + 1;
const DIRS = ["north", "south", "east", "west"];

function gridIdx(gx, gz) {
    return gx + gz * GRID_SIZE;
}

function createSurfaceSampler(originX, originZ, seed, sampleMeta) {
    const cache = new Int16Array(GRID_SIZE * GRID_SIZE);
    cache.fill(-1);
    return (wx, wz) => {
        const gx = wx - originX;
        const gz = wz - originZ;
        if (gx >= 0 && gx < GRID_SIZE && gz >= 0 && gz < GRID_SIZE) {
            const idx = gridIdx(gx, gz);
            if (cache[idx] >= 0) return cache[idx];
            const y = sampleMeta(wx, wz, seed).surfaceY;
            cache[idx] = y;
            return y;
        }
        return sampleMeta(wx, wz, seed).surfaceY;
    };
}

function isRectFree(occ, originX, originZ, x0, z0, x1, z1, margin = 1) {
    const gx0 = x0 - margin - originX;
    const gz0 = z0 - margin - originZ;
    const gx1 = x1 + margin - originX;
    const gz1 = z1 + margin - originZ;
    if (gx0 < 1 || gz0 < 1 || gx1 >= GRID_SIZE - 1 || gz1 >= GRID_SIZE - 1) return false;
    for (let gz = gz0; gz <= gz1; gz += 1) {
        for (let gx = gx0; gx <= gx1; gx += 1) {
            if (occ[gridIdx(gx, gz)] !== 0) return false;
        }
    }
    return true;
}

function markRect(occ, originX, originZ, x0, z0, x1, z1, val) {
    const gx0 = Math.max(0, x0 - originX);
    const gz0 = Math.max(0, z0 - originZ);
    const gx1 = Math.min(GRID_SIZE - 1, x1 - originX);
    const gz1 = Math.min(GRID_SIZE - 1, z1 - originZ);
    for (let gz = gz0; gz <= gz1; gz += 1) {
        for (let gx = gx0; gx <= gx1; gx += 1) {
            occ[gridIdx(gx, gz)] = val;
        }
    }
}

function footprintElevation(sampleSurf, x0, z0, x1, z1) {
    const midX = Math.floor((x0 + x1) * 0.5);
    const midZ = Math.floor((z0 + z1) * 0.5);
    const pts = [
        sampleSurf(x0, z0),
        sampleSurf(x1, z0),
        sampleSurf(x0, z1),
        sampleSurf(x1, z1),
        sampleSurf(midX, midZ)
    ];
    let minY = Infinity;
    let maxY = -Infinity;
    let sum = 0;
    for (const y of pts) {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        sum += y;
    }
    const avg = Math.round(sum / pts.length);
    const floorY = Math.max(SEA_LEVEL + 2, Math.min(CHUNK_HEIGHT - 22, Math.round((maxY + avg) * 0.5)));
    return { minY, maxY, avg, floorY, span: maxY - minY };
}

function faceNearestRoad(occ, originX, originZ, cx, cz, vx, vz) {
    let bestDir = null;
    let bestDist = 14;
    for (const dir of DIRS) {
        const dx = dir === "east" ? 1 : dir === "west" ? -1 : 0;
        const dz = dir === "south" ? 1 : dir === "north" ? -1 : 0;
        for (let step = 3; step <= 12; step += 1) {
            const gx = cx + dx * step - originX;
            const gz = cz + dz * step - originZ;
            if (gx < 0 || gz < 0 || gx >= GRID_SIZE || gz >= GRID_SIZE) break;
            if (occ[gridIdx(gx, gz)] === 1) {
                if (step < bestDist) {
                    bestDist = step;
                    bestDir = dir;
                }
                break;
            }
        }
    }
    if (bestDir) return bestDir;
    const toX = vx - cx;
    const toZ = vz - cz;
    if (Math.abs(toX) > Math.abs(toZ)) return toX >= 0 ? "east" : "west";
    return toZ >= 0 ? "south" : "north";
}

function buildSpatialBuckets(blocks, clearZones, foundationZones) {
    const buckets = new Map();
    const getBucket = (cx, cz) => {
        const k = `${cx},${cz}`;
        let b = buckets.get(k);
        if (!b) {
            b = { blocks: [], clears: [], foundations: [] };
            buckets.set(k, b);
        }
        return b;
    };

    for (const z of foundationZones) {
        const cx0 = Math.floor(z.x0 / CHUNK_SIZE);
        const cx1 = Math.floor(z.x1 / CHUNK_SIZE);
        const cz0 = Math.floor(z.z0 / CHUNK_SIZE);
        const cz1 = Math.floor(z.z1 / CHUNK_SIZE);
        for (let cz = cz0; cz <= cz1; cz += 1) {
            const minZ = cz * CHUNK_SIZE;
            const maxZ = minZ + CHUNK_SIZE - 1;
            for (let cx = cx0; cx <= cx1; cx += 1) {
                const minX = cx * CHUNK_SIZE;
                const maxX = minX + CHUNK_SIZE - 1;
                getBucket(cx, cz).foundations.push({
                    x0: Math.max(minX, z.x0),
                    x1: Math.min(maxX, z.x1),
                    z0: Math.max(minZ, z.z0),
                    z1: Math.min(maxZ, z.z1),
                    floorY: z.floorY,
                    style: z.style || "cobble"
                });
            }
        }
    }

    for (const z of clearZones) {
        const cx0 = Math.floor(z.x0 / CHUNK_SIZE);
        const cx1 = Math.floor(z.x1 / CHUNK_SIZE);
        const cz0 = Math.floor(z.z0 / CHUNK_SIZE);
        const cz1 = Math.floor(z.z1 / CHUNK_SIZE);
        for (let cz = cz0; cz <= cz1; cz += 1) {
            const minZ = cz * CHUNK_SIZE;
            const maxZ = minZ + CHUNK_SIZE - 1;
            for (let cx = cx0; cx <= cx1; cx += 1) {
                const minX = cx * CHUNK_SIZE;
                const maxX = minX + CHUNK_SIZE - 1;
                getBucket(cx, cz).clears.push({
                    x0: Math.max(minX, z.x0),
                    x1: Math.min(maxX, z.x1),
                    z0: Math.max(minZ, z.z0),
                    z1: Math.min(maxZ, z.z1),
                    y0: z.y0,
                    y1: z.y1
                });
            }
        }
    }

    for (const blk of blocks) {
        const cx = Math.floor(blk.dx / CHUNK_SIZE);
        const cz = Math.floor(blk.dz / CHUNK_SIZE);
        getBucket(cx, cz).blocks.push(blk);
    }

    return buckets;
}

export function buildVillageLayout(vx, vz, seed, sampleMeta) {
    const originX = vx - GRID_RADIUS;
    const originZ = vz - GRID_RADIUS;
    const occ = new Uint8Array(GRID_SIZE * GRID_SIZE);
    const sampleSurf = createSurfaceSampler(originX, originZ, seed, sampleMeta);
    const rng = mulberry32((seed ^ (vx * 73856093) ^ (vz * 19349663)) >>> 0);
    const baseY = Math.max(SEA_LEVEL + 3, sampleSurf(vx, vz));

    const blocks = [];
    const clearZones = [];
    const foundationZones = [];
    const pois = [];
    const chimneys = [];
    const buildings = [];
    const lamps = [];

    const addBuildingRecord = (kind, fp, floorY, door, chimney, style = "cobble", clearTopY = null) => {
        markRect(occ, originX, originZ, fp.x0, fp.z0, fp.x1, fp.z1, 2);
        const topClear = clearTopY !== null ? clearTopY : floorY + 12;
        clearZones.push({ x0: fp.x0, z0: fp.z0, x1: fp.x1, z1: fp.z1, y0: floorY + 1, y1: topClear });
        foundationZones.push({ x0: fp.x0, z0: fp.z0, x1: fp.x1, z1: fp.z1, floorY, style });
        buildings.push({ kind, x0: fp.x0, z0: fp.z0, x1: fp.x1, z1: fp.z1, floorY });
        if (door) {
            pois.push({ type: kind, x: door.x, y: door.y, z: door.z });
            clearZones.push({ x0: door.x - 1, z0: door.z - 1, x1: door.x + 1, z1: door.z + 1, y0: floorY + 1, y1: floorY + 4 });
            foundationZones.push({ x0: door.x, z0: door.z, x1: door.x, z1: door.z, floorY, style });
        }
        if (chimney) chimneys.push(chimney);
    };

    if (vx === 36 && vz === 36) {
        markRect(occ, originX, originZ, 2, 2, 14, 14, 3);
    }

    for (let dx = -6; dx <= 6; dx += 1) {
        for (let dz = -6; dz <= 6; dz += 1) {
            if (Math.abs(dx) === 6 && Math.abs(dz) === 6) continue;
            const edge = Math.abs(dx) >= 5 || Math.abs(dz) >= 5;
            const id = edge ? BLOCK.STONE_BRICK : (dx + dz) % 2 === 0 ? BLOCK.COBBLESTONE : BLOCK.STONE_BRICK;
            blocks.push({ dx: vx + dx, dy: baseY, dz: vz + dz, id });
        }
    }
    markRect(occ, originX, originZ, vx - 6, vz - 6, vx + 6, vz + 6, 1);
    clearZones.push({ x0: vx - 6, z0: vz - 6, x1: vx + 6, z1: vz + 6, y0: baseY + 1, y1: baseY + 7 });
    foundationZones.push({ x0: vx - 6, z0: vz - 6, x1: vx + 6, z1: vz + 6, floorY: baseY, style: "brick" });

    blocks.push(...buildFountain(vx, baseY, vz));
    pois.push({ type: "plaza", x: vx + 4, y: baseY + 1, z: vz });
    pois.push({ type: "plaza", x: vx - 4, y: baseY + 1, z: vz });
    pois.push({ type: "plaza", x: vx, y: baseY + 1, z: vz + 4 });

    for (const [lx, lz] of [[vx - 5, vz - 5], [vx + 5, vz - 5], [vx - 5, vz + 5], [vx + 5, vz + 5]]) {
        blocks.push(...buildLamp(lx, baseY, lz));
    }

    const flagship = buildTownhouse(vx + 7, baseY, vz + 2, {
        w: 6,
        d: 6,
        dir: "north",
        roofBlock: BLOCK.ROOF_RED
    });
    blocks.push(...flagship.blocks);
    addBuildingRecord("inn", flagship.footprint, baseY, flagship.door, flagship.chimney, "brick", flagship.roofTopY);

    const plazaStalls = [
        { ox: vx - 10, oz: vz - 6, dir: "east", awning: BLOCK.ROOF_RED },
        { ox: vx - 2, oz: vz - 10, dir: "south", awning: BLOCK.ROOF_GREEN },
        { ox: vx - 2, oz: vz + 7, dir: "north", awning: BLOCK.ROOF_RED }
    ];
    for (const st of plazaStalls) {
        const fp = rotatedFootprint(st.ox, st.oz, 5, 3, st.dir);
        if (!isRectFree(occ, originX, originZ, fp.x0, fp.z0, fp.x1, fp.z1, 0)) continue;
        const elev = footprintElevation(sampleSurf, fp.x0, fp.z0, fp.x1, fp.z1);
        const y = Math.abs(elev.floorY - baseY) <= 3 ? baseY : elev.floorY;
        const res = buildMarketStall(st.ox, y, st.oz, st.dir, st.awning);
        blocks.push(...res.blocks);
        addBuildingRecord("market", res.footprint, y, res.door, null, "brick", res.roofTopY);
    }

    const stampRoadCell = (wx, wz, y, wide) => {
        const gx = wx - originX;
        const gz = wz - originZ;
        if (gx < 2 || gz < 2 || gx >= GRID_SIZE - 2 || gz >= GRID_SIZE - 2) return;
        const r = wide ? 1 : 0;
        for (let dz = -r; dz <= r; dz += 1) {
            for (let dx = -r; dx <= r; dx += 1) {
                const nx = wx + dx;
                const nz = wz + dz;
                const idx = gridIdx(nx - originX, nz - originZ);
                if (occ[idx] === 2 || occ[idx] === 3) continue;
                occ[idx] = 1;
                const edge = wide && (Math.abs(dx) === 1 || Math.abs(dz) === 1);
                blocks.push({ dx: nx, dy: y, dz: nz, id: edge ? BLOCK.STONE_BRICK : BLOCK.COBBLESTONE });
                clearZones.push({ x0: nx, z0: nz, x1: nx, z1: nz, y0: y + 1, y1: y + 4 });
                foundationZones.push({ x0: nx, z0: nz, x1: nx, z1: nz, floorY: y, style: "cobble" });
            }
        }
    };

    const traceAvenue = (dirX, dirZ, maxLen, wobblePhase) => {
        let curY = baseY;
        for (let step = 7; step <= maxLen; step += 1) {
            const wobble = Math.round(Math.sin(step * 0.14 + wobblePhase) * 2.1);
            const wx = vx + dirX * step + (dirZ !== 0 ? wobble : 0);
            const wz = vz + dirZ * step + (dirX !== 0 ? wobble : 0);
            const surf = sampleSurf(wx, wz);
            if (surf <= SEA_LEVEL) break;
            const targetY = Math.max(SEA_LEVEL + 1, surf);
            if (targetY > curY) curY += 1;
            else if (targetY < curY) curY -= 1;
            stampRoadCell(wx, wz, curY, true);
            if (step % 11 === 0) {
                const lx = wx + (dirZ !== 0 ? 2 : 0);
                const lz = wz + (dirX !== 0 ? 2 : 0);
                lamps.push({ x: lx, y: curY, z: lz });
            }
        }
    };

    traceAvenue(1, 0, 52, 0.2);
    traceAvenue(-1, 0, 52, 1.5);
    traceAvenue(0, 1, 52, 2.7);
    traceAvenue(0, -1, 52, 4.1);

    for (const radius of [22, 38]) {
        const steps = Math.round(radius * 6.4);
        let prevY = baseY;
        for (let i = 0; i < steps; i += 1) {
            const ang = (i / steps) * Math.PI * 2;
            const wx = Math.round(vx + Math.cos(ang) * radius);
            const wz = Math.round(vz + Math.sin(ang) * radius);
            const surf = sampleSurf(wx, wz);
            if (surf <= SEA_LEVEL + 1) continue;
            const targetY = Math.max(SEA_LEVEL + 1, surf);
            if (Math.abs(targetY - prevY) > 1) {
                prevY += Math.sign(targetY - prevY);
            } else {
                prevY = targetY;
            }
            stampRoadCell(wx, wz, prevY, false);
            if (i % 18 === 0) {
                lamps.push({ x: wx + 1, y: prevY, z: wz + 1 });
            }
        }
    }

    const piers = [];
    for (let rz = -56; rz <= 56; rz += 4) {
        for (let rx = -56; rx <= 56; rx += 4) {
            if (piers.length >= 3) break;
            const dist = Math.hypot(rx, rz);
            if (dist < 16 || dist > 58) continue;
            const wx = vx + rx;
            const wz = vz + rz;
            const s = sampleSurf(wx, wz);
            if (s < SEA_LEVEL + 1 || s > SEA_LEVEL + 3) continue;
            if (piers.some((p) => Math.hypot(p.x - wx, p.z - wz) < 18)) continue;

            for (const dir of DIRS) {
                const dx = dir === "east" ? 1 : dir === "west" ? -1 : 0;
                const dz = dir === "south" ? 1 : dir === "north" ? -1 : 0;
                let waterDepthOk = true;
                for (let step = 2; step <= 11; step += 1) {
                    const ws = sampleSurf(wx + dx * step, wz + dz * step);
                    if (ws > SEA_LEVEL - 1) {
                        waterDepthOk = false;
                        break;
                    }
                }
                if (!waterDepthOk) continue;
                const length = 10 + Math.floor(rng() * 3);
                const ox = dir === "west" ? wx - length + 1 : wx;
                const oz = dir === "north" ? wz - length + 1 : wz;
                const fp = rotatedFootprint(ox, oz, 3, length, dir);
                if (!isRectFree(occ, originX, originZ, fp.x0, fp.z0, fp.x1, fp.z1, 1)) continue;
                const res = buildHarborPier(ox, oz, dir, length, sampleSurf);
                blocks.push(...res.blocks);
                markRect(occ, originX, originZ, fp.x0, fp.z0, fp.x1, fp.z1, 2);
                clearZones.push({ x0: fp.x0, z0: fp.z0, x1: fp.x1, z1: fp.z1, y0: SEA_LEVEL + 2, y1: SEA_LEVEL + 6 });
                pois.push({ type: "dock", x: res.door.x, y: res.door.y, z: res.door.z });
                buildings.push({ kind: "dock", x0: fp.x0, z0: fp.z0, x1: fp.x1, z1: fp.z1, floorY: SEA_LEVEL + 1 });
                piers.push({ x: wx, z: wz });
                break;
            }
        }
    }

    const candidates = [];
    for (let rz = -56; rz <= 56; rz += 6) {
        for (let rx = -56; rx <= 56; rx += 6) {
            const dist = Math.hypot(rx, rz);
            if (dist < 11 || dist > 58) continue;
            const wx = vx + rx + Math.floor((rng() - 0.5) * 3);
            const wz = vz + rz + Math.floor((rng() - 0.5) * 3);
            const surf = sampleSurf(wx, wz);
            if (surf <= SEA_LEVEL || surf > CHUNK_HEIGHT - 24) continue;
            candidates.push({ wx, wz, dist, surf, jitter: rng() });
        }
    }

    const tryPlaceStructure = (kind, ox, oz, w, d, dir, opts = {}) => {
        const fp = rotatedFootprint(ox, oz, w, d, dir);
        const margin = opts.margin ?? 1;
        if (!isRectFree(occ, originX, originZ, fp.x0, fp.z0, fp.x1, fp.z1, margin)) return null;
        const elev = footprintElevation(sampleSurf, fp.x0, fp.z0, fp.x1, fp.z1);
        if (elev.avg <= SEA_LEVEL) return null;
        if (elev.span > (opts.maxSpan ?? 10)) return null;
        const floorY = elev.floorY;

        if (kind === "church") {
            const res = buildChurch(ox, floorY, oz, dir);
            blocks.push(...res.blocks);
            addBuildingRecord("church", res.footprint, floorY, res.door, null, "cobble", res.roofTopY);
            return res;
        }
        if (kind === "forge") {
            const res = buildBlacksmith(ox, floorY, oz, dir);
            blocks.push(...res.blocks);
            addBuildingRecord("forge", res.footprint, floorY, res.door, res.chimney, "cobble", res.roofTopY);
            return res;
        }
        if (kind === "townhouse") {
            const res = buildTownhouse(ox, floorY, oz, { w, d, dir, roofBlock: opts.roofBlock });
            blocks.push(...res.blocks);
            addBuildingRecord("inn", res.footprint, floorY, res.door, res.chimney, "cobble", res.roofTopY);
            return res;
        }
        if (kind === "farm") {
            const res = buildTerracedFarm(ox, floorY, oz, w, d, dir);
            blocks.push(...res.blocks);
            addBuildingRecord("farm", res.footprint, floorY, res.door, null, "cobble", res.roofTopY);
            return res;
        }
        if (kind === "windmill") {
            const list = buildWindmill(ox, floorY, oz);
            blocks.push(...list);
            addBuildingRecord("farm", fp, floorY, { x: ox + 2, y: floorY + 1, z: oz - 1 }, null, "brick", floorY + 15);
            return { footprint: fp };
        }
        if (kind === "tower") {
            const list = buildTower(ox, floorY, oz);
            blocks.push(...list);
            addBuildingRecord("tower", fp, floorY, { x: ox - 1, y: floorY + 1, z: oz + 2 }, null, "brick", floorY + 18);
            return { footprint: fp };
        }
        const res = buildTimberHouse(ox, floorY, oz, {
            w,
            d,
            dir,
            roofBlock: opts.roofBlock,
            wallBlock: opts.wallBlock,
            wallH: opts.wallH,
            chimney: opts.chimney
        });
        blocks.push(...res.blocks);
        addBuildingRecord("home", res.footprint, floorY, res.door, res.chimney, "cobble", res.roofTopY);
        return res;
    };

    const coastalCandidates = [...candidates].sort((a, b) => a.surf - b.surf);
    let forgeCount = 0;
    for (const c of coastalCandidates) {
        if (forgeCount >= 2) break;
        if (forgeCount === 0 && c.surf > SEA_LEVEL + 7 && coastalCandidates[0].surf <= SEA_LEVEL + 7) continue;
        const dir = faceNearestRoad(occ, originX, originZ, c.wx + 4, c.wz + 3, vx, vz);
        if (tryPlaceStructure("forge", c.wx, c.wz, 8, 7, dir, { margin: 1, maxSpan: 8 })) {
            forgeCount += 1;
        }
    }

    const churchSpots = [];
    const churchPool = [...candidates].sort((a, b) => (a.dist - 28) * (a.dist - 28) - (b.dist - 28) * (b.dist - 28));
    for (const c of churchPool) {
        if (churchSpots.length >= 3) break;
        if (churchSpots.some((p) => Math.hypot(p.x - c.wx, p.z - c.wz) < 26)) continue;
        const dir = faceNearestRoad(occ, originX, originZ, c.wx + 3, c.wz + 4, vx, vz);
        if (tryPlaceStructure("church", c.wx, c.wz, 7, 9, dir, { margin: 1, maxSpan: 9 })) {
            churchSpots.push({ x: c.wx, z: c.wz });
        }
    }

    const hillPool = [...candidates].sort((a, b) => b.surf - a.surf);
    let windmillPlaced = false;
    let towerCount = 0;
    for (const c of hillPool) {
        if (!windmillPlaced && c.dist >= 20 && c.dist <= 52) {
            if (tryPlaceStructure("windmill", c.wx, c.wz, 5, 5, "south", { margin: 2, maxSpan: 7 })) {
                windmillPlaced = true;
                continue;
            }
        }
        if (towerCount < 2 && c.dist >= 28) {
            if (tryPlaceStructure("tower", c.wx, c.wz, 5, 5, "south", { margin: 2, maxSpan: 8 })) {
                towerCount += 1;
            }
        }
        if (windmillPlaced && towerCount >= 2) break;
    }

    let farmCount = 0;
    const farmPool = [...candidates].sort((a, b) => a.jitter - b.jitter);
    for (const c of farmPool) {
        if (farmCount >= 4) break;
        if (c.dist < 18 || c.dist > 54) continue;
        const dir = faceNearestRoad(occ, originX, originZ, c.wx + 3, c.wz + 3, vx, vz);
        if (tryPlaceStructure("farm", c.wx, c.wz, 7, 6, dir, { margin: 1, maxSpan: 5 })) {
            farmCount += 1;
        }
    }

    let townhouseCount = 0;
    const midPool = [...candidates].sort((a, b) => a.dist - b.dist + (a.jitter - b.jitter) * 14);
    for (const c of midPool) {
        if (townhouseCount >= 5) break;
        if (c.dist < 13 || c.dist > 44) continue;
        const dir = faceNearestRoad(occ, originX, originZ, c.wx + 3, c.wz + 3, vx, vz);
        const accentRoll = rng();
        const roofBlock = accentRoll < 0.28 ? BLOCK.ROOF_RED : accentRoll < 0.42 ? BLOCK.ROOF_GREEN : BLOCK.WOOD_PLANKS;
        if (tryPlaceStructure("townhouse", c.wx, c.wz, 7, 7, dir, { margin: 1, maxSpan: 9, roofBlock })) {
            townhouseCount += 1;
        }
    }

    const houseShapes = [
        [5, 5, 3],
        [6, 6, 3],
        [6, 7, 3],
        [7, 6, 3],
        [8, 6, 4],
        [5, 6, 3]
    ];
    let houseCount = 0;
    const denseGrid = [];
    for (let rz = -58; rz <= 58; rz += 5) {
        for (let rx = -58; rx <= 58; rx += 5) {
            const dist = Math.hypot(rx, rz);
            if (dist < 10 || dist > 60) continue;
            denseGrid.push({
                wx: vx + rx + Math.floor((rng() - 0.5) * 3),
                wz: vz + rz + Math.floor((rng() - 0.5) * 3),
                dist,
                key: rng()
            });
        }
    }
    denseGrid.sort((a, b) => a.dist * 0.4 + a.key * 35 - (b.dist * 0.4 + b.key * 35));

    for (const slot of denseGrid) {
        if (houseCount >= 44) break;
        const shape = houseShapes[Math.floor(rng() * houseShapes.length)];
        const dir = faceNearestRoad(occ, originX, originZ, slot.wx + 3, slot.wz + 3, vx, vz);
        const roofRoll = rng();
        let roofBlock = BLOCK.WOOD_PLANKS;
        if (roofRoll > 0.85) roofBlock = BLOCK.ROOF_RED;
        else if (roofRoll > 0.77) roofBlock = BLOCK.ROOF_GREEN;
        const wallBlock = rng() < 0.34 ? BLOCK.PLASTER : BLOCK.WOOD_PLANKS;
        const res = tryPlaceStructure("home", slot.wx, slot.wz, shape[0], shape[1], dir, {
            margin: 1,
            maxSpan: 11,
            roofBlock,
            wallBlock,
            wallH: shape[2],
            chimney: rng() < 0.58
        });
        if (res) houseCount += 1;
    }

    for (const l of lamps) {
        const gx = l.x - originX;
        const gz = l.z - originZ;
        if (gx < 2 || gz < 2 || gx >= GRID_SIZE - 2 || gz >= GRID_SIZE - 2) continue;
        if (occ[gridIdx(gx, gz)] === 2 || occ[gridIdx(gx, gz)] === 3) continue;
        blocks.push({ dx: l.x, dy: l.y, dz: l.z, id: BLOCK.STONE_BRICK });
        blocks.push(...buildLanternPost(l.x, l.y, l.z));
        clearZones.push({ x0: l.x, z0: l.z, x1: l.x + 1, z1: l.z, y0: l.y + 1, y1: l.y + 5 });
        foundationZones.push({ x0: l.x, z0: l.z, x1: l.x, z1: l.z, floorY: l.y, style: "cobble" });
    }

    const chunkBuckets = buildSpatialBuckets(blocks, clearZones, foundationZones);

    return {
        vx,
        vz,
        baseY,
        radius: TOWN_RADIUS,
        gridOriginX: originX,
        gridOriginZ: originZ,
        gridSize: GRID_SIZE,
        occ,
        chunkBuckets,
        pois,
        chimneys,
        buildings,
        blocks,
        clearZones,
        foundationZones
    };
}
