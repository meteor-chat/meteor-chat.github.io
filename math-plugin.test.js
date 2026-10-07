import { describe, it, expect } from 'vitest';
import { normalizeMath } from './math-plugin.js';
describe('normalizeMath', () => {
    it('converts display math \\[ \\] to $$', () => {
        expect(normalizeMath('\\[ x^2 \\]')).toBe('\n\n$$\nx^2\n$$\n\n');
    });
    it('converts inline math \\( \\) to $ $', () => {
        expect(normalizeMath('\\( x^2 \\)')).toBe('$x^2$');
    });
    it('leaves text outside of math intact', () => {
        expect(normalizeMath('Here is \\( x \\) and \\[ y \\].')).toBe('Here is $x$ and \n\n$$\ny\n$$\n\n.');
    });
    it('does not touch math delimiters inside inline code', () => {
        expect(normalizeMath('Use `\\(foo\\)` for math.')).toBe('Use `\\(foo\\)` for math.');
    });
    it('does not touch math delimiters inside block code', () => {
        const input = '```js\nconst x = "\\(foo\\)";\n```';
        expect(normalizeMath(input)).toBe(input);
    });
    it('does not touch math delimiters inside an unclosed block code (streaming)', () => {
        const input = '```js\nconst x = "\\(foo\\)";\n';
        expect(normalizeMath(input)).toBe(input);
    });
});
