import { fmtNum } from "./math-calc-40-engine.js";
import { m, cTok, createExplainBox } from "./math-calc-39-explain.js";

function gradAction(g) {
    if (Math.abs(g) < 1e-11) return "sudah seimbang";
    return g > 0 ? "perlu diturunkan" : "perlu dinaikkan";
}

function moveWord(before, after) {
    if (after > before + 1e-11) return "naik";
    if (after < before - 1e-11) return "turun";
    return "tetap";
}

export function buildLogTabulateExplain(res) {
    const pts = res && Array.isArray(res.points) ? res.points : [];
    const n = res ? res.n : pts.length;
    if (n === 0) {
        return createExplainBox([
            "Isi baris data (",
            m("x"),
            " dan target biner ",
            m("y \\in \\{0, 1\\}"),
            ") untuk melatih klasifikasi probabilitas."
        ]);
    }
    if (!res.valid && res.code === "target") {
        return createExplainBox([
            "Ada ",
            m(cTok("lr-tok-y", String(n))),
            " baris data, tetapi target ",
            m("y"),
            " pada klasifikasi biner hanya boleh bernilai ",
            m("0"),
            " atau ",
            m("1"),
            "."
        ]);
    }
    const xs = res.valid ? res.rows.map((r) => r.x) : pts.map((p) => p.x);
    const ys = res.valid ? res.rows.map((r) => r.y) : pts.map((p) => p.y);
    const minX = fmtNum(Math.min(...xs), 3);
    const maxX = fmtNum(Math.max(...xs), 3);
    const nPos = ys.filter((v) => Math.round(v) === 1).length;
    const nNeg = ys.length - nPos;
    const xRangeParts = minX === maxX ? [m(minX)] : [m(minX), " sampai ", m(maxX)];
    return createExplainBox([
        "Kita punya ",
        m(cTok("lr-tok-y", String(n))),
        " data (",
        m("x"),
        " dari ",
        ...xRangeParts,
        ") dengan ",
        m(String(nNeg)),
        " kelas ",
        m("0"),
        " dan ",
        m(String(nPos)),
        " kelas ",
        m("1"),
        ". Berbeda dari regresi linear yang menebak angka bebas, di sini kita menebak peluang masuk kelas ",
        m("1"),
        "."
    ]);
}

export function buildLogInitExplain(res, rawParams = {}) {
    const w0 = res && res.valid ? res.initW0 : rawParams.w0;
    const w1 = res && res.valid ? res.initW1 : rawParams.w1;
    const lr = res && res.valid ? res.lr : rawParams.lr;
    const th = res && res.valid ? res.threshold : rawParams.th;

    if (!Number.isFinite(w0) || !Number.isFinite(w1)) {
        return createExplainBox([
            "Isi bobot awal ",
            m("w_0"),
            " dan ",
            m("w_1"),
            " dengan angka valid agar skor awal ",
            m("z"),
            " bisa dihitung."
        ]);
    }
    if (!Number.isFinite(lr) || lr < 0) {
        return createExplainBox([
            "Learning rate ",
            m("\\eta"),
            " mengatur besar langkah perbaikan bobot sehingga nilainya harus ",
            m("\\ge 0"),
            "."
        ]);
    }
    if (!Number.isFinite(th) || th < 0 || th > 1) {
        return createExplainBox([
            "Threshold ",
            m("\\theta"),
            " adalah batas peluang keputusan kelas sehingga nilainya harus berada di antara ",
            m("0"),
            " dan ",
            m("1"),
            "."
        ]);
    }

    const w0Tok = cTok("lr-tok-w0", fmtNum(w0, 4));
    const w1Tok = cTok("lr-tok-w1", fmtNum(w1, 4));
    const isNeutral = Math.abs(w0) < 1e-11 && Math.abs(w1) < 1e-11;
    const startParts = isNeutral
        ? [
            "Model belum tahu pola data sehingga mulai dari tebakan netral ",
            m(`w_0 = ${w0Tok}`),
            " dan ",
            m(`w_1 = ${w1Tok}`),
            ". "
        ]
        : [
            "Model mulai dari bobot awal ",
            m(`w_0 = ${w0Tok}`),
            " dan ",
            m(`w_1 = ${w1Tok}`),
            ". "
        ];
    const lrParts = Math.abs(lr) < 1e-11
        ? ["Karena ", m("\\eta = 0"), ", bobot tidak akan berubah saat pembaruan, "]
        : ["Learning rate ", m(`\\eta = ${fmtNum(lr, 4)}`), " mengatur besar langkah perbaikan tiap iterasi, "];
    const thFmt = fmtNum(th, 2);
    return createExplainBox([
        ...startParts,
        ...lrParts,
        "sedangkan batas ",
        m(`\\theta = ${thFmt}`),
        " memutuskan peluang ",
        m(`\\alpha(z) \\ge ${thFmt}`),
        " menjadi kelas ",
        m("1"),
        " dan di bawahnya kelas ",
        m("0"),
        "."
    ]);
}

