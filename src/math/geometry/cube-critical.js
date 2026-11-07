import { formatMax3 } from "../math-format.js";

export function evaluateCubeCritical(rawS) {
    const s = typeof rawS === "number" ? rawS : parseFloat(rawS);
    if (isNaN(s) || s <= 0) {
        return {
            valid: false,
            s: 0,
            vol: 0,
            lp: 0,
            pr: 0,
            ds: 0,
            dr: 0,
            bd: 0,
            ratioSAV: 0,
            euler: 2,
            magicAngleDeg: 54.736,
            bodyAngleDeg: 70.529,
            sphericity: 0.806,
            errorMultiplierV: 3,
            errorMultiplierLp: 2
        };
    }

    const vol = Math.pow(s, 3);
    const lp = 6 * Math.pow(s, 2);
    const pr = 12 * s;
    const ds = s * Math.SQRT2;
    const dr = s * Math.sqrt(3);
    const bd = Math.pow(s, 2) * Math.SQRT2;
    const ratioSAV = 6 / s;
    const magicAngleDeg = Math.acos(1 / Math.sqrt(3)) * (180 / Math.PI);
    const bodyAngleDeg = Math.acos(1 / 3) * (180 / Math.PI);
    const sphericity = Math.cbrt(Math.PI) / Math.cbrt(6);

    return {
        valid: true,
        s,
        vol,
        lp,
        pr,
        ds,
        dr,
        bd,
        ratioSAV,
        euler: 2,
        magicAngleDeg,
        bodyAngleDeg,
        sphericity,
        errorMultiplierV: 3,
        errorMultiplierLp: 2
    };
}

