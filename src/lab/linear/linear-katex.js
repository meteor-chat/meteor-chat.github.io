export function generateKatexBreakdown(ols, metrics) {
    if (!ols || !ols.valid || !metrics) {
        return {
            summaryTex: "\\text{Minimal butuh 2 titik data unik untuk menghitung regresi OLS.}",
            slopeTex: "",
            interceptTex: "",
            lineTex: "",
            r2Tex: ""
        };
    }

    const { n, sumX, sumY, sumXY, sumX2, meanX, meanY, w, b } = ols;
    const { ssTot, ssRes, r2, mse } = metrics;

    const summaryTex = `\\begin{aligned}
n &= ${n}, \\quad \\sum x = ${sumX.toFixed(1)}, \\quad \\sum y = ${sumY.toFixed(1)} \\\\
\\sum x^2 &= ${sumX2.toFixed(1)}, \\quad \\sum xy = ${sumXY.toFixed(1)} \\\\
\\bar{x} &= ${meanX.toFixed(2)}, \\quad \\bar{y} = ${meanY.toFixed(2)}
\\end{aligned}`;

    const numSlope = n * sumXY - sumX * sumY;
    const denSlope = n * sumX2 - sumX * sumX;

    const slopeTex = `w = \\frac{n \\sum xy - (\\sum x)(\\sum y)}{n \\sum x^2 - (\\sum x)^2} = \\frac{${n}(${sumXY.toFixed(1)}) - (${sumX.toFixed(1)})(${sumY.toFixed(1)})}{${n}(${sumX2.toFixed(1)}) - (${sumX.toFixed(1)})^2} = \\frac{${numSlope.toFixed(2)}}{${denSlope.toFixed(2)}} = \\mathbf{${w.toFixed(4)}}`;

    const interceptTex = `b = \\bar{y} - w \\bar{x} = ${meanY.toFixed(2)} - (${w.toFixed(4)})(${meanX.toFixed(2)}) = \\mathbf{${b.toFixed(4)}}`;

    const signB = b >= 0 ? `+ ${b.toFixed(2)}` : `- ${Math.abs(b).toFixed(2)}`;
    const lineTex = `\\hat{y} = ${w.toFixed(2)}x ${signB}`;

    const r2Tex = `R^2 = 1 - \\frac{SS_{\\text{res}}}{SS_{\\text{tot}}} = 1 - \\frac{${ssRes.toFixed(2)}}{${ssTot.toFixed(2)}} = \\mathbf{${r2.toFixed(4)}} \\quad (\\text{MSE} = ${mse.toFixed(2)})`;

    return {
        summaryTex,
        slopeTex,
        interceptTex,
        lineTex,
        r2Tex
    };
}

export function renderKatex(tex, container) {
    if (!container) return;
    if (typeof katex !== "undefined") {
        katex.render(tex, container, { throwOnError: false, displayMode: true });
    } else {
        container.textContent = tex;
    }
}
