const fs = require('fs');
let code = fs.readFileSync('input-controls.js', 'utf-8');

code = code.replace('refs.sendLanding.addEventListener("click", () => submit(refs.msgLanding));', 
                    'if (refs.sendLanding) refs.sendLanding.addEventListener("click", () => submit(refs.msgLanding));');
                    
code = code.replace('refs.sendChat.addEventListener("click", () => submit(refs.msgChat));', 
                    'if (refs.sendChat) refs.sendChat.addEventListener("click", () => submit(refs.msgChat));');

fs.writeFileSync('input-controls.js', code, 'utf-8');
console.log("Updated input-controls.js");
