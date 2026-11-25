import { CAMERA_FAR, CAMERA_NEAR } from "./voxel-camera.js";

const TWO_NF = (2 * CAMERA_NEAR * CAMERA_FAR).toFixed(2);
const SUM = (CAMERA_FAR + CAMERA_NEAR).toFixed(2);
const DIFF = (CAMERA_FAR - CAMERA_NEAR).toFixed(2);

export const QUAD_VS = `#version 300 es
precision highp float;

out vec2 vUv;

void main() {
    vec2 pos = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
    vUv = pos;
    gl_Position = vec4(pos * 2.0 - 1.0, 0.0, 1.0);
}`;

export const BLOOM_EXTRACT_FS = `#version 300 es
precision highp float;

in vec2 vUv;
uniform sampler2D uSceneTex;
out vec4 fragColor;

void main() {
    vec3 col = texture(uSceneTex, vUv).rgb;
    float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
    float soft = clamp((luma - 0.95) / 0.55, 0.0, 1.0);
    fragColor = vec4(col * soft, 1.0);
}`;

export const BLOOM_BLUR_FS = `#version 300 es
precision highp float;

in vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uStep;
out vec4 fragColor;

void main() {
    const float w[5] = float[5](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);
    vec3 sum = texture(uTex, vUv).rgb * w[0];
    for (int i = 1; i < 5; i += 1) {
        vec2 off = uStep * float(i);
        sum += texture(uTex, vUv + off).rgb * w[i];
        sum += texture(uTex, vUv - off).rgb * w[i];
    }
    fragColor = vec4(sum, 1.0);
}`;

export const RAYS_FS = `#version 300 es
precision highp float;

in vec2 vUv;
uniform sampler2D uSceneTex;
uniform sampler2D uDepthTex;
uniform vec2 uSunUv;
out vec4 fragColor;

float raySource(vec2 uv) {
    float sky = step(0.99999, texture(uDepthTex, uv).r);
    float luma = dot(texture(uSceneTex, uv).rgb, vec3(0.2126, 0.7152, 0.0722));
    return sky * min(max(luma - 0.7, 0.0), 6.0);
}

void main() {
    vec2 delta = (uSunUv - vUv) * (0.9 / 28.0);
    vec2 uv = vUv;
    float illum = 1.0;
    float sum = 0.0;
    for (int i = 0; i < 28; i += 1) {
        uv += delta;
        sum += raySource(uv) * illum;
        illum *= 0.955;
    }
    fragColor = vec4(vec3(sum / 28.0), 1.0);
}`;

