const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// We split by `<div id="math-calc-form-`
let parts = html.split('<div id="math-calc-form-');
for (let i = 1; i < parts.length; i++) {
    // each part is the form until the next split or end of file
    // wait, the last part contains scripts at the end!
    if (i === parts.length - 1) {
        // Find the end of the last form. 
        // We know it ends with `</div>` before `<script`
        const scriptIdx = parts[i].indexOf('<script');
        if (scriptIdx !== -1) {
            let formStr = parts[i].substring(0, scriptIdx);
            let rest = parts[i].substring(scriptIdx);
            formStr = formStr.replace(/\n\s*/g, '');
            parts[i] = formStr + '\n      ' + rest;
            continue;
        }
    }
    
    parts[i] = parts[i].replace(/\n\s*/g, '');
}

html = parts.join('\n      <div id="math-calc-form-');
fs.writeFileSync('index.html', html, 'utf-8');
console.log("Compressed forms.");
