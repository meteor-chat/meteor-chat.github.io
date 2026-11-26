import { mulberry32 } from "../voxel/voxel-noise.js";
import {
    LANE_OFFSET,
    SIDEWALK_HALF_WIDTH,
    X_ROADS,
    Z_ROADS,
    getSignalState,
    heightAt
} from "./gta-road-graph.js";

const CIVILIAN_COLORS = [
    0xdbe4ee, 0x263142, 0x8f2424, 0x1e4d6b, 0x4b5563, 0xb45309, 0x1f2937, 0xcbd5e1
];
const CIVILIAN_PRESETS = ["elegy", "cavalcade", "gauntlet"];

function lanePos(from, to, t) {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const len = Math.max(1, Math.hypot(dx, dz));
    const ux = dx / len;
    const uz = dz / len;
    const rightX = -uz;
    const rightZ = ux;
    const x = from.x + dx * t + rightX * LANE_OFFSET;
    const z = from.z + dz * t + rightZ * LANE_OFFSET;
    return { x, z, y: heightAt(x, z), yaw: Math.atan2(ux, uz), ux, uz };
}

export function createTrafficSystem(graph, seed = 2026) {
    const rng = mulberry32(seed ^ 0x3f8c21);
    const cars = [];
    const peds = [];

    const pickNextNeighbor = (fromId, prevId) => {
        const node = graph.nodes[fromId];
        const choices = node.neighbors.filter((id) => id !== prevId);
        const pool = choices.length > 0 ? choices : node.neighbors;
        return pool[Math.floor(rng() * pool.length)];
    };

    const carCount = 22;
    for (let i = 0; i < carCount; i += 1) {
        const fromId = Math.floor(rng() * graph.nodes.length);
        const toId = pickNextNeighbor(fromId, -1);
        const t = 0.15 + rng() * 0.7;
        const p = lanePos(graph.nodes[fromId], graph.nodes[toId], t);
        cars.push({
            id: `civ-${i}`,
            preset: CIVILIAN_PRESETS[i % CIVILIAN_PRESETS.length],
            color: CIVILIAN_COLORS[i % CIVILIAN_COLORS.length],
            fromId,
            toId,
            t,
            speed: 10 + rng() * 6,
            baseSpeed: 10 + rng() * 6,
            pos: { x: p.x, y: p.y, z: p.z },
            yaw: p.yaw,
            knockVx: 0,
            knockVz: 0,
            knockTimer: 0,
            stopped: false
        });
    }

    const pedCount = 20;
    for (let i = 0; i < pedCount; i += 1) {
        const alongX = i % 2 === 0;
        const roadCoord = alongX
            ? Z_ROADS[1 + (i % (Z_ROADS.length - 2))] + (i % 4 < 2 ? SIDEWALK_HALF_WIDTH - 1.4 : -(SIDEWALK_HALF_WIDTH - 1.4))
            : X_ROADS[1 + (i % (X_ROADS.length - 2))] + (i % 4 < 2 ? SIDEWALK_HALF_WIDTH - 1.4 : -(SIDEWALK_HALF_WIDTH - 1.4));
        const posAlong = -220 + rng() * 440;
        const x = alongX ? posAlong : roadCoord;
        const z = alongX ? roadCoord : posAlong;
        peds.push({
            id: `ped-${i}`,
            x,
            y: heightAt(x, z),
            z,
            alongX,
            dir: rng() < 0.5 ? 1 : -1,
            speed: 1.5 + rng() * 0.8,
            phase: rng() * Math.PI * 2,
            shirtColor: [0x2563eb, 0xdc2626, 0x16a34a, 0xeab308, 0xe2e8f0, 0x7c3aed][i % 6]
        });
    }

    const update = (dt, timeSec, playerState, onCrash = null) => {
        const stepDt = Math.min(0.05, Math.max(0.001, dt));
        for (let i = 0; i < cars.length; i += 1) {
            const c = cars[i];
            if (c.knockTimer > 0) {
                c.knockTimer -= stepDt;
                c.pos.x += c.knockVx * stepDt;
                c.pos.z += c.knockVz * stepDt;
                c.pos.y = heightAt(c.pos.x, c.pos.z);
                c.knockVx *= Math.exp(-3.4 * stepDt);
                c.knockVz *= Math.exp(-3.4 * stepDt);
                c.yaw += stepDt * 1.4;
                continue;
            }

            const from = graph.nodes[c.fromId];
            const to = graph.nodes[c.toId];
            const segLen = Math.max(1, Math.hypot(to.x - from.x, to.z - from.z));
            const movingNS = Math.abs(to.z - from.z) > Math.abs(to.x - from.x);
            const sig = getSignalState(to.ix, to.iz, timeSec);
            const redLight = (movingNS && (sig === "ew_green" || sig === "ew_yellow")) || (!movingNS && (sig === "ns_green" || sig === "ns_yellow"));

            let targetSpeed = c.baseSpeed;
            if (redLight && c.t > 0.72 && c.t < 0.92) {
                targetSpeed = 0;
            }

            if (playerState && playerState.pos) {
                const dx = playerState.pos.x - c.pos.x;
                const dz = playerState.pos.z - c.pos.z;
                const dist = Math.hypot(dx, dz);
                if (dist < 14) {
                    const fwdDot = dx * Math.sin(c.yaw) + dz * Math.cos(c.yaw);
                    if (fwdDot > 2.5) targetSpeed = 0;
                }
                if (playerState.isDriving && dist < 3.6 && (playerState.speed || 0) > 4.5) {
                    const nx = dist > 0.01 ? -dx / dist : 1;
                    const nz = dist > 0.01 ? -dz / dist : 0;
                    const push = Math.min(22, playerState.speed * 0.85);
                    c.knockVx = nx * push;
                    c.knockVz = nz * push;
                    c.knockTimer = 1.8;
                    if (onCrash) onCrash(c, playerState.speed);
                    continue;
                }
            }

            for (let j = 0; j < cars.length; j += 1) {
                if (i === j) continue;
                const other = cars[j];
                const dx = other.pos.x - c.pos.x;
                const dz = other.pos.z - c.pos.z;
                const d = Math.hypot(dx, dz);
                if (d < 12) {
                    const fwdDot = dx * Math.sin(c.yaw) + dz * Math.cos(c.yaw);
                    if (fwdDot > 3.2) {
                        targetSpeed = 0;
                        break;
                    }
                }
            }

            c.speed += (targetSpeed - c.speed) * Math.min(1, stepDt * 4.5);
            c.stopped = c.speed < 0.6;
            c.t += (c.speed * stepDt) / segLen;
            if (c.t >= 1) {
                const nextId = pickNextNeighbor(c.toId, c.fromId);
                c.fromId = c.toId;
                c.toId = nextId;
                c.t -= 1;
            }
            const p = lanePos(graph.nodes[c.fromId], graph.nodes[c.toId], c.t);
            c.pos.x = p.x;
            c.pos.y = p.y;
            c.pos.z = p.z;
            c.yaw = p.yaw;
        }

        for (let i = 0; i < peds.length; i += 1) {
            const p = peds[i];
            let spd = p.speed;
            if (playerState && playerState.pos) {
                const d = Math.hypot(playerState.pos.x - p.x, playerState.pos.z - p.z);
                if (d < 9 && playerState.isDriving && (playerState.speed || 0) > 6) {
                    spd = 5.2;
                }
            }
            if (p.alongX) {
                p.x += p.dir * spd * stepDt;
                if (p.x > 255) p.dir = -1;
                if (p.x < -255) p.dir = 1;
            } else {
                p.z += p.dir * spd * stepDt;
                if (p.z > 255) p.dir = -1;
                if (p.z < -255) p.dir = 1;
            }
            p.y = heightAt(p.x, p.z);
            p.phase += stepDt * spd * 4.2;
        }
    };

    return { cars, peds, update };
}
