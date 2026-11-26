import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync } from "fs";
import { createGtaAudio } from "../src/lab/gta/gta-audio.js";
import {
    CAMERA_MODES,
    computeCameraOffsets,
    computeDynamicFov,
    dampAngle,
    wrapAngle
} from "../src/lab/gta/gta-camera-math.js";
import { createGtaHud, formatCash, projectRadarPoint } from "../src/lab/gta/gta-hud.js";

function createMockRadarCtx() {
    const noop = () => {};
    return {
        fillStyle: "",
        strokeStyle: "",
        lineWidth: 1,
        lineCap: "butt",
        lineJoin: "miter",
        save: noop,
        restore: noop,
        translate: noop,
        rotate: noop,
        fillRect: noop,
        beginPath: noop,
        moveTo: noop,
        lineTo: noop,
        closePath: noop,
        arc: noop,
        fill: noop,
        stroke: noop
    };
}

describe("Los Santos HUD, Radar, Camera Math & Web Audio", () => {
    let hud = null;

    beforeEach(() => {
        document.documentElement.innerHTML = readFileSync("gta.html", "utf8");
        window.HTMLCanvasElement.prototype.getContext = function getMock(kind) {
            if (kind === "2d") return createMockRadarCtx();
            return null;
        };
    });

    afterEach(() => {
        if (hud) {
            hud.destroy();
            hud = null;
        }
    });

    it("projects radar points heading-up and formats USD cash cleanly", () => {
        const ahead = projectRadarPoint(0, 20, 0, 0, 0, 1, 100, 70);
        expect(ahead.sx).toBeCloseTo(100, 3);
        expect(ahead.sy).toBeCloseTo(50, 3);

        const right = projectRadarPoint(-15, 0, 0, 0, 0, 1, 100, 70);
        expect(right.sx).toBeCloseTo(115, 3);
        expect(right.sy).toBeCloseTo(70, 3);

        expect(formatCash(201300)).toBe("$201,300");
        expect(formatCash(-50)).toBe("$0");
    });

    it("syncs GTA HUD telemetry, wanted flash, speedometer, and settings drawer callbacks", () => {
        const events = [];
        const root = document.getElementById("gta-app-root");
        hud = createGtaHud(root, {
            onTime: (v) => events.push(["time", v]),
            onWeather: (v) => events.push(["weather", v]),
            onGps: (v) => events.push(["gps", v]),
            onSpawnCar: (v) => events.push(["spawn", v]),
            onWantedSet: (v) => events.push(["wanted", v]),
            onCamCycle: () => events.push(["cam"]),
            onRadioToggle: () => events.push(["radio"]),
            onAudioToggle: () => events.push(["audio"]),
            onReset: () => events.push(["reset"])
        });

        hud.setLoader("Ready", 100, true);
        expect(root.querySelector("[data-gta-loader]").hidden).toBe(true);

        hud.sync(0.016, {
            fps: 60,
            isDriving: true,
            vehicleName: "Elegy GT-R",
            drawCalls: 42,
            scale: 1,
            cash: 205000,
            hp: 90,
            armor: 75,
            nitro: 64,
            mph: 94,
            gear: "D4",
            district: "Downtown Los Santos",
            street: "Integrity Way",
            promptText: "",
            wantedStars: 5,
            evading: false,
            radioOn: true,
            muted: false,
            timeSec: 1.0,
            px: 0,
            pz: -90,
            headingYaw: 0,
            gpsPoints: [{ x: 0, z: -90 }, { x: 0, z: 0 }],
            gpsMiles: 0.42,
            parkedCars: [{ x: 4, z: -285 }],
            civCars: [{ pos: { x: 10, z: -80 } }],
            policeUnits: [{ pos: { x: -12, z: -70 } }]
        });

        expect(root.querySelector("[data-gta-fps]").textContent).toBe("60 FPS");
        expect(root.querySelector("[data-gta-mode]").textContent).toBe("ELEGY GT-R");
        expect(root.querySelector("[data-gta-cash]").textContent).toBe("$205,000");
        expect(root.querySelector("[data-gta-mph]").textContent).toBe("94");
        expect(root.querySelector("[data-gta-gear]").textContent).toBe("D4");
        expect(root.querySelector("[data-gta-speedo]").hidden).toBe(false);
        expect(root.querySelector("[data-gta-street]").textContent).toBe("Integrity Way");
        expect(root.querySelector("[data-gta-gps-dist]").textContent).toBe("0.42 mi");
        expect(root.querySelectorAll("[data-gta-star].active").length).toBe(5);

        const settingsToggle = root.querySelector("[data-gta-settings-toggle]");
        const drawer = root.querySelector("[data-gta-settings]");
        expect(drawer.hidden).toBe(true);
        settingsToggle.click();
        expect(drawer.hidden).toBe(false);

        root.querySelector('[data-gta-time="sunset"]').click();
        root.querySelector('[data-gta-weather="rain"]').click();
        root.querySelector('[data-gta-gps="beach"]').click();
        root.querySelector('[data-gta-spawn="gauntlet"]').click();
        root.querySelector('[data-gta-wanted-set="5"]').click();
        root.querySelector("[data-gta-cam-cycle]").click();
        root.querySelector("[data-gta-radio]").click();
        root.querySelector("[data-gta-audio]").click();
        root.querySelector("[data-gta-reset]").click();

        expect(events).toEqual([
            ["time", "sunset"],
            ["weather", "rain"],
            ["gps", "beach"],
            ["spawn", "gauntlet"],
            ["wanted", 5],
            ["cam"],
            ["radio"],
            ["audio"],
            ["reset"]
        ]);

        hud.setLost(true);
        expect(root.querySelector("[data-gta-context-lost]").hidden).toBe(false);
        hud.setFallback("WebGL2 missing");
        expect(root.querySelector("[data-gta-fallback]").hidden).toBe(false);
    });

    it("computes damped camera angles, dynamic FOV kick, and all camera mode offsets", () => {
        expect(CAMERA_MODES.length).toBe(4);
        expect(wrapAngle(Math.PI * 3)).toBeCloseTo(Math.PI, 4);
        const damped = dampAngle(0, Math.PI * 0.5, 8, 0.1);
        expect(damped).toBeGreaterThan(0);
        expect(damped).toBeLessThan(Math.PI * 0.5);

        expect(computeDynamicFov(62, 0, false, "onFoot")).toBe(62);
        const slowFov = computeDynamicFov(62, 5, false, "chaseNear");
        const fastFov = computeDynamicFov(62, 42, false, "chaseNear");
        const nitroFov = computeDynamicFov(62, 42, true, "chaseNear");
        expect(fastFov).toBeGreaterThan(slowFov);
        expect(nitroFov).toBeGreaterThan(fastFov);

        expect(computeCameraOffsets("chaseNear", false).right).toBeGreaterThan(0);
        expect(computeCameraOffsets("hood", true).back).toBeLessThan(0);
        expect(computeCameraOffsets("chaseFar", true).back).toBeGreaterThan(computeCameraOffsets("chaseNear", true).back);
    });

    it("handles Web Audio lifecycle safely in headless JSDOM without throwing", () => {
        const audio = createGtaAudio();
        expect(audio.isMuted()).toBe(false);
        expect(audio.isRadioOn()).toBe(false);
        expect(() => {
            audio.unlock();
            audio.setRadio(true);
            audio.playHorn();
            audio.playDoor();
            audio.playCrash(0.8);
            audio.playWantedChime();
            audio.update(0.033, { isDriving: true, rpm: 4200, throttle: 1, drifting: true, lateralSpeed: 6, sirenIntensity: 0.7, timeSec: 2 });
            audio.setMuted(true);
        }).not.toThrow();
        expect(audio.isMuted()).toBe(true);
        expect(audio.isRadioOn()).toBe(true);
        audio.destroy();
    });
});
