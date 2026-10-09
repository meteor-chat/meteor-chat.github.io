import { refs } from "./dom-refs.js";

export function addM11Input() {
    if (!refs.m11DynamicInputs) return;
    const index = refs.m11DynamicInputs.children.length + 1;

    const div = document.createElement('div');
    div.className = 'm10-input-group';

    const label = document.createElement('label');
    label.className = 'm10-label';
    label.textContent = `x${index}`;

    const input = document.createElement('input');
    input.type = 'number';
    input.step = 'any';
    input.className = 'm10-x-input';
    input.placeholder = `Data ${index}`;

    const onChange = () => {
        const rows = refs.m11DynamicInputs.children;
        const lastRow = rows[rows.length - 1];
        const lastIn = lastRow.querySelector('.m10-x-input');
        if (lastIn.value.trim() !== '') {
            addM11Input();
        }
        calculateMath11();
    };

    input.addEventListener("input", onChange);

    div.appendChild(label);
    div.appendChild(input);
    refs.m11DynamicInputs.appendChild(div);
}

export function calculateMath11() {
    if (!refs.m11Steps || !refs.m11DynamicInputs) return;
    refs.m11Steps.innerHTML = '';
    
    const rows = refs.m11DynamicInputs.children;
    const data = [];
    
    for (let i = 0; i < rows.length; i++) {
        const xIn = rows[i].querySelector('.m10-x-input');
        const v = xIn.value.trim();
        if (v !== '') {
            data.push(parseFloat(v));
        }
    }
    
    const n = data.length;
    if (n === 0) return;

    const sumX = data.reduce((a, b) => a + b, 0);
    const mean = sumX / n;

    let sumSq = 0;
    const tableData = data.map((x, i) => {
        const diff = x - mean;
        const sq = diff * diff;
        sumSq += sq;
        return { i: i + 1, x, diff, sq };
    });

    let variance = 0;
    let sigma = 0;
    
    if (n > 1) {
        variance = sumSq / (n - 1);
        sigma = Math.sqrt(variance);
    }

    let html = `<div class="m10-summary">
        <div class="m10-summary-item">n (Jumlah Data Sampel) = ${n}</div>
        <div class="m10-summary-item">x\u0304 (Mean Sampel) = ${sumX} / ${n} = ${mean.toFixed(4)}</div>
    </div>`;

    html += `<table class="m10-table">
        <thead>
            <tr>
                <th class="m10-th">i</th>
                <th class="m10-th">x_i</th>
                <th class="m10-th">x_i - x\u0304</th>
                <th class="m10-th">(x_i - x\u0304)\u00B2</th>
            </tr>
        </thead>
        <tbody>`;

    tableData.forEach(r => {
        html += `
            <tr class="m10-tr">
                <td class="m10-td">${r.i}</td>
                <td class="m10-td">${r.x}</td>
                <td class="m10-td">${r.diff.toFixed(4)}</td>
                <td class="m10-td">${r.sq.toFixed(4)}</td>
            </tr>
        `;
    });

    html += `
            <tr class="m10-tr">
                <td class="m10-td-bold" colspan="3">Total \u03A3(x_i - x\u0304)\u00B2</td>
                <td class="m10-td-bold">${sumSq.toFixed(4)}</td>
            </tr>
        </tbody>
    </table>`;

    if (n <= 1) {
        html += `<div class="m10-summary">
            <div class="m10-summary-item math-step-error">Butuh minimal 2 data sampel untuk menghitung (n-1).</div>
        </div>`;
    } else {
        html += `<div class="m10-summary">
            <div class="m10-summary-item">s\u00B2 (Variance Sampel) = ${sumSq.toFixed(4)} / (${n} - 1) = ${variance.toFixed(4)}</div>
            <div class="m10-summary-item">s (Standar Deviasi Sampel) = \u221A${variance.toFixed(4)} = <span class="m10-td-bold">${sigma.toFixed(4)}</span></div>
        </div>`;
    }

    refs.m11Steps.innerHTML = html;
}
