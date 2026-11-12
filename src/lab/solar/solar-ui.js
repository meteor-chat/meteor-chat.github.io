import { SUN_DEF, PLANET_CATALOG } from "./solar-catalog.js";
import { getSemiMajorAxis } from "./kepler-solver.js";
import { drawPlanetThumbnail } from "./planet-textures.js";
import { hitTestSolarBody } from "./overlay-2d.js";

export function createSolarDockButtons(root, state, focusBody) {
    const dockEl = root.querySelector("[data-solar-dock]");
    const dockButtons = new Map();
    if (!dockEl) return dockButtons;
    dockEl.innerHTML = "";
    for (const p of PLANET_CATALOG) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "solar-dock-item";
        btn.dataset.planetId = p.id;
        btn.setAttribute("aria-pressed", "false");
        btn.setAttribute("aria-label", `Focus ${p.name}`);
        const cvs = document.createElement("canvas");
        cvs.width = 96;
        cvs.height = 96;
        cvs.className = "solar-dock-thumb";
        drawPlanetThumbnail(cvs, p);
        const lbl = document.createElement("span");
        lbl.className = "solar-dock-name";
        lbl.textContent = p.name;
        btn.appendChild(cvs);
        btn.appendChild(lbl);
        btn.addEventListener("click", () => {
            if (state.activeBodyId === p.id && state.focusReticleVisible) {
                focusBody("sun", true);
            } else {
                focusBody(p.id, false);
            }
        });
        dockEl.appendChild(btn);
        dockButtons.set(p.id, btn);
    }
    return dockButtons;
}

export function syncSolarControlUi(root, state, dockButtons) {
    const toggleAttr = (sel, active, text) => {
        const el = root.querySelector(sel);
        if (!el) return;
        if (text !== undefined) el.textContent = text;
        el.setAttribute("aria-pressed", String(Boolean(active)));
    };
    toggleAttr("[data-solar-play]", state.paused, state.paused ? "Resume" : "Pause");
    toggleAttr("[data-solar-reverse]", state.direction < 0, state.direction < 0 ? "Reverse" : "Forward");
    toggleAttr("[data-solar-cruise]", state.autoCruise);
    toggleAttr("[data-solar-orbits]", state.showOrbits);
    toggleAttr("[data-solar-labels]", state.showLabels);

    const spdLbl = root.querySelector("[data-solar-speed-label]");
    if (spdLbl) spdLbl.textContent = `${state.timeScale} d/s`;

    root.querySelectorAll("[data-scale-mode]").forEach((el) => {
        el.setAttribute("aria-pressed", String(el.dataset.scaleMode === state.scaleMode));
    });
    dockButtons.forEach((btn, id) => {
        const active = id === state.activeBodyId && state.focusReticleVisible;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", String(active));
    });
}

export function updateSolarTelemetry(root, state, worldMap) {
    const body = PLANET_CATALOG.find((p) => p.id === state.activeBodyId) || SUN_DEF;
    const setTxt = (sel, val) => {
        const el = root.querySelector(sel);
        if (el) el.textContent = val;
    };
    setTxt("[data-tel-name]", body.name);
    setTxt("[data-tel-cat]", body.category);
    setTxt("[data-tel-tilt]", `${body.tiltDeg.toFixed(1)} deg`);
    setTxt("[data-tel-summary]", body.summary);
    setTxt("[data-tel-simdays]", `J2000 + ${Math.round(state.simDays).toLocaleString("en-US")} d`);

    if (body.id === "sun") {
        setTxt("[data-tel-dist]", "0.000 AU");
        setTxt("[data-tel-speed]", "0.0 km/s (Barycenter)");
        setTxt("[data-tel-period]", "225M yr Galactic");
        return;
    }
    const pos = worldMap.get(body.id) || { x: 0, y: 0, z: 0 };
    const aScene = getSemiMajorAxis(body, state.scaleMode);
    const rScene = Math.hypot(pos.x, pos.y, pos.z) || aScene;
    const rAu = (rScene / Math.max(1e-6, aScene)) * body.aAU;
    const visFactor = Math.sqrt(Math.max(0.2, (2 * body.aAU) / rAu - 1));
    setTxt("[data-tel-dist]", `${rAu.toFixed(3)} AU`);
    setTxt("[data-tel-speed]", `${(body.orbitalSpeedKms * visFactor).toFixed(2)} km/s`);
    setTxt("[data-tel-period]", `${Math.round(body.periodDays).toLocaleString("en-US")} d`);
}

