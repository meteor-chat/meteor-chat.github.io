export const QUALITY_PRESETS = Object.freeze({
    high: {
        key: "high",
        label: "High",
        maxDpr: 1.5,
        shadowSize: 2048,
        shadowExtent: 82,
        shadowsEnabled: true,
        bloomEnabled: true,
        bloomScale: 0.5,
        minResScale: 0.85,
        maxResScale: 1.0,
        farClip: 620
    },
    balanced: {
        key: "balanced",
        label: "Balanced",
        maxDpr: 1.25,
        shadowSize: 1024,
        shadowExtent: 68,
        shadowsEnabled: true,
        bloomEnabled: true,
        bloomScale: 0.5,
        minResScale: 0.72,
        maxResScale: 1.0,
        farClip: 480
    },
    fast: {
        key: "fast",
        label: "Fast",
        maxDpr: 1.0,
        shadowSize: 512,
        shadowExtent: 56,
        shadowsEnabled: false,
        bloomEnabled: false,
        bloomScale: 0.5,
        minResScale: 0.65,
        maxResScale: 0.85,
        farClip: 380
    }
});

export function computeSectorIndex(x, z, gridSize = 3, worldHalf = 384) {
    const span = worldHalf * 2;
    const gx = Math.max(0, Math.min(gridSize - 1, Math.floor(((x + worldHalf) / span) * gridSize)));
    const gz = Math.max(0, Math.min(gridSize - 1, Math.floor(((z + worldHalf) / span) * gridSize)));
    return gz * gridSize + gx;
}

export function createPerfGovernor(initialPreset = "balanced") {
    let preset = QUALITY_PRESETS[initialPreset] || QUALITY_PRESETS.balanced;
    let scale = preset.maxResScale;
    let emaMs = 16.67;
    let slowTimer = 0;
    let fastTimer = 0;
    let cooldown = 0;

    const setPreset = (key) => {
        preset = QUALITY_PRESETS[key] || QUALITY_PRESETS.balanced;
        scale = Math.max(preset.minResScale, Math.min(preset.maxResScale, preset.maxResScale));
        slowTimer = 0;
        fastTimer = 0;
        cooldown = 0.8;
        return { preset, scale };
    };

    const sample = (rawDtSec) => {
        const dt = Math.max(0.004, Math.min(0.15, rawDtSec));
        const frameMs = dt * 1000;
        emaMs += (frameMs - emaMs) * 0.12;

        if (cooldown > 0) {
            cooldown -= dt;
            return { changed: false, scale, emaMs, preset };
        }

        if (emaMs > 19.8) {
            slowTimer += dt;
            fastTimer = 0;
            if (slowTimer >= 1.1 && scale > preset.minResScale + 0.005) {
                scale = Math.max(preset.minResScale, Math.round((scale - 0.06) * 100) / 100);
                slowTimer = 0;
                cooldown = 1.4;
                return { changed: true, scale, emaMs, preset };
            }
        } else if (emaMs < 14.8) {
            fastTimer += dt;
            slowTimer = 0;
            if (fastTimer >= 2.2 && scale < preset.maxResScale - 0.005) {
                scale = Math.min(preset.maxResScale, Math.round((scale + 0.05) * 100) / 100);
                fastTimer = 0;
                cooldown = 1.6;
                return { changed: true, scale, emaMs, preset };
            }
        } else {
            slowTimer = Math.max(0, slowTimer - dt * 0.5);
            fastTimer = Math.max(0, fastTimer - dt * 0.5);
        }

        return { changed: false, scale, emaMs, preset };
    };

    return {
        setPreset,
        sample,
        getPreset: () => preset,
        getScale: () => scale,
        getEmaMs: () => emaMs
    };
}
