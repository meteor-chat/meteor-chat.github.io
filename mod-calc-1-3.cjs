const fs = require('fs');
let code = fs.readFileSync('math-calc-1-3.js', 'utf-8');

code = code.replace(
    'import { refs } from "./dom-refs.js";',
    'import { refs } from "./dom-refs.js";\nimport { drawObjectiveCurve, drawFitnessCurve, clearVisual2, clearVisual3 } from "./math-visual-2-3.js";'
);

code = code.replace(
    'refs.m2Table.textContent = "";',
    'refs.m2Table.textContent = "";\n    clearVisual2();'
);

code = code.replace(
    "addStep(step3, 'math-step-box');\n}",
    "addStep(step3, 'math-step-box');\n    drawObjectiveCurve(x1, x2);\n}"
);

code = code.replace(
    'refs.m3Steps.textContent = "";',
    'refs.m3Steps.textContent = "";\n    clearVisual3();'
);

code = code.replace(
    "addStep(step3, 'math-step-box');\n}",
    "addStep(step3, 'math-step-box');\n    drawFitnessCurve(h, a);\n}"
);

fs.writeFileSync('math-calc-1-3.js', code, 'utf-8');
console.log("Updated math-calc-1-3.js");
