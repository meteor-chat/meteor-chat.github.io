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
    vec3 n = normalize(FACE_N[vFace] + vec3(gx, 0.0, gz) * 0.45);
    vec3 r = reflect(-v, n);
    float fresnel = 0.02 + 0.98 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
    float shadow = sunShadow(vWorldPos, FACE_N[vFace]);
    float lightLevel = 0.2 + vLight.x * (0.3 + 0.7 * sunPower()) * mix(0.6, 1.0, shadow) + vLight.y * 0.8;

    float floorDepth = linearDepth(texture(uSceneDepth, gl_FragCoord.xy / uResolution).r);
    float thick = max(floorDepth - linearDepth(gl_FragCoord.z), 0.0);
    float deep = 1.0 - exp(-thick * 0.32);
    vec3 shallowCol = albedo * lightLevel * 1.5;
    vec3 deepCol = vec3(0.004, 0.05, 0.1) * lightLevel;
    vec3 col = mix(mix(shallowCol, deepCol, deep), skyGradient(r), fresnel * 0.9 + 0.04);

    vec3 h = normalize(uSunDir + v);
    float nh = max(dot(n, h), 0.0);
    float glint = pow(nh, 220.0) * 6.0 + pow(nh, 36.0) * 0.18;
    col += uSunTint * glint * sunPower() * shadow * vLight.x;

    float foam = (1.0 - smoothstep(0.0, 0.55, thick)) * smoothstep(0.35, 0.7, noise2d(p * 3.0 + t * 0.4));
    col = mix(col, vec3(0.8, 0.85, 0.9) * lightLevel, foam * 0.55);
    alpha = clamp(mix(0.3, 0.96, deep) + fresnel * 0.4 + foam * 0.5, 0.0, 0.97);
    return col;
}
`;
