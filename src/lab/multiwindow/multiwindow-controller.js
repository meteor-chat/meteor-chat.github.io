import { createWindowManager } from "./window-manager.js";
import { getProceduralTime } from "./multiwindow-math.js";
import { createMultiwindowRenderer } from "./multiwindow-renderer.js";

export function createMultiwindowApp(root = document.body) {
    const canvas = root.querySelector("canvas[data-multiwindow-canvas]") || root.querySelector("canvas");
    if (!canvas) return null;

    const state = {
        geometryType: "wormhole",
        showBeams: true,
        showParticles: true,
        theme: "staal",
        running: true
    };

    const renderer = createMultiwindowRenderer(canvas);

    const idEl = root.querySelector("[data-multiwindow-id]");
    const countEl = root.querySelector("[data-multiwindow-count]");
    const coordsEl = root.querySelector("[data-multiwindow-coords]");
    const geoBtns = root.querySelectorAll("[data-multiwindow-geo]");
    const beamBtn = root.querySelector("[data-multiwindow-beam]");
    const partBtn = root.querySelector("[data-multiwindow-particle]");
    const themeBtn = root.querySelector("[data-multiwindow-theme]");
    const openBtn = root.querySelector("[data-multiwindow-open]");
    const resetBtn = root.querySelector("[data-multiwindow-reset]");

    const syncHud = (windows, shape) => {
        if (idEl) idEl.textContent = String(manager.getThisWindowId());
        if (countEl) countEl.textContent = String(windows.length);
        if (coordsEl) coordsEl.textContent = `X: ${Math.round(shape.x)}, Y: ${Math.round(shape.y)}`;
        if (beamBtn) beamBtn.setAttribute("aria-pressed", String(state.showBeams));
        if (partBtn) partBtn.setAttribute("aria-pressed", String(state.showParticles));
        geoBtns.forEach((btn) => {
            const match = btn.getAttribute("data-multiwindow-geo") === state.geometryType;
            btn.setAttribute("aria-pressed", String(match));
        });
    };

    let lastMetaAt = 0;
    const manager = createWindowManager({
        metaData: {
            geometryType: state.geometryType,
            theme: state.theme,
            showBeams: state.showBeams,
            showParticles: state.showParticles,
            metaUpdatedAt: 0
        },
        onWindowsChange: (windows) => {
            let bestMeta = null;
            for (const w of windows) {
                const m = w && w.metaData;
                if (m && (m.metaUpdatedAt || 0) > lastMetaAt) {
                    if (!bestMeta || m.metaUpdatedAt > bestMeta.metaUpdatedAt) {
                        bestMeta = m;
                    }
                }
            }
            if (bestMeta) {
                lastMetaAt = bestMeta.metaUpdatedAt;
                if (bestMeta.geometryType) state.geometryType = bestMeta.geometryType;
                if (bestMeta.theme) state.theme = bestMeta.theme;
                if (typeof bestMeta.showBeams === "boolean") state.showBeams = bestMeta.showBeams;
                if (typeof bestMeta.showParticles === "boolean") state.showParticles = bestMeta.showParticles;
                manager.setMetaData(bestMeta, true);
            }
            syncHud(windows, manager.getShape());
        },
        onShapeChange: (shape) => {
            syncHud(manager.getWindows(), shape);
        }
    });

    manager.init({
        geometryType: state.geometryType,
        theme: state.theme,
        showBeams: state.showBeams,
        showParticles: state.showParticles
    });

    let lastW = 0;
    let lastH = 0;
    let lastDpr = 0;
    const handleResize = () => {
        if (!canvas || typeof window === "undefined") return;
        const w = window.innerWidth || 800;
        const h = window.innerHeight || 600;
        const dpr = window.devicePixelRatio || 1;
        if (w === lastW && h === lastH && dpr === lastDpr) return;
        lastW = w;
        lastH = h;
        lastDpr = dpr;
        renderer.resize(w, h, dpr);
    };

    if (typeof window !== "undefined") {
        window.addEventListener("resize", handleResize);
        handleResize();
    }

    if (openBtn) {
        openBtn.addEventListener("click", () => {
            const cur = manager.getShape();
            const nextX = cur.x + 80;
            const nextY = cur.y + 80;
            const w = Math.min(540, cur.w);
            const h = Math.min(540, cur.h);
            const features = `width=${w},height=${h},left=${nextX},top=${nextY},resizable=yes,scrollbars=no`;
            const href = window.location.pathname.includes("multiwindow") ? window.location.href : "/multiwindow";
            window.open(href, "_blank", features);
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            manager.clearAll();
            syncHud(manager.getWindows(), manager.getShape());
        });
    }

    geoBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            const geo = btn.getAttribute("data-multiwindow-geo");
            if (geo) {
                state.geometryType = geo;
                manager.setMetaData({ geometryType: geo });
                syncHud(manager.getWindows(), manager.getShape());
            }
        });
    });

    if (beamBtn) {
        beamBtn.addEventListener("click", () => {
            state.showBeams = !state.showBeams;
            manager.setMetaData({ showBeams: state.showBeams });
            syncHud(manager.getWindows(), manager.getShape());
        });
    }

    if (partBtn) {
        partBtn.addEventListener("click", () => {
            state.showParticles = !state.showParticles;
            manager.setMetaData({ showParticles: state.showParticles });
            syncHud(manager.getWindows(), manager.getShape());
        });
    }

    if (themeBtn) {
        themeBtn.addEventListener("click", () => {
            const themes = ["staal", "cyberpunk", "solar", "emerald"];
            const nextIdx = (themes.indexOf(state.theme) + 1) % themes.length;
            state.theme = themes[nextIdx];
            manager.setMetaData({ theme: state.theme });
            syncHud(manager.getWindows(), manager.getShape());
        });
    }

    let rafId = 0;
    const tick = () => {
        if (!state.running) return;
        handleResize();
        const time = getProceduralTime();
        const { sceneOffset } = manager.update(false);
        const windows = manager.getWindows();

        renderer.render(windows, sceneOffset, state, time);
        syncHud(windows, manager.getShape());

        if (typeof requestAnimationFrame !== "undefined") {
            rafId = requestAnimationFrame(tick);
        }
    };

    tick();

    const destroy = () => {
        state.running = false;
        if (rafId && typeof cancelAnimationFrame !== "undefined") {
            cancelAnimationFrame(rafId);
        }
        if (typeof window !== "undefined") {
            window.removeEventListener("resize", handleResize);
        }
        manager.destroy();
        renderer.destroy();
    };

    return {
        manager,
        renderer,
        state,
        syncHud,
        destroy
    };
}
