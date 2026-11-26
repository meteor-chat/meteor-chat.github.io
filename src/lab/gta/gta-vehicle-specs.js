export const SURFACES = Object.freeze({
    asphalt: { long: 1.08, lat: 1.22, wet: 1.0 },
    wetAsphalt: { long: 0.78, lat: 0.76, wet: 0.0 },
    concrete: { long: 1.04, lat: 1.15, wet: 0.85 },
    sand: { long: 0.78, lat: 0.74, wet: 0.35 },
    grass: { long: 0.84, lat: 0.82, wet: 0.5 },
    water: { long: 0.55, lat: 0.55, wet: 0.0 }
});

export const VEHICLE_PRESETS = Object.freeze({
    elegy: {
        key: "elegy",
        name: "Elegy GT-R",
        paint: 0x11161f,
        secondary: 0x1e2634,
        mass: 1620,
        engineTorque: 1080,
        topSpeed: 50,
        halfExtents: [0.98, 0.5, 2.28],
        bodyLift: 0.16,
        comDrop: 0.36,
        wheelRadius: 0.36,
        wheelWidth: 0.28,
        halfTrack: 0.88,
        halfWheelbase: 1.42,
        mountY: 0.08,
        restHeight: 0.68,
        suspRest: 0.42,
        suspFrequency: 1.45,
        suspDamping: 0.92,
        antiRoll: 720,
        differentials: [[0, 1, 0.4], [2, 3, 0.6]],
        handbrakeLat: 0.28,
        spoiler: true,
        suv: false,
        police: false
    },
    gauntlet: {
        key: "gauntlet",
        name: "Gauntlet ZL1",
        paint: 0x151519,
        secondary: 0x991b1b,
        mass: 1740,
        engineTorque: 1220,
        topSpeed: 52,
        halfExtents: [1.02, 0.52, 2.38],
        bodyLift: 0.16,
        comDrop: 0.36,
        wheelRadius: 0.38,
        wheelWidth: 0.3,
        halfTrack: 0.9,
        halfWheelbase: 1.46,
        mountY: 0.08,
        restHeight: 0.7,
        suspRest: 0.44,
        suspFrequency: 1.35,
        suspDamping: 0.9,
        antiRoll: 680,
        differentials: [[2, 3, 1.0]],
        handbrakeLat: 0.24,
        spoiler: true,
        suv: false,
        police: false
    },
    cavalcade: {
        key: "cavalcade",
        name: "Cavalcade SUV",
        paint: 0x121418,
        secondary: 0x2a2f3a,
        mass: 2450,
        engineTorque: 1320,
        topSpeed: 42,
        halfExtents: [1.08, 0.72, 2.58],
        bodyLift: 0.22,
        comDrop: 0.48,
        wheelRadius: 0.44,
        wheelWidth: 0.3,
        halfTrack: 0.96,
        halfWheelbase: 1.56,
        mountY: 0.1,
        restHeight: 0.86,
        suspRest: 0.52,
        suspFrequency: 1.15,
        suspDamping: 0.94,
        antiRoll: 640,
        differentials: [[0, 1, 0.5], [2, 3, 0.5]],
        handbrakeLat: 0.34,
        spoiler: false,
        suv: true,
        police: false
    },
    cruiser: {
        key: "cruiser",
        name: "LSPD Cruiser",
        paint: 0x11141a,
        secondary: 0xf1f5f9,
        mass: 1850,
        engineTorque: 1180,
        topSpeed: 49,
        halfExtents: [0.98, 0.56, 2.36],
        bodyLift: 0.18,
        comDrop: 0.38,
        wheelRadius: 0.37,
        wheelWidth: 0.27,
        halfTrack: 0.88,
        halfWheelbase: 1.44,
        mountY: 0.08,
        restHeight: 0.72,
        suspRest: 0.45,
        suspFrequency: 1.35,
        suspDamping: 0.92,
        antiRoll: 700,
        differentials: [[0, 1, 0.45], [2, 3, 0.55]],
        handbrakeLat: 0.3,
        spoiler: false,
        suv: false,
        police: true
    }
});

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
