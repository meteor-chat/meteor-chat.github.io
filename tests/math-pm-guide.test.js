import { describe, it, expect, beforeEach } from "vitest";
import { PM_GUIDE_DATA } from "../src/math/calculators/math-calc-pm-guide-data.js";
import { getPmGuideHtml, renderPmGuide } from "../src/math/calculators/math-calc-pm-guide.js";

describe("math-calc-pm-guide", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
    });

    it("contains guide data for all 11 project management formulas (form 25 to 35)", () => {
        for (let id = 25; id <= 35; id++) {
            const entry = PM_GUIDE_DATA[id];
            expect(entry).toBeDefined();
            expect(entry.title).toBeTruthy();
            expect(entry.formula).toBeTruthy();
            expect(Array.isArray(entry.inputs)).toBe(true);
            expect(entry.inputs.length).toBeGreaterThanOrEqual(2);

            for (const input of entry.inputs) {
                expect(input.name).toBeTruthy();
                expect(input.meaning).toBeTruthy();
                expect(input.source).toBeTruthy();
                expect(input.purpose).toBeTruthy();
            }

            expect(entry.outputs).toBeDefined();
            expect(entry.outputs.meaning).toBeTruthy();
            expect(Array.isArray(entry.outputs.interpretation)).toBe(true);
            expect(entry.outputs.interpretation.length).toBeGreaterThan(0);
            expect(entry.outputs.action).toBeTruthy();

            expect(entry.example).toBeDefined();
            expect(entry.example.title).toBeTruthy();
            expect(entry.example.story).toBeTruthy();
            expect(entry.example.calc).toBeTruthy();
            expect(entry.example.meaning).toBeTruthy();
        }
    });

    it("generates non-empty HTML for valid formula ids and empty string for invalid ids", () => {
        expect(getPmGuideHtml(25)).toContain("Rate of Performance");
        expect(getPmGuideHtml(30)).toContain("Cost Performance Index");
        expect(getPmGuideHtml(35)).toContain("Variance at Completion");
        expect(getPmGuideHtml(99)).toBe("");
    });

    it("renders guide markup into target container element and prevents duplicate rendering", () => {
        const container = document.createElement("div");
        container.id = "pm-guide-container-25";
        document.body.appendChild(container);

        expect(container.dataset.rendered).toBeUndefined();
        renderPmGuide(25, container);
        expect(container.dataset.rendered).toBe("true");
        expect(container.innerHTML).toContain("Rate of Performance");

        const firstHtml = container.innerHTML;
        renderPmGuide(25, container);
        expect(container.innerHTML).toBe(firstHtml);
    });

    it("locates container by id when second argument is omitted", () => {
        const container = document.createElement("div");
        container.id = "pm-guide-container-28";
        document.body.appendChild(container);

        renderPmGuide(28);
        expect(container.dataset.rendered).toBe("true");
        expect(container.innerHTML).toContain("Cost Variance");
    });
});
