function fmtNum(val, decimals = 4) {
    if (!Number.isFinite(val)) return "NaN";
    if (Math.abs(val) < 1e-9) return "0";
    const factor = Math.pow(10, decimals);
    const rounded = Math.round(val * factor) / factor;
    return String(rounded);
}

function fmtSigned(val, decimals = 4) {
    const str = fmtNum(val, decimals);
    if (val > 1e-9) return `+${str}`;
    return str;
}

function fmtEqNum(val, decimals = 4) {
    const num = Math.abs(val) < 1e-9 ? 0 : Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals);
    return num < 0 ? `(${num})` : String(num);
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function safeKatex(tex, el, displayMode = true) {
    if (!el) return;
    const k = typeof katex !== "undefined" ? katex : (typeof window !== "undefined" ? window.katex : undefined);
    if (k && typeof k.render === "function") {
        try {
            k.render(tex, el, { throwOnError: false, trust: true, displayMode });
            return;
        } catch {}
    }
    el.textContent = tex;
}

export function renderTopFormula39() {
    const el = document.getElementById("math-calc-formula-display-39");
    if (!el) return;
    const tex = "\\hat{y} = \\htmlClass{lr-tok-w0}{w_0} + \\htmlClass{lr-tok-w1}{w_1} x";
    safeKatex(tex, el, false);
}

