function ease(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function animateSwap(arr, domBars, indexA, indexB) {
    return new Promise(resolve => {
        if (indexA === indexB) {
            resolve();
            return;
        }
        
        const barA = domBars[indexA];
        const barB = domBars[indexB];
        if (!barA || !barB) {
            resolve();
            return;
        }
        
        const startXA = indexA * 90;
        const targetXA = indexB * 90;
        const startXB = indexB * 90;
        const targetXB = indexA * 90;
        
        const distance = Math.abs(indexB - indexA);
        const arcHeight = Math.min(45 + (distance - 1) * 8, 85);
        const duration = Math.min(380 + (distance - 1) * 30, 540);
        
        barA.style.zIndex = "20";
        barB.style.zIndex = "5";
        barA.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.6)";
        
        const startTime = performance.now();
        
        function step(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = ease(progress);
            
            const currentXA = startXA + (targetXA - startXA) * eased;
            const currentXB = startXB + (targetXB - startXB) * eased;
            const arcY = -Math.sin(progress * Math.PI) * arcHeight;
            
            barA.style.transform = `translate3d(${currentXA}px, ${arcY}px, 0)`;
            barB.style.transform = `translate3d(${currentXB}px, 0, 0)`;
            
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                barA.style.transform = `translate3d(${targetXA}px, 0, 0)`;
                barB.style.transform = `translate3d(${targetXB}px, 0, 0)`;
                barA.style.zIndex = "";
                barB.style.zIndex = "";
                barA.style.boxShadow = "";
                
                const tempVal = arr[indexA];
                arr[indexA] = arr[indexB];
                arr[indexB] = tempVal;
                
                const tempDom = domBars[indexA];
                domBars[indexA] = domBars[indexB];
                domBars[indexB] = tempDom;
                
                resolve();
            }
        }
        requestAnimationFrame(step);
    });
}

export function animateShiftInsert(arr, domBars, fromIndex, toIndex) {
    return new Promise(resolve => {
        if (fromIndex === toIndex) {
            resolve();
            return;
        }
        
        const barFrom = domBars[fromIndex];
        if (!barFrom) {
            resolve();
            return;
        }
        
        const shiftedBars = [];
        for (let k = toIndex; k < fromIndex; k++) {
            if (domBars[k]) {
                shiftedBars.push({
                    bar: domBars[k],
                    startX: k * 90,
                    targetX: (k + 1) * 90
                });
            }
        }
        
        const startXFrom = fromIndex * 90;
        const targetXFrom = toIndex * 90;
        const distance = fromIndex - toIndex;
        const arcHeight = Math.min(50 + (distance - 1) * 7, 85);
        const duration = Math.min(400 + (distance - 1) * 30, 560);
        
        barFrom.style.zIndex = "25";
        barFrom.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.6)";
        
        const startTime = performance.now();
        
        function step(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = ease(progress);
            
            const currentXFrom = startXFrom + (targetXFrom - startXFrom) * eased;
            const arcY = -Math.sin(progress * Math.PI) * arcHeight;
            
            barFrom.style.transform = `translate3d(${currentXFrom}px, ${arcY}px, 0)`;
            
            for (let i = 0; i < shiftedBars.length; i++) {
                const item = shiftedBars[i];
                const currentX = item.startX + (item.targetX - item.startX) * eased;
                item.bar.style.transform = `translate3d(${currentX}px, 0, 0)`;
            }
            
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                barFrom.style.transform = `translate3d(${targetXFrom}px, 0, 0)`;
                barFrom.style.zIndex = "";
                barFrom.style.boxShadow = "";
                
                for (let i = 0; i < shiftedBars.length; i++) {
                    const item = shiftedBars[i];
                    item.bar.style.transform = `translate3d(${item.targetX}px, 0, 0)`;
                }
                
                const tempVal = arr[fromIndex];
                const tempDom = domBars[fromIndex];
                for (let k = fromIndex; k > toIndex; k--) {
                    arr[k] = arr[k - 1];
                    domBars[k] = domBars[k - 1];
                }
                arr[toIndex] = tempVal;
                domBars[toIndex] = tempDom;
                
                resolve();
            }
        }
        requestAnimationFrame(step);
    });
}
