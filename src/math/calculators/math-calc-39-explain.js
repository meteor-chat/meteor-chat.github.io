import { fmtNum } from "./math-calc-39-engine.js";

function addPart(parent, part) {
    if (typeof part === "string") {
        parent.appendChild(document.createTextNode(part));
        return;
    }
    const span = document.createElement("span");
    span.className = part.cls ? `lr-explain-val ${part.cls}` : "lr-explain-val";
    span.textContent = String(part.text);
    parent.appendChild(span);
}

export function createExplainBox(parts) {
    const box = document.createElement("div");
    box.className = "lr-explain-box";
    const lead = document.createElement("span");
    lead.className = "lr-explain-tag";
    lead.textContent = "Intinya:";
    const p = document.createElement("p");
    p.className = "lr-explain-text";
    p.appendChild(lead);
    p.appendChild(document.createTextNode(" "));
    parts.forEach((part) => addPart(p, part));
    box.appendChild(p);
    return box;
}

function tok(text, cls = "") {
    return { text, cls };
}

function deviationDir(val, digits = 3) {
    if (Math.abs(val) < 1e-11) return "tepat di rata-rata";
    const mag = fmtNum(Math.abs(val), digits);
    return val < 0 ? `${mag} di bawah rata-rata` : `${mag} di atas rata-rata`;
}

export function buildTabulateExplain(res) {
    const pts = res && Array.isArray(res.points) ? res.points : [];
    if (pts.length === 0) {
        return createExplainBox(["Isi baris data (", tok("x"), " dan ", tok("y"), ") untuk mulai mencari garis lurus terbaik."]);
    }
    if (pts.length === 1) {
        return createExplainBox(["Baru ada ", tok("1", "lr-tok-y"), " data. Tambahkan minimal 1 baris lagi agar dua titik bisa ditarik menjadi garis."]);
    }
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const minX = fmtNum(Math.min(...xs), 3);
    const maxX = fmtNum(Math.max(...xs), 3);
    const minY = fmtNum(Math.min(...ys), 3);
    const maxY = fmtNum(Math.max(...ys), 3);
    const sameX = !res.valid && res.n >= 2;
    if (sameX) {
        return createExplainBox([
            "Ada ",
            tok(String(res.n), "lr-tok-y"),
            " data, tetapi seluruh nilai x bernilai ",
            tok(minX),
            ". Tanpa variasi x, kemiringan garis belum bisa dihitung."
        ]);
    }
    return createExplainBox([
        "Kita punya ",
        tok(String(res.n), "lr-tok-y"),
        " data (x dari ",
        tok(minX === maxX ? minX : `${minX} sampai ${maxX}`),
        ", y dari ",
        tok(minY === maxY ? minY : `${minY} sampai ${maxY}`),
        "). Tujuannya mencari garis lurus paling pas untuk menebak y dari x."
    ]);
}

