import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { computeCameraRelativeMove, resolveCameraViewYaw } from "../src/lab/gta/gta-camera-math.js";
import { softClampRadianceValue } from "../src/lab/gta/gta-perf-governor.js";
import { buildRoadGraph } from "../src/lab/gta/gta-road-graph.js";
import { createTrafficSystem } from "../src/lab/gta/gta-traffic-ai.js";
import {
    VEHICLE_PRESETS,
    computeGearAndRpm,
    computeTireGrip,
    findNearestEnterableVehicle,
    stepVehicleSteering
} from "../src/lab/gta/gta-vehicle-specs.js";

describe("Los Santos Vehicle Specs & Traffic AI", () => {
    it("exposes 3 tuned hero vehicle presets with valid physics and wheel dimensions", () => {
        expect(Object.keys(VEHICLE_PRESETS)).toEqual(["elegy", "gauntlet", "cavalcade"]);
        for (const key of ["elegy", "gauntlet", "cavalcade"]) {
            const p = VEHICLE_PRESETS[key];
            expect(p).toBeDefined();
            expect(p.mass).toBeGreaterThan(1400);
            expect(p.engineTorque).toBeGreaterThan(900);
            expect(p.wheelRadius).toBeGreaterThan(0.3);
            expect(p.halfTrack).toBeGreaterThan(0.8);
            expect(p.halfWheelbase).toBeGreaterThan(1.3);
            expect(p.differentials.length).toBeGreaterThan(0);
        }
        expect(VEHICLE_PRESETS.cavalcade.suv).toBe(true);
    });

    it("computes realistic gears, RPM, wet tire grip reduction, and handbrake drift slip", () => {
        const idle = computeGearAndRpm(0, 0, false);
        expect(idle.gear).toBe("D1");
        expect(idle.rpm).toBe(860);
        expect(idle.mph).toBe(0);

        const fast = computeGearAndRpm(40, 1, false);
        expect(fast.gearNum).toBeGreaterThanOrEqual(4);
        expect(fast.rpm).toBeGreaterThan(2500);
        expect(fast.mph).toBeGreaterThan(80);

        const rev = computeGearAndRpm(-8, 0, true);
        expect(rev.gear).toBe("R");
        expect(rev.gearNum).toBe(-1);

        const dry = computeTireGrip("asphalt", 0, false);
        const wet = computeTireGrip("asphalt", 1, false);
        const drift = computeTireGrip("asphalt", 0.5, true);
        expect(wet.longGrip).toBeLessThan(dry.longGrip);
        expect(wet.latGrip).toBeLessThan(dry.latGrip);
        expect(drift.latGrip).toBeLessThan(wet.latGrip * 0.5);
    });

    it("finds the nearest enterable vehicle within reach and ignores distant cars", () => {
        const list = [
            { id: "far", pos: { x: 20, z: 0 } },
            { id: "near", pos: { x: 2.1, z: -1.5 } },
            { id: "mid", pos: { x: 4.5, z: 0 } }
        ];
        expect(findNearestEnterableVehicle(0, 0, list, 5.4).id).toBe("near");
        expect(findNearestEnterableVehicle(100, 100, list, 5.4)).toBeNull();
    });

    it("advances civilian traffic, moves pedestrians, and triggers crash knockback on impact", () => {
        const graph = buildRoadGraph();
        const traffic = createTrafficSystem(graph, 2026);
        expect(traffic.cars.length).toBe(22);
        expect(traffic.peds.length).toBe(20);

        const car0Start = { x: traffic.cars[0].pos.x, z: traffic.cars[0].pos.z };
        for (let step = 0; step < 30; step += 1) {
            traffic.update(0.033, step * 0.033, { pos: { x: 0, z: -304 }, yaw: 0, speed: 0, isDriving: false });
        }
        const moved = Math.hypot(traffic.cars[0].pos.x - car0Start.x, traffic.cars[0].pos.z - car0Start.z);
        expect(moved).toBeGreaterThan(0.5);

        let crashCount = 0;
        const target = traffic.cars[1];
        traffic.update(
            0.033,
            1.5,
            { pos: { x: target.pos.x + 1.0, z: target.pos.z }, yaw: 0, speed: 24, isDriving: true },
            () => {
                crashCount += 1;
            }
        );
        expect(crashCount).toBe(1);
        expect(target.knockTimer).toBeGreaterThan(0);
    });

    it("keeps on-foot camera getViewYaw single-counted and moves WASD strictly relative to camera", () => {
        const camSrc = readFileSync("src/lab/gta/gta-camera.js", "utf8");
        expect(camSrc).toContain("getViewYaw: () => activeViewYaw");
        expect(camSrc).not.toContain("getViewYaw: () => wrapAngle(followYaw + orbitYaw)");

        const rightYaw = resolveCameraViewYaw(false, -Math.PI * 0.5, -Math.PI * 0.5);
        expect(rightYaw).toBeCloseTo(-Math.PI * 0.5, 5);

        const fwdMove = computeCameraRelativeMove(1, 0, rightYaw, 5);
        expect(fwdMove.mx).toBeCloseTo(-5, 4);
        expect(Math.abs(fwdMove.mz)).toBeLessThan(1e-4);

        const backMove = computeCameraRelativeMove(-1, 0, rightYaw, 5);
        expect(backMove.mx).toBeCloseTo(5, 4);
        expect(Math.abs(backMove.mz)).toBeLessThan(1e-4);

        const rightMove = computeCameraRelativeMove(0, 1, rightYaw, 5);
        expect(Math.abs(rightMove.mx)).toBeLessThan(1e-4);
        expect(rightMove.mz).toBeCloseTo(-5, 4);

        const leftMove = computeCameraRelativeMove(0, -1, rightYaw, 5);
        expect(Math.abs(leftMove.mx)).toBeLessThan(1e-4);
        expect(leftMove.mz).toBeCloseTo(5, 4);
    });

    it("tunes responsive asymmetric vehicle steering with highway speed taper and clamps extreme HDRI glare", () => {
        const turnIn = stepVehicleSteering(0, 1, 8, 52, 0.1);
        expect(turnIn.rawSteer).toBeGreaterThan(0.55);
        expect(turnIn.speedFactor).toBeCloseTo(1, 3);

        const recenter = stepVehicleSteering(1, 0, 8, 52, 0.1);
        expect(recenter.rawSteer).toBeLessThan(0.3);

        const counter = stepVehicleSteering(0.8, -1, 10, 52, 0.08);
        expect(counter.rawSteer).toBeLessThan(-0.3);

        const highway = stepVehicleSteering(1, 1, 46, 52, 0.05);
        expect(highway.effectiveSteer).toBeLessThan(0.55);

        expect(softClampRadianceValue(1.5, 4.5, 8.0)).toBeCloseTo(1.5, 4);
        expect(softClampRadianceValue(180.0, 4.5, 8.0)).toBeLessThan(8.01);
        expect(softClampRadianceValue(180.0, 4.5, 8.0)).toBeGreaterThan(7.5);
    });
});
