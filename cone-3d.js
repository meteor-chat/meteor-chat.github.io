const BASE_SEGMENTS = 40;

function buildConeModel(radius, height) {
    const r = radius > 0 ? radius : 1;
    const t = height > 0 ? height : 1;
    const maxDim = Math.max(r, t);
    const nr = (r / maxDim);
    const nt = (t / maxDim);

    const halfH = nt / 2;
    const apex = [0, -halfH, 0];

    const base = [];
    for (let i = 0; i < BASE_SEGMENTS; i++) {
        const a = (i / BASE_SEGMENTS) * Math.PI * 2;
        base.push([nr * Math.cos(a), halfH, nr * Math.sin(a)]);
    }
    return { apex, base, halfH, nr };
}

function createAxisAngleMatrix(x, y, z, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const tt = 1 - c;
    return [
        [tt * x * x + c,     tt * x * y - s * z, tt * x * z + s * y],
        [tt * x * y + s * z, tt * y * y + c,     tt * y * z - s * x],
        [tt * x * z - s * y, tt * y * z + s * x, tt * z * z + c    ]
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
    createAxisAngleMatrix(1, 0, 0, 0.35),
    createAxisAngleMatrix(0, 1, 0, -0.6)
);

let currentCanvas = null;
let currentGetDims = null;
let isDragging = false;
let lastX = 0;
let lastY = 0;

function rotate(v) {
    return {
        x: v[0] * rotationMatrix[0][0] + v[1] * rotationMatrix[0][1] + v[2] * rotationMatrix[0][2],
        y: v[0] * rotationMatrix[1][0] + v[1] * rotationMatrix[1][1] + v[2] * rotationMatrix[1][2],
        z: v[0] * rotationMatrix[2][0] + v[1] * rotationMatrix[2][1] + v[2] * rotationMatrix[2][2]
    };
}

export function renderCone() {
    if (!currentCanvas) return;
    const ctx = currentCanvas.getContext("2d");
    if (!ctx) return;

    const w = currentCanvas.width;
    const h = currentCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale3d = Math.min(w, h) * 0.42;
    const D = 400;
    const F = 360;

    ctx.clearRect(0, 0, w, h);

    const dims = currentGetDims ? currentGetDims() : { r: 1, t: 1, rText: "r", tText: "t", sText: "s" };
    const model = buildConeModel(dims.r, dims.t);

    const project = (rv) => {
        const sc = F / (D - rv.z);
        return { x: cx + rv.x * scale3d * sc, y: cy + rv.y * scale3d * sc, z: rv.z };
    };

    const apexR = rotate(model.apex);
    const apexP = project(apexR);
    const baseR = model.base.map(rotate);
    const baseP = baseR.map(project);

    const centerBottomP = project(rotate([0, model.halfH, 0]));
    const centerTopP = project(rotate([0, -model.halfH, 0]));

    ctx.beginPath();
    baseP.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fillStyle = "rgba(30, 64, 175, 0.18)";
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < baseP.length; i++) {
        const p1 = baseP[i];
        const p2 = baseP[(i + 1) % baseP.length];
        ctx.moveTo(apexP.x, apexP.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(56, 189, 248, 0.10)";
    ctx.fill();

    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    baseP.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.stroke();

    let leftIdx = 0;
    let rightIdx = 0;
    baseP.forEach((p, i) => {
        if (p.x < baseP[leftIdx].x) leftIdx = i;
        if (p.x > baseP[rightIdx].x) rightIdx = i;
    });
    [leftIdx, rightIdx].forEach((idx) => {
        ctx.beginPath();
        ctx.moveTo(apexP.x, apexP.y);
        ctx.lineTo(baseP[idx].x, baseP[idx].y);
        ctx.stroke();
    });

    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = "rgba(224, 242, 254, 0.7)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(centerTopP.x, centerTopP.y);
    ctx.lineTo(centerBottomP.x, centerBottomP.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerBottomP.x, centerBottomP.y);
    ctx.lineTo(baseP[rightIdx].x, baseP[rightIdx].y);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "#e0f2fe";
    [apexP, baseP[leftIdx], baseP[rightIdx], centerBottomP].forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.font = "bold 13px 'Google Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const label = (p1, p2, text) => {
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;
        ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
        ctx.lineWidth = 3.5;
        ctx.strokeText(text, mx, my);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(text, mx, my);
    };

    label(apexP, baseP[rightIdx], dims.sText);
    label(centerTopP, centerBottomP, dims.tText);
    label(centerBottomP, baseP[rightIdx], dims.rText);
}

function handleDrag(dx, dy) {
    const dist = Math.hypot(dx, dy);
    if (dist < 0.5) return;
    const angle = dist * 0.009;
    const ax = dy / dist;
    const ay = dx / dist;
    const deltaRot = createAxisAngleMatrix(ax, ay, 0, angle);
    rotationMatrix = orthonormalize(multiplyMatrix(deltaRot, rotationMatrix));
    renderCone();
}

export function initCone(canvas, getDimsCallback) {
    currentCanvas = canvas;
    currentGetDims = getDimsCallback;

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
    renderCone();
}
