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
uniform float uTime;
uniform float uUnderwater;
uniform float uRainIntensity;
uniform vec3 uCamPos;
uniform vec3 uCamForward;
uniform vec3 uCamRight;
uniform vec3 uCamUp;
uniform vec2 uTanFov;
out vec4 fragColor;

vec3 acesTone(vec3 x) {
    return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

vec3 colorGrade(vec3 c, float rain) {
    float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = mix(vec3(luma), c, mix(1.1, 0.92, rain));
    c = mix(c, c * c * (3.0 - 2.0 * c), mix(0.3, 0.45, rain));
    vec3 shadowTint = mix(vec3(0.93, 0.99, 1.07), vec3(0.85, 0.92, 1.05), rain);
    vec3 highTint = mix(vec3(1.05, 1.02, 0.95), vec3(1.08, 1.04, 0.96), rain);
    return clamp(c * mix(shadowTint, highTint, smoothstep(0.1, 0.8, luma)), 0.0, 1.0);
}

float calcLinearDepth(float zBuf) {
    float z = zBuf * 2.0 - 1.0;
    return 0.2 / (1000.1 - z * 999.9);
}

float dropSlice(vec3 p, float scale, float speed, float threshold) {
    vec2 st = vec2(p.x * scale + p.z * (scale * 0.35) + uTime * 1.5, (p.y - uTime * speed) * (scale * 2.5));
    vec2 cell = floor(st);
    vec2 f = fract(st);
    float h = fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
    if (h < threshold) return 0.0;
    float profile = smoothstep(0.0, 0.2, f.x) * smoothstep(1.0, 0.8, f.x);
    return profile * pow(f.y, 2.6);
}

void main() {
    vec2 uv = vUv;
    if (uUnderwater > 0.5) {
        uv.x += sin(uv.y * 22.0 + uTime * 3.8) * 0.0045;
        uv.y += cos(uv.x * 18.0 + uTime * 3.1) * 0.0035;
    } else if (uRainIntensity > 0.05) {
        vec2 dropUv = vUv * 14.0;
        vec2 dId = floor(dropUv);
        float dRnd = fract(sin(dot(dId, vec2(27.1, 83.3))) * 41235.1);
        if (dRnd > 0.93) {
            vec2 dF = fract(dropUv) - 0.5;
            float drop = smoothstep(0.35, 0.05, length(dF));
            uv += normalize(dF + 1e-4) * drop * 0.005 * uRainIntensity;
        }
    }
    vec3 sceneCol = texture(uSceneTex, uv).rgb;
    vec3 bloomCol = texture(uBloomTex, uv).rgb;
    vec3 hdr = sceneCol + bloomCol * 0.58 + uRaysColor * texture(uRaysTex, uv).r;
    if (uUnderwater > 0.5) {
        float vig = dot(vUv - 0.5, vUv - 0.5);
        hdr = mix(hdr * vec3(0.42, 0.78, 0.96), vec3(0.05, 0.24, 0.38), clamp(vig * 0.95, 0.0, 0.65));
    }
    vec3 ldr = acesTone(hdr);
    ldr = pow(max(ldr, vec3(1e-4)), vec3(1.0 / 2.2));
    ldr = colorGrade(ldr, uRainIntensity);

    if (uRainIntensity > 0.01 && uUnderwater < 0.5) {
        vec2 ndc = vUv * 2.0 - 1.0;
        vec3 ray = normalize(uCamForward + uCamRight * (ndc.x * uTanFov.x) + uCamUp * (ndc.y * uTanFov.y));
        float rawDepth = texture(uDepthTex, vUv).r;
        float sceneDist = calcLinearDepth(rawDepth);

        float rAccum = 0.0;
        const float dists[4] = float[4](1.8, 4.5, 10.0, 20.0);
        const float scales[4] = float[4](2.8, 1.8, 1.2, 0.8);
        const float speeds[4] = float[4](32.0, 28.0, 25.0, 22.0);
        const float thrs[4] = float[4](0.88, 0.85, 0.82, 0.80);
        const float weights[4] = float[4](0.40, 0.30, 0.20, 0.15);

        for (int i = 0; i < 4; i += 1) {
            float d = dists[i];
            if (d < sceneDist) {
                vec3 p = uCamPos + ray * d;
                rAccum += dropSlice(p, scales[i], speeds[i], thrs[i]) * weights[i];
            }
        }

        vec3 rainColor = mix(vec3(0.85, 0.90, 0.98), vec3(0.65, 0.70, 0.80), smoothstep(0.0, 20.0, sceneDist));
        ldr += rainColor * rAccum * uRainIntensity * 1.35;
    }

    vec2 centered = vUv - 0.5;
    float vigK = mix(0.55, 0.78, uRainIntensity);
    ldr *= 1.0 - dot(centered, centered) * vigK;
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
