function renderCardWithSubnote(card, tex, subnoteText) {
    if (!card) return;
    card.textContent = "";
    const topMath = document.createElement("div");
    if (typeof window !== "undefined" && window.katex) {
        window.katex.render(tex, topMath, { displayMode: true, throwOnError: false, trust: true, strict: false });
    } else {
        topMath.textContent = tex;
    }
    card.appendChild(topMath);
    if (subnoteText) {
        const sub = document.createElement("div");
        sub.className = "chromo-card-subnote";
        sub.textContent = subnoteText;
        card.appendChild(sub);
    }
}

export function renderTopFormula7(type = "single") {
    const el = document.getElementById("math-calc-formula-display-7");
    if (!el) return;
    el.textContent = "";

    let tex = "\\htmlClass{cross-tok-c1}{C_1} = \\htmlClass{cross-tok-p1}{P_1}[1..k] \\parallel \\htmlClass{cross-tok-p2}{P_2}[k+1..n], \\quad \\htmlClass{cross-tok-c2}{C_2} = \\htmlClass{cross-tok-p2}{P_2}[1..k] \\parallel \\htmlClass{cross-tok-p1}{P_1}[k+1..n]";
    if (type === "two") {
        tex = "\\htmlClass{cross-tok-c1}{C_1} = P_1[:k_1] \\parallel P_2[k_1:k_2] \\parallel P_1[k_2:], \\quad \\htmlClass{cross-tok-c2}{C_2} = P_2[:k_1] \\parallel P_1[k_1:k_2] \\parallel P_2[k_2:]";
    } else if (type === "uniform") {
        tex = "\\htmlClass{cross-tok-c1}{C_{1,j}} = \\begin{cases} P_{1,j} & M_j = 1 \\\\ P_{2,j} & M_j = 0 \\end{cases}, \\quad \\htmlClass{cross-tok-c2}{C_{2,j}} = \\begin{cases} P_{2,j} & M_j = 1 \\\\ P_{1,j} & M_j = 0 \\end{cases}";
    }

    if (typeof window !== "undefined" && window.katex) {
        window.katex.render(tex, el, { displayMode: false, throwOnError: false, trust: true, strict: false });
    } else {
        el.textContent = tex;
    }
}

export function renderCrossoverCards(state) {
    const c1 = document.getElementById("cross-card-step1");
    const c2 = document.getElementById("cross-card-step2");
    const c3 = document.getElementById("cross-card-step3");
    const c4 = document.getElementById("cross-card-step4");
    if (!c1 || !c2 || !c3 || !c4) return;

    const { p1, p2, type, k, k1, k2, mask, c1: off1, c2: off2, valid, errorMsg } = state;

    if (!valid) {
        renderCardWithSubnote(c1, "\\text{Input Tidak Valid}", errorMsg || "Periksa kembali input kromosom");
        renderCardWithSubnote(c2, "C_1 = \\text{--}, \\quad C_2 = \\text{--}", "Rekombinasi terhenti");
        renderCardWithSubnote(c3, "\\text{length} = 0", "Verifikasi belum tersedia");
        renderCardWithSubnote(c4, "\\text{Offspring} = \\emptyset", "Hasil belum terbentuk");
        return;
    }

    const n = p1.length;

    let step1Tex = "";
    let step1Note = "";
    let step2Tex = "";
    let step2Note = "";

    if (type === "single") {
        const h1 = p1.slice(0, k);
        const t1 = p1.slice(k);
        const h2 = p2.slice(0, k);
        const t2 = p2.slice(k);
        step1Tex = `\\begin{aligned} P_1 &= [\\mathbf{${h1}} \\mid \\mathbf{${t1}}] \\\\ P_2 &= [\\mathbf{${h2}} \\mid \\mathbf{${t2}}] \\end{aligned}`;
        step1Note = `Kromosom dipotong setelah gen ke-${k} menjadi segmen kepala dan ekor.`;

        step2Tex = `\\begin{aligned} C_1 &= \\mathbf{${h1}} \\parallel \\mathbf{${t2}} \\implies \\mathbf{${off1}} \\\\ C_2 &= \\mathbf{${h2}} \\parallel \\mathbf{${t1}} \\implies \\mathbf{${off2}} \\end{aligned}`;
        step2Note = "Segmen ekor saling bertukar silang untuk membentuk 2 offspring.";
    } else if (type === "two") {
        const a1 = p1.slice(0, k1);
        const b1 = p1.slice(k1, k2);
        const d1 = p1.slice(k2);
        const a2 = p2.slice(0, k1);
        const b2 = p2.slice(k1, k2);
        const d2 = p2.slice(k2);
        step1Tex = `\\begin{aligned} P_1 &= [${a1} \\mid ${b1} \\mid ${d1}] \\\\ P_2 &= [${a2} \\mid ${b2} \\mid ${d2}] \\end{aligned}`;
        step1Note = `Kromosom dipotong pada titik k1 = ${k1} dan k2 = ${k2}.`;

        step2Tex = `\\begin{aligned} C_1 &= ${a1} \\parallel ${b2} \\parallel ${d1} \\implies \\mathbf{${off1}} \\\\ C_2 &= ${a2} \\parallel ${b1} \\parallel ${d2} \\implies \\mathbf{${off2}} \\end{aligned}`;
        step2Note = "Segmen tengah antara k1 dan k2 saling dipertukarkan.";
    } else {
        step1Tex = `\\text{Mask: } M = \\mathbf{${mask}}`;
        step1Note = "Bit mask 1 mengambil alel dari P1, bit mask 0 mengambil alel dari P2.";

        step2Tex = `\\begin{aligned} C_1 &= \\mathbf{${off1}} \\\\ C_2 &= \\mathbf{${off2}} \\end{aligned}`;
        step2Note = "Alel disilangkan posisi demi posisi sesuai pola biner mask.";
    }

    renderCardWithSubnote(c1, step1Tex, step1Note);
    renderCardWithSubnote(c2, step2Tex, step2Note);

    const step3Tex = `\\begin{aligned} \\text{length}(C_1) &= \\text{length}(C_2) = n = ${n} \\\\ &\\implies \\text{Valid} \\end{aligned}`;
    const step3Note = "Panjang kromosom anak terverifikasi identik dengan panjang kedua parent.";
    renderCardWithSubnote(c3, step3Tex, step3Note);

    const dec1 = parseInt(off1, 2);
    const dec2 = parseInt(off2, 2);
    const step4Tex = `\\begin{aligned} C_1 &= \\mathbf{${off1}}_2 = ${dec1}_{10} \\\\ C_2 &= \\mathbf{${off2}}_2 = ${dec2}_{10} \\end{aligned}`;
    const step4Note = "Dua offspring siap memasuki tahap evaluasi kebugaran atau mutasi genetik.";
    renderCardWithSubnote(c4, step4Tex, step4Note);
}
