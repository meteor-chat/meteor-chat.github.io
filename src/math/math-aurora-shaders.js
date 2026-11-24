export const NOISE_PERIOD = 16;

export const AURORA_UNIFORMS = [
    "uResolution",
    "uWavePhase",
    "uDriftPhase"
];

export const AURORA_VS = `attribute vec2 aPosition;
void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

export const AURORA_FS = `precision highp float;

uniform vec2 uResolution;
uniform vec4 uWavePhase;
uniform vec4 uDriftPhase;

const float PERIOD = 16.0;

float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float pnoise(vec2 p, vec2 per) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    vec2 i0 = mod(i, per);
    vec2 i1 = mod(i + 1.0, per);
    float a = hash12(vec2(i0.x, i0.y));
    float b = hash12(vec2(i1.x, i0.y));
    float c = hash12(vec2(i0.x, i1.y));
    float d = hash12(vec2(i1.x, i1.y));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbmOrganic(vec2 p) {
    vec2 per = vec2(PERIOD);
    mat2 rot = mat2(2.0, 1.0, -1.0, 2.0);
    float v = 0.0;
    float amp = 0.52;
    v += amp * pnoise(p, per);
    p = rot * p + vec2(3.1, 5.7);
    amp *= 0.5;
    v += amp * pnoise(p, per);
    p = rot * p + vec2(7.3, 2.9);
    amp *= 0.5;
    v += amp * pnoise(p, per);
    return v;
}

float fbmRays(vec2 p) {
    float v = 0.0;
    v += 0.48 * pnoise(p, vec2(PERIOD));
    v += 0.32 * pnoise(p * 2.0 + vec2(4.3, 1.7), vec2(PERIOD * 2.0));
    v += 0.20 * pnoise(p * 4.0 + vec2(9.1, 6.2), vec2(PERIOD * 4.0));
    return v;
}

vec2 evalCurtain(
    vec2 p,
    float baseX,
    float sharpW,
    float softW,
    float yStart,
    float yEnd,
    float lean,
    float ampA,
    float ampB,
    float freqA,
    float freqB,
    float phaseOffset,
    float driftSign
) {
    float y = p.y;
    float w1 = uWavePhase.x + phaseOffset;
    float w2 = uWavePhase.y - phaseOffset * 1.37;
    float w3 = uWavePhase.z + phaseOffset * 0.73;
    float w4 = uWavePhase.w + phaseOffset * 1.91;

    float sway = ampA * sin(y * freqA - w1)
        + ampB * cos(y * freqB + w2)
        + 0.018 * sin(y * 6.4 - 2.0 * w1 + w3);

    float warpNoise = fbmOrganic(vec2(
        baseX * 1.5 + uDriftPhase.z * driftSign,
        y * 1.35 - uDriftPhase.w
    ));
    float spine = baseX + lean * (y - 0.48) + sway + (warpNoise - 0.5) * 0.095;

    float d = p.x - spine;
    float fan = 1.0 + smoothstep(0.32, 1.0, y) * 1.05;
    float width = d < 0.0 ? sharpW * (0.82 + 0.42 * y) : softW * fan;
    float nd = d / max(width, 0.001);
    float profile = d < 0.0
        ? exp(-nd * nd * 2.85)
        : exp(-pow(abs(nd), 1.48) * 1.42);

    float coreRidge = exp(-pow((d - width * 0.05) / max(sharpW * 0.64, 0.001), 2.0));

    float baseRipple = 0.055 * sin(p.x * 4.2 + w2) + 0.032 * cos(p.x * 7.1 - w3);
    float riseIn = smoothstep(yStart + baseRipple - 0.08, yStart + baseRipple + 0.16, y);
    float topFade = smoothstep(yEnd + 0.05 * sin(w3 + baseX * 3.0), yEnd - 0.48, y);
    float vertEnv = riseIn * topFade;

    float rayCoordX = d * 11.5 + p.x * 6.5;
    float raysCoarse = fbmRays(vec2(
        rayCoordX + uDriftPhase.y * driftSign,
        y * 0.85 - uDriftPhase.x
    ));
    float raysFine = fbmRays(vec2(
        rayCoordX * 2.15 - uDriftPhase.y * driftSign + phaseOffset * 2.3,
        y * 0.72 - 2.0 * uDriftPhase.x
    ));
    float rayMix = raysCoarse * 0.58 + raysFine * 0.42;
    float streaks = pow(smoothstep(0.14, 0.92, rayMix), 1.25);
    float filaments = mix(0.28, 1.65, streaks);

    float upperFeathers = mix(1.0, 0.45 + 0.85 * streaks, smoothstep(0.55, 0.98, y));
    float pulseWave = 0.66 + 0.34 * sin(y * 3.2 - w4);
    float shimmer = 0.78 + 0.22 * sin(p.x * 6.0 + y * 2.4 - w2);

    float veil = profile * vertEnv * filaments * upperFeathers * pulseWave * shimmer;
    float coreMask = smoothstep(yStart + 0.04, yStart + 0.22, y) * smoothstep(yEnd - 0.08, yEnd - 0.56, y);
    float core = coreRidge * coreMask * mix(0.45, 1.35, streaks) * pulseWave;
    return vec2(veil, core);
}

