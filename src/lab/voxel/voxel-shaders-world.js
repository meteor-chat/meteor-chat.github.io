export const WORLD_VS = `#version 300 es
precision highp float;
precision highp int;

layout(location = 0) in uvec2 aPacked;

uniform mat4 uViewProj;
uniform vec3 uChunkOrigin;
uniform float uTime;

out vec2 vUv;
out vec3 vNormal;
out float vAo;
out vec2 vLight;
out vec3 vWorldPos;
flat out uint vTexLayer;
flat out uint vFlags;

const vec3 NORMALS[6] = vec3[6](
    vec3(1.0, 0.0, 0.0),
    vec3(-1.0, 0.0, 0.0),
    vec3(0.0, 1.0, 0.0),
    vec3(0.0, -1.0, 0.0),
    vec3(0.0, 0.0, 1.0),
    vec3(0.0, 0.0, -1.0)
);

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
    uint face = (w0 >> 15u) & 7u;
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

    vWorldPos = worldPos;
    vNormal = NORMALS[face];
    vAo = 0.42 + (ao / 3.0) * 0.58;
    vLight = vec2(sunL, blkL);
    vUv = CORNERS[uvIdx] * vec2(qw, qh);
    gl_Position = uViewProj * vec4(worldPos, 1.0);
}`;

export const WORLD_FS = `#version 300 es
precision highp float;
precision highp sampler2DArray;

uniform sampler2DArray uTexArray;
uniform vec3 uCamPos;
uniform vec3 uSunDir;
uniform vec3 uSunTint;
uniform vec3 uSkyColor;
uniform vec3 uHorizonColor;
uniform float uDayIntensity;
uniform float uTime;
uniform float uFogStart;
uniform float uFogEnd;

in vec2 vUv;
in vec3 vNormal;
in float vAo;
in vec2 vLight;
in vec3 vWorldPos;
flat in uint vTexLayer;
flat in uint vFlags;

out vec4 fragColor;

void main() {
    vec2 tileUv = fract(vUv);
    if ((vFlags & 2u) != 0u) {
        tileUv = fract(vUv + vec2(sin(vUv.y * 3.14 + uTime * 0.9) * 0.08, uTime * 0.12));
    }
    vec4 tex = texture(uTexArray, vec3(tileUv, float(vTexLayer)));
    if ((vFlags & 8u) != 0u && tex.a < 0.25) discard;

    vec3 N = normalize(vNormal);
    vec3 V = normalize(uCamPos - vWorldPos);
    vec3 col = tex.rgb;
    float alpha = tex.a;

    if ((vFlags & 1u) != 0u) {
        float nx = cos(vWorldPos.x * 1.9 + uTime * 2.7) * 0.14;
        float nz = sin(vWorldPos.z * 2.1 + uTime * 2.3) * 0.14;
        N = normalize(N + vec3(nx, 0.0, nz));
        vec3 R = reflect(-V, N);
        float fresnel = mix(0.14, 0.9, pow(1.0 - max(dot(N, V), 0.0), 4.0));
        vec3 reflCol = mix(uHorizonColor, uSkyColor, clamp(R.y * 1.5, 0.0, 1.0));
        vec3 H = normalize(uSunDir + V);
        float spec = pow(max(dot(N, H), 0.0), 72.0) * max(0.0, uSunDir.y) * uDayIntensity;
        float waterLight = clamp(0.24 + vLight.x * uDayIntensity * 0.78 + vLight.y * 0.8, 0.08, 1.15);
        col = mix(col * waterLight, reflCol, fresnel * 0.65) + uSunTint * spec * 1.35;
        alpha = clamp(0.68 + fresnel * 0.26, 0.65, 0.95);
    } else if ((vFlags & 2u) != 0u) {
        float pulse = 1.45 + 0.35 * sin(uTime * 3.2 + vWorldPos.x * 0.7 + vWorldPos.z * 0.7);
        col *= pulse;
        alpha = 1.0;
    } else {
        float sunDiff = max(dot(N, uSunDir), 0.0);
        float hemi = 0.5 + 0.5 * N.y;
        float skyFactor = vLight.x * uDayIntensity;
        vec3 sunTerm = uSunTint * skyFactor * (0.28 + 0.85 * sunDiff);
        vec3 ambTerm = mix(vec3(0.06, 0.07, 0.11), uSkyColor * 0.42, hemi) * (0.2 + 0.8 * vLight.x * uDayIntensity);
        float flicker = 0.94 + 0.06 * sin(uTime * 7.1 + vWorldPos.x + vWorldPos.z);
        vec3 blkTerm = vec3(1.12, 0.58, 0.22) * pow(vLight.y, 1.25) * flicker;
        vec3 totalLight = (sunTerm + ambTerm + blkTerm) * vAo;
        col *= totalLight;
        if (vTexLayer == 11u && tex.r > 0.75 && tex.g > 0.65) {
            col += tex.rgb * 1.35;
        }
        if ((vFlags & 4u) != 0u) {
            float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);
            col += uSkyColor * fresnel * 0.35;
            alpha = max(alpha, 0.34);
        }
    }

    float dist = length(uCamPos - vWorldPos);
    float fogT = clamp((dist - uFogStart) / max(1.0, uFogEnd - uFogStart), 0.0, 1.0);
    col = mix(col, uHorizonColor, fogT * fogT);
    fragColor = vec4(col, alpha);
}`;