export function buildLinearExplainCard(stepKey, res) {
    if (!res || !res.valid) return null;
    const { n, points, meanX, meanY, rows, sxy, sxx, w1, w0, predRows, sumResidual, sse, sumAbsRes, mse, rmse, mae } = res;

    if (stepKey === "mean") {
        return createExplainBox([
            "Rata-rata bekerja seperti titik seimbang papan jungkat-jungkit: pusat x di ",
            tok(fmtNum(meanX, 4), "lr-tok-w1"),
            " dan pusat y di ",
            tok(fmtNum(meanY, 4), "lr-tok-w0"),
            ". Semua jarak di langkah berikutnya diukur dari titik tengah (",
            tok(fmtNum(meanX, 4), "lr-tok-w1"),
            ", ",
            tok(fmtNum(meanY, 4), "lr-tok-w0"),
            ") ini."
        ]);
    }

    if (stepKey === "deviations") {
        const r0 = rows[0];
        return createExplainBox([
            "Mengukur jarak tiap data dari pusat. Data ",
            tok(r0.label),
            " punya x = ",
            tok(fmtNum(r0.x, 3)),
            " (",
            deviationDir(r0.dx, 3),
            " ",
            tok(fmtNum(meanX, 4), "lr-tok-w1"),
            " -> dx = ",
            tok(fmtNum(r0.dx, 3)),
            ") dan y = ",
            tok(fmtNum(r0.y, 3)),
            " (",
            deviationDir(r0.dy, 3),
            " ",
            tok(fmtNum(meanY, 4), "lr-tok-w0"),
            " -> dy = ",
            tok(fmtNum(r0.dy, 3)),
            "). Jumlah seluruh dx maupun dy selalu nol."
        ]);
    }

    if (stepKey === "twoSums") {
        const sample = rows.find((r) => Math.abs(r.dx) > 1e-11 && Math.abs(r.dy) > 1e-11) || rows[0];
        const prod = sample.dx * sample.dy;
        const pairSense = prod > 1e-11
            ? "keduanya searah dari rata-rata (+)"
            : prod < -1e-11
                ? "berlawanan arah dari rata-rata (-)"
                : "salah satu tepat di rata-rata (0)";
        const trendText = sxy > 1e-11
            ? "pola naik searah saat x bertambah"
            : sxy < -1e-11
                ? "pola turun berlawanan saat x bertambah"
                : "tidak ada kecenderungan naik ataupun turun";
        return createExplainBox([
            "dx * dy mengecek arah gerak x dan y: data ",
            tok(sample.label),
            " memberi ",
            tok(fmtNum(prod, 3)),
            " (",
            pairSense,
            "). Total ",
            tok(fmtNum(sxy, 4), "lr-tok-w0"),
            " menandakan ",
            trendText,
            ", sedangkan dx^2 (total ",
            tok(fmtNum(sxx, 4), "lr-tok-w1"),
            ") mempositifkan jarak agar sisi kiri dan kanan tidak saling menghapus ke 0."
        ]);
    }

    if (stepKey === "slope") {
        if (Math.abs(w1) < 1e-11) {
            return createExplainBox([
                "Membagi ",
                tok(fmtNum(sxy, 4), "lr-tok-w0"),
                " / ",
                tok(fmtNum(sxx, 4), "lr-tok-w1"),
                " memberi ",
                tok("0", "lr-tok-w1"),
                ". Garis mendatar: setiap kenaikan 1 satuan x tidak mengubah tebakan y."
            ]);
        }
        const move = w1 > 0 ? "naik" : "turun";
        return createExplainBox([
            "Membagi total gerak bersama (",
            tok(fmtNum(sxy, 4), "lr-tok-w0"),
            ") dengan sebaran x (",
            tok(fmtNum(sxx, 4), "lr-tok-w1"),
            ") menghasilkan ",
            tok(fmtNum(w1, 4), "lr-tok-w1"),
            ". Artinya setiap x bertambah 1, prediksi y ",
            move,
            " ",
            tok(fmtNum(Math.abs(w1), 4), "lr-tok-w1"),
            " poin."
        ]);
    }

    if (stepKey === "intercept") {
        if (Math.abs(meanX) < 1e-11) {
            return createExplainBox([
                "Titik awal garis saat x = 0 langsung tepat di rata-rata y (",
                tok(fmtNum(w0, 4), "lr-tok-w0"),
                ") karena pusat x sudah berada di 0."
            ]);
        }
        const shift = w1 * meanX;
        const shiftWord = shift >= 0 ? "naik" : "turun";
        return createExplainBox([
            "Kenapa garis tidak mulai dari 0? Karena garis wajib melewati pusat (",
            tok(fmtNum(meanX, 4), "lr-tok-w1"),
            ", ",
            tok(fmtNum(meanY, 4), "lr-tok-w0"),
            "). Berjalan dari x = 0 ke ",
            tok(fmtNum(meanX, 4), "lr-tok-w1"),
            " membuat garis ",
            shiftWord,
            " sebesar ",
            tok(fmtNum(Math.abs(shift), 4)),
            ", jadi ujung kirinya di x = 0 harus dimulai di ",
            tok(fmtNum(w0, 4), "lr-tok-w0"),
            "."
        ]);
    }

    if (stepKey === "prediction") {
        const p0 = predRows[0];
        const xs = points.map((p) => p.x);
        const minX = fmtNum(Math.min(...xs), 3);
        const maxX = fmtNum(Math.max(...xs), 3);
        const diff = p0.actual - p0.predict;
        const closeness = Math.abs(diff) < 1e-4
            ? "persis tepat dengan nilai asli"
            : diff > 0
                ? "sedikit di bawah nilai asli"
                : "sedikit di atas nilai asli";
        return createExplainBox([
            "Setiap x dimasukkan ke garis y_hat = ",
            tok(fmtNum(w0, 4), "lr-tok-w0"),
            w1 < 0 ? " - " : " + ",
            tok(fmtNum(Math.abs(w1), 4), "lr-tok-w1"),
            "x. Data ",
            tok(p0.label),
            " ditebak ",
            tok(fmtNum(p0.predict, 3), "lr-tok-y"),
            " vs asli ",
            tok(fmtNum(p0.actual, 3)),
            " (",
            closeness,
            "). Garis ini paling aman dipakai pada rentang data x = ",
            tok(minX === maxX ? minX : `${minX}..${maxX}`),
            "."
        ]);
    }

    if (stepKey === "residuals") {
        const worst = predRows.reduce((best, r) => (Math.abs(r.residual) > Math.abs(best.residual) ? r : best), predRows[0]);
        if (sse <= 1e-11) {
            return createExplainBox([
                "Seluruh residual bernilai ",
                tok("0"),
                " (",
                tok("SSE = 0", "lr-tok-err"),
                "). Garis tepat melewati semua titik data tanpa sisa error."
            ]);
        }
        const biasWord = worst.residual > 0 ? "tebakan terlalu rendah" : "tebakan terlalu tinggi";
        return createExplainBox([
            "Residual (actual - predict) mengukur melesetnya garis. Meleset terbesar ada pada data ",
            tok(worst.label),
            " sebesar ",
            tok(fmtNum(worst.residual, 4)),
            " (",
            biasWord,
            "). Karena total selisih mentah selalu ",
            tok(fmtNum(sumResidual, 4)),
            ", error dikuadratkan menjadi total SSE = ",
            tok(fmtNum(sse, 4), "lr-tok-err"),
            " dan dimutlakkan menjadi total ",
            tok(fmtNum(sumAbsRes, 4), "lr-tok-err"),
            "."
        ]);
    }

    if (stepKey === "metrics") {
        return createExplainBox([
            "Ringkasan kualitas garis dari ",
            tok(String(n), "lr-tok-y"),
            " data: MSE = ",
            tok(fmtNum(mse, 4), "lr-tok-err"),
            " (rata-rata kuadrat error), RMSE = ",
            tok(fmtNum(rmse, 4), "lr-tok-err"),
            " (rata-rata meleset sekitar ",
            tok(fmtNum(rmse, 4), "lr-tok-err"),
            " dalam satuan y), dan MAE = ",
            tok(fmtNum(mae, 4), "lr-tok-err"),
            " (jarak meleset rata-rata tanpa minus). Semakin kecil, semakin pas garisnya."
        ]);
    }

    return null;
}
