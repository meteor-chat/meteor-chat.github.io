import {
    PLANET_VS,
    PLANET_FS,
    RING_VS,
    RING_FS,
    CORONA_VS,
    CORONA_FS,
    POINT_VS,
    POINT_FS,
    buildViewProjFromBasis,
    buildBodyModelMatrix,
    buildRingModelMatrix
} from "./solar-shaders.js";
import { createProgram, buildSphereBuffers, createGLTexture } from "./solar-gl-utils.js";
import { generatePlanetTextureData, generateRingTextureData } from "./planet-textures.js";

const ATMO_MAP = {
    mercury: [0.75, 0.75, 0.78, 0.12],
    venus: [0.95, 0.65, 0.28, 0.42],
    earth: [0.35, 0.72, 1.0, 0.78],
    mars: [0.88, 0.45, 0.25, 0.28],
    jupiter: [0.88, 0.68, 0.45, 0.22],
    saturn: [0.92, 0.82, 0.62, 0.22],
    uranus: [0.55, 0.92, 0.98, 0.62],
    neptune: [0.28, 0.62, 1.0, 0.72]
};

export function createWebGLSolarRenderer(canvas) {
    if (!canvas || typeof canvas.getContext !== "function") return null;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: true })
        || canvas.getContext("experimental-webgl", { alpha: false, antialias: true });
    if (!gl) return null;

    const planetProg = createProgram(gl, PLANET_VS, PLANET_FS);
    const ringProg = createProgram(gl, RING_VS, RING_FS);
    const coronaProg = createProgram(gl, CORONA_VS, CORONA_FS);
    const pointProg = createProgram(gl, POINT_VS, POINT_FS);
    if (!planetProg || !ringProg || !coronaProg || !pointProg) return null;

    const sphere = buildSphereBuffers(gl);
    const ringVbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, ringVbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, 0, -1, 0, 0, 1, 0, -1, 1, 0, -1, 0, 1, 0, 1,
        1, 0, -1, 1, 0, 1, 0, 1, 1, 1, -1, 0, 1, 0, 1
    ]), gl.STATIC_DRAW);

    const coronaVbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, coronaVbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW);

    const ptPosVbo = gl.createBuffer();
    const ptColVbo = gl.createBuffer();
    const ptSizeVbo = gl.createBuffer();
    const bodyTextures = new Map();
    const ringTextures = new Map();

    function ensureBodyTex(id) {
        if (!bodyTextures.has(id)) {
            bodyTextures.set(id, createGLTexture(gl, generatePlanetTextureData(id, 160, 80), false));
        }
        return bodyTextures.get(id);
    }

    function ensureRingTex(id) {
        if (!ringTextures.has(id)) {
            ringTextures.set(id, createGLTexture(gl, generateRingTextureData(id, 256), true));
        }
        return ringTextures.get(id);
    }

    function drawPointBatch(viewProj, dpr, points, softMode, additive) {
        const count = points.length;
        if (!count) return;
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 4);
        const siz = new Float32Array(count);
        for (let i = 0; i < count; i += 1) {
            const p = points[i];
            pos[i * 3] = p.x;
            pos[i * 3 + 1] = p.y;
            pos[i * 3 + 2] = p.z;
            col[i * 4] = p.r;
            col[i * 4 + 1] = p.g;
            col[i * 4 + 2] = p.b;
            col[i * 4 + 3] = p.a;
            siz[i] = p.size;
        }
        gl.useProgram(pointProg);
        gl.blendFunc(gl.SRC_ALPHA, additive ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA);
        gl.uniformMatrix4fv(gl.getUniformLocation(pointProg, "uViewProj"), false, viewProj);
        gl.uniform1f(gl.getUniformLocation(pointProg, "uPixelRatio"), dpr);
        gl.uniform1f(gl.getUniformLocation(pointProg, "uSoftMode"), softMode ? 1.0 : 0.0);

        const aPos = gl.getAttribLocation(pointProg, "aPos");
        gl.bindBuffer(gl.ARRAY_BUFFER, ptPosVbo);
        gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

        const aColor = gl.getAttribLocation(pointProg, "aColor");
        gl.bindBuffer(gl.ARRAY_BUFFER, ptColVbo);
        gl.bufferData(gl.ARRAY_BUFFER, col, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(aColor);
        gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 0, 0);

        const aSize = gl.getAttribLocation(pointProg, "aSize");
        gl.bindBuffer(gl.ARRAY_BUFFER, ptSizeVbo);
        gl.bufferData(gl.ARRAY_BUFFER, siz, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(aSize);
        gl.vertexAttribPointer(aSize, 1, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.POINTS, 0, count);
        gl.disableVertexAttribArray(aPos);
        gl.disableVertexAttribArray(aColor);
        gl.disableVertexAttribArray(aSize);
    }

    return {
        resize(width, height, dpr = 1) {
            canvas.width = Math.max(1, Math.round(width * dpr));
            canvas.height = Math.max(1, Math.round(height * dpr));
            gl.viewport(0, 0, canvas.width, canvas.height);
        },
        renderFrame(scene) {
            const { camBasis, dpr, sunPosRel, bodies, ringBodies, starPoints, asteroidPoints, cometPoints, sunRadius } = scene;
            const viewProj = buildViewProjFromBasis(camBasis, 0.25, 4500);
            gl.clearColor(0.055, 0.082, 0.098, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.BLEND);

            gl.depthMask(false);
            drawPointBatch(viewProj, dpr, starPoints, false, false);

            gl.depthMask(true);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.useProgram(planetProg);
            gl.uniformMatrix4fv(gl.getUniformLocation(planetProg, "uViewProj"), false, viewProj);
            gl.uniform3f(gl.getUniformLocation(planetProg, "uSunPos"), sunPosRel.x, sunPosRel.y, sunPosRel.z);
            gl.uniform3f(gl.getUniformLocation(planetProg, "uCamPos"), camBasis.eye.x, camBasis.eye.y, camBasis.eye.z);

            const aPos = gl.getAttribLocation(planetProg, "aPos");
            const aNorm = gl.getAttribLocation(planetProg, "aNorm");
            const aUv = gl.getAttribLocation(planetProg, "aUv");
            gl.bindBuffer(gl.ARRAY_BUFFER, sphere.vbo);
            gl.enableVertexAttribArray(aPos);
            gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, sphere.nbo);
            gl.enableVertexAttribArray(aNorm);
            gl.vertexAttribPointer(aNorm, 3, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, sphere.tbo);
            gl.enableVertexAttribArray(aUv);
            gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphere.ibo);

            for (const body of bodies) {
                const atmo = ATMO_MAP[body.id] || [1.0, 0.7, 0.3, 0.0];
                const model = buildBodyModelMatrix(body.posRel, body.radius, body.tiltDeg, body.spinRad);
                gl.uniformMatrix4fv(gl.getUniformLocation(planetProg, "uModel"), false, model);
                gl.uniform1f(gl.getUniformLocation(planetProg, "uIsSun"), body.id === "sun" ? 1.0 : 0.0);
                gl.uniform3f(gl.getUniformLocation(planetProg, "uAtmoColor"), atmo[0], atmo[1], atmo[2]);
                gl.uniform1f(gl.getUniformLocation(planetProg, "uAtmoStrength"), atmo[3]);
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, ensureBodyTex(body.id));
                gl.uniform1i(gl.getUniformLocation(planetProg, "uTex"), 0);
                gl.drawElements(gl.TRIANGLES, sphere.count, gl.UNSIGNED_SHORT, 0);
            }
            gl.disableVertexAttribArray(aPos);
            gl.disableVertexAttribArray(aNorm);
            gl.disableVertexAttribArray(aUv);

            drawPointBatch(viewProj, dpr, asteroidPoints, false, false);

            gl.depthMask(false);
            gl.useProgram(ringProg);
            gl.uniformMatrix4fv(gl.getUniformLocation(ringProg, "uViewProj"), false, viewProj);
            gl.uniform3f(gl.getUniformLocation(ringProg, "uSunPos"), sunPosRel.x, sunPosRel.y, sunPosRel.z);
            gl.bindBuffer(gl.ARRAY_BUFFER, ringVbo);
            const rPos = gl.getAttribLocation(ringProg, "aPos");
            const rUv = gl.getAttribLocation(ringProg, "aUv");
            gl.enableVertexAttribArray(rPos);
            gl.vertexAttribPointer(rPos, 3, gl.FLOAT, false, 20, 0);
            gl.enableVertexAttribArray(rUv);
            gl.vertexAttribPointer(rUv, 2, gl.FLOAT, false, 20, 12);

            for (const rb of ringBodies) {
                const outerR = rb.radius * rb.ringOuter;
                const innerRatio = rb.ringInner / rb.ringOuter;
                const rModel = buildRingModelMatrix(rb.posRel, outerR, rb.tiltDeg, rb.ringYaw);
                gl.uniformMatrix4fv(gl.getUniformLocation(ringProg, "uModel"), false, rModel);
                gl.uniform3f(gl.getUniformLocation(ringProg, "uPlanetPos"), rb.posRel.x, rb.posRel.y, rb.posRel.z);
                gl.uniform1f(gl.getUniformLocation(ringProg, "uPlanetRadius"), rb.radius);
                gl.uniform1f(gl.getUniformLocation(ringProg, "uInnerRatio"), innerRatio);
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, ensureRingTex(rb.id));
                gl.uniform1i(gl.getUniformLocation(ringProg, "uRingTex"), 0);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            }
            gl.disableVertexAttribArray(rPos);
            gl.disableVertexAttribArray(rUv);

            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            gl.useProgram(coronaProg);
            gl.uniformMatrix4fv(gl.getUniformLocation(coronaProg, "uViewProj"), false, viewProj);
            gl.uniform3f(gl.getUniformLocation(coronaProg, "uSunPos"), sunPosRel.x, sunPosRel.y, sunPosRel.z);
            gl.uniform3f(gl.getUniformLocation(coronaProg, "uCamRight"), camBasis.right.x, camBasis.right.y, camBasis.right.z);
            gl.uniform3f(gl.getUniformLocation(coronaProg, "uCamUp"), camBasis.up.x, camBasis.up.y, camBasis.up.z);
            gl.uniform1f(gl.getUniformLocation(coronaProg, "uSize"), sunRadius * 2.8);
            const cAttr = gl.getAttribLocation(coronaProg, "aCorner");
            gl.bindBuffer(gl.ARRAY_BUFFER, coronaVbo);
            gl.enableVertexAttribArray(cAttr);
            gl.vertexAttribPointer(cAttr, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            gl.disableVertexAttribArray(cAttr);

            drawPointBatch(viewProj, dpr, cometPoints, true, true);
            gl.depthMask(true);
        },
        dispose() {
            bodyTextures.forEach((t) => gl.deleteTexture(t));
            ringTextures.forEach((t) => gl.deleteTexture(t));
            gl.deleteBuffer(sphere.vbo);
            gl.deleteBuffer(sphere.nbo);
            gl.deleteBuffer(sphere.tbo);
            gl.deleteBuffer(sphere.ibo);
            gl.deleteBuffer(ringVbo);
            gl.deleteBuffer(coronaVbo);
            gl.deleteBuffer(ptPosVbo);
            gl.deleteBuffer(ptColVbo);
            gl.deleteBuffer(ptSizeVbo);
        }
    };
}
