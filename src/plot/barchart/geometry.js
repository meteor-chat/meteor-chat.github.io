function niceNum(range, round) {
    if (range <= 0) return 1;
    const exponent = Math.floor(Math.log10(range));
    const fraction = range / Math.pow(10, exponent);
    let niceFraction;
    if (round) {
        if (fraction < 1.5) niceFraction = 1;
        else if (fraction < 3) niceFraction = 2;
        else if (fraction < 7) niceFraction = 5;
        else niceFraction = 10;
    } else {
        if (fraction <= 1) niceFraction = 1;
        else if (fraction <= 2) niceFraction = 2;
        else if (fraction <= 5) niceFraction = 5;
        else niceFraction = 10;
    }
    return niceFraction * Math.pow(10, exponent);
}

export function calculateScale({ min = 0, max = 100, beginAtZero = true, targetTickCount = 5 } = {}) {
    let effectiveMin = min;
    let effectiveMax = max;
    if (beginAtZero) {
        if (effectiveMin > 0) effectiveMin = 0;
        if (effectiveMax < 0) effectiveMax = 0;
    }
    if (effectiveMin === effectiveMax) {
        if (effectiveMin === 0) {
            effectiveMax = 10;
        } else if (effectiveMin > 0) {
            effectiveMin = 0;
        } else {
            effectiveMax = 0;
        }
    }
    const rawRange = effectiveMax - effectiveMin;
    const step = niceNum(rawRange / (targetTickCount - 1), true);
    const niceMin = Math.floor(effectiveMin / step) * step;
    const niceMax = Math.ceil(effectiveMax / step) * step;
    const ticks = [];
    const count = Math.round((niceMax - niceMin) / step);
    for (let i = 0; i <= count; i++) {
        const val = niceMin + i * step;
        ticks.push(parseFloat(val.toFixed(6)));
    }
    return {
        min: effectiveMin,
        max: effectiveMax,
        niceMin,
        niceMax,
        step,
        ticks
    };
}

export function calculateBarLayout({
    items = [],
    width = 800,
    height = 500,
    padding = null,
    orientation = "vertical",
    clusterRatio = 0.7,
    beginAtZero = true
} = {}) {
    const isVertical = orientation !== "horizontal";
    const defaultPadding = isVertical
        ? { top: 35, right: 25, bottom: 55, left: 65 }
        : { top: 30, right: 35, bottom: 45, left: 110 };
    const p = Object.assign({}, defaultPadding, padding || {});
    const plotWidth = Math.max(10, width - p.left - p.right);
    const plotHeight = Math.max(10, height - p.top - p.bottom);
    const plotArea = {
        left: p.left,
        top: p.top,
        right: width - p.right,
        bottom: height - p.bottom,
        width: plotWidth,
        height: plotHeight
    };
    let dataMin = 0;
    let dataMax = 0;
    if (items.length > 0) {
        dataMin = items[0].value;
        dataMax = items[0].value;
        for (let i = 1; i < items.length; i++) {
            if (items[i].value < dataMin) dataMin = items[i].value;
            if (items[i].value > dataMax) dataMax = items[i].value;
        }
    }
    const scale = calculateScale({
        min: dataMin,
        max: dataMax,
        beginAtZero,
        targetTickCount: isVertical ? 5 : 6
    });
    const scaleSpan = scale.niceMax - scale.niceMin || 1;
    const bars = [];
    const n = Math.max(1, items.length);
    if (isVertical) {
        const slotWidth = plotWidth / n;
        const barWidth = Math.max(3, slotWidth * Math.min(0.95, Math.max(0.1, clusterRatio)));
        const zeroY = plotArea.top + ((scale.niceMax - 0) / scaleSpan) * plotHeight;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const slotX = plotArea.left + i * slotWidth;
            const barX = slotX + (slotWidth - barWidth) / 2;
            const yVal = plotArea.top + ((scale.niceMax - item.value) / scaleSpan) * plotHeight;
            let barY = 0;
            let barH = 0;
            if (item.value >= 0) {
                barY = yVal;
                barH = Math.max(2, zeroY - yVal);
            } else {
                barY = zeroY;
                barH = Math.max(2, yVal - zeroY);
            }
            bars.push({
                index: i,
                category: item.category,
                value: item.value,
                x: barX,
                y: barY,
                width: barWidth,
                height: barH,
                slotCenter: slotX + slotWidth / 2,
                isNegative: item.value < 0
            });
        }
        return {
            orientation: "vertical",
            plotArea,
            scale,
            zeroPos: zeroY,
            bars
        };
    }
    const slotHeight = plotHeight / n;
    const barHeight = Math.max(3, slotHeight * Math.min(0.95, Math.max(0.1, clusterRatio)));
    const zeroX = plotArea.left + ((0 - scale.niceMin) / scaleSpan) * plotWidth;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const slotY = plotArea.top + i * slotHeight;
        const barY = slotY + (slotHeight - barHeight) / 2;
        const xVal = plotArea.left + ((item.value - scale.niceMin) / scaleSpan) * plotWidth;
        let barX = 0;
        let barW = 0;
        if (item.value >= 0) {
            barX = zeroX;
            barW = Math.max(2, xVal - zeroX);
        } else {
            barX = xVal;
            barW = Math.max(2, zeroX - xVal);
        }
        bars.push({
            index: i,
            category: item.category,
            value: item.value,
            x: barX,
            y: barY,
            width: barW,
            height: barHeight,
            slotCenter: slotY + slotHeight / 2,
            isNegative: item.value < 0
        });
    }
    return {
        orientation: "horizontal",
        plotArea,
        scale,
        zeroPos: zeroX,
        bars
    };
}

export function hitTestBar(mouseX, mouseY, bars) {
    if (!Array.isArray(bars)) return null;
    for (let i = 0; i < bars.length; i++) {
        const b = bars[i];
        if (
            mouseX >= b.x &&
            mouseX <= b.x + b.width &&
            mouseY >= b.y &&
            mouseY <= b.y + b.height
        ) {
            return b;
        }
    }
    return null;
}
