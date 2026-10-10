const fs = require('fs');
let css = fs.readFileSync('sort.css', 'utf-8');

const newCSS = `
.sort-visualizer-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
    margin-top: 80px;
    margin-bottom: 40px;
}
.sort-visualizer {
    position: relative;
    width: 620px;
    height: 320px;
}
.sort-bar {
    position: absolute;
    bottom: 0;
    width: 80px;
    background-color: #fff;
    transition: transform 0.4s ease, background-color 0.2s ease;
}
.sort-bar.temp {
    background-color: #4CAF50;
}
@media (max-width: 650px) {
    .sort-visualizer-wrapper { margin-top: 40px; }
    .sort-visualizer { transform: scale(0.7); transform-origin: top center; }
}
@media (max-width: 480px) {
    .sort-visualizer-wrapper { margin-top: 20px; }
    .sort-visualizer { transform: scale(0.5); transform-origin: top center; }
}
`;

if (!css.includes('.sort-visualizer-wrapper')) {
    css += newCSS;
    fs.writeFileSync('sort.css', css, 'utf-8');
    console.log("Updated sort.css");
}
