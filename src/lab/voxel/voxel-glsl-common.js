export const GLSL_ATMOSPHERE = `
uniform vec3 uSunDir;
uniform vec3 uSunTint;
uniform vec3 uSkyColor;
uniform vec3 uHorizonColor;
uniform float uDayIntensity;
uniform float uTime;

float sunPower() {
    return smoothstep(-0.04, 0.22, uSunDir.y);
}

vec3 skyGradient(vec3 dir) {
    float lift = pow(max(clamp(dir.y, 0.0, 1.0), 1e-4), 0.5);
    vec3 col = mix(uHorizonColor, uSkyColor, lift);
    float sunDot = max(dot(dir, uSunDir), 0.0);
    float glow = pow(sunDot, 6.0) * 0.12 + pow(sunDot, 48.0) * 0.55;
    return col + uSunTint * glow * (0.25 + 0.75 * uDayIntensity);
}
`;

export const GLSL_NOISE = `
float hash21(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
}

float noise2d(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
        mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x),
        f.y
    );
}

float fbm2(vec2 p) {
    float sum = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i += 1) {
        sum += noise2d(p) * amp;
        p = p * 2.03 + vec2(17.1, 9.7);
        amp *= 0.5;
    }
    return sum / 0.9375;
}
`;
