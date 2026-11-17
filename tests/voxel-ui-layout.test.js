import { describe, it, expect, beforeEach } from "vitest";
import {
    STAT_ITEMS,
    UI_PRESETS,
    UI_STORAGE_KEY,
    createUiLayout,
    defaultUi,
    effectiveVisibility,
    loadUi,
    matchPreset,
    sanitizeUi,
    saveUi
} from "../src/lab/voxel/voxel-ui-layout.js";

function fakeStorage(initial = {}) {
    const data = { ...initial };
    return {
        data,
        getItem: (key) => (key in data ? data[key] : null),
        setItem: (key, value) => {
            data[key] = String(value);
        }
    };
}

const brokenStorage = {
    getItem: () => {
        throw new Error("denied");
    },
    setItem: () => {
        throw new Error("quota");
    }
};

function buildRoot() {
    document.body.innerHTML = `
        <main id="root">
            <div class="voxel-crosshair"></div>
            <h1 class="voxel-title">T</h1>
            <div data-voxel-stats>
                <span data-tel-fps></span><span data-tel-coords></span><span data-tel-chunks></span>
                <span data-tel-tris></span><span data-tel-scale></span><span data-tel-gpu hidden></span>
            </div>
            <nav data-voxel-hotbar></nav>
            <button data-voxel-ui-preset="clear"></button>
            <button data-voxel-ui-preset="bar"></button>
            <button data-voxel-ui-preset="stats"></button>
            <button data-voxel-ui-preset="full"></button>
            <button data-voxel-ui-toggle="stats"></button>
            <button data-voxel-ui-toggle="hotbar"></button>
            <button data-voxel-ui-toggle="title"></button>
            <button data-voxel-ui-toggle="crosshair"></button>
            <button data-voxel-ui-item="fps"></button>
            <button data-voxel-ui-item="gpu"></button>
            <button data-voxel-ui-hideall></button>
        </main>`;
    return document.getElementById("root");
}

const off = (root, selector) => root.querySelector(selector).classList.contains("voxel-ui-off");
const pressed = (root, selector) => root.querySelector(selector).getAttribute("aria-pressed");

describe("ui layout model", () => {
    it("shows everything by default", () => {
        const ui = defaultUi();
        expect(ui).toMatchObject({ stats: true, hotbar: true, title: true, crosshair: true, hideAll: false });
        expect(Object.keys(ui.items)).toEqual(STAT_ITEMS);
        expect(Object.values(ui.items).every(Boolean)).toBe(true);
    });

    it("sanitizes garbage input down to safe defaults", () => {
        for (const raw of [null, undefined, "text", 42, [], true]) {
            expect(sanitizeUi(raw)).toEqual(defaultUi());
        }
        const mixed = sanitizeUi({ stats: "no", hotbar: false, title: 0, crosshair: null, hideAll: true, items: { fps: false, gpu: "x", bogus: false }, extra: 1 });
        expect(mixed.hotbar).toBe(false);
        expect(mixed.stats).toBe(true);
        expect(mixed.title).toBe(true);
        expect(mixed.crosshair).toBe(true);
        expect(mixed.hideAll).toBe(false);
        expect(mixed.items.fps).toBe(false);
        expect(mixed.items.gpu).toBe(true);
        expect(mixed.items.bogus).toBeUndefined();
        expect(mixed.extra).toBeUndefined();
    });

    it("loads defaults when storage is missing, empty, corrupt, or throws", () => {
        expect(loadUi(null)).toEqual(defaultUi());
        expect(loadUi(fakeStorage())).toEqual(defaultUi());
        expect(loadUi(fakeStorage({ [UI_STORAGE_KEY]: "{not json" }))).toEqual(defaultUi());
        expect(loadUi(brokenStorage)).toEqual(defaultUi());
    });

    it("saves without the transient hide-all flag and round trips", () => {
        const storage = fakeStorage();
        const ui = defaultUi();
        ui.hotbar = false;
        ui.items.tris = false;
        ui.hideAll = true;
        expect(saveUi(storage, ui)).toBe(true);
        expect(JSON.parse(storage.data[UI_STORAGE_KEY]).hideAll).toBeUndefined();
        const loaded = loadUi(storage);
        expect(loaded.hotbar).toBe(false);
        expect(loaded.items.tris).toBe(false);
        expect(loaded.hideAll).toBe(false);
        expect(saveUi(null, ui)).toBe(false);
        expect(saveUi(brokenStorage, ui)).toBe(false);
    });

    it("derives effective visibility from groups, items, and hide-all", () => {
        const ui = defaultUi();
        ui.items.gpu = false;
        const visible = effectiveVisibility(ui);
        expect(visible.stats).toBe(true);
        expect(visible.items.fps).toBe(true);
        expect(visible.items.gpu).toBe(false);
        ui.stats = false;
        expect(Object.values(effectiveVisibility(ui).items).some(Boolean)).toBe(false);
        ui.stats = true;
        ui.hideAll = true;
        const hidden = effectiveVisibility(ui);
        expect([hidden.stats, hidden.hotbar, hidden.title, hidden.crosshair].some(Boolean)).toBe(false);
        expect(Object.values(hidden.items).some(Boolean)).toBe(false);
    });

    it("maps every stats and hotbar combination to exactly one preset", () => {
        for (const [name, preset] of Object.entries(UI_PRESETS)) {
            const ui = defaultUi();
            ui.stats = preset.stats;
            ui.hotbar = preset.hotbar;
            expect(matchPreset(ui)).toBe(name);
        }
        expect(Object.keys(UI_PRESETS)).toHaveLength(4);
    });
});

