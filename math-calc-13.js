import { refs } from "./dom-refs.js";

function factorial(n) {
    let result = 1n;
    for (let i = 2n; i <= BigInt(n); i++) {
        result *= i;
    }
    return result;
}

export function calculateMath13() {
    if (!refs.m13Steps) return;
    refs.m13Steps.innerHTML = '';
    
    if (!refs.m13InN || !refs.m13InK) return;
    
    const vN = refs.m13InN.value.trim();
    const vK = refs.m13InK.value.trim();
    
    if (vN === '' || vK === '') return;
    
    const n = Number(vN);
    const k = Number(vK);
    
    if (!Number.isInteger(n) || !Number.isInteger(k) || n < 0 || k < 0) {
        refs.m13Steps.innerHTML = '<div class="math-step-box math-step-error">\u274C Error: Nilai n dan k harus berupa bilangan bulat non-negatif.</div>';
        return;
    }
    
    if (k > n) {
        refs.m13Steps.innerHTML = '<div class="math-step-box math-step-error">\u274C Error: Nilai k tidak boleh lebih besar dari n.</div>';
        return;
    }
    
    if (n > 1000) {
        refs.m13Steps.innerHTML = '<div class="math-step-box math-step-error">\u274C Error: Nilai n terlalu besar (maks 1000).</div>';
        return;
    }

    const factN = factorial(n);
    const factK = factorial(k);
    const factNK = factorial(n - k);
    
    const result = factN / (factK * factNK);
    
    const strN = factN.toString();
    const strK = factK.toString();
    const strNK = factNK.toString();
    const strRes = result.toString();
    
    let html = `<div class="math-step">`;
    html += `<div class="math-step-box math-step-selected">Diketahui:<br>n = ${n}<br>k = ${k}</div>`;
    html += `<div class="math-step-box math-step-valid math-mt-15">C(${n}, ${k}) = ${n}! / (${k}!(${n} - ${k})!)</div>`;
    
    if (n <= 15) {
        html += `<div class="math-step-box math-step-valid">C(${n}, ${k}) = ${strN} / (${strK} \u00D7 ${strNK})</div>`;
    } else {
        html += `<div class="math-step-box math-step-valid">C(${n}, ${k}) = (nilai faktorial sangat besar)</div>`;
    }
    
    html += `<div class="math-step-box math-step-valid math-result-highlight">C(${n}, ${k}) = <span class="m10-td-bold math-word-break">${strRes}</span></div>`;
    html += `</div>`;
    
    refs.m13Steps.innerHTML = html;
}
