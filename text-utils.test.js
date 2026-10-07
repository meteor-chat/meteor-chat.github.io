import { describe, it, expect } from 'vitest';
import { stripThinkTags, escapeHTML, getMaxTokens } from './text-utils.js';
describe('stripThinkTags', () => {
    it('removes complete think tags', () => {
        expect(stripThinkTags('<think>some thoughts</think>Hello')).toBe('Hello');
    });
    it('removes unclosed think tags', () => {
        expect(stripThinkTags('Hello<think>thinking...')).toBe('Hello');
    });
    it('removes closing think tags without opening', () => {
        expect(stripThinkTags('thoughts</think>Hello')).toBe('Hello');
    });
    it('removes partial opening think tag at the end (streaming)', () => {
        expect(stripThinkTags('Hello <thi')).toBe('Hello');
    });
});
describe('escapeHTML', () => {
    it('escapes basic html', () => {
        expect(escapeHTML('<script>alert("x")</script>')).toBe('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
    });
});
describe('getMaxTokens', () => {
    it('returns 1536 for short requests', () => {
        expect(getMaxTokens('Halo Meteor')).toBe(1536);
    });
    it('returns 3072 for code requests', () => {
        expect(getMaxTokens('Tolong buatkan kode python')).toBe(3072);
    });
    it('matches whole words only', () => {
        expect(getMaxTokens('lanjutkan ke langkah 2')).toBe(3072);
        expect(getMaxTokens('saya ingin melanjutkan')).toBe(1536);
    });
});