export function buildLogisticExplainCard(stepKey, res) {
    if (!res || !res.valid) return null;
    const {
        n,
        lr,
        threshold,
        initW0,
        initW1,
        rows,
        totalLoss,
        avgLoss,
        totalGw0,
        avgGw0,
        totalGw1,
        avgGw1,
        newW0,
        newW1,
        afterRows,
        afterLoss,
        afterCorrect,
        initCorrect,
        trace
    } = res;

    if (stepKey === "sigmoid") {
        const r0 = rows[0];
        const allZeroZ = rows.every((r) => Math.abs(r.z) < 1e-11);
        const accPct = fmtNum((initCorrect / n) * 100, 1);
        const coreParts = allZeroZ
            ? [
                "Skor linear ",
                m("z"),
                " diperas fungsi sigmoid menjadi peluang di rentang ",
                m("0"),
                " sampai ",
                m("1"),
                ". Karena semua ",
                m("z = 0"),
                ", seluruh peluang masih netral di ",
                m(cTok("lr-tok-y", "0.5")),
                " seperti melempar koin. "
            ]
            : [
                "Skor linear ",
                m("z"),
                " diperas fungsi sigmoid menjadi peluang di rentang ",
                m("0"),
                " sampai ",
                m("1"),
                ". Data ",
                m(String(r0.index)),
                " (",
                m(`x = ${fmtNum(r0.x, 3)}`),
                ") memberi ",
                m(`z = ${fmtNum(r0.z, 4)}`),
                " sehingga peluangnya ",
                m(`\\alpha(z) = ${cTok("lr-tok-y", fmtNum(r0.alpha, 4))}`),
                ". "
            ];
        return createExplainBox([
            ...coreParts,
            "Dengan batas ",
            m(`\\theta = ${fmtNum(threshold, 2)}`),
            ", tebakan awal benar ",
            m(`${initCorrect}/${n}`),
            " (",
            m(`${accPct}\\%`),
            ")."
        ]);
    }

    if (stepKey === "loss") {
        const worst = rows.reduce((best, r) => (r.loss > best.loss ? r : best), rows[0]);
        const minLoss = rows.reduce((low, r) => (r.loss < low ? r.loss : low), rows[0].loss);
        const uniformLoss = worst.loss - minLoss < 1e-6;
        const sampleParts = uniformLoss
            ? [
                "Karena semua peluang masih sama (",
                m(cTok("lr-tok-y", fmtNum(rows[0].alpha, 4))),
                "), tiap data mendapat penalti identik ",
                m(fmtNum(rows[0].loss, 4)),
                ". "
            ]
            : [
                "Penalti terbesar ada pada data ",
                m(String(worst.index)),
                " (target ",
                m(`y = ${fmtNum(worst.y, 3)}`),
                ", peluang ",
                m(cTok("lr-tok-y", fmtNum(worst.alpha, 4))),
                ") sebesar ",
                m(fmtNum(worst.loss, 4)),
                ". "
            ];
        return createExplainBox([
            "Log loss menilai seberapa meleset keyakinan model. ",
            ...sampleParts,
            "Total ",
            m(cTok("lr-tok-err", fmtNum(totalLoss, 4))),
            " dibagi ",
            m(cTok("lr-tok-y", String(n))),
            " data menghasilkan rata-rata ",
            m(cTok("lr-tok-err", fmtNum(avgLoss, 4))),
            ", inilah angka yang ingin kita tekan mendekati ",
            m("0"),
            "."
        ]);
    }

    if (stepKey === "gradients") {
        const sample = rows.find((r) => Math.abs(r.x) > 1e-11 && Math.abs(r.gw0) > 1e-11) || rows[0];
        const errSense = sample.gw0 > 1e-11
            ? "peluang terlalu tinggi dari target"
            : sample.gw0 < -1e-11
                ? "peluang terlalu rendah dari target"
                : "peluang tepat di target";
        return createExplainBox([
            "Karena regresi logistik tidak punya rumus langsung seperti regresi linear, gradien dipakai sebagai kompas arah perbaikan. Pada data ",
            m(String(sample.index)),
            ", ",
            m(`g_{w_0} = ${fmtNum(sample.gw0, 4)}`),
            ` (${errSense}), lalu dikalikan `,
            m(`x = ${fmtNum(sample.x, 3)}`),
            " menjadi ",
            m(`g_{w_1} = ${fmtNum(sample.gw1, 4)}`),
            ". Total dorongan semua data menjadi ",
            m(cTok("lr-tok-w0", fmtNum(totalGw0, 4))),
            " untuk ",
            m("w_0"),
            " dan ",
            m(cTok("lr-tok-w1", fmtNum(totalGw1, 4))),
            " untuk ",
            m("w_1"),
            "."
        ]);
    }

    if (stepKey === "avgGradients") {
        return createExplainBox([
            "Total gradien dibagi ",
            m(cTok("lr-tok-y", String(n))),
            " supaya ukuran perbaikan adil dan tidak meledak ketika jumlah data bertambah. Rata-rata ",
            m(`g_{w_0} = ${cTok("lr-tok-w0", fmtNum(avgGw0, 4))}`),
            " memberi sinyal ",
            m("w_0"),
            ` ${gradAction(avgGw0)}, sedangkan `,
            m(`g_{w_1} = ${cTok("lr-tok-w1", fmtNum(avgGw1, 4))}`),
            " memberi sinyal ",
            m("w_1"),
            ` ${gradAction(avgGw1)}.`
        ]);
    }

    if (stepKey === "update") {
        const w0Old = cTok("lr-tok-w0", fmtNum(initW0, 4));
        const w0New = cTok("lr-tok-w0", fmtNum(newW0, 4));
        const w1Old = cTok("lr-tok-w1", fmtNum(initW1, 4));
        const w1New = cTok("lr-tok-w1", fmtNum(newW1, 4));
        if (Math.abs(lr) < 1e-11) {
            return createExplainBox([
                "Karena ",
                m("\\eta = 0"),
                ", ukuran langkah perbaikan bernilai ",
                m("0"),
                " sehingga bobot bertahan di ",
                m(`w_0^{\\text{new}} = ${w0New}`),
                " dan ",
                m(`w_1^{\\text{new}} = ${w1New}`),
                "."
            ]);
        }
        return createExplainBox([
            "Tanda kurang pada ",
            m("w - \\eta \\cdot g"),
            " menggeser bobot berlawanan arah error agar menuruni bukit loss. Dengan ",
            m(`\\eta = ${fmtNum(lr, 4)}`),
            ", ",
            m("w_0"),
            ` ${moveWord(initW0, newW0)} dari `,
            m(w0Old),
            " ke ",
            m(w0New),
            " dan ",
            m("w_1"),
            ` ${moveWord(initW1, newW1)} dari `,
            m(w1Old),
            " ke ",
            m(w1New),
            "."
        ]);
    }

    if (stepKey === "eval") {
        const lossDiff = afterLoss - avgLoss;
        const beforeTok = cTok("lr-tok-err", fmtNum(avgLoss, 4));
        const afterTok = cTok("lr-tok-err", fmtNum(afterLoss, 4));
        const lossParts = lossDiff < -1e-6
            ? ["turun dari ", m(beforeTok), " menjadi ", m(afterTok), " (model membaik)"]
            : lossDiff > 1e-6
                ? ["naik dari ", m(beforeTok), " menjadi ", m(afterTok), " (coba perkecil ", m("\\eta"), " agar langkah tidak kebablasan)"]
                : ["bertahan di ", m(afterTok)];
        const afterAccPct = fmtNum((afterCorrect / n) * 100, 1);
        const r0Before = rows[0];
        const r0After = afterRows[0];
        return createExplainBox([
            "Setelah bobot baru dipasang, rata-rata log loss ",
            ...lossParts,
            ". Akurasi pada batas ",
            m(`\\theta = ${fmtNum(threshold, 2)}`),
            " kini ",
            m(`${afterCorrect}/${n}`),
            " (",
            m(`${afterAccPct}\\%`),
            "), dengan peluang data ",
            m(String(r0After.index)),
            " bergeser dari ",
            m(cTok("lr-tok-y", fmtNum(r0Before.alpha, 4))),
            " menjadi ",
            m(cTok("lr-tok-y", fmtNum(r0After.alpha, 4))),
            "."
        ]);
    }

    if (stepKey === "iterations") {
        const first = trace[0];
        const last = trace[trace.length - 1];
        const lossDiff = last.avgLoss - first.avgLoss;
        const firstTok = cTok("lr-tok-err", fmtNum(first.avgLoss, 4));
        const lastTok = cTok("lr-tok-err", fmtNum(last.avgLoss, 4));
        const trendParts = lossDiff < -1e-6
            ? ["terus menyusut dari ", m(firstTok), " ke ", m(lastTok)]
            : lossDiff > 1e-6
                ? ["justru naik dari ", m(firstTok), " ke ", m(lastTok), " karena langkah ", m("\\eta"), " terlalu besar"]
                : ["bertahan di ", m(lastTok)];
        const startGradMag = Math.abs(first.avgGw0) + Math.abs(first.avgGw1);
        const endGradMag = Math.abs(last.avgGw0) + Math.abs(last.avgGw1);
        const tailParts = Math.abs(lr) < 1e-11
            ? [" karena pembaruan berhenti saat ", m("\\eta = 0"), "."]
            : endGradMag < startGradMag - 1e-6
                ? [" serta gradien makin mengecil mendekati ", m("0"), "."]
                : [
                    " dengan gradien akhir ",
                    m(`g_{w_0} = ${cTok("lr-tok-w0", fmtNum(last.avgGw0, 4))}`),
                    " dan ",
                    m(`g_{w_1} = ${cTok("lr-tok-w1", fmtNum(last.avgGw1, 4))}`),
                    "."
                ];
        return createExplainBox([
            "Satu langkah saja belum cukup mencapai error terendah, jadi pembaruan diulang dari iterasi ",
            m(String(first.iter)),
            " sampai ",
            m(String(last.iter)),
            ". Rata-rata log loss ",
            ...trendParts,
            ", dengan bobot akhir ",
            m(`w_0 = ${cTok("lr-tok-w0", fmtNum(last.w0, 4))}`),
            " dan ",
            m(`w_1 = ${cTok("lr-tok-w1", fmtNum(last.w1, 4))}`),
            ...tailParts
        ]);
    }

    return null;
}
