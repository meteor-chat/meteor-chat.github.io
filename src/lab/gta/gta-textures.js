import * as THREE from "three";

function makeCanvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
}

function finalizeTex(canvas, repeatX = 1, repeatY = 1, srgb = true) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    tex.anisotropy = 8;
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
}

function drawFallbackAsphalt() {
    const c = makeCanvas(512, 512);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#2b2f36";
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 16000; i += 1) {
        const x = (i * 97 + ((i >> 4) * 37)) % 512;
        const y = (i * 211 + ((i >> 3) * 19)) % 512;
        const v = 34 + ((i * 29) % 28);
        ctx.fillStyle = `rgb(${v},${v + 1},${v + 3})`;
        ctx.fillRect(x, y, 2, 2);
    }
    return finalizeTex(c, 2, 2, true);
}

function drawGlassInteriorMaps() {
    const ac = makeCanvas(512, 512);
    const ec = makeCanvas(512, 512);
    const actx = ac.getContext("2d");
    const ectx = ec.getContext("2d");

    actx.fillStyle = "#162638";
    actx.fillRect(0, 0, 512, 512);
    ectx.fillStyle = "#000000";
    ectx.fillRect(0, 0, 512, 512);

    const rows = 8;
    const cols = 8;
    const cellW = 512 / cols;
    const cellH = 512 / rows;
    for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
            const x = c * cellW;
            const y = r * cellH;
            const hash = (r * 37 + c * 71 + r * c * 13) % 19;
            const grad = actx.createLinearGradient(x, y, x, y + cellH);
            if (hash < 6) {
                grad.addColorStop(0, "#243b52");
                grad.addColorStop(1, "#13202e");
            } else if (hash < 12) {
                grad.addColorStop(0, "#35536d");
                grad.addColorStop(1, "#1d3142");
            } else {
                grad.addColorStop(0, "#1c2d3e");
                grad.addColorStop(1, "#0f1822");
            }
            actx.fillStyle = grad;
            actx.fillRect(x + 2, y + 3, cellW - 4, cellH - 6);

            actx.fillStyle = "rgba(18, 24, 34, 0.72)";
            actx.fillRect(x, y, cellW, 3);
            actx.fillRect(x, y, 2, cellH);

            if (hash % 3 === 0) {
                const warm = hash % 2 === 0;
                ectx.fillStyle = warm ? "#ffcf8c" : "#a8d8ff";
                ectx.fillRect(x + 4, y + 7, cellW - 8, cellH - 14);
                ectx.fillStyle = "rgba(0, 0, 0, 0.25)";
                ectx.fillRect(x + 4, y + cellH * 0.55, cellW - 8, 4);
            }
        }
    }
    return {
        map: finalizeTex(ac, 2, 2, true),
        emissiveMap: finalizeTex(ec, 2, 2, true)
    };
}

function drawPalmFrondTexture() {
    const c = makeCanvas(512, 512);
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, 512, 512);

    ctx.strokeStyle = "#4d6b2b";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(256, 504);
    ctx.quadraticCurveTo(256, 250, 256, 14);
    ctx.stroke();

    const pairs = 38;
    for (let i = 0; i < pairs; i += 1) {
        const t = i / (pairs - 1);
        const y = 486 - t * 462;
        const env = Math.sin(Math.pow(t, 0.65) * Math.PI);
        const len = 36 + env * 195;
        const droop = 18 + (1 - t) * 44;
        const green = Math.round(76 + (i % 5) * 9 + t * 24);
        const red = Math.round(44 + (i % 4) * 7 + t * 18);
        const blue = Math.round(24 + (i % 3) * 5);

        for (const side of [-1, 1]) {
            ctx.fillStyle = `rgb(${red},${green},${blue})`;
            ctx.beginPath();
            ctx.moveTo(256, y);
            ctx.quadraticCurveTo(256 + side * len * 0.55, y - 10, 256 + side * len, y + droop);
            ctx.quadraticCurveTo(256 + side * len * 0.5, y + droop * 0.45 + 5, 256, y + 8);
            ctx.closePath();
            ctx.fill();
        }
    }

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return tex;
}

