document.getElementById('btn-generate').addEventListener('click', () => {
    const n = parseInt(document.getElementById('population').value);
    const container = document.getElementById('fitness-rows');
    container.innerHTML = '';
    
    for (let i = 1; i <= n; i++) {
        const div = document.createElement('div');
        div.className = 'input-row';
        div.innerHTML = `
            <label>Individu ${i}:</label>
            <input type="number" step="any" class="fitness-input" id="fitness-${i}">
        `;
        container.appendChild(div);
    }
    
    document.getElementById('fitness-inputs').classList.remove('hidden');
    document.getElementById('result-section').classList.add('hidden');
});

document.getElementById('btn-calculate').addEventListener('click', () => {
    const inputs = document.querySelectorAll('.fitness-input');
    const fitnessValues = [];
    let totalFitness = 0;
    
    inputs.forEach(input => {
        const val = parseFloat(input.value) || 0;
        fitnessValues.push(val);
        totalFitness += val;
    });
    
    document.getElementById('total-fitness-display').innerHTML = `Total Fitness (&Sigma;F) = ${totalFitness}`;
    
    const tbody = document.querySelector('#result-table tbody');
    tbody.innerHTML = '';
    
    const probabilities = [];
    
    fitnessValues.forEach((f, index) => {
        const p = f / totalFitness;
        probabilities.push(p);
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${f}</td>
            <td>${f} / ${totalFitness}</td>
            <td><strong>${p.toFixed(4)}</strong></td>
        `;
        tbody.appendChild(tr);
    });
    
    localStorage.setItem('ga_probabilities', JSON.stringify(probabilities));
    document.getElementById('result-section').classList.remove('hidden');
});

document.getElementById('btn-next').addEventListener('click', () => {
    window.location.href = 'modul5.html';
});
