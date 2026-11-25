import { GLSL_ATMOSPHERE, GLSL_NOISE } from "./voxel-glsl-common.js";
import { GLSL_FACE_BASIS, GLSL_SURFACE_LIGHT } from "./voxel-glsl-light.js";
import { GLSL_SHADOW } from "./voxel-glsl-shadow.js";
import { GLSL_WATER } from "./voxel-glsl-water.js";

const BIOME_TINT_GLSL = `
vec3 decodeBiomeTint(uint tintByte, uint flags) {
    if ((flags & 32u) == 0u) return vec3(1.0);
    float warmth = float(tintByte & 15u) / 15.0;
    float moist = float((tintByte >> 4u) & 15u) / 15.0;
    vec3 coolLush = vec3(0.82, 1.02, 0.86);
    vec3 meadow = vec3(0.95, 1.00, 0.86);
    vec3 warmDry = vec3(1.12, 0.96, 0.66);
    vec3 base = mix(coolLush, warmDry, warmth);
    return mix(base, meadow, moist * 0.55);
}
`;

export const WORLD_VS = `#version 300 es
precision highp float;
precision highp int;

layout(location = 0) in uvec2 aPacked;

uniform mat4 uViewProj;
uniform vec3 uChunkOrigin;

out vec2 vUv;
out float vAo;
out vec2 vLight;
out vec3 vWorldPos;
out vec3 vTint;
flat out uint vTexLayer;
flat out uint vFlags;
flat out uint vFace;

const vec2 CORNERS[4] = vec2[4](
    vec2(0.0, 0.0),
    vec2(1.0, 0.0),
    vec2(1.0, 1.0),
    vec2(0.0, 1.0)
);
${BIOME_TINT_GLSL}

void main() {
    uint w0 = aPacked.x;
    uint w1 = aPacked.y;
    vec3 localPos = vec3(
        float(w0 & 31u),
        float((w0 >> 5u) & 31u),
        float((w0 >> 10u) & 31u)
    );
    vFace = (w0 >> 15u) & 7u;
    float ao = float((w0 >> 18u) & 3u);
    uint uvIdx = (w0 >> 20u) & 3u;
    vTexLayer = (w0 >> 22u) & 255u;

    float sunL = float(w1 & 15u) / 15.0;
    float blkL = float((w1 >> 4u) & 15u) / 15.0;
    float qw = float((w1 >> 8u) & 31u);
    float qh = float((w1 >> 13u) & 31u);
    vFlags = (w1 >> 18u) & 63u;
    uint tintByte = (w1 >> 24u) & 255u;

    vec3 worldPos = uChunkOrigin + localPos;
    if ((vFlags & 16u) != 0u) {
        worldPos.y -= 0.14;
    }

    vWorldPos = worldPos;
    vAo = 0.42 + (ao / 3.0) * 0.58;
    vLight = vec2(sunL, blkL);
    vTint = decodeBiomeTint(tintByte, vFlags);
    vUv = CORNERS[uvIdx] * vec2(qw, qh);
    gl_Position = uViewProj * vec4(worldPos, 1.0);
}`;

export function makeWorldFs(shadowChunk) {
    return `#version 300 es
precision highp float;
precision highp sampler2DArray;
precision highp sampler2DShadow;

uniform sampler2DArray uTexArray;
uniform sampler2DArray uTexData;
uniform vec3 uCamPos;
uniform float uFogStart;
uniform float uFogEnd;
${GLSL_ATMOSPHERE}
${GLSL_FACE_BASIS}

in vec2 vUv;
in float vAo;
in vec2 vLight;
in vec3 vWorldPos;
in vec3 vTint;
flat in uint vTexLayer;
flat in uint vFlags;
flat in uint vFace;

out vec4 fragColor;

${GLSL_NOISE}
${shadowChunk}
${GLSL_SURFACE_LIGHT}
${GLSL_WATER}

void main() {
    vec2 tileUv = vUv;
    if ((vFlags & 2u) != 0u) {
        tileUv = vUv + vec2(sin(vUv.y * 3.14159 + uTime * 0.9) * 0.08, uTime * 0.12);
    }
    vec3 coord = vec3(tileUv, float(vTexLayer));
    vec4 tex = texture(uTexArray, coord);
    vec4 data = texture(uTexData, coord);

    vec3 toCam = uCamPos - vWorldPos;
    float dist = length(toCam);
    vec3 v = safeNorm(toCam);
    vec3 albedo = tex.rgb * vTint;
    albedo = mix(vec3(dot(albedo, vec3(0.3, 0.59, 0.11))), albedo, 0.80);
    vec3 col;
    float alpha = tex.a;

    if ((vFlags & 1u) != 0u) {
        col = waterSurface(albedo, v, alpha);
    } else if ((vFlags & 2u) != 0u) {
        float pulse = 1.0 + 0.2 * sin(uTime * 3.2 + vWorldPos.x * 0.7 + vWorldPos.z * 0.7);
        col = albedo * 3.2 * pulse;
        alpha = 1.0;
    } else {
        vec3 n = mapNormal(vFace, data);
        float shadow = sunShadow(vWorldPos, FACE_N[vFace]);
        col = shadeSurface(albedo, n, v, data.b, shadow, true);
        col += albedo * data.a * 2.4;
        if ((vFlags & 4u) != 0u) {
            float fresnel = pow(max(1e-4, 1.0 - max(dot(n, v), 0.0)), 3.0);
            col += skyGradient(reflect(-v, n)) * fresnel * 0.5;
            alpha = max(alpha, 0.34);
        }
    }

    col = applyDistanceFog(col, -toCam, dist);
    fragColor = vec4(col, alpha);
}`;
}

