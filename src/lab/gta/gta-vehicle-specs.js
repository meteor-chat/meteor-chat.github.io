export const SURFACES = Object.freeze({
    asphalt: { long: 1.32, lat: 1.72, wet: 1.0 },
    wetAsphalt: { long: 1.02, lat: 1.34, wet: 0.0 },
    concrete: { long: 1.26, lat: 1.58, wet: 0.85 },
    sand: { long: 0.86, lat: 0.92, wet: 0.35 },
    grass: { long: 0.94, lat: 1.02, wet: 0.5 },
    water: { long: 0.55, lat: 0.55, wet: 0.0 }
});

export const VEHICLE_PRESETS = Object.freeze({
    elegy: {
        key: "elegy",
        name: "Elegy GT-R",
        paint: 0x161c26,
        secondary: 0x222b3a,
        mass: 1520,
        engineTorque: 1380,
        topSpeed: 52,
        halfExtents: [0.98, 0.5, 2.28],
        bodyLift: 0.16,
        comDrop: 0.44,
        wheelRadius: 0.36,
        wheelWidth: 0.28,
        halfTrack: 0.84,
        halfWheelbase: 1.33,
        mountY: 0.08,
        restHeight: 0.68,
        suspRest: 0.42,
        suspFrequency: 1.78,
        suspDamping: 0.84,
        antiRoll: 980,
        differentials: [[0, 1, 0.42], [2, 3, 0.58]],
        handbrakeLat: 0.26,
        spoiler: true,
        suv: false
    },
    gauntlet: {
        key: "gauntlet",
        name: "Gauntlet ZL1",
        paint: 0x18181e,
        secondary: 0x991b1b,
        mass: 1640,
        engineTorque: 1520,
        topSpeed: 54,
        halfExtents: [1.02, 0.52, 2.38],
        bodyLift: 0.16,
        comDrop: 0.44,
        wheelRadius: 0.36,
        wheelWidth: 0.28,
        halfTrack: 0.85,
        halfWheelbase: 1.34,
        mountY: 0.08,
        restHeight: 0.69,
        suspRest: 0.44,
        suspFrequency: 1.68,
        suspDamping: 0.82,
        antiRoll: 920,
        differentials: [[0, 1, 0.25], [2, 3, 0.75]],
        handbrakeLat: 0.24,
        spoiler: true,
        suv: false
    },
    cavalcade: {
        key: "cavalcade",
        name: "Cavalcade SUV",
        paint: 0x151920,
        secondary: 0x2a2f3a,
        mass: 2220,
        engineTorque: 1640,
        topSpeed: 44,
        halfExtents: [1.08, 0.72, 2.58],
        bodyLift: 0.22,
        comDrop: 0.54,
        wheelRadius: 0.44,
        wheelWidth: 0.3,
        halfTrack: 0.96,
        halfWheelbase: 1.56,
        mountY: 0.1,
        restHeight: 0.86,
        suspRest: 0.52,
        suspFrequency: 1.42,
        suspDamping: 0.88,
        antiRoll: 880,
        differentials: [[0, 1, 0.5], [2, 3, 0.5]],
        handbrakeLat: 0.3,
        spoiler: false,
        suv: true
    }
});

export function stepVehicleSteering(currentSteer, targetSteer, speedMps, topSpeed, dt, opts = {}) {
    const turnInRate = opts.turnInRate ?? 9.2;
    const returnRate = opts.returnRate ?? 14.5;
    const counterRate = opts.counterRate ?? 18.0;
    const highSpeedMin = opts.highSpeedSteer ?? 0.46;

    const reversingDir = targetSteer !== 0 && currentSteer !== 0 && Math.sign(targetSteer) !== Math.sign(currentSteer);
    const rate = targetSteer === 0 ? returnRate : reversingDir ? counterRate : turnInRate;
    const alpha = 1 - Math.exp(-rate * Math.max(0.001, dt));
    let nextSteer = currentSteer + (targetSteer - currentSteer) * alpha;
    if (targetSteer === 0 && Math.abs(nextSteer) < 0.01) nextSteer = 0;

    const normSpeed = Math.max(0, Math.min(1, (speedMps - 8) / Math.max(12, topSpeed * 0.82 - 8)));
    const smooth = normSpeed * normSpeed * (3 - 2 * normSpeed);
    const speedFactor = 1 - (1 - highSpeedMin) * smooth;
    return {
        rawSteer: nextSteer,
        effectiveSteer: nextSteer * speedFactor,
        speedFactor
    };
}

const GEAR_SPEEDS = [0, 10, 19, 28, 37, 45, 58];

export function computeGearAndRpm(speedMps, throttle = 0, reversing = false) {
    const absSpeed = Math.abs(speedMps);
    if (reversing && absSpeed > 0.35) {
        const rpm = Math.min(6200, 1100 + absSpeed * 210);
        return { gear: "R", gearNum: -1, rpm, mph: Math.round(absSpeed * 2.23694) };
    }
    if (absSpeed < 0.35 && throttle < 0.05) {
        return { gear: "D1", gearNum: 1, rpm: 860, mph: 0 };
    }
    let gearNum = 1;
    for (let g = 1; g < GEAR_SPEEDS.length - 1; g += 1) {
        if (absSpeed >= GEAR_SPEEDS[g]) gearNum = g + 1;
    }
    const low = GEAR_SPEEDS[gearNum - 1];
    const high = GEAR_SPEEDS[gearNum];
    const ratio = Math.max(0, Math.min(1, (absSpeed - low) / Math.max(1, high - low)));
    const rpm = Math.round(1400 + ratio * 5200 + throttle * 550);
    return {
        gear: `D${gearNum}`,
        gearNum,
        rpm: Math.min(7400, rpm),
        mph: Math.round(absSpeed * 2.23694)
    };
}

export function computeTireGrip(surfaceKey, wetness = 0, handbrakeSlide = false, wetLong = 0.28, wetLat = 0.34, handbrakeLat = 0.28) {
    const surf = SURFACES[surfaceKey] || SURFACES.asphalt;
    const wetShare = Math.round(Math.max(0, Math.min(1, wetness)) * surf.wet * 4) / 4;
    const longGrip = surf.long * (1 - wetLong * wetShare);
    const baseLat = surf.lat * (1 - wetLat * wetShare);
    const latGrip = handbrakeSlide ? baseLat * handbrakeLat : baseLat;
    return { longGrip, latGrip, wetShare };
}

export function findNearestEnterableVehicle(px, pz, vehicles, maxDist = 5.2) {
    let best = null;
    let bestD = maxDist;
    for (let i = 0; i < vehicles.length; i += 1) {
        const v = vehicles[i];
        if (!v || !v.pos) continue;
        const d = Math.hypot(v.pos.x - px, v.pos.z - pz);
        if (d < bestD) {
            bestD = d;
            best = v;
        }
    }
    return best;
}