function drawBillboard(variant) {
    const c = makeCanvas(512, 256);
    const ctx = c.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 512, 256);
    if (variant === 0) {
        grad.addColorStop(0, "#101b2d");
        grad.addColorStop(0.55, "#1f3a5c");
        grad.addColorStop(1, "#334d6c");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 256);
        ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
        ctx.font = "600 54px sans-serif";
        ctx.fillText("VINEWOOD", 44, 118);
        ctx.fillStyle = "#93c5fd";
        ctx.font = "500 24px sans-serif";
        ctx.fillText("LOS SANTOS MOTORSPORT", 46, 168);
        ctx.fillStyle = "#f97316";
        ctx.fillRect(46, 194, 150, 5);
    } else {
        grad.addColorStop(0, "#1a1820");
        grad.addColorStop(1, "#4b2220");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 256);
        ctx.fillStyle = "#fde68a";
        ctx.font = "600 50px sans-serif";
        ctx.fillText("MAZE BANK", 42, 118);
        ctx.fillStyle = "#f8fafc";
        ctx.font = "500 22px sans-serif";
        ctx.fillText("WEST COAST INVESTMENT GROUP", 44, 168);
    }
    return finalizeTex(c, 1, 1, true);
}

function drawSafehouseArt() {
    const c = makeCanvas(512, 320);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#e8e3d9";
    ctx.fillRect(0, 0, 512, 320);
    ctx.fillStyle = "#a91d22";
    ctx.fillRect(28, 28, 224, 168);
    ctx.fillStyle = "#181a1f";
    ctx.fillRect(272, 28, 212, 110);
    ctx.fillStyle = "#d97706";
    ctx.fillRect(28, 214, 156, 78);
    ctx.fillStyle = "#8c1d18";
    ctx.fillRect(204, 158, 280, 134);
    ctx.strokeStyle = "#14161a";
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, 502, 310);
    return finalizeTex(c, 1, 1, true);
}

function drawDeckPlanks() {
    const c = makeCanvas(512, 512);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#987c5d";
    ctx.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 32) {
        const shade = ((y / 32) % 3) * 7 - 7;
        ctx.fillStyle = `rgb(${152 + shade},${124 + shade},${93 + shade})`;
        ctx.fillRect(0, y, 512, 30);
        ctx.fillStyle = "rgba(42, 28, 16, 0.55)";
        ctx.fillRect(0, y + 30, 512, 2);
    }
    return finalizeTex(c, 5, 4, true);
}

function drawLicensePlate() {
    const c = makeCanvas(256, 128);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#f4f6f9";
    ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = "#1e3a8a";
    ctx.fillRect(0, 0, 256, 28);
    ctx.fillStyle = "#facc15";
    ctx.font = "600 15px sans-serif";
    ctx.fillText("SAN ANDREAS", 74, 20);
    ctx.fillStyle = "#0f172a";
    ctx.font = "600 44px monospace";
    ctx.fillText("28RLU683", 20, 92);
    return finalizeTex(c, 1, 1, true);
}

function drawBroadleafTexture() {
    const c = makeCanvas(512, 512);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#2b4d22";
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 950; i += 1) {
        const x = (i * 197 + (i >> 3) * 41) % 512;
        const y = (i * 313 + (i >> 4) * 53) % 512;
        const a = (i * 2.39996) % (Math.PI * 2);
        const rx = 10 + (i % 10);
        const ry = 18 + ((i * 7) % 14);
        const shade = (i * 17) % 42;
        const r = 40 + (shade >> 1) + (i % 16);
        const g = 88 + shade + (i % 24);
        const b = 26 + (i % 14);
        for (const ox of [-512, 0, 512]) {
            for (const oy of [-512, 0, 512]) {
                if (x + ox < -36 || x + ox > 548 || y + oy < -36 || y + oy > 548) continue;
                ctx.save();
                ctx.translate(x + ox, y + oy);
                ctx.rotate(a);
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.beginPath();
                ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = "rgba(18, 38, 14, 0.35)";
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(0, -ry * 0.85);
                ctx.lineTo(0, ry * 0.85);
                ctx.stroke();
                ctx.restore();
            }
        }
    }
    return finalizeTex(c, 3, 3, true);
}

