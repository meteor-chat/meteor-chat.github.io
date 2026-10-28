export function makeEl(tag, className, text = "") {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
}

export function bindObjTokenHover() {
    const bindPair = (inputId, tokenClass, glowClass) => {
        const input = document.getElementById(inputId);
        if (!input) return;

        const setGlow = (active) => {
            document.querySelectorAll(`.${tokenClass}`).forEach((el) => {
                el.classList.toggle(glowClass, active);
            });
        };

        input.addEventListener("focus", () => setGlow(true));
        input.addEventListener("blur", () => setGlow(false));
        input.addEventListener("mouseenter", () => setGlow(true));
        input.addEventListener("mouseleave", () => {
            if (document.activeElement !== input) setGlow(false);
        });
    };

    bindPair("math2-in-x1", "obj-token-x1", "obj-glow-x1");
    bindPair("math2-in-x2", "obj-token-x2", "obj-glow-x2");
}
