import { fmtNum } from "./math-calc-39-engine.js";

export function renderTex(tex, el, displayMode = false) {
    const expr = String(tex ?? "");
    if (typeof katex !== "undefined") {
        katex.render(expr, el, { throwOnError: false, trust: true, displayMode });
    } else {
        el.textContent = expr;
    }
}

export function m(tex) {
    return { tex: String(tex) };
}

export function cTok(cls, tex) {
    return cls ? `\\htmlClass{${cls}}{${tex}}` : String(tex);
}

export function appendMathParts(parent, parts, inlineClass = "lr-math-inline") {
    parts.forEach((part) => {
        if (typeof part === "string") {
            parent.appendChild(document.createTextNode(part));
            return;
        }
        const span = document.createElement("span");
        span.className = inlineClass;
        renderTex(part.tex, span, false);
        parent.appendChild(span);
    });
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
    appendMathParts(p, parts, "lr-math-inline lr-explain-math");
    box.appendChild(p);
    return box;
}

export function buildLinearWarnParts(res) {
    if (!res || res.n < 2) {
        return ["Minimal ", m("2"), " baris data (", m("x"), ", ", m("y"), ") valid diperlukan."];
    }
    return ["Semua nilai ", m("x"), " identik sehingga total ", m("dx^2 = 0"), " (slope ", m("w_1"), " tidak terdefinisi)."];
}

export function buildLogisticWarnParts(res) {
    if (!res || res.code === "empty" || res.n === 0) {
        return ["Minimal ", m("1"), " titik data (", m("x"), ", ", m("y"), ") diperlukan."];
    }
    if (res.code === "weights") {
        return ["Bobot awal ", m("w_0"), " dan ", m("w_1"), " harus berupa angka valid."];
    }
    if (res.code === "threshold") {
        return ["Nilai threshold ", m("\\theta"), " harus berada di antara ", m("0"), " dan ", m("1"), "."];
    }
    if (res.code === "target") {
        return ["Nilai target ", m("y"), " pada Logistic Regression harus ", m("0"), " atau ", m("1"), "."];
    }
    if (res.code === "lr") {
        return ["Learning rate ", m("\\eta"), " harus bernilai ", m("\\ge 0"), "."];
    }
    return [res.reason || "Periksa kembali data dan parameter awal."];
}

function deviationParts(val, meanTex, digits = 3) {
    if (Math.abs(val) < 1e-11) {
        return ["tepat di rata-rata ", m(meanTex)];
    }
    const mag = fmtNum(Math.abs(val), digits);
    const dir = val < 0 ? "di bawah rata-rata" : "di atas rata-rata";
    return [m(mag), ` ${dir} `, m(meanTex)];
}

export function buildTabulateExplain(res) {
    const pts = res && Array.isArray(res.points) ? res.points : [];
    if (pts.length === 0) {
        return createExplainBox(["Isi baris data (", m("x"), " dan ", m("y"), ") untuk mulai mencari garis lurus terbaik."]);
    }
    if (pts.length === 1) {
        return createExplainBox([
            "Baru ada ",
            m(cTok("lr-tok-y", "1")),
            " data. Tambahkan minimal ",
            m("1"),
            " baris lagi agar ",
            m("2"),
            " titik bisa ditarik menjadi garis."
        ]);
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
            m(cTok("lr-tok-y", String(res.n))),
            " data, tetapi seluruh nilai ",
            m("x"),
            " bernilai ",
            m(minX),
            ". Tanpa variasi ",
            m("x"),
            ", kemiringan garis belum bisa dihitung."
        ]);
    }
    const xRangeParts = minX === maxX ? [m(minX)] : [m(minX), " sampai ", m(maxX)];
    const yRangeParts = minY === maxY ? [m(minY)] : [m(minY), " sampai ", m(maxY)];
    return createExplainBox([
        "Kita punya ",
        m(cTok("lr-tok-y", String(res.n))),
        " data (",
        m("x"),
        " dari ",
        ...xRangeParts,
        ", ",
        m("y"),
        " dari ",
        ...yRangeParts,
        "). Tujuannya mencari garis lurus paling pas untuk menebak ",
        m("y"),
        " dari ",
        m("x"),
        "."
    ]);
}

