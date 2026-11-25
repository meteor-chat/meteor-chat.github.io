import { createUniformCache, linkProgram } from "./voxel-gl-utils.js";
import { HAND_VERTEX_STRIDE } from "./voxel-hand.js";
import { createBlobGeometry, destroyBlobGeometry } from "./voxel-mob-blob.js";
import { createMobGeometry, destroyMobGeometry } from "./voxel-mob-render.js";
import { PARTICLE_STRIDE } from "./voxel-particles.js";
import {
    BLOOM_BLUR_FS,
    BLOOM_EXTRACT_FS,
    COMPOSITE_FS,
    CRACK_FS,
    CRACK_VS,
    HAND_FS,
    HAND_VS,
    PARTICLE_FS,
    PARTICLE_VS,
    QUAD_VS,
    RAYS_FS,
    WIRE_FS,
    WIRE_VS
} from "./voxel-shaders-fx.js";
import { BLOB_FS, BLOB_VS, MOB_FS, MOB_VS } from "./voxel-shaders-mob.js";
import { SHADOW_CUTOUT_FS, SHADOW_CUTOUT_VS, SHADOW_FS, SHADOW_VS } from "./voxel-shaders-shadow.js";
import { SKY_FS, SKY_VS } from "./voxel-shaders-sky.js";
import { CUTOUT_FS, CUTOUT_VS, WORLD_FS, WORLD_VS } from "./voxel-shaders-world.js";
import { createShadowTarget, disposeShadowTarget } from "./voxel-shadow-pass.js";
import { createVoxelDataArray, createVoxelTextureArray } from "./voxel-textures.js";

export const SHADOW_MAP_SIZE = 2048;

const WIRE_VERTS = new Float32Array([
    0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0,
    0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0,
    0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 0, 1, 0, 1, 1
]);

const CRACK_VERTS = new Float32Array([
    1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0,
    0, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0,
    0, 1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0,
    0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0,
    0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1,
    1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 0, 1
]);

const ATMOSPHERE_UNIFORMS = ["uSunDir", "uSunTint", "uSkyColor", "uHorizonColor", "uDayIntensity", "uTime", "uRainIntensity"];
const SKY_UNIFORMS = ["uCamForward", "uCamRight", "uCamUp", "uTanFov", ...ATMOSPHERE_UNIFORMS];
const SHARED_WORLD_UNIFORMS = [
    "uTexArray", "uTexData", "uViewProj", "uCamPos", "uFogStart", "uFogEnd",
    "uShadowMap", "uShadowMat", "uShadowCenter", "uShadowParams",
    "uUnderwater", "uHandLight",
    ...ATMOSPHERE_UNIFORMS
];

const WORLD_UNIFORMS = [
    ...SHARED_WORLD_UNIFORMS,
    "uChunkOrigin", "uSceneDepth", "uResolution"
];
const CUTOUT_UNIFORMS = [...SHARED_WORLD_UNIFORMS, "uChunkOrigin"];
const MOB_UNIFORMS = [...SHARED_WORLD_UNIFORMS];

export const PROGRAM_SPECS = {
    sky: { vs: SKY_VS, fs: SKY_FS, uniforms: SKY_UNIFORMS },
    world: { vs: WORLD_VS, fs: WORLD_FS, uniforms: WORLD_UNIFORMS },
    cutout: { vs: CUTOUT_VS, fs: CUTOUT_FS, uniforms: CUTOUT_UNIFORMS },
    mob: { vs: MOB_VS, fs: MOB_FS, uniforms: MOB_UNIFORMS },
    blob: { vs: BLOB_VS, fs: BLOB_FS, uniforms: ["uViewProj"] },
    shadow: { vs: SHADOW_VS, fs: SHADOW_FS, uniforms: ["uLightViewProj", "uChunkOrigin"] },
    shadowCutout: { vs: SHADOW_CUTOUT_VS, fs: SHADOW_CUTOUT_FS, uniforms: ["uLightViewProj", "uChunkOrigin", "uTime", "uTexArray"] },
    extract: { vs: QUAD_VS, fs: BLOOM_EXTRACT_FS, uniforms: ["uSceneTex"] },
    blur: { vs: QUAD_VS, fs: BLOOM_BLUR_FS, uniforms: ["uTex", "uStep"] },
    rays: { vs: QUAD_VS, fs: RAYS_FS, uniforms: ["uSceneTex", "uDepthTex", "uSunUv"] },
    comp: {
        vs: QUAD_VS,
        fs: COMPOSITE_FS,
        uniforms: [
            "uSceneTex", "uBloomTex", "uRaysTex", "uDepthTex", "uRaysColor",
            "uTime", "uUnderwater", "uRainIntensity", "uRainVis",
            "uDayIntensity", "uCamPos", "uCamForward", "uCamRight", "uCamUp", "uTanFov"
        ]
    },
    wire: { vs: WIRE_VS, fs: WIRE_FS, uniforms: ["uViewProj", "uBlockPos"] },
    crack: { vs: CRACK_VS, fs: CRACK_FS, uniforms: ["uViewProj", "uBlockPos", "uProgress"] },
    particle: { vs: PARTICLE_VS, fs: PARTICLE_FS, uniforms: ["uViewProj", "uLightScale"] },
    hand: { vs: HAND_VS, fs: HAND_FS, uniforms: ["uProj", "uModel", "uTexArray", "uHandTint"] }
};

