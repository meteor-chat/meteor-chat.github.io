import { refs } from "./dom-refs.js";
export function addM10Input() {
    if (!refs.m10DynamicInputs) return;
    const index = refs.m10DynamicInputs.children.length + 1;
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
        const rows = refs.m10DynamicInputs.children;
        const lastRow = rows[rows.length - 1];
        const lastIn = lastRow.querySelector('.m10-x-input');
        if (lastIn.value.trim() !== '') {
            addM10Input();
        }
        calculateMath10();
    };
    input.addEventListener("input", onChange);
    div.appendChild(label);
    div.appendChild(input);
    refs.m10DynamicInputs.appendChild(div);
}
export function calculateMath10() {
    if (!refs.m10Steps || !refs.m10DynamicInputs) return;
    refs.m10Steps.innerHTML = '';
    const rows = refs.m10DynamicInputs.children;
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
    const mu = sumX / n;
    let sumSq = 0;
    const tableData = data.map((x, i) => {
        const diff = x - mu;
        const sq = diff * diff;
        sumSq += sq;
        return { i: i + 1, x, diff, sq };
    });
    const variance = sumSq / n;
    const sigma = Math.sqrt(variance);
    let html = `<div class="m10-summary">
        <div class="m10-summary-item">n (Jumlah Data) = ${n}</div>
        <div class="m10-summary-item">\u03BC (Mean) = ${sumX} / ${n} = ${mu.toFixed(4)}</div>
    </div>`;
    html += `<table class="m10-table">
        <thead>
            <tr>
                <th class="m10-th">i</th>
                <th class="m10-th">x_i</th>
                <th class="m10-th">x_i - \u03BC</th>
                <th class="m10-th">(x_i - \u03BC)\u00B2</th>
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
                <td class="m10-td-bold" colspan="3">Total \u03A3(x_i - \u03BC)\u00B2</td>
                <td class="m10-td-bold">${sumSq.toFixed(4)}</td>
            </tr>
        </tbody>
    </table>`;
    html += `<div class="m10-summary">
        <div class="m10-summary-item">\u03C3\u00B2 (Variance) = ${sumSq.toFixed(4)} / ${n} = ${variance.toFixed(4)}</div>
        <div class="m10-summary-item">\u03C3 (Standar Deviasi) = \u221A${variance.toFixed(4)} = <span class="m10-td-bold">${sigma.toFixed(4)}</span></div>
    </div>`;
    refs.m10Steps.innerHTML = html;
}