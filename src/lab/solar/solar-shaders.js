export { multiplyMat4, buildViewProjFromBasis, buildBodyModelMatrix, buildRingModelMatrix } from "./solar-gl-utils.js";

export const NEBULA_VS = `
attribute vec2 aCorner;
varying vec2 vNdc;
void main() {
    vNdc = aCorner;
    gl_Position = vec4(aCorner, 0.999, 1.0);
}
`;

export const NEBULA_FS = `
precision mediump float;
uniform vec3 uCamFwd;
uniform vec3 uCamRight;
uniform vec3 uCamUp;
uniform float uTanHalf;
uniform float uAspect;
varying vec2 vNdc;
float hash3(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise3(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(mix(hash3(i), hash3(i + vec3(1, 0, 0)), f.x), mix(hash3(i + vec3(0, 1, 0)), hash3(i + vec3(1, 1, 0)), f.x), f.y),
        mix(mix(hash3(i + vec3(0, 0, 1)), hash3(i + vec3(1, 0, 1)), f.x), mix(hash3(i + vec3(0, 1, 1)), hash3(i + vec3(1, 1, 1)), f.x), f.y),
        f.z
    );
}
float fbm3(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
        v += a * noise3(p);
        p *= 2.04;
        a *= 0.5;
    }
    return v;
}
void main() {
    vec3 rd = normalize(uCamFwd + uCamRight * (vNdc.x * uTanHalf * uAspect) + uCamUp * (vNdc.y * uTanHalf));
    float galPlane = exp(-abs(dot(rd, normalize(vec3(0.24, 0.90, -0.36)))) * 4.4);
    float n1 = fbm3(rd * 3.1 + vec3(1.2, 0.4, -0.7));
    float n2 = fbm3(rd * 6.8 - vec3(0.6, 1.4, 0.8));
    float cloud = clamp(galPlane * (n1 * 0.95 + n2 * 0.45), 0.0, 1.0);
    float dust = smoothstep(0.46, 0.72, n2) * galPlane * 0.52;
    vec3 base = vec3(0.012, 0.018, 0.036);
    vec3 nebulaBlue = vec3(0.055, 0.145, 0.305) * pow(cloud, 1.35);
    vec3 nebulaTeal = vec3(0.045, 0.19, 0.27) * clamp(n1 - 0.36, 0.0, 1.0) * galPlane;
    vec3 nebulaCore = vec3(0.16, 0.10, 0.24) * pow(cloud, 2.2) * (1.0 - dust);
    vec3 col = base + (nebulaBlue + nebulaTeal + nebulaCore) * (1.0 - dust * 0.75);
    gl_FragColor = vec4(col, 1.0);
}
`;

export const PLANET_VS = `
attribute vec3 aPos;
attribute vec3 aNorm;
attribute vec2 aUv;
uniform mat4 uViewProj;
uniform mat4 uModel;
varying vec3 vWorldPos;
varying vec3 vWorldNorm;
varying vec2 vUv;
void main() {
    vec4 wp = uModel * vec4(aPos, 1.0);
    vWorldPos = wp.xyz;
    vWorldNorm = normalize(mat3(uModel) * aNorm);
    vUv = aUv;
    gl_Position = uViewProj * wp;
}
`;