export function buildLinearExplainCard(stepKey, res) {
    if (!res || !res.valid) return null;
    const { n, points, meanX, meanY, rows, sxy, sxx, w1, w0, predRows, sumResidual, sse, sumAbsRes, mse, rmse, mae } = res;
    const mxTok = cTok("lr-tok-w1", fmtNum(meanX, 4));
    const myTok = cTok("lr-tok-w0", fmtNum(meanY, 4));

    if (stepKey === "mean") {
        return createExplainBox([
            "Rata-rata bekerja seperti titik seimbang papan jungkat-jungkit: pusat ",
            m("x"),
            " di ",
            m(mxTok),
            " dan pusat ",
            m("y"),
            " di ",
            m(myTok),
            ". Semua jarak di langkah berikutnya diukur dari titik tengah ",
            m(`(${mxTok}, ${myTok})`),
            " ini."
        ]);
    }

    if (stepKey === "deviations") {
        const r0 = rows[0];
        return createExplainBox([
            "Mengukur jarak tiap data dari pusat. Data ",
            m(r0.label),
            " punya ",
            m(`x = ${fmtNum(r0.x, 3)}`),
            " (",
            ...deviationParts(r0.dx, mxTok, 3),
            ", sehingga ",
            m(`dx = ${fmtNum(r0.dx, 3)}`),
            ") dan ",
            m(`y = ${fmtNum(r0.y, 3)}`),
            " (",
            ...deviationParts(r0.dy, myTok, 3),
            ", sehingga ",
            m(`dy = ${fmtNum(r0.dy, 3)}`),
            "). Jumlah seluruh ",
            m("dx"),
            " maupun ",
            m("dy"),
            " selalu ",
            m("0"),
            "."
        ]);
    }

    if (stepKey === "twoSums") {
        const sample = rows.find((r) => Math.abs(r.dx) > 1e-11 && Math.abs(r.dy) > 1e-11) || rows[0];
        const prod = sample.dx * sample.dy;
        const pairParts = prod > 1e-11
            ? ["keduanya searah dari rata-rata (", m("+"), ")"]
            : prod < -1e-11
                ? ["berlawanan arah dari rata-rata (", m("-"), ")"]
                : ["salah satu tepat di rata-rata (", m("0"), ")"];
        const trendParts = sxy > 1e-11
            ? ["pola naik searah saat ", m("x"), " bertambah"]
            : sxy < -1e-11
                ? ["pola turun berlawanan saat ", m("x"), " bertambah"]
                : ["tidak ada kecenderungan naik ataupun turun"];
        return createExplainBox([
            m("dx \\cdot dy"),
            " mengecek arah gerak ",
            m("x"),
            " dan ",
            m("y"),
            ": data ",
            m(sample.label),
            " memberi ",
            m(fmtNum(prod, 3)),
            " (",
            ...pairParts,
            "). Total ",
            m(cTok("lr-tok-w0", fmtNum(sxy, 4))),
            " menandakan ",
            ...trendParts,
            ", sedangkan ",
            m("dx^2"),
            " (total ",
            m(cTok("lr-tok-w1", fmtNum(sxx, 4))),
            ") mempositifkan jarak agar sisi kiri dan kanan tidak saling menghapus ke ",
            m("0"),
            "."
        ]);
    }

    if (stepKey === "slope") {
        if (Math.abs(w1) < 1e-11) {
            return createExplainBox([
                "Membagi ",
                m(`\\frac{${cTok("lr-tok-w0", fmtNum(sxy, 4))}}{${cTok("lr-tok-w1", fmtNum(sxx, 4))}} = ${cTok("lr-tok-w1", "0")}`),
                ". Garis mendatar: setiap kenaikan ",
                m("1"),
                " satuan ",
                m("x"),
                " tidak mengubah tebakan ",
                m("y"),
                "."
            ]);
        }
        const move = w1 > 0 ? "naik" : "turun";
        return createExplainBox([
            "Membagi total gerak bersama (",
            m(cTok("lr-tok-w0", fmtNum(sxy, 4))),
            ") dengan sebaran ",
            m("x"),
            " (",
            m(cTok("lr-tok-w1", fmtNum(sxx, 4))),
            ") menghasilkan ",
            m(`w_1 = ${cTok("lr-tok-w1", fmtNum(w1, 4))}`),
            ". Artinya setiap ",
            m("x"),
            " bertambah ",
            m("1"),
            ", prediksi ",
            m("y"),
            ` ${move} `,
            m(cTok("lr-tok-w1", fmtNum(Math.abs(w1), 4))),
            " poin."
        ]);
    }

    if (stepKey === "intercept") {
        if (Math.abs(meanX) < 1e-11) {
            return createExplainBox([
                "Titik awal garis saat ",
                m("x = 0"),
                " langsung tepat di rata-rata ",
                m("y"),
                " (",
                m(`w_0 = ${cTok("lr-tok-w0", fmtNum(w0, 4))}`),
                ") karena pusat ",
                m("x"),
                " sudah berada di ",
                m("0"),
                "."
            ]);
        }
        const shift = w1 * meanX;
        const shiftWord = shift >= 0 ? "naik" : "turun";
        return createExplainBox([
            "Kenapa garis tidak mulai dari ",
            m("0"),
            "? Karena garis wajib melewati pusat ",
            m(`(${mxTok}, ${myTok})`),
            ". Berjalan dari ",
            m("x = 0"),
            " ke ",
            m(`x = ${mxTok}`),
            ` membuat garis ${shiftWord} sebesar `,
            m(fmtNum(Math.abs(shift), 4)),
            ", jadi ujung kirinya di ",
            m("x = 0"),
            " harus dimulai di ",
            m(`w_0 = ${cTok("lr-tok-w0", fmtNum(w0, 4))}`),
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
        const eqSign = w1 < 0 ? "-" : "+";
        const eqTex = `\\hat{y} = ${cTok("lr-tok-w0", fmtNum(w0, 4))} ${eqSign} ${cTok("lr-tok-w1", fmtNum(Math.abs(w1), 4))}\\,x`;
        const rangeTex = minX === maxX ? `x = ${minX}` : `${minX} \\le x \\le ${maxX}`;
        return createExplainBox([
            "Setiap ",
            m("x"),
            " dimasukkan ke garis ",
            m(eqTex),
            ". Data ",
            m(p0.label),
            " ditebak ",
            m(`\\hat{y} = ${cTok("lr-tok-y", fmtNum(p0.predict, 3))}`),
            " vs asli ",
            m(`y = ${fmtNum(p0.actual, 3)}`),
            ` (${closeness}). Garis ini paling aman dipakai pada rentang data `,
            m(rangeTex),
            "."
        ]);
    }

    if (stepKey === "residuals") {
        const worst = predRows.reduce((best, r) => (Math.abs(r.residual) > Math.abs(best.residual) ? r : best), predRows[0]);
        if (sse <= 1e-11) {
            return createExplainBox([
                "Seluruh residual bernilai ",
                m("0"),
                " (",
                m(`\\text{SSE} = ${cTok("lr-tok-err", "0")}`),
                "). Garis tepat melewati semua titik data tanpa sisa error."
            ]);
        }
        const biasWord = worst.residual > 0 ? "tebakan terlalu rendah" : "tebakan terlalu tinggi";
        return createExplainBox([
            "Residual (",
            m("y - \\hat{y}"),
            ") mengukur melesetnya garis. Meleset terbesar ada pada data ",
            m(worst.label),
            " sebesar ",
            m(fmtNum(worst.residual, 4)),
            ` (${biasWord}). Karena total selisih mentah selalu `,
            m(fmtNum(sumResidual, 4)),
            ", error dikuadratkan menjadi total ",
            m(`\\text{SSE} = ${cTok("lr-tok-err", fmtNum(sse, 4))}`),
            " dan dimutlakkan menjadi total ",
            m(cTok("lr-tok-err", fmtNum(sumAbsRes, 4))),
            "."
        ]);
    }

    if (stepKey === "metrics") {
        return createExplainBox([
            "Ringkasan kualitas garis dari ",
            m(cTok("lr-tok-y", String(n))),
            " data: ",
            m(`\\text{MSE} = ${cTok("lr-tok-err", fmtNum(mse, 4))}`),
            " (rata-rata kuadrat error), ",
            m(`\\text{RMSE} = ${cTok("lr-tok-err", fmtNum(rmse, 4))}`),
            " (rata-rata meleset sekitar ",
            m(cTok("lr-tok-err", fmtNum(rmse, 4))),
            " dalam satuan ",
            m("y"),
            "), dan ",
            m(`\\text{MAE} = ${cTok("lr-tok-err", fmtNum(mae, 4))}`),
            " (jarak meleset rata-rata tanpa minus). Semakin kecil, semakin pas garisnya."
        ]);
    }

    return null;
}
