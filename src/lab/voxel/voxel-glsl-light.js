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
    return safeNorm(FACE_T[face] * xy.x + FACE_B[face] * xy.y + FACE_N[face] * z);
}
`;

export const GLSL_SURFACE_LIGHT = `
uniform float uUnderwater;
uniform vec4 uHandLight;

vec3 shadeSurface(vec3 albedo, vec3 n, vec3 v, float rough, float shadow, bool allowPuddles) {
    float wet = 0.0;
    float puddle = 0.0;
    vec2 ripDir = vec2(0.0);

    if (uRainIntensity > 0.001 && uUnderwater < 0.5 && vLight.x > 0.15) {
        float skyRain = smoothstep(0.15, 0.65, vLight.x) * uRainIntensity;
        float isTop = clamp(n.y * 2.0 - 1.0, 0.0, 1.0);
        if (allowPuddles && isTop > 0.1) {
            float pNoise = fbm2(vWorldPos.xz * 0.14);
            puddle = smoothstep(0.48, 0.60, pNoise) * isTop * skyRain;
            if (puddle > 0.03) {
                vec2 ripUv = vWorldPos.xz * 1.8;
                vec2 rCell = floor(ripUv);
                vec2 rF = fract(ripUv) - 0.5;
                for (int dy = -1; dy <= 1; dy += 1) {
                    for (int dx = -1; dx <= 1; dx += 1) {
                        vec2 cellOff = vec2(float(dx), float(dy));
                        vec2 cId = rCell + cellOff;
                        float dHash = hash21(cId);
                        float dAge = fract(uTime * 1.6 + dHash * 5.7);
                        vec2 dPos = (vec2(hash21(cId + 1.3), hash21(cId + 4.7)) - 0.5) * 0.6;
                        vec2 toD = rF - cellOff - dPos;
                        float dLen = length(toD);
                        float ringDist = abs(dLen - dAge * 0.75);
                        float wave = sin(ringDist * 28.0) * smoothstep(0.18, 0.0, ringDist) * (1.0 - dAge);
                        ripDir += safeNorm2(toD) * wave;
                    }
                }
            }
        }
        wet = clamp(skyRain * (0.55 + 0.45 * isTop) + puddle * 0.5, 0.0, 1.0);
    }

    vec3 surfN = safeNorm(n + vec3(ripDir.x, 0.0, ripDir.y) * 0.04 * puddle);
    vec3 diffAlbedo = albedo * mix(vec3(1.0), vec3(0.72, 0.74, 0.78), wet * 0.6);
    float wetRough = mix(rough, 0.14, wet * 0.75);
    wetRough = mix(wetRough, 0.015, puddle);

    float skyLevel = vLight.x;
    float sunVis = skyLevel * sunPower() * shadow;
    float ndl = max(dot(surfN, uSunDir), 0.0);
    vec3 sun = uSunTint * (ndl * sunVis * 1.48 * mix(1.0, vAo, 0.5));
    float hemi = surfN.y * 0.5 + 0.5;
    float skyLum = dot(uSkyColor, vec3(0.3, 0.59, 0.11));
    vec3 skyAmb = mix(uSkyColor, vec3(skyLum), 0.5) * 0.95 + vec3(0.055);
    vec3 groundAmb = uHorizonColor * 0.34 + vec3(0.038);
    float ambLevel = 0.15 + 0.85 * skyLevel * (0.34 + 0.66 * uDayIntensity);
    vec3 amb = mix(groundAmb, skyAmb, hemi) * ambLevel * vAo;
    float night = clamp(1.0 - uDayIntensity * 2.1, 0.0, 1.0);
    vec3 moon = vec3(0.34, 0.44, 0.78) * max(dot(surfN, -uSunDir), 0.0) * night * skyLevel * 0.36;
    float flicker = 0.95 + 0.05 * sin(uTime * 6.8 + vWorldPos.x * 0.9 + vWorldPos.z * 0.9);
    vec3 blk = vec3(1.55, 0.78, 0.34) * pow(max(vLight.y, 1e-4), 1.75) * flicker * (0.42 + 0.58 * vAo) * 1.55;

    if (uHandLight.w > 0.01) {
        vec3 toHand = uHandLight.xyz - vWorldPos;
        float hDist = length(toHand);
        float hAtten = pow(clamp(1.0 - hDist / 11.5, 0.0, 1.0), 1.75) * uHandLight.w;
        float hFace = 0.45 + 0.55 * max(dot(surfN, safeNorm(toHand)), 0.0);
        blk += vec3(1.45, 0.80, 0.36) * hAtten * hFace * (0.5 + 0.5 * vAo);
    }

    vec3 col = diffAlbedo * (sun + amb + moon + blk);

    if (uUnderwater > 0.5 && surfN.y > 0.25 && sunVis > 0.05) {
        float c1 = noise2d(vWorldPos.xz * 1.15 + vec2(uTime * 0.45, -uTime * 0.3));
        float c2 = noise2d(vWorldPos.xz * 1.65 - vec2(uTime * 0.35, uTime * 0.52));
        float caust = smoothstep(0.62, 0.95, (c1 + c2) * 0.55) * surfN.y * sunVis;
        col += diffAlbedo * vec3(0.28, 0.62, 0.78) * caust * 0.75;
    }

    if (wetRough < 0.72) {
        vec3 h = safeNorm(uSunDir + v);
        float gloss = pow(max(dot(surfN, h), 0.0), mix(12.0, 140.0, 1.0 - wetRough));
        col += uSunTint * gloss * (1.0 - wetRough) * ndl * sunVis * 0.85;
    }

    if (wet > 0.01) {
        float ndv = max(dot(surfN, v), 0.0);
        float fresnel = 0.04 + 0.96 * pow(clamp(1.0 - ndv, 0.0, 1.0), 5.0);
        vec3 reflDir = reflect(-v, surfN);
        vec3 skyRefl = skyGradient(reflDir);
        col = mix(col, skyRefl, puddle * 0.88 * fresnel + wet * fresnel * 0.22);

        float blkLvl = pow(max(vLight.y, 0.0), 1.6);
        if (blkLvl > 0.005) {
            vec3 lanternCol = vec3(2.2, 1.25, 0.45);
            vec3 halfLantern = safeNorm(v + vec3(0.0, 1.0, 0.0));
            float lanternSpec = pow(max(dot(surfN, halfLantern), 0.0), mix(8.0, 50.0, 1.0 - wetRough));
            col += lanternCol * blkLvl * lanternSpec * (0.6 + 2.0 * puddle);
        }
    }

    return col;
}

vec3 applyDistanceFog(vec3 col, vec3 toFrag, float dist) {
    if (uUnderwater > 0.5) {
        float uwFog = 1.0 - exp(-dist * 0.075);
        vec3 uwCol = vec3(0.028, 0.165, 0.26) * (0.24 + 0.76 * uDayIntensity);
        return mix(col, uwCol, clamp(uwFog, 0.0, 0.95));
    }
    float fogT = pow(smoothstep(uFogStart, uFogEnd, dist), 1.6);
    return mix(col, skyGradient(safeNorm(toFrag)), fogT);
}

vec3 leafGlow(vec3 albedo, vec3 v, float shadow) {
    float toward = pow(max(dot(-v, uSunDir), 0.0), 2.0);
    float sunVis = vLight.x * sunPower() * mix(0.45, 1.0, shadow);
    return albedo * vec3(1.0, 1.25, 0.4) * uSunTint * toward * sunVis * 1.35;
}
`;
