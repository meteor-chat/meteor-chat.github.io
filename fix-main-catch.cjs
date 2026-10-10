const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf-8');

code = code.replace(
`        const landing = document.getElementById("landing");
        landing.textContent = "";
        const errDiv = document.createElement("div");
        errDiv.className = "error-box error-box-fallback";
        errDiv.textContent = e.message + " - Silakan muat ulang halaman.";
        landing.appendChild(errDiv);`,
`        const landing = document.getElementById("landing") || document.body;
        if (landing.id === "landing") landing.textContent = "";
        const errDiv = document.createElement("div");
        errDiv.className = "error-box error-box-fallback";
        errDiv.textContent = e.message + " - Silakan muat ulang halaman.";
        landing.appendChild(errDiv);`
);

fs.writeFileSync('main.js', code, 'utf-8');
console.log("Updated main.js catch block");