function drawLightPoolTexture() {
    const c = makeCanvas(256, 256);
    const ctx = c.getContext("2d");
    const grad = ctx.createRadialGradient(128, 128, 4, 128, 128, 124);
    grad.addColorStop(0, "rgba(255, 224, 155, 0.95)");
    grad.addColorStop(0.28, "rgba(255, 196, 112, 0.56)");
    grad.addColorStop(0.62, "rgba(255, 168, 78, 0.18)");
    grad.addColorStop(1, "rgba(255, 150, 60, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
}

function drawLightConeTexture() {
    const c = makeCanvas(128, 256);
    const ctx = c.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "rgba(255, 232, 178, 0.72)");
    grad.addColorStop(0.25, "rgba(255, 200, 118, 0.28)");
    grad.addColorStop(0.75, "rgba(255, 172, 82, 0.06)");
    grad.addColorStop(1, "rgba(255, 160, 70, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
}

export function createWetRoadMaterial(pbrAsphalt, fallbackAsphalt, isIntersection = false) {
    const wetnessUniform = { value: 0.78 };
    const mat = new THREE.MeshPhysicalMaterial({
        color: 0x454b54,
        map: (pbrAsphalt && pbrAsphalt.map) || fallbackAsphalt,
        normalMap: pbrAsphalt ? pbrAsphalt.normalMap : null,
        normalScale: new THREE.Vector2(0.52, 0.52),
        roughnessMap: pbrAsphalt ? pbrAsphalt.roughnessMap : null,
        roughness: 0.86,
        metalness: 0.04,
        clearcoat: 0.65,
        clearcoatRoughness: 0.1,
        envMapIntensity: 0.76
    });

    mat.onBeforeCompile = (shader) => {
        shader.uniforms.uWetness = wetnessUniform;
        shader.vertexShader = shader.vertexShader
            .replace(
                "#include <common>",
                `#include <common>
varying vec3 vRoadWorldPos;
varying vec2 vRoadUv;`
            )
            .replace(
                "#include <worldpos_vertex>",
                `#include <worldpos_vertex>
vRoadWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
vRoadUv = uv;`
            );

        shader.fragmentShader = shader.fragmentShader
            .replace(
                "#include <common>",
                `#include <common>
uniform float uWetness;
varying vec3 vRoadWorldPos;
varying vec2 vRoadUv;

float gtaHash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float gtaNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(gtaHash(i), gtaHash(i + vec2(1.0, 0.0)), u.x),
        mix(gtaHash(i + vec2(0.0, 1.0)), gtaHash(i + vec2(1.0, 1.0)), u.x),
        u.y
    );
}
float gtaFbm2(vec2 p) {
    return 0.65 * gtaNoise(p) + 0.35 * gtaNoise(p * 2.04);
}
float gtaFbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
        v += a * gtaNoise(p);
        p *= 2.03;
        a *= 0.5;
    }
    return v;
}`
            )
            .replace(
                "#include <color_fragment>",
                `#include <color_fragment>
float roadCamDist = length(vRoadWorldPos.xz - cameraPosition.xz);
float puddleMask = 0.0;
float microNoise = 0.5;
if (roadCamDist < 165.0) {
    float puddleFbm = roadCamDist < 90.0
        ? gtaFbm(vRoadWorldPos.xz * 0.068 + vec2(1.7, 3.1))
        : gtaFbm2(vRoadWorldPos.xz * 0.068 + vec2(1.7, 3.1));
    microNoise = roadCamDist < 90.0 ? gtaNoise(vRoadWorldPos.xz * 0.65) : 0.5;
    float roadTrack = ${isIntersection ? "0.1" : "exp(-pow((abs(vRoadUv.x - 0.5) - 0.24) * 7.5, 2.0)) * 0.14"};
    float puddleThresh = mix(0.88, 0.44, uWetness);
    float distFade = 1.0 - smoothstep(115.0, 165.0, roadCamDist);
    puddleMask = smoothstep(puddleThresh, puddleThresh + 0.15, puddleFbm + roadTrack + microNoise * 0.06) * uWetness * distFade;
}
float dampFactor = mix(1.0, 0.56, uWetness * 0.65);
diffuseColor.rgb *= mix(dampFactor, 0.34, puddleMask);
${
    isIntersection
        ? `
float cxA = step(0.04, vRoadUv.x) * step(vRoadUv.x, 0.96);
float cyA = step(0.04, vRoadUv.y) * step(vRoadUv.y, 0.96);
float barX = step(0.42, fract(vRoadUv.x * 11.0));
float barY = step(0.42, fract(vRoadUv.y * 11.0));
float zTop = step(0.87, vRoadUv.y) * step(vRoadUv.y, 0.965) * cxA * barX;
float zBot = step(0.035, vRoadUv.y) * step(vRoadUv.y, 0.13) * cxA * barX;
float zLft = step(0.035, vRoadUv.x) * step(vRoadUv.x, 0.13) * cyA * barY;
float zRgt = step(0.87, vRoadUv.x) * step(vRoadUv.x, 0.965) * cyA * barY;
float zebra = clamp(zTop + zBot + zLft + zRgt, 0.0, 1.0);
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.76, 0.78, 0.8), zebra * 0.82);`
        : `
float uX = vRoadUv.x;
float wear = 0.78 + 0.22 * microNoise;
float dblY = (smoothstep(0.012, 0.004, abs(uX - 0.487)) + smoothstep(0.012, 0.004, abs(uX - 0.513)));
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86, 0.64, 0.18), clamp(dblY, 0.0, 1.0) * wear * 0.92);
float dashPhase = step(0.42, fract(vRoadUv.y * 1.45));
float laneW = (smoothstep(0.01, 0.003, abs(uX - 0.255)) + smoothstep(0.01, 0.003, abs(uX - 0.745))) * dashPhase;
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.82, 0.84, 0.86), clamp(laneW, 0.0, 1.0) * wear * 0.78);
float redCurb = smoothstep(0.036, 0.018, uX) + smoothstep(0.964, 0.982, uX);
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.62, 0.18, 0.15), clamp(redCurb, 0.0, 1.0) * 0.88);`
}`
            )
            .replace(
                "#include <roughnessmap_fragment>",
                `#include <roughnessmap_fragment>
roughnessFactor = mix(roughnessFactor * mix(0.95, 0.72, uWetness), 0.1, puddleMask);`
            )
            .replace(
                "#include <clearcoat_roughness_fragment>",
                `#include <clearcoat_roughness_fragment>
clearcoatRoughness = mix(0.52 - uWetness * 0.2, 0.08, puddleMask);
clearcoat = mix(0.06 + uWetness * 0.24, 0.78, puddleMask);`
            );
    };

    return { material: mat, wetnessUniform };
}

export function createGtaTextures() {
    const fallbackAsphalt = drawFallbackAsphalt();
    const glassInterior = drawGlassInteriorMaps();
    const palmFrond = drawPalmFrondTexture();
    const broadleaf = drawBroadleafTexture();
    const lightPool = drawLightPoolTexture();
    const lightCone = drawLightConeTexture();
    const billboardA = drawBillboard(0);
    const billboardB = drawBillboard(1);
    const safehouseArt = drawSafehouseArt();
    const deckPlanks = drawDeckPlanks();
    const plate = drawLicensePlate();

    const all = [
        fallbackAsphalt,
        glassInterior.map,
        glassInterior.emissiveMap,
        palmFrond,
        broadleaf,
        lightPool,
        lightCone,
        billboardA,
        billboardB,
        safehouseArt,
        deckPlanks,
        plate
    ];

    return {
        fallbackAsphalt,
        glassInterior,
        palmFrond,
        broadleaf,
        lightPool,
        lightCone,
        billboardA,
        billboardB,
        safehouseArt,
        deckPlanks,
        plate,
        dispose() {
            for (const t of all) t.dispose();
        }
    };
}