export function renderCubeCriticalCards(rawS, container) {
    if (!container || typeof katex === "undefined") return;
    const crit = evaluateCubeCritical(rawS);
    if (!crit.valid) {
        container.innerHTML = "";
        return;
    }

    const sStr = formatMax3(crit.s);
    const vStr = formatMax3(crit.vol);
    const lpStr = formatMax3(crit.lp);
    const prStr = formatMax3(crit.pr);
    const dsStr = formatMax3(crit.ds);
    const drStr = formatMax3(crit.dr);
    const bdStr = formatMax3(crit.bd);
    const savStr = formatMax3(crit.ratioSAV);
    const angStr = formatMax3(crit.magicAngleDeg);

    container.innerHTML = `
        <div class="math-step-card" style="margin-top: 14px;">
            <div class="math-step-title" style="display:flex;justify-content:space-between;align-items:center;">
                <span>Penurunan Matematis 6 Metrik Silabus</span>
                <span style="font-size:11px;color:#38bdf8;font-family:monospace;">s = ${sStr}</span>
            </div>
            <div id="cube-math-derivations" class="math-step-formula" style="font-size:13px;line-height:1.7;"></div>
        </div>

        <div class="math-step-card">
            <div class="math-step-title" style="display:flex;justify-content:space-between;align-items:center;">
                <span>Hukum Kuadrat-Kubik Galileo (Square-Cube Law)</span>
                <span class="sa-badge ${crit.s < 6 ? "sa-badge-acc" : crit.s === 6 ? "sa-badge" : "sa-badge-rej"}">
                    ${crit.s < 6 ? "Dominasi Luas (Lp > V)" : crit.s === 6 ? "Titik Keseimbangan (Lp = V)" : "Dominasi Volume (V > Lp)"}
                </span>
            </div>
            <div id="cube-math-sav" class="math-step-formula"></div>
            <div class="sa-explain-box" style="margin-top:6px;">
                <p><b>1. Rasio Permukaan-ke-Volume:</b> <i>L_p / V = 6 / s = ${savStr}</i>. Saat ukuran kubus membesar secara linear <i>s &rarr; &infin;</i>, rasio luas permukaan terhadap volume menyusut mendekati nol. Fenomena ini menjelaskan mengapa gajah memerlukan telinga lebar untuk membuang panas tubuh, sementara serangga kecil kehilangan panas tubuh dengan sangat cepat.</p>
                <p><b>2. Batas Kritis Skala s = 6:</b> Pada <i>s = 6</i>, nilai numerik <i>L_p = 6(36) = 216</i> sama persis dengan <i>V = 6³ = 216</i>. Untuk <i>s &gt; 6</i>, volume kubus selalu melampaui luas permukaannya secara eksponensial.</p>
            </div>
        </div>

        <div class="math-step-card">
            <div class="math-step-title" style="display:flex;justify-content:space-between;align-items:center;">
                <span>Karakteristik Euler &amp; Sudut Magis Diagonal Ruang</span>
                <span style="font-size:11px;color:#a78bfa;font-family:monospace;">&theta; &approx; ${angStr}&deg;</span>
            </div>
            <div id="cube-math-euler" class="math-step-formula"></div>
            <div class="sa-explain-box" style="margin-top:6px;">
                <p><b>1. Invarian Topologis Euler:</b> <i>V - E + F = 8 - 12 + 6 = 2</i>. Karakteristik ini bersifat universal untuk setiap polihedron cembung sederhana (genus nol).</p>
                <p><b>2. Sudut Magis (Magic Angle):</b> Sudut antara diagonal ruang dan rusuk kubus memenuhi <i>cos(&theta;) = 1/&radic;3 &rArr; &theta; &approx; 54.74&deg;</i>. Sudut ini sangat krusial dalam fisika zat padat dan spektroskopi NMR (Nuclear Magnetic Resonance) untuk mengeliminasi interaksi dipolar.</p>
            </div>
        </div>

        <div class="math-step-card">
            <div class="math-step-title" style="display:flex;justify-content:space-between;align-items:center;">
                <span>Perambatan Ketidakpastian Pengukuran Fisik</span>
                <span style="font-size:11px;color:#f59e0b;font-family:monospace;">Error Propagation</span>
            </div>
            <div id="cube-math-error" class="math-step-formula"></div>
            <div class="sa-explain-box" style="margin-top:6px;">
                <p>Berdasarkan kalkulus diferensial parsial, galat pengukuran relatif pada rusuk <i>(&Delta;s / s)</i> diperbesar hingga <b>3 kali lipat</b> pada volume: <i>&Delta;V / V &approx; 3 (&Delta;s / s)</i> dan <b>2 kali lipat</b> pada luas permukaan: <i>&Delta;L_p / L_p &approx; 2 (&Delta;s / s)</i>. Toleransi instrumen 1% menyebabkan ketidakpastian volume hingga ~3%!</p>
            </div>
        </div>
    `;

    const dEl = document.getElementById("cube-math-derivations");
    if (dEl) {
        const texD = `\\begin{aligned}
        V &= s^3 = ${sStr}^3 = \\mathbf{${vStr}} \\\\[3pt]
        L_p &= 6s^2 = 6(${sStr})^2 = \\mathbf{${lpStr}} \\\\[3pt]
        P_r &= 12s = 12(${sStr}) = \\mathbf{${prStr}} \\\\[3pt]
        d_s &= s\\sqrt{2} = ${sStr}\\sqrt{2} \\approx \\mathbf{${dsStr}} \\\\[3pt]
        d_r &= s\\sqrt{3} = ${sStr}\\sqrt{3} \\approx \\mathbf{${drStr}} \\\\[3pt]
        B_d &= s \\cdot d_s = ${sStr}^2\\sqrt{2} \\approx \\mathbf{${bdStr}}
        \\end{aligned}`;
        try {
            katex.render(texD, dEl, { throwOnError: false, displayMode: true });
        } catch {
            dEl.textContent = texD;
        }
    }

    const savEl = document.getElementById("cube-math-sav");
    if (savEl) {
        const texSAV = `\\frac{L_p}{V} = \\frac{6s^2}{s^3} = \\frac{6}{s} = \\frac{6}{${sStr}} = \\mathbf{${savStr}}`;
        try {
            katex.render(texSAV, savEl, { throwOnError: false, displayMode: true });
        } catch {
            savEl.textContent = texSAV;
        }
    }

    const eulerEl = document.getElementById("cube-math-euler");
    if (eulerEl) {
        const texE = `\\chi = V_{\\text{titik}} - E_{\\text{rusuk}} + F_{\\text{bidang}} = 8 - 12 + 6 = \\mathbf{2}, \\quad \\cos(\\theta) = \\frac{1}{\\sqrt{3}} \\implies \\theta \\approx \\mathbf{${angStr}^\\circ}`;
        try {
            katex.render(texE, eulerEl, { throwOnError: false, displayMode: true });
        } catch {
            eulerEl.textContent = texE;
        }
    }

    const errEl = document.getElementById("cube-math-error");
    if (errEl) {
        const texErr = `\\frac{dV}{V} = 3\\frac{ds}{s}, \\quad \\frac{dL_p}{L_p} = 2\\frac{ds}{s}, \\quad \\frac{dP_r}{P_r} = \\frac{ds}{s}`;
        try {
            katex.render(texErr, errEl, { throwOnError: false, displayMode: true });
        } catch {
            errEl.textContent = texErr;
        }
    }
}
