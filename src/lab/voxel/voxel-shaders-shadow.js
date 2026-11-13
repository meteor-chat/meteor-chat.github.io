export const SHADOW_VS = `#version 300 es
precision highp float;
precision highp int;

layout(location = 0) in uvec2 aPacked;

uniform mat4 uLightViewProj;
uniform vec3 uChunkOrigin;

out vec2 vUv;
flat out uint vTexLayer;
flat out uint vFlags;

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
    uint uvIdx = (w0 >> 20u) & 3u;
    vTexLayer = (w0 >> 22u) & 255u;
    float qw = float((w1 >> 8u) & 31u);
    float qh = float((w1 >> 13u) & 31u);
    vFlags = (w1 >> 18u) & 15u;
    vUv = CORNERS[uvIdx] * vec2(qw, qh);
    gl_Position = uLightViewProj * vec4(uChunkOrigin + localPos, 1.0);
}`;

export const SHADOW_FS = `#version 300 es
precision highp float;
precision highp sampler2DArray;

uniform sampler2DArray uTexArray;

in vec2 vUv;
flat in uint vTexLayer;
flat in uint vFlags;

void main() {
    if ((vFlags & 8u) != 0u) {
        float alpha = textureLod(uTexArray, vec3(fract(vUv), float(vTexLayer)), 0.0).a;
        if (alpha < 0.25) discard;
    }
}`;
