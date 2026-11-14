import { GLSL_ATMOSPHERE } from "./voxel-glsl-common.js";
import { GLSL_SURFACE_LIGHT } from "./voxel-glsl-light.js";
import { GLSL_SHADOW } from "./voxel-glsl-shadow.js";

export const MOB_VS = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aUv;
layout(location = 3) in vec2 aMeta;

uniform mat4 uViewProj;

out vec2 vUv;
out float vAo;
out vec2 vLight;
out vec3 vWorldPos;
out vec3 vNormal;
flat out float vLayer;

void main() {
    vUv = aUv;
    vLayer = floor(aMeta.x + 0.5);
    vLight = vec2(aMeta.y, 0.0);
    vAo = 0.8 + 0.2 * clamp(aNormal.y * 0.5 + 0.5, 0.0, 1.0);
    vNormal = aNormal;
    vWorldPos = aPos;
    gl_Position = uViewProj * vec4(aPos, 1.0);
}`;

export const MOB_FS = `#version 300 es
precision highp float;
precision highp sampler2DArray;
precision highp sampler2DShadow;

uniform sampler2DArray uTexArray;
uniform sampler2DArray uTexData;
uniform vec3 uCamPos;
uniform float uFogStart;
uniform float uFogEnd;
${GLSL_ATMOSPHERE}

in vec2 vUv;
in float vAo;
in vec2 vLight;
in vec3 vWorldPos;
in vec3 vNormal;
flat in float vLayer;

out vec4 fragColor;

${GLSL_SHADOW}
${GLSL_SURFACE_LIGHT}

void main() {
    vec3 coord = vec3(vUv, vLayer);
    vec4 tex = texture(uTexArray, coord);
    vec4 data = texture(uTexData, coord);
    vec3 v = normalize(uCamPos - vWorldPos);
    vec3 n = normalize(vNormal);
    vec3 albedo = pow(tex.rgb, vec3(2.2));
    albedo = mix(vec3(dot(albedo, vec3(0.3, 0.59, 0.11))), albedo, 0.72);
    float shadow = sunShadow(vWorldPos, n);
    vec3 col = shadeSurface(albedo, n, v, data.b, shadow);
    col = mix(vec3(dot(col, vec3(0.3, 0.59, 0.11))), col, 0.72);
    col += albedo * data.a * 2.4;
    float dist = length(uCamPos - vWorldPos);
    float fogT = pow(smoothstep(uFogStart, uFogEnd, dist), 1.6);
    col = mix(col, skyGradient(normalize(vWorldPos - uCamPos)), fogT);
    fragColor = vec4(col, 1.0);
}`;

export const BLOB_VS = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aData;

uniform mat4 uViewProj;

out vec3 vData;

void main() {
    vData = aData;
    gl_Position = uViewProj * vec4(aPos, 1.0);
}`;

export const BLOB_FS = `#version 300 es
precision highp float;

in vec3 vData;

out vec4 fragColor;

void main() {
    float r = length(vData.xy);
    float a = (1.0 - smoothstep(0.25, 1.0, r)) * vData.z;
    fragColor = vec4(0.0, 0.0, 0.0, a);
}`;