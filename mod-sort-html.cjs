const fs = require('fs');
let html = fs.readFileSync('sort.html', 'utf-8');

const injection = `    </div>\n    <div id="sort-visualizer" class="sort-visualizer"></div>\n</div>\n<script type="module" src="sort-controller.js?v=1"></script>\n</body>`;
html = html.replace('    </div>\n</div>\n</body>', injection);

fs.writeFileSync('sort.html', html, 'utf-8');
console.log("Updated sort.html");
