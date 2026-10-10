const fs = require('fs');
let code = fs.readFileSync('math-calc-17.js', 'utf-8');

code = code.replace(
    'import { refs } from "./dom-refs.js";',
    'import { refs } from "./dom-refs.js";\nimport { drawIntegral, clearIntegral } from "./math-visual-integral.js";'
);

code = code.replace(
    "refs.m17Steps.innerHTML = '';",
    "refs.m17Steps.innerHTML = '';\n    clearIntegral('math17-canvas');"
);

code = code.replace(
    "refs.m17Steps.innerHTML = html;\n}",
    "refs.m17Steps.innerHTML = html;\n    drawIntegral('math17-canvas', strF, a, b, 'area');\n}"
);

fs.writeFileSync('math-calc-17.js', code, 'utf-8');
console.log("Updated math-calc-17.js");
