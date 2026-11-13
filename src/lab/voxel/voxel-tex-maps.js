import { hash2 } from "./voxel-noise.js";

export const TILE = 16;
const FIELDS = 7;

const toByte = (value) => Math.max(0, Math.min(255, Math.round(value)));
const wrapIndex = (i) => (i + TILE) % TILE;

export function renderRecipe(recipe) {
    const samples = new Float32Array(TILE * TILE * FIELDS);
    for (let y = 0; y < TILE; y += 1) {
        for (let x = 0; x < TILE; x += 1) {
            const result = recipe.fn({
                x,
                y,
                u: (x + 0.5) / TILE,
                v: (y + 0.5) / TILE,
                seed: recipe.seed,
                px: hash2(x, y, recipe.seed)
            });
            samples.set(result, (y * TILE + x) * FIELDS);
        }
    }
    return samples;
}

export function writeLayer(colorBuf, mapBuf, layer, samples, bump) {
    const heightAt = (x, y) => samples[(wrapIndex(y) * TILE + wrapIndex(x)) * FIELDS + 4];
    for (let y = 0; y < TILE; y += 1) {
        for (let x = 0; x < TILE; x += 1) {
            const s = (y * TILE + x) * FIELDS;
            const out = ((layer * TILE + y) * TILE + x) * 4;
            colorBuf[out] = toByte(samples[s]);
            colorBuf[out + 1] = toByte(samples[s + 1]);
            colorBuf[out + 2] = toByte(samples[s + 2]);
            colorBuf[out + 3] = toByte(samples[s + 3]);
            const nx = (heightAt(x - 1, y) - heightAt(x + 1, y)) * 0.5 * bump;
            const ny = (heightAt(x, y - 1) - heightAt(x, y + 1)) * 0.5 * bump;
            const len = Math.hypot(nx, ny, 1);
            mapBuf[out] = toByte(((nx / len) * 0.5 + 0.5) * 255);
            mapBuf[out + 1] = toByte(((ny / len) * 0.5 + 0.5) * 255);
            mapBuf[out + 2] = toByte(samples[s + 5] * 255);
            mapBuf[out + 3] = toByte(samples[s + 6] * 255);
        }
    }
}
