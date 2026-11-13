const DEFAULTS = {
    minScale: 0.6,
    maxScale: 1,
    step: 0.05,
    slowMs: 22,
    okMs: 19,
    emaWeight: 0.08,
    cooldownSec: 1.2,
    baseProbeSec: 6,
    maxProbeSec: 60,
    warmupSec: 3
};

const roundScale = (value) => Math.round(value * 100) / 100;

export function createQualityController(options = {}) {
    const cfg = { ...DEFAULTS, ...options };
    let scale = cfg.maxScale;
    let emaMs = 16.7;
    let sinceChange = -cfg.warmupSec;
    let probeSec = cfg.baseProbeSec;
    let probing = false;

    const lower = () => {
        scale = roundScale(Math.max(cfg.minScale, scale - cfg.step));
        if (probing) probeSec = Math.min(cfg.maxProbeSec, probeSec * 2);
        probing = false;
        sinceChange = 0;
    };

    const raise = () => {
        scale = roundScale(Math.min(cfg.maxScale, scale + cfg.step));
        probing = true;
        sinceChange = 0;
    };

    const update = (dtSec) => {
        emaMs += (dtSec * 1000 - emaMs) * cfg.emaWeight;
        sinceChange += dtSec;
        if (emaMs > cfg.slowMs && scale > cfg.minScale && sinceChange > cfg.cooldownSec) {
            lower();
        } else if (emaMs < cfg.okMs && scale < cfg.maxScale && sinceChange > probeSec) {
            raise();
        } else if (probing && sinceChange > cfg.cooldownSec * 2) {
            probing = false;
            probeSec = cfg.baseProbeSec;
        }
        return scale;
    };

    const reset = () => {
        emaMs = 16.7;
        sinceChange = -cfg.warmupSec;
        probing = false;
    };

    return { update, reset, getScale: () => scale, getEmaMs: () => emaMs };
}
