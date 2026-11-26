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

function drawRoadAlbedo() {
    const c = makeCanvas(512, 512);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#1d2128";
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 4200; i += 1) {
        const x = (i * 97) % 512;
        const y = (i * 211) % 512;
        const v = 24 + ((i * 31) % 24);
        ctx.fillStyle = `rgb(${v},${v + 2},${v + 6})`;
        ctx.fillRect(x, y, 2, 2);
    }

    ctx.fillStyle = "rgba(12, 15, 20, 0.34)";
    ctx.fillRect(92, 0, 56, 512);
    ctx.fillRect(364, 0, 56, 512);

    ctx.fillStyle = "#c9463c";
    ctx.fillRect(0, 0, 12, 512);
    ctx.fillRect(500, 0, 12, 512);

    ctx.fillStyle = "#e2b23b";
    ctx.fillRect(247, 0, 6, 512);
    ctx.fillRect(259, 0, 6, 512);

    ctx.fillStyle = "rgba(235, 240, 246, 0.82)";
    for (let y = 16; y < 512; y += 64) {
        ctx.fillRect(132, y, 5, 32);
        ctx.fillRect(375, y, 5, 32);
    }
    return finalizeTex(c, 1, 1, true);
}

function drawRoadRoughness() {
    const c = makeCanvas(512, 512);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#c8c8c8";
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 24; i += 1) {
        const x = ((i * 173 + 67) % 440) + 36;
        const y = ((i * 293 + 41) % 460) + 26;
        const rx = 26 + ((i * 47) % 56);
        const ry = 44 + ((i * 71) % 92);
        const grad = ctx.createRadialGradient(x, y, rx * 0.15, x, y, Math.max(rx, ry));
        grad.addColorStop(0, "rgba(12, 12, 12, 0.96)");
        grad.addColorStop(0.65, "rgba(38, 38, 38, 0.85)");
        grad.addColorStop(1, "rgba(200, 200, 200, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, ((i * 19) % 10) * 0.1, 0, Math.PI * 2);
        ctx.fill();
    }
    return finalizeTex(c, 1, 1, false);
}

function drawIntersectionAlbedo() {
    const c = makeCanvas(512, 512);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#1e222a";
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 2600; i += 1) {
        const x = (i * 131) % 512;
        const y = (i * 197) % 512;
        const v = 26 + (i % 18);
        ctx.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
        ctx.fillRect(x, y, 2, 2);
    }
    ctx.fillStyle = "rgba(232, 238, 245, 0.82)";
    for (let i = 48; i < 464; i += 32) {
        ctx.fillRect(i, 14, 16, 46);
        ctx.fillRect(i, 452, 16, 46);
        ctx.fillRect(14, i, 46, 16);
        ctx.fillRect(452, i, 46, 16);
    }
    return finalizeTex(c, 1, 1, true);
}

function drawFacade(kind) {
    const albedoC = makeCanvas(512, 512);
    const emC = makeCanvas(512, 512);
    const actx = albedoC.getContext("2d");
    const ectx = emC.getContext("2d");
    ectx.fillStyle = "#000000";
    ectx.fillRect(0, 0, 512, 512);

    if (kind === "glassTower") {
        actx.fillStyle = "#223447";
        actx.fillRect(0, 0, 512, 512);
        for (let row = 0; row < 16; row += 1) {
            const y = row * 32;
            actx.fillStyle = "#364b60";
            actx.fillRect(0, y, 512, 5);
            for (let col = 0; col < 12; col += 1) {
                const x = col * 42 + 4;
                const lit = ((row * 31 + col * 17) % 11) < 4;
                actx.fillStyle = lit ? "#7cb4d8" : "#2f5774";
                actx.fillRect(x, y + 6, 36, 22);
                if (lit) {
                    ectx.fillStyle = ((row + col) % 3 === 0) ? "#ffd89c" : "#c6e8ff";
                    ectx.fillRect(x + 2, y + 8, 32, 18);
                }
            }
        }
    } else if (kind === "officeLight") {
        actx.fillStyle = "#d9d4c8";
        actx.fillRect(0, 0, 512, 512);
        for (let row = 0; row < 12; row += 1) {
            const y = row * 42;
            actx.fillStyle = "#bdb7aa";
            actx.fillRect(0, y, 512, 10);
            for (let col = 0; col < 10; col += 1) {
                const x = col * 50 + 6;
                const lit = ((row * 19 + col * 29) % 9) < 3;
                actx.fillStyle = "#2c4154";
                actx.fillRect(x, y + 13, 38, 22);
                if (lit) {
                    ectx.fillStyle = "#ffe2b0";
                    ectx.fillRect(x + 3, y + 15, 32, 18);
                }
            }
        }
    } else if (kind === "diner") {
        actx.fillStyle = "#f2ebe1";
        actx.fillRect(0, 0, 512, 512);
        for (let i = 0; i < 16; i += 1) {
            actx.fillStyle = i % 2 === 0 ? "#c82828" : "#f7f5f0";
            actx.fillRect(i * 32, 0, 32, 118);
        }
        actx.fillStyle = "#1f2b38";
        actx.fillRect(26, 170, 460, 220);
        ectx.fillStyle = "#ffca78";
        ectx.fillRect(36, 182, 440, 196);
        ectx.fillStyle = "#ff5a36";
        ectx.fillRect(0, 118, 512, 14);
    } else if (kind === "apartment") {
        actx.fillStyle = "#cdb69c";
        actx.fillRect(0, 0, 512, 512);
        for (let row = 0; row < 10; row += 1) {
            const y = row * 51;
            actx.fillStyle = "#a38d74";
            actx.fillRect(0, y + 40, 512, 6);
            for (let col = 0; col < 8; col += 1) {
                const x = col * 64 + 10;
                const lit = ((row * 13 + col * 23) % 7) < 3;
                actx.fillStyle = "#31424e";
                actx.fillRect(x, y + 10, 42, 28);
                if (lit) {
                    ectx.fillStyle = "#ffd08a";
                    ectx.fillRect(x + 4, y + 12, 34, 24);
                }
            }
        }
    } else {
        actx.fillStyle = "#dfd4c3";
        actx.fillRect(0, 0, 512, 512);
        actx.fillStyle = "#a33c32";
        actx.fillRect(0, 300, 512, 26);
        for (let col = 0; col < 6; col += 1) {
            const x = col * 84 + 10;
            actx.fillStyle = "#293c4d";
            actx.fillRect(x, 340, 66, 130);
            ectx.fillStyle = "#ffdba1";
            ectx.fillRect(x + 6, 348, 54, 114);
            actx.fillStyle = "#364b5c";
            actx.fillRect(x + 6, 80, 52, 110);
            if (col % 2 === 0) {
                ectx.fillStyle = "#ffe5ba";
                ectx.fillRect(x + 10, 88, 44, 94);
            }
        }
    }

    const rep = kind === "diner" ? [1, 1] : [2, 2];
    return {
        map: finalizeTex(albedoC, rep[0], rep[1], true),
        emissiveMap: finalizeTex(emC, rep[0], rep[1], true)
    };
}

