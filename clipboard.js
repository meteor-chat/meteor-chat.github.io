export async function writeText(text) {
    try {
        await navigator.clipboard.writeText(text);
    } catch (e) {
        console.warn("Copy failed");
    }
}