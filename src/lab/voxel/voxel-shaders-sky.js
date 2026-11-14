import { GLSL_ATMOSPHERE, GLSL_NOISE } from "./voxel-glsl-common.js";

export const SKY_VS = `#version 300 es
precision highp float;

out vec2 vUv;

void main() {
    vec2 pos = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
    vUv = pos;
    gl_Position = vec4(pos * 2.0 - 1.0, 1.0, 1.0);
}`;

export const SKY_FS = `#version 300 es
precision highp float;

in vec2 vUv;
uniform vec3 uCamForward;
uniform vec3 uCamRight;
uniform vec3 uCamUp;
uniform vec2 uTanFov;
${GLSL_ATMOSPHERE}
${GLSL_NOISE}

out vec4 fragColor;

vec3 addStars(vec3 sky, vec3 dir) {
    float nightVis = clamp(1.0 - uDayIntensity * 2.1, 0.0, 1.0);
    if (nightVis < 0.01 || dir.y < -0.05) return sky;
    vec2 sUv = vec2(atan(dir.z, dir.x) * 32.0, asin(clamp(dir.y, -1.0, 1.0)) * 32.0);
    vec2 cell = floor(sUv);
    vec2 f = fract(sUv) - 0.5;
    float rnd = hash21(cell);
    if (rnd < 0.945) return sky;
    float twinkle = 0.65 + 0.35 * sin(uTime * 2.5 + rnd * 62.0);
    return sky + smoothstep(0.22, 0.0, length(f)) * nightVis * twinkle * vec3(0.85, 0.92, 1.0);
}

vec3 addCelestials(vec3 sky, vec3 dir) {
    float horizonFade = smoothstep(-0.04, 0.03, dir.y);
    vec3 helper = abs(uSunDir.y) > 0.95 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(uSunDir, helper));
    float sz = dot(dir, uSunDir);
    if (sz > 0.0) {
        vec3 up = cross(right, uSunDir);
        vec2 q = vec2(dot(dir, right), dot(dir, up)) / sz;
        float box = max(abs(q.x), abs(q.y));
        sky += uSunTint * (1.0 - smoothstep(0.058, 0.064, box)) * 9.0 * horizonFade;
    }
    vec3 moonDir = -uSunDir;
    float mz = dot(dir, moonDir);
    float nightVis = clamp(1.0 - uDayIntensity * 2.1, 0.0, 1.0);
    if (mz > 0.0 && nightVis > 0.01) {
        vec3 up = cross(right, moonDir);
        vec2 q = vec2(dot(dir, right), dot(dir, up)) / mz;
        float box = max(abs(q.x), abs(q.y));
        sky += vec3(0.72, 0.8, 1.0) * (1.0 - smoothstep(0.046, 0.05, box)) * 2.4 * nightVis * horizonFade;
    }
    return sky;
}

vec3 addClouds(vec3 sky, vec3 dir) {
    if (dir.y < 0.02) return sky;
    float fade = smoothstep(0.02, 0.22, dir.y);
    vec2 plane = dir.xz / (dir.y + 0.1);
    vec2 sunShift = normalize(uSunDir.xz + vec2(1e-4)) * 0.16;
    vec3 litCol = mix(vec3(0.95, 0.96, 1.0), uSunTint, 0.35) * (0.28 + 0.95 * uDayIntensity);
    vec3 shadowCol = mix(uSkyColor, vec3(0.5, 0.55, 0.7), 0.45) * (0.22 + 0.5 * uDayIntensity);
    for (int i = 0; i < 2; i += 1) {
        float scale = i == 0 ? 0.85 : 1.9;
        float speed = i == 0 ? 0.006 : 0.014;
        float cover = i == 0 ? 0.52 : 0.46;
        vec2 p = plane * scale + vec2(uTime * speed, uTime * speed * 0.35) + float(i) * 17.0;
        float n = fbm2(p);
        float nSun = fbm2(p + sunShift);
        float dens = smoothstep(cover, cover + 0.2, n);
        float core = smoothstep(cover, cover + 0.35, n);
        float edge = clamp(0.55 + (n - nSun) * 3.2, 0.0, 1.0);
        vec3 col = mix(shadowCol, litCol, edge * (1.0 - 0.45 * core));
        float silver = pow(max(dot(dir, uSunDir), 0.0), 5.0) * (1.0 - core) * 0.8;
        col += uSunTint * silver * uDayIntensity;
        sky = mix(sky, col, dens * fade * (i == 0 ? 0.55 : 0.85));
    }
    return sky;
}

void main() {
    vec2 ndc = vUv * 2.0 - 1.0;
    vec3 dir = normalize(uCamForward + uCamRight * (ndc.x * uTanFov.x) + uCamUp * (ndc.y * uTanFov.y));
    vec3 sky = skyGradient(dir);
    sky = addStars(sky, dir);
    sky = addCelestials(sky, dir);
    sky = addClouds(sky, dir);
    fragColor = vec4(sky, 1.0);
}`;
