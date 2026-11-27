import * as THREE from "three";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

const THREE_GH = "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r187/examples";
const PH_BASE = "https://dl.polyhaven.org/file/ph-assets";

export const GTA_ASSET_URLS = Object.freeze({
    draco: "https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/libs/draco/gltf/",
    models: {
        ferrari: `${THREE_GH}/models/gltf/ferrari.glb`,
        soldier: `${THREE_GH}/models/gltf/Soldier.glb`
    },
    hdris: {
        day: `${PH_BASE}/HDRIs/hdr/1k/kloofendal_48d_partly_cloudy_puresky_1k.hdr`,
        sunset: `${THREE_GH}/textures/equirectangular/venice_sunset_1k.hdr`,
        night: `${PH_BASE}/HDRIs/hdr/1k/dikhololo_night_1k.hdr`
    },
    pbr: {
        asphalt: {
            map: `${PH_BASE}/Textures/jpg/1k/asphalt_02/asphalt_02_diff_1k.jpg`,
            normalMap: `${PH_BASE}/Textures/jpg/1k/asphalt_02/asphalt_02_nor_gl_1k.jpg`,
            roughnessMap: `${PH_BASE}/Textures/jpg/1k/asphalt_02/asphalt_02_rough_1k.jpg`
        },
        sidewalk: {
            map: `${PH_BASE}/Textures/jpg/1k/concrete_pavement/concrete_pavement_diff_1k.jpg`,
            normalMap: `${PH_BASE}/Textures/jpg/1k/concrete_pavement/concrete_pavement_nor_gl_1k.jpg`,
            roughnessMap: `${PH_BASE}/Textures/jpg/1k/concrete_pavement/concrete_pavement_rough_1k.jpg`
        },
        concreteTile: {
            map: `${PH_BASE}/Textures/jpg/1k/concrete_tile_facade/concrete_tile_facade_diff_1k.jpg`,
            normalMap: `${PH_BASE}/Textures/jpg/1k/concrete_tile_facade/concrete_tile_facade_nor_gl_1k.jpg`,
            roughnessMap: `${PH_BASE}/Textures/jpg/1k/concrete_tile_facade/concrete_tile_facade_rough_1k.jpg`
        },
        stucco: {
            map: `${PH_BASE}/Textures/jpg/1k/white_stucco/white_stucco_diff_1k.jpg`,
            normalMap: `${PH_BASE}/Textures/jpg/1k/white_stucco/white_stucco_nor_gl_1k.jpg`,
            roughnessMap: `${PH_BASE}/Textures/jpg/1k/white_stucco/white_stucco_rough_1k.jpg`
        },
        brick: {
            map: `${PH_BASE}/Textures/jpg/1k/brick_wall_001/brick_wall_001_diffuse_1k.jpg`,
            normalMap: `${PH_BASE}/Textures/jpg/1k/brick_wall_001/brick_wall_001_nor_gl_1k.jpg`,
            roughnessMap: `${PH_BASE}/Textures/jpg/1k/brick_wall_001/brick_wall_001_rough_1k.jpg`
        },
        concreteWall: {
            map: `${PH_BASE}/Textures/jpg/1k/concrete_wall_001/concrete_wall_001_diff_1k.jpg`,
            normalMap: `${PH_BASE}/Textures/jpg/1k/concrete_wall_001/concrete_wall_001_nor_gl_1k.jpg`,
            roughnessMap: `${PH_BASE}/Textures/jpg/1k/concrete_wall_001/concrete_wall_001_rough_1k.jpg`
        },
        palmBark: {
            map: `${PH_BASE}/Textures/jpg/1k/palm_tree_bark/palm_tree_bark_diff_1k.jpg`,
            normalMap: `${PH_BASE}/Textures/jpg/1k/palm_tree_bark/palm_tree_bark_nor_gl_1k.jpg`,
            roughnessMap: `${PH_BASE}/Textures/jpg/1k/palm_tree_bark/palm_tree_bark_rough_1k.jpg`
        },
        sand: {
            map: `${PH_BASE}/Textures/jpg/1k/coast_sand_01/coast_sand_01_diff_1k.jpg`,
            normalMap: `${PH_BASE}/Textures/jpg/1k/coast_sand_01/coast_sand_01_nor_gl_1k.jpg`,
            roughnessMap: `${PH_BASE}/Textures/jpg/1k/coast_sand_01/coast_sand_01_rough_1k.jpg`
        }
    }
});

