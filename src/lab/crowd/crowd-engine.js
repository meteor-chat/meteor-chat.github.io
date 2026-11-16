export const DEFAULT_CONFIG = Object.freeze({
    roomWidth: 8.0,
    roomLength: 12.0,
    doorWidth: 1.8,
    doorDepth: 2.0,
    agentRadius: 0.25,
    agentMass: 75,
    desiredSpeed: 3.8,
    relaxationTime: 0.5,
    socialA: 2000,
    socialB: 0.08,
    bodyK: 120000,
    frictionKappa: 240000,
    columnRadius: 0.36,
    columnOffsetX: 0.28,
    columnOffsetY: 1.75
});

function createRng(seed = 42) {
    let s = seed >>> 0;
    return () => {
        s = (Math.imul(1664525, s) + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

export function createSimulation(options = {}) {
    const config = { ...DEFAULT_CONFIG, ...options };
    const rng = createRng(options.seed ?? 101);
    const agentCount = options.agentCount ?? 110;
    const hasColumn = options.hasColumn ?? false;
    const agents = [];

    const startY = 3.5;
    const spanY = config.roomLength - startY - 0.8;
    const halfW = config.roomWidth * 0.5 - config.agentRadius - 0.2;

    for (let i = 0; i < agentCount; i += 1) {
        const x = -halfW + rng() * halfW * 2;
        const y = startY + rng() * spanY;
        const r = config.agentRadius * (0.92 + rng() * 0.16);
        agents.push({
            id: i,
            x,
            y,
            vx: 0,
            vy: 0,
            r,
            mass: config.agentMass,
            color: i % 2 === 0 ? "cyan" : "magenta",
            pressure: 0,
            evacuated: false,
            exitTime: null
        });
    }

    const column = {
        enabled: hasColumn,
        x: config.columnOffsetX,
        y: config.columnOffsetY,
        r: config.columnRadius
    };

    return {
        config,
        agents,
        column,
        time: 0,
        evacuatedCount: 0,
        jammed: false,
        jamTime: 0,
        peakPressure: 0,
        recentExits: []
    };
}

function resolveWallForce(ax, ay, ar, wx1, wy1, wx2, wy2, cfg) {
    const dx = wx2 - wx1;
    const dy = wy2 - wy1;
    const lenSq = dx * dx + dy * dy;
    let t = lenSq > 0 ? ((ax - wx1) * dx + (ay - wy1) * dy) / lenSq : 0;
    t = Math.max(0, Math.min(1, t));
    const cx = wx1 + t * dx;
    const cy = wy1 + t * dy;
    const rx = ax - cx;
    const ry = ay - cy;
    const dist = Math.hypot(rx, ry);
    if (dist < 1e-4) return { fx: 0, fy: 0, overlap: 0 };
    const nx = rx / dist;
    const ny = ry / dist;
    let fx = cfg.socialA * Math.exp((ar - dist) / cfg.socialB) * nx;
    let fy = cfg.socialA * Math.exp((ar - dist) / cfg.socialB) * ny;
    const overlap = ar - dist;
    if (overlap > 0) {
        fx += cfg.bodyK * overlap * nx;
        fy += cfg.bodyK * overlap * ny;
    }
    return { fx, fy, overlap: Math.max(0, overlap) };
}

function computeAgentForce(a, sim) {
    const { config, column } = sim;
    if (a.evacuated) return { fx: 0, fy: 0, pressure: 0 };

    let targetX = 0;
    let targetY = -0.5;
    if (a.y < 0) {
        targetX = 0;
        targetY = -config.doorDepth - 1.0;
    }

    const tdx = targetX - a.x;
    const tdy = targetY - a.y;
    const tdist = Math.hypot(tdx, tdy);
    const ex = tdist > 1e-4 ? tdx / tdist : 0;
    const ey = tdist > 1e-4 ? tdy / tdist : -1;

    let fx = a.mass * (config.desiredSpeed * ex - a.vx) / config.relaxationTime;
    let fy = a.mass * (config.desiredSpeed * ey - a.vy) / config.relaxationTime;
    let totalOverlap = 0;

    for (const b of sim.agents) {
        if (b.id === a.id || b.evacuated) continue;
        const rx = a.x - b.x;
        const ry = a.y - b.y;
        const dist = Math.hypot(rx, ry);
        const rSum = a.r + b.r;
        if (dist > rSum + 0.5 || dist < 1e-5) continue;

        const nx = rx / dist;
        const ny = ry / dist;
        const soc = config.socialA * Math.exp((rSum - dist) / config.socialB);
        fx += soc * nx;
        fy += soc * ny;

        const overlap = rSum - dist;
        if (overlap > 0) {
            totalOverlap += overlap;
            fx += config.bodyK * overlap * nx;
            fy += config.bodyK * overlap * ny;
            const tx = -ny;
            const ty = nx;
            const dvt = (b.vx - a.vx) * tx + (b.vy - a.vy) * ty;
            fx += config.frictionKappa * overlap * dvt * tx;
            fy += config.frictionKappa * overlap * dvt * ty;
        }
    }

    const halfW = config.roomWidth * 0.5;
    const doorHalf = config.doorWidth * 0.5;
    const walls = [
        [-halfW, 0, -doorHalf, 0],
        [doorHalf, 0, halfW, 0],
        [-halfW, 0, -halfW, config.roomLength],
        [halfW, 0, halfW, config.roomLength],
        [-halfW, config.roomLength, halfW, config.roomLength],
        [-doorHalf, 0, -doorHalf, -config.doorDepth],
        [doorHalf, 0, doorHalf, -config.doorDepth]
    ];

    for (const w of walls) {
        const wf = resolveWallForce(a.x, a.y, a.r, w[0], w[1], w[2], w[3], config);
        fx += wf.fx;
        fy += wf.fy;
        totalOverlap += wf.overlap;
    }

    if (column.enabled) {
        const cx = a.x - column.x;
        const cy = a.y - column.y;
        const cdist = Math.hypot(cx, cy);
        const crSum = a.r + column.r;
        if (cdist < crSum + 0.5 && cdist > 1e-5) {
            const nx = cx / cdist;
            const ny = cy / cdist;
            fx += config.socialA * Math.exp((crSum - cdist) / config.socialB) * nx;
            fy += config.socialA * Math.exp((crSum - cdist) / config.socialB) * ny;
            const cOver = crSum - cdist;
            if (cOver > 0) {
                totalOverlap += cOver;
                fx += config.bodyK * cOver * nx;
                fy += config.bodyK * cOver * ny;
                const tx = -ny;
                const ty = nx;
                const dvt = -a.vx * tx - a.vy * ty;
                fx += config.frictionKappa * cOver * dvt * tx;
                fy += config.frictionKappa * cOver * dvt * ty;
            }
        }
    }

    return { fx, fy, pressure: totalOverlap * config.bodyK };
}

export function stepSimulation(sim, dt) {
    const substeps = 4;
    const sdt = dt / substeps;
    let maxPressure = 0;

    for (let step = 0; step < substeps; step += 1) {
        for (const a of sim.agents) {
            if (a.evacuated) continue;
            const res = computeAgentForce(a, sim);
            const ax = res.fx / a.mass;
            const ay = res.fy / a.mass;
            a.vx += ax * sdt;
            a.vy += ay * sdt;
            const speed = Math.hypot(a.vx, a.vy);
            const maxSpd = sim.config.desiredSpeed * 1.5;
            if (speed > maxSpd) {
                a.vx = (a.vx / speed) * maxSpd;
                a.vy = (a.vy / speed) * maxSpd;
            }
            a.x += a.vx * sdt;
            a.y += a.vy * sdt;
            a.pressure = a.pressure * 0.85 + res.pressure * 0.15;
            if (a.pressure > maxPressure) maxPressure = a.pressure;

            if (!a.evacuated && a.y < -sim.config.doorDepth) {
                a.evacuated = true;
                a.exitTime = sim.time;
                sim.evacuatedCount += 1;
                sim.recentExits.push(sim.time);
            }
        }
        sim.time += sdt;
    }

    sim.peakPressure = Math.max(sim.peakPressure, maxPressure);
    const windowSec = 2.0;
    sim.recentExits = sim.recentExits.filter((t) => sim.time - t <= windowSec);
    const rate = sim.recentExits.length / windowSec;

    let unevac = 0;
    let nearDoorStuck = 0;
    for (const a of sim.agents) {
        if (!a.evacuated) {
            unevac += 1;
            if (a.y > 0 && a.y < 2.5 && Math.abs(a.x) < 2.0) {
                if (Math.hypot(a.vx, a.vy) < 0.25) nearDoorStuck += 1;
            }
        }
    }

    sim.jammed = unevac > 5 && nearDoorStuck >= 4 && rate < 0.6;
    if (sim.jammed) sim.jamTime += dt;
}