export const PLANET_FS = `
precision mediump float;
uniform sampler2D uTex;
uniform vec3 uSunPos;
uniform vec3 uCamPos;
uniform vec3 uAtmoColor;
uniform float uAtmoStrength;
uniform float uBumpStrength;
uniform float uSpecStrength;
uniform float uIsSun;
uniform float uTime;
varying vec3 vWorldPos;
varying vec3 vWorldNorm;
varying vec2 vUv;
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
void main() {
    vec3 tex = texture2D(uTex, vUv).rgb;
    vec3 N = normalize(vWorldNorm);
    vec3 V = normalize(uCamPos - vWorldPos);
    float ndotv = clamp(dot(N, V), 0.0, 1.0);
    if (uIsSun > 0.5) {
        vec3 tA = texture2D(uTex, vUv + vec2(uTime * 0.012, sin(vUv.x * 18.0) * 0.008)).rgb;
        vec3 tB = texture2D(uTex, vUv - vec2(uTime * 0.008, cos(vUv.y * 14.0) * 0.006)).rgb;
        vec3 plasma = mix(tex, (tA + tB) * 0.52, 0.45);
        float limb = pow(ndotv, 0.36);
        vec3 core = mix(vec3(0.88, 0.24, 0.04), plasma * vec3(1.24, 1.15, 0.96), limb);
        vec3 rim = vec3(1.0, 0.48, 0.08) * pow(1.0 - ndotv, 2.1) * 0.72;
        gl_FragColor = vec4(clamp(core + rim, 0.0, 1.0), 1.0);
        return;
    }
    vec3 upRef = abs(N.y) < 0.98 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 T = normalize(cross(upRef, N));
    vec3 B = cross(N, T);
    float hU = luma(texture2D(uTex, vUv + vec2(0.004, 0.0)).rgb) - luma(texture2D(uTex, vUv - vec2(0.004, 0.0)).rgb);
    float hV = luma(texture2D(uTex, vUv + vec2(0.0, 0.008)).rgb) - luma(texture2D(uTex, vUv - vec2(0.0, 0.008)).rgb);
    vec3 Nb = normalize(N - (T * hU + B * hV) * uBumpStrength);
    vec3 L = normalize(uSunPos - vWorldPos);
    float ndotl = dot(Nb, L);
    float diffuse = smoothstep(-0.14, 0.74, ndotl);
    float twilight = exp(-abs(ndotl + 0.03) * 10.0) * uAtmoStrength * 0.38;
    vec3 light = vec3(0.16, 0.18, 0.23) + vec3(1.08, 1.05, 1.0) * diffuse;
    vec3 H = normalize(L + V);
    float oceanMask = uSpecStrength > 0.05 ? clamp((tex.b - tex.r) * 2.2, 0.0, 1.0) : 1.0;
    float spec = pow(max(dot(Nb, H), 0.0), 42.0) * smoothstep(0.05, 0.45, ndotl) * uSpecStrength * oceanMask;
    float fresnel = pow(1.0 - ndotv, 3.0) * uAtmoStrength * (0.28 + 0.85 * smoothstep(-0.3, 0.5, dot(N, L)));
    vec3 color = tex * light + vec3(spec) + uAtmoColor * (fresnel + twilight);
    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

export const RING_VS = `
attribute vec3 aPos;
attribute vec2 aUv;
uniform mat4 uViewProj;
uniform mat4 uModel;
varying vec3 vWorldPos;
varying vec2 vUv;
void main() {
    vec4 wp = uModel * vec4(aPos, 1.0);
    vWorldPos = wp.xyz;
    vUv = aUv;
    gl_Position = uViewProj * wp;
}
`;

export const RING_FS = `
precision mediump float;
uniform sampler2D uRingTex;
uniform vec3 uPlanetPos;
uniform vec3 uSunPos;
uniform float uPlanetRadius;
uniform float uInnerRatio;
varying vec3 vWorldPos;
varying vec2 vUv;
void main() {
    float r = length(vUv * 2.0 - 1.0);
    if (r < uInnerRatio || r > 1.0) discard;
    float bandU = (r - uInnerRatio) / max(0.01, 1.0 - uInnerRatio);
    vec4 band = texture2D(uRingTex, vec2(bandU, 0.5));
    if (band.a < 0.02) discard;
    vec3 toSun = normalize(uSunPos - uPlanetPos);
    vec3 rel = vWorldPos - uPlanetPos;
    float proj = dot(rel, toSun);
    float shadow = 1.0;
    if (proj < 0.0) {
        float perpDist = length(rel - toSun * proj);
        shadow = smoothstep(uPlanetRadius * 0.88, uPlanetRadius * 1.06, perpDist);
    }
    vec3 col = band.rgb * (0.26 + 0.86 * shadow);
    gl_FragColor = vec4(col, band.a);
}
`;

export const CORONA_VS = `
attribute vec2 aCorner;
uniform mat4 uViewProj;
uniform vec3 uSunPos;
uniform vec3 uCamRight;
uniform vec3 uCamUp;
uniform float uSize;
varying vec2 vQuad;
void main() {
    vQuad = aCorner;
    vec3 wp = uSunPos + (uCamRight * aCorner.x + uCamUp * aCorner.y) * uSize;
    gl_Position = uViewProj * vec4(wp, 1.0);
}
`;

export const CORONA_FS = `
precision mediump float;
varying vec2 vQuad;
void main() {
    float d = length(vQuad);
    if (d > 1.0) discard;
    float rays = 0.88 + 0.12 * cos(atan(vQuad.y, vQuad.x) * 8.0);
    float aura = smoothstep(0.18, 0.42, d) * exp(-max(0.0, d - 0.34) * 3.0) * (1.0 - smoothstep(0.7, 1.0, d));
    float bloom = exp(-d * 2.4) * (1.0 - smoothstep(0.75, 1.0, d)) * 0.32;
    vec3 col = mix(vec3(1.0, 0.78, 0.24), vec3(0.98, 0.28, 0.06), smoothstep(0.26, 0.74, d));
    gl_FragColor = vec4(col, clamp((aura * rays * 0.78 + bloom), 0.0, 0.88));
}
`;

export const POINT_VS = `
attribute vec3 aPos;
attribute vec4 aColor;
attribute float aSize;
uniform mat4 uViewProj;
uniform float uPixelRatio;
varying vec4 vColor;
varying float vSize;
void main() {
    vColor = aColor;
    vSize = aSize;
    vec4 clip = uViewProj * vec4(aPos, 1.0);
    gl_Position = clip;
    gl_PointSize = clamp((aSize * uPixelRatio * 145.0) / max(1.0, clip.w), 1.4, 72.0);
}
`;

export const POINT_FS = `
precision mediump float;
uniform float uSpriteMode;
varying vec4 vColor;
varying float vSize;
void main() {
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float d2 = dot(p, p);
    if (uSpriteMode > 1.5) {
        if (d2 > 1.0) discard;
        gl_FragColor = vec4(vColor.rgb, vColor.a * exp(-d2 * 3.2));
        return;
    }
    if (uSpriteMode > 0.5) {
        if (d2 > 1.0) discard;
        float nz = sqrt(max(0.0, 1.0 - d2));
        float lit = 0.32 + 0.78 * max(0.0, dot(vec3(p.x, -p.y, nz), normalize(vec3(-0.45, 0.45, 0.76))));
        gl_FragColor = vec4(vColor.rgb * lit, vColor.a * (1.0 - smoothstep(0.72, 1.0, sqrt(d2))));
        return;
    }
    float core = exp(-d2 * 5.2);
    float spike = (vSize > 4.8) ? (exp(-abs(p.x) * 16.0) * exp(-abs(p.y) * 2.4) + exp(-abs(p.y) * 16.0) * exp(-abs(p.x) * 2.4)) * 0.65 : 0.0;
    float a = clamp((core + spike) * vColor.a, 0.0, 1.0);
    if (a < 0.015) discard;
    gl_FragColor = vec4(mix(vColor.rgb, vec3(1.0), clamp(core, 0.0, 1.0) * 0.45), a);
}
`;
