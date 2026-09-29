import { state } from "./app-state.js";
export async function fetchConfig() {
    try {
        const res = await fetch("/api/config");
        if (res.ok) {
            const data = await res.json();
            state.config = data;
        }
    } catch (e) {
        console.warn("Failed config", e);
    }
}
