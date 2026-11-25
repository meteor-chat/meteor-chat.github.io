import { CAMERA_FAR, CAMERA_NEAR } from "./voxel-camera.js";

const NEAR = CAMERA_NEAR.toFixed(2);
const FAR = CAMERA_FAR.toFixed(1);
const SUM = (CAMERA_FAR + CAMERA_NEAR).toFixed(2);
const DIFF = (CAMERA_FAR - CAMERA_NEAR).toFixed(2);

export const GLSL_WATER = `
uniform sampler2D uSceneDepth;
uniform vec2 uResolution;

float linearDepth(float d) {
    float z = d * 2.0 - 1.0;
    return 2.0 * ${NEAR} * ${FAR} / (${SUM} - z * ${DIFF});
}

vec3 waterSurface(vec3 albedo, vec3 v, out float alpha) {
    vec2 p = vWorldPos.xz;
    float t = uTime;
    float gx = noise2d(p * 0.8 + vec2(t * 0.30, t * 0.18)) + 0.5 * noise2d(p * 2.1 - vec2(t * 0.45, t * 0.33)) - 0.75;
    float gz = noise2d(p * 0.8 + vec2(9.3 - t * 0.22, 4.1 + t * 0.27)) + 0.5 * noise2d(p * 2.1 + vec2(t * 0.41, 1.7 - t * 0.37)) - 0.75;
    if (uRainIntensity > 0.02 && uUnderwater < 0.5) {
        vec2 ripUv = p * 1.8;
        vec2 rCell = floor(ripUv);
        vec2 rF = fract(ripUv) - 0.5;
        vec2 ripDir = vec2(0.0);
        for (int dy = -1; dy <= 1; dy += 1) {
            for (int dx = -1; dx <= 1; dx += 1) {
                vec2 cellOff = vec2(float(dx), float(dy));
                vec2 cId = rCell + cellOff;
                float dHash = hash21(cId);
                float dAge = fract(t * 1.6 + dHash * 5.7);
                vec2 dPos = (vec2(hash21(cId + 1.3), hash21(cId + 4.7)) - 0.5) * 0.6;
                vec2 toD = rF - cellOff - dPos;
                float dLen = length(toD);
                float ringDist = abs(dLen - dAge * 0.75);
                float wave = sin(ringDist * 28.0) * smoothstep(0.18, 0.0, ringDist) * (1.0 - dAge);
                ripDir += safeNorm2(toD) * wave;
            }
        }
        gx += ripDir.x * 0.12 * uRainIntensity;
        gz += ripDir.y * 0.12 * uRainIntensity;
    }

    vec3 baseN = FACE_N[vFace];
    if (!gl_FrontFacing) baseN = -baseN;
    vec3 n = safeNorm(baseN + vec3(gx, 0.0, gz) * 0.42);
    vec3 r = reflect(-v, n);
    float ndv = max(dot(n, v), 0.0);
    float fresnel = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);
    float shadow = sunShadow(vWorldPos, FACE_N[vFace]);
    float lightLevel = 0.22 + vLight.x * (0.3 + 0.7 * sunPower()) * mix(0.6, 1.0, shadow) + vLight.y * 0.85;

    if (!gl_FrontFacing && uUnderwater > 0.5) {
        vec3 skyThrough = skyGradient(safeNorm(vec3(-v.x, abs(v.y) + 0.15, -v.z)));
        vec3 col = mix(skyThrough * vec3(0.55, 0.88, 0.98), vec3(0.03, 0.18, 0.28) * lightLevel, fresnel * 0.8);
        alpha = clamp(0.32 + fresnel * 0.58, 0.2, 0.92);
        return col;
    }

    float floorDepth = linearDepth(texture(uSceneDepth, gl_FragCoord.xy / max(uResolution, vec2(1.0))).r);
    float thick = max(floorDepth - linearDepth(gl_FragCoord.z), 0.0);
    float deep = 1.0 - exp(-thick * 0.30);
    vec3 shallowCol = albedo * lightLevel * 1.45;
    vec3 deepCol = vec3(0.005, 0.055, 0.11) * lightLevel;
    vec3 col = mix(mix(shallowCol, deepCol, deep), skyGradient(r), fresnel * 0.88 + 0.04);

    vec3 h = safeNorm(uSunDir + v);
    float nh = max(dot(n, h), 0.0);
    float glint = pow(nh, 220.0) * 5.8 + pow(nh, 36.0) * 0.18;
    col += uSunTint * glint * sunPower() * shadow * vLight.x;

    float foam = (1.0 - smoothstep(0.0, 0.55, thick)) * smoothstep(0.35, 0.7, noise2d(p * 3.0 + t * 0.4));
    col = mix(col, vec3(0.8, 0.86, 0.92) * lightLevel, foam * 0.52);
    alpha = clamp(mix(0.32, 0.95, deep) + fresnel * 0.38 + foam * 0.48, 0.0, 0.96);
    return col;
}
`;
