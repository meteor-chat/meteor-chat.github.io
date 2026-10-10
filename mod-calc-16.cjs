const fs = require('fs');
let code = fs.readFileSync('math-calc-16.js', 'utf-8');

code = code.replace(
    'import { refs } from "./dom-refs.js";',
    'import { refs } from "./dom-refs.js";\nimport { drawIntegral, clearIntegral } from "./math-visual-integral.js";'
);

code = code.replace(
    "refs.m16Steps.innerHTML = '';",
    "refs.m16Steps.innerHTML = '';\n    clearIntegral('math16-canvas');"
);

code = code.replace(
    "refs.m16Steps.innerHTML = html;\n}",
    "refs.m16Steps.innerHTML = html;\n    drawIntegral('math16-canvas', strF, a, undefined, 'formula16');\n}"
);

fs.writeFileSync('math-calc-16.js', code, 'utf-8');
console.log("Updated math-calc-16.js");
