import { refs } from "./dom-refs.js";
import { drawIntegral, clearIntegral } from "./math-visual-integral.js";

export function calculateMath17() {
    if (!refs.m17Steps) return;
    refs.m17Steps.innerHTML = '';
    clearIntegral('math17-canvas');
    
    if (!refs.m17InF || !refs.m17InBigF || !refs.m17InA || !refs.m17InB) return;
    
    const strF = refs.m17InF.value.trim();
    const strBigF = refs.m17InBigF.value.trim();
    const strA = refs.m17InA.value.trim();
    const strB = refs.m17InB.value.trim();
    
    if (strF === '' || strBigF === '' || strA === '' || strB === '') return;
    
    if (typeof math === 'undefined') {
        refs.m17Steps.innerHTML = '<div class="math-step-box math-step-error">\u274C Error: library math.js tidak ditemukan.</div>';
        return;
    }
    
    const a = parseFloat(strA);
    const b = parseFloat(strB);
    if (isNaN(a) || isNaN(b)) return;
    
    let fNode, bigFNode;
    try {
        fNode = math.parse(strF);
        bigFNode = math.parse(strBigF);
    } catch (e) {
        refs.m17Steps.innerHTML = '<div class="math-step-box math-step-error">\u274C Error Sintaks: Fungsi tidak valid. (Gunakan notasi valid seperti x^2)</div>';
        return;
    }
    
    let html = `<div class="math-step">`;
    html += `<div class="math-step-box math-step-selected">Diketahui:<br>f(x) = ${fNode.toString()}<br>F(x) = ${bigFNode.toString()}<br>a = ${a}, b = ${b}</div>`;
    
    try {
        const dFNode = math.derivative(bigFNode, 'x');
        const dfVal = dFNode.evaluate({x: a});
        const fVal = fNode.evaluate({x: a});
        if (Math.abs(dfVal - fVal) > 1e-5) {
            html += `<div class="math-step-box math-step-error">Peringatan Kritis: F(x) yang Anda masukkan tampaknya BUKAN anti-turunan dari f(x)! Hasil evaluasi F'(a) \u2260 f(a).</div>`;
        }
    } catch (e) {
    }
    
    let valA, valB;
    try {
        valA = bigFNode.evaluate({x: a});
        valB = bigFNode.evaluate({x: b});
    } catch (e) {
        html += `<div class="math-step-box math-step-error">\u274C Error saat mensubstitusi nilai x ke F(x). Pastikan fungsi valid pada interval tersebut.</div></div>`;
        refs.m17Steps.innerHTML = html;
        return;
    }
    
    const res = valB - valA;
    
    html += `<div class="math-step-box math-step-valid math-mt-15">Teorema Dasar Kalkulus II:</div>`;
    html += `<div class="math-step-box math-step-valid">\u222B [dari ${a} sampai ${b}] f(x) dx = F(${b}) - F(${a})</div>`;
    html += `<div class="math-step-box math-step-valid">F(${b}) = ${valB.toFixed ? valB.toFixed(6) : valB}</div>`;
    html += `<div class="math-step-box math-step-valid">F(${a}) = ${valA.toFixed ? valA.toFixed(6) : valA}</div>`;
    html += `<div class="math-step-box math-step-valid">Integral = ${valB.toFixed ? valB.toFixed(6) : valB} - (${valA.toFixed ? valA.toFixed(6) : valA})</div>`;
    
    html += `<div class="math-step-box math-step-valid math-result-highlight">Hasil = <span class="m10-td-bold">${res.toFixed(6)}</span></div>`;
    
    html += `</div>`;
    refs.m17Steps.innerHTML = html;
    drawIntegral('math17-canvas', strF, a, b, 'area');
}