export const WORLD_FS = makeWorldFs(GLSL_SHADOW);

export const CUTOUT_VS = `#version 300 es
precision highp float;
precision highp int;

layout(location = 0) in vec3 aPos;
layout(location = 1) in vec2 aUv;
layout(location = 2) in vec2 aMeta;

uniform mat4 uViewProj;
uniform vec3 uChunkOrigin;
uniform float uTime;

out vec2 vUv;
out float vAo;
out vec2 vLight;
out vec3 vWorldPos;
out vec3 vTint;
flat out uint vTexLayer;
flat out uint vFlags;
flat out uint vFace;
${BIOME_TINT_GLSL}

void main() {
    uint mA = uint(aMeta.x + 0.5);
    uint mB = uint(aMeta.y + 0.5);
    vFace = mA & 7u;
    vTexLayer = (mA >> 3u) & 255u;
    vFlags = (mA >> 11u) & 63u;

    float sunL = float(mB & 15u) / 15.0;
    float blkL = float((mB >> 4u) & 15u) / 15.0;
    float ao = float((mB >> 8u) & 3u);
    uint tintByte = (mB >> 10u) & 255u;

    vec3 worldPos = uChunkOrigin + aPos;
    if ((vFlags & 8u) != 0u) {
        float weight = vFace == 6u ? clamp(aUv.y, 0.0, 1.0) : 1.0;
        float phase = worldPos.x * 0.72 + worldPos.z * 0.91;
        float gust = sin(uTime * 1.45 + phase) + 0.5 * sin(uTime * 2.75 + phase * 1.6);
        worldPos.x += gust * 0.036 * weight;
        worldPos.z += cos(uTime * 1.15 + phase * 1.3) * 0.03 * weight;
        worldPos.y += sin(uTime * 2.0 + phase) * 0.012 * weight;
    }

    vWorldPos = worldPos;
    vAo = 0.42 + (ao / 3.0) * 0.58;
    vLight = vec2(sunL, blkL);
    vTint = decodeBiomeTint(tintByte, vFlags);
    vUv = aUv;
    gl_Position = uViewProj * vec4(worldPos, 1.0);
}`;

export const CUTOUT_FS = `#version 300 es
precision highp float;
precision highp sampler2DArray;
precision highp sampler2DShadow;

uniform sampler2DArray uTexArray;
uniform sampler2DArray uTexData;
uniform vec3 uCamPos;
uniform float uFogStart;
uniform float uFogEnd;
${GLSL_ATMOSPHERE}
${GLSL_FACE_BASIS}

in vec2 vUv;
in float vAo;
in vec2 vLight;
in vec3 vWorldPos;
in vec3 vTint;
flat in uint vTexLayer;
flat in uint vFlags;
flat in uint vFace;

out vec4 fragColor;

${GLSL_NOISE}
${GLSL_SHADOW}
${GLSL_SURFACE_LIGHT}

void main() {
    vec3 coord = vec3(vUv, float(vTexLayer));
    vec4 tex = texture(uTexArray, coord);
    if (tex.a < 0.35) discard;
    vec4 data = texture(uTexData, coord);

    vec3 toCam = uCamPos - vWorldPos;
    float dist = length(toCam);
    vec3 v = safeNorm(toCam);
    vec3 albedo = tex.rgb * vTint;
    albedo = mix(vec3(dot(albedo, vec3(0.3, 0.59, 0.11))), albedo, 0.82);

    vec3 baseN = vFace < 6u ? FACE_N[vFace] : vec3(0.0, 1.0, 0.0);
    vec3 n = vFace < 6u ? mapNormal(vFace, data) : vec3(0.0, 1.0, 0.0);
    float shadow = sunShadow(vWorldPos, baseN);
    vec3 col = shadeSurface(albedo, n, v, data.b, shadow, false);
    if (!gl_FrontFacing && vFace < 6u) col *= 0.62;
    col += albedo * data.a * 2.8;
    if ((vFlags & 8u) != 0u) col += leafGlow(albedo, v, shadow);

    col = applyDistanceFog(col, -toCam, dist);
    fragColor = vec4(col, 1.0);
}`;
