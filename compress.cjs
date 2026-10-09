const fs = require('fs');
let content = fs.readFileSync('math-controller.js', 'utf-8');

// Condense the katex render lines
content = content.replace(/if \(typeof katex !== ['"]undefined['"]( && refs\.mathFormulaDisplay\w*)?\) \{\s*katex\.render\(FORMULA\w*, refs\.mathFormulaDisplay\w*, \{ throwOnError: false, displayMode: false \}\);\s*\}/g, (match) => {
    return match.replace(/\{\s*/, '').replace(/\s*\}/, '').replace(/\n\s*/g, ' ');
});

fs.writeFileSync('math-controller.js', content, 'utf-8');
