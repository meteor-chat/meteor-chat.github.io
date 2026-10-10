const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');
html = html.replace(/\n\s*\n/g, '\n');
fs.writeFileSync('index.html', html, 'utf-8');
