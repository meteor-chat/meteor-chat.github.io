import { describe, it, expect } from "vitest";
import { buildCityData } from "../src/lab/gta/gta-city-data.js";
import {
    GPS_DESTINATIONS,
    OCEAN_LEVEL,
    SAFEHOUSE_ORIGIN,
    X_ROADS,
    Z_ROADS,
    buildRoadGraph,
    computeGpsRoute,
    getSignalState,
    heightAt,
    lookupLocation,
    surfaceAt,
    waterLevelAt
} from "../src/lab/gta/gta-road-graph.js";

describe("Los Santos Road Graph, Terrain & City Generation", () => {
    it("computes smooth terrain rising to Vinewood Safehouse & ridge and sloping into Vespucci Ocean", () => {
        expect(heightAt(0, 0)).toBe(0);
        expect(heightAt(0, -270)).toBeGreaterThan(7.5);
        expect(heightAt(0, SAFEHOUSE_ORIGIN.z)).toBeGreaterThanOrEqual(12.0);
        expect(heightAt(0, -365)).toBeGreaterThan(24);
        expect(heightAt(0, 340)).toBeLessThan(OCEAN_LEVEL);

        expect(surfaceAt(0, 0)).toBe("asphalt");
        expect(surfaceAt(0, -285)).toBe("asphalt");
        expect(surfaceAt(0, -304)).toBe("concrete");
        expect(surfaceAt(0, 300)).toBe("sand");
        expect(surfaceAt(0, 332)).toBe("water");
        expect(waterLevelAt(0, 336)).toBe(OCEAN_LEVEL);
        expect(waterLevelAt(0, 0)).toBeNull();
    });

    it("resolves authentic Los Santos districts and named streets", () => {
        expect(lookupLocation(0, -304).district).toBe("Vinewood Hills");
        expect(lookupLocation(0, -90).district).toBe("Downtown");
        expect(lookupLocation(0, -90).street).toBe("Integrity Way");
        expect(lookupLocation(90, 0).street).toBe("Strawberry Ave");
        expect(lookupLocation(0, 290).district).toBe("Vespucci Beach");
    });

    it("cycles traffic signals across all 4 phases deterministically", () => {
        const phases = new Set();
        for (let t = 0; t < 20; t += 1) {
            phases.add(getSignalState(2, 2, t));
        }
        expect(phases.has("ns_green")).toBe(true);
        expect(phases.has("ns_yellow")).toBe(true);
        expect(phases.has("ew_green")).toBe(true);
        expect(phases.has("ew_yellow")).toBe(true);
    });

    it("builds a connected 7x7 road graph and computes A* GPS routes to every destination", () => {
        const graph = buildRoadGraph();
        expect(graph.nodes.length).toBe(X_ROADS.length * Z_ROADS.length);
        for (const n of graph.nodes) {
            expect(n.neighbors.length).toBeGreaterThanOrEqual(2);
            expect(n.neighbors.length).toBeLessThanOrEqual(4);
        }

        for (const key of Object.keys(GPS_DESTINATIONS)) {
            const route = computeGpsRoute(graph, 0, -290, key);
            expect(route.points.length).toBeGreaterThanOrEqual(2);
            expect(route.distanceMeters).toBeGreaterThan(0);
            expect(route.distanceMiles).toBeGreaterThan(0);
        }

        const empty = computeGpsRoute(graph, 0, 0, "none");
        expect(empty.points.length).toBe(0);
        expect(empty.distanceMeters).toBe(0);
    });

    it("generates deterministic 5-district Los Santos city data with landmarks, safehouse, and colliders", () => {
        const a = buildCityData(2026);
        const b = buildCityData(2026);

        expect(a.buildings.length).toBe(b.buildings.length);
        expect(a.buildings.length).toBeGreaterThan(100);
        expect(a.staticBoxes.length).toBe(b.staticBoxes.length);
        expect(a.palms.length).toBeGreaterThan(150);
        expect(a.lamps.length).toBeGreaterThan(40);
        expect(a.trafficLights.length).toBeGreaterThan(20);
        expect(a.ramps.length).toBe(4);
        expect(a.dynamicProps.length).toBeGreaterThan(30);

        expect(a.mazeTower.height).toBe(138);
        expect(a.constructionSite.craneHeight).toBe(68);
        expect(a.safehouse.y).toBe(SAFEHOUSE_ORIGIN.y);
        expect(a.safehouse.parkedCars.length).toBe(3);
        expect(a.safehouse.parkedCars[0].preset).toBe("elegy");
        expect(a.safehouse.parkedCars[1].preset).toBe("gauntlet");
        expect(a.safehouse.parkedCars[2].preset).toBe("cavalcade");

        const styles = new Set(a.buildings.map((bl) => bl.style));
        expect(styles.has("glassTower")).toBe(true);
        expect(styles.has("officeLight")).toBe(true);
        expect(styles.has("commercial")).toBe(true);
        expect(styles.has("apartment")).toBe(true);
        expect(styles.has("diner")).toBe(true);
    });
});
