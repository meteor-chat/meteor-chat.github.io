import { mulberry32 } from "../voxel/voxel-noise.js";
import { WORLD_HALF, heightAt } from "./gta-road-graph.js";

const UNIT_CAP_BY_STAR = [0, 2, 3, 5, 6, 8];
const ESCAPE_DURATION = 9.0;
const SPOTTED_RADIUS = 82;

export function createPoliceSystem(graph, seed = 2026) {
    const rng = mulberry32(seed ^ 0x911a07);
    const units = [];
    let stars = 0;
    let heat = 0;
    let evadingTimer = 0;
    let evading = false;

    const spawnUnitNear = (px, pz, isRoadblock = false) => {
        let best = null;
        let bestScore = Infinity;
        for (let i = 0; i < graph.nodes.length; i += 1) {
            const n = graph.nodes[i];
            const d = Math.hypot(n.x - px, n.z - pz);
            if (d < 48 || d > 135) continue;
            const score = Math.abs(d - (isRoadblock ? 75 : 64)) + rng() * 25;
            if (score < bestScore) {
                bestScore = score;
                best = n;
            }
        }
        const sx = best ? best.x + (isRoadblock ? 0 : 4) : Math.max(-250, Math.min(250, px + 65));
        const sz = best ? best.z : Math.max(-250, Math.min(250, pz + 65));
        const yaw = isRoadblock
            ? Math.atan2(px - sx, pz - sz) + Math.PI * 0.5
            : Math.atan2(px - sx, pz - sz);
        return {
            id: `lspd-${units.length}-${Math.floor(rng() * 9999)}`,
            pos: { x: sx, y: heightAt(sx, sz), z: sz },
            yaw,
            speed: isRoadblock ? 0 : 14,
            roadblock: isRoadblock,
            knockVx: 0,
            knockVz: 0,
            knockTimer: 0
        };
    };

    const setWanted = (level) => {
        stars = Math.max(0, Math.min(5, Math.floor(level)));
        heat = stars * 25;
        evading = false;
        evadingTimer = 0;
        if (stars === 0) units.length = 0;
    };

    const addHeat = (amount) => {
        heat = Math.min(130, heat + amount);
        const nextStars = Math.min(5, Math.floor(heat / 24) + (heat > 8 ? 1 : 0));
        if (nextStars > stars) stars = nextStars;
        evading = false;
        evadingTimer = 0;
        return stars;
    };

    const update = (dt, playerState, onRam = null, onEscaped = null) => {
        const stepDt = Math.min(0.05, Math.max(0.001, dt));
        if (stars <= 0) {
            if (units.length > 0) units.length = 0;
            evading = false;
            evadingTimer = 0;
            return { stars: 0, evading: false, nearestDist: Infinity };
        }

        const px = playerState.pos.x;
        const pz = playerState.pos.z;
        const cap = UNIT_CAP_BY_STAR[stars];
        while (units.length < cap) {
            const makeBlock = stars >= 3 && units.length % 3 === 2;
            units.push(spawnUnitNear(px, pz, makeBlock));
        }
        while (units.length > cap) units.pop();

        let nearestDist = Infinity;
        for (let i = 0; i < units.length; i += 1) {
            const u = units[i];
            const dx = px - u.pos.x;
            const dz = pz - u.pos.z;
            const dist = Math.hypot(dx, dz);
            if (dist < nearestDist) nearestDist = dist;

            if (dist > 220) {
                const resp = spawnUnitNear(px, pz, u.roadblock);
                u.pos.x = resp.pos.x;
                u.pos.y = resp.pos.y;
                u.pos.z = resp.pos.z;
                u.yaw = resp.yaw;
                u.speed = resp.speed;
                continue;
            }

            if (u.knockTimer > 0) {
                u.knockTimer -= stepDt;
                u.pos.x += u.knockVx * stepDt;
                u.pos.z += u.knockVz * stepDt;
                u.pos.y = heightAt(u.pos.x, u.pos.z);
                u.knockVx *= Math.exp(-3.2 * stepDt);
                u.knockVz *= Math.exp(-3.2 * stepDt);
                u.yaw += stepDt * 1.8;
                continue;
            }

            if (u.roadblock && dist < 34) {
                u.roadblock = false;
            }

            if (!u.roadblock) {
                const lead = Math.min(18, dist * 0.35);
                const tx = px + Math.sin(playerState.yaw || 0) * lead;
                const tz = pz + Math.cos(playerState.yaw || 0) * lead;
                const desiredYaw = Math.atan2(tx - u.pos.x, tz - u.pos.z);
                let diff = ((desiredYaw - u.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
                u.yaw += Math.max(-2.6 * stepDt, Math.min(2.6 * stepDt, diff));

                const topSpd = 21 + stars * 3.2;
                const targetSpd = dist < 10 ? topSpd * 0.65 : topSpd;
                u.speed += (targetSpd - u.speed) * Math.min(1, stepDt * 2.8);
                u.pos.x = Math.max(-WORLD_HALF + 20, Math.min(WORLD_HALF - 20, u.pos.x + Math.sin(u.yaw) * u.speed * stepDt));
                u.pos.z = Math.max(-WORLD_HALF + 20, Math.min(WORLD_HALF - 20, u.pos.z + Math.cos(u.yaw) * u.speed * stepDt));
                u.pos.y = heightAt(u.pos.x, u.pos.z);
            }

            for (let j = i + 1; j < units.length; j += 1) {
                const o = units[j];
                const sx = o.pos.x - u.pos.x;
                const sz = o.pos.z - u.pos.z;
                const sd = Math.hypot(sx, sz);
                if (sd > 0.01 && sd < 4.8) {
                    const push = (4.8 - sd) * 0.4;
                    u.pos.x -= (sx / sd) * push;
                    u.pos.z -= (sz / sd) * push;
                    o.pos.x += (sx / sd) * push;
                    o.pos.z += (sz / sd) * push;
                }
            }

            if (dist < 3.6) {
                const nx = dist > 0.01 ? -dx / dist : 1;
                const nz = dist > 0.01 ? -dz / dist : 0;
                u.knockVx = nx * 12;
                u.knockVz = nz * 12;
                u.knockTimer = 1.1;
                if (onRam) onRam(u, Math.max(u.speed, playerState.speed || 0));
            }
        }

        if (nearestDist > SPOTTED_RADIUS) {
            evading = true;
            evadingTimer += stepDt;
            if (evadingTimer >= ESCAPE_DURATION) {
                const clearedStars = stars;
                setWanted(0);
                if (onEscaped) onEscaped(clearedStars);
            }
        } else {
            evading = false;
            evadingTimer = 0;
        }

        return { stars, evading, nearestDist };
    };

    return {
        units,
        getStars: () => stars,
        isEvading: () => evading,
        setWanted,
        addHeat,
        update
    };
}
