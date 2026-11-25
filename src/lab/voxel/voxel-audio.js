const MAT_PROFILES = {
    grass: { freq: 210, q: 1.6, dur: 0.085, gain: 0.14, tone: 110 },
    dirt: { freq: 185, q: 1.4, dur: 0.09, gain: 0.16, tone: 95 },
    stone: { freq: 520, q: 2.2, dur: 0.075, gain: 0.18, tone: 165 },
    wood: { freq: 340, q: 2.8, dur: 0.08, gain: 0.17, tone: 145 },
    sand: { freq: 1150, q: 1.0, dur: 0.08, gain: 0.12, tone: 0 },
    snow: { freq: 920, q: 1.1, dur: 0.095, gain: 0.11, tone: 0 },
    glass: { freq: 2400, q: 3.5, dur: 0.11, gain: 0.16, tone: 1380 },
    water: { freq: 680, q: 1.5, dur: 0.13, gain: 0.15, tone: 0 }
};

function getAudioCtor() {
    if (typeof window === "undefined") return null;
    return window.AudioContext || window.webkitAudioContext || null;
}

export function createVoxelAudio() {
    let ctx = null;
    let master = null;
    let noiseBuffer = null;
    let rainSource = null;
    let rainFilter = null;
    let rainGain = null;
    let muted = false;
    let destroyed = false;

    const ensureContext = () => {
        if (destroyed || muted) return null;
        if (!ctx) {
            const Ctor = getAudioCtor();
            if (!Ctor) return null;
            try {
                ctx = new Ctor();
                master = ctx.createGain();
                master.gain.value = 0.7;
                master.connect(ctx.destination);

                const sampleCount = ctx.sampleRate;
                noiseBuffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
                const data = noiseBuffer.getChannelData(0);
                let b0 = 0;
                let b1 = 0;
                let b2 = 0;
                for (let i = 0; i < sampleCount; i += 1) {
                    const white = Math.random() * 2 - 1;
                    b0 = 0.997 * b0 + white * 0.029;
                    b1 = 0.985 * b1 + white * 0.032;
                    b2 = 0.95 * b2 + white * 0.048;
                    data[i] = Math.max(-1, Math.min(1, (b0 + b1 + b2 + white * 0.18) * 1.4));
                }
            } catch {
                ctx = null;
                return null;
            }
        }
        if (ctx.state === "suspended") {
            ctx.resume().catch(() => {});
        }
        return ctx;
    };

    const unlock = () => {
        ensureContext();
    };

    const playNoiseBurst = (freq, q, dur, vol, pitchJitter = 0.18) => {
        const ac = ensureContext();
        if (!ac || !noiseBuffer || !master) return;
        const now = ac.currentTime;
        const src = ac.createBufferSource();
        src.buffer = noiseBuffer;
        src.playbackRate.value = 1 + (Math.random() * 2 - 1) * pitchJitter;

        const filter = ac.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = freq * (0.9 + Math.random() * 0.2);
        filter.Q.value = q;

        const gain = ac.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(master);
        src.start(now, Math.random() * 0.5, dur + 0.02);
    };

    const playTone = (startFreq, endFreq, dur, vol, type = "triangle") => {
        const ac = ensureContext();
        if (!ac || !master) return;
        const now = ac.currentTime;
        const osc = ac.createOscillator();
        osc.type = type;
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + dur);

        const gain = ac.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + dur + 0.02);
    };

    const playFootstep = (material = "grass") => {
        const p = MAT_PROFILES[material] || MAT_PROFILES.grass;
        playNoiseBurst(p.freq * 0.85, p.q, p.dur * 0.85, p.gain * 0.55);
        if (p.tone > 0) playTone(p.tone * 0.9, p.tone * 0.55, 0.05, 0.045, "sine");
    };

    const playLand = (material = "grass", impact = 6) => {
        const strength = Math.min(1.4, Math.max(0.4, impact / 12));
        const p = MAT_PROFILES[material] || MAT_PROFILES.grass;
        playNoiseBurst(p.freq * 0.7, p.q, p.dur * 1.15, p.gain * 0.85 * strength);
        playTone(115, 52, 0.085, 0.09 * strength, "sine");
    };

    const playBreak = (material = "stone") => {
        const p = MAT_PROFILES[material] || MAT_PROFILES.stone;
        playNoiseBurst(p.freq, p.q, p.dur * 1.35, p.gain * 1.2);
        if (material === "glass") {
            playTone(1950, 920, 0.09, 0.08, "sine");
            playTone(2680, 1420, 0.07, 0.06, "triangle");
        } else if (p.tone > 0) {
            playTone(p.tone * 1.15, p.tone * 0.52, 0.075, 0.085, "triangle");
        }
    };

    const playPlace = (material = "stone") => {
        const p = MAT_PROFILES[material] || MAT_PROFILES.stone;
        playNoiseBurst(p.freq * 0.95, p.q * 1.2, p.dur * 0.95, p.gain * 0.9);
        const base = p.tone > 0 ? p.tone * 1.25 : 135;
        playTone(base, base * 0.72, 0.065, 0.08, "triangle");
    };

    const playSplash = (intensity = 1) => {
        const k = Math.min(1.4, Math.max(0.4, intensity));
        playNoiseBurst(540, 0.9, 0.22, 0.18 * k, 0.25);
        playNoiseBurst(1280, 1.4, 0.15, 0.11 * k, 0.25);
    };

    const playMob = (kind) => {
        if (kind === "chicken") {
            playTone(620, 420, 0.075, 0.07, "triangle");
            setTimeout(() => {
                if (!destroyed && !muted) playTone(560, 380, 0.065, 0.055, "triangle");
            }, 95);
        } else if (kind === "cat") {
            playTone(540, 740, 0.14, 0.055, "sine");
            setTimeout(() => {
                if (!destroyed && !muted) playTone(720, 460, 0.18, 0.05, "sine");
            }, 130);
        } else if (kind === "villager") {
            playTone(185, 225, 0.13, 0.075, "sawtooth");
            setTimeout(() => {
                if (!destroyed && !muted) playTone(215, 165, 0.16, 0.065, "triangle");
            }, 125);
        }
    };

    const updateAmbience = (rainIntensity, indoorFactor = 0, underwater = false) => {
        if (!ctx || !noiseBuffer || !master || muted) {
            if (rainGain && ctx) {
                rainGain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
            }
            return;
        }
        const targetVol = rainIntensity > 0.02
            ? rainIntensity * (underwater ? 0.015 : 0.085 * (1 - indoorFactor * 0.72))
            : 0;
        if (targetVol > 0.001 && !rainSource) {
            try {
                rainSource = ctx.createBufferSource();
                rainSource.buffer = noiseBuffer;
                rainSource.loop = true;
                rainFilter = ctx.createBiquadFilter();
                rainFilter.type = "lowpass";
                rainFilter.frequency.value = 1400;
                rainGain = ctx.createGain();
                rainGain.gain.value = 0;
                rainSource.connect(rainFilter);
                rainFilter.connect(rainGain);
                rainGain.connect(master);
                rainSource.start();
            } catch {
                rainSource = null;
                return;
            }
        }
        if (rainGain && rainFilter) {
            rainFilter.frequency.setTargetAtTime(
                underwater ? 320 : 1450 - indoorFactor * 850,
                ctx.currentTime,
                0.15
            );
            rainGain.gain.setTargetAtTime(targetVol, ctx.currentTime, 0.15);
        }
    };

    const setMuted = (nextMuted) => {
        muted = Boolean(nextMuted);
        if (master && ctx) {
            master.gain.setTargetAtTime(muted ? 0 : 0.7, ctx.currentTime, 0.04);
        }
    };

    const destroy = () => {
        destroyed = true;
        if (rainSource) {
            try {
                rainSource.stop();
            } catch {
                rainSource = null;
            }
            rainSource = null;
        }
        if (ctx) {
            ctx.close().catch(() => {});
            ctx = null;
        }
        master = null;
        noiseBuffer = null;
        rainFilter = null;
        rainGain = null;
    };

    return {
        unlock,
        playFootstep,
        playLand,
        playBreak,
        playPlace,
        playSplash,
        playMob,
        updateAmbience,
        setMuted,
        isMuted: () => muted,
        destroy
    };
}