function drawSidewalkAlbedo() {
    const c = makeCanvas(256, 256);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#9aa0a6";
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = "#767c84";
    ctx.lineWidth = 3;
    for (let i = 0; i <= 256; i += 64) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 256);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(256, i);
        ctx.stroke();
    }
    return finalizeTex(c, 2, 2, true);
}

function drawBillboard(variant) {
    const c = makeCanvas(512, 256);
    const ctx = c.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 512, 256);
    if (variant === 0) {
        grad.addColorStop(0, "#10233f");
        grad.addColorStop(1, "#2f6b94");
    } else {
        grad.addColorStop(0, "#4a1525");
        grad.addColorStop(1, "#d95b26");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.beginPath();
    ctx.arc(390, 128, 92, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "600 46px sans-serif";
    ctx.fillText(variant === 0 ? "VINEWOOD" : "LOS SANTOS", 34, 112);
    ctx.fillStyle = "#fde047";
    ctx.font = "600 24px sans-serif";
    ctx.fillText(variant === 0 ? "NEW SEASON LIVE" : "WEST COAST CUSTOMS", 36, 162);
    return finalizeTex(c, 1, 1, true);
}

function drawSafehouseArt() {
    const c = makeCanvas(256, 256);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#7f1414";
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = "#d92b2b";
    ctx.beginPath();
    ctx.moveTo(20, 230);
    ctx.lineTo(130, 24);
    ctx.lineTo(238, 190);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#18181b";
    ctx.fillRect(72, 118, 112, 86);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(104, 146, 56, 58);
    return finalizeTex(c, 1, 1, true);
}

function drawDeckPlanks() {
    const c = makeCanvas(256, 256);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#b59672";
    ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 32) {
        ctx.fillStyle = y % 64 === 0 ? "#c4a580" : "#aa8a66";
        ctx.fillRect(0, y, 256, 30);
        ctx.fillStyle = "#6e553b";
        ctx.fillRect(0, y + 30, 256, 2);
    }
    return finalizeTex(c, 4, 4, true);
}

function drawPlateTexture() {
    const c = makeCanvas(256, 128);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#eef2f6";
    ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = "#1e3a8a";
    ctx.fillRect(0, 0, 256, 34);
    ctx.fillStyle = "#fde047";
    ctx.font = "600 18px sans-serif";
    ctx.fillText("SAN ANDREAS", 58, 24);
    ctx.fillStyle = "#172554";
    ctx.font = "600 44px monospace";
    ctx.fillText("28RLU683", 18, 96);
    return finalizeTex(c, 1, 1, true);
}

export function createGtaTextures() {
    const textures = {
        roadMap: drawRoadAlbedo(),
        roadRough: drawRoadRoughness(),
        intersectionMap: drawIntersectionAlbedo(),
        sidewalkMap: drawSidewalkAlbedo(),
        glassTower: drawFacade("glassTower"),
        officeLight: drawFacade("officeLight"),
        commercial: drawFacade("commercial"),
        diner: drawFacade("diner"),
        apartment: drawFacade("apartment"),
        billboardA: drawBillboard(0),
        billboardB: drawBillboard(1),
        safehouseArt: drawSafehouseArt(),
        deckPlanks: drawDeckPlanks(),
        plate: drawPlateTexture()
    };

    const dispose = () => {
        const list = [
            textures.roadMap,
            textures.roadRough,
            textures.intersectionMap,
            textures.sidewalkMap,
            textures.glassTower.map,
            textures.glassTower.emissiveMap,
            textures.officeLight.map,
            textures.officeLight.emissiveMap,
            textures.commercial.map,
            textures.commercial.emissiveMap,
            textures.diner.map,
            textures.diner.emissiveMap,
            textures.apartment.map,
            textures.apartment.emissiveMap,
            textures.billboardA,
            textures.billboardB,
            textures.safehouseArt,
            textures.deckPlanks,
            textures.plate
        ];
        for (const t of list) t.dispose();
    };

    return { ...textures, dispose };
}
