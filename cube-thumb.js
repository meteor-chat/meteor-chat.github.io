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

const PITCH = -0.42;
const ROLL = 0.1;
const COS_P = Math.cos(PITCH);
const SIN_P = Math.sin(PITCH);
const COS_R = Math.cos(ROLL);
const SIN_R = Math.sin(ROLL);
const SCALE = 33;
const DIST = 4.5;
const SPEED = 0.02;

let currentCanvas = null;
let currentCtx = null;
let animId = null;
let isVisible = false;
let angleY = 0;

function renderFrame() {
    if (!currentCtx || !currentCanvas) return;
    const w = currentCanvas.width;
    const h = currentCanvas.height;
    const cx = w / 2;
    const cy = h / 2;

    currentCtx.clearRect(0, 0, w, h);

    const cosY = Math.cos(angleY);
    const sinY = Math.sin(angleY);

    const rotVerts = VERTICES.map(([x, y, z]) => {
        const x1 = x * cosY + z * sinY;
        const y1 = y;
        const z1 = -x * sinY + z * cosY;

        const x2 = x1;
        const y2 = y1 * COS_P - z1 * SIN_P;
        const z2 = y1 * SIN_P + z1 * COS_P;

        const x3 = x2 * COS_R - y2 * SIN_R;
        const y3 = x2 * SIN_R + y2 * COS_R;
        const z3 = z2;

        const k = DIST / (DIST - z3);
        return {
            px: cx + x3 * SCALE * k,
            py: cy + y3 * SCALE * k,
            z: z3
        };
    });

    const sortedFaces = FACES.map((f) => {
        const avgZ = (rotVerts[f[0]].z + rotVerts[f[1]].z + rotVerts[f[2]].z + rotVerts[f[3]].z) / 4;
        return { face: f, z: avgZ };
    }).sort((a, b) => a.z - b.z);

    sortedFaces.forEach((sf) => {
        const f = sf.face;
        currentCtx.beginPath();
        currentCtx.moveTo(rotVerts[f[0]].px, rotVerts[f[0]].py);
        currentCtx.lineTo(rotVerts[f[1]].px, rotVerts[f[1]].py);
        currentCtx.lineTo(rotVerts[f[2]].px, rotVerts[f[2]].py);
        currentCtx.lineTo(rotVerts[f[3]].px, rotVerts[f[3]].py);
        currentCtx.closePath();
        currentCtx.fillStyle = sf.z > 0 ? "rgba(56, 189, 248, 0.22)" : "rgba(30, 64, 175, 0.12)";
        currentCtx.fill();
    });

    currentCtx.strokeStyle = "#38bdf8";
    currentCtx.lineWidth = 3;
    currentCtx.lineCap = "round";
    currentCtx.lineJoin = "round";

    EDGES.forEach(([i, j]) => {
        currentCtx.beginPath();
        currentCtx.moveTo(rotVerts[i].px, rotVerts[i].py);
        currentCtx.lineTo(rotVerts[j].px, rotVerts[j].py);
        currentCtx.stroke();
    });
}

function loop() {
    if (!isVisible) {
        animId = null;
        return;
    }
    angleY += SPEED;
    if (angleY > Math.PI * 2) angleY -= Math.PI * 2;
    renderFrame();
    animId = requestAnimationFrame(loop);
}

export function initCubeThumbnail() {
    const canvas = document.getElementById("cube-card-thumb");
    if (!canvas) return;
    currentCanvas = canvas;
    currentCtx = canvas.getContext("2d");
    if (!currentCtx) return;

    isVisible = true;
    renderFrame();
    if (!animId) animId = requestAnimationFrame(loop);

    const card = canvas.closest(".math-card") || canvas;

    if (typeof window !== "undefined" && "IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const nowVisible = entry.isIntersecting && !card.classList.contains("math-hidden");
                if (nowVisible !== isVisible) {
                    isVisible = nowVisible;
                    if (isVisible && !animId) {
                        animId = requestAnimationFrame(loop);
                    }
                }
            });
        }, { threshold: 0.05 });
        observer.observe(card);

        const mutObserver = new MutationObserver(() => {
            const isHidden = card.classList.contains("math-hidden") || card.style.display === "none";
            if (isHidden && isVisible) {
                isVisible = false;
            } else if (!isHidden && !isVisible) {
                isVisible = true;
                if (!animId) animId = requestAnimationFrame(loop);
            }
        });
        mutObserver.observe(card, { attributes: true, attributeFilter: ["class", "style"] });
    } else {
        isVisible = true;
        animId = requestAnimationFrame(loop);
    }
}
