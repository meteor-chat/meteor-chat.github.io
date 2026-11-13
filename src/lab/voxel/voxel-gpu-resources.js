import { createUniformCache, linkProgram } from "./voxel-gl-utils.js";
import { BLOOM_BLUR_FS, BLOOM_EXTRACT_FS, COMPOSITE_FS, QUAD_VS, WIRE_FS, WIRE_VS } from "./voxel-shaders-fx.js";
import { SKY_FS, WORLD_FS, WORLD_VS } from "./voxel-shaders-world.js";
import { createVoxelTextureArray } from "./voxel-textures.js";

const WIRE_VERTS = new Float32Array([
    0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0,
    0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0,
    0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 0, 1, 0, 1, 1
]);

const ATMOSPHERE_UNIFORMS = ["uSunDir", "uSunTint", "uSkyColor", "uHorizonColor", "uDayIntensity", "uTime"];
const SKY_UNIFORMS = ["uCamForward", "uCamRight", "uCamUp", "uTanFov", ...ATMOSPHERE_UNIFORMS];
const WORLD_UNIFORMS = [
    "uTexArray", "uViewProj", "uCamPos", "uFogStart", "uFogEnd", "uChunkOrigin", ...ATMOSPHERE_UNIFORMS
];

function makeProgram(gl, vertexSrc, fragmentSrc, names) {
    const program = linkProgram(gl, vertexSrc, fragmentSrc);
    return { program, u: createUniformCache(gl, program, names) };
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
    return {
        floatExt: Boolean(gl.getExtension("EXT_color_buffer_float")),
        sky: makeProgram(gl, QUAD_VS, SKY_FS, SKY_UNIFORMS),
        world: makeProgram(gl, WORLD_VS, WORLD_FS, WORLD_UNIFORMS),
        extract: makeProgram(gl, QUAD_VS, BLOOM_EXTRACT_FS, ["uSceneTex"]),
        blur: makeProgram(gl, QUAD_VS, BLOOM_BLUR_FS, ["uTex", "uStep"]),
        comp: makeProgram(gl, QUAD_VS, COMPOSITE_FS, ["uSceneTex", "uBloomTex", "uTime", "uUnderwater"]),
        wire: makeProgram(gl, WIRE_VS, WIRE_FS, ["uViewProj", "uBlockPos"]),
        texArray: createVoxelTextureArray(gl, atlas),
        quadVao: gl.createVertexArray(),
        wireVao,
        wireBuf
    };
}

export function destroyGpuResources(gl, res) {
    gl.deleteTexture(res.texArray);
    gl.deleteVertexArray(res.quadVao);
    gl.deleteVertexArray(res.wireVao);
    gl.deleteBuffer(res.wireBuf);
    for (const key of ["sky", "world", "extract", "blur", "comp", "wire"]) {
        gl.deleteProgram(res[key].program);
    }
}
