import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { isUnsupportedDevice } from "../src/lab/voxel/voxel-device-guard.js";

function fakeWindow({ coarse = false, hover = true, fine = true, width = 1440, platform = "Win32", touchPoints = 0 }) {
    return {
        innerWidth: width,
        navigator: { platform, maxTouchPoints: touchPoints },
        matchMedia: (query) => {
            const table = {
                "(pointer: coarse)": coarse,
                "(hover: none)": !hover,
                "(pointer: fine)": fine
            };
            return { matches: Boolean(table[query]) };
        }
    };
}

describe("Voxel mobile guard", () => {
    it("blocks phones and tablets with a coarse pointer and no hover", () => {
        expect(isUnsupportedDevice(fakeWindow({ coarse: true, hover: false, fine: false, width: 390 }))).toBe(true);
        expect(isUnsupportedDevice(fakeWindow({ coarse: true, hover: false, fine: false, width: 1024 }))).toBe(true);
    });

    it("blocks iPadOS in desktop mode through platform and touch points", () => {
        const ipad = fakeWindow({ platform: "MacIntel", touchPoints: 5, width: 1180 });
        expect(isUnsupportedDevice(ipad)).toBe(true);
    });

    it("blocks narrow viewports that have no fine pointer", () => {
        expect(isUnsupportedDevice(fakeWindow({ fine: false, width: 600 }))).toBe(true);
    });

    it("allows desktops, narrow desktop windows, and touchscreen laptops with a mouse", () => {
        expect(isUnsupportedDevice(fakeWindow({}))).toBe(false);
        expect(isUnsupportedDevice(fakeWindow({ width: 520 }))).toBe(false);
        expect(isUnsupportedDevice(fakeWindow({ coarse: true, hover: true, fine: true, touchPoints: 10 }))).toBe(false);
    });

    it("tolerates a window without matchMedia or navigator", () => {
        expect(isUnsupportedDevice({ innerWidth: 1200 })).toBe(false);
    });

    it("ships the same alert dialog and lazy controller import in both HTML entrypoints", () => {
        for (const file of ["voxel.html", "voxel/index.html"]) {
            const html = readFileSync(file, "utf8");
            expect(html, file).toContain('role="alertdialog"');
            expect(html, file).toContain("data-voxel-mobile-guard");
            expect(html, file).toContain("styles/voxel-guard.css");
            expect(html, file).toContain('import("./src/lab/voxel/voxel-controller.js")');
            expect(html, file).not.toContain("import { createVoxelApp }");
        }
    });
});
