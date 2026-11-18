export const GLSL_FACE_BASIS = `
const vec3 FACE_N[6] = vec3[6](
    vec3(1.0, 0.0, 0.0), vec3(-1.0, 0.0, 0.0),
    vec3(0.0, 1.0, 0.0), vec3(0.0, -1.0, 0.0),
    vec3(0.0, 0.0, 1.0), vec3(0.0, 0.0, -1.0)
);
const vec3 FACE_T[6] = vec3[6](
    vec3(0.0, 0.0, 1.0), vec3(0.0, 0.0, 1.0),
    vec3(1.0, 0.0, 0.0), vec3(1.0, 0.0, 0.0),
    vec3(1.0, 0.0, 0.0), vec3(1.0, 0.0, 0.0)
);
const vec3 FACE_B[6] = vec3[6](
    vec3(0.0, 1.0, 0.0), vec3(0.0, 1.0, 0.0),
    vec3(0.0, 0.0, 1.0), vec3(0.0, 0.0, 1.0),
    vec3(0.0, 1.0, 0.0), vec3(0.0, 1.0, 0.0)
);

vec3 mapNormal(uint face, vec4 data) {
    vec2 xy = data.rg * 2.0 - 1.0;
    float z = sqrt(max(1.0 - dot(xy, xy), 0.0));
    return normalize(FACE_T[face] * xy.x + FACE_B[face] * xy.y + FACE_N[face] * z);
}
`;

export const GLSL_SURFACE_LIGHT = `
vec3 shadeSurface(vec3 albedo, vec3 n, vec3 v, float rough, float shadow) {
    float skyRain = smoothstep(0.25, 0.75, vLight.x) * uRainIntensity;
    float isTop = clamp(n.y * 2.0 - 1.0, 0.0, 1.0);
    float pNoise = fbm2(vWorldPos.xz * 0.35);
    float puddle = smoothstep(0.46, 0.68, pNoise) * isTop * skyRain;
    float wet = clamp(skyRain * (0.65 + 0.35 * isTop) + puddle * 0.45, 0.0, 1.0);

    if (puddle > 0.02) {
        vec2 ripUv = vWorldPos.xz * 3.5;
        vec2 cell = floor(ripUv);
        vec2 f = fract(ripUv) - 0.5;
        float waveTime = fract(uTime * 3.5 + hash21(cell));
        float ringDist = length(f);
        float ripple = sin(ringDist * 28.0 - waveTime * 14.0) * exp(-ringDist * 4.0) * (1.0 - waveTime);
        vec2 ripDir = normalize(f + 1e-4) * ripple * 0.07 * puddle;
        n = normalize(n + vec3(ripDir.x, 0.0, ripDir.y));
    }

    vec3 diffAlbedo = albedo * mix(vec3(1.0), vec3(0.55, 0.55, 0.58), wet * 0.85);
    float wetRough = mix(rough, 0.12, wet * 0.7);
    wetRough = mix(wetRough, 0.02, puddle);

    float skyLevel = vLight.x;
    float sunVis = skyLevel * sunPower() * shadow;
    float ndl = max(dot(n, uSunDir), 0.0);
    vec3 sun = uSunTint * (ndl * sunVis * 1.45 * mix(1.0, vAo, 0.5));
    float hemi = n.y * 0.5 + 0.5;
    float skyLum = dot(uSkyColor, vec3(0.3, 0.59, 0.11));
    vec3 skyAmb = mix(uSkyColor, vec3(skyLum), 0.55) * 0.95 + vec3(0.05);
    vec3 groundAmb = uHorizonColor * 0.3 + vec3(0.03);
    float ambLevel = 0.12 + 0.88 * skyLevel * (0.3 + 0.7 * uDayIntensity);
    vec3 amb = mix(groundAmb, skyAmb, hemi) * ambLevel * vAo;
    float night = clamp(1.0 - uDayIntensity * 2.1, 0.0, 1.0);
    vec3 moon = vec3(0.35, 0.45, 0.8) * max(dot(n, -uSunDir), 0.0) * night * skyLevel * 0.35;
    float flicker = 0.94 + 0.06 * sin(uTime * 7.1 + vWorldPos.x + vWorldPos.z);
    vec3 blk = vec3(1.5, 0.76, 0.34) * pow(max(vLight.y, 1e-4), 1.8) * flicker * (0.4 + 0.6 * vAo) * 1.5;
    vec3 col = diffAlbedo * (sun + amb + moon + blk);

    if (wetRough < 0.7) {
        vec3 h = normalize(uSunDir + v);
        float gloss = pow(max(dot(n, h), 0.0), mix(12.0, 180.0, 1.0 - wetRough));
        col += uSunTint * gloss * (1.0 - wetRough) * ndl * sunVis * 0.8;
    }

    if (wet > 0.01) {
        float ndv = max(dot(n, v), 0.0);
        float fresnel = 0.04 + 0.96 * pow(clamp(1.0 - ndv, 0.0, 1.0), 5.0);
        vec3 reflDir = reflect(-v, n);
        vec3 skyRefl = skyGradient(reflDir);
        col = mix(col, skyRefl, wet * fresnel * (1.0 - wetRough * 0.75));

        float blkLvl = pow(max(vLight.y, 0.0), 1.5);
        if (blkLvl > 0.005) {
            vec3 lanternCol = vec3(2.1, 1.1, 0.4);
            vec3 halfLantern = normalize(v + vec3(0.0, 1.0, 0.0));
            float lanternSpec = pow(max(dot(n, halfLantern), 0.0), mix(6.0, 50.0, 1.0 - wetRough));
            col += lanternCol * blkLvl * lanternSpec * (0.8 + 1.6 * puddle);
        }
    }

    return col;
}

vec3 leafGlow(vec3 albedo, vec3 v, float shadow) {
    float toward = pow(max(dot(-v, uSunDir), 0.0), 2.0);
    float sunVis = vLight.x * sunPower() * mix(0.45, 1.0, shadow);
    return albedo * vec3(1.0, 1.25, 0.4) * uSunTint * toward * sunVis * 1.4;
}
`;
