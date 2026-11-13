import { createUniformCache, linkProgram } from "./voxel-gl-utils.js";
import { BLOOM_BLUR_FS, BLOOM_EXTRACT_FS, COMPOSITE_FS, QUAD_VS, WIRE_FS, WIRE_VS } from "./voxel-shaders-fx.js";
import { SHADOW_FS, SHADOW_VS } from "./voxel-shaders-shadow.js";
import { SKY_FS } from "./voxel-shaders-sky.js";
import { WORLD_FS, WORLD_VS } from "./voxel-shaders-world.js";
import { createShadowTarget, disposeShadowTarget } from "./voxel-shadow-pass.js";
import { createVoxelDataArray, createVoxelTextureArray } from "./voxel-textures.js";

export const SHADOW_MAP_SIZE = 2048;

const WIRE_VERTS = new Float32Array([
    0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0,
    0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0,
    0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 0, 1, 0, 1, 1
]);

const ATMOSPHERE_UNIFORMS = ["uSunDir", "uSunTint", "uSkyColor", "uHorizonColor", "uDayIntensity", "uTime"];
const SKY_UNIFORMS = ["uCamForward", "uCamRight", "uCamUp", "uTanFov", ...ATMOSPHERE_UNIFORMS];
const WORLD_UNIFORMS = [
    "uTexArray", "uTexData", "uViewProj", "uCamPos", "uFogStart", "uFogEnd", "uChunkOrigin",
    "uShadowMap", "uShadowMat", "uShadowCenter", "uShadowParams", "uSceneDepth", "uResolution",
    ...ATMOSPHERE_UNIFORMS
];

export const PROGRAM_SPECS = {
    sky: { vs: QUAD_VS, fs: SKY_FS, uniforms: SKY_UNIFORMS },
    world: { vs: WORLD_VS, fs: WORLD_FS, uniforms: WORLD_UNIFORMS },
    shadow: { vs: SHADOW_VS, fs: SHADOW_FS, uniforms: ["uLightViewProj", "uChunkOrigin", "uTexArray"] },
    extract: { vs: QUAD_VS, fs: BLOOM_EXTRACT_FS, uniforms: ["uSceneTex"] },
    blur: { vs: QUAD_VS, fs: BLOOM_BLUR_FS, uniforms: ["uTex", "uStep"] },
    comp: { vs: QUAD_VS, fs: COMPOSITE_FS, uniforms: ["uSceneTex", "uBloomTex", "uTime", "uUnderwater"] },
    wire: { vs: WIRE_VS, fs: WIRE_FS, uniforms: ["uViewProj", "uBlockPos"] }
};

function makeProgram(gl, spec) {
    const program = linkProgram(gl, spec.vs, spec.fs);
    return { program, u: createUniformCache(gl, program, spec.uniforms) };
}

export function createGpuResources(gl, atlas) {
    const wireVao = gl.createVertexArray();
    const wireBuf = gl.createBuffer();
    gl.bindVertexArray(wireVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, wireBuf);
    gl.bufferData(gl.ARRAY_BUFFER, WIRE_VERTS, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    const res = {
        floatExt: Boolean(gl.getExtension("EXT_color_buffer_float")),
        texArray: createVoxelTextureArray(gl, atlas),
        texData: createVoxelDataArray(gl, atlas),
        shadowTarget: createShadowTarget(gl, SHADOW_MAP_SIZE),
        quadVao: gl.createVertexArray(),
        wireVao,
        wireBuf
    };
    for (const [key, spec] of Object.entries(PROGRAM_SPECS)) res[key] = makeProgram(gl, spec);
    return res;
}

export function destroyGpuResources(gl, res) {
    gl.deleteTexture(res.texArray);
    gl.deleteTexture(res.texData);
    disposeShadowTarget(gl, res.shadowTarget);
    gl.deleteVertexArray(res.quadVao);
    gl.deleteVertexArray(res.wireVao);
    gl.deleteBuffer(res.wireBuf);
    for (const key of Object.keys(PROGRAM_SPECS)) {
        gl.deleteProgram(res[key].program);
    }
}
