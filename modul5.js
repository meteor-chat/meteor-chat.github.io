document.getElementById('btn-calculate').addEventListener('click', () => {
    const pStr = localStorage.getItem('ga_probabilities');
    if (!pStr) {
        alert("Data probabilitas tidak ditemukan. Silakan mulai dari Modul 4.");
        return;
    }
    
    const probabilities = JSON.parse(pStr);
    const rInput = document.getElementById('random-r').value;
    const r = rInput ? parseFloat(rInput) : null;
    
    const tbody = document.querySelector('#result-table tbody');
    tbody.innerHTML = '';
    
    let cumulative = 0;
    let selectedParent = null;
    let selectedParentCumulative = null;
    let finalCumulative = 0;
    
    probabilities.forEach((p, index) => {
        const prevCumulative = cumulative;
        cumulative += p;
        finalCumulative = cumulative;
        
        const tr = document.createElement('tr');
        let calculationText = '';
        if (index === 0) {
            calculationText = `${p.toFixed(4)}`;
        } else {
            calculationText = `${prevCumulative.toFixed(4)} + ${p.toFixed(4)}`;
        }
        
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${p.toFixed(4)}</td>
            <td>${calculationText}</td>
            <td><strong>${cumulative.toFixed(4)}</strong></td>
        `;
        tbody.appendChild(tr);
        
        if (r !== null && selectedParent === null && cumulative >= r) {
            selectedParent = index + 1;
            selectedParentCumulative = cumulative.toFixed(4);
        }
    });
    
    const validationBox = document.getElementById('validation-message');
    if (finalCumulative >= 0.9999 && finalCumulative <= 1.0001) {
        validationBox.innerHTML = '✅ Kumulatif valid (berakhir di 1.0000)';
        validationBox.className = 'valid-msg';
    } else {
        validationBox.innerHTML = '❌ Error: Kumulatif tidak berakhir di 1.0000. Cek kembali input Fitness di Modul 4.';
        validationBox.className = 'invalid-msg';
    }
    
    const selectionBox = document.getElementById('selection-result');
    if (r !== null) {
        if (selectedParent !== null) {
            selectionBox.innerHTML = `
                <h3>🎯 Parent Terpilih: Individu ${selectedParent}</h3>
                <p>Alasan: ${selectedParentCumulative} adalah nilai kumulatif pertama yang lebih besar atau sama dengan (&ge;) ${r}.</p>
            `;
            selectionBox.classList.remove('hidden');
        } else {
            selectionBox.innerHTML = `
                <h3>❌ Tidak ada Parent terpilih</h3>
                <p>Alasan: Tidak ada nilai kumulatif yang lebih besar atau sama dengan (&ge;) ${r}.</p>
            `;
            selectionBox.classList.remove('hidden');
        }
    } else {
        selectionBox.classList.add('hidden');
    }
    
    document.getElementById('result-section').classList.remove('hidden');
});

document.getElementById('btn-back').addEventListener('click', () => {
    window.location.href = 'modul4.html';
});
