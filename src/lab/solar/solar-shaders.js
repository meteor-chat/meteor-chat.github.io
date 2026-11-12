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
uniform float uIsSun;
varying vec3 vWorldPos;
varying vec3 vWorldNorm;
varying vec2 vUv;
void main() {
    vec3 tex = texture2D(uTex, vUv).rgb;
    vec3 N = normalize(vWorldNorm);
    vec3 V = normalize(uCamPos - vWorldPos);
    float ndotv = clamp(dot(N, V), 0.0, 1.0);
    if (uIsSun > 0.5) {
        float limb = pow(ndotv, 0.28);
        vec3 core = mix(vec3(1.0, 0.55, 0.12), tex * vec3(1.14, 1.12, 1.05), limb);
        vec3 rim = vec3(1.0, 0.35, 0.08) * pow(1.0 - ndotv, 2.0) * 0.72;
        gl_FragColor = vec4(clamp(core + rim, 0.0, 1.0), 1.0);
        return;
    }
    vec3 L = normalize(uSunPos - vWorldPos);
    float ndotl = dot(N, L);
    float diffuse = smoothstep(-0.36, 0.78, ndotl);
    float topFill = 0.14 * max(0.0, N.y);
    float light = 0.52 + 0.58 * diffuse + topFill;
    vec3 H = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.0), 24.0) * smoothstep(0.0, 0.4, ndotl) * 0.14;
    float fresnel = pow(1.0 - ndotv, 2.4) * uAtmoStrength * (0.55 + 0.45 * diffuse);
    vec3 color = tex * light + vec3(spec) + uAtmoColor * fresnel;
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
        shadow = smoothstep(uPlanetRadius * 0.88, uPlanetRadius * 1.08, perpDist);
    }
    vec3 col = band.rgb * (0.65 + 0.42 * shadow);
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
    float aura = smoothstep(0.16, 0.42, d) * exp(-max(0.0, d - 0.34) * 3.1) * (1.0 - smoothstep(0.68, 1.0, d));
    vec3 col = mix(vec3(1.0, 0.72, 0.22), vec3(0.98, 0.24, 0.06), smoothstep(0.28, 0.72, d));
    gl_FragColor = vec4(col, clamp(aura * 0.85, 0.0, 0.85));
}
`;

export const POINT_VS = `
attribute vec3 aPos;
attribute vec4 aColor;
attribute float aSize;
uniform mat4 uViewProj;
uniform float uPixelRatio;
varying vec4 vColor;
void main() {
    vColor = aColor;
    vec4 clip = uViewProj * vec4(aPos, 1.0);
    gl_Position = clip;
    gl_PointSize = clamp((aSize * uPixelRatio * 145.0) / max(1.0, clip.w), 1.4, 72.0);
}
`;

export const POINT_FS = `
precision mediump float;
uniform float uSoftMode;
varying vec4 vColor;
void main() {
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float d2 = dot(p, p);
    if (d2 > 1.0) discard;
    float falloff = uSoftMode > 0.5 ? exp(-d2 * 3.4) : (1.0 - smoothstep(0.35, 1.0, sqrt(d2)));
    gl_FragColor = vec4(vColor.rgb, vColor.a * falloff);
}
`;

export function multiplyMat4(a, b) {
    const out = new Float32Array(16);
    for (let c = 0; c < 4; c += 1) {
        for (let r = 0; r < 4; r += 1) {
            out[c * 4 + r] =
                a[r] * b[c * 4] +
                a[4 + r] * b[c * 4 + 1] +
                a[8 + r] * b[c * 4 + 2] +
                a[12 + r] * b[c * 4 + 3];
        }
    }
    return out;
}

export function buildViewProjFromBasis(camBasis, near = 0.25, far = 4500) {
    const f = 1 / Math.tan(camBasis.fovRad * 0.5);
    const nf = 1 / (near - far);
    const proj = new Float32Array([
        f / camBasis.aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, 2 * far * near * nf, 0
    ]);
    const { right: r, up: u, fwd: fw, eye: e } = camBasis;
    const view = new Float32Array([
        r.x, u.x, -fw.x, 0,
        r.y, u.y, -fw.y, 0,
        r.z, u.z, -fw.z, 0,
        -(r.x * e.x + r.y * e.y + r.z * e.z),
        -(u.x * e.x + u.y * e.y + u.z * e.z),
        fw.x * e.x + fw.y * e.y + fw.z * e.z,
        1
    ]);
    return multiplyMat4(proj, view);
}

export function buildBodyModelMatrix(posRel, radius, tiltDeg, spinRad) {
    const tilt = (tiltDeg * Math.PI) / 180;
    const ct = Math.cos(tilt);
    const st = Math.sin(tilt);
    const cs = Math.cos(spinRad);
    const ss = Math.sin(spinRad);
    return new Float32Array([
        radius * cs, radius * st * ss, -radius * ct * ss, 0,
        0, radius * ct, radius * st, 0,
        radius * ss, -radius * st * cs, radius * ct * cs, 0,
        posRel.x, posRel.y, posRel.z, 1
    ]);
}

export function buildRingModelMatrix(posRel, outerRadius, tiltDeg, yawRad = 0.25) {
    const tilt = (tiltDeg * Math.PI) / 180;
    const ct = Math.cos(tilt);
    const st = Math.sin(tilt);
    const cy = Math.cos(yawRad);
    const sy = Math.sin(yawRad);
    return new Float32Array([
        outerRadius * cy, outerRadius * st * sy, -outerRadius * ct * sy, 0,
        0, outerRadius * ct, outerRadius * st, 0,
        outerRadius * sy, -outerRadius * st * cy, outerRadius * ct * cy, 0,
        posRel.x, posRel.y, posRel.z, 1
    ]);
}