void main() {
    vec2 uv = gl_FragCoord.xy / max(uResolution, vec2(1.0));
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    float xScale = mix(1.0, aspect, 0.56);
    vec2 p = vec2((uv.x - 0.5) * xScale, uv.y);

    float swayGlobal = 0.028 * sin(uWavePhase.z);

    vec2 cPrimary = evalCurtain(
        p,
        -0.18 + swayGlobal,
        0.036,
        0.132,
        0.14,
        1.14,
        0.18,
        0.056,
        0.026,
        4.2,
        7.4,
        0.35,
        1.0
    );

    vec2 cPrimaryHalo = evalCurtain(
        p,
        -0.11 + swayGlobal,
        0.055,
        0.185,
        0.22,
        1.18,
        0.14,
        0.046,
        0.022,
        3.6,
        6.2,
        1.75,
        -1.0
    );

    vec2 cSecondary = evalCurtain(
        p,
        0.20 - swayGlobal,
        0.048,
        0.165,
        0.09,
        1.06,
        -0.06,
        0.042,
        0.021,
        3.4,
        5.8,
        2.95,
        -1.0
    );

    vec2 cRightFlank = evalCurtain(
        p,
        0.52 + swayGlobal,
        0.056,
        0.215,
        0.12,
        1.10,
        -0.10,
        0.052,
        0.024,
        3.9,
        6.5,
        4.25,
        1.0
    );

    vec2 cLeftFlank = evalCurtain(
        p,
        -0.54 - swayGlobal,
        0.062,
        0.225,
        0.10,
        1.05,
        0.10,
        0.046,
        0.022,
        3.3,
        5.7,
        5.15,
        -1.0
    );

    float widePresence = smoothstep(0.75, 1.35, aspect);

    float veilTotal = cPrimary.x * 1.18
        + cPrimaryHalo.x * 0.56
        + cSecondary.x * 0.78
        + cRightFlank.x * (0.36 + 0.44 * widePresence)
        + cLeftFlank.x * (0.28 + 0.36 * widePresence);

    float coreTotal = cPrimary.y * 1.32
        + cPrimaryHalo.y * 0.38
        + cSecondary.y * 0.54
        + cRightFlank.y * (0.22 + 0.34 * widePresence)
        + cLeftFlank.y * (0.18 + 0.26 * widePresence);

    float mistyBloom = fbmOrganic(vec2(
        p.x * 1.6 + uDriftPhase.z,
        p.y * 1.1 - uDriftPhase.w
    ));

    float lowerGlow = exp(-pow((uv.y - 0.12) / 0.28, 2.0))
        * (0.58 + 0.42 * mistyBloom)
        * (0.70 + 0.30 * sin(p.x * 2.2 + uWavePhase.z));

    vec3 deepVoid = vec3(0.004, 0.012, 0.048);
    vec3 midnightIndigo = vec3(0.012, 0.048, 0.178);
    vec3 royalCobalt = vec3(0.020, 0.165, 0.560);
    vec3 vividAzure = vec3(0.025, 0.420, 0.920);
    vec3 electricCyan = vec3(0.085, 0.765, 1.000);
    vec3 brightSky = vec3(0.320, 0.885, 1.000);

    float skyGrad = smoothstep(1.0, 0.0, uv.y);
    vec3 col = mix(deepVoid, midnightIndigo, pow(skyGrad, 1.65) * 0.82);

    col += mix(midnightIndigo, royalCobalt, 0.62) * lowerGlow * 0.54;

    float v1 = smoothstep(0.02, 0.52, veilTotal);
    float v2 = smoothstep(0.28, 1.05, veilTotal);
    float c1 = smoothstep(0.10, 0.78, coreTotal);
    float c2 = smoothstep(0.52, 1.35, coreTotal);

    vec3 auroraCol = royalCobalt * (veilTotal * 0.72);
    auroraCol += vividAzure * (v1 * 0.58 + v2 * 0.48);
    auroraCol += electricCyan * (c1 * 0.84);
    auroraCol += brightSky * (c2 * 0.36);

    col += auroraCol;

    float vignette = 1.0 - 0.20 * pow(length((uv - vec2(0.5, 0.48)) * vec2(1.12, 1.18)), 2.2);
    col *= clamp(vignette, 0.76, 1.0);

    float lum = max(col.r, max(col.g, col.b));
    float mappedLum = lum / (1.0 + lum * 0.42);
    col *= mappedLum / max(lum, 0.0001);

    col = pow(max(col, vec3(0.0)), vec3(0.96));

    float dither = (hash12(gl_FragCoord.xy) - 0.5) / 255.0;
    col = clamp(col + vec3(dither), 0.0, 1.0);

    gl_FragColor = vec4(col, 1.0);
}`;
