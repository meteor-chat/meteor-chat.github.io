import { refs } from "../../core/dom-refs.js";
import { drawPythagoras, clearPythagoras } from "../visuals/math-visual-14.js";
import { formatMax3 } from "../math-format.js";

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
        html += `<div class="math-step-box math-step-selected">Mencari Sisi Miring (c)<br>a = ${formatMax3(a)}<br>b = ${formatMax3(b)}</div>`;
        const cSq = a*a + b*b;
        const resC = Math.sqrt(cSq);
        html += `<div class="math-step-box math-step-valid math-mt-15">c = \u221A(a\u00B2 + b\u00B2)</div>`;
        html += `<div class="math-step-box math-step-valid">c = \u221A(${formatMax3(a)}\u00B2 + ${formatMax3(b)}\u00B2)</div>`;
        html += `<div class="math-step-box math-step-valid">c = \u221A(${formatMax3(a*a)} + ${formatMax3(b*b)})</div>`;
        html += `<div class="math-step-box math-step-valid">c = \u221A${formatMax3(cSq)}</div>`;
        html += `<div class="math-step-box math-step-valid math-result-highlight">c = <span class="m10-td-bold">${formatMax3(resC)}</span></div>`;
        drawPythagoras(a, b, resC);
    } else if (a !== null && c !== null) {
        if (a >= c) {
            refs.m14Steps.innerHTML = '<div class="math-step-box math-step-error">\u274C Error: Sisi miring (c) harus menjadi sisi terpanjang (c > a).</div>';
            return;
        }
        html += `<div class="math-step-box math-step-selected">Mencari Sisi Tinggi/Tegak (b)<br>a = ${formatMax3(a)}<br>c = ${formatMax3(c)}</div>`;
        const bSq = c*c - a*a;
        const resB = Math.sqrt(bSq);
        html += `<div class="math-step-box math-step-valid math-mt-15">b = \u221A(c\u00B2 - a\u00B2)</div>`;
        html += `<div class="math-step-box math-step-valid">b = \u221A(${formatMax3(c)}\u00B2 - ${formatMax3(a)}\u00B2)</div>`;
        html += `<div class="math-step-box math-step-valid">b = \u221A(${formatMax3(c*c)} - ${formatMax3(a*a)})</div>`;
        html += `<div class="math-step-box math-step-valid">b = \u221A${formatMax3(bSq)}</div>`;
        html += `<div class="math-step-box math-step-valid math-result-highlight">b = <span class="m10-td-bold">${formatMax3(resB)}</span></div>`;
        drawPythagoras(a, resB, c);
    } else if (b !== null && c !== null) {
        if (b >= c) {
            refs.m14Steps.innerHTML = '<div class="math-step-box math-step-error">\u274C Error: Sisi miring (c) harus menjadi sisi terpanjang (c > b).</div>';
            return;
        }
        html += `<div class="math-step-box math-step-selected">Mencari Sisi Alas (a)<br>b = ${formatMax3(b)}<br>c = ${formatMax3(c)}</div>`;
        const aSq = c*c - b*b;
        const resA = Math.sqrt(aSq);
        html += `<div class="math-step-box math-step-valid math-mt-15">a = \u221A(c\u00B2 - b\u00B2)</div>`;
        html += `<div class="math-step-box math-step-valid">a = \u221A(${formatMax3(c)}\u00B2 - ${formatMax3(b)}\u00B2)</div>`;
        html += `<div class="math-step-box math-step-valid">a = \u221A(${formatMax3(c*c)} - ${formatMax3(b*b)})</div>`;
        html += `<div class="math-step-box math-step-valid">a = \u221A${formatMax3(aSq)}</div>`;
        html += `<div class="math-step-box math-step-valid math-result-highlight">a = <span class="m10-td-bold">${formatMax3(resA)}</span></div>`;
        drawPythagoras(resA, b, c);
    }
    
    html += `</div>`;
    refs.m14Steps.innerHTML = html;
}