export const COMPOSITE_FS = `#version 300 es
precision highp float;

in vec2 vUv;
uniform sampler2D uSceneTex;
uniform sampler2D uBloomTex;
uniform sampler2D uRaysTex;
uniform sampler2D uDepthTex;
uniform vec3 uRaysColor;
uniform vec2 uTexelSize;
uniform float uTime;
uniform float uUnderwater;
uniform float uRainIntensity;
uniform float uRainVis;
uniform float uDayIntensity;
uniform vec3 uCamPos;
uniform vec3 uCamForward;
uniform vec3 uCamRight;
uniform vec3 uCamUp;
uniform vec2 uTanFov;
out vec4 fragColor;

vec3 acesTone(vec3 x) {
    return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

float lumaOf(vec3 c) {
    return dot(c, vec3(0.299, 0.587, 0.114));
}

vec3 sampleFxaa(vec2 uv) {
    vec3 cM = texture(uSceneTex, uv).rgb;
    vec3 cNW = texture(uSceneTex, uv + vec2(-uTexelSize.x, -uTexelSize.y)).rgb;
    vec3 cNE = texture(uSceneTex, uv + vec2(uTexelSize.x, -uTexelSize.y)).rgb;
    vec3 cSW = texture(uSceneTex, uv + vec2(-uTexelSize.x, uTexelSize.y)).rgb;
    vec3 cSE = texture(uSceneTex, uv + vec2(uTexelSize.x, uTexelSize.y)).rgb;

    float lM = lumaOf(cM);
    float lNW = lumaOf(cNW);
    float lNE = lumaOf(cNE);
    float lSW = lumaOf(cSW);
    float lSE = lumaOf(cSE);

    float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE)));
    float lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
    float range = lMax - lMin;
    if (range < max(0.08, lMax * 0.16)) return cM;

    vec2 dir;
    dir.x = -((lNW + lNE) - (lSW + lSE));
    dir.y = (lNW + lSW) - (lNE + lSE);
    float dirReduce = max((lNW + lNE + lSW + lSE) * 0.03125, 0.0078125);
    float rcpMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
    dir = clamp(dir * rcpMin, vec2(-2.5), vec2(2.5)) * uTexelSize;

    vec3 rgbA = 0.5 * (
        texture(uSceneTex, uv + dir * (1.0 / 3.0 - 0.5)).rgb +
        texture(uSceneTex, uv + dir * (2.0 / 3.0 - 0.5)).rgb
    );
    vec3 rgbB = rgbA * 0.5 + 0.25 * (
        texture(uSceneTex, uv + dir * -0.5).rgb +
        texture(uSceneTex, uv + dir * 0.5).rgb
    );
    float lB = lumaOf(rgbB);
    return (lB < lMin || lB > lMax) ? rgbA : rgbB;
}

vec3 colorGrade(vec3 c, float rain) {
    float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = mix(vec3(luma), c, mix(1.08, 0.94, rain));
    c = mix(c, c * c * (3.0 - 2.0 * c), mix(0.24, 0.14, rain));
    vec3 shadowTint = mix(vec3(0.95, 0.98, 1.03), vec3(0.92, 0.95, 1.02), rain);
    vec3 highTint = mix(vec3(1.03, 1.01, 0.97), vec3(1.02, 1.02, 1.00), rain);
    return clamp(c * mix(shadowTint, highTint, smoothstep(0.1, 0.8, luma)), 0.0, 1.0);
}

float calcLinearDepth(float zBuf) {
    float z = zBuf * 2.0 - 1.0;
    return ${TWO_NF} / (${SUM} - z * ${DIFF});
}

float dropSlice(vec3 p, vec3 camRight, float scale, float speed, float threshold) {
    float horiz = dot(p, camRight);
    float depthIdx = floor(dot(p, vec3(camRight.z, 0.0, -camRight.x)) * 0.5);
    vec2 st = vec2(horiz * scale + depthIdx * 3.17 + uTime * 0.65, (p.y + uTime * speed) * (scale * 0.26));
    vec2 cell = floor(st);
    vec2 f = fract(st);
    float h = fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
    if (h < threshold) return 0.0;
    float profile = exp(-abs(f.x - 0.5) * 16.0);
    float lenProfile = smoothstep(0.0, 0.18, f.y) * pow(1.0 - f.y, 0.75);
    return profile * lenProfile;
}

void main() {
    vec2 uv = vUv;
    if (uUnderwater > 0.5) {
        vec2 edge = smoothstep(vec2(0.0), vec2(0.06), vUv) * smoothstep(vec2(0.0), vec2(0.06), 1.0 - vUv);
        float wMask = edge.x * edge.y;
        uv.x += sin(uv.y * 22.0 + uTime * 3.8) * 0.004 * wMask;
        uv.y += cos(uv.x * 18.0 + uTime * 3.1) * 0.003 * wMask;
        uv = clamp(uv, vec2(0.001), vec2(0.999));
    }
    vec3 sceneCol = sampleFxaa(uv);
    vec3 bloomCol = texture(uBloomTex, uv).rgb;
    vec3 hdr = sceneCol + bloomCol * 0.52 + uRaysColor * texture(uRaysTex, uv).r;
    if (uUnderwater > 0.5) {
        float vig = dot(vUv - 0.5, vUv - 0.5);
        hdr = mix(hdr * vec3(0.55, 0.85, 0.98), vec3(0.04, 0.22, 0.34), clamp(vig * 0.85, 0.0, 0.55));
    }
    vec3 ldr = acesTone(hdr);
    ldr = pow(max(ldr, vec3(1e-4)), vec3(1.0 / 2.2));
    ldr = colorGrade(ldr, uRainIntensity);

    if (uRainIntensity > 0.01 && uRainVis > 0.01 && uUnderwater < 0.5) {
        vec2 ndc = vUv * 2.0 - 1.0;
        vec3 rawRay = uCamForward + uCamRight * (ndc.x * uTanFov.x) + uCamUp * (ndc.y * uTanFov.y);
        vec3 ray = rawRay * inversesqrt(max(dot(rawRay, rawRay), 1e-8));
        float rawDepth = texture(uDepthTex, vUv).r;
        float viewZ = calcLinearDepth(rawDepth);
        float rayDist = viewZ / max(dot(ray, uCamForward), 0.15);

        float rAccum = 0.0;
        const float dists[4] = float[4](1.9, 4.4, 9.8, 18.5);
        const float scales[4] = float[4](3.4, 2.2, 1.4, 0.9);
        const float speeds[4] = float[4](30.0, 27.0, 24.0, 21.0);
        const float thrs[4] = float[4](0.87, 0.84, 0.81, 0.78);
        const float weights[4] = float[4](0.38, 0.28, 0.20, 0.14);

        for (int i = 0; i < 4; i += 1) {
            float d = dists[i];
            if (d < rayDist) {
                vec3 p = uCamPos + ray * d;
                rAccum += dropSlice(p, uCamRight, scales[i], speeds[i], thrs[i]) * weights[i];
            }
        }

        float lightScale = 0.22 + 0.78 * uDayIntensity;
        vec3 rainColor = mix(vec3(0.86, 0.92, 1.0), vec3(0.64, 0.72, 0.84), smoothstep(0.0, 20.0, rayDist)) * lightScale;
        ldr += rainColor * rAccum * uRainIntensity * uRainVis * 0.82;
    }

    vec2 centered = vUv - 0.5;
    float vigK = mix(0.45, 0.58, uRainIntensity);
    ldr *= 1.0 - dot(centered, centered) * vigK;
    fragColor = vec4(ldr, 1.0);
}`;

