import { scaleFontSize } from "./tokenizer.js";

function getMeasureContext() {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    return canvas.getContext("2d");
}

let cachedCtx = null;

export function measureWord(text, fontSize, fontFamily) {
    if (!cachedCtx) {
        cachedCtx = getMeasureContext();
    }
    const fontStr = `600 ${fontSize}px ${fontFamily}`;
    let width = fontSize * text.length * 0.6;
    let height = fontSize;

    if (cachedCtx) {
        cachedCtx.font = fontStr;
        const metrics = cachedCtx.measureText(text);
        width = metrics.width;
        height = fontSize * 1.08;
    }

    return {
        width: Math.ceil(width),
        height: Math.ceil(height)
    };
}

export function computeRotatedBox(cx, cy, w, h, angleDeg, padding = 3) {
    const rad = (angleDeg * Math.PI) / 180;
    const cos = Math.abs(Math.round(Math.cos(rad) * 1e6) / 1e6);
    const sin = Math.abs(Math.round(Math.sin(rad) * 1e6) / 1e6);

    const effW = w + padding * 2;
    const effH = h + padding * 2;

    const rotW = Math.ceil(effW * cos + effH * sin);
    const rotH = Math.ceil(effW * sin + effH * cos);

    return {
        x: cx - rotW / 2,
        y: cy - rotH / 2,
        w: rotW,
        h: rotH,
        cx: cx,
        cy: cy,
        width: w,
        height: h,
        angle: angleDeg,
        rad: rad
    };
}

export function checkOverlap(boxA, boxB) {
    return !(
        boxA.x + boxA.w <= boxB.x ||
        boxB.x + boxB.w <= boxA.x ||
        boxA.y + boxA.h <= boxB.y ||
        boxB.y + boxB.h <= boxA.y
    );
}

export function pickAngle(mode = "mixed", index = 0) {
    if (mode === "horizontal") return 0;
    if (mode === "vertical") return 90;
    if (mode === "mixed") {
        return (index % 3 === 2) ? 90 : 0;
    }
    if (mode === "skewed") {
        const angles = [-45, 0, 0, 45, 90];
        return angles[index % angles.length];
    }
    return 0;
}

export function calculateLayout(wordList, options = {}) {
    const {
        width = 800,
        height = 500,
        minFontSize = 14,
        maxFontSize = 64,
        fontFamily = "'Google Sans', sans-serif",
        angleMode = "mixed",
        scaleMode = "sqrt",
        padding = 3,
        aspectRatio = 0.85
    } = options;

    if (!wordList || wordList.length === 0) {
        return {
            placed: [],
            unplaced: [],
            compactness: 0,
            bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 }
        };
    }

    const minCount = wordList[wordList.length - 1].count;
    const maxCount = wordList[0].count;

    const centerX = width / 2;
    const centerY = height / 2;

    const placedBoxes = [];
    const unplacedWords = [];
    let sumWordArea = 0;

    for (let i = 0; i < wordList.length; i++) {
        const item = wordList[i];
        let fontSize = scaleFontSize(item.count, minCount, maxCount, minFontSize, maxFontSize, scaleMode);
        const angle = pickAngle(angleMode, i);
        let measured = measureWord(item.text, fontSize, fontFamily);

        let placed = false;
        let attempts = 0;
        const maxSteps = 1600;
        let step = 0;
        let radius = 0;
        let theta = (i * 1.6180339887) % (Math.PI * 2);

        while (!placed && attempts < 2) {
            step = 0;
            radius = 0;
            while (step < maxSteps) {
                const spiralR = 1.0 + step * 0.28;
                const spiralTheta = theta + step * 0.15;
                const candidateX = centerX + spiralR * Math.cos(spiralTheta);
                const candidateY = centerY + spiralR * Math.sin(spiralTheta) * aspectRatio;

                const candidateBox = computeRotatedBox(candidateX, candidateY, measured.width, measured.height, angle, padding);

                if (
                    candidateBox.x >= 4 &&
                    candidateBox.x + candidateBox.w <= width - 4 &&
                    candidateBox.y >= 4 &&
                    candidateBox.y + candidateBox.h <= height - 4
                ) {
                    let hasOverlap = false;
                    for (let j = 0; j < placedBoxes.length; j++) {
                        if (checkOverlap(candidateBox, placedBoxes[j].box)) {
                            hasOverlap = true;
                            break;
                        }
                    }

                    if (!hasOverlap) {
                        const finalWordObject = {
                            ...item,
                            fontSize: fontSize,
                            fontFamily: fontFamily,
                            angle: angle,
                            x: candidateBox.cx,
                            y: candidateBox.cy,
                            width: measured.width,
                            height: measured.height,
                            box: candidateBox
                        };
                        placedBoxes.push(finalWordObject);
                        sumWordArea += (measured.width + padding) * (measured.height + padding);
                        placed = true;
                        break;
                    }
                }
                step++;
            }

            if (!placed) {
                fontSize = Math.max(10, Math.floor(fontSize * 0.8));
                measured = measureWord(item.text, fontSize, fontFamily);
                attempts++;
            }
        }

        if (!placed) {
            unplacedWords.push(item);
        }
    }

    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;

    placedBoxes.forEach((w) => {
        if (w.box.x < minX) minX = w.box.x;
        if (w.box.x + w.box.w > maxX) maxX = w.box.x + w.box.w;
        if (w.box.y < minY) minY = w.box.y;
        if (w.box.y + w.box.h > maxY) maxY = w.box.y + w.box.h;
    });

    const cloudW = Math.max(1, maxX - minX);
    const cloudH = Math.max(1, maxY - minY);
    const totalBoundingArea = cloudW * cloudH;
    const compactness = totalBoundingArea > 0 ? Math.min(1, sumWordArea / totalBoundingArea) : 0;

    return {
        placed: placedBoxes,
        unplaced: unplacedWords,
        compactness: compactness,
        bounds: { minX, maxX, minY, maxY, width: cloudW, height: cloudH }
    };
}