function makeProgram(gl, spec) {
    const program = linkProgram(gl, spec.vs, spec.fs);
    return { program, u: createUniformCache(gl, program, spec.uniforms) };
}

function createStaticVao(gl, verts, attrs) {
    const vao = gl.createVertexArray();
    const buf = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    for (const [loc, size, stride, offset] of attrs) {
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset);
    }
    gl.bindVertexArray(null);
    return { vao, buf };
}

function createDynamicVao(gl, byteLength, attrs) {
    const vao = gl.createVertexArray();
    const buf = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, byteLength, gl.DYNAMIC_DRAW);
    for (const [loc, size, stride, offset] of attrs) {
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset);
    }
    gl.bindVertexArray(null);
    return { vao, buf };
}

export function createGpuResources(gl, atlas) {
    const res = {};
    try {
        res.floatExt = Boolean(
            gl.getExtension("EXT_color_buffer_float") ||
            gl.getExtension("EXT_color_buffer_half_float")
        );
        const wire = createStaticVao(gl, WIRE_VERTS, [[0, 3, 0, 0]]);
        res.wireVao = wire.vao;
        res.wireBuf = wire.buf;

        const crack = createStaticVao(gl, CRACK_VERTS, [[0, 3, 20, 0], [1, 2, 20, 12]]);
        res.crackVao = crack.vao;
        res.crackBuf = crack.buf;

        const particle = createDynamicVao(gl, 256 * 6 * PARTICLE_STRIDE * 4, [
            [0, 3, PARTICLE_STRIDE * 4, 0],
            [1, 4, PARTICLE_STRIDE * 4, 12],
            [2, 1, PARTICLE_STRIDE * 4, 28]
        ]);
        res.particleVao = particle.vao;
        res.particleBuf = particle.buf;

        const hand = createDynamicVao(gl, 64 * HAND_VERTEX_STRIDE * 4, [
            [0, 3, HAND_VERTEX_STRIDE * 4, 0],
            [1, 2, HAND_VERTEX_STRIDE * 4, 12],
            [2, 3, HAND_VERTEX_STRIDE * 4, 20]
        ]);
        res.handVao = hand.vao;
        res.handBuf = hand.buf;
        res.handBlockId = -1;
        res.handVertCount = 0;

        res.texArray = createVoxelTextureArray(gl, atlas);
        res.texData = createVoxelDataArray(gl, atlas);
        res.shadowTarget = createShadowTarget(gl, SHADOW_MAP_SIZE);
        res.mobGeo = createMobGeometry(gl);
        res.blobGeo = createBlobGeometry(gl);
        res.quadVao = gl.createVertexArray();

        for (const [key, spec] of Object.entries(PROGRAM_SPECS)) {
            res[key] = makeProgram(gl, spec);
        }
        return res;
    } catch (error) {
        destroyGpuResources(gl, res);
        throw error;
    }
}

export function destroyGpuResources(gl, res) {
    if (!res) return;
    if (res.texArray) gl.deleteTexture(res.texArray);
    if (res.texData) gl.deleteTexture(res.texData);
    if (res.shadowTarget) disposeShadowTarget(gl, res.shadowTarget);
    if (res.mobGeo) destroyMobGeometry(gl, res.mobGeo);
    if (res.blobGeo) destroyBlobGeometry(gl, res.blobGeo);
    if (res.quadVao) gl.deleteVertexArray(res.quadVao);
    if (res.wireVao) gl.deleteVertexArray(res.wireVao);
    if (res.wireBuf) gl.deleteBuffer(res.wireBuf);
    if (res.crackVao) gl.deleteVertexArray(res.crackVao);
    if (res.crackBuf) gl.deleteBuffer(res.crackBuf);
    if (res.particleVao) gl.deleteVertexArray(res.particleVao);
    if (res.particleBuf) gl.deleteBuffer(res.particleBuf);
    if (res.handVao) gl.deleteVertexArray(res.handVao);
    if (res.handBuf) gl.deleteBuffer(res.handBuf);
    for (const key of Object.keys(PROGRAM_SPECS)) {
        if (res[key]?.program) gl.deleteProgram(res[key].program);
    }
}
