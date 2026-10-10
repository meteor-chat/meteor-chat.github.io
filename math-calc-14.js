import { refs } from "./dom-refs.js";
import { drawPythagoras, clearPythagoras } from "./math-visual-14.js";

export function calculateMath14() {
    if (!refs.m14Steps) return;
    refs.m14Steps.innerHTML = '';
    clearPythagoras();
    
    if (!refs.m14InA || !refs.m14InB || !refs.m14InC) return;
    
    const vA = refs.m14InA.value.trim();
    const vB = refs.m14InB.value.trim();
    const vC = refs.m14InC.value.trim();
    
    let a = vA !== '' ? parseFloat(vA) : null;
    let b = vB !== '' ? parseFloat(vB) : null;
    let c = vC !== '' ? parseFloat(vC) : null;
    
    const count = (a !== null ? 1 : 0) + (b !== null ? 1 : 0) + (c !== null ? 1 : 0);
    
    if (count === 0) return;
    
    if (count !== 2) {
        refs.m14Steps.innerHTML = '<div class="math-step-box math-step-error">\u274C Error: Harap isi tepat 2 sisi segitiga (kosongkan 1 sisi yang ingin dicari).</div>';
        return;
    }
    
    if ((a !== null && a <= 0) || (b !== null && b <= 0) || (c !== null && c <= 0)) {
        refs.m14Steps.innerHTML = '<div class="math-step-box math-step-error">\u274C Error: Panjang sisi harus lebih besar dari 0.</div>';
        return;
    }
    
    let html = `<div class="math-step">`;
    
    if (a !== null && b !== null) {
        html += `<div class="math-step-box math-step-selected">Mencari Sisi Miring (c)<br>a = ${a}<br>b = ${b}</div>`;
        const cSq = a*a + b*b;
        const resC = Math.sqrt(cSq);
        html += `<div class="math-step-box math-step-valid math-mt-15">c = \u221A(a\u00B2 + b\u00B2)</div>`;
        html += `<div class="math-step-box math-step-valid">c = \u221A(${a}\u00B2 + ${b}\u00B2)</div>`;
        html += `<div class="math-step-box math-step-valid">c = \u221A(${a*a} + ${b*b})</div>`;
        html += `<div class="math-step-box math-step-valid">c = \u221A${cSq}</div>`;
        html += `<div class="math-step-box math-step-valid math-result-highlight">c = <span class="m10-td-bold">${resC.toFixed(4)}</span></div>`;
        drawPythagoras(a, b, resC);
    } else if (a !== null && c !== null) {
        if (a >= c) {
            refs.m14Steps.innerHTML = '<div class="math-step-box math-step-error">\u274C Error: Sisi miring (c) harus menjadi sisi terpanjang (c > a).</div>';
            return;
        }
        html += `<div class="math-step-box math-step-selected">Mencari Sisi Tinggi/Tegak (b)<br>a = ${a}<br>c = ${c}</div>`;
        const bSq = c*c - a*a;
        const resB = Math.sqrt(bSq);
        html += `<div class="math-step-box math-step-valid math-mt-15">b = \u221A(c\u00B2 - a\u00B2)</div>`;
        html += `<div class="math-step-box math-step-valid">b = \u221A(${c}\u00B2 - ${a}\u00B2)</div>`;
        html += `<div class="math-step-box math-step-valid">b = \u221A(${c*c} - ${a*a})</div>`;
        html += `<div class="math-step-box math-step-valid">b = \u221A${bSq}</div>`;
        html += `<div class="math-step-box math-step-valid math-result-highlight">b = <span class="m10-td-bold">${resB.toFixed(4)}</span></div>`;
        drawPythagoras(a, resB, c);
    } else if (b !== null && c !== null) {
        if (b >= c) {
            refs.m14Steps.innerHTML = '<div class="math-step-box math-step-error">\u274C Error: Sisi miring (c) harus menjadi sisi terpanjang (c > b).</div>';
            return;
        }
        html += `<div class="math-step-box math-step-selected">Mencari Sisi Alas (a)<br>b = ${b}<br>c = ${c}</div>`;
        const aSq = c*c - b*b;
        const resA = Math.sqrt(aSq);
        html += `<div class="math-step-box math-step-valid math-mt-15">a = \u221A(c\u00B2 - b\u00B2)</div>`;
        html += `<div class="math-step-box math-step-valid">a = \u221A(${c}\u00B2 - ${b}\u00B2)</div>`;
        html += `<div class="math-step-box math-step-valid">a = \u221A(${c*c} - ${b*b})</div>`;
        html += `<div class="math-step-box math-step-valid">a = \u221A${aSq}</div>`;
        html += `<div class="math-step-box math-step-valid math-result-highlight">a = <span class="m10-td-bold">${resA.toFixed(4)}</span></div>`;
        drawPythagoras(resA, b, c);
    }
    
    html += `</div>`;
    refs.m14Steps.innerHTML = html;
}
