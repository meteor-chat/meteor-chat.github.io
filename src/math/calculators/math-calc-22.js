import { getPrimes } from "../geometry/prime-generator.js";
import { refs } from "../../core/dom-refs.js";

export function calculateMath22() {
    if (!refs.m22InN || !refs.m22Steps) return;
    
    let val = parseInt(refs.m22InN.value, 10);
    if (isNaN(val) || val < 1) {
        if (refs.m22InN.value !== "" && val < 1) {
            val = 1;
            refs.m22InN.value = "1";
        }
    }
    if (isNaN(val) || val < 1) {
        refs.m22Steps.textContent = "";
        return;
    }
    
    if (val > 100000) {
        val = 100000;
        refs.m22InN.value = "100000";
    }
    
    const primes = getPrimes(val);
    const resultText = primes.join(", ");
    
    refs.m22Steps.textContent = "";
    
    const summary = document.createElement("div");
    summary.className = "math-step-total";
    summary.textContent = `n = ${val} \u2022 Prima ke-${val} = ${primes[primes.length - 1]}`;
    refs.m22Steps.appendChild(summary);
    
    const resultBox = document.createElement("div");
    resultBox.className = "math-step-valid math-prime-result";
    resultBox.textContent = resultText;
    refs.m22Steps.appendChild(resultBox);
}
