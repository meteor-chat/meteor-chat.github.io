import { CONFIG_API_KEYS } from "./config.js";

let activeIndex = 0;

export function getNextKey() {
    if (CONFIG_API_KEYS.length === 0) return null;
    const entry = CONFIG_API_KEYS[activeIndex];
    activeIndex = (activeIndex + 1) % CONFIG_API_KEYS.length;
    return entry;
}

export function getAllKeys() {
    return CONFIG_API_KEYS;
}

export function getOrderedKeys() {
    const keys = CONFIG_API_KEYS;
    if (keys.length === 0) return [];
    const ordered = [];
    for (let i = 0; i < keys.length; i++) {
        ordered.push(keys[(activeIndex + i) % keys.length]);
    }
    activeIndex = (activeIndex + 1) % keys.length;
    return ordered;
}
