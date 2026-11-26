import { VILLAGER_HALF_WIDTH, VILLAGER_HEIGHT, stepMobPhysics } from "./voxel-mob-physics.js";

export const VILLAGER_STATE = Object.freeze({
    IDLE: "idle",
    STROLL: "stroll",
    GREET: "greet",
    CHAT: "chat"
});

export const VILLAGER_PROFESSIONS = Object.freeze(["plains", "farmer", "blacksmith", "cleric"]);

const STROLL_SPEED = 1.48;
const TURN_RATE = 5.5;
const STRIDE = 2.6;
const HOME_RADIUS = 56;
const DEFLECT_COOLDOWN = 0.45;
const TAU = Math.PI * 2;

const PROFESSION_POIS = {
    farmer: ["farm", "market", "plaza"],
    blacksmith: ["forge", "plaza", "market"],
    cleric: ["church", "plaza", "inn"],
    plains: ["plaza", "market", "dock", "inn", "home"]
};

const between = (rng, min, max) => min + rng() * (max - min);

function wrapAngle(a) {
    let v = a % TAU;
    if (v > Math.PI) v -= TAU;
    if (v < -Math.PI) v += TAU;
    return v;
}

export function createVillager(x, y, z, homeX, homeZ, rng = Math.random, opts = {}) {
    const yaw = rng() * TAU;
    const variant =
        opts.variant || VILLAGER_PROFESSIONS[Math.floor(rng() * VILLAGER_PROFESSIONS.length)];
    return {
        kind: "villager",
        variant,
        pos: [x, y, z],
        vel: [0, 0, 0],
        homeX: homeX ?? x,
        homeZ: homeZ ?? z,
        homeDoor: opts.homeDoor || null,
        pois: Array.isArray(opts.pois) ? opts.pois : null,
        hw: VILLAGER_HALF_WIDTH,
        h: VILLAGER_HEIGHT,
        yaw,
        targetYaw: yaw,
        phaseSeed: rng() * 100,
        deflectCooldown: 0,
        voiceCooldown: between(rng, 4, 11),
        chatCooldown: between(rng, 4, 9),
        onGround: false,
        inWater: false,
        blocked: false,
        state: VILLAGER_STATE.IDLE,
        timer: between(rng, 1.5, 4),
        speed: 0,
        anim: { phase: 0, moving: 0, headYaw: 0, nod: 0 }
    };
}

function enter(v, state, timer, speed) {
    v.state = state;
    v.timer = timer;
    v.speed = speed;
}

function pickPoiTarget(v, rng, isNight) {
    if (isNight && v.homeDoor) {
        return v.homeDoor;
    }
    if (!v.pois || v.pois.length === 0) return null;
    if (isNight) {
        const nightSpots = v.pois.filter((p) => p.type === "plaza" || p.type === "inn" || p.type === "home");
        if (nightSpots.length > 0) return nightSpots[Math.floor(rng() * nightSpots.length)];
    }
    const preferred = PROFESSION_POIS[v.variant] || PROFESSION_POIS.plains;
    const matched = v.pois.filter((p) => preferred.includes(p.type));
    const pool = matched.length > 0 && rng() < 0.78 ? matched : v.pois;
    return pool[Math.floor(rng() * pool.length)];
}

function findChatPartner(v, villagers) {
    if (!villagers || villagers.length < 2) return null;
    for (const other of villagers) {
        if (other === v) continue;
        if (Math.abs(other.pos[1] - v.pos[1]) > 1.8) continue;
        const d = Math.hypot(other.pos[0] - v.pos[0], other.pos[2] - v.pos[2]);
        if (d > 0.7 && d < 3.4) return other;
    }
    return null;
}

