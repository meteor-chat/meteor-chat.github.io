import { formatMax3 } from "../math-format.js";

export function evaluateGradient(x1, x2) {
    const dh_dx1 = 3 * Math.pow(x1, 2);
    const dh_dx2 = (2 / 3) * x2;
    const mag = Math.hypot(dh_dx1, dh_dx2);
    return { dh_dx1, dh_dx2, mag };
}

export function evaluateHessian(x1) {
    const h11 = 6 * x1;
    const h22 = 2 / 3;
    const det = 4 * x1;
    let classification = "Sadel / Indefinit";
    let badgeClass = "sa-badge-rej";

    if (x1 > 0.0001) {
        classification = "Konveks Kuat (Strictly Convex)";
        badgeClass = "sa-badge-acc";
    } else if (Math.abs(x1) <= 0.0001) {
        classification = "Titik Belok / Degenerasi (Inflection Ridge)";
        badgeClass = "sa-badge";
    }

    return { h11, h22, det, classification, badgeClass };
}

export function renderObjectiveCriticalAnalysis(x1, x2, container) {
    if (!container || typeof katex === "undefined" || isNaN(x1) || isNaN(x2)) return;

    const grad = evaluateGradient(x1, x2);
    const hess = evaluateHessian(x1);

    const gradTex = `\\nabla h(x_1, x_2) = \\begin{bmatrix} 3x_1^2 \\\\ \\frac{2}{3}x_2 \\end{bmatrix} = \\begin{bmatrix} ${formatMax3(grad.dh_dx1)} \\\\ ${formatMax3(grad.dh_dx2)} \\end{bmatrix}, \\quad \\|\\nabla h\\| = ${formatMax3(grad.mag)}`;

    const hessTex = `H(x_1, x_2) = \\begin{bmatrix} 6x_1 & 0 \\\\ 0 & \\frac{2}{3} \\end{bmatrix} = \\begin{bmatrix} ${formatMax3(hess.h11)} & 0 \\\\ 0 & 0.667 \\end{bmatrix}, \\quad \\det(H) = 4x_1 = ${formatMax3(hess.det)}`;

    container.innerHTML = `
        <div class="math-step-card" style="margin-top: 10px;">
            <div class="math-step-title" style="display:flex;justify-content:space-between;align-items:center;">
                <span>Vektor Gradien &amp; Arah Kenaikan Tertajam</span>
                <span style="font-size:11px;color:#38bdf8;font-family:monospace;">Steepest Ascent</span>
            </div>
            <div id="obj-sci-grad-math" class="math-step-formula"></div>
            <div style="font-size:12px;color:#a1a1aa;margin-top:4px;">
                Arah kenaikan tercepat: <b style="color:#fbbf24;">+∇h</b>. Arah penurunan tercepat (gradient descent): <b style="color:#38bdf8;">-∇h</b>.
            </div>
        </div>

        <div class="math-step-card">
            <div class="math-step-title" style="display:flex;justify-content:space-between;align-items:center;">
                <span>Matriks Hessian &amp; Kelengkungan Lokal</span>
                <span class="sa-badge ${hess.badgeClass}">${hess.classification}</span>
            </div>
            <div id="obj-sci-hess-math" class="math-step-formula"></div>
            <div style="font-size:12px;color:#cbd5e1;margin-top:4px;">
                ${x1 > 0 ? "x₁ > 0 ➔ det(H) > 0, kurva melengkung ke atas membentuk mangkuk cembung." : x1 < 0 ? "x₁ < 0 ➔ det(H) < 0, lanskap berbentuk pelana hiperbolik (saddle)." : "x₁ = 0 ➔ det(H) = 0, garis belok degenerasi (inflection boundary)."}
            </div>
        </div>

        <div class="math-step-card">
            <div class="math-step-title" style="color:#f59e0b;">Penalaran Kritis Ilmiah (Critical Thinking)</div>
            <div class="sa-explain-box" style="margin-top:4px;">
                <p><b>1. Mengapa titik (0, 0) BUKAN minimum lokal?</b><br>
                Meskipun ∇h(0, 0) = 0, di sepanjang sumbu x₁ (saat x₂ = 0) nilai h(x₁, 0) = x₁³. Untuk x₁ &lt; 0 nilai h negatif, sedangkan untuk x₁ &gt; 0 nilai h positif. Jadi (0, 0) adalah <i>titik belok (inflection saddle)</i>, bukan lembah minimum!</p>
                <p><b>2. Mengapa batas domain (box constraints) mutlak diperlukan?</b><br>
                Karena saat x₁ ➔ -∞, fungsi h ➔ -∞ (tidak terbatas ke bawah). Pada Algoritma Genetika, rentang kromosom [x₁_min, x₁_max] dari Formula 1 wajib membatasi ruang pencarian agar solusi optimal terdefinisi dengan stabil.</p>
            </div>
        </div>
    `;

    const gEl = document.getElementById("obj-sci-grad-math");
    if (gEl) {
        try {
            katex.render(gradTex, gEl, { throwOnError: false, displayMode: true });
        } catch {
            gEl.textContent = gradTex;
        }
    }

    const hEl = document.getElementById("obj-sci-hess-math");
    if (hEl) {
        try {
            katex.render(hessTex, hEl, { throwOnError: false, displayMode: true });
        } catch {
            hEl.textContent = hessTex;
        }
    }
}
