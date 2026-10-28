import { describe, it, expect } from 'vitest';
import { stripThinkTags, escapeHTML, getMaxTokens, getQueryType } from '../src/core/text-utils.js';
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
describe('getMaxTokens & getQueryType', () => {
    it('classifies micro queries and returns 384 tokens', () => {
        expect(getQueryType('Halo Meteor')).toBe('micro');
        expect(getMaxTokens('Halo Meteor')).toBe(384);
        expect(getMaxTokens('Apa ibukota Australia?')).toBe(384);
    });
    it('classifies standard queries and returns 1024 tokens', () => {
        expect(getQueryType('Jelaskan perbedaan fotosintesis dan kemosintesis')).toBe('standard');
        expect(getMaxTokens('Jelaskan perbedaan fotosintesis dan kemosintesis')).toBe(1024);
    });
    it('classifies heavy code requests and returns 2560 tokens', () => {
        expect(getQueryType('Tolong buatkan kode python')).toBe('heavy');
        expect(getMaxTokens('Tolong buatkan kode python')).toBe(2560);
    });
    it('matches whole words only', () => {
        expect(getMaxTokens('buatkan program')).toBe(2560);
        expect(getMaxTokens('apakah ini bekerja?')).toBe(384);
    });
});