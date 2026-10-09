import { refs } from "./dom-refs.js";

function factorialBigInt(num) {
    let result = 1n;
    for (let i = 2n; i <= BigInt(num); i++) {
        result *= i;
    }
    return result;
}

export function calculateMath19() {
    if (!refs.m19Steps) return;
    refs.m19Steps.innerHTML = '';
    
    if (!refs.m19InN || !refs.m19InR) return;
    
    const strN = refs.m19InN.value.trim();
    const strR = refs.m19InR.value.trim();
    
    if (strN === '' || strR === '') return;
    
    const n = parseInt(strN, 10);
    const r = parseInt(strR, 10);
    
    if (isNaN(n) || isNaN(r)) return;
    
    if (n < 1) {
        refs.m19Steps.innerHTML = '<div class="math-step-box math-step-error">\u274C Error: Nilai n (jenis objek) harus berupa bilangan bulat positif (n \u2265 1).</div>';
        return;
    }
    
    if (r < 0) {
        refs.m19Steps.innerHTML = '<div class="math-step-box math-step-error">\u274C Error: Nilai r (objek dipilih) harus berupa bilangan bulat non-negatif (r \u2265 0).</div>';
        return;
    }
    
    if (n + r - 1 > 5000) {
        refs.m19Steps.innerHTML = '<div class="math-step-box math-step-error">\u274C Error: Angka terlalu besar untuk diproses secara instan di browser.</div>';
        return;
    }
    
    const N = n + r - 1;
    const nMinus1 = n - 1;
    
    let html = `<div class="math-step">`;
    html += `<div class="math-step-box math-step-selected">Diketahui (Kombinasi Pengulangan):<br>Jenis objek (n) = ${n}<br>Dipilih (r) = ${r}</div>`;
    
    html += `<div class="math-step-box math-step-valid math-mt-15">Transformasi ke Kombinasi Standar:</div>`;
    html += `<div class="math-step-box math-step-valid">C(n + r - 1, r) = C(${n} + ${r} - 1, ${r})</div>`;
    html += `<div class="math-step-box math-step-valid">C(${N}, ${r}) = ${N}! / (${r}! \u00D7 ${nMinus1}!)</div>`;
    
    const factN = factorialBigInt(N);
    const factR = factorialBigInt(r);
    const factNMinus1 = factorialBigInt(nMinus1);
    
    const den = factR * factNMinus1;
    const res = factN / den;
    
    html += `<div class="math-step-box math-step-valid math-mt-15">Evaluasi Faktorial:</div>`;
    
    let fNStr = factN.toString();
    if (fNStr.length > 30) fNStr = fNStr.substring(0, 15) + "..." + fNStr.substring(fNStr.length - 10) + ` (${fNStr.length} digit)`;
    
    let denStr = den.toString();
    if (denStr.length > 30) denStr = denStr.substring(0, 15) + "..." + denStr.substring(denStr.length - 10) + ` (${denStr.length} digit)`;
    
    html += `<div class="math-step-box math-step-valid">${N}! = ${fNStr}</div>`;
    html += `<div class="math-step-box math-step-valid">Penyebut = ${denStr}</div>`;
    
    html += `<div class="math-step-box math-step-valid math-result-highlight">Total Cara = <span class="m10-td-bold">${res.toString()}</span></div>`;
    
    html += `</div>`;
    refs.m19Steps.innerHTML = html;
}
