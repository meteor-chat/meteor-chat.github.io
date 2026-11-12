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
    float soft = clamp((luma - 0.92) / 0.55, 0.0, 1.0);
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

export const COMPOSITE_FS = `#version 300 es
precision highp float;

in vec2 vUv;
uniform sampler2D uSceneTex;
uniform sampler2D uBloomTex;
uniform float uTime;
uniform float uUnderwater;
out vec4 fragColor;

vec3 acesTone(vec3 x) {
    return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
    vec2 uv = vUv;
    if (uUnderwater > 0.5) {
        uv.x += sin(uv.y * 22.0 + uTime * 3.8) * 0.0045;
        uv.y += cos(uv.x * 18.0 + uTime * 3.1) * 0.0035;
    }
    vec3 sceneCol = texture(uSceneTex, uv).rgb;
    vec3 bloomCol = texture(uBloomTex, uv).rgb;
    vec3 hdr = sceneCol + bloomCol * 0.58;
    if (uUnderwater > 0.5) {
        float vig = dot(vUv - 0.5, vUv - 0.5);
        hdr = mix(hdr * vec3(0.42, 0.78, 0.96), vec3(0.05, 0.24, 0.38), clamp(vig * 0.95, 0.0, 0.65));
    }
    vec3 ldr = acesTone(hdr);
    ldr = pow(max(ldr, vec3(1e-4)), vec3(1.0 / 1.08));
    fragColor = vec4(ldr, 1.0);
}`;

export const WIRE_VS = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPos;
uniform mat4 uViewProj;
uniform vec3 uBlockPos;

void main() {
    gl_Position = uViewProj * vec4(uBlockPos + aPos * 1.006 - vec3(0.003), 1.0);
}`;

export const WIRE_FS = `#version 300 es
precision highp float;

out vec4 fragColor;

void main() {
    fragColor = vec4(0.95, 0.98, 1.0, 0.85);
}`;
