export function initFilters() {
    const filterContainer = document.getElementById('math-filter-container');
    const grid = document.querySelector('.math-grid');
    if (!filterContainer || !grid) return;
    
    const cards = Array.from(grid.querySelectorAll('.math-card'));
    
    const categories = new Set();
    cards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (cat) categories.add(cat);
    });
    
    let activeFilter = null;
    
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'math-filter-btn';
        btn.textContent = cat;
        
        btn.addEventListener('click', () => {
            if (activeFilter === cat) {
                activeFilter = null;
                btn.classList.remove('active');
            } else {
                const allBtns = filterContainer.querySelectorAll('.math-filter-btn');
                allBtns.forEach(b => b.classList.remove('active'));
                
                activeFilter = cat;
                btn.classList.add('active');
            }
            
            cards.forEach(card => {
                const cardCat = card.getAttribute('data-category');
                
                if (activeFilter === null) {
                    card.classList.remove('math-hidden');
                } else {
                    if (cardCat === activeFilter) {
                        card.classList.remove('math-hidden');
                    } else {
                        card.classList.add('math-hidden');
                    }
                }
            });
        });
        
        filterContainer.appendChild(btn);
    });
}
