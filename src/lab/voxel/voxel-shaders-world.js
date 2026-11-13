import { GLSL_ATMOSPHERE, GLSL_NOISE } from "./voxel-glsl-common.js";
import { GLSL_FACE_BASIS, GLSL_SURFACE_LIGHT } from "./voxel-glsl-light.js";
import { GLSL_SHADOW } from "./voxel-glsl-shadow.js";
import { GLSL_WATER } from "./voxel-glsl-water.js";

export const WORLD_VS = `#version 300 es
precision highp float;
precision highp int;

layout(location = 0) in uvec2 aPacked;

uniform mat4 uViewProj;
uniform vec3 uChunkOrigin;
uniform float uTime;

out vec2 vUv;
out float vAo;
out vec2 vLight;
out vec3 vWorldPos;
flat out uint vTexLayer;
flat out uint vFlags;
flat out uint vFace;

const vec2 CORNERS[4] = vec2[4](
    vec2(0.0, 0.0),
    vec2(1.0, 0.0),
    vec2(1.0, 1.0),
    vec2(0.0, 1.0)
);

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
    vFlags = (w1 >> 18u) & 15u;

    vec3 worldPos = uChunkOrigin + localPos;
    if ((vFlags & 1u) != 0u) {
        float wWave = 0.05 * sin(worldPos.x * 1.15 + uTime * 2.4) * cos(worldPos.z * 1.15 + uTime * 1.8);
        worldPos.y -= 0.14 - wWave;
    }
    if ((vFlags & 8u) != 0u) {
        float phase = worldPos.x * 0.7 + worldPos.z * 0.9;
        float gust = sin(uTime * 1.4 + phase) + 0.5 * sin(uTime * 2.7 + phase * 1.7);
        worldPos.x += gust * 0.035;
        worldPos.z += cos(uTime * 1.1 + phase * 1.3) * 0.03;
        worldPos.y += sin(uTime * 2.0 + phase) * 0.015;
    }

    vWorldPos = worldPos;
    vAo = 0.42 + (ao / 3.0) * 0.58;
    vLight = vec2(sunL, blkL);
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
flat in uint vTexLayer;
flat in uint vFlags;
flat in uint vFace;

out vec4 fragColor;

${GLSL_NOISE}
${shadowChunk}
${GLSL_SURFACE_LIGHT}

${GLSL_WATER}

void main() {
    vec2 tileUv = fract(vUv);
    if ((vFlags & 2u) != 0u) {
        tileUv = fract(vUv + vec2(sin(vUv.y * 3.14 + uTime * 0.9) * 0.08, uTime * 0.12));
    }
    vec3 coord = vec3(tileUv, float(vTexLayer));
    vec4 tex = texture(uTexArray, coord);
    if ((vFlags & 8u) != 0u && tex.a < 0.25) discard;
    vec4 data = texture(uTexData, coord);

    vec3 v = normalize(uCamPos - vWorldPos);
    vec3 albedo = pow(tex.rgb, vec3(2.2));
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
        col = shadeSurface(albedo, n, v, data.b, shadow);
        col += albedo * data.a * 2.4;
        if ((vFlags & 8u) != 0u) col += leafGlow(albedo, v, shadow);
        if ((vFlags & 4u) != 0u) {
            float fresnel = pow(max(1e-4, 1.0 - max(dot(n, v), 0.0)), 3.0);
            col += skyGradient(reflect(-v, n)) * fresnel * 0.5;
            alpha = max(alpha, 0.34);
        }
    }

    float dist = length(uCamPos - vWorldPos);
    float fogT = pow(smoothstep(uFogStart, uFogEnd, dist), 1.6);
    col = mix(col, skyGradient(normalize(vWorldPos - uCamPos)), fogT);
    fragColor = vec4(col, alpha);
}`;
}

export const WORLD_FS = makeWorldFs(GLSL_SHADOW);
