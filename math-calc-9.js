import { refs } from "./dom-refs.js";

function getPointName(index) {
    let name = '';
    let i = index;
    while (i >= 0) {
        name = String.fromCharCode(65 + (i % 26)) + name;
        i = Math.floor(i / 26) - 1;
    }
    return name;
}

export function addM9Input() {
    if (!refs.m9DynamicInputs) return;
    const index = refs.m9DynamicInputs.children.length;
    const charName = getPointName(index);

    const div = document.createElement('div');
    div.className = 'math-input-group';
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.style.alignItems = 'center';

    const label = document.createElement('label');
    label.style.width = '20px';
    label.style.marginBottom = '0';
    label.textContent = charName;

    const input1 = document.createElement('input');
    input1.type = 'number';
    input1.step = '0.1';
    input1.className = 'm9-f1-input';
    input1.placeholder = 'f1';

    const input2 = document.createElement('input');
    input2.type = 'number';
    input2.step = '0.1';
    input2.className = 'm9-f2-input';
    input2.placeholder = 'f2';

    const onChange = () => {
        const rows = refs.m9DynamicInputs.children;
        const lastRow = rows[rows.length - 1];
        const lastIn1 = lastRow.querySelector('.m9-f1-input');
        const lastIn2 = lastRow.querySelector('.m9-f2-input');
        if (lastIn1.value.trim() !== '' || lastIn2.value.trim() !== '') {
            addM9Input();
        }
        calculateMath9();
    };

    input1.addEventListener("input", onChange);
    input2.addEventListener("input", onChange);

    div.appendChild(label);
    div.appendChild(input1);
    div.appendChild(input2);
    refs.m9DynamicInputs.appendChild(div);
}

export function calculateMath9() {
    if (!refs.m9Steps || !refs.m9DynamicInputs) return;
    refs.m9Steps.innerHTML = '';
    
    const rows = refs.m9DynamicInputs.children;
    const points = [];
    
    for (let i = 0; i < rows.length; i++) {
        const f1In = rows[i].querySelector('.m9-f1-input');
        const f2In = rows[i].querySelector('.m9-f2-input');
        const v1 = f1In.value.trim();
        const v2 = f2In.value.trim();
        
        if (v1 !== '' && v2 !== '') {
            const name = rows[i].querySelector('label').textContent;
            points.push({
                name: name,
                f1: parseFloat(v1),
                f2: parseFloat(v2),
                n_p: 0,
                S_p: [],
                dominatedBy: []
            });
        }
    }
    
    if (points.length === 0) return;

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
                <td style="padding: 8px; border: 1px solid #374151; font-weight: 600;">${p.name}</td>
                <td style="padding: 8px; border: 1px solid #374151;">(${p.f1}, ${p.f2})</td>
                <td style="padding: 8px; border: 1px solid #374151;">${domBy}</td>
                <td style="padding: 8px; border: 1px solid #374151; font-weight: 600; color: ${p.n_p === 0 ? '#34d399' : '#f87171'};">${p.n_p}</td>
                <td style="padding: 8px; border: 1px solid #374151;">${sp}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    refs.m9Steps.innerHTML = html;
}
