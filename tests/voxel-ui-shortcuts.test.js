import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync } from "fs";
import { createVoxelApp } from "../src/lab/voxel/voxel-controller.js";
import { createVoxelInput } from "../src/lab/voxel/voxel-input.js";

function press(code) {
    const event = new window.KeyboardEvent("keydown", { code, cancelable: true, bubbles: true });
    window.dispatchEvent(event);
    return event;
}

describe("interface shortcuts", () => {
    let app = null;
    let root = null;

    beforeEach(() => {
        window.localStorage.clear();
        document.documentElement.innerHTML = readFileSync("voxel.html", "utf8");
        window.HTMLCanvasElement.prototype.getContext = () => null;
        root = document.getElementById("voxel-app-root");
        app = createVoxelApp(root);
    });

    afterEach(() => {
        app.destroy();
    });

    const off = (selector) => root.querySelector(selector).classList.contains("voxel-ui-off");

    it("F1 hides every layer and a second press restores the previous choices", () => {
        root.querySelector('[data-voxel-ui-toggle="hotbar"]').click();
        const first = press("F1");
        expect(first.defaultPrevented).toBe(true);
        for (const selector of ["[data-voxel-stats]", "[data-voxel-hotbar]", ".voxel-title", ".voxel-crosshair"]) {
            expect(off(selector), selector).toBe(true);
        }
        expect(root.querySelector("[data-voxel-settings-toggle]").classList.contains("voxel-ui-off")).toBe(false);
        press("F1");
        expect(off("[data-voxel-stats]")).toBe(false);
        expect(off("[data-voxel-hotbar]")).toBe(true);
    });

    it("F3 toggles statistics and H toggles the hotbar", () => {
        const f3 = press("F3");
        expect(f3.defaultPrevented).toBe(true);
        expect(off("[data-voxel-stats]")).toBe(true);
        press("F3");
        expect(off("[data-voxel-stats]")).toBe(false);
        press("KeyH");
        expect(off("[data-voxel-hotbar]")).toBe(true);
        press("KeyH");
        expect(off("[data-voxel-hotbar]")).toBe(false);
    });

    it("ignores held-down key repeats", () => {
        window.dispatchEvent(new window.KeyboardEvent("keydown", { code: "KeyH", repeat: true }));
        expect(off("[data-voxel-hotbar]")).toBe(false);
    });

    it("exposes a toggle for the title, crosshair, and every statistic in the panel", () => {
        const panel = root.querySelector("[data-voxel-settings]");
        panel.querySelector('[data-voxel-ui-toggle="title"]').click();
        panel.querySelector('[data-voxel-ui-toggle="crosshair"]').click();
        expect(off(".voxel-title")).toBe(true);
        expect(off(".voxel-crosshair")).toBe(true);
        for (const key of ["fps", "coords", "chunks", "tris", "scale", "gpu"]) {
            const button = panel.querySelector(`[data-voxel-ui-item="${key}"]`);
            expect(button, key).not.toBeNull();
            button.click();
            expect(off(`[data-tel-${key}]`), key).toBe(true);
            expect(button.getAttribute("aria-pressed")).toBe("false");
        }
        panel.querySelector("[data-voxel-ui-hideall]").click();
        expect(off("[data-voxel-hotbar]")).toBe(true);
        expect(panel.querySelector("[data-voxel-ui-hideall]").getAttribute("aria-pressed")).toBe("true");
    });

    it("leaves the other shortcuts working when the hud has no layout", () => {
        const canvas = document.createElement("canvas");
        const player = { flyMode: true };
        const state = { selectedSlot: 0 };
        const hud = { syncHud: () => {} };
        const input = createVoxelInput({ canvas, player, state, hud, performBlockAction: () => {} });
        press("KeyH");
        press("F1");
        press("KeyF");
        expect(player.flyMode).toBe(false);
        input.destroy();
    });
});