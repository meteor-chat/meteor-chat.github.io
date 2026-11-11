import { isStopword } from "./stopwords.js";

export function parseFrequencyList(text) {
    const lines = text.split("\n");
    const counts = new Map();
    let isPairFormat = false;

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;
        const match = line.match(/^([A-Za-z0-9_\u00C0-\u024F\u1E00-\u1EFF\-]+)\s*[:=,\t]\s*(\d+(?:\.\d+)?)$/);
        if (match) {
            isPairFormat = true;
            const word = match[1].toLowerCase();
            const val = parseFloat(match[2]);
            if (val > 0) {
                counts.set(word, (counts.get(word) || 0) + val);
            }
        }
    }

    if (isPairFormat && counts.size > 0) {
        return counts;
    }
    return null;
}

export function extractTokens(rawText) {
    if (!rawText) return [];
    const sanitized = rawText
        .replace(/https?:\/\/\S+/gi, " ")
        .replace(/[\w.-]+@[\w.-]+\.\w+/gi, " ")
        .replace(/[\r\n\t]+/g, " ");
    const matches = sanitized.match(/[A-Za-z0-9_\u00C0-\u024F\u1E00-\u1EFF]+/g);
    return matches ? matches.map((t) => t.toLowerCase()) : [];
}

export function computeFrequencies(text, options = {}) {
    const {
        stopwordMode = "all",
        customStopwords = null,
        minWordLength = 2,
        maxWords = 80,
        caseTransform = "lower"
    } = options;

    const directList = parseFrequencyList(text);
    const countMap = new Map();
    let totalProcessedTokens = 0;

    if (directList) {
        for (const [word, count] of directList.entries()) {
            if (word.length < minWordLength) continue;
            if (isStopword(word, stopwordMode, customStopwords)) continue;
            countMap.set(word, count);
            totalProcessedTokens += count;
        }
    } else {
        const rawTokens = extractTokens(text);
        totalProcessedTokens = rawTokens.length;

        for (const token of rawTokens) {
            if (token.length < minWordLength) continue;
            if (/^\d+$/.test(token)) continue;
            if (isStopword(token, stopwordMode, customStopwords)) continue;
            countMap.set(token, (countMap.get(token) || 0) + 1);
        }
    }

    const sorted = Array.from(countMap.entries())
        .map(([textKey, count]) => {
            let label = textKey;
            if (caseTransform === "title") {
                label = textKey.charAt(0).toUpperCase() + textKey.slice(1);
            } else if (caseTransform === "upper") {
                label = textKey.toUpperCase();
            }
            return {
                text: label,
                rawWord: textKey,
                count: count
            };
        })
        .sort((a, b) => b.count - a.count);

    const limited = sorted.slice(0, Math.max(1, maxWords));
    const tokenSum = limited.reduce((acc, item) => acc + item.count, 0);

    const results = limited.map((item, index) => ({
        ...item,
        rank: index + 1,
        weight: tokenSum > 0 ? item.count / tokenSum : 0
    }));

    return {
        words: results,
        totalRawTokens: totalProcessedTokens,
        uniqueTokens: countMap.size,
        displayedCount: results.length,
        typeTokenRatio: totalProcessedTokens > 0 ? (countMap.size / totalProcessedTokens) : 0
    };
}

export function scaleFontSize(count, minCount, maxCount, minFont, maxFont, mode = "sqrt") {
    if (maxCount <= minCount) {
        return Math.round((minFont + maxFont) / 2);
    }

    let norm = 0;
    if (mode === "linear") {
        norm = (count - minCount) / (maxCount - minCount);
    } else if (mode === "log") {
        const logMin = Math.log(minCount + 1);
        const logMax = Math.log(maxCount + 1);
        norm = (Math.log(count + 1) - logMin) / (logMax - logMin);
    } else {
        const sqrtMin = Math.sqrt(minCount);
        const sqrtMax = Math.sqrt(maxCount);
        norm = (Math.sqrt(count) - sqrtMin) / (sqrtMax - sqrtMin);
    }

    norm = Math.max(0, Math.min(1, norm));
    return Math.round(minFont + norm * (maxFont - minFont));
}