describe("ui layout DOM binding", () => {
    let root;
    beforeEach(() => {
        root = buildRoot();
    });

    it("starts fully visible and marks the full preset", () => {
        createUiLayout({ root, state: {}, storage: fakeStorage() });
        expect(off(root, "[data-voxel-stats]")).toBe(false);
        expect(off(root, "[data-voxel-hotbar]")).toBe(false);
        expect(pressed(root, '[data-voxel-ui-preset="full"]')).toBe("true");
        expect(pressed(root, '[data-voxel-ui-preset="clear"]')).toBe("false");
    });

    it("produces the four interface conditions from the presets", () => {
        createUiLayout({ root, state: {}, storage: fakeStorage() });
        const expectState = (preset, stats, hotbar) => {
            root.querySelector(`[data-voxel-ui-preset="${preset}"]`).click();
            expect(off(root, "[data-voxel-stats]"), preset).toBe(!stats);
            expect(off(root, "[data-voxel-hotbar]"), preset).toBe(!hotbar);
            expect(pressed(root, `[data-voxel-ui-preset="${preset}"]`)).toBe("true");
        };
        expectState("clear", false, false);
        expectState("bar", false, true);
        expectState("stats", true, false);
        expectState("full", true, true);
    });

    it("toggles groups and single statistics independently", () => {
        const state = {};
        createUiLayout({ root, state, storage: fakeStorage() });
        root.querySelector('[data-voxel-ui-toggle="hotbar"]').click();
        expect(off(root, "[data-voxel-hotbar]")).toBe(true);
        expect(pressed(root, '[data-voxel-ui-toggle="hotbar"]')).toBe("false");
        expect(pressed(root, '[data-voxel-ui-preset="stats"]')).toBe("true");
        root.querySelector('[data-voxel-ui-item="fps"]').click();
        expect(off(root, "[data-tel-fps]")).toBe(true);
        expect(off(root, "[data-tel-coords]")).toBe(false);
        root.querySelector('[data-voxel-ui-toggle="title"]').click();
        root.querySelector('[data-voxel-ui-toggle="crosshair"]').click();
        expect(off(root, ".voxel-title")).toBe(true);
        expect(off(root, ".voxel-crosshair")).toBe(true);
        root.querySelector('[data-voxel-ui-toggle="stats"]').click();
        expect(off(root, "[data-voxel-stats]")).toBe(true);
        expect(state.ui.stats).toBe(false);
    });

    it("keeps the gpu pill hidden attribute separate from layout visibility", () => {
        createUiLayout({ root, state: {}, storage: fakeStorage() });
        const gpu = root.querySelector("[data-tel-gpu]");
        expect(gpu.hidden).toBe(true);
        expect(gpu.classList.contains("voxel-ui-off")).toBe(false);
        root.querySelector('[data-voxel-ui-item="gpu"]').click();
        expect(gpu.hidden).toBe(true);
        expect(gpu.classList.contains("voxel-ui-off")).toBe(true);
    });

    it("hides everything with hide-all and restores the previous choices without saving it", () => {
        const storage = fakeStorage();
        const layout = createUiLayout({ root, state: {}, storage });
        root.querySelector('[data-voxel-ui-toggle="hotbar"]').click();
        const saved = storage.data[UI_STORAGE_KEY];
        root.querySelector("[data-voxel-ui-hideall]").click();
        for (const selector of ["[data-voxel-stats]", "[data-voxel-hotbar]", ".voxel-title", ".voxel-crosshair"]) {
            expect(off(root, selector), selector).toBe(true);
        }
        expect(layout.visibility().stats).toBe(false);
        expect(storage.data[UI_STORAGE_KEY]).toBe(saved);
        layout.toggleHideAll();
        expect(off(root, "[data-voxel-stats]")).toBe(false);
        expect(off(root, "[data-voxel-hotbar]")).toBe(true);
    });

    it("persists choices across instances and ignores unknown names", () => {
        const storage = fakeStorage();
        const first = createUiLayout({ root, state: {}, storage });
        first.setPreset("clear");
        first.toggleItem("tris");
        first.toggle("nonsense");
        first.setPreset("nonsense");
        first.toggleItem("nonsense");
        const rootAgain = buildRoot();
        const second = createUiLayout({ root: rootAgain, state: {}, storage });
        expect(second.visibility().stats).toBe(false);
        expect(second.visibility().hotbar).toBe(false);
        expect(off(rootAgain, "[data-voxel-stats]")).toBe(true);
        expect(second.visibility().items.tris).toBe(false);
    });

    it("keeps working when storage is unavailable", () => {
        const layout = createUiLayout({ root, state: {}, storage: brokenStorage });
        layout.setPreset("clear");
        expect(off(root, "[data-voxel-hotbar]")).toBe(true);
        const none = createUiLayout({ root: buildRoot(), state: {}, storage: null });
        none.toggle("stats");
        expect(none.visibility().stats).toBe(false);
    });
});
