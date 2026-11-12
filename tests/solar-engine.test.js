import { describe, it, expect } from "vitest";
import { SUN_DEF, PLANET_CATALOG, COMET_CATALOG } from "../src/lab/solar/solar-catalog.js";
import {
    wrapAngle,
    solveKeplerElliptic,
    solveKeplerHyperbolic,
    solveBarkerParabolic,
    getSemiMajorAxis,
    getBodyRenderRadius,
    propagateKeplerian,
    sampleOrbitRingPoints,
    toObserverCentered,
    computeBodyInfluenceWeight,
    createCameraState,
    projectPoint3D
} from "../src/lab/solar/kepler-solver.js";
import {
    createStarfield,
    createAsteroidBelt,
    computeAsteroidPosition,
    createMeteorStreaks,
    stepMeteorStreaks,
    createCometStates,
    stepCometStates
} from "../src/lab/solar/particles-sim.js";
import { generatePlanetTextureData, generateRingTextureData } from "../src/lab/solar/planet-textures.js";
import { buildViewProjFromBasis, buildBodyModelMatrix } from "../src/lab/solar/solar-shaders.js";

describe("Solar Catalog & Analytic Keplerian Propagation", () => {
    it("defines the Sun, 8 distinct planets, and 3 comets", () => {
        expect(SUN_DEF.id).toBe("sun");
        expect(PLANET_CATALOG.map((p) => p.id)).toEqual([
            "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune"
        ]);
        expect(COMET_CATALOG).toHaveLength(3);
        const saturn = PLANET_CATALOG.find((p) => p.id === "saturn");
        expect(saturn.hasRing).toBe(true);
    });

    it("solves elliptic Kepler equation M = E - e*sin(E) across eccentricities", () => {
        for (const e of [0, 0.0167, 0.2056, 0.72, 0.96]) {
            for (const M of [0.1, 1.4, -2.3, 4.9]) {
                const E = solveKeplerElliptic(M, e);
                const residual = Math.abs(wrapAngle(M) - wrapAngle(E - e * Math.sin(E)));
                expect(residual).toBeLessThan(1e-9);
            }
        }
    });

    it("solves hyperbolic and parabolic anomaly equations accurately", () => {
        for (const e of [1.15, 1.85, 3.2]) {
            for (const M of [-3.5, 0.75, 4.2]) {
                const H = solveKeplerHyperbolic(M, e);
                const residual = Math.abs(M - (e * Math.sinh(H) - H));
                expect(residual).toBeLessThan(1e-9);
            }
        }
        const M = 1.6;
        const B = solveBarkerParabolic(M);
        expect(Math.abs(B + (B * B * B) / 3 - M)).toBeLessThan(1e-9);
    });

    it("maintains zero cumulative orbital drift across 1000 infinity periods", () => {
        const earth = PLANET_CATALOG.find((p) => p.id === "earth");
        const p0 = propagateKeplerian(earth, 42, "visual");
        const pLater = propagateKeplerian(earth, 42 + 1000 * earth.periodDays, "visual");
        expect(Math.hypot(pLater.x - p0.x, pLater.y - p0.y, pLater.z - p0.z)).toBeLessThan(1e-7);

        const pReal = propagateKeplerian(earth, 42, "real");
        expect(getSemiMajorAxis(earth, "real")).toBeGreaterThan(getSemiMajorAxis(earth, "visual") * 0.4);
        expect(Math.hypot(pReal.x, pReal.y, pReal.z)).toBeGreaterThan(5);
        expect(getBodyRenderRadius(SUN_DEF, "visual")).toBeGreaterThan(getBodyRenderRadius(earth, "visual"));
    });

    it("samples closed 3D elliptical orbit rings", () => {
        const jupiter = PLANET_CATALOG.find((p) => p.id === "jupiter");
        const pts = sampleOrbitRingPoints(jupiter, "visual", 96);
        expect(pts).toHaveLength(97);
        const gap = Math.hypot(pts[0].x - pts[96].x, pts[0].y - pts[96].y, pts[0].z - pts[96].z);
        expect(gap).toBeLessThan(1e-9);
    });

    it("applies CosmoScout observer-centered transform, influence weight, and 3D projection", () => {
        const earthPos = { x: 14.5, y: 0.4, z: -6.2 };
        const centered = toObserverCentered(earthPos, earthPos);
        expect(centered).toEqual({ x: 0, y: 0, z: 0 });
        expect(computeBodyInfluenceWeight(2, 0)).toBeCloseTo(1, 5);
        expect(computeBodyInfluenceWeight(2, 2)).toBeCloseTo(0.5, 5);

        const basis = createCameraState({ azimuth: -0.34, elevation: 0.44, distance: 76, fovRad: 0.74, aspect: 1.6 });
        const sunScreen = projectPoint3D({ x: 0, y: 0, z: 0 }, basis, 1280, 800);
        expect(sunScreen).not.toBeNull();
        expect(sunScreen.x).toBeCloseTo(640, 2);
        expect(sunScreen.y).toBeCloseTo(400, 2);
        expect(projectPoint3D({ x: basis.eye.x * 2, y: basis.eye.y * 2, z: basis.eye.z * 2 }, basis, 1280, 800)).toBeNull();

        const viewProj = buildViewProjFromBasis(basis, 0.25, 4500);
        const model = buildBodyModelMatrix({ x: 0, y: 0, z: 0 }, 1.5, 23.4, 0.8);
        expect(viewProj).toHaveLength(16);
        expect(model).toHaveLength(16);
    });
});