export const WIRE_VS = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPos;
uniform mat4 uViewProj;
uniform vec3 uBlockPos;

void main() {
    gl_Position = uViewProj * vec4(uBlockPos + aPos * 1.004 - vec3(0.002), 1.0);
}`;

export const WIRE_FS = `#version 300 es
precision highp float;

out vec4 fragColor;

void main() {
    fragColor = vec4(0.05, 0.06, 0.08, 0.62);
}`;

export const CRACK_VS = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPos;
layout(location = 1) in vec2 aUv;

uniform mat4 uViewProj;
uniform vec3 uBlockPos;

out vec2 vUv;

void main() {
    vUv = aUv;
    gl_Position = uViewProj * vec4(uBlockPos + aPos * 1.005 - vec3(0.0025), 1.0);
}`;

export const CRACK_FS = `#version 300 es
precision highp float;

in vec2 vUv;
uniform float uProgress;
out vec4 fragColor;

void main() {
    vec2 g = floor(vUv * 16.0) / 16.0 - 0.5;
    float dist = length(g);
    float ang = atan(g.y, g.x);
    float spoke = abs(sin(ang * 5.0 + dist * 10.0));
    float ring = abs(sin(dist * 24.0));
    float web = min(spoke, ring * 1.35);
    float reach = uProgress * 0.75;
    float mask = step(dist, reach) * step(web, 0.14 + uProgress * 0.24);
    if (mask < 0.5) discard;
    fragColor = vec4(0.04, 0.04, 0.05, 0.78);
}`;

export const PARTICLE_VS = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPos;
layout(location = 1) in vec4 aColor;
layout(location = 2) in float aGlow;

uniform mat4 uViewProj;

out vec4 vColor;
out float vGlow;

void main() {
    vColor = aColor;
    vGlow = aGlow;
    gl_Position = uViewProj * vec4(aPos, 1.0);
}`;

export const PARTICLE_FS = `#version 300 es
precision highp float;

in vec4 vColor;
in float vGlow;
uniform float uLightScale;
out vec4 fragColor;

void main() {
    vec3 col = vColor.rgb * mix(uLightScale, 2.4, vGlow);
    fragColor = vec4(col, vColor.a);
}`;

export const HAND_VS = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPos;
layout(location = 1) in vec2 aUv;
layout(location = 2) in vec3 aMeta;

uniform mat4 uProj;
uniform mat4 uModel;

out vec2 vUv;
out float vLayer;
out float vShade;
out float vGlow;

void main() {
    vUv = aUv;
    vLayer = floor(aMeta.x + 0.5);
    vShade = aMeta.y;
    vGlow = aMeta.z;
    gl_Position = uProj * uModel * vec4(aPos, 1.0);
}`;

export const HAND_FS = `#version 300 es
precision highp float;
precision highp sampler2DArray;

uniform sampler2DArray uTexArray;
uniform vec3 uHandTint;

in vec2 vUv;
in float vLayer;
in float vShade;
in float vGlow;

out vec4 fragColor;

void main() {
    vec4 tex = texture(uTexArray, vec3(vUv, vLayer));
    if (tex.a < 0.35) discard;
    vec3 col = tex.rgb * mix(uHandTint * vShade, vec3(2.2), vGlow);
    fragColor = vec4(col, 1.0);
}`;
