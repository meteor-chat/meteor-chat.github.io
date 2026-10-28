export function normalizeShift(k) {
    const num = Number(k);
    if (isNaN(num)) return 0;
    return ((num % 26) + 26) % 26;
}

export function caesarShiftChar(char, shift) {
    const s = normalizeShift(shift);
    const code = char.charCodeAt(0);

    if (code >= 65 && code <= 90) {
        return String.fromCharCode(((code - 65 + s) % 26) + 65);
    }
    if (code >= 97 && code <= 122) {
        return String.fromCharCode(((code - 97 + s) % 26) + 97);
    }
    return char;
}

export function caesarEncrypt(text, shift) {
    if (!text) return "";
    const s = normalizeShift(shift);
    let result = "";
    for (let i = 0; i < text.length; i++) {
        result += caesarShiftChar(text[i], s);
    }
    return result;
}

export function caesarDecrypt(text, shift) {
    if (!text) return "";
    const s = normalizeShift(shift);
    const invShift = (26 - s) % 26;
    let result = "";
    for (let i = 0; i < text.length; i++) {
        result += caesarShiftChar(text[i], invShift);
    }
    return result;
}

export function caesarRot13(text) {
    return caesarEncrypt(text, 13);
}

export function generateBruteForce(text) {
    const results = [];
    if (!text) return results;
    for (let shift = 0; shift < 26; shift++) {
        results.push({
            shift,
            text: caesarDecrypt(text, shift)
        });
    }
    return results;
}
