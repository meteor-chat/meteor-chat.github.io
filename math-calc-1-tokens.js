export function makeEl(tag, className, textContent) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (textContent !== undefined) el.textContent = textContent;
    return el;
}

export function createBraceSvg(width) {
    const w = Math.max(width, 60);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "chromo-brace-svg");
    svg.setAttribute("viewBox", `0 0 ${w} 18`);
    svg.style.width = `${w}px`;
    svg.style.height = "18px";
    const mid = w / 2;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const d = `M 0 0 Q 0 8 10 8 L ${mid - 12} 8 Q ${mid} 8 ${mid} 16 Q ${mid} 8 ${mid + 12} 8 L ${w - 10} 8 Q ${w} 8 ${w} 0`;
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#ffffff");
    path.setAttribute("stroke-width", "1.6");
    svg.appendChild(path);
    return svg;
}

function bindGlow(sources, targets, glowClass) {
    sources.forEach((s) => {
        if (!s) return;
        s.addEventListener("mouseenter", () => {
            targets().forEach((t) => t.classList.add(glowClass));
        });
        s.addEventListener("mouseleave", () => {
            targets().forEach((t) => t.classList.remove(glowClass));
        });
    });
}

export function bindTokenHover() {
    const inXmin = document.getElementById("math-in-xmin");
    const lblXmin = document.getElementById("chromo-label-xmin");
    const inXmax = document.getElementById("math-in-xmax");
    const lblXmax = document.getElementById("chromo-label-xmax");

    bindGlow(
        [inXmin, lblXmin],
        () => document.querySelectorAll(".chromo-token-xmin"),
        "chromo-glow-xmin"
    );
    bindGlow(
        [inXmax, lblXmax],
        () => document.querySelectorAll(".chromo-token-xmax"),
        "chromo-glow-xmax"
    );
    bindGlow(
        document.querySelectorAll(".chromo-token-xmin"),
        () => document.querySelectorAll(".chromo-token-xmin"),
        "chromo-glow-xmin"
    );
    bindGlow(
        document.querySelectorAll(".chromo-token-xmax"),
        () => document.querySelectorAll(".chromo-token-xmax"),
        "chromo-glow-xmax"
    );
    bindGlow(
        document.querySelectorAll(".chromo-token-n"),
        () => document.querySelectorAll(".chromo-token-n"),
        "chromo-glow-n"
    );
    bindGlow(
        document.querySelectorAll(".chromo-token-d"),
        () => document.querySelectorAll(".chromo-token-d"),
        "chromo-glow-d"
    );
}
