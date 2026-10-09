import { refs } from "./dom-refs.js";

const isZero = (val) => Math.abs(val) < 1e-10;
const isInf = (val) => Math.abs(val) > 1e10 || !isFinite(val);

export function calculateMath15() {
    if (!refs.m15Steps) return;
    refs.m15Steps.innerHTML = '';
    
    if (!refs.m15InF || !refs.m15InG || !refs.m15InC) return;
    
    const strF = refs.m15InF.value.trim();
    const strG = refs.m15InG.value.trim();
    const strC = refs.m15InC.value.trim();
    
    if (strF === '' || strG === '' || strC === '') return;
    
    if (typeof math === 'undefined') {
        refs.m15Steps.innerHTML = '<div class="math-step-box math-step-error">\u274C Error: library math.js tidak ditemukan.</div>';
        return;
    }
    
    const c = parseFloat(strC);
    if (isNaN(c)) return;
    
    let fNode, gNode;
    try {
        fNode = math.parse(strF);
        gNode = math.parse(strG);
    } catch (e) {
        refs.m15Steps.innerHTML = '<div class="math-step-box math-step-error">\u274C Error: Fungsi tidak valid. (Contoh: x^2 + 2*x - 3)</div>';
        return;
    }
    
    let html = `<div class="math-step">`;
    html += `<div class="math-step-box math-step-selected">Evaluasi L'H\u00F4pital:<br>f(x) = ${fNode.toString()}<br>g(x) = ${gNode.toString()}<br>c = ${c}</div>`;
    
    let iter = 0;
    const maxIter = 5;
    let success = false;
    
    while (iter < maxIter) {
        let fVal, gVal;
        try {
            fVal = fNode.evaluate({ x: c });
            gVal = gNode.evaluate({ x: c });
        } catch (e) {
            html += `<div class="math-step-box math-step-error">\u274C Error evaluasi fungsi pada iterasi ke-${iter}.</div></div>`;
            refs.m15Steps.innerHTML = html;
            return;
        }
        
        const fZero = isZero(fVal);
        const gZero = isZero(gVal);
        const fInf = isInf(fVal);
        const gInf = isInf(gVal);
        
        const is00 = fZero && gZero;
        const isInfInf = fInf && gInf;
        
        if (!is00 && !isInfInf) {
            html += `<div class="math-step-box math-step-valid math-mt-15">Iterasi ${iter}: Bentuk Tentu</div>`;
            html += `<div class="math-step-box math-step-valid">f(${c}) = ${fVal.toFixed ? fVal.toFixed(4) : fVal}</div>`;
            html += `<div class="math-step-box math-step-valid">g(${c}) = ${gVal.toFixed ? gVal.toFixed(4) : gVal}</div>`;
            
            if (isZero(gVal)) {
                html += `<div class="math-step-box math-step-error">\u274C Error: Limit pembagian oleh nol bukan bentuk tak tentu.</div>`;
            } else {
                const res = fVal / gVal;
                html += `<div class="math-step-box math-step-valid math-result-highlight">Limit = <span class="m10-td-bold">${res.toFixed(6)}</span></div>`;
            }
            success = true;
            break;
        }
        
        html += `<div class="math-step-box math-step-valid math-mt-15">Iterasi ${iter}: Bentuk Tak Tentu (${is00 ? '0/0' : '\u221E/\u221E'})</div>`;
        html += `<div class="math-step-box math-step-valid">f(${c}) \u2192 ${is00 ? '0' : '\u221E'}</div>`;
        html += `<div class="math-step-box math-step-valid">g(${c}) \u2192 ${is00 ? '0' : '\u221E'}</div>`;
        html += `<div class="math-step-box math-step-selected">Menerapkan Turunan L'H\u00F4pital...</div>`;
        
        try {
            fNode = math.derivative(fNode, 'x');
            gNode = math.derivative(gNode, 'x');
        } catch (e) {
            html += `<div class="math-step-box math-step-error">\u274C Error: Gagal melakukan turunan. Pastikan fungsi terdiferensialkan.</div></div>`;
            refs.m15Steps.innerHTML = html;
            return;
        }
        
        html += `<div class="math-step-box math-step-valid">f'(x) = ${fNode.toString()}</div>`;
        html += `<div class="math-step-box math-step-valid">g'(x) = ${gNode.toString()}</div>`;
        
        iter++;
    }
    
    if (!success) {
         html += `<div class="math-step-box math-step-error">\u274C Batal: Melebihi ${maxIter} iterasi tanpa konvergensi.</div>`;
    }
    
    html += `</div>`;
    refs.m15Steps.innerHTML = html;
}
