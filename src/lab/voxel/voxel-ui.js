import { BLOCK_CATALOG, HOTBAR_ITEMS } from "./voxel-blocks.js";
import { drawHotbarBlockIcon } from "./voxel-textures.js";
import { createUiLayout, getSafeStorage } from "./voxel-ui-layout.js";

const SETTINGS_STORAGE_KEY = "voxel.settings.v1";

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

function clampNum(val, min, max, fallback) {
    const n = Number(val);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
}

function loadSettings(storage, target) {
    if (!storage) return;
    try {
        const text = storage.getItem(SETTINGS_STORAGE_KEY);
        if (!text) return;
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== "object") return;
        target.sensitivity = clampNum(parsed.sensitivity, 0.2, 3, target.sensitivity);
        target.fov = Math.round(clampNum(parsed.fov, 50, 120, target.fov));
        target.viewRadius = Math.round(clampNum(parsed.viewRadius, 3, 16, target.viewRadius));
        if (parsed.resMode === "auto" || parsed.resMode === "lock") target.resMode = parsed.resMode;
        target.lockedRes = clampNum(parsed.lockedRes, 0.5, 1, target.lockedRes);
        if (typeof parsed.muted === "boolean") target.muted = parsed.muted;
    } catch {
        return;
    }
}

function saveSettings(storage, settings) {
    if (!storage) return;
    try {
        storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
        return;
    }
}

