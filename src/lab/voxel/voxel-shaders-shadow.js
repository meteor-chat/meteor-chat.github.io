export const SHADOW_VS = `#version 300 es
precision highp float;
precision highp int;

layout(location = 0) in uvec2 aPacked;

uniform mat4 uLightViewProj;
uniform vec3 uChunkOrigin;

void main() {
    uint w0 = aPacked.x;
    vec3 localPos = vec3(
        float(w0 & 31u),
        float((w0 >> 5u) & 31u),
        float((w0 >> 10u) & 31u)
    );
    gl_Position = uLightViewProj * vec4(uChunkOrigin + localPos, 1.0);
}`;

export const SHADOW_FS = `#version 300 es
precision highp float;

void main() {
}`;

export const SHADOW_CUTOUT_VS = `#version 300 es
precision highp float;
precision highp int;

layout(location = 0) in vec3 aPos;
layout(location = 1) in vec2 aUv;
layout(location = 2) in vec2 aMeta;

uniform mat4 uLightViewProj;
uniform vec3 uChunkOrigin;
uniform float uTime;

out vec2 vUv;
flat out uint vTexLayer;

void main() {
    uint mA = uint(aMeta.x + 0.5);
    uint face = mA & 7u;
    vTexLayer = (mA >> 3u) & 255u;
    uint flags = (mA >> 11u) & 63u;

    vec3 worldPos = uChunkOrigin + aPos;
    if ((flags & 8u) != 0u) {
        float weight = face == 6u ? clamp(aUv.y, 0.0, 1.0) : 1.0;
        float phase = worldPos.x * 0.72 + worldPos.z * 0.91;
        float gust = sin(uTime * 1.45 + phase) + 0.5 * sin(uTime * 2.75 + phase * 1.6);
        worldPos.x += gust * 0.036 * weight;
        worldPos.z += cos(uTime * 1.15 + phase * 1.3) * 0.03 * weight;
        worldPos.y += sin(uTime * 2.0 + phase) * 0.012 * weight;
    }

    vUv = aUv;
    gl_Position = uLightViewProj * vec4(worldPos, 1.0);
}`;

export const SHADOW_CUTOUT_FS = `#version 300 es
precision highp float;
precision highp sampler2DArray;

uniform sampler2DArray uTexArray;

in vec2 vUv;
flat in uint vTexLayer;

void main() {
    float alpha = textureLod(uTexArray, vec3(vUv, float(vTexLayer)), 0.0).a;
    if (alpha < 0.35) discard;
}`;
