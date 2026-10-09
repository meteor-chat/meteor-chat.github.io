import { refs } from "./dom-refs.js";

export function calculateMath16() {
    if (!refs.m16Steps) return;
    refs.m16Steps.innerHTML = '';
    
    if (!refs.m16InF || !refs.m16InA) return;
    
    const strF = refs.m16InF.value.trim();
    const strA = refs.m16InA.value.trim();
    
    if (strF === '' || strA === '') return;
    
    if (typeof math === 'undefined') {
        refs.m16Steps.innerHTML = '<div class="math-step-box math-step-error">\u274C Error: library math.js tidak ditemukan.</div>';
        return;
    }
    
    const a = parseFloat(strA);
    if (isNaN(a)) return;
    
    let fNode;
    try {
        fNode = math.parse(strF);
    } catch (e) {
        refs.m16Steps.innerHTML = '<div class="math-step-box math-step-error">\u274C Error Sintaks: Fungsi integran tidak valid. (Contoh valid: t^2 + 2*t)</div>';
        return;
    }
    
    let transformedNode;
    try {
        transformedNode = fNode.transform(function (node, path, parent) {
            if (node.isSymbolNode && node.name === 't') {
                return new math.SymbolNode('x');
            }
            return node;
        });
    } catch (e) {
        refs.m16Steps.innerHTML = '<div class="math-step-box math-step-error">\u274C Error saat mentransformasi variabel t menjadi x.</div>';
        return;
    }
    
    const fT = fNode.toString();
    const fX = transformedNode.toString();
    
    let html = `<div class="math-step">`;
    html += `<div class="math-step-box math-step-selected">Diketahui:<br>f(t) = ${fT}<br>a = ${a}</div>`;
    
    html += `<div class="math-step-box math-step-valid math-mt-15">Membentuk Fungsi Akumulasi g(x):</div>`;
    html += `<div class="math-step-box math-step-valid">g(x) = \u222B [dari ${a} sampai x] (${fT}) dt</div>`;
    
    html += `<div class="math-step-box math-step-valid math-mt-15">Menerapkan Teorema Dasar Kalkulus I:</div>`;
    html += `<div class="math-step-box math-step-valid">g'(x) = d/dx [ \u222B [dari ${a} sampai x] (${fT}) dt ]</div>`;
    html += `<div class="math-step-box math-step-valid">Berdasarkan teorema, turunan integral dari konstanta ke x adalah f(x).</div>`;
    
    html += `<div class="math-step-box math-step-valid math-result-highlight">g'(x) = <span class="m10-td-bold">${fX}</span></div>`;
    
    html += `</div>`;
    refs.m16Steps.innerHTML = html;
}
