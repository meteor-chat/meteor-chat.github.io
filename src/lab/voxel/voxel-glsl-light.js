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
    float skyLevel = vLight.x;
    float sunVis = skyLevel * sunPower() * shadow;
    float ndl = max(dot(n, uSunDir), 0.0);
    vec3 sun = uSunTint * (ndl * sunVis * 1.7 * mix(1.0, vAo, 0.5));
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
    vec3 col = albedo * (sun + amb + moon + blk);
    if (rough < 0.7) {
        vec3 h = normalize(uSunDir + v);
        float gloss = pow(max(dot(n, h), 0.0), mix(12.0, 120.0, 1.0 - rough));
        col += uSunTint * gloss * (1.0 - rough) * ndl * sunVis * 0.7;
    }
    return col;
}

vec3 leafGlow(vec3 albedo, vec3 v, float shadow) {
    float toward = pow(max(dot(-v, uSunDir), 0.0), 2.0);
    float sunVis = vLight.x * sunPower() * mix(0.45, 1.0, shadow);
    return albedo * vec3(1.0, 1.25, 0.4) * uSunTint * toward * sunVis * 1.4;
}
`;