function withTimeout(promise, ms = 14000) {
    return new Promise((resolve) => {
        let settled = false;
        const timer = setTimeout(() => {
            if (!settled) {
                settled = true;
                resolve(null);
            }
        }, ms);
        promise
            .then((val) => {
                if (!settled) {
                    settled = true;
                    clearTimeout(timer);
                    resolve(val);
                }
            })
            .catch(() => {
                if (!settled) {
                    settled = true;
                    clearTimeout(timer);
                    resolve(null);
                }
            });
    });
}

function configureTex(tex, srgb, rx = 1, ry = 1) {
    if (!tex) return null;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(rx, ry);
    tex.anisotropy = 8;
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
}

export async function loadGtaAssets(onProgress = null) {
    const gltfLoader = new GLTFLoader();
    gltfLoader.setCrossOrigin("anonymous");
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(GTA_ASSET_URLS.draco);
    gltfLoader.setDRACOLoader(dracoLoader);

    const rgbeLoader = new RGBELoader();
    rgbeLoader.setCrossOrigin("anonymous");
    const texLoader = new THREE.TextureLoader();
    texLoader.setCrossOrigin("anonymous");

    const loadedTexList = [];
    const loadedGltfList = [];

    const loadGltf = (url) =>
        withTimeout(
            gltfLoader.loadAsync(url).then((g) => {
                loadedGltfList.push(g);
                return g;
            }),
            16000
        );

    const loadHdri = (url) =>
        withTimeout(
            rgbeLoader.loadAsync(url).then((tex) => {
                tex.mapping = THREE.EquirectangularReflectionMapping;
                loadedTexList.push(tex);
                return tex;
            }),
            16000
        );

    const loadTex = (url, srgb, rx = 1, ry = 1) =>
        withTimeout(
            texLoader.loadAsync(url).then((tex) => {
                configureTex(tex, srgb, rx, ry);
                loadedTexList.push(tex);
                return tex;
            }),
            12000
        );

    const loadPbrSet = async (entry, rx = 1, ry = 1) => {
        const [map, normalMap, roughnessMap] = await Promise.all([
            loadTex(entry.map, true, rx, ry),
            loadTex(entry.normalMap, false, rx, ry),
            loadTex(entry.roughnessMap, false, rx, ry)
        ]);
        return { map, normalMap, roughnessMap };
    };

    if (onProgress) onProgress("Streaming Ferrari 458, Character & California HDRI...", 42);

    const [ferrari, soldier, dayHdri, asphalt, sidewalk] = await Promise.all([
        loadGltf(GTA_ASSET_URLS.models.ferrari),
        loadGltf(GTA_ASSET_URLS.models.soldier),
        loadHdri(GTA_ASSET_URLS.hdris.day),
        loadPbrSet(GTA_ASSET_URLS.pbr.asphalt, 2, 2),
        loadPbrSet(GTA_ASSET_URLS.pbr.sidewalk, 1, 1)
    ]);

    if (onProgress) onProgress("Loading Los Santos PBR Facades, Sunset & Night HDRIs...", 68);

    const [
        sunsetHdri,
        nightHdri,
        concreteTile,
        stucco,
        brick,
        concreteWall,
        palmBark,
        sand
    ] = await Promise.all([
        loadHdri(GTA_ASSET_URLS.hdris.sunset),
        loadHdri(GTA_ASSET_URLS.hdris.night),
        loadPbrSet(GTA_ASSET_URLS.pbr.concreteTile, 2, 2),
        loadPbrSet(GTA_ASSET_URLS.pbr.stucco, 2, 2),
        loadPbrSet(GTA_ASSET_URLS.pbr.brick, 2, 2),
        loadPbrSet(GTA_ASSET_URLS.pbr.concreteWall, 2, 2),
        loadPbrSet(GTA_ASSET_URLS.pbr.palmBark, 1, 4),
        loadPbrSet(GTA_ASSET_URLS.pbr.sand, 8, 4)
    ]);

    const dispose = () => {
        dracoLoader.dispose();
        for (const t of loadedTexList) {
            if (t && t.dispose) t.dispose();
        }
        for (const g of loadedGltfList) {
            if (!g || !g.scene) continue;
            g.scene.traverse((obj) => {
                if (obj.geometry) obj.geometry.dispose();
                if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
                else if (obj.material) obj.material.dispose();
            });
        }
    };

    return {
        models: { ferrari, soldier },
        hdris: { day: dayHdri, sunset: sunsetHdri, night: nightHdri },
        pbr: { asphalt, sidewalk, concreteTile, stucco, brick, concreteWall, palmBark, sand },
        dispose
    };
}
