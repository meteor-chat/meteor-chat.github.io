function getAudioCtor() {
    if (typeof window === "undefined") return null;
    return window.AudioContext || window.webkitAudioContext || null;
}

const RADIO_NOTES = [110, 110, 130.81, 146.83, 164.81, 146.83, 130.81, 98];

export function createGtaAudio() {
    let ctx = null;
    let master = null;
    let engineOscA = null;
    let engineOscB = null;
    let engineFilter = null;
    let engineGain = null;
    let tireSource = null;
    let tireFilter = null;
    let tireGain = null;
    let noiseBuffer = null;
    let muted = false;
    let radioOn = false;
    let radioStep = 0;
    let radioAcc = 0;
    let destroyed = false;

    const ensure = () => {
        if (destroyed || muted) return null;
        if (!ctx) {
            const Ctor = getAudioCtor();
            if (!Ctor) return null;
            try {
                ctx = new Ctor();
                master = ctx.createGain();
                master.gain.value = 0.65;
                master.connect(ctx.destination);

                noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
                const data = noiseBuffer.getChannelData(0);
                for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;

                engineOscA = ctx.createOscillator();
                engineOscB = ctx.createOscillator();
                engineOscA.type = "sawtooth";
                engineOscB.type = "triangle";
                engineOscA.frequency.value = 52;
                engineOscB.frequency.value = 104;
                engineFilter = ctx.createBiquadFilter();
                engineFilter.type = "lowpass";
                engineFilter.frequency.value = 280;
                engineGain = ctx.createGain();
                engineGain.gain.value = 0;
                engineOscA.connect(engineFilter);
                engineOscB.connect(engineFilter);
                engineFilter.connect(engineGain);
                engineGain.connect(master);
                engineOscA.start();
                engineOscB.start();

                tireSource = ctx.createBufferSource();
                tireSource.buffer = noiseBuffer;
                tireSource.loop = true;
                tireFilter = ctx.createBiquadFilter();
                tireFilter.type = "bandpass";
                tireFilter.frequency.value = 1550;
                tireFilter.Q.value = 5.5;
                tireGain = ctx.createGain();
                tireGain.gain.value = 0;
                tireSource.connect(tireFilter);
                tireFilter.connect(tireGain);
                tireGain.connect(master);
                tireSource.start();
            } catch {
                ctx = null;
                return null;
            }
        }
        if (ctx.state === "suspended") ctx.resume().catch(() => {});
        return ctx;
    };

    const unlock = () => {
        ensure();
    };

    const playTone = (f0, f1, dur, vol, type = "triangle") => {
        const ac = ensure();
        if (!ac || !master) return;
        const now = ac.currentTime;
        const osc = ac.createOscillator();
        osc.type = type;
        osc.frequency.setValueAtTime(f0, now);
        osc.frequency.exponentialRampToValueAtTime(Math.max(30, f1), now + dur);
        const g = ac.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(vol, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        osc.connect(g);
        g.connect(master);
        osc.start(now);
        osc.stop(now + dur + 0.02);
    };

    const playCrash = (intensity = 0.6) => {
        const ac = ensure();
        if (!ac || !noiseBuffer || !master) return;
        const k = Math.max(0.2, Math.min(1.4, intensity));
        const now = ac.currentTime;
        const src = ac.createBufferSource();
        src.buffer = noiseBuffer;
        const f = ac.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.value = 540 * k;
        const g = ac.createGain();
        g.gain.setValueAtTime(0.24 * k, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
        src.connect(f);
        f.connect(g);
        g.connect(master);
        src.start(now, 0, 0.26);
        playTone(145, 42, 0.22, 0.16 * k, "triangle");
    };

    const playHorn = () => {
        playTone(392, 390, 0.28, 0.11, "sawtooth");
        playTone(493.88, 492, 0.28, 0.09, "sawtooth");
    };

    const playDoor = () => {
        playTone(130, 58, 0.11, 0.14, "sine");
    };

    const update = (dt, state) => {
        if (!ctx || muted || !engineGain) return;
        const now = ctx.currentTime;
        const driving = Boolean(state.isDriving);
        const rpm = state.rpm || 860;
        const throttle = state.throttle || 0;
        const baseFreq = 36 + (rpm / 7400) * 145;
        engineOscA.frequency.setTargetAtTime(baseFreq, now, 0.04);
        engineOscB.frequency.setTargetAtTime(baseFreq * 1.98, now, 0.04);
        engineFilter.frequency.setTargetAtTime(220 + (rpm / 7400) * 1250 + throttle * 420, now, 0.05);
        engineGain.gain.setTargetAtTime(driving ? 0.065 + throttle * 0.06 : 0, now, 0.08);

        const driftVol = driving && state.drifting ? Math.min(0.11, (state.lateralSpeed || 0) * 0.015) : 0;
        tireGain.gain.setTargetAtTime(driftVol, now, 0.06);

        if (radioOn) {
            radioAcc += dt;
            if (radioAcc >= 0.28) {
                radioAcc -= 0.28;
                const note = RADIO_NOTES[radioStep % RADIO_NOTES.length];
                playTone(note, note * 0.99, 0.24, 0.042, "triangle");
                if (radioStep % 2 === 0) {
                    playTone(note * 2, note * 2.01, 0.16, 0.022, "sine");
                }
                radioStep += 1;
            }
        }
    };

    const setMuted = (next) => {
        muted = Boolean(next);
        if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : 0.65, ctx.currentTime, 0.04);
    };

    const setRadio = (on) => {
        radioOn = Boolean(on);
        if (radioOn) ensure();
    };

    const destroy = () => {
        destroyed = true;
        if (ctx) {
            ctx.close().catch(() => {});
            ctx = null;
        }
        master = null;
        engineGain = null;
        tireGain = null;
    };

    return {
        unlock,
        update,
        playCrash,
        playHorn,
        playDoor,
        setMuted,
        isMuted: () => muted,
        setRadio,
        isRadioOn: () => radioOn,
        destroy
    };
}
