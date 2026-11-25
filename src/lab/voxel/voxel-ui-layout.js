export const UI_STORAGE_KEY = "voxel.ui.v1";
export const UI_GROUPS = ["stats", "hotbar", "title", "crosshair"];
export const STAT_ITEMS = ["fps", "coords", "chunks", "tris", "scale", "gpu"];

export const UI_PRESETS = Object.freeze({
    clear: { stats: false, hotbar: false },
    bar: { stats: false, hotbar: true },
    stats: { stats: true, hotbar: false },
    full: { stats: true, hotbar: true }
});

const GROUP_SELECTORS = {
    stats: "[data-voxel-stats]",
    hotbar: "[data-voxel-hotbar]",
    title: ".voxel-title",
    crosshair: ".voxel-crosshair"
};

const HIDDEN_CLASS = "voxel-ui-off";

export function defaultUi() {
    const items = {};
    for (const key of STAT_ITEMS) items[key] = true;
    return { stats: true, hotbar: true, title: true, crosshair: true, hideAll: false, items };
}

export function sanitizeUi(raw) {
    const ui = defaultUi();
    if (!raw || typeof raw !== "object") return ui;
    for (const group of UI_GROUPS) {
        if (typeof raw[group] === "boolean") ui[group] = raw[group];
    }
    if (raw.items && typeof raw.items === "object") {
        for (const key of STAT_ITEMS) {
            if (typeof raw.items[key] === "boolean") ui.items[key] = raw.items[key];
        }
    }
    return ui;
}

export function getSafeStorage() {
    try {
        return window.localStorage || null;
    } catch {
        return null;
    }
}

export function loadUi(storage) {
    if (!storage) return defaultUi();
    try {
        const text = storage.getItem(UI_STORAGE_KEY);
        return text ? sanitizeUi(JSON.parse(text)) : defaultUi();
    } catch {
        return defaultUi();
    }
}

export function saveUi(storage, ui) {
    if (!storage) return false;
    const persisted = { ...ui };
    delete persisted.hideAll;
    try {
        storage.setItem(UI_STORAGE_KEY, JSON.stringify(persisted));
        return true;
    } catch {
        return false;
    }
}

export function effectiveVisibility(ui) {
    const items = {};
    for (const key of STAT_ITEMS) items[key] = !ui.hideAll && ui.stats && ui.items[key];
    return {
        stats: !ui.hideAll && ui.stats,
        hotbar: !ui.hideAll && ui.hotbar,
        title: !ui.hideAll && ui.title,
        crosshair: !ui.hideAll && ui.crosshair,
        items
    };
}

export function matchPreset(ui) {
    for (const [name, preset] of Object.entries(UI_PRESETS)) {
        if (ui.stats === preset.stats && ui.hotbar === preset.hotbar) return name;
    }
    return null;
}

export function createUiLayout({ root, state, storage = getSafeStorage() }) {
    state.ui = loadUi(storage);
    const ui = state.ui;
    const cleanups = [];

    const listen = (el, type, fn) => {
        if (!el) return;
        el.addEventListener(type, fn);
        cleanups.push(() => el.removeEventListener(type, fn));
    };

    const setHidden = (el, hidden) => {
        if (el) el.classList.toggle(HIDDEN_CLASS, hidden);
    };
    const setPressed = (el, pressed) => {
        if (el) el.setAttribute("aria-pressed", String(pressed));
    };

    const apply = () => {
        const visible = effectiveVisibility(ui);
        for (const group of UI_GROUPS) {
            setHidden(root.querySelector(GROUP_SELECTORS[group]), !visible[group]);
            setPressed(root.querySelector(`[data-voxel-ui-toggle="${group}"]`), ui[group]);
        }
        for (const key of STAT_ITEMS) {
            setHidden(root.querySelector(`[data-tel-${key}]`), !visible.items[key]);
            setPressed(root.querySelector(`[data-voxel-ui-item="${key}"]`), ui.items[key]);
        }
        const active = matchPreset(ui);
        root.querySelectorAll("[data-voxel-ui-preset]").forEach((btn) => {
            setPressed(btn, btn.dataset.voxelUiPreset === active);
        });
        setPressed(root.querySelector("[data-voxel-ui-hideall]"), ui.hideAll);
    };

    const commit = () => {
        saveUi(storage, ui);
        apply();
    };

    const toggle = (group) => {
        if (!UI_GROUPS.includes(group)) return;
        ui[group] = !ui[group];
        commit();
    };

    const toggleItem = (key) => {
        if (!STAT_ITEMS.includes(key)) return;
        ui.items[key] = !ui.items[key];
        commit();
    };

    const setPreset = (name) => {
        const preset = UI_PRESETS[name];
        if (!preset) return;
        ui.stats = preset.stats;
        ui.hotbar = preset.hotbar;
        commit();
    };

    const toggleHideAll = () => {
        ui.hideAll = !ui.hideAll;
        apply();
    };

    root.querySelectorAll("[data-voxel-ui-toggle]").forEach((btn) => {
        listen(btn, "click", () => toggle(btn.dataset.voxelUiToggle));
    });
    root.querySelectorAll("[data-voxel-ui-item]").forEach((btn) => {
        listen(btn, "click", () => toggleItem(btn.dataset.voxelUiItem));
    });
    root.querySelectorAll("[data-voxel-ui-preset]").forEach((btn) => {
        listen(btn, "click", () => setPreset(btn.dataset.voxelUiPreset));
    });
    listen(root.querySelector("[data-voxel-ui-hideall]"), "click", toggleHideAll);

    apply();

    const destroy = () => {
        for (const fn of cleanups) fn();
        cleanups.length = 0;
    };

    return { apply, toggle, toggleItem, setPreset, toggleHideAll, visibility: () => effectiveVisibility(ui), destroy };
}