export function createVoxelHud(root, atlas, state, player, canvas, hooks = {}) {
    const storage = hooks.storage !== undefined ? hooks.storage : getSafeStorage();
    if (!Array.isArray(state.hotbar)) {
        state.hotbar = HOTBAR_ITEMS.map((item) => ({ ...item }));
    }
    loadSettings(storage, state.settings);

    const cleanups = [];
    const listen = (el, type, fn) => {
        if (!el) return;
        el.addEventListener(type, fn);
        cleanups.push(() => el.removeEventListener(type, fn));
    };

    const hotbarEl = root.querySelector("[data-voxel-hotbar]");
    const slotBtns = [];

    const renderHotbarSlot = (idx) => {
        const btn = slotBtns[idx];
        const item = state.hotbar[idx];
        if (!btn || !item) return;
        btn.setAttribute("aria-label", `${item.label} (${idx + 1})`);
        const icon = btn.querySelector("canvas");
        if (icon) drawHotbarBlockIcon(icon, atlas, item.tex);
        const lbl = btn.querySelector(".voxel-slot-name");
        if (lbl) lbl.textContent = item.label;
    };

    if (hotbarEl) {
        hotbarEl.innerHTML = "";
        state.hotbar.forEach((item, idx) => {
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
            listen(btn, "click", () => {
                state.selectedSlot = idx;
                syncHud();
            });
            hotbarEl.appendChild(btn);
            slotBtns.push(btn);
        });
    }

    const catalogEl = root.querySelector("[data-voxel-catalog]");
    const catalogGrid = root.querySelector("[data-voxel-catalog-grid]");
    const catalogClose = root.querySelector("[data-voxel-catalog-close]");
    const settingsPanel = root.querySelector("[data-voxel-settings]");
    const settingsToggle = root.querySelector("[data-voxel-settings-toggle]");

    const setCatalogOpen = (open) => {
        state.catalogOpen = Boolean(open);
        if (catalogEl) catalogEl.hidden = !state.catalogOpen;
        if (state.catalogOpen && document.pointerLockElement && document.exitPointerLock) {
            document.exitPointerLock();
        }
    };

    const setSettingsOpen = (open) => {
        if (!settingsPanel || !settingsToggle) return;
        settingsPanel.hidden = !open;
        settingsToggle.setAttribute("aria-expanded", String(open));
    };

    if (catalogGrid) {
        catalogGrid.innerHTML = "";
        for (const item of BLOCK_CATALOG) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "voxel-catalog-item";
            btn.dataset.blockId = String(item.id);
            btn.setAttribute("aria-label", item.label);
            const icon = document.createElement("canvas");
            icon.width = 32;
            icon.height = 32;
            drawHotbarBlockIcon(icon, atlas, item.tex);
            const name = document.createElement("span");
            name.textContent = item.label;
            btn.append(icon, name);
            listen(btn, "click", () => {
                state.hotbar[state.selectedSlot] = { ...item };
                renderHotbarSlot(state.selectedSlot);
                setCatalogOpen(false);
                syncHud();
            });
            catalogGrid.appendChild(btn);
        }
    }

    listen(catalogClose, "click", () => setCatalogOpen(false));
    listen(catalogEl, "click", (e) => {
        if (e.target === catalogEl) setCatalogOpen(false);
    });

    const hourInput = root.querySelector("[data-voxel-hour]");
    const hourVal = root.querySelector("[data-voxel-hour-val]");
    const resAutoBtn = root.querySelector("[data-voxel-res-auto]");
    const resLockBtn = root.querySelector("[data-voxel-res-lock]");
    const resSlider = root.querySelector("[data-voxel-res-slider]");
    const resVal = root.querySelector("[data-voxel-res-val]");
    const audioBtn = root.querySelector("[data-voxel-audio]");

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
            resVal.textContent = isLock ? `Lock ${pct}%` : "Auto";
        }
    }

    function syncHourUi() {
        if (!hourInput || !hourVal) return;
        const currentHour = timeOfDayToHour(state.timeOfDay);
        if (document.activeElement !== hourInput) hourInput.value = String(currentHour);
        hourVal.textContent = `Hour ${currentHour}`;
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
        syncHourUi();
        root.querySelectorAll("[data-voxel-rain]").forEach((btn) => {
            btn.setAttribute("aria-pressed", String(Boolean(state.rain)));
        });
        if (audioBtn) {
            const muted = Boolean(state.settings && state.settings.muted);
            audioBtn.setAttribute("aria-pressed", String(!muted));
            audioBtn.textContent = muted ? "Audio: Off" : "Audio: On";
        }
        syncResUi();
        if (hooks.onHotbarChange) hooks.onHotbarChange();
    }

    const bindClick = (sel, fn) => listen(root.querySelector(sel), "click", fn);

    bindClick("[data-voxel-lock]", () => {
        if (canvas.requestPointerLock) {
            try {
                const promise = canvas.requestPointerLock();
                if (promise && typeof promise.catch === "function") promise.catch(() => {});
            } catch {
                return;
            }
        }
    });
    bindClick("[data-voxel-fly]", () => {
        player.flyMode = !player.flyMode;
        if (hooks.onToggleFly) hooks.onToggleFly(player.flyMode);
        syncHud();
    });
    bindClick("[data-voxel-action]", () => {
        state.actionMode = state.actionMode === "break" ? "place" : "break";
        syncHud();
    });
    bindClick("[data-voxel-cycle]", () => {
        state.autoCycle = !state.autoCycle;
        if (hooks.onEnvChange) hooks.onEnvChange();
        syncHud();
    });
    bindClick("[data-voxel-catalog-open]", () => {
        setSettingsOpen(false);
        setCatalogOpen(true);
    });
    bindClick("[data-voxel-lan-open]", () => {
        setSettingsOpen(false);
        if (hooks.onOpenLan) hooks.onOpenLan();
    });
    bindClick("[data-voxel-audio]", () => {
        state.settings.muted = !state.settings.muted;
        saveSettings(storage, state.settings);
        if (hooks.onAudioToggle) hooks.onAudioToggle(state.settings.muted);
        syncHud();
    });
    bindClick("[data-voxel-reset-world]", () => {
        if (hooks.onResetWorld) hooks.onResetWorld();
    });

    root.querySelectorAll("[data-voxel-time]").forEach((btn) => {
        listen(btn, "click", () => {
            state.autoCycle = false;
            state.timeOfDay = Number(btn.dataset.voxelTime);
            if (hooks.onEnvChange) hooks.onEnvChange();
            syncHud();
        });
    });
    root.querySelectorAll("[data-voxel-rain]").forEach((btn) => {
        listen(btn, "click", () => {
            state.rain = !state.rain;
            if (hooks.onEnvChange) hooks.onEnvChange();
            syncHud();
        });
    });

    if (settingsPanel && settingsToggle) {
        listen(settingsToggle, "click", () => {
            setSettingsOpen(settingsPanel.hidden);
        });
    }

    const bindRange = (sel, valSel, initialVal, min, max, apply, format) => {
        const input = root.querySelector(sel);
        const label = root.querySelector(valSel);
        if (!input) return;
        input.value = String(initialVal);
        const sync = (persist) => {
            const value = clampNum(input.value, min, max, initialVal);
            apply(value);
            if (label) label.textContent = format(value);
            if (persist) saveSettings(storage, state.settings);
        };
        listen(input, "input", () => sync(true));
        sync(false);
    };

    bindRange(
        "[data-voxel-sens]",
        "[data-voxel-sens-val]",
        state.settings.sensitivity,
        0.2,
        3,
        (v) => { state.settings.sensitivity = v; },
        (v) => v.toFixed(1)
    );
    bindRange(
        "[data-voxel-fov]",
        "[data-voxel-fov-val]",
        state.settings.fov,
        50,
        120,
        (v) => { state.settings.fov = v; },
        (v) => String(Math.round(v))
    );
    bindRange(
        "[data-voxel-dist]",
        "[data-voxel-dist-val]",
        state.settings.viewRadius,
        3,
        16,
        (v) => {
            state.settings.viewRadius = Math.round(v);
            if (hooks.onViewDistance) hooks.onViewDistance(Math.round(v));
        },
        (v) => `${Math.round(v)} Chunks (${Math.round(v) * 16}m)`
    );

    if (hourInput) {
        listen(hourInput, "input", () => {
            const h = Math.round(clampNum(hourInput.value, 1, 24, 9));
            state.autoCycle = false;
            state.timeOfDay = hourToTimeOfDay(h);
            if (hooks.onEnvChange) hooks.onEnvChange();
            syncHud();
        });
    }

    listen(resAutoBtn, "click", () => {
        state.settings.resMode = "auto";
        saveSettings(storage, state.settings);
        syncResUi();
        if (hooks.onResolutionChange) hooks.onResolutionChange();
    });

    listen(resLockBtn, "click", () => {
        state.settings.resMode = "lock";
        saveSettings(storage, state.settings);
        syncResUi();
        if (hooks.onResolutionChange) hooks.onResolutionChange();
    });

    listen(resSlider, "input", () => {
        state.settings.resMode = "lock";
        state.settings.lockedRes = clampNum(resSlider.value, 50, 100, 100) / 100;
        saveSettings(storage, state.settings);
        syncResUi();
        if (hooks.onResolutionChange) hooks.onResolutionChange();
    });

    const layout = createUiLayout({ root, state, storage });

    const updateTelemetry = (columnCount) => {
        if (state.autoCycle) syncHourUi();
        if (!layout.visibility().stats) return;
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

    const closeOverlays = () => {
        let closed = false;
        if (hooks.onCloseExtraOverlays && hooks.onCloseExtraOverlays()) {
            closed = true;
        }
        if (state.catalogOpen) {
            setCatalogOpen(false);
            closed = true;
        }
        if (settingsPanel && !settingsPanel.hidden) {
            setSettingsOpen(false);
            closed = true;
        }
        return closed;
    };

    const destroy = () => {
        for (const fn of cleanups) fn();
        cleanups.length = 0;
        layout.destroy();
    };

    return {
        syncHud,
        updateTelemetry,
        renderHotbarSlot,
        setCatalogOpen,
        toggleCatalog: () => setCatalogOpen(!state.catalogOpen),
        closeOverlays,
        layout,
        destroy
    };
}
