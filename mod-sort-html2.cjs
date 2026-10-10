const fs = require('fs');
let html = fs.readFileSync('sort.html', 'utf-8');

html = html.replace(
    '<div id="sort-visualizer" class="sort-visualizer"></div>',
    '<div class="sort-visualizer-wrapper"><div id="sort-visualizer" class="sort-visualizer"></div></div>'
);

fs.writeFileSync('sort.html', html, 'utf-8');
console.log("Updated sort.html wrapper");
