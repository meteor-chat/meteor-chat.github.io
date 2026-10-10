const fs = require('fs');
let html = fs.readFileSync('math.html', 'utf-8');

function injectCanvas(html, formId, canvasId) {
    const search = `<div id="${formId}"`;
    const rightViewStart = '<div class="math-calc-right">';
    const stepsDiv = `<div class="math-steps" id="${canvasId.replace('-canvas', '-steps-container')}"></div>`;
    
    // We want to replace `<div class="math-calc-right"><div class="math-steps" id="math16-steps-container"></div>`
    // with `<div class="math-calc-right"><canvas id="math16-canvas" class="math-canvas" width="400" height="400"></canvas><div class="math-steps" id="math16-steps-container"></div>`
    
    let target = `<div class="math-calc-right"><div class="math-steps" id="${canvasId.replace('-canvas', '-steps-container')}"></div></div>`;
    let replacement = `<div class="math-calc-right"><canvas id="${canvasId}" class="math-canvas" width="400" height="400"></canvas><div class="math-steps" id="${canvasId.replace('-canvas', '-steps-container')}"></div></div>`;
    
    return html.replace(target, replacement);
}

html = injectCanvas(html, "math-calc-form-16", "math16-canvas");
html = injectCanvas(html, "math-calc-form-17", "math17-canvas");
html = injectCanvas(html, "math-calc-form-18", "math18-canvas");

fs.writeFileSync('math.html', html, 'utf-8');
console.log("Updated math.html for form 16, 17, 18");
