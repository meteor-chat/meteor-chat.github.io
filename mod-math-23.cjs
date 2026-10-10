const fs = require('fs');
let html = fs.readFileSync('math.html', 'utf-8');

html = html.replace(
    '<div class="math-calc-right"><div class="math-steps" id="math2-table-container"></div>',
    '<div class="math-calc-right"><canvas id="math2-canvas" class="math-canvas" width="400" height="400"></canvas><div class="math-steps" id="math2-table-container"></div>'
);

html = html.replace(
    '<div class="math-calc-right"><div class="math-steps" id="math3-steps-container"></div>',
    '<div class="math-calc-right"><canvas id="math3-canvas" class="math-canvas" width="400" height="400"></canvas><div class="math-steps" id="math3-steps-container"></div>'
);

fs.writeFileSync('math.html', html, 'utf-8');
console.log("Updated math.html for form 2 and 3");
