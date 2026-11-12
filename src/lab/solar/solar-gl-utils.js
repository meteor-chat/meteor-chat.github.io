export function compileShader(gl, type, source) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, source);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh);
        return null;
    }
    return sh;
}

export function createProgram(gl, vsSrc, fsSrc) {
    const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
    if (!vs || !fs) return null;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        gl.deleteProgram(prog);
        return null;
    }
    return prog;
}

export function buildSphereBuffers(gl, latSeg = 32, lonSeg = 48) {
    const pos = [];
    const norm = [];
    const uv = [];
    const idx = [];
    for (let y = 0; y <= latSeg; y += 1) {
        const v = y / latSeg;
        const theta = v * Math.PI;
        const sinT = Math.sin(theta);
        const cosT = Math.cos(theta);
        for (let x = 0; x <= lonSeg; x += 1) {
            const u = x / lonSeg;
            const phi = u * Math.PI * 2;
            const nx = Math.cos(phi) * sinT;
            const ny = cosT;
            const nz = Math.sin(phi) * sinT;
            pos.push(nx, ny, nz);
            norm.push(nx, ny, nz);
            uv.push(u, v);
        }
    }
    for (let y = 0; y < latSeg; y += 1) {
        for (let x = 0; x < lonSeg; x += 1) {
            const i0 = y * (lonSeg + 1) + x;
            const i1 = i0 + lonSeg + 1;
            idx.push(i0, i1, i0 + 1, i1, i1 + 1, i0 + 1);
        }
    }
    const upload = (target, arr) => {
        const buf = gl.createBuffer();
        gl.bindBuffer(target, buf);
        gl.bufferData(target, arr, gl.STATIC_DRAW);
        return buf;
    };
    return {
        vbo: upload(gl.ARRAY_BUFFER, new Float32Array(pos)),
        nbo: upload(gl.ARRAY_BUFFER, new Float32Array(norm)),
        tbo: upload(gl.ARRAY_BUFFER, new Float32Array(uv)),
        ibo: upload(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx)),
        count: idx.length
    };
}

export function createGLTexture(gl, texData, clampEdge = false) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texData.width, texData.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, texData.data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, clampEdge ? gl.CLAMP_TO_EDGE : gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
}
