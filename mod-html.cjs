const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');

// Replace coming soon
html = html.replace('<button class="math-card disabled">rumus lain<br>coming soon</button>', 
'<button class="math-card active" data-formula="11" id="math-card-11"></button>\n        <button class="math-card disabled">rumus lain<br>coming soon</button>');

// Append form 11
const form11HTML = `
    <div id="math-calc-form-11" class="math-calc-container hidden">
        <div class="math-calc-left">
            <div id="math-calc-formula-display-11" class="math-formula-box"></div>
            <button id="btn-math-calc-back-11" class="btn-math-back calc-back-btn">Kembali</button>
        </div>
        <div class="math-calc-right">
            <div class="math-inputs">
                <div id="math11-dynamic-inputs" class="math-dynamic-inputs"></div>
            </div>
            <div class="math-steps math-steps-scroll" id="math11-steps-container"></div>
        </div>
    </div>
`;

if (!html.includes('math-calc-form-11')) {
    const parts = html.split('<script src="https://cdn.jsdelivr.net/gh/highlightjs');
    let part1 = parts[0];
    const lastDivIdx = part1.lastIndexOf('</div>');
    part1 = part1.substring(0, lastDivIdx) + form11HTML + '\n</div>\n';
    html = part1 + '<script src="https://cdn.jsdelivr.net/gh/highlightjs' + parts[1];
}

fs.writeFileSync('index.html', html, 'utf-8');
