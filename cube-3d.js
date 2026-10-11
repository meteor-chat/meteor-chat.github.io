const VERTICES = [
    [-1, -1, -1],
    [ 1, -1, -1],
    [ 1,  1, -1],
    [-1,  1, -1],
    [-1, -1,  1],
    [ 1, -1,  1],
    [ 1,  1,  1],
    [-1,  1,  1]
];

const EDGES = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7]
];

const FACES = [
    [0, 1, 2, 3],
    [5, 4, 7, 6],
    [4, 0, 3, 7],
    [1, 5, 6, 2],
    [3, 2, 6, 7],
    [4, 5, 1, 0]
];

function createAxisAngleMatrix(x, y, z, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const t = 1 - c;
    return [
        [t * x * x + c,     t * x * y - s * z, t * x * z + s * y],
        [t * x * y + s * z, t * y * y + c,     t * y * z - s * x],
        [t * x * z - s * y, t * y * z + s * x, t * z * z + c    ]
    ];
}

function multiplyMatrix(a, b) {
    const r = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            r[i][j] = a[i][0] * b[0][j] + a[i][1] * b[1][j] + a[i][2] * b[2][j];
        }
    }
    return r;
}

function orthonormalize(m) {
    let [v0, v1, v2] = [
        [m[0][0], m[1][0], m[2][0]],
        [m[0][1], m[1][1], m[2][1]],
        [m[0][2], m[1][2], m[2][2]]
    ];
    const norm = (v) => {
        const l = Math.hypot(v[0], v[1], v[2]) || 1;
        return [v[0] / l, v[1] / l, v[2] / l];
    };
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    v0 = norm(v0);
    const d01 = dot(v0, v1);
    v1 = norm([v1[0] - d01 * v0[0], v1[1] - d01 * v0[1], v1[2] - d01 * v0[2]]);
    v2 = norm([
        v0[1] * v1[2] - v0[2] * v1[1],
        v0[2] * v1[0] - v0[0] * v1[2],
        v0[0] * v1[1] - v0[1] * v1[0]
    ]);
    return [
        [v0[0], v1[0], v2[0]],
        [v0[1], v1[1], v2[1]],
        [v0[2], v1[2], v2[2]]
    ];
}

let rotationMatrix = multiplyMatrix(
    createAxisAngleMatrix(1, 0, 0, 0.45),
    createAxisAngleMatrix(0, 1, 0, -0.65)
);

let currentCanvas = null;
let currentGetValue = null;
let isDragging = false;
let lastX = 0;
let lastY = 0;

export function renderCube() {
    if (!currentCanvas) return;
    const ctx = currentCanvas.getContext("2d");
    if (!ctx) return;

    const w = currentCanvas.width;
    const h = currentCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const cubeSize = Math.min(w, h) * 0.22;
    const D = 400;
    const F = 360;

    ctx.clearRect(0, 0, w, h);

    const rotVerts = VERTICES.map(v => {
        const x = v[0] * rotationMatrix[0][0] + v[1] * rotationMatrix[0][1] + v[2] * rotationMatrix[0][2];
        const y = v[0] * rotationMatrix[1][0] + v[1] * rotationMatrix[1][1] + v[2] * rotationMatrix[1][2];
        const z = v[0] * rotationMatrix[2][0] + v[1] * rotationMatrix[2][1] + v[2] * rotationMatrix[2][2];
        return {
            x: x * cubeSize,
            y: y * cubeSize,
            z: z * cubeSize
        };
    });

    const projVerts = rotVerts.map(v => {
        const scale = F / (D - v.z);
        return {
            x: cx + v.x * scale,
            y: cy + v.y * scale,
            z: v.z
        };
    });

    const sortedFaces = FACES.map(f => {
        const avgZ = (rotVerts[f[0]].z + rotVerts[f[1]].z + rotVerts[f[2]].z + rotVerts[f[3]].z) / 4;
        return { face: f, z: avgZ };
    }).sort((a, b) => a.z - b.z);

    sortedFaces.forEach(sf => {
        const f = sf.face;
        ctx.beginPath();
        ctx.moveTo(projVerts[f[0]].x, projVerts[f[0]].y);
        ctx.lineTo(projVerts[f[1]].x, projVerts[f[1]].y);
        ctx.lineTo(projVerts[f[2]].x, projVerts[f[2]].y);
        ctx.lineTo(projVerts[f[3]].x, projVerts[f[3]].y);
        ctx.closePath();
        ctx.fillStyle = sf.z > 0 ? "rgba(56, 189, 248, 0.22)" : "rgba(30, 64, 175, 0.14)";
        ctx.fill();
    });

    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    EDGES.forEach(e => {
        const p1 = projVerts[e[0]];
        const p2 = projVerts[e[1]];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    });

    projVerts.forEach(p => {
        ctx.fillStyle = "#e0f2fe";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    const val = currentGetValue ? currentGetValue() : "12";
    const textStr = String(val);

    ctx.font = "bold 13px 'Google Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    EDGES.forEach(e => {
        const v1 = rotVerts[e[0]];
        const v2 = rotVerts[e[1]];
        let mx = (v1.x + v2.x) / 2;
        let my = (v1.y + v2.y) / 2;
        let mz = (v1.z + v2.z) / 2;
        const offset = 1.14;
        mx *= offset;
        my *= offset;
        mz *= offset;

        const scale = F / (D - mz);
        const px = cx + mx * scale;
        const py = cy + my * scale;

        ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
        ctx.lineWidth = 3.5;
        ctx.strokeText(textStr, px, py);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(textStr, px, py);
    });
}

function handleDrag(dx, dy) {
    const dist = Math.hypot(dx, dy);
    if (dist < 0.5) return;
    const angle = dist * 0.009;
    const ax = dy / dist;
    const ay = dx / dist;
    const deltaRot = createAxisAngleMatrix(ax, ay, 0, angle);
    rotationMatrix = orthonormalize(multiplyMatrix(deltaRot, rotationMatrix));
    renderCube();
}

export function initCube(canvas, getValueCallback) {
    currentCanvas = canvas;
    currentGetValue = getValueCallback;

    const onStart = (x, y) => {
        isDragging = true;
        lastX = x;
        lastY = y;
        canvas.classList.add("is-grabbing");
    };

    const onMove = (x, y) => {
        if (!isDragging) return;
        const dx = x - lastX;
        const dy = y - lastY;
        lastX = x;
        lastY = y;
        handleDrag(dx, dy);
    };

    const onEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        canvas.classList.remove("is-grabbing");
    };

    canvas.addEventListener("mousedown", (e) => {
        e.preventDefault();
        onStart(e.clientX, e.clientY);
    });

    window.addEventListener("mousemove", (e) => {
        onMove(e.clientX, e.clientY);
    });

    window.addEventListener("mouseup", onEnd);

    canvas.addEventListener("touchstart", (e) => {
        if (e.touches.length > 0) {
            e.preventDefault();
            onStart(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: false });

    window.addEventListener("touchmove", (e) => {
        if (isDragging && e.touches.length > 0) {
            e.preventDefault();
            onMove(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: false });

    window.addEventListener("touchend", onEnd);
    renderCube();
}