function buildOlsHtml(ols, queryLabel) {
    const eqSign = ols.w1 >= 0 ? "+" : "-";
    const domainBadge = ols.query.isExtrapolation
        ? `<span class="lr-badge lr-badge-warn">Ekstrapolasi: di luar [${fmtNum(ols.minX, 2)}, ${fmtNum(ols.maxX, 2)}]</span>`
        : `<span class="lr-badge lr-badge-ok">Interpolasi: di dalam [${fmtNum(ols.minX, 2)}, ${fmtNum(ols.maxX, 2)}]</span>`;

    const devRowsHtml = ols.rows.map((r) => `
        <tr>
            <td>${escapeHtml(r.label)}</td>
            <td>${fmtNum(r.x, 3)}</td>
            <td>${fmtNum(r.y, 3)}</td>
            <td>${fmtSigned(r.dx, 3)}</td>
            <td>${fmtSigned(r.dy, 3)}</td>
            <td>${fmtSigned(r.dxdy, 4)}</td>
            <td>${fmtNum(r.dx2, 4)}</td>
        </tr>
    `).join("");

    const predRowsHtml = ols.predRows.map((r) => `
        <tr>
            <td>${escapeHtml(r.label)}</td>
            <td>${fmtNum(r.x, 3)}</td>
            <td>${fmtNum(r.y, 3)}</td>
            <td>${fmtNum(r.yHat, 4)}</td>
            <td>${fmtSigned(r.residual, 4)}</td>
            <td>${fmtNum(r.sqErr, 4)}</td>
            <td>${fmtNum(r.absErr, 4)}</td>
        </tr>
    `).join("");

    const chk1Badge = ols.checks.passesCentroid
        ? `<span class="lr-badge lr-badge-ok">&#10003; Lulus</span>`
        : `<span class="lr-badge lr-badge-err">&#10007; Gagal</span>`;
    const chk2Badge = ols.checks.residualsSumZero
        ? `<span class="lr-badge lr-badge-ok">&#10003; Lulus</span>`
        : `<span class="lr-badge lr-badge-err">&#10007; Gagal</span>`;

    return `
        <div class="lr-hero-eq-card">
            <div class="lr-hero-eq-label">Persamaan Garis Regresi Terpasang</div>
            <div id="lr-katex-line" class="lr-katex-box"></div>
            <div class="lr-hero-meta">
                Model meminimalkan $\\text{SSE}$ pada n = ${ols.n} titik pengamatan
            </div>
        </div>

        <div class="lr-kpi-grid">
            <div class="lr-kpi-card lr-kpi-cyan">
                <span class="lr-kpi-lbl">Slope (w1)</span>
                <span class="lr-kpi-val">${fmtNum(ols.w1, 4)}</span>
            </div>
            <div class="lr-kpi-card lr-kpi-amber">
                <span class="lr-kpi-lbl">Intercept (w0)</span>
                <span class="lr-kpi-val">${fmtNum(ols.w0, 4)}</span>
            </div>
            <div class="lr-kpi-card">
                <span class="lr-kpi-lbl">SSE Total</span>
                <span class="lr-kpi-val">${fmtNum(ols.sse, 4)}</span>
            </div>
            <div class="lr-kpi-card">
                <span class="lr-kpi-lbl">MSE</span>
                <span class="lr-kpi-val">${fmtNum(ols.mse, 4)}</span>
            </div>
            <div class="lr-kpi-card">
                <span class="lr-kpi-lbl">RMSE (Satuan y)</span>
                <span class="lr-kpi-val">${fmtNum(ols.rmse, 4)}</span>
            </div>
            <div class="lr-kpi-card lr-kpi-emerald">
                <span class="lr-kpi-lbl">MAE (Satuan y)</span>
                <span class="lr-kpi-val">${fmtNum(ols.mae, 4)}</span>
            </div>
            <div class="lr-kpi-card">
                <span class="lr-kpi-lbl">R2 Score</span>
                <span class="lr-kpi-val">${fmtNum(ols.r2, 4)}</span>
            </div>
            <div class="lr-kpi-card">
                <span class="lr-kpi-lbl">Korelasi (r)</span>
                <span class="lr-kpi-val">${fmtNum(ols.r, 4)}</span>
            </div>
        </div>

        <div class="math-step-card lr-step-card">
            <div class="lr-step-head">
                <span class="math-step-title">Prediksi Titik Baru (${escapeHtml(queryLabel)})</span>
                ${domainBadge}
            </div>
            <div id="lr-katex-predict" class="lr-katex-box"></div>
            <div class="lr-subnote">
                ${ols.query.isExtrapolation
                    ? `Peringatan (Week 9 Slide 14): nilai x = ${fmtNum(ols.query.x, 2)} berada di luar rentang data latih [${fmtNum(ols.minX, 2)}, ${fmtNum(ols.maxX, 2)}]. Hubungan linear mungkin tidak berlaku di luar rentang ini.`
                    : `Prediksi aman di dalam rentang pengamatan [${fmtNum(ols.minX, 2)}, ${fmtNum(ols.maxX, 2)}].`}
            </div>
        </div>

        <div class="math-step-card lr-step-card">
            <div class="lr-step-head">
                <span class="math-step-title">Langkah 1-4: Tabulasi, Mean &amp; Deviasi</span>
                <span class="lr-mono-tag">x&#772; = ${fmtNum(ols.meanX, 4)}, y&#772; = ${fmtNum(ols.meanY, 4)}</span>
            </div>
            <div class="lr-table-scroll">
                <table class="lr-table">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>x</th>
                            <th>y</th>
                            <th>dx = x - x&#772;</th>
                            <th>dy = y - y&#772;</th>
                            <th>dx &middot; dy</th>
                            <th>dx&sup2;</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${devRowsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td>Total / Mean</td>
                            <td>&Sigma;=${fmtNum(ols.sumX, 2)}</td>
                            <td>&Sigma;=${fmtNum(ols.sumY, 2)}</td>
                            <td>${fmtNum(ols.sumDx, 4)}</td>
                            <td>${fmtNum(ols.sumDy, 4)}</td>
                            <td>Sxy = ${fmtNum(ols.sxy, 4)}</td>
                            <td>Sxx = ${fmtNum(ols.sxx, 4)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div class="lr-subnote">Cek gratis: seluruh nilai pada kolom dx&sup2; wajib bernilai non-negatif (&ge; 0).</div>
        </div>

        <div class="math-step-card lr-step-card">
            <div class="lr-step-head">
                <span class="math-step-title">Langkah 5-6: Penurunan Slope (w1) &amp; Intercept (w0)</span>
                <span class="lr-mono-tag">Closed-Form OLS</span>
            </div>
            <div id="lr-katex-weights" class="lr-katex-box"></div>
            <div class="lr-explain-box">
                <p><b>Membaca Slope w1 (${eqSign}${fmtNum(Math.abs(ols.w1), 4)}):</b> Di antara data latih, tiap kenaikan 1 satuan pada x berasosiasi dengan perubahan rata-rata sebesar ${fmtNum(ols.w1, 4)} satuan pada y (asosiasi, bukan bukti kausalitas).</p>
                <p><b>Arti Intercept w0 (${fmtNum(ols.w0, 4)}):</b> Prediksi model saat x = 0. Jika x = 0 tidak ada dalam sampel, nilai ini murni patokan matematis garis lurus.</p>
            </div>
        </div>

        <div class="math-step-card lr-step-card">
            <div class="lr-step-head">
                <span class="math-step-title">Langkah 7-8: Prediksi, Residual &amp; Evaluasi Galat</span>
                <span class="lr-mono-tag">SSE: Makin Kecil Makin Baik</span>
            </div>
            <div class="lr-table-scroll">
                <table class="lr-table">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>x</th>
                            <th>Aktual (y)</th>
                            <th>Prediksi (y&#770;)</th>
                            <th>Residual (y - y&#770;)</th>
                            <th>Residual&sup2; (SSE)</th>
                            <th>|Residual|</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${predRowsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="4">Total (&Sigma;)</td>
                            <td>${fmtNum(ols.sumResidual, 4)}</td>
                            <td>SSE = ${fmtNum(ols.sse, 4)}</td>
                            <td>${fmtNum(ols.sumAbsErr, 4)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div id="lr-katex-metrics" class="lr-katex-box"></div>
            <div class="lr-subnote lr-note-accent">
                <b>Catatan MAE (Slide 10 Week 9):</b> MAE merata-ratakan nilai absolut residual |y - y&#770;| (${fmtNum(ols.sumAbsErr, 4)} / ${ols.n} = ${fmtNum(ols.mae, 4)}), bukan residual bertanda (yang jumlahnya selalu 0 sehingga akan menghasilkan 0). Selalu laporkan MAE atau RMSE dalam satuan target daripada hanya mengandalkan R&sup2;.
            </div>
        </div>

        <div class="math-step-card lr-step-card">
            <div class="lr-step-head">
                <span class="math-step-title">Langkah 9: Two Free Sanity Checks</span>
                <span class="lr-mono-tag">Verifikasi Hitung Manual</span>
            </div>
            <div class="lr-checks-grid">
                <div class="lr-check-item">
                    <div class="lr-check-top">
                        <span>Check 1: Garis Melewati (x&#772;, y&#772;)</span>
                        ${chk1Badge}
                    </div>
                    <div class="lr-check-math">
                        ${fmtNum(ols.w0, 4)} + ${fmtEqNum(ols.w1, 4)} &times; ${fmtEqNum(ols.meanX, 4)} = ${fmtNum(ols.checks.yAtMeanX, 4)} (y&#772; = ${fmtNum(ols.meanY, 4)})
                    </div>
                </div>
                <div class="lr-check-item">
                    <div class="lr-check-top">
                        <span>Check 2: Jumlah Residual = 0</span>
                        ${chk2Badge}
                    </div>
                    <div class="lr-check-math">
                        &Sigma;(y - y&#770;) = ${fmtNum(ols.checks.sumResidual, 6)}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function buildGdHtml(ols, gdState) {
    const stdMode = gdState.standardise;
    const rows = gdState.history.slice(-12);
    const traceHtml = rows.map((item) => `
        <tr>
            <td>${item.iter}</td>
            <td>${fmtNum(stdMode ? item.theta0 : item.w0, 4)}</td>
            <td>${fmtNum(stdMode ? item.theta1 : item.w1, 4)}</td>
            <td>${fmtNum(item.mse, 4)}</td>
            <td>${fmtSigned(item.grad0, 4)}</td>
            <td>${fmtSigned(item.grad1, 4)}</td>
        </tr>
    `).join("");

    const gapMse = ols?.valid ? Math.abs(gdState.mse - ols.mse) : NaN;
    const paramLabel0 = stdMode ? "&theta;0 (z-space)" : "w0 (Intercept)";
    const paramLabel1 = stdMode ? "&theta;1 (z-space)" : "w1 (Slope)";

    return `
        <div class="lr-kpi-grid">
            <div class="lr-kpi-card">
                <span class="lr-kpi-lbl">Iterasi Saat Ini</span>
                <span class="lr-kpi-val">${gdState.iter}</span>
            </div>
            <div class="lr-kpi-card ${gdState.diverged ? "lr-kpi-rose" : "lr-kpi-cyan"}">
                <span class="lr-kpi-lbl">MSE Loss GD</span>
                <span class="lr-kpi-val">${Number.isFinite(gdState.mse) ? fmtNum(gdState.mse, 4) : "Divergen"}</span>
            </div>
            <div class="lr-kpi-card lr-kpi-amber">
                <span class="lr-kpi-lbl">w0 (Ruang Asli)</span>
                <span class="lr-kpi-val">${fmtNum(gdState.w0, 4)}</span>
            </div>
            <div class="lr-kpi-card lr-kpi-emerald">
                <span class="lr-kpi-lbl">w1 (Ruang Asli)</span>
                <span class="lr-kpi-val">${fmtNum(gdState.w1, 4)}</span>
            </div>
        </div>

        <div class="math-step-card lr-step-card">
            <div class="lr-step-head">
                <span class="math-step-title">Pembaruan Gradien (Langkah 3-6 Week 9)</span>
                <span class="lr-mono-tag">${stdMode ? "Standardisasi z aktif" : "Skala x asli"}</span>
            </div>
            <div id="lr-katex-gd" class="lr-katex-box"></div>
            <div class="lr-subnote">
                ${ols?.valid
                    ? `Target OLS Eksak: w0* = ${fmtNum(ols.w0, 4)}, w1* = ${fmtNum(ols.w1, 4)}, MSE* = ${fmtNum(ols.mse, 4)} (selisih MSE: ${Number.isFinite(gapMse) ? fmtNum(gapMse, 5) : "NaN"}).`
                    : "Tambahkan minimal 2 titik x berbeda untuk target perbandingan OLS."}
            </div>
        </div>

        <div class="math-step-card lr-step-card">
            <div class="lr-step-head">
                <span class="math-step-title">Tabel Jejak Iterasi (12 Langkah Terakhir)</span>
                <span class="lr-mono-tag">${stdMode ? "Menampilkan &theta;0, &theta;1 pada z = (x - x&#772;)/&sigma;" : "Tanpa Standardisasi"}</span>
            </div>
            <div class="lr-table-scroll">
                <table class="lr-table">
                    <thead>
                        <tr>
                            <th>iter</th>
                            <th>${paramLabel0}</th>
                            <th>${paramLabel1}</th>
                            <th>MSE</th>
                            <th>&part;L/&part;w0</th>
                            <th>&part;L/&part;w1</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${traceHtml}
                    </tbody>
                </table>
            </div>
            <div class="lr-explain-box">
                <p><b>Mengapa perlu Standardisasi z?</b> Fitur berskala besar membuat gradien w1 jauh lebih besar dari w0 sehingga learning rate yang pas untuk satu bobot dapat meledakkan bobot lain (Slide 27 Week 9).</p>
                <p><b>Cegah Kebocoran Data (Data Leakage, Week 7 Slide 37):</b> Hitung rata-rata dan simpangan baku hanya dari data latih (training set), lalu terapkan ke data uji.</p>
                <p><b>Pembaruan Serentak (Slide 40 Week 9):</b> Hitung &part;L/&part;w0 dan &part;L/&part;w1 memakai bobot lama terlebih dahulu sebelum memperbarui keduanya secara bersamaan.</p>
            </div>
        </div>
    `;
}

export function renderLRSteps(ols, mode, gdState, queryLabel = "F") {
    const container = document.getElementById("math39-steps-container");
    if (!container) return;

    if (!ols || !ols.valid) {
        container.innerHTML = `<div class="lr-alert-box" role="alert">${escapeHtml(ols?.reason || "Masukkan minimal 2 titik data dengan nilai x berbeda.")}</div>`;
        return;
    }

    if (mode === "gd" && gdState) {
        container.innerHTML = buildGdHtml(ols, gdState);
        const gdEl = document.getElementById("lr-katex-gd");
        const active0 = gdState.standardise ? "\\theta_0" : "w_0";
        const active1 = gdState.standardise ? "\\theta_1" : "w_1";
        const val0 = fmtNum(gdState.standardise ? gdState.theta0 : gdState.w0, 4);
        const val1 = fmtNum(gdState.standardise ? gdState.theta1 : gdState.w1, 4);
        const g0Str = fmtNum(gdState.grad0, 4);
        const g1Str = fmtNum(gdState.grad1, 4);
        const texGd = `\\begin{aligned}
L &= \\frac{1}{n}\\sum (\\hat{y}_i - y_i)^2 = ${fmtNum(gdState.mse, 4)} \\\\[4pt]
\\frac{\\partial L}{\\partial ${active0}} &= \\frac{2}{n}\\sum (\\hat{y}_i - y_i) = ${g0Str}, \\quad \\frac{\\partial L}{\\partial ${active1}} = \\frac{2}{n}\\sum (\\hat{y}_i - y_i)\\,${gdState.standardise ? "z_i" : "x_i"} = ${g1Str} \\\\[4pt]
${active0} &= ${val0}, \\quad ${active1} = ${val1} \\; (\\hat{y} = ${fmtNum(gdState.w0, 4)} + ${fmtNum(gdState.w1, 4)}x)
\\end{aligned}`;
        safeKatex(texGd, gdEl, true);
        return;
    }

    container.innerHTML = buildOlsHtml(ols, queryLabel);

    const metaEl = container.querySelector(".lr-hero-meta");
    if (metaEl) {
        metaEl.textContent = `Meminimalkan jumlah kuadrat residual SSE = ${fmtNum(ols.sse, 4)} pada n = ${ols.n} titik data`;
    }

    const eqSign = ols.w1 >= 0 ? "+" : "-";
    const lineTex = `\\hat{y} = \\htmlClass{lr-tok-w0}{${fmtNum(ols.w0, 4)}} ${eqSign} \\htmlClass{lr-tok-w1}{${fmtNum(Math.abs(ols.w1), 4)}}\\,x`;
    safeKatex(lineTex, document.getElementById("lr-katex-line"), true);

    const w1Term = ols.w1 >= 0 ? `+ ${fmtNum(ols.w1, 4)}` : `- ${fmtNum(Math.abs(ols.w1), 4)}`;
    const prod = ols.w1 * ols.query.x;
    const prodStr = prod >= 0 ? `+ ${fmtNum(prod, 4)}` : `- ${fmtNum(Math.abs(prod), 4)}`;
    const predictTex = `\\begin{aligned}
x_{\\text{${escapeHtml(queryLabel)}}} &= ${fmtNum(ols.query.x, 4)} \\\\[4pt]
\\hat{y} &= ${fmtNum(ols.w0, 4)} ${w1Term} \\times ${fmtEqNum(ols.query.x, 4)} \\\\[4pt]
&= ${fmtNum(ols.w0, 4)} ${prodStr} = \\mathbf{${fmtNum(ols.query.yHat, 4)}}
\\end{aligned}`;
    safeKatex(predictTex, document.getElementById("lr-katex-predict"), true);

    const weightsTex = `\\begin{aligned}
\\htmlClass{lr-tok-w1}{w_1} &= \\frac{S_{xy}}{S_{xx}} = \\frac{\\sum dx \\cdot dy}{\\sum dx^2} = \\frac{${fmtNum(ols.sxy, 4)}}{${fmtNum(ols.sxx, 4)}} = \\mathbf{${fmtNum(ols.w1, 4)}} \\\\[6pt]
\\htmlClass{lr-tok-w0}{w_0} &= \\bar{y} - w_1 \\bar{x} = ${fmtNum(ols.meanY, 4)} - (${fmtNum(ols.w1, 4)})(${fmtNum(ols.meanX, 4)}) \\\\[4pt]
&= ${fmtNum(ols.meanY, 4)} - ${fmtEqNum(ols.w1 * ols.meanX, 4)} = \\mathbf{${fmtNum(ols.w0, 4)}}
\\end{aligned}`;
    safeKatex(weightsTex, document.getElementById("lr-katex-weights"), true);

    const metricsTex = `\\begin{aligned}
\\text{MSE} &= \\frac{\\text{SSE}}{n} = \\frac{${fmtNum(ols.sse, 4)}}{${ols.n}} = \\mathbf{${fmtNum(ols.mse, 4)}} \\\\[4pt]
\\text{RMSE} &= \\sqrt{\\text{MSE}} = \\sqrt{${fmtNum(ols.mse, 4)}} = \\mathbf{${fmtNum(ols.rmse, 4)}} \\\\[4pt]
\\text{MAE} &= \\frac{\\sum |y_i - \\hat{y}_i|}{n} = \\frac{${fmtNum(ols.sumAbsErr, 4)}}{${ols.n}} = \\mathbf{${fmtNum(ols.mae, 4)}} \\\\[4pt]
R^2 &= 1 - \\frac{\\text{SSE}}{\\text{SST}} = 1 - \\frac{${fmtNum(ols.sse, 4)}}{${fmtNum(ols.sst, 4)}} = \\mathbf{${fmtNum(ols.r2, 4)}}
\\end{aligned}`;
    safeKatex(metricsTex, document.getElementById("lr-katex-metrics"), true);
}
