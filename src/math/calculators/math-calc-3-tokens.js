export function makeEl(tag, className, text = "") {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
}

export function bindFitTokenHover() {
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

    bindPair("math3-in-h", "fit-token-h", "fit-glow-h");
    bindPair("math3-in-a", "fit-token-a", "fit-glow-a");
}
