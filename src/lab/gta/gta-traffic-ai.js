import { mulberry32 } from "./gta-noise.js";
import {
    LANE_OFFSET,
    SIDEWALK_HALF_WIDTH,
    X_ROADS,
    Z_ROADS,
    getSignalState,
    heightAt
} from "./gta-road-graph.js";

import { VEHICLE_PRESETS } from "./gta-vehicle-specs.js";

const CIVILIAN_COLORS = [
    0xb2beca, 0x263142, 0x8f2424, 0x1e4d6b, 0x4b5563, 0xa85517, 0x1f2937, 0x9aa6b4
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
    const pedShirts = [0x2a4d7a, 0x9e2b2b, 0x2f6b47, 0xb38226, 0xc8ccd2, 0x5c3c82, 0x374151, 0x9a4a2a];
    const pedPants = [0x1e293b, 0x2d3a4b, 0x3f3a34, 0x242830, 0x5c5346];
    const pedSkins = [0xe0b494, 0xc8956e, 0x9e6d4b, 0xead0b7, 0x7a5036];
    const pedHairs = [0x181512, 0x3b2a1e, 0x6b4b2a, 0x282422, 0x8c6d46];
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
            shirtColor: pedShirts[i % pedShirts.length],
            pantsColor: pedPants[i % pedPants.length],
            skinColor: pedSkins[i % pedSkins.length],
            hairColor: pedHairs[i % pedHairs.length]
        });
    }

    let physWorld = null;
    const attachColliders = (world) => {
        if (!world || !world.createKinematicBox) return;
        physWorld = world;
        for (let i = 0; i < cars.length; i += 1) {
            const c = cars[i];
            const spec = VEHICLE_PRESETS[c.preset] || VEHICLE_PRESETS.elegy;
            c.body = world.createKinematicBox({
                x: c.pos.x,
                y: c.pos.y + spec.halfExtents[1] + 0.16,
                z: c.pos.z,
                hx: spec.halfExtents[0] * 0.96,
                hy: spec.halfExtents[1] + 0.14,
                hz: spec.halfExtents[2] * 0.96,
                yaw: c.yaw
            });
            c.bodyHalfY = spec.halfExtents[1] + 0.16;
        }
    };

    const syncPhysics = (dt) => {
        if (!physWorld) return;
        for (let i = 0; i < cars.length; i += 1) {
            const c = cars[i];
            if (!c.body) continue;
            physWorld.moveKinematic(c.body, c.pos.x, c.pos.y + (c.bodyHalfY || 0.72), c.pos.z, c.yaw, dt);
        }
    };

    const teleportCar = (index, x, z) => {
        const c = cars[index];
        if (!c) return;
        c.pos.x = x;
        c.pos.z = z;
        c.pos.y = heightAt(x, z);
        if (physWorld && c.body) {
            physWorld.teleportBody(c.body, c.pos.x, c.pos.y + (c.bodyHalfY || 0.72), c.pos.z, c.yaw);
        }
    };

    const dispose = () => {
        if (!physWorld) return;
        for (let i = 0; i < cars.length; i += 1) {
            if (cars[i].body) {
                physWorld.removeBody(cars[i].body);
                cars[i].body = null;
            }
        }
        physWorld = null;
    };

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

    return { cars, peds, update, attachColliders, syncPhysics, teleportCar, dispose };
}
