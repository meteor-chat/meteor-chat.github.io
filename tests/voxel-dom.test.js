import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync, existsSync, readdirSync } from "fs";
import { createVoxelApp } from "../src/lab/voxel/voxel-controller.js";
import { hourToTimeOfDay, timeOfDayToHour } from "../src/lab/voxel/voxel-ui.js";

function createMock2dContext() {
    const noop = () => {};
    return {
        clearRect: noop,
        drawImage: noop,
        putImageData: noop,
        createImageData: (w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w) * Math.max(1, h) * 4) })
    };
}

describe("Voxel World 3D Routing, Compliance & DOM App", () => {
    let app = null;

    beforeEach(() => {
        window.localStorage.clear();
        document.documentElement.innerHTML = readFileSync("voxel.html", "utf8");
        window.HTMLCanvasElement.prototype.getContext = function getMockCtx(kind) {
            if (kind === "2d") return createMock2dContext();
            return null;
        };
    });

    afterEach(() => {
        if (app) {
            app.destroy();
            app = null;
        }
    });

    it("wires /lab card, standalone HTML pages, back link to /lab, and 404 SPA routes", () => {
        const labHtml = readFileSync("lab.html", "utf8");
        expect(labHtml).toContain('href="/voxel"');
        expect(labHtml).toContain("Voxel World Engine");

        const notFoundHtml = readFileSync("404.html", "utf8");
        expect(notFoundHtml).toContain('"/voxel"');
        expect(notFoundHtml).toContain('"/lab/voxel"');
        expect(notFoundHtml).toContain('"/voxel.html"');

        expect(existsSync("voxel.html")).toBe(true);
        expect(existsSync("voxel/index.html")).toBe(true);
        const pageHtml = readFileSync("voxel.html", "utf8");
        expect(pageHtml).toContain('href="/lab"');
        expect(pageHtml).toContain("assets/svg/back.svg");
        expect(pageHtml).toContain("VOXEL WORLD");
    });

    it("keeps every voxel file <= 1000 lines with zero comments, zero em-dashes, and font-weight <= 600", () => {
        const voxelTests = readdirSync("tests")
            .filter((f) => f.startsWith("voxel") && f.endsWith(".test.js"))
            .map((f) => `tests/${f}`);
        const files = [
            ...readdirSync("src/lab/voxel").map((f) => `src/lab/voxel/${f}`),
            "styles/voxel.css",
            "styles/voxel-settings.css",
            "styles/voxel-lan.css",
            "styles/voxel-guard.css",
            "voxel.html",
            "voxel/index.html",
            ...voxelTests,
            "tests/helpers/mock-gl.js"
        ];
        const slashLineRe = new RegExp("(^|\\s)/" + "/");
        const blockComRe = new RegExp("/" + "\\*");
        const htmlComRe = new RegExp("<!" + "--");
        for (const file of files) {
            const raw = readFileSync(file, "utf8");
            const lines = raw.split(/\r?\n/);
            expect(lines.length, `${file} line count (${lines.length})`).toBeLessThanOrEqual(1000);
            expect(raw, `${file} must contain zero line comments`).not.toMatch(slashLineRe);
            expect(raw, `${file} must contain zero block comments`).not.toMatch(blockComRe);
            expect(raw, `${file} must contain zero HTML comments`).not.toMatch(htmlComRe);
            expect(raw, `${file} must contain zero em-dashes`).not.toContain("\u2014");
        }
        const styleFiles = ["voxel.html", "styles/voxel.css", "styles/voxel-settings.css", "styles/voxel-lan.css", "styles/voxel-guard.css"];
        for (const file of styleFiles) {
            const raw = readFileSync(file, "utf8");
            for (const match of raw.matchAll(/font-weight\s*:\s*([^;]+)/g)) {
                const nums = match[1].match(/\d+/g) || [];
                for (const n of nums) {
                    expect(Number(n), `${file} weight ${n}`).toBeLessThanOrEqual(600);
                }
            }
        }
    });

    it("ships hidden GPU telemetry, resolution telemetry, and a hidden context-lost banner in both entrypoints", () => {
        for (const file of ["voxel.html", "voxel/index.html"]) {
            const html = readFileSync(file, "utf8");
            expect(html, file).toContain("data-tel-scale");
            expect(html, file).toMatch(/data-tel-gpu hidden/);
            expect(html, file).toMatch(/data-voxel-context-lost[^>]*hidden/);
        }
        expect(readFileSync("voxel.html", "utf8")).toBe(readFileSync("voxel/index.html", "utf8"));
    });

    it("renders 9 hotbar slots, starts in Walk mode, toggles modes, and reveals fallback when WebGL 2 is absent", () => {
        const root = document.getElementById("voxel-app-root");
        app = createVoxelApp(root);

        const fallback = root.querySelector("[data-voxel-fallback]");
        expect(fallback.hidden).toBe(false);

        const slots = root.querySelectorAll(".voxel-slot");
        expect(slots.length).toBe(9);
        slots[4].click();
        expect(app.state.selectedSlot).toBe(4);
        expect(slots[4].getAttribute("aria-pressed")).toBe("true");

        const flyBtn = root.querySelector("[data-voxel-fly]");
        expect(app.player.flyMode).toBe(false);
        expect(flyBtn.textContent).toBe("Mode: Walk");
        flyBtn.click();
        expect(app.player.flyMode).toBe(true);
        expect(flyBtn.textContent).toBe("Mode: Fly");

        const actBtn = root.querySelector("[data-voxel-action]");
        expect(app.state.actionMode).toBe("break");
        actBtn.click();
        expect(app.state.actionMode).toBe("place");
        expect(actBtn.textContent).toBe("Click: Place");

        const nightBtn = root.querySelector('[data-voxel-time="0.88"]');
        nightBtn.click();
        expect(app.state.timeOfDay).toBeCloseTo(0.88, 2);
        expect(nightBtn.getAttribute("aria-pressed")).toBe("true");
    });

    it("toggles the settings panel and drives sensitivity, FOV, hour, view distance, and resolution", () => {
        const root = document.getElementById("voxel-app-root");
        app = createVoxelApp(root);

        expect(app.state.settings.sensitivity).toBe(1);
        expect(app.state.settings.fov).toBe(70);

        const panel = root.querySelector("[data-voxel-settings]");
        const toggle = root.querySelector("[data-voxel-settings-toggle]");
        expect(panel.hidden).toBe(true);
        toggle.click();
        expect(panel.hidden).toBe(false);
        expect(toggle.getAttribute("aria-expanded")).toBe("true");

        const sens = root.querySelector("[data-voxel-sens]");
        sens.value = "2.5";
        sens.dispatchEvent(new window.Event("input"));
        expect(app.state.settings.sensitivity).toBeCloseTo(2.5, 5);
        expect(root.querySelector("[data-voxel-sens-val]").textContent).toBe("2.5");

        const fov = root.querySelector("[data-voxel-fov]");
        expect(fov.getAttribute("max")).toBe("120");
        fov.value = "120";
        fov.dispatchEvent(new window.Event("input"));
        expect(app.state.settings.fov).toBe(120);
        expect(root.querySelector("[data-voxel-fov-val]").textContent).toBe("120");

        const hour = root.querySelector("[data-voxel-hour]");
        expect(hour.getAttribute("min")).toBe("1");
        expect(hour.getAttribute("max")).toBe("24");
        expect(hour.getAttribute("step")).toBe("1");
        hour.value = "18";
        hour.dispatchEvent(new window.Event("input"));
        expect(app.state.autoCycle).toBe(false);
        expect(app.state.timeOfDay).toBeCloseTo(0.65, 2);
        expect(root.querySelector("[data-voxel-hour-val]").textContent).toBe("Hour 18");
        expect(timeOfDayToHour(hourToTimeOfDay(6))).toBe(6);
        expect(timeOfDayToHour(hourToTimeOfDay(12))).toBe(12);
        expect(timeOfDayToHour(hourToTimeOfDay(18))).toBe(18);
        expect(timeOfDayToHour(hourToTimeOfDay(24))).toBe(24);

        const dist = root.querySelector("[data-voxel-dist]");
        expect(dist.getAttribute("min")).toBe("3");
        expect(dist.getAttribute("max")).toBe("16");
        expect(dist.getAttribute("step")).toBe("1");
        dist.value = "16";
        dist.dispatchEvent(new window.Event("input"));
        expect(app.state.settings.viewRadius).toBe(16);
        expect(root.querySelector("[data-voxel-dist-val]").textContent).toBe("16 Chunks (256m)");

        const resAutoBtn = root.querySelector("[data-voxel-res-auto]");
        const resLockBtn = root.querySelector("[data-voxel-res-lock]");
        const resSlider = root.querySelector("[data-voxel-res-slider]");
        const resVal = root.querySelector("[data-voxel-res-val]");

        expect(app.state.settings.resMode).toBe("auto");
        expect(app.state.settings.lockedRes).toBe(1.0);
        expect(resAutoBtn.getAttribute("aria-pressed")).toBe("true");
        expect(resLockBtn.getAttribute("aria-pressed")).toBe("false");
        expect(resVal.textContent).toBe("Auto");

        resLockBtn.click();
        expect(app.state.settings.resMode).toBe("lock");
        expect(resLockBtn.getAttribute("aria-pressed")).toBe("true");
        expect(resAutoBtn.getAttribute("aria-pressed")).toBe("false");
        expect(resVal.textContent).toBe("Lock 100%");

        resSlider.value = "75";
        resSlider.dispatchEvent(new window.Event("input"));
        expect(app.state.settings.resMode).toBe("lock");
        expect(app.state.settings.lockedRes).toBeCloseTo(0.75, 5);
        expect(resVal.textContent).toBe("Lock 75%");

        resAutoBtn.click();
        expect(app.state.settings.resMode).toBe("auto");
        expect(resAutoBtn.getAttribute("aria-pressed")).toBe("true");
        expect(resLockBtn.getAttribute("aria-pressed")).toBe("false");
        expect(resVal.textContent).toBe("Auto");

        toggle.click();
        expect(panel.hidden).toBe(true);
    });

    it("offers the four interface conditions from the settings panel and remembers them", () => {
        const root = document.getElementById("voxel-app-root");
        app = createVoxelApp(root);
        const stats = root.querySelector("[data-voxel-stats]");
        const hotbar = root.querySelector("[data-voxel-hotbar]");
        const settingsBtn = root.querySelector("[data-voxel-settings-toggle]");
        const hidden = (el) => el.classList.contains("voxel-ui-off");
        const choose = (name) => root.querySelector(`[data-voxel-ui-preset="${name}"]`).click();

        expect(hidden(stats)).toBe(false);
        expect(hidden(hotbar)).toBe(false);
        choose("clear");
        expect([hidden(stats), hidden(hotbar)]).toEqual([true, true]);
        choose("bar");
        expect([hidden(stats), hidden(hotbar)]).toEqual([true, false]);
        choose("stats");
        expect([hidden(stats), hidden(hotbar)]).toEqual([false, true]);
        choose("full");
        expect([hidden(stats), hidden(hotbar)]).toEqual([false, false]);
        expect(hidden(settingsBtn)).toBe(false);

        choose("clear");
        app.destroy();
        document.documentElement.innerHTML = readFileSync("voxel.html", "utf8");
        const rootAgain = document.getElementById("voxel-app-root");
        app = createVoxelApp(rootAgain);
        expect(rootAgain.querySelector("[data-voxel-stats]").classList.contains("voxel-ui-off")).toBe(true);
        expect(rootAgain.querySelector("[data-voxel-hotbar]").classList.contains("voxel-ui-off")).toBe(true);
    });

    it("keeps only the settings button visible in the header and moves every control into the panel", () => {
        const root = document.getElementById("voxel-app-root");
        const header = root.querySelector(".voxel-hud-top");
        const panel = root.querySelector("[data-voxel-settings]");
        const headerButtons = header.querySelectorAll("button, a");
        expect(headerButtons).toHaveLength(1);
        expect(headerButtons[0].hasAttribute("data-voxel-settings-toggle")).toBe(true);
        expect(panel.hidden).toBe(true);

        const inPanel = [
            "[data-voxel-lock]",
            "[data-voxel-fly]",
            "[data-voxel-action]",
            '[data-voxel-time="0.28"]',
            '[data-voxel-time="0.62"]',
            '[data-voxel-time="0.88"]',
            "[data-voxel-cycle]",
            "[data-voxel-rain]",
            "[data-voxel-audio]",
            "[data-voxel-catalog-open]",
            'a[href="/lab"]'
        ];
        for (const selector of inPanel) {
            expect(panel.querySelector(selector), selector).not.toBeNull();
            expect(header.querySelector(selector), selector).toBeNull();
        }
        expect(panel.querySelector('a[href="/lab"] img').getAttribute("src")).toContain("back.svg");
    });

    it("still drives fly mode, click mode, catalog, and time presets from inside the panel", () => {
        const root = document.getElementById("voxel-app-root");
        app = createVoxelApp(root);
        const panel = root.querySelector("[data-voxel-settings]");
        panel.querySelector("[data-voxel-fly]").click();
        expect(app.player.flyMode).toBe(true);
        panel.querySelector("[data-voxel-action]").click();
        expect(app.state.actionMode).toBe("place");
        panel.querySelector('[data-voxel-time="0.62"]').click();
        expect(app.state.timeOfDay).toBeCloseTo(0.62, 2);
        panel.querySelector("[data-voxel-cycle]").click();
        expect(app.state.autoCycle).toBe(true);
        panel.querySelector("[data-voxel-rain]").click();
        expect(app.state.rain).toBe(true);

        const catalog = root.querySelector("[data-voxel-catalog]");
        expect(catalog.hidden).toBe(true);
        panel.querySelector("[data-voxel-catalog-open]").click();
        expect(catalog.hidden).toBe(false);
        const items = catalog.querySelectorAll(".voxel-catalog-item");
        expect(items.length).toBeGreaterThanOrEqual(24);
        items[0].click();
        expect(catalog.hidden).toBe(true);

        const lanModal = root.querySelector("[data-voxel-lan-modal]");
        expect(lanModal.hidden).toBe(true);
        panel.querySelector("[data-voxel-lan-open]").click();
        expect(lanModal.hidden).toBe(false);
        expect(root.querySelector("[data-lan-strict]").checked).toBe(true);
        root.querySelector("[data-voxel-lan-close]").click();
        expect(lanModal.hidden).toBe(true);
    });
});