export const SKY_FS = `#version 300 es
precision highp float;

in vec2 vUv;
uniform vec3 uCamForward;
uniform vec3 uCamRight;
uniform vec3 uCamUp;
uniform vec2 uTanFov;
uniform vec3 uSunDir;
uniform vec3 uSunTint;
uniform vec3 uSkyColor;
uniform vec3 uHorizonColor;
uniform float uDayIntensity;
uniform float uTime;

out vec4 fragColor;

float hash21(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
}

float noise2d(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
        mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x),
        f.y
    );
}

void main() {
    vec2 ndc = vUv * 2.0 - 1.0;
    vec3 dir = normalize(uCamForward + uCamRight * (ndc.x * uTanFov.x) + uCamUp * (ndc.y * uTanFov.y));
    float up = clamp(dir.y, -0.2, 1.0);
    vec3 sky = mix(uHorizonColor, uSkyColor, pow(clamp(up, 0.0, 1.0), 0.65));

    float sunDot = max(dot(dir, uSunDir), 0.0);
    sky += uSunTint * pow(sunDot, 22.0) * 0.42;
    if (sunDot > 0.9982) {
        sky += uSunTint * 2.6;
    }

    if (dir.y > 0.03) {
        vec2 cUv = dir.xz / (dir.y + 0.14) * 1.45 + vec2(uTime * 0.014, uTime * 0.006);
        float c = noise2d(cUv) * 0.6 + noise2d(cUv * 2.3) * 0.3 + noise2d(cUv * 5.1) * 0.1;
        float cloud = smoothstep(0.54, 0.78, c) * smoothstep(0.03, 0.25, dir.y);
        vec3 cloudCol = mix(vec3(0.14, 0.16, 0.24), vec3(1.0, 0.96, 0.92), clamp(uDayIntensity * 1.15, 0.12, 1.0));
        sky = mix(sky, cloudCol, cloud * 0.68);
    }

    float nightVis = clamp(1.0 - uDayIntensity * 2.1, 0.0, 1.0);
    if (nightVis > 0.01 && dir.y > -0.05) {
        vec2 sUv = vec2(atan(dir.z, dir.x) * 32.0, asin(clamp(dir.y, -1.0, 1.0)) * 32.0);
        vec2 cell = floor(sUv);
        vec2 f = fract(sUv) - 0.5;
        float rnd = hash21(cell);
        if (rnd > 0.945) {
            float d = length(f);
            float twinkle = 0.65 + 0.35 * sin(uTime * 2.5 + rnd * 62.0);
            sky += smoothstep(0.22, 0.0, d) * nightVis * twinkle * vec3(0.85, 0.92, 1.0);
        }
    }

    fragColor = vec4(sky, 1.0);
}`;
