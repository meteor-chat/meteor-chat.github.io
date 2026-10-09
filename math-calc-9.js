import { refs } from "./dom-refs.js";
export function calculateMath9() {
    if (!refs.m9Steps) return;
    refs.m9Steps.innerHTML = '';
    const text = refs.m9InPoints ? refs.m9InPoints.value.trim() : '';
    if (!text) return;
    const lines = text.split('\n');
    const points = [];
    const regex = /^([A-Za-z0-9_]+)\s*=?\s*\(?\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)?$/;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const match = line.match(regex);
        if (!match) {
            const errDiv = document.createElement('div');
            errDiv.className = 'math-step-box math-step-error';
            errDiv.textContent = `\u274C Error pada baris ${i + 1}: Format tidak valid. Gunakan format "Nama = f1, f2" (contoh: A = 2, 8)`;
            refs.m9Steps.appendChild(errDiv);
            return;
        }
        points.push({
            name: match[1],
            f1: parseFloat(match[2]),
            f2: parseFloat(match[3]),
            n_p: 0,
            S_p: [],
            dominatedBy: []
        });
    }
    for (let i = 0; i < points.length; i++) {
        for (let j = 0; j < points.length; j++) {
            if (i === j) continue;
            const p = points[i];
            const q = points[j];
            const pDomQ = p.f1 <= q.f1 && p.f2 <= q.f2 && (p.f1 < q.f1 || p.f2 < q.f2);
            if (pDomQ) {
                p.S_p.push(q.name);
                q.dominatedBy.push(p.name);
            }
        }
    }
    points.forEach(p => {
        p.n_p = p.dominatedBy.length;
    });
    let html = `<table style="width: 100%; border-collapse: collapse; margin-top: 15px; color: white; text-align: center; font-family: monospace; font-size: 14px;">
        <thead>
            <tr style="background: #1f2937; border-bottom: 2px solid #374151;">
                <th style="padding: 10px; border: 1px solid #374151;">Point</th>
                <th style="padding: 10px; border: 1px solid #374151;">(f1, f2)</th>
                <th style="padding: 10px; border: 1px solid #374151;">dominated by</th>
                <th style="padding: 10px; border: 1px solid #374151;">n_p</th>
                <th style="padding: 10px; border: 1px solid #374151;">S_p (it dominates)</th>
            </tr>
        </thead>
        <tbody>`;
    points.forEach(p => {
        const domBy = p.dominatedBy.length > 0 ? p.dominatedBy.join(', ') : '\u2014';
        const sp = p.S_p.length > 0 ? p.S_p.join(', ') : '\u2014';
        html += `
            <tr style="border-bottom: 1px solid #374151;">
                <td style="padding: 8px; border: 1px solid #374151; font-weight: bold;">${p.name}</td>
                <td style="padding: 8px; border: 1px solid #374151;">(${p.f1}, ${p.f2})</td>
                <td style="padding: 8px; border: 1px solid #374151;">${domBy}</td>
                <td style="padding: 8px; border: 1px solid #374151; font-weight: bold; color: ${p.n_p === 0 ? '#34d399' : '#f87171'};">${p.n_p}</td>
                <td style="padding: 8px; border: 1px solid #374151;">${sp}</td>
            </tr>
        `;
    });
    html += `</tbody></table>`;
    refs.m9Steps.innerHTML = html;
}