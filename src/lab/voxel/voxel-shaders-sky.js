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
    float rainFade = clamp(1.0 - uRainIntensity * 1.5, 0.0, 1.0);
    if (nightVis < 0.01 || dir.y < -0.05 || rainFade < 0.01) return sky;

    float rot = uTime * 0.004;
    float cs = cos(rot);
    float sn = sin(rot);
    vec3 rd = vec3(dir.x * cs - dir.z * sn, dir.y, dir.x * sn + dir.z * cs);
    vec3 a = abs(rd);
    vec2 faceUv;
    float faceId;
    if (a.y >= a.x && a.y >= a.z) {
        faceUv = rd.xz / max(a.y, 1e-4);
        faceId = 1.0;
    } else if (a.x >= a.z) {
        faceUv = rd.yz / max(a.x, 1e-4);
        faceId = rd.x > 0.0 ? 2.0 : 3.0;
    } else {
        faceUv = rd.xy / max(a.z, 1e-4);
        faceId = rd.z > 0.0 ? 4.0 : 5.0;
    }

    vec2 sUv = faceUv * 42.0;
    vec2 cell = floor(sUv);
    vec2 f = fract(sUv) - 0.5;
    float rnd = hash21(cell + vec2(faceId * 37.3, faceId * 91.7));
    if (rnd < 0.96) return sky;
    vec2 jitter = (vec2(hash21(cell + 13.7), hash21(cell + 29.1)) - 0.5) * 0.45;
    float twinkle = 0.65 + 0.35 * sin(uTime * 2.4 + rnd * 62.0);
    float star = smoothstep(0.18, 0.0, length(f - jitter));
    vec3 tint = mix(vec3(0.78, 0.88, 1.0), vec3(1.0, 0.94, 0.82), fract(rnd * 23.0));
    return sky + star * nightVis * twinkle * rainFade * tint;
}

vec3 addCelestials(vec3 sky, vec3 dir) {
    float horizonFade = smoothstep(-0.04, 0.03, dir.y);
    float rainFade = clamp(1.0 - uRainIntensity * 0.9, 0.0, 1.0);
    vec3 helper = abs(uSunDir.y) > 0.95 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
    vec3 right = safeNorm(cross(uSunDir, helper));
    float sz = dot(dir, uSunDir);
    if (sz > 0.0) {
        vec3 up = cross(right, uSunDir);
        vec2 q = vec2(dot(dir, right), dot(dir, up)) / sz;
        float box = max(abs(q.x), abs(q.y));
        sky += uSunTint * (1.0 - smoothstep(0.058, 0.064, box)) * 8.5 * horizonFade * rainFade;
    }
    vec3 moonDir = -uSunDir;
    float mz = dot(dir, moonDir);
    float nightVis = clamp(1.0 - uDayIntensity * 2.0, 0.0, 1.0);
    if (mz > 0.0 && nightVis > 0.01) {
        vec3 up = cross(right, moonDir);
        vec2 q = vec2(dot(dir, right), dot(dir, up)) / mz;
        float box = max(abs(q.x), abs(q.y));
        float mask = 1.0 - smoothstep(0.046, 0.05, box);
        if (mask > 0.001) {
            vec2 mUv = (q / 0.048) * 0.5 + 0.5;
            vec2 pix = floor(mUv * 8.0) / 8.0;
            float crater = 0.72 + 0.28 * noise2d(pix * 6.5 + 3.1);
            float phase = fract(uTime * 0.002 + 0.12);
            float lit = smoothstep(-0.15, 0.15, (mUv.x - 0.5) + cos(phase * 6.28318) * 0.28);
            float faceShade = mix(0.22, 1.0, lit) * crater;
            sky += vec3(0.76, 0.84, 1.0) * mask * faceShade * 2.6 * nightVis * horizonFade * rainFade;
        }
    }
    return sky;
}

vec3 addClouds(vec3 sky, vec3 dir) {
    if (dir.y < 0.02) return sky;
    float fade = smoothstep(0.02, 0.22, dir.y);
    vec2 plane = dir.xz / (dir.y + 0.1);
    vec2 sunShift = safeNorm2(uSunDir.xz) * 0.16;
    float dayScale = 0.08 + 0.92 * uDayIntensity;
    vec3 litCol = mix(vec3(0.92, 0.94, 0.98), uSunTint, 0.35) * (0.14 + 0.96 * uDayIntensity);
    vec3 shadowCol = mix(uSkyColor, vec3(0.32, 0.36, 0.48), 0.45) * (0.12 + 0.5 * uDayIntensity);
    vec3 stormLit = vec3(0.16, 0.18, 0.22) * dayScale;
    vec3 stormDark = vec3(0.03, 0.04, 0.06) * dayScale;
    litCol = mix(litCol, stormLit, uRainIntensity * 0.78);
    shadowCol = mix(shadowCol, stormDark, uRainIntensity * 0.85);
    for (int i = 0; i < 2; i += 1) {
        float scale = i == 0 ? 0.85 : 1.9;
        float speed = i == 0 ? 0.006 : 0.014;
        float cover = i == 0 ? 0.52 : 0.46;
        float stormCover = mix(cover, 0.28, uRainIntensity);
        vec2 p = plane * scale + vec2(uTime * speed, uTime * speed * 0.35) + float(i) * 17.0;
        float n = fbm2(p);
        float nSun = fbm2(p + sunShift);
        float dens = smoothstep(stormCover, stormCover + 0.18, n);
        float core = smoothstep(stormCover, stormCover + 0.35, n);
        float edge = clamp(0.55 + (n - nSun) * 3.2, 0.0, 1.0);
        vec3 col = mix(shadowCol, litCol, edge * (1.0 - 0.45 * core));
        float silver = pow(max(dot(dir, uSunDir), 0.0), 5.0) * (1.0 - core) * 0.8;
        col += uSunTint * silver * uDayIntensity * (1.0 - uRainIntensity * 0.7);
        sky = mix(sky, col, dens * fade * (i == 0 ? mix(0.55, 0.88, uRainIntensity) : 0.85));
    }
    return sky;
}

void main() {
    vec2 ndc = vUv * 2.0 - 1.0;
    vec3 dir = safeNorm(uCamForward + uCamRight * (ndc.x * uTanFov.x) + uCamUp * (ndc.y * uTanFov.y));
    vec3 sky = skyGradient(dir);
    sky = addStars(sky, dir);
    sky = addCelestials(sky, dir);
    sky = addClouds(sky, dir);
    fragColor = vec4(sky, 1.0);
}`;
