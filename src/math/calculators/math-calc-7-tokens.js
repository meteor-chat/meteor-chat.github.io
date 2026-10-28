function bindPair(selector, elementsToHighlight, glowClass) {
    const triggers = document.querySelectorAll(selector);
    triggers.forEach(trig => {
        trig.addEventListener("mouseenter", () => {
            elementsToHighlight.forEach(el => {
                if (typeof el === "string") {
                    document.querySelectorAll(el).forEach(item => item.classList.add(glowClass));
                } else if (el) {
                    el.classList.add(glowClass);
                }
            });
        });
        trig.addEventListener("mouseleave", () => {
            elementsToHighlight.forEach(el => {
                if (typeof el === "string") {
                    document.querySelectorAll(el).forEach(item => item.classList.remove(glowClass));
                } else if (el) {
                    el.classList.remove(glowClass);
                }
            });
        });
    });
}

export function bindCrossoverTokens() {
    const inP1 = document.getElementById("math7-in-p1");
    const inP2 = document.getElementById("math7-in-p2");
    const inK = document.getElementById("math7-in-k");

    bindPair(".cross-tok-p1", [inP1, ".cross-row-p1", ".cross-origin-p1"], "cross-glow-p1");
    bindPair(".cross-tok-p2", [inP2, ".cross-row-p2", ".cross-origin-p2"], "cross-glow-p2");
    bindPair(".cross-tok-c1", [".cross-row-c1"], "cross-glow-c1");
    bindPair(".cross-tok-c2", [".cross-row-c2"], "cross-glow-c2");

    if (inP1) {
        bindPair("#math7-in-p1", [".cross-tok-p1", ".cross-row-p1"], "cross-glow-p1");
    }
    if (inP2) {
        bindPair("#math7-in-p2", [".cross-tok-p2", ".cross-row-p2"], "cross-glow-p2");
    }
    if (inK) {
        bindPair("#math7-in-k", [".cross-cut-after", ".cross-cut-badge"], "cross-glow-cut");
    }
}
