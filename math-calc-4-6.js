import { refs } from "./dom-refs.js";
export function addM4Input() {
    if (!refs.m4DynamicInputs) return;
    const index = refs.m4DynamicInputs.children.length + 1;
    const div = document.createElement('div');
    div.className = 'math-input-group';
    const label = document.createElement('label');
    label.textContent = `Fitness Individu ${index}`;
    const input = document.createElement('input');
    input.type = 'number';
    input.step = '0.1';
    input.className = 'm4-fitness-input';
    input.id = `m4-fit-${index}`;
    input.placeholder = '0';
        input.addEventListener("input", () => {
        const inputs = document.querySelectorAll('.m4-fitness-input');
        const lastInput = inputs[inputs.length - 1];
        if (lastInput.value.trim() !== '') {
            addM4Input();
        }
        calculateMath4();
    });
    div.appendChild(label);
    div.appendChild(input);
    refs.m4DynamicInputs.appendChild(div);
}
export function addM5Input() {
    if (!refs.m5DynamicInputs) return;
    const index = refs.m5DynamicInputs.children.length + 1;
    const div = document.createElement('div');
    div.className = 'math-input-group';
    const label = document.createElement('label');
    label.textContent = `Probabilitas (Pi) ${index}`;
    const input = document.createElement('input');
    input.type = 'number';
    input.step = '0.1';
    input.className = 'm5-prob-input';
    input.id = `m5-prob-${index}`;
    input.placeholder = '0';
        input.addEventListener("input", () => {
        const inputs = document.querySelectorAll('.m5-prob-input');
        const lastInput = inputs[inputs.length - 1];
        if (lastInput.value.trim() !== '') {
            addM5Input();
        }
        calculateMath5();
    });
    div.appendChild(label);
    div.appendChild(input);
    refs.m5DynamicInputs.appendChild(div);
}
export function addM6Input() {
    if (!refs.m6DynamicInputs) return;
    const index = refs.m6DynamicInputs.children.length + 1;
    const div = document.createElement('div');
    div.className = 'math-input-group';
    const label = document.createElement('label');
    label.textContent = `Nilai F${index}`;
    const input = document.createElement('input');
    input.type = 'number';
    input.step = '0.1';
    input.className = 'm6-fitness-input';
    input.id = `m6-fit-${index}`;
    input.placeholder = '0';
        input.addEventListener("input", () => {
        const inputs = document.querySelectorAll('.m6-fitness-input');
        const lastInput = inputs[inputs.length - 1];
        if (lastInput.value.trim() !== '') {
            addM6Input();
        }
        calculateMath6();
    });
    div.appendChild(label);
    div.appendChild(input);
    refs.m6DynamicInputs.appendChild(div);
}
export function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
}
export function calculateMath4() {
    if (!refs.m4Steps) return;
    const inputs = document.querySelectorAll('.m4-fitness-input');
    refs.m4Steps.textContent = '';
        const fitnessValues = [];
    let totalFitness = 0;
        inputs.forEach(input => {
        if (input.value.trim() !== '') {
            const val = parseFloat(input.value) || 0;
            fitnessValues.push(val);
            totalFitness += val;
        }
    });
    if (fitnessValues.length === 0) return;
    const totalDiv = document.createElement('div');
    totalDiv.className = 'math-step math-step-total';
    const strong = document.createElement('strong');
    strong.textContent = `Total Fitness (\u03A3F) = ${totalFitness.toFixed(3)}`;
    totalDiv.appendChild(strong);
    refs.m4Steps.appendChild(totalDiv);
    const table = document.createElement('table');
    table.className = 'math-table';
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Individu', 'Fitness (Fi)', 'Substitusi', 'Probabilitas (Pi)'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    const probabilities = [];
    fitnessValues.forEach((f, index) => {
        const p = totalFitness === 0 ? 0 : f / totalFitness;
        probabilities.push(p);
        const tr = document.createElement('tr');
        [index + 1, parseFloat(f.toFixed(3)), `${parseFloat(f.toFixed(3))} / ${parseFloat(totalFitness.toFixed(3))}`].forEach(val => {
            const td = document.createElement('td');
            td.textContent = val;
            tr.appendChild(td);
        });
        const tdP = document.createElement('td');
        const strongP = document.createElement('strong');
        strongP.textContent = p.toFixed(3);
        tdP.appendChild(strongP);
        tr.appendChild(tdP);
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    refs.m4Steps.appendChild(table);
}
export function calculateMath5() {
    if (!refs.m5Steps) return;
    const inputs = document.querySelectorAll('.m5-prob-input');
    refs.m5Steps.textContent = '';
        const probabilities = [];
    inputs.forEach(input => {
        if (input.value.trim() !== '') {
            probabilities.push(parseFloat(input.value) || 0);
        }
    });
    if (probabilities.length === 0) return;
    const rInput = refs.m5InR.value;
    const r = rInput !== "" ? parseFloat(rInput) : null;
    let cumulative = 0;
    let selectedParent = null;
    let selectedParentCumulative = null;
    let finalCumulative = 0;
    const rows = [];
    probabilities.forEach((p, index) => {
        const prevCumulative = cumulative;
        cumulative += p;
        finalCumulative = cumulative;
        const calculationText = index === 0
            ? `${p.toFixed(3)}`
            : `${prevCumulative.toFixed(3)} + ${p.toFixed(3)}`;
        rows.push({ index, p, calculationText, cumulative });
        if (r !== null && selectedParent === null && cumulative >= r) {
            selectedParent = index + 1;
            selectedParentCumulative = cumulative.toFixed(3);
        }
    });
    const validBanner = document.createElement('div');
    validBanner.className = finalCumulative >= 0.999 && finalCumulative <= 1.001
        ? 'math-step-box math-step-valid'
        : 'math-step-box math-step-invalid';
    validBanner.textContent = finalCumulative >= 0.999 && finalCumulative <= 1.001
        ? '\u2705 Kumulatif valid (berakhir di 1.000)'
        : '\u274C Error: Kumulatif tidak berakhir di 1.000. Cek kembali input nilai probabilitas.';
    refs.m5Steps.appendChild(validBanner);
    const table = document.createElement('table');
    table.className = 'math-table';
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Individu', 'Probabilitas (Pi)', 'Cara Hitung Kumulatif', 'Kumulatif (Ci)'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    rows.forEach(({ index, p, calculationText, cumulative: cum }) => {
        const tr = document.createElement('tr');
        [index + 1, p.toFixed(3), calculationText].forEach(val => {
            const td = document.createElement('td');
            td.textContent = val;
            tr.appendChild(td);
        });
        const tdC = document.createElement('td');
        const strongC = document.createElement('strong');
        strongC.textContent = cum.toFixed(3);
        tdC.appendChild(strongC);
        tr.appendChild(tdC);
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    refs.m5Steps.appendChild(table);
    if (r !== null) {
        const resultDiv = document.createElement('div');
        if (selectedParent !== null) {
            resultDiv.className = 'math-step-box math-step-selected';
            const h3 = document.createElement('h3');
            h3.textContent = `\uD83C\uDFAF Parent Terpilih: Individu ${selectedParent}`;
            const p2 = document.createElement('p');
            p2.textContent = `Alasan: ${selectedParentCumulative} adalah nilai kumulatif pertama yang lebih besar atau sama dengan (\u2265) ${r}.`;
            resultDiv.appendChild(h3);
            resultDiv.appendChild(p2);
        } else {
            resultDiv.className = 'math-step-box math-step-invalid';
            const h3 = document.createElement('h3');
            h3.textContent = '\u274C Tidak ada Parent terpilih';
            const p2 = document.createElement('p');
            p2.textContent = `Alasan: Tidak ada nilai kumulatif yang lebih besar atau sama dengan (\u2265) ${r}.`;
            resultDiv.appendChild(h3);
            resultDiv.appendChild(p2);
        }
        refs.m5Steps.appendChild(resultDiv);
    }
}
export function calculateMath6() {
    if (!refs.m6Steps) return;
    const inputs = document.querySelectorAll('.m6-fitness-input');
    refs.m6Steps.textContent = '';
        const fitnessValues = [];
    let totalFitness = 0;
        inputs.forEach(input => {
        if (input.value.trim() !== '') {
            const val = parseFloat(input.value) || 0;
            fitnessValues.push(val);
            totalFitness += val;
        }
    });
    if (fitnessValues.length === 0) return;
    const joinedValues = fitnessValues.join(" + ");
    const expression = "\\sum F = " + (joinedValues || "0");
    const divStep = document.createElement('div');
    divStep.className = 'math-step';
    if (typeof katex !== 'undefined') {
        katex.render(expression, divStep, { throwOnError: false, displayMode: true });
    }
    refs.m6Steps.appendChild(divStep);
    const totalDiv = document.createElement('div');
    totalDiv.className = 'math-step-box math-step-total';
    if (typeof katex !== 'undefined') {
        katex.render(`\\sum F = ${totalFitness.toFixed(3)}`, totalDiv, { throwOnError: false, displayMode: true });
    }
    refs.m6Steps.appendChild(totalDiv);
}