export const X_ROADS = Object.freeze([-270, -180, -90, 0, 90, 180, 270]);
export const Z_ROADS = Object.freeze([-270, -180, -90, 0, 90, 180, 270]);
export const ROAD_HALF_WIDTH = 8.4;
export const SIDEWALK_HALF_WIDTH = 12.6;
export const LANE_OFFSET = 4.0;
export const WORLD_HALF = 384;
export const OCEAN_LEVEL = -1.6;

export const X_STREET_NAMES = Object.freeze([
    "Pacific Blvd",
    "Rockford Dr",
    "Alta St",
    "Power St",
    "Elgin Ave",
    "Innocence Blvd",
    "La Mesa Ave"
]);

export const Z_STREET_NAMES = Object.freeze([
    "Eclipse Blvd",
    "Vinewood Blvd",
    "Integrity Way",
    "Strawberry Ave",
    "Olympic Fwy",
    "Del Perro Fwy",
    "Vespucci Blvd"
]);

export const GPS_DESTINATIONS = Object.freeze({
    downtown: { x: 0, z: -90, label: "Downtown Maze Bank" },
    strawberry: { x: 90, z: 0, label: "Strawberry Ave" },
    construction: { x: 90, z: -90, label: "Crane Construction Site" },
    beach: { x: 0, z: 270, label: "Vespucci Beach Pier" },
    safehouse: { x: 0, z: -270, label: "Vinewood Safehouse" }
});

export const SAFEHOUSE_ORIGIN = Object.freeze({ x: 0, z: -304, y: 12.5 });

function clamp01(t) {
    return t < 0 ? 0 : t > 1 ? 1 : t;
}

