import { refs } from "./dom-refs.js";

export function calculateMath12() {
    if (!refs.m12Steps) return;
    refs.m12Steps.innerHTML = '';
    
    if (!refs.m12InPa || !refs.m12InPba || !refs.m12InPb) return;
    
    const vPa = refs.m12InPa.value.trim();
    const vPba = refs.m12InPba.value.trim();
    const vPb = refs.m12InPb.value.trim();
    
    if (vPa === '' || vPba === '' || vPb === '') return;
    
    const pA = parseFloat(vPa);
    const pBA = parseFloat(vPba);
    const pB = parseFloat(vPb);
    
    if (pA < 0 || pA > 1 || pBA < 0 || pBA > 1 || pB < 0 || pB > 1) {
        refs.m12Steps.innerHTML = '<div class="math-step-box math-step-error">\u274C Error: Semua nilai probabilitas harus berada di antara 0 dan 1.</div>';
        return;
    }
    
    if (pB === 0) {
        refs.m12Steps.innerHTML = '<div class="math-step-box math-step-error">\u274C Error: P(B) tidak boleh bernilai 0.</div>';
        return;
    }
    
    const pAB = (pBA * pA) / pB;
    
    let html = `<div class="math-step">`;
    html += `<div class="math-step-box math-step-selected">Diketahui:<br>P(A) = ${pA}<br>P(B|A) = ${pBA}<br>P(B) = ${pB}</div>`;
    html += `<div class="math-step-box math-step-valid math-mt-15">P(A|B) = (${pBA} \u00D7 ${pA}) / ${pB}</div>`;
    html += `<div class="math-step-box math-step-valid">P(A|B) = ${(pBA * pA).toFixed(6)} / ${pB}</div>`;
    html += `<div class="math-step-box math-step-valid math-result-highlight">P(A|B) = <span class="m10-td-bold">${pAB.toFixed(6)}</span></div>`;
    
    if (pAB > 1) {
         html += `<div class="math-step-box math-step-error">Peringatan: Hasil melebihi 1, pastikan input P(B) valid sesuai Hukum Probabilitas Total.</div>`;
    }
    
    html += `</div>`;
    refs.m12Steps.innerHTML = html;
}
