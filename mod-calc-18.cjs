const fs = require('fs');
let code = fs.readFileSync('math-calc-18.js', 'utf-8');

code = code.replace(
    'import { refs } from "./dom-refs.js";',
    'import { refs } from "./dom-refs.js";\nimport { drawIntegral, clearIntegral } from "./math-visual-integral.js";'
);

code = code.replace(
    "refs.m18Steps.innerHTML = '';",
    "refs.m18Steps.innerHTML = '';\n    clearIntegral('math18-canvas');"
);

code = code.replace(
    "refs.m18Steps.innerHTML = html;\n}",
    "refs.m18Steps.innerHTML = html;\n    drawIntegral('math18-canvas', strF, a, b, 'mean');\n}"
);

fs.writeFileSync('math-calc-18.js', code, 'utf-8');
console.log("Updated math-calc-18.js");
