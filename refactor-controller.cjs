const fs = require('fs');
let content = fs.readFileSync('math-controller.js', 'utf-8');

// Replace hidden reset loop
const hiddenResetPattern = /refs\.form1\.classList\.add\("hidden"\);\s*(if\(refs\.form\d+\)\s*refs\.form\d+\.classList\.add\("hidden"\);\s*)+/g;
content = content.replace(hiddenResetPattern, `for(let i=1; i<=12; i++) {
            if(refs[\`form\${i}\`]) refs[\`form\${i}\`].classList.add("hidden");
        }\n`);

// Replace event listeners loop
const eventListenersPattern = /refs\.mathCard1\.addEventListener\("click", \(\) => openForm\(1\)\);\s*(if\(refs\.mathCard\d+\)\s*refs\.mathCard\d+\.addEventListener\("click", \(\) => openForm\(\d+\)\);\s*)+/g;
content = content.replace(eventListenersPattern, `for(let i=1; i<=12; i++) {
        if(refs[\`mathCard\${i}\`]) refs[\`mathCard\${i}\`].addEventListener("click", () => openForm(i));
    }\n`);

// Replace back buttons loop
const backBtnsPattern = /refs\.btnMathCalcBack1\.addEventListener\("click", closeForm\);\s*(if\(refs\.btnMathCalcBack\d+\)\s*refs\.btnMathCalcBack\d+\.addEventListener\("click", closeForm\);\s*)+/g;
content = content.replace(backBtnsPattern, `for(let i=1; i<=12; i++) {
        const btnBack = document.getElementById(i === 1 ? "btn-math-calc-back" : \`btn-math-calc-back-\${i}\`);
        if (btnBack) btnBack.addEventListener("click", closeForm);
    }\n`);

fs.writeFileSync('math-controller.js', content, 'utf-8');