function chooseNext(v, rng, ctx) {
    const playerPos = ctx.playerPos;
    if (playerPos) {
        const dx = playerPos[0] - v.pos[0];
        const dz = playerPos[2] - v.pos[2];
        if (Math.hypot(dx, dz) < 5.5 && rng() < 0.42) {
            v.targetYaw = Math.atan2(dx, -dz);
            enter(v, VILLAGER_STATE.GREET, between(rng, 2.2, 4.2), 0);
            return;
        }
    }

    if ((v.chatCooldown || 0) <= 0 && rng() < 0.45) {
        const partner = findChatPartner(v, ctx.villagers);
        if (partner) {
            const dx = partner.pos[0] - v.pos[0];
            const dz = partner.pos[2] - v.pos[2];
            v.targetYaw = Math.atan2(dx, -dz);
            v.chatCooldown = between(rng, 10, 18);
            v.anim.nod = 1;
            enter(v, VILLAGER_STATE.CHAT, between(rng, 2.5, 4.5), 0);
            if (partner.state !== VILLAGER_STATE.CHAT) {
                partner.targetYaw = Math.atan2(-dx, dz);
                partner.chatCooldown = between(rng, 10, 18);
                partner.anim.nod = 1;
                enter(partner, VILLAGER_STATE.CHAT, between(rng, 2.5, 4.5), 0);
            }
            if (v.voiceCooldown <= 0 && ctx.onVillagerHum && playerPos) {
                const pd = Math.hypot(playerPos[0] - v.pos[0], playerPos[2] - v.pos[2]);
                if (pd < 14) {
                    v.voiceCooldown = between(rng, 10, 18);
                    ctx.onVillagerHum(v);
                }
            }
            return;
        }
    }

    const homeDx = v.homeX - v.pos[0];
    const homeDz = v.homeZ - v.pos[2];
    const homeDist = Math.hypot(homeDx, homeDz);
    if (homeDist > HOME_RADIUS) {
        v.targetYaw = Math.atan2(homeDx, -homeDz) + (rng() - 0.5) * 0.5;
        enter(v, VILLAGER_STATE.STROLL, between(rng, 3.5, 6), STROLL_SPEED);
        return;
    }

    const poi = pickPoiTarget(v, rng, Boolean(ctx.isNight));
    if (poi && rng() < (ctx.isNight ? 0.8 : 0.72)) {
        const dx = poi.x - v.pos[0];
        const dz = poi.z - v.pos[2];
        const dist = Math.hypot(dx, dz);
        if (dist > 2.2) {
            v.targetYaw = Math.atan2(dx, -dz) + (rng() - 0.5) * 0.45;
            enter(v, VILLAGER_STATE.STROLL, between(rng, 3, 6.2), STROLL_SPEED);
            return;
        }
        enter(v, VILLAGER_STATE.IDLE, between(rng, 2.5, 5.2), 0);
        return;
    }

    if (rng() < 0.62) {
        v.targetYaw = rng() * TAU;
        enter(v, VILLAGER_STATE.STROLL, between(rng, 2.5, 5.5), STROLL_SPEED);
    } else {
        enter(v, VILLAGER_STATE.IDLE, between(rng, 2, 4.5), 0);
    }
}

export function stepVillager(v, dt, ctx) {
    if (ctx.frozen) return;
    const stepDt = Math.min(0.05, Math.max(0.001, dt));
    v.timer -= stepDt;
    v.deflectCooldown = Math.max(0, (v.deflectCooldown || 0) - stepDt);
    v.voiceCooldown = Math.max(0, (v.voiceCooldown || 0) - stepDt);
    v.chatCooldown = Math.max(0, (v.chatCooldown || 0) - stepDt);

    if (v.blocked && v.state === VILLAGER_STATE.STROLL && v.deflectCooldown <= 0) {
        const side = ctx.rng() < 0.5 ? -1 : 1;
        v.targetYaw = wrapAngle(v.yaw + side * (Math.PI * 0.55 + ctx.rng() * 0.8));
        v.deflectCooldown = DEFLECT_COOLDOWN;
    }
    if (v.timer <= 0) chooseNext(v, ctx.rng, ctx);

    const diff = wrapAngle(v.targetYaw - v.yaw);
    const turn = Math.max(-TURN_RATE * stepDt, Math.min(TURN_RATE * stepDt, diff));
    v.yaw = wrapAngle(v.yaw + turn);

    const aligned = Math.max(0, Math.cos(wrapAngle(v.targetYaw - v.yaw)));
    const speed = v.speed * aligned;
    const sx = v.pos[0];
    const sz = v.pos[2];
    const res = stepMobPhysics(v, stepDt, Math.sin(v.yaw) * speed, -Math.cos(v.yaw) * speed, ctx.getBlock);
    const actualSpeed = Math.hypot(v.pos[0] - sx, v.pos[2] - sz) / stepDt;
    v.blocked = res.blocked && speed > 0;

    const anim = v.anim;
    const moveTarget = actualSpeed > 0.08 ? 1 : 0;
    anim.moving += (moveTarget - anim.moving) * Math.min(1, 9 * stepDt);
    anim.phase = (anim.phase + actualSpeed * STRIDE * stepDt) % (TAU * 100);

    let lookTarget = 0;
    if (ctx.playerPos && v.state !== VILLAGER_STATE.CHAT) {
        const dx = ctx.playerPos[0] - v.pos[0];
        const dz = ctx.playerPos[2] - v.pos[2];
        const dist = Math.hypot(dx, dz);
        if (dist < 6.5 && dist > 0.4) {
            const rel = wrapAngle(Math.atan2(dx, -dz) - v.yaw);
            if (Math.abs(rel) < 1.25) lookTarget = rel;
            if (dist < 4.5 && v.voiceCooldown <= 0 && ctx.onVillagerHum) {
                v.voiceCooldown = between(ctx.rng, 9, 18);
                anim.nod = 1;
                ctx.onVillagerHum(v);
            }
        }
    }
    anim.headYaw = (anim.headYaw || 0) + (lookTarget - (anim.headYaw || 0)) * Math.min(1, 6 * stepDt);
    anim.nod = Math.max(0, (anim.nod || 0) - stepDt * 3);
}
