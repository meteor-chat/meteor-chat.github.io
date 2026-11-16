import { createSimulation, stepSimulation } from "./crowd-engine.js";
import { renderSimulation } from "./crowd-renderer.js";

export function createCrowdController(root, options = {}) {
    const canvas = root.querySelector("canvas[data-crowd-canvas]") || root.querySelector("canvas");
    if (!canvas) {
        throw new Error("Crowd canvas element not found");
    }

    const ctx = canvas.getContext("2d");
    let mode = options.mode || "dual";
    let running = false;
    let seed = options.seed || 101;
    let agentCount = options.agentCount || 110;
    let desiredSpeed = options.desiredSpeed || 3.8;

    let simA = createSimulation({ seed, agentCount, hasColumn: false, desiredSpeed });
    let simB = createSimulation({ seed, agentCount, hasColumn: true, desiredSpeed });

    let animId = null;
    let lastTime = 0;

    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const targetW = Math.max(320, Math.floor(rect.width * dpr));
        const targetH = Math.max(240, Math.floor(rect.height * dpr));
        if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
        }
    }

    function reset(newSeed = seed) {
        seed = newSeed;
        simA = createSimulation({ seed, agentCount, hasColumn: mode === "single" ? simA.column.enabled : false, desiredSpeed });
        simB = createSimulation({ seed, agentCount, hasColumn: true, desiredSpeed });
        updateUI();
        render();
    }

    function toggleRun() {
        running = !running;
        lastTime = performance.now();
        updateUI();
        if (running && !animId) {
            animId = requestAnimationFrame(loop);
        }
    }

    function setPanic(speed) {
        desiredSpeed = Math.max(1.5, Math.min(6.0, Number(speed)));
        simA.config.desiredSpeed = desiredSpeed;
        simB.config.desiredSpeed = desiredSpeed;
        updateUI();
    }

    function setMode(newMode) {
        mode = newMode === "single" ? "single" : "dual";
        reset(seed);
    }

    function toggleColumn() {
        if (mode === "single") {
            simA.column.enabled = !simA.column.enabled;
            render();
            updateUI();
        }
    }

    function updateUI() {
        const alarmBtn = root.querySelector("[data-crowd-alarm]");
        if (alarmBtn) {
            alarmBtn.textContent = running ? "Pause Simulation" : "Sound Alarm (Start)";
            alarmBtn.classList.toggle("is-active", running);
        }

        const modeBtn = root.querySelector("[data-crowd-mode]");
        if (modeBtn) {
            modeBtn.textContent = mode === "dual" ? "Mode: Dual Room" : "Mode: Single Room";
        }

        const colBtn = root.querySelector("[data-crowd-column]");
        if (colBtn) {
            colBtn.style.display = mode === "single" ? "" : "none";
            colBtn.textContent = simA.column.enabled ? "Column: Active" : "Column: Disabled";
            colBtn.classList.toggle("is-active", simA.column.enabled);
        }

        const panicVal = root.querySelector("[data-crowd-panic-val]");
        if (panicVal) {
            panicVal.textContent = `${desiredSpeed.toFixed(1)} m/s`;
        }

        const evacAEl = root.querySelector("[data-stat-evac-a]");
        if (evacAEl) evacAEl.textContent = `${simA.evacuatedCount} / ${simA.agents.length}`;

        const evacBEl = root.querySelector("[data-stat-evac-b]");
        if (evacBEl) evacBEl.textContent = `${simB.evacuatedCount} / ${simB.agents.length}`;

        const statusAEl = root.querySelector("[data-stat-status-a]");
        if (statusAEl) {
            statusAEl.textContent = simA.jammed ? "JAMMED" : "FLOWING";
            statusAEl.className = simA.jammed ? "stat-jammed" : "stat-flowing";
        }

        const statusBEl = root.querySelector("[data-stat-status-b]");
        if (statusBEl) {
            statusBEl.textContent = simB.jammed ? "JAMMED" : "FLOWING";
            statusBEl.className = simB.jammed ? "stat-jammed" : "stat-flowing";
        }
    }

    function render() {
        resizeCanvas();
        renderSimulation(ctx, canvas.width, canvas.height, {
            mode,
            simA,
            simB
        });
    }

    function loop(now) {
        if (!running) {
            animId = null;
            return;
        }

        const dtRaw = (now - lastTime) / 1000;
        lastTime = now;
        const dt = Math.min(0.04, Math.max(0.001, dtRaw));

        stepSimulation(simA, dt);
        if (mode === "dual") {
            stepSimulation(simB, dt);
        }

        render();
        updateUI();

        animId = requestAnimationFrame(loop);
    }

    const onAlarmClick = () => toggleRun();
    const onResetClick = () => reset(Math.floor(Math.random() * 10000) + 1);
    const onModeClick = () => setMode(mode === "dual" ? "single" : "dual");
    const onColClick = () => toggleColumn();
    const onPanicInput = (e) => setPanic(e.target.value);

    const alarmBtn = root.querySelector("[data-crowd-alarm]");
    if (alarmBtn) alarmBtn.addEventListener("click", onAlarmClick);

    const resetBtn = root.querySelector("[data-crowd-reset]");
    if (resetBtn) resetBtn.addEventListener("click", onResetClick);

    const modeBtn = root.querySelector("[data-crowd-mode]");
    if (modeBtn) modeBtn.addEventListener("click", onModeClick);

    const colBtn = root.querySelector("[data-crowd-column]");
    if (colBtn) colBtn.addEventListener("click", onColClick);

    const panicInput = root.querySelector("[data-crowd-panic]");
    if (panicInput) panicInput.addEventListener("input", onPanicInput);

    window.addEventListener("resize", render);

    updateUI();
    render();

    return {
        start: () => { if (!running) toggleRun(); },
        pause: () => { if (running) toggleRun(); },
        reset,
        setMode,
        setPanic,
        toggleColumn,
        getState: () => ({ mode, running, seed, simA, simB, desiredSpeed }),
        destroy: () => {
            running = false;
            if (animId) cancelAnimationFrame(animId);
            window.removeEventListener("resize", render);
            if (alarmBtn) alarmBtn.removeEventListener("click", onAlarmClick);
            if (resetBtn) resetBtn.removeEventListener("click", onResetClick);
            if (modeBtn) modeBtn.removeEventListener("click", onModeClick);
            if (colBtn) colBtn.removeEventListener("click", onColClick);
            if (panicInput) panicInput.removeEventListener("input", onPanicInput);
        }
    };
}