export function bindSolarControls(root, state, handlers) {
    const bindClick = (sel, fn) => {
        const el = root.querySelector(sel);
        if (el) el.addEventListener("click", fn);
    };
    bindClick("[data-solar-play]", () => {
        state.paused = !state.paused;
        handlers.syncUi();
    });
    bindClick("[data-solar-reverse]", () => {
        state.direction *= -1;
        handlers.syncUi();
    });
    bindClick("[data-solar-cruise]", () => {
        state.autoCruise = !state.autoCruise;
        handlers.syncUi();
    });
    bindClick("[data-solar-orbits]", () => {
        state.showOrbits = !state.showOrbits;
        handlers.syncUi();
    });
    bindClick("[data-solar-labels]", () => {
        state.showLabels = !state.showLabels;
        handlers.syncUi();
    });
    bindClick("[data-solar-overview]", () => handlers.focusBody("sun", true));
    root.querySelectorAll("[data-scale-mode]").forEach((btn) => {
        btn.addEventListener("click", () => handlers.setScaleMode(btn.dataset.scaleMode));
    });
    const speedInput = root.querySelector("[data-solar-speed]");
    if (speedInput) {
        speedInput.addEventListener("input", () => {
            state.timeScale = Math.max(0.5, Number(speedInput.value) || 16);
            handlers.syncUi();
        });
    }
}

export function attachSolarViewportEvents(overlayCanvas, state, handlers) {
    let dragging = false;
    let movedDist = 0;
    let lastPtr = { x: 0, y: 0 };

    const getCanvasXY = (e) => {
        const rect = overlayCanvas && overlayCanvas.getBoundingClientRect ? overlayCanvas.getBoundingClientRect() : { left: 0, top: 0 };
        return { px: e.clientX - rect.left, py: e.clientY - rect.top };
    };
    const onPointerDown = (e) => {
        dragging = true;
        movedDist = 0;
        lastPtr = { x: e.clientX, y: e.clientY };
        state.autoCruise = false;
        handlers.syncUi();
    };
    const onPointerMove = (e) => {
        if (dragging) {
            const dx = e.clientX - lastPtr.x;
            const dy = e.clientY - lastPtr.y;
            movedDist += Math.hypot(dx, dy);
            lastPtr = { x: e.clientX, y: e.clientY };
            state.targetAzimuth -= dx * 0.0055;
            state.targetElevation = Math.max(-1.42, Math.min(1.42, state.targetElevation + dy * 0.0055));
            return;
        }
        const { px, py } = getCanvasXY(e);
        const hit = hitTestSolarBody(px, py, state.lastProjected);
        state.hoverBodyId = hit ? hit.body.id : null;
        if (overlayCanvas && overlayCanvas.style) overlayCanvas.style.cursor = hit ? "pointer" : "grab";
    };
    const onPointerUp = (e) => {
        if (!dragging) return;
        dragging = false;
        if (movedDist < 6 && overlayCanvas) {
            const { px, py } = getCanvasXY(e);
            const hit = hitTestSolarBody(px, py, state.lastProjected);
            if (hit) handlers.focusBody(hit.body.id, false);
        }
    };
    const onWheel = (e) => {
        e.preventDefault();
        const factor = Math.exp((e.deltaY || 0) * 0.0011);
        const minD = state.scaleMode === "real" ? 2.5 : 4.2;
        const maxD = state.scaleMode === "real" ? 950 : 210;
        state.targetDistance = Math.max(minD, Math.min(maxD, state.targetDistance * factor));
    };
    const onKeyDown = (e) => {
        if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
        if (e.code === "Space") {
            e.preventDefault();
            state.paused = !state.paused;
            handlers.syncUi();
        } else if (e.key === "r" || e.key === "R" || e.key === "0") {
            handlers.focusBody("sun", true);
        } else if (e.key >= "1" && e.key <= "8") {
            const p = PLANET_CATALOG[Number(e.key) - 1];
            if (p) handlers.focusBody(p.id, false);
        }
    };

    if (overlayCanvas) {
        overlayCanvas.addEventListener("pointerdown", onPointerDown);
        overlayCanvas.addEventListener("wheel", onWheel, { passive: false });
    }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("keydown", onKeyDown);

    return () => {
        if (overlayCanvas) {
            overlayCanvas.removeEventListener("pointerdown", onPointerDown);
            overlayCanvas.removeEventListener("wheel", onWheel);
        }
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("keydown", onKeyDown);
    };
}
