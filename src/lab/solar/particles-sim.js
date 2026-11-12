import { COMET_CATALOG } from "./solar-catalog.js";
import { propagateKeplerian } from "./kepler-solver.js";

function mulberry32(seed) {
    let a = seed >>> 0;
    return function next() {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function createStarfield(count = 720, seed = 4201) {
    const rand = mulberry32(seed);
    const stars = [];
    const palette = [
        [226, 232, 240],
        [148, 226, 255],
        [94, 234, 212],
        [254, 240, 138],
        [186, 230, 253]
    ];
    for (let i = 0; i < count; i += 1) {
        const u = rand() * 2 - 1;
        const theta = rand() * Math.PI * 2;
        const r = 190 + rand() * 240;
        const sinPhi = Math.sqrt(Math.max(0, 1 - u * u));
        const c = palette[Math.floor(rand() * palette.length)];
        stars.push({
            x: r * sinPhi * Math.cos(theta),
            y: r * u,
            z: r * sinPhi * Math.sin(theta),
            size: 2.8 + Math.pow(rand(), 1.9) * 5.2,
            alpha: 0.45 + rand() * 0.52,
            phase: rand() * Math.PI * 2,
            r: c[0],
            g: c[1],
            b: c[2]
        });
    }
    return stars;
}

export function createAsteroidBelt(count = 900, seed = 9103) {
    const rand = mulberry32(seed);
    const rocks = [];
    for (let i = 0; i < count; i += 1) {
        const t = rand();
        const visualRadius = 12.9 + (t + (rand() - 0.5) * 0.18) * 3.4;
        const realRadiusAU = 2.15 + t * 1.15;
        const angle0 = rand() * Math.PI * 2;
        const incl = (rand() - 0.5) * 0.09;
        const ecc = rand() * 0.08;
        const angularSpeedVisual = (Math.PI * 2) / (1100 + Math.pow(visualRadius / 13.0, 1.5) * 750);
        const angularSpeedReal = (Math.PI * 2) / (365.25 * Math.pow(realRadiusAU, 1.5));
        const bright = rand();
        const isCyan = bright > 0.35;
        rocks.push({
            visualRadius,
            realRadiusAU,
            angle0,
            incl,
            ecc,
            angularSpeedVisual,
            angularSpeedReal,
            size: 0.75 + Math.pow(rand(), 1.8) * 1.9,
            r: isCyan ? 56 + Math.floor(rand() * 48) : 110 + Math.floor(rand() * 48),
            g: isCyan ? 172 + Math.floor(rand() * 58) : 168 + Math.floor(rand() * 48),
            b: isCyan ? 188 + Math.floor(rand() * 52) : 182 + Math.floor(rand() * 48),
            alpha: 0.34 + rand() * 0.46
        });
    }
    return rocks;
}

export function computeAsteroidPosition(rock, timeDays, scaleMode = "visual") {
    const radius = scaleMode === "real" ? rock.realRadiusAU * 11.5 : rock.visualRadius;
    const omega = scaleMode === "real" ? rock.angularSpeedReal : rock.angularSpeedVisual;
    const theta = rock.angle0 + omega * timeDays;
    const r = radius * (1 - rock.ecc * Math.cos(theta * 2));
    return {
        x: r * Math.cos(theta),
        y: r * Math.sin(theta) * Math.sin(rock.incl),
        z: -r * Math.sin(theta)
    };
}

export function createMeteorStreaks(count = 6, seed = 7701) {
    const rand = mulberry32(seed);
    const streaks = [];
    for (let i = 0; i < count; i += 1) {
        streaks.push({
            x: (rand() - 0.5) * 140,
            y: (rand() - 0.5) * 60,
            z: (rand() - 0.5) * 140,
            dx: -1.6 - rand() * 1.6,
            dy: -0.9 - rand() * 0.8,
            dz: (rand() - 0.5) * 1.2,
            life: rand(),
            speed: 0.32 + rand() * 0.38,
            length: 5.5 + rand() * 5.0
        });
    }
    return streaks;
}

export function stepMeteorStreaks(streaks, dtSec, seed = 7701) {
    const rand = mulberry32(seed + Math.floor(dtSec * 10000));
    for (let i = 0; i < streaks.length; i += 1) {
        const s = streaks[i];
        s.life += s.speed * dtSec;
        if (s.life >= 1) {
            s.life = 0;
            s.x = (rand() - 0.3) * 110;
            s.y = 12 + (rand() - 0.5) * 44;
            s.z = (rand() - 0.5) * 110;
        }
    }
}

function advanceParticleVerlet(p, muEffective, dtDays) {
    const r2 = p.x * p.x + p.y * p.y + p.z * p.z;
    const r = Math.max(0.6, Math.sqrt(r2));
    const nSteps = Math.min(8, Math.max(1, Math.ceil(Math.abs(dtDays) / 4)));
    const h = dtDays / nSteps;
    for (let step = 0; step < nSteps; step += 1) {
        const rNow = Math.max(0.6, Math.hypot(p.x, p.y, p.z));
        const f0 = -muEffective / (rNow * rNow * rNow);
        const ax0 = f0 * p.x;
        const ay0 = f0 * p.y;
        const az0 = f0 * p.z;
        p.vx += 0.5 * ax0 * h;
        p.vy += 0.5 * ay0 * h;
        p.vz += 0.5 * az0 * h;
        p.x += p.vx * h;
        p.y += p.vy * h;
        p.z += p.vz * h;
        const rNext = Math.max(0.6, Math.hypot(p.x, p.y, p.z));
        const f1 = -muEffective / (rNext * rNext * rNext);
        p.vx += 0.5 * f1 * p.x * h;
        p.vy += 0.5 * f1 * p.y * h;
        p.vz += 0.5 * f1 * p.z * h;
    }
    return r;
}

export function createCometStates(scaleMode = "visual") {
    const rand = mulberry32(5512);
    return COMET_CATALOG.map((def) => {
        const state0 = propagateKeplerian(def, 0, scaleMode);
        const particles = [];
        const tailCount = 72;
        const distSun = Math.max(2, Math.hypot(state0.x, state0.y, state0.z));
        const antiSun = { x: state0.x / distSun, y: state0.y / distSun, z: state0.z / distSun };
        for (let i = 0; i < tailCount; i += 1) {
            const frac = i / tailCount;
            const beta = def.betaRange[0] + frac * (def.betaRange[1] - def.betaRange[0]);
            const spread = 0.24 + frac * 1.1;
            const tailDist = frac * 15.5;
            particles.push({
                x: state0.x + antiSun.x * tailDist + (rand() - 0.5) * spread,
                y: state0.y + antiSun.y * tailDist + (rand() - 0.5) * spread * 0.5,
                z: state0.z + antiSun.z * tailDist + (rand() - 0.5) * spread,
                vx: state0.vx + antiSun.x * 0.015,
                vy: state0.vy + antiSun.y * 0.015,
                vz: state0.vz + antiSun.z * 0.015,
                beta,
                age: frac,
                maxAge: 1.0,
                seedOffset: (rand() - 0.5) * 0.45
            });
        }
        return { def, state: state0, particles, rand };
    });
}

export function stepCometStates(comets, timeDays, dtDays, scaleMode = "visual") {
    const clampedDt = Math.max(-18, Math.min(18, dtDays));
    for (let i = 0; i < comets.length; i += 1) {
        const comet = comets[i];
        const st = propagateKeplerian(comet.def, timeDays, scaleMode);
        comet.state = st;
        const aRef = scaleMode === "real" ? comet.def.aAU * 11.5 : comet.def.visualA;
        const n = (Math.PI * 2) / Math.max(10, comet.def.periodDays);
        const muSolar = n * n * aRef * aRef * aRef;
        const rNuc = Math.max(1.5, Math.hypot(st.x, st.y, st.z));
        const activity = Math.min(1.8, Math.pow(aRef / rNuc, comet.def.activityExp * 0.5));
        const antiX = st.x / rNuc;
        const antiY = st.y / rNuc;
        const antiZ = st.z / rNuc;

        for (let pIdx = 0; pIdx < comet.particles.length; pIdx += 1) {
            const p = comet.particles[pIdx];
            p.age += Math.abs(clampedDt) / 85;
            if (p.age >= p.maxAge || Math.hypot(p.x - st.x, p.y - st.y, p.z - st.z) > 22) {
                p.age = p.age % 0.15;
                const spread = 0.25 * activity;
                p.x = st.x + (comet.rand() - 0.5) * spread;
                p.y = st.y + (comet.rand() - 0.5) * spread * 0.6;
                p.z = st.z + (comet.rand() - 0.5) * spread;
                const eject = (0.014 + 0.025 * p.beta) * activity;
                p.vx = st.vx + antiX * eject + (comet.rand() - 0.5) * 0.005;
                p.vy = st.vy + antiY * eject + (comet.rand() - 0.5) * 0.003;
                p.vz = st.vz + antiZ * eject + (comet.rand() - 0.5) * 0.005;
            } else if (Math.abs(clampedDt) > 1e-4) {
                const muEff = (1 - p.beta) * muSolar;
                advanceParticleVerlet(p, muEff, clampedDt);
            }
        }
    }
}
