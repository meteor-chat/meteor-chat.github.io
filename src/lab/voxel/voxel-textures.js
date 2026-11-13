import { renderRecipe, TILE, writeLayer } from "./voxel-tex-maps.js";
import { FX_RECIPES } from "./voxel-tex-recipes-fx.js";
import { ORGANIC_RECIPES } from "./voxel-tex-recipes-organic.js";
import { TERRAIN_RECIPES } from "./voxel-tex-recipes-terrain.js";

const LAYER_COUNT = 18;
const RECIPES = { ...TERRAIN_RECIPES, ...ORGANIC_RECIPES, ...FX_RECIPES };

export function generateVoxelAtlasData() {
    const data = new Uint8Array(TILE * TILE * 4 * LAYER_COUNT);
    const maps = new Uint8Array(TILE * TILE * 4 * LAYER_COUNT);
    for (let layer = 0; layer < LAYER_COUNT; layer += 1) {
        const recipe = RECIPES[layer];
        writeLayer(data, maps, layer, renderRecipe(recipe), recipe.bump);
    }
    return { data, maps, tileSize: TILE, layerCount: LAYER_COUNT };
}

function uploadArray(gl, atlas, bytes) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
    gl.texImage3D(
        gl.TEXTURE_2D_ARRAY,
        0,
        gl.RGBA8,
        atlas.tileSize,
        atlas.tileSize,
        atlas.layerCount,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        bytes
    );
    gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.REPEAT);
    return tex;
}

export function createVoxelTextureArray(gl, atlas) {
    return uploadArray(gl, atlas, atlas.data);
}

export function createVoxelDataArray(gl, atlas) {
    return uploadArray(gl, atlas, atlas.maps);
}

export function drawHotbarBlockIcon(canvas, atlas, texLayer) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = atlas.tileSize;
    const img = ctx.createImageData(s, s);
    const layerOffset = texLayer * s * s * 4;
    for (let y = 0; y < s; y += 1) {
        const srcY = s - 1 - y;
        for (let x = 0; x < s; x += 1) {
            const src = layerOffset + (srcY * s + x) * 4;
            const dst = (y * s + x) * 4;
            img.data[dst] = atlas.data[src];
            img.data[dst + 1] = atlas.data[src + 1];
            img.data[dst + 2] = atlas.data[src + 2];
            img.data[dst + 3] = Math.max(175, atlas.data[src + 3]);
        }
    }
    const off = document.createElement("canvas");
    off.width = s;
    off.height = s;
    const octx = off.getContext("2d");
    if (!octx) return;
    octx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
}
