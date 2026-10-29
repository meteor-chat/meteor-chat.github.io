function safeKatex(tex, el) {
    if (!el) return;
    if (window.katex && typeof window.katex.render === "function") {
        try {
            window.katex.render(tex, el, { displayMode: true, throwOnError: false });
            return;
        } catch (_) {}
    }
    el.textContent = tex;
}

export function renderTopFormula8() {
    const el = document.getElementById("math-calc-formula-display-8");
    if (!el) return;
    const tex = "\\htmlClass{pareto-tok-a}{A} \\htmlClass{pareto-tok-prec}{\\prec} \\htmlClass{pareto-tok-b}{B} \\iff (\\forall i: f_i(\\htmlClass{pareto-tok-a}{A}) \\le f_i(\\htmlClass{pareto-tok-b}{B})) \\land (\\exists j: f_j(\\htmlClass{pareto-tok-a}{A}) < f_j(\\htmlClass{pareto-tok-b}{B}))";
    safeKatex(tex, el);
}

function formatCondition(valA, valB, dir, isStrict = false) {
    const op = dir === "max" ? (isStrict ? ">" : "\\ge") : (isStrict ? "<" : "\\le");
    const passed = isStrict ? (dir === "max" ? valA > valB : valA < valB) : (dir === "max" ? valA >= valB : valA <= valB);
    const mark = passed ? "\\color{#4ade80}{\\checkmark}" : "\\color{#f87171}{\\times}";
    return `${valA} ${op} ${valB} \\; ${mark}`;
}

export function renderParetoCards(result) {
    if (!result) return;
    const c1 = document.getElementById("pareto-card-step1");
    const c2 = document.getElementById("pareto-card-step2");
    const c3 = document.getElementById("pareto-card-step3");
    const c4 = document.getElementById("pareto-card-step4");
    if (!c1 || !c2 || !c3 || !c4) return;

    const { vecA, vecB, directions, dimDetailsA, aDominatesB, bDominatesA, identical, status } = result;
    const [d1, d2] = directions;
    const dirStr = `f_1 \\to \\text{${d1}}, \\; f_2 \\to \\text{${d2}}`;

    const tex1 = `\\vec{f}(\\htmlClass{pareto-tok-a}{A}) = (${vecA[0]}, ${vecA[1]}), \\quad \\vec{f}(\\htmlClass{pareto-tok-b}{B}) = (${vecB[0]}, ${vecB[1]})`;
    c1.innerHTML = "";
    const box1 = document.createElement("div");
    safeKatex(tex1, box1);
    const sub1 = document.createElement("div");
    sub1.className = "chromo-card-subnote";
    sub1.textContent = `Arah Optimasi: ${d1.toUpperCase()} untuk f1, ${d2.toUpperCase()} untuk f2`;
    c1.appendChild(box1);
    c1.appendChild(sub1);

    const cond1_f1 = formatCondition(vecA[0], vecB[0], d1, false);
    const cond1_f2 = formatCondition(vecA[1], vecB[1], d2, false);
    const s1Pass = dimDetailsA[0].noWorse && dimDetailsA[1].noWorse;
    const s1Badge = s1Pass ? "\\mathbf{\\color{#4ade80}{Terpenuhi}}" : "\\mathbf{\\color{#f87171}{Gagal}}";
    const tex2 = `\\forall i: f_i(A) \\le f_i(B) \\implies [${cond1_f1}, \\; ${cond1_f2}] \\implies ${s1Badge}`;
    c2.innerHTML = "";
    const box2 = document.createElement("div");
    safeKatex(tex2, box2);
    const sub2 = document.createElement("div");
    sub2.className = "chromo-card-subnote";
    sub2.textContent = s1Pass ? "Syarat 1 Terpenuhi: Solusi A tidak lebih buruk dari B pada semua objektif" : "Syarat 1 Gagal: A lebih buruk dari B pada setidaknya satu objektif";
    c2.appendChild(box2);
    c2.appendChild(sub2);

    const cond2_f1 = formatCondition(vecA[0], vecB[0], d1, true);
    const cond2_f2 = formatCondition(vecA[1], vecB[1], d2, true);
    const s2Pass = dimDetailsA[0].strictlyBetter || dimDetailsA[1].strictlyBetter;
    const s2Badge = s2Pass ? "\\mathbf{\\color{#4ade80}{Terpenuhi}}" : "\\mathbf{\\color{#f87171}{Gagal}}";
    const tex3 = `\\exists j: f_j(A) < f_j(B) \\implies [${cond2_f1} \\lor ${cond2_f2}] \\implies ${s2Badge}`;
    c3.innerHTML = "";
    const box3 = document.createElement("div");
    safeKatex(tex3, box3);
    const sub3 = document.createElement("div");
    sub3.className = "chromo-card-subnote";
    sub3.textContent = s2Pass ? "Syarat 2 Terpenuhi: Solusi A memiliki keunggulan ketat pada minimal satu objektif" : "Syarat 2 Gagal: Tidak ada objektif di mana A strictly better";
    c3.appendChild(box3);
    c3.appendChild(sub3);

    c4.innerHTML = "";
    const box4 = document.createElement("div");
    const sub4 = document.createElement("div");
    sub4.className = "chromo-card-subnote";

    if (identical) {
        safeKatex("\\mathbf{\\htmlClass{pareto-tok-a}{A} = \\htmlClass{pareto-tok-b}{B} \\quad (Identik)}", box4);
        sub4.textContent = "Nilai f1 dan f2 persis sama sehingga tidak ada solusi yang mendominasi";
    } else if (aDominatesB) {
        safeKatex("\\mathbf{\\htmlClass{pareto-tok-a}{A} \\prec \\htmlClass{pareto-tok-b}{B} \\quad (A \\text{ Mendominasi } B)}", box4);
        sub4.textContent = "Syarat 1 & Syarat 2 terpenuhi untuk A terhadap B";
    } else if (bDominatesA) {
        safeKatex("\\mathbf{\\htmlClass{pareto-tok-b}{B} \\prec \\htmlClass{pareto-tok-a}{A} \\quad (B \\text{ Mendominasi } A)}", box4);
        sub4.textContent = "Syarat 1 & Syarat 2 terpenuhi untuk B terhadap A";
    } else {
        safeKatex("\\mathbf{A \\parallel B \\quad (Incomparable / Trade\\text{-}off)}", box4);
        sub4.textContent = "Neither dominates: kedua solusi bertahan pada Pareto Front non-dominated";
    }
    c4.appendChild(box4);
    c4.appendChild(sub4);
}