function smoothstep(edge0, edge1, x) {
    const t = clamp01((x - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
}

export function heightAt(x, z) {
    let h = 0;
    if (z < -155) {
        const rise = smoothstep(-155, -270, z);
        h += rise * 8.4;
        if (z < -270) {
            const upper = smoothstep(-270, -300, z);
            const driveBlend = 1 - smoothstep(10, 24, Math.abs(x));
            h += upper * (4.1 + (1 - driveBlend) * 2.2);
        }
        if (z < -314) {
            const ridge = smoothstep(-314, -368, z);
            const wave = Math.sin(x * 0.018) * 3.5 + Math.cos(x * 0.037) * 1.8;
            h += ridge * (18.5 + wave);
        }
    } else if (z > 286) {
        const drop = smoothstep(286, 336, z);
        h -= drop * 2.1;
    }
    return h;
}

export function nearestRoadDist(x, z) {
    let minDx = Infinity;
    let minDz = Infinity;
    let nearXIdx = 0;
    let nearZIdx = 0;
    for (let i = 0; i < X_ROADS.length; i += 1) {
        const d = Math.abs(x - X_ROADS[i]);
        if (d < minDx) {
            minDx = d;
            nearXIdx = i;
        }
    }
    for (let i = 0; i < Z_ROADS.length; i += 1) {
        const d = Math.abs(z - Z_ROADS[i]);
        if (d < minDz) {
            minDz = d;
            nearZIdx = i;
        }
    }
    return { minDx, minDz, nearXIdx, nearZIdx };
}

export function isOnDriveway(x, z) {
    return Math.abs(x) <= 9.5 && z <= -270 && z >= -300;
}

export function isOnSafehouseTerrace(x, z) {
    return Math.abs(x) <= 18 && z <= -294 && z >= -318;
}

export function surfaceAt(x, z) {
    if (z > 286) return z > 322 ? "water" : "sand";
    if (isOnDriveway(x, z)) return "asphalt";
    if (isOnSafehouseTerrace(x, z)) return "concrete";
    const r = nearestRoadDist(x, z);
    const inGridX = x >= -282 && x <= 282;
    const inGridZ = z >= -282 && z <= 282;
    if (inGridX && inGridZ) {
        if (r.minDx <= ROAD_HALF_WIDTH || r.minDz <= ROAD_HALF_WIDTH) return "asphalt";
        if (r.minDx <= SIDEWALK_HALF_WIDTH || r.minDz <= SIDEWALK_HALF_WIDTH) return "concrete";
    }
    if (z < -282) return "grass";
    return "concrete";
}

export function waterLevelAt(x, z) {
    if (z > 316 && heightAt(x, z) < OCEAN_LEVEL + 0.15) return OCEAN_LEVEL;
    return null;
}

export function lookupLocation(x, z) {
    if (isOnSafehouseTerrace(x, z) || isOnDriveway(x, z)) {
        return { district: "Vinewood Hills", street: "Safehouse Terrace" };
    }
    let district = "Downtown";
    if (z < -215) district = "Vinewood Hills";
    else if (z < -130) district = "Eclipse";
    else if (z < -35) district = "Downtown";
    else if (z < 65) district = "Strawberry";
    else if (z < 215) district = "Del Perro";
    else district = "Vespucci Beach";

    const r = nearestRoadDist(x, z);
    const street = r.minDz <= r.minDx ? Z_STREET_NAMES[r.nearZIdx] : X_STREET_NAMES[r.nearXIdx];
    return { district, street };
}

export function getSignalState(ix, iz, timeSec) {
    const cycle = 16;
    const phase = ((timeSec + (ix * 3 + iz * 5)) % cycle + cycle) % cycle;
    if (phase < 6.5) return "ns_green";
    if (phase < 8.0) return "ns_yellow";
    if (phase < 14.5) return "ew_green";
    return "ew_yellow";
}

export function buildRoadGraph() {
    const nodes = [];
    const nx = X_ROADS.length;
    const nz = Z_ROADS.length;
    for (let iz = 0; iz < nz; iz += 1) {
        for (let ix = 0; ix < nx; ix += 1) {
            const x = X_ROADS[ix];
            const z = Z_ROADS[iz];
            nodes.push({
                id: iz * nx + ix,
                ix,
                iz,
                x,
                z,
                y: heightAt(x, z),
                neighbors: []
            });
        }
    }
    for (let iz = 0; iz < nz; iz += 1) {
        for (let ix = 0; ix < nx; ix += 1) {
            const node = nodes[iz * nx + ix];
            if (ix > 0) node.neighbors.push(iz * nx + (ix - 1));
            if (ix < nx - 1) node.neighbors.push(iz * nx + (ix + 1));
            if (iz > 0) node.neighbors.push((iz - 1) * nx + ix);
            if (iz < nz - 1) node.neighbors.push((iz + 1) * nx + ix);
        }
    }
    return { nodes, nx, nz };
}

export function nearestNodeId(graph, x, z) {
    let bestId = 0;
    let bestD2 = Infinity;
    for (let i = 0; i < graph.nodes.length; i += 1) {
        const n = graph.nodes[i];
        const dx = n.x - x;
        const dz = n.z - z;
        const d2 = dx * dx + dz * dz;
        if (d2 < bestD2) {
            bestD2 = d2;
            bestId = n.id;
        }
    }
    return bestId;
}

export function computeGpsRoute(graph, startX, startZ, destKey) {
    const dest = GPS_DESTINATIONS[destKey];
    if (!dest) return { points: [], distanceMeters: 0, distanceMiles: 0, label: "" };
    const startId = nearestNodeId(graph, startX, startZ);
    const goalId = nearestNodeId(graph, dest.x, dest.z);
    const open = new Set([startId]);
    const cameFrom = new Int32Array(graph.nodes.length);
    cameFrom.fill(-1);
    const gScore = new Float64Array(graph.nodes.length);
    const fScore = new Float64Array(graph.nodes.length);
    gScore.fill(Infinity);
    fScore.fill(Infinity);
    gScore[startId] = 0;
    const h = (id) => {
        const a = graph.nodes[id];
        const b = graph.nodes[goalId];
        return Math.hypot(a.x - b.x, a.z - b.z);
    };
    fScore[startId] = h(startId);

    while (open.size > 0) {
        let cur = -1;
        let bestF = Infinity;
        for (const id of open) {
            if (fScore[id] < bestF) {
                bestF = fScore[id];
                cur = id;
            }
        }
        if (cur === goalId) break;
        open.delete(cur);
        const curNode = graph.nodes[cur];
        for (const nb of curNode.neighbors) {
            const nbNode = graph.nodes[nb];
            const tentative = gScore[cur] + Math.hypot(nbNode.x - curNode.x, nbNode.z - curNode.z);
            if (tentative < gScore[nb]) {
                cameFrom[nb] = cur;
                gScore[nb] = tentative;
                fScore[nb] = tentative + h(nb);
                open.add(nb);
            }
        }
    }

    const chain = [];
    let c = goalId;
    while (c >= 0) {
        const n = graph.nodes[c];
        chain.push({ x: n.x, z: n.z });
        if (c === startId) break;
        c = cameFrom[c];
    }
    chain.reverse();
    const points = [{ x: startX, z: startZ }, ...chain];
    let distanceMeters = 0;
    for (let i = 1; i < points.length; i += 1) {
        distanceMeters += Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z);
    }
    return {
        points,
        distanceMeters,
        distanceMiles: distanceMeters / 1609.34,
        label: dest.label
    };
}
