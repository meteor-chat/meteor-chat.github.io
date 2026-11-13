import { HOTBAR_ITEMS } from "./voxel-blocks.js";
import { drawHotbarBlockIcon } from "./voxel-textures.js";

export function createVoxelHud(root, atlas, state, player, canvas) {
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
