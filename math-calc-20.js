import { refs } from "./dom-refs.js";

export function calculateMath20() {
    if (!refs.m20Steps) return;
    refs.m20Steps.innerHTML = '';
    
    if (!refs.m20InA || !refs.m20InB) return;
    
    const strA = refs.m20InA.value.trim();
    const strB = refs.m20InB.value.trim();
    
    if (strA === '' || strB === '') return;
    
    if (typeof math === 'undefined') {
        refs.m20Steps.innerHTML = '<div class="math-step-box math-step-error">\u274C Error: library math.js tidak ditemukan.</div>';
        return;
    }
    
    let matA, matB;
    try {
        matA = math.evaluate(strA);
        matB = math.evaluate(strB);
    } catch (e) {
        refs.m20Steps.innerHTML = '<div class="math-step-box math-step-error">\u274C Error Sintaks: Format matriks tidak valid. (Gunakan format: [1, 2; 3, 4])</div>';
        return;
    }
    
    const typeA = math.typeOf(matA);
    const typeB = math.typeOf(matB);
    
    if (typeA !== 'Matrix' && typeA !== 'Array') {
        refs.m20Steps.innerHTML = '<div class="math-step-box math-step-error">\u274C Error: Input A bukan sebuah matriks.</div>';
        return;
    }
    if (typeB !== 'Matrix' && typeB !== 'Array') {
        refs.m20Steps.innerHTML = '<div class="math-step-box math-step-error">\u274C Error: Input B bukan sebuah matriks.</div>';
        return;
    }
    
    const sizeA = math.size(matA).valueOf();
    const sizeB = math.size(matB).valueOf();
    
    if (sizeA.length !== 2 || sizeA[0] !== sizeA[1]) {
        refs.m20Steps.innerHTML = '<div class="math-step-box math-step-error">\u274C Error: Matriks A bukan matriks persegi (n \u00D7 n).</div>';
        return;
    }
    if (sizeB.length !== 2 || sizeB[0] !== sizeB[1]) {
        refs.m20Steps.innerHTML = '<div class="math-step-box math-step-error">\u274C Error: Matriks B bukan matriks persegi (n \u00D7 n).</div>';
        return;
    }
    
    if (sizeA[0] !== sizeB[0]) {
        refs.m20Steps.innerHTML = `<div class="math-step-box math-step-error">\u274C Error: Dimensi tidak cocok! Matriks A berukuran ${sizeA[0]}\u00D7${sizeA[0]}, sedangkan Matriks B berukuran ${sizeB[0]}\u00D7${sizeB[0]}.</div>`;
        return;
    }
    
    let html = `<div class="math-step">`;
    html += `<div class="math-step-box math-step-selected">Diketahui Matriks Persegi (${sizeA[0]}\u00D7${sizeA[0]}):<br>A = ${math.format(matA)}<br>B = ${math.format(matB)}</div>`;
    
    let detA, detB, matAB, detAB;
    try {
        detA = math.det(matA);
        detB = math.det(matB);
        matAB = math.multiply(matA, matB);
        detAB = math.det(matAB);
    } catch (e) {
        html += `<div class="math-step-box math-step-error">\u274C Error saat memproses komputasi matriks.</div></div>`;
        refs.m20Steps.innerHTML = html;
        return;
    }
    
    const detAdetB = detA * detB;
    
    html += `<div class="math-step-box math-step-valid math-mt-15">Menghitung Determinan Masing-Masing:</div>`;
    html += `<div class="math-step-box math-step-valid">det(A) = ${detA}</div>`;
    html += `<div class="math-step-box math-step-valid">det(B) = ${detB}</div>`;
    html += `<div class="math-step-box math-step-valid">det(A) \u00D7 det(B) = ${detA} \u00D7 ${detB} = ${detAdetB}</div>`;
    
    html += `<div class="math-step-box math-step-valid math-mt-15">Menghitung Matriks Hasil Kali (AB):</div>`;
    html += `<div class="math-step-box math-step-valid">AB = ${math.format(matAB)}</div>`;
    html += `<div class="math-step-box math-step-valid">det(AB) = ${detAB}</div>`;
    
    const isVerified = Math.abs(detAB - detAdetB) < 1e-7;
    
    if (isVerified) {
        html += `<div class="math-step-box math-step-valid math-result-highlight">Verifikasi Teorema: <span class="m10-td-bold">TERBUKTI</span><br>det(AB) = det(A) \u00D7 det(B) = ${detAB}</div>`;
    } else {
        html += `<div class="math-step-box math-step-error">Peringatan: Terdapat ketidakcocokan nilai akibat presisi (det(AB)=${detAB}, det(A)det(B)=${detAdetB}).</div>`;
    }
    
    html += `</div>`;
    refs.m20Steps.innerHTML = html;
}
