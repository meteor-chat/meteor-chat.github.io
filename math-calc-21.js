import { PI_DIGITS } from "./pi-digits.js";
import { refs } from "./dom-refs.js";

export function calculateMath21() {
    if (!refs.m21InD || !refs.m21Steps) return;
    
    let val = parseInt(refs.m21InD.value, 10);
    if (isNaN(val) || val < 2) {
        if (refs.m21InD.value !== "" && val < 2) {
            val = 2;
            refs.m21InD.value = "2";
        }
    }
    if (isNaN(val) || val < 2) {
        refs.m21Steps.innerHTML = "";
        return;
    }
    
    let charsNeeded = val + 1;
    if (charsNeeded > PI_DIGITS.length) charsNeeded = PI_DIGITS.length;
    
    let sub = PI_DIGITS.substring(0, charsNeeded);
    let result = sub.charAt(0) + "." + sub.substring(1);
    
    refs.m21Steps.innerHTML = `
        <div class="math-step-valid" style="word-break: break-all; font-size: 24px; max-width: 100%; text-align: left;">
            ${result}
        </div>
    `;
}
