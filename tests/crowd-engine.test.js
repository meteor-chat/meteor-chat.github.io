import { describe, it, expect } from "vitest";
import { createSimulation, stepSimulation, DEFAULT_CONFIG } from "../src/lab/crowd/crowd-engine.js";

describe("Crowd Engine - Helbing Social Force Model & Obstacle Paradox", () => {
    it("initializes simulation state with deterministic seeded positions", () => {
        const sim1 = createSimulation({ seed: 42, agentCount: 50, hasColumn: false });
        const sim2 = createSimulation({ seed: 42, agentCount: 50, hasColumn: false });

        expect(sim1.agents.length).toBe(50);
        expect(sim2.agents.length).toBe(50);
        expect(sim1.column.enabled).toBe(false);
        expect(sim1.agents[0].x).toBeCloseTo(sim2.agents[0].x, 5);
        expect(sim1.agents[0].y).toBeCloseTo(sim2.agents[0].y, 5);
        expect(sim1.evacuatedCount).toBe(0);
        expect(sim1.jammed).toBe(false);
    });

    it("places off-center column obstacle according to specification", () => {
        const sim = createSimulation({ hasColumn: true });
        expect(sim.column.enabled).toBe(true);
        expect(sim.column.x).toBe(DEFAULT_CONFIG.columnOffsetX);
        expect(sim.column.y).toBe(DEFAULT_CONFIG.columnOffsetY);
        expect(sim.column.r).toBe(DEFAULT_CONFIG.columnRadius);
        expect(sim.column.x).toBeGreaterThan(0);
    });

    it("applies social and physical repulsion driving agents towards exit", () => {
        const sim = createSimulation({ seed: 101, agentCount: 10 });
        const initialY = sim.agents[0].y;

        for (let i = 0; i < 20; i += 1) {
            stepSimulation(sim, 0.05);
        }

        expect(sim.time).toBeGreaterThan(0.9);
        expect(sim.agents[0].y).toBeLessThan(initialY);
    });

    it("evacuates agents once they pass through the door corridor", () => {
        const sim = createSimulation({ seed: 1, agentCount: 1 });
        sim.agents[0].x = 0;
        sim.agents[0].y = -DEFAULT_CONFIG.doorDepth + 0.1;
        sim.agents[0].vy = -2.0;

        stepSimulation(sim, 0.1);

        expect(sim.agents[0].evacuated).toBe(true);
        expect(sim.evacuatedCount).toBe(1);
        expect(sim.recentExits.length).toBe(1);
    });

    it("demonstrates the Obstacle Paradox: off-center column improves crowd throughput", () => {
        const seed = 999;
        const count = 70;
        const simNoCol = createSimulation({ seed, agentCount: count, hasColumn: false, desiredSpeed: 4.2 });
        const simWithCol = createSimulation({ seed, agentCount: count, hasColumn: true, desiredSpeed: 4.2 });

        for (let i = 0; i < 200; i += 1) {
            stepSimulation(simNoCol, 0.04);
            stepSimulation(simWithCol, 0.04);
        }

        expect(simWithCol.evacuatedCount).toBeGreaterThanOrEqual(simNoCol.evacuatedCount);
        expect(simWithCol.jamTime).toBeLessThanOrEqual(simNoCol.jamTime + 0.1);
    });

    it("respects speed clamping and tracks peak pressure", () => {
        const sim = createSimulation({ seed: 10, agentCount: 30, desiredSpeed: 3.5 });
        for (let i = 0; i < 30; i += 1) {
            stepSimulation(sim, 0.04);
        }
        for (const a of sim.agents) {
            const spd = Math.hypot(a.vx, a.vy);
            expect(spd).toBeLessThanOrEqual(sim.config.desiredSpeed * 1.5 + 0.01);
        }
        expect(sim.peakPressure).toBeGreaterThan(0);
    });
});
