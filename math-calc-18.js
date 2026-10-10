import { refs } from "./dom-refs.js";
import { drawIntegral, clearIntegral } from "./math-visual-integral.js";

function simpsonsRule(fNode, a, b, n = 1000) {
    if (n % 2 !== 0) n++;
    const h = (b - a) / n;
    let sum = fNode.evaluate({x: a}) + fNode.evaluate({x: b});
    
    for (let i = 1; i < n; i++) {
        const x = a + i * h;
        const y = fNode.evaluate({x: x});
        if (i % 2 === 0) {
            sum += 2 * y;
        } else {
            sum += 4 * y;
        }
    }
    return (h / 3) * sum;
}

export function calculateMath18() {
    if (!refs.m18Steps) return;
    refs.m18Steps.innerHTML = '';
    clearIntegral('math18-canvas');
    
    if (!refs.m18InF || !refs.m18InA || !refs.m18InB) return;
    
    const strF = refs.m18InF.value.trim();
    const strA = refs.m18InA.value.trim();
    const strB = refs.m18InB.value.trim();
    
    if (strF === '' || strA === '' || strB === '') return;
    
    if (typeof math === 'undefined') {
        refs.m18Steps.innerHTML = '<div class="math-step-box math-step-error">\u274C Error: library math.js tidak ditemukan.</div>';
        return;
    }
    
    const a = parseFloat(strA);
    const b = parseFloat(strB);
    if (isNaN(a) || isNaN(b)) return;
    
    if (a === b) {
        refs.m18Steps.innerHTML = '<div class="math-step-box math-step-error">\u274C Error: Batas atas dan batas bawah tidak boleh sama (a \u2260 b).</div>';
        return;
    }
    
    let fNode;
    try {
        fNode = math.parse(strF);
    } catch (e) {
        refs.m18Steps.innerHTML = '<div class="math-step-box math-step-error">\u274C Error Sintaks: Fungsi tidak valid. (Contoh: x^2)</div>';
        return;
    }
    
    let html = `<div class="math-step">`;
    html += `<div class="math-step-box math-step-selected">Diketahui:<br>f(x) = ${fNode.toString()}<br>Interval = [${a}, ${b}]</div>`;
    
    let integral;
    try {
        integral = simpsonsRule(fNode, a, b);
    } catch (e) {
        html += `<div class="math-step-box math-step-error">\u274C Error saat mengevaluasi integral. Pastikan f(x) terdefinisi pada interval tersebut.</div></div>`;
        refs.m18Steps.innerHTML = html;
        return;
    }
    
    const fC = integral / (b - a);
    
    html += `<div class="math-step-box math-step-valid math-mt-15">Menghitung Integral Tentu:</div>`;
    html += `<div class="math-step-box math-step-valid">\u222B [dari ${a} sampai ${b}] f(x) dx \u2248 ${integral.toFixed(6)}</div>`;
    
    html += `<div class="math-step-box math-step-valid math-mt-15">Menerapkan Teorema Nilai Rata-Rata Integral:</div>`;
    html += `<div class="math-step-box math-step-valid">f(c) = 1 / (${b} - ${a}) \u00D7 \u222B f(x) dx</div>`;
    html += `<div class="math-step-box math-step-valid">f(c) = 1 / ${(b - a).toFixed(4)} \u00D7 ${integral.toFixed(6)}</div>`;
    
    html += `<div class="math-step-box math-step-valid math-result-highlight">f(c) (Nilai Rata-Rata) = <span class="m10-td-bold">${fC.toFixed(6)}</span></div>`;
    
    html += `</div>`;
    refs.m18Steps.innerHTML = html;
    drawIntegral('math18-canvas', strF, a, b, 'mean');
}
