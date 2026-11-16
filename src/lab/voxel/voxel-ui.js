import { HOTBAR_ITEMS } from "./voxel-blocks.js";
import { drawHotbarBlockIcon } from "./voxel-textures.js";

export function hourToTimeOfDay(hour) {
    return (((hour - 6) / 24 + 0.15) % 1 + 1) % 1;
}

export function timeOfDayToHour(timeOfDay) {
    const raw = ((timeOfDay - 0.15) % 1 + 1) % 1;
    let h = Math.round(raw * 24 + 6);
    if (h > 24) h -= 24;
    if (h <= 0) h += 24;
    return h;
}

export function createVoxelHud(root, atlas, state, player, canvas, hooks = {}) {
    const hotbarEl = root.querySelector("[data-voxel-hotbar]");
    const slotBtns = [];
    if (hotbarEl) {
        hotbarEl.innerHTML = "";
        HOTBAR_ITEMS.forEach((item, idx) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "voxel-slot";
            btn.dataset.slotIdx = String(idx);
            btn.setAttribute("aria-label", `${item.label} (${idx + 1})`);
            const icon = document.createElement("canvas");
            icon.width = 32;
            icon.height = 32;
            drawHotbarBlockIcon(icon, atlas, item.tex);
            const num = document.createElement("span");
            num.className = "voxel-slot-key";
            num.textContent = String(idx + 1);
            const lbl = document.createElement("span");
            lbl.className = "voxel-slot-name";
            lbl.textContent = item.label;
            btn.append(icon, num, lbl);
            btn.addEventListener("click", () => {
                state.selectedSlot = idx;
                syncHud();
            });
            hotbarEl.appendChild(btn);
            slotBtns.push(btn);
        });
    }

    const hourInput = root.querySelector("[data-voxel-hour]");
    const hourVal = root.querySelector("[data-voxel-hour-val]");
    const resAutoBtn = root.querySelector("[data-voxel-res-auto]");
    const resLockBtn = root.querySelector("[data-voxel-res-lock]");
    const resSlider = root.querySelector("[data-voxel-res-slider]");
    const resVal = root.querySelector("[data-voxel-res-val]");

    function syncResUi() {
        if (!state.settings) return;
        const isLock = state.settings.resMode === "lock";
        if (resAutoBtn) resAutoBtn.setAttribute("aria-pressed", String(!isLock));
        if (resLockBtn) resLockBtn.setAttribute("aria-pressed", String(isLock));
        const pct = Math.round((state.settings.lockedRes ?? 1) * 100);
        if (resSlider && document.activeElement !== resSlider) {
            resSlider.value = String(pct);
        }
        if (resVal) {
            resVal.textContent = isLock ? `Kunci ${pct}%` : "Auto";
        }
    }

    function syncHud() {
        slotBtns.forEach((btn, idx) => {
            const active = idx === state.selectedSlot;
            btn.classList.toggle("is-active", active);
            btn.setAttribute("aria-pressed", String(active));
        });
        const flyBtn = root.querySelector("[data-voxel-fly]");
        if (flyBtn) {
            flyBtn.setAttribute("aria-pressed", String(player.flyMode));
            flyBtn.textContent = player.flyMode ? "Mode: Fly" : "Mode: Walk";
        }
        const actBtn = root.querySelector("[data-voxel-action]");
        if (actBtn) {
            actBtn.setAttribute("aria-pressed", String(state.actionMode === "place"));
            actBtn.textContent = state.actionMode === "place" ? "Click: Place" : "Click: Break";
        }
        const cycleBtn = root.querySelector("[data-voxel-cycle]");
        if (cycleBtn) cycleBtn.setAttribute("aria-pressed", String(state.autoCycle));
        root.querySelectorAll("[data-voxel-time]").forEach((btn) => {
            const val = Number(btn.dataset.voxelTime);
            const active = !state.autoCycle && Math.abs(state.timeOfDay - val) < 0.05;
            btn.setAttribute("aria-pressed", String(active));
        });
        if (hourInput && hourVal) {
            const currentHour = timeOfDayToHour(state.timeOfDay);
            if (document.activeElement !== hourInput) hourInput.value = String(currentHour);
            hourVal.textContent = `Jam ${currentHour}`;
        }
        syncResUi();
    }

    const bindClick = (sel, fn) => {
        const el = root.querySelector(sel);
        if (el) el.addEventListener("click", fn);
    };
    bindClick("[data-voxel-lock]", () => {
        if (canvas.requestPointerLock) canvas.requestPointerLock();
    });
    bindClick("[data-voxel-fly]", () => {
        player.flyMode = !player.flyMode;
        syncHud();
    });
    bindClick("[data-voxel-action]", () => {
        state.actionMode = state.actionMode === "break" ? "place" : "break";
        syncHud();
    });
    bindClick("[data-voxel-cycle]", () => {
        state.autoCycle = !state.autoCycle;
        syncHud();
    });
    root.querySelectorAll("[data-voxel-time]").forEach((btn) => {
        btn.addEventListener("click", () => {
            state.autoCycle = false;
            state.timeOfDay = Number(btn.dataset.voxelTime);
            syncHud();
        });
    });

    const settingsPanel = root.querySelector("[data-voxel-settings]");
    const settingsToggle = root.querySelector("[data-voxel-settings-toggle]");
    if (settingsPanel && settingsToggle) {
        settingsToggle.addEventListener("click", () => {
            const open = settingsPanel.hidden;
            settingsPanel.hidden = !open;
            settingsToggle.setAttribute("aria-expanded", String(open));
        });
    }
    const bindRange = (sel, valSel, apply, format) => {
        const input = root.querySelector(sel);
        const label = root.querySelector(valSel);
        if (!input) return;
        const sync = () => {
            const value = Number(input.value);
            apply(value);
            if (label) label.textContent = format(value);
        };
        input.addEventListener("input", sync);
        sync();
    };
    bindRange("[data-voxel-sens]", "[data-voxel-sens-val]", (v) => {
        state.settings.sensitivity = v;
    }, (v) => v.toFixed(1));
    bindRange("[data-voxel-fov]", "[data-voxel-fov-val]", (v) => {
        state.settings.fov = v;
    }, (v) => String(Math.round(v)));
    bindRange("[data-voxel-dist]", "[data-voxel-dist-val]", (v) => {
        state.settings.viewRadius = v;
        if (hooks.onViewDistance) hooks.onViewDistance(v);
    }, (v) => `${Math.round(v)} Chunk (${Math.round(v) * 16}m)`);

    if (hourInput) {
        hourInput.addEventListener("input", () => {
            const h = Math.min(24, Math.max(1, Math.round(Number(hourInput.value))));
            state.autoCycle = false;
            state.timeOfDay = hourToTimeOfDay(h);
            syncHud();
        });
    }

    if (resAutoBtn) {
        resAutoBtn.addEventListener("click", () => {
            if (!state.settings) state.settings = {};
            state.settings.resMode = "auto";
            syncResUi();
            if (hooks.onResolutionChange) hooks.onResolutionChange();
        });
    }

    if (resLockBtn) {
        resLockBtn.addEventListener("click", () => {
            if (!state.settings) state.settings = {};
            state.settings.resMode = "lock";
            syncResUi();
            if (hooks.onResolutionChange) hooks.onResolutionChange();
        });
    }

    if (resSlider) {
        resSlider.addEventListener("input", () => {
            if (!state.settings) state.settings = {};
            state.settings.resMode = "lock";
            state.settings.lockedRes = Number(resSlider.value) / 100;
            syncResUi();
            if (hooks.onResolutionChange) hooks.onResolutionChange();
        });
    }

    const updateTelemetry = (columnCount) => {
        const setTxt = (sel, val) => {
            const el = root.querySelector(sel);
            if (el) el.textContent = val;
        };
        setTxt("[data-tel-fps]", `${state.fps} FPS`);
        setTxt("[data-tel-coords]", `${Math.floor(player.pos[0])}, ${Math.floor(player.pos[1])}, ${Math.floor(player.pos[2])}`);
        setTxt("[data-tel-chunks]", `${columnCount} cols`);
        setTxt("[data-tel-tris]", `${state.stats.triCount.toLocaleString("en-US")} tris`);
        setTxt("[data-tel-scale]", `${Math.round(state.renderScale * 100)}% res`);
        const gpuEl = root.querySelector("[data-tel-gpu]");
        if (gpuEl) {
            const gpuMs = state.stats.gpuMs;
            gpuEl.hidden = typeof gpuMs !== "number";
            if (typeof gpuMs === "number") gpuEl.textContent = `${gpuMs.toFixed(1)} ms GPU`;
        }
    };

    return { syncHud, updateTelemetry };
}
