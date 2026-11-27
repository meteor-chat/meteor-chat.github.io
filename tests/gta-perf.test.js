import { describe, it, expect } from "vitest";
import {
    QUALITY_PRESETS,
    computeSectorIndex,
    createPerfGovernor
} from "../src/lab/gta/gta-perf-governor.js";

describe("Los Santos Performance Governor & 3x3 Spatial Sectors", () => {
    it("defines High, Balanced, and Fast quality presets with monotonic GPU budgets", () => {
        expect(QUALITY_PRESETS.high.shadowSize).toBeGreaterThan(QUALITY_PRESETS.balanced.shadowSize);
        expect(QUALITY_PRESETS.balanced.shadowSize).toBeGreaterThan(QUALITY_PRESETS.fast.shadowSize);
        expect(QUALITY_PRESETS.high.farClip).toBeGreaterThan(QUALITY_PRESETS.balanced.farClip);
        expect(QUALITY_PRESETS.balanced.farClip).toBeGreaterThan(QUALITY_PRESETS.fast.farClip);
        expect(QUALITY_PRESETS.fast.bloomEnabled).toBe(false);
        expect(QUALITY_PRESETS.fast.shadowsEnabled).toBe(false);
    });

    it("maps world coordinates cleanly into a clamped 3x3 spatial sector grid", () => {
        expect(computeSectorIndex(-300, -300)).toBe(0);
        expect(computeSectorIndex(0, -300)).toBe(1);
        expect(computeSectorIndex(300, -300)).toBe(2);
        expect(computeSectorIndex(0, 0)).toBe(4);
        expect(computeSectorIndex(300, 300)).toBe(8);
        expect(computeSectorIndex(-999, -999)).toBe(0);
        expect(computeSectorIndex(999, 999)).toBe(8);
    });

    it("scales resolution down under sustained low FPS and restores when frame times recover", () => {
        const gov = createPerfGovernor("balanced");
        expect(gov.getScale()).toBe(1.0);

        let reduced = false;
        for (let i = 0; i < 80; i += 1) {
            const res = gov.sample(0.04);
            if (res.changed) reduced = true;
        }
        expect(reduced).toBe(true);
        expect(gov.getScale()).toBeLessThan(1.0);
        expect(gov.getScale()).toBeGreaterThanOrEqual(QUALITY_PRESETS.balanced.minResScale);

        const dipped = gov.getScale();
        for (let i = 0; i < 240; i += 1) {
            gov.sample(0.011);
        }
        expect(gov.getScale()).toBeGreaterThan(dipped);

        const fast = gov.setPreset("fast");
        expect(fast.preset.key).toBe("fast");
        expect(gov.getScale()).toBe(QUALITY_PRESETS.fast.maxResScale);
    });
});
