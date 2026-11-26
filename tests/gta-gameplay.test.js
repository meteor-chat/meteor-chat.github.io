import { describe, it, expect } from "vitest";
import { createPoliceSystem } from "../src/lab/gta/gta-police-ai.js";
import { buildRoadGraph } from "../src/lab/gta/gta-road-graph.js";
import { createTrafficSystem } from "../src/lab/gta/gta-traffic-ai.js";
import {
    VEHICLE_PRESETS,
    computeGearAndRpm,
    computeTireGrip,
    findNearestEnterableVehicle
} from "../src/lab/gta/gta-vehicle-specs.js";

describe("Los Santos Vehicle Specs, Traffic AI & Police Pursuit AI", () => {
    it("exposes 4 tuned vehicle presets with valid physics and wheel dimensions", () => {
        for (const key of ["elegy", "gauntlet", "cavalcade", "cruiser"]) {
            const p = VEHICLE_PRESETS[key];
            expect(p).toBeDefined();
            expect(p.mass).toBeGreaterThan(1400);
            expect(p.engineTorque).toBeGreaterThan(900);
            expect(p.wheelRadius).toBeGreaterThan(0.3);
            expect(p.halfTrack).toBeGreaterThan(0.8);
            expect(p.halfWheelbase).toBeGreaterThan(1.3);
            expect(p.differentials.length).toBeGreaterThan(0);
        }
        expect(VEHICLE_PRESETS.cruiser.police).toBe(true);
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

    it("escalates 0 to 5 wanted stars, spawns LSPD interceptors & roadblocks, and rewards escape", () => {
        const graph = buildRoadGraph();
        const police = createPoliceSystem(graph, 2026);

        expect(police.getStars()).toBe(0);
        const idle = police.update(0.033, { pos: { x: 0, z: 0 }, yaw: 0, speed: 0, isDriving: false });
        expect(idle.stars).toBe(0);
        expect(police.units.length).toBe(0);

        police.addHeat(30);
        expect(police.getStars()).toBeGreaterThanOrEqual(2);

        police.setWanted(5);
        expect(police.getStars()).toBe(5);
        police.update(0.033, { pos: { x: 0, z: 0 }, yaw: 0, speed: 12, isDriving: true });
        expect(police.units.length).toBe(8);
        expect(police.units.some((u) => u.roadblock)).toBe(true);

        let rammed = 0;
        const u0 = police.units[0];
        u0.pos.x = 1.2;
        u0.pos.z = 0;
        police.update(
            0.033,
            { pos: { x: 0, z: 0 }, yaw: 0, speed: 18, isDriving: true },
            () => {
                rammed += 1;
            }
        );
        expect(rammed).toBeGreaterThanOrEqual(1);

        for (const u of police.units) {
            u.pos.x = -260;
            u.pos.z = -260;
        }
        let escapedStars = 0;
        for (let step = 0; step < 260; step += 1) {
            for (const u of police.units) {
                u.pos.x = -260;
                u.pos.z = -260;
            }
            const res = police.update(
                0.05,
                { pos: { x: -120, z: -120 }, yaw: 0, speed: 20, isDriving: true },
                null,
                (cleared) => {
                    escapedStars = cleared;
                }
            );
            if (res.stars === 0) break;
        }
        expect(escapedStars).toBe(5);
        expect(police.getStars()).toBe(0);
        expect(police.units.length).toBe(0);
    });
});
