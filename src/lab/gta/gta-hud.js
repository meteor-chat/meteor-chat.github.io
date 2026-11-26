import { X_ROADS, Z_ROADS } from "./gta-road-graph.js";

export function projectRadarPoint(wx, wz, px, pz, headingYaw, scale = 0.65, halfW = 107, halfH = 71) {
    const dx = wx - px;
    const dz = wz - pz;
    const c = Math.cos(headingYaw);
    const s = Math.sin(headingYaw);
    const rx = -(dx * c - dz * s);
    const ry = -(dx * s + dz * c);
    return {
        sx: halfW + rx * scale,
        sy: halfH + ry * scale
    };
}

export function formatCash(amount) {
    return `$${Math.max(0, Math.round(amount)).toLocaleString("en-US")}`;
}

export function createGtaHud(root, callbacks = {}) {
    const q = (sel) => root.querySelector(sel);
    const els = {
        loader: q("[data-gta-loader]"),
        loaderText: q("[data-gta-loader-text]"),
        loaderFill: q("[data-gta-loader-fill]"),
        fallback: q("[data-gta-fallback]"),
        lost: q("[data-gta-context-lost]"),
        stats: q("[data-gta-stats]"),
        fps: q("[data-gta-fps]"),
        mode: q("[data-gta-mode]"),
        draws: q("[data-gta-draws]"),
        scale: q("[data-gta-scale]"),
        gpu: q("[data-gta-gpu]"),
        wanted: q("[data-gta-wanted]"),
        stars: Array.from(root.querySelectorAll("[data-gta-star]")),
        cash: q("[data-gta-cash]"),
        settingsToggle: q("[data-gta-settings-toggle]"),
        settings: q("[data-gta-settings]"),
        radarFrame: q("[data-gta-radar-frame]"),
        radar: q("[data-gta-radar]"),
        gpsDist: q("[data-gta-gps-dist]"),
        hp: q("[data-gta-hp]"),
        armor: q("[data-gta-armor]"),
        nitro: q("[data-gta-nitro]"),
        prompt: q("[data-gta-prompt]"),
        speedo: q("[data-gta-speedo]"),
        mph: q("[data-gta-mph]"),
        gear: q("[data-gta-gear]"),
        district: q("[data-gta-district]"),
        street: q("[data-gta-street]"),
        toast: q("[data-gta-toast]"),
        radioBtn: q("[data-gta-radio]"),
        audioBtn: q("[data-gta-audio]"),
        statsBtn: q("[data-gta-stats-toggle]")
    };

    const radarCtx = els.radar ? els.radar.getContext("2d") : null;
    let toastTimer = 0;
    let hudHidden = false;
    let statsVisible = true;

    const showToast = (msg, sec = 2.4) => {
        if (!els.toast) return;
        els.toast.textContent = msg;
        els.toast.hidden = false;
        toastTimer = sec;
    };

    const setLoader = (text, pct, done = false) => {
        if (els.loaderText && text) els.loaderText.textContent = text;
        if (els.loaderFill && pct !== undefined) els.loaderFill.style.width = `${Math.max(5, Math.min(100, pct))}%`;
        if (els.loader && done) els.loader.hidden = true;
    };

    const toggleSettings = (force) => {
        if (!els.settings || !els.settingsToggle) return;
        const open = force !== undefined ? force : els.settings.hidden;
        els.settings.hidden = !open;
        els.settingsToggle.setAttribute("aria-expanded", String(open));
    };

    const setActiveGroup = (attr, val) => {
        for (const btn of root.querySelectorAll(`[${attr}]`)) {
            btn.setAttribute("aria-pressed", String(btn.getAttribute(attr) === String(val)));
        }
    };

    const listeners = [];
    const bind = (el, ev, fn) => {
        if (!el) return;
        el.addEventListener(ev, fn);
        listeners.push([el, ev, fn]);
    };

    bind(els.settingsToggle, "click", () => toggleSettings());

    for (const btn of root.querySelectorAll("[data-gta-time]")) {
        bind(btn, "click", () => {
            const v = btn.getAttribute("data-gta-time");
            setActiveGroup("data-gta-time", v);
            if (callbacks.onTime) callbacks.onTime(v);
        });
    }
    for (const btn of root.querySelectorAll("[data-gta-weather]")) {
        bind(btn, "click", () => {
            const v = btn.getAttribute("data-gta-weather");
            setActiveGroup("data-gta-weather", v);
            if (callbacks.onWeather) callbacks.onWeather(v);
        });
    }
    for (const btn of root.querySelectorAll("[data-gta-gps]")) {
        bind(btn, "click", () => {
            const v = btn.getAttribute("data-gta-gps");
            setActiveGroup("data-gta-gps", v);
            if (callbacks.onGps) callbacks.onGps(v);
        });
    }
    for (const btn of root.querySelectorAll("[data-gta-spawn]")) {
        bind(btn, "click", () => {
            if (callbacks.onSpawnCar) callbacks.onSpawnCar(btn.getAttribute("data-gta-spawn"));
            toggleSettings(false);
        });
    }
    for (const btn of root.querySelectorAll("[data-gta-wanted-set]")) {
        bind(btn, "click", () => {
            if (callbacks.onWantedSet) callbacks.onWantedSet(Number(btn.getAttribute("data-gta-wanted-set")));
        });
    }
    bind(q("[data-gta-cam-cycle]"), "click", () => {
        if (callbacks.onCamCycle) callbacks.onCamCycle();
    });
    bind(els.radioBtn, "click", () => {
        if (callbacks.onRadioToggle) callbacks.onRadioToggle();
    });
    bind(els.audioBtn, "click", () => {
        if (callbacks.onAudioToggle) callbacks.onAudioToggle();
    });
    bind(els.statsBtn, "click", () => {
        statsVisible = !statsVisible;
        if (els.stats) els.stats.hidden = !statsVisible;
        if (els.statsBtn) els.statsBtn.setAttribute("aria-pressed", String(statsVisible));
    });
    bind(q("[data-gta-reset]"), "click", () => {
        if (callbacks.onReset) callbacks.onReset();
        toggleSettings(false);
    });

    const toggleHudHidden = () => {
        hudHidden = !hudHidden;
        root.classList.toggle("gta-hud-hidden", hudHidden);
    };

    const toggleStats = () => {
        statsVisible = !statsVisible;
        if (els.stats) els.stats.hidden = !statsVisible;
        if (els.statsBtn) els.statsBtn.setAttribute("aria-pressed", String(statsVisible));
    };

    const drawRadar = (snap) => {
        if (!radarCtx || !els.radar) return;
        const w = els.radar.width;
        const h = els.radar.height;
        const hw = w * 0.5;
        const hh = h * 0.5;
        const scale = 0.58;
        const px = snap.px;
        const pz = snap.pz;
        const yaw = snap.headingYaw;

        radarCtx.fillStyle = "#18202c";
        radarCtx.fillRect(0, 0, w, h);

        radarCtx.save();
        radarCtx.translate(hw, hh);
        radarCtx.rotate(yaw);

        const toLocal = (wx, wz) => [-(wx - px) * scale, -(wz - pz) * scale];

        const [ox0, oz0] = toLocal(-420, 286);
        const [ox1, oz1] = toLocal(420, 480);
        radarCtx.fillStyle = "#123f63";
        radarCtx.fillRect(Math.min(ox0, ox1), Math.min(oz0, oz1), Math.abs(ox1 - ox0), Math.abs(oz1 - oz0));

        const [hx0, hz0] = toLocal(-420, -400);
        const [hx1, hz1] = toLocal(420, -278);
        radarCtx.fillStyle = "#223326";
        radarCtx.fillRect(Math.min(hx0, hx1), Math.min(hz0, hz1), Math.abs(hx1 - hx0), Math.abs(hz1 - hz0));

        radarCtx.strokeStyle = "#4b5563";
        radarCtx.lineWidth = 9.5;
        radarCtx.lineCap = "square";
        for (const rz of Z_ROADS) {
            const [ax, ay] = toLocal(-278, rz);
            const [bx, by] = toLocal(278, rz);
            radarCtx.beginPath();
            radarCtx.moveTo(ax, ay);
            radarCtx.lineTo(bx, by);
            radarCtx.stroke();
        }
        for (const rx of X_ROADS) {
            const [ax, ay] = toLocal(rx, -278);
            const [bx, by] = toLocal(rx, 278);
            radarCtx.beginPath();
            radarCtx.moveTo(ax, ay);
            radarCtx.lineTo(bx, by);
            radarCtx.stroke();
        }

        const [dx0, dy0] = toLocal(0, -304);
        const [dx1, dy1] = toLocal(0, -270);
        radarCtx.beginPath();
        radarCtx.moveTo(dx0, dy0);
        radarCtx.lineTo(dx1, dy1);
        radarCtx.stroke();

        if (snap.gpsPoints && snap.gpsPoints.length > 1) {
            radarCtx.strokeStyle = "#facc15";
            radarCtx.lineWidth = 3.2;
            radarCtx.beginPath();
            for (let i = 0; i < snap.gpsPoints.length; i += 1) {
                const [gx, gy] = toLocal(snap.gpsPoints[i].x, snap.gpsPoints[i].z);
                if (i === 0) radarCtx.moveTo(gx, gy);
                else radarCtx.lineTo(gx, gy);
            }
            radarCtx.stroke();
            const last = snap.gpsPoints[snap.gpsPoints.length - 1];
            const [tx, ty] = toLocal(last.x, last.z);
            radarCtx.fillStyle = "#fde047";
            radarCtx.beginPath();
            radarCtx.arc(tx, ty, 4.5, 0, Math.PI * 2);
            radarCtx.fill();
        }

        if (snap.parkedCars) {
            radarCtx.fillStyle = "#38bdf8";
            for (const c of snap.parkedCars) {
                const [cx, cy] = toLocal(c.x, c.z);
                radarCtx.fillRect(cx - 2.5, cy - 2.5, 5, 5);
            }
        }

        if (snap.civCars) {
            radarCtx.fillStyle = "rgba(226, 232, 240, 0.55)";
            for (const c of snap.civCars) {
                const [cx, cy] = toLocal(c.pos.x, c.pos.z);
                radarCtx.fillRect(cx - 1.8, cy - 1.8, 3.6, 3.6);
            }
        }

        if (snap.policeUnits && snap.policeUnits.length > 0) {
            const redFlash = Math.floor(snap.timeSec * 6) % 2 === 0;
            for (const u of snap.policeUnits) {
                const [ux, uy] = toLocal(u.pos.x, u.pos.z);
                radarCtx.fillStyle = redFlash ? "#ef4444" : "#3b82f6";
                radarCtx.beginPath();
                radarCtx.arc(ux, uy, 3.8, 0, Math.PI * 2);
                radarCtx.fill();
            }
        }

        radarCtx.restore();

        if (snap.wantedStars > 0) {
            const flashRed = Math.floor(snap.timeSec * 5) % 2 === 0;
            radarCtx.fillStyle = flashRed ? "rgba(239, 68, 68, 0.16)" : "rgba(59, 130, 246, 0.16)";
            radarCtx.fillRect(0, 0, w, h);
        }

        radarCtx.fillStyle = "#ffffff";
        radarCtx.strokeStyle = "#0f172a";
        radarCtx.lineWidth = 1.6;
        radarCtx.beginPath();
        radarCtx.moveTo(hw, hh - 7);
        radarCtx.lineTo(hw + 5.5, hh + 6);
        radarCtx.lineTo(hw, hh + 3);
        radarCtx.lineTo(hw - 5.5, hh + 6);
        radarCtx.closePath();
        radarCtx.fill();
        radarCtx.stroke();
    };

    const sync = (dt, snap) => {
        if (toastTimer > 0) {
            toastTimer -= dt;
            if (toastTimer <= 0 && els.toast) els.toast.hidden = true;
        }
        if (els.fps) els.fps.textContent = `${snap.fps} FPS`;
        if (els.mode) els.mode.textContent = snap.isDriving ? snap.vehicleName.toUpperCase() : "ON FOOT";
        if (els.draws) els.draws.textContent = `${snap.drawCalls} draws`;
        if (els.scale) els.scale.textContent = `${Math.round(snap.scale * 100)}% res`;
        if (els.cash) els.cash.textContent = formatCash(snap.cash);
        if (els.district) els.district.textContent = snap.district;
        if (els.street) els.street.textContent = snap.street;
        if (els.hp) els.hp.style.width = `${Math.max(0, Math.min(100, snap.hp))}%`;
        if (els.armor) els.armor.style.width = `${Math.max(0, Math.min(100, snap.armor))}%`;
        if (els.nitro) els.nitro.style.width = `${Math.max(0, Math.min(100, snap.nitro))}%`;

        if (els.speedo) els.speedo.hidden = !snap.isDriving;
        if (els.mph) els.mph.textContent = String(snap.mph || 0);
        if (els.gear) els.gear.textContent = snap.gear || "D1";

        if (els.prompt) {
            if (snap.promptText) {
                els.prompt.textContent = snap.promptText;
                els.prompt.hidden = false;
            } else {
                els.prompt.hidden = true;
            }
        }

        if (els.gpsDist) {
            if (snap.gpsMiles > 0.01) {
                els.gpsDist.textContent = `${snap.gpsMiles.toFixed(2)} mi`;
                els.gpsDist.hidden = false;
            } else {
                els.gpsDist.hidden = true;
            }
        }

        for (let i = 0; i < els.stars.length; i += 1) {
            els.stars[i].classList.toggle("active", i < snap.wantedStars);
        }
        const flashRed = snap.wantedStars > 0 && Math.floor(snap.timeSec * 5) % 2 === 0;
        const flashBlue = snap.wantedStars > 0 && !flashRed;
        if (els.wanted) {
            els.wanted.classList.toggle("flash-red", flashRed && !snap.evading);
            els.wanted.classList.toggle("flash-blue", flashBlue && !snap.evading);
            els.wanted.classList.toggle("evading", snap.evading && Math.floor(snap.timeSec * 4) % 2 === 0);
        }
        if (els.radarFrame) {
            els.radarFrame.classList.toggle("wanted-red", flashRed);
            els.radarFrame.classList.toggle("wanted-blue", flashBlue);
        }

        if (els.radioBtn) {
            els.radioBtn.textContent = `Radio: ${snap.radioOn ? "On" : "Off"} (R)`;
            els.radioBtn.setAttribute("aria-pressed", String(snap.radioOn));
        }
        if (els.audioBtn) {
            els.audioBtn.textContent = `Audio: ${snap.muted ? "Off" : "On"}`;
            els.audioBtn.setAttribute("aria-pressed", String(!snap.muted));
        }

        drawRadar(snap);
    };

    const setFallback = (msg) => {
        if (els.loader) els.loader.hidden = true;
        if (els.fallback) {
            if (msg) els.fallback.textContent = msg;
            els.fallback.hidden = false;
        }
    };

    const setLost = (visible) => {
        if (els.lost) els.lost.hidden = !visible;
    };

    const destroy = () => {
        for (const [el, ev, fn] of listeners) el.removeEventListener(ev, fn);
        listeners.length = 0;
    };

    return {
        setLoader,
        setFallback,
        setLost,
        setActiveGroup,
        showToast,
        toggleSettings,
        toggleHudHidden,
        toggleStats,
        sync,
        destroy
    };
}