describe("Astrophysical Particles & Procedural Planet Textures", () => {
    it("generates Main Asteroid Belt within Mars-Jupiter radial annulus", () => {
        const mars = PLANET_CATALOG.find((p) => p.id === "mars");
        const jupiter = PLANET_CATALOG.find((p) => p.id === "jupiter");
        const belt = createAsteroidBelt(200, 9103);
        expect(belt).toHaveLength(200);
        const rMin = mars.visualA + 0.5;
        const rMax = jupiter.visualA - 0.5;
        for (const rock of belt) {
            const pos = computeAsteroidPosition(rock, 125, "visual");
            const r = Math.hypot(pos.x, pos.z);
            expect(r).toBeGreaterThan(rMin);
            expect(r).toBeLessThan(rMax);
        }
    });

    it("integrates comet Verlet dust tails in anti-sunward direction", () => {
        const comets = createCometStates("visual");
        expect(comets).toHaveLength(3);
        for (let step = 0; step < 12; step += 1) {
            stepCometStates(comets, step * 0.8, 0.8, "visual");
        }
        const active = comets.find((c) => c.particles.length > 0);
        expect(active).toBeDefined();
        const headR = Math.hypot(active.state.x, active.state.y, active.state.z);
        const avgTailR = active.particles.reduce((sum, p) => sum + Math.hypot(p.x, p.y, p.z), 0) / active.particles.length;
        expect(avgTailR).toBeGreaterThan(headR * 0.85);
    });

    it("steps background starfield and diagonal meteor streaks", () => {
        const stars = createStarfield(120, 4201);
        expect(stars).toHaveLength(120);
        const meteors = createMeteorStreaks(5, 7701);
        const life0 = meteors[0].life;
        stepMeteorStreaks(meteors, 0.2, 7701);
        expect(meteors[0].life).not.toBe(life0);
    });

    it("bakes equirectangular textures and Saturn Cassini ring opacity profile", () => {
        const earthTex = generatePlanetTextureData("earth", 64, 32);
        const sunTex = generatePlanetTextureData("sun", 64, 32);
        expect(earthTex.data.length).toBe(64 * 32 * 4);
        expect(sunTex.data[0]).toBeGreaterThan(200);

        const saturnRing = generateRingTextureData("saturn", 100);
        expect(saturnRing.data.length).toBe(100 * 4);
        const opaqueB = saturnRing.data[40 * 4 + 3];
        const cassiniGap = saturnRing.data[60 * 4 + 3];
        expect(opaqueB).toBeGreaterThan(cassiniGap * 2);
    });
});
