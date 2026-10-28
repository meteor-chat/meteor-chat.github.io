import { animateSwap } from "./sort-animator.js?v=13";

export async function selectionSort(arr, domBars, updatePos, setTemp, sleep, setCompare, onStep) {
    let n = arr.length;
    for (let i = 0; i < n - 1; i++) {
        let min_idx = i;
        if (onStep) onStep("min");
        setTemp(i, true);
        
        for (let j = i + 1; j < n; j++) {
            if (onStep) onStep("compare");
            if (setCompare) {
                setCompare(j, true);
            } else {
                setTemp(j, true);
            }
            await sleep(160);
            
            if (arr[j] < arr[min_idx]) {
                if (min_idx !== i) {
                    setTemp(min_idx, false);
                }
                min_idx = j;
                if (onStep) onStep("new_min");
                setTemp(min_idx, true);
                if (setCompare) {
                    setCompare(j, false);
                }
            } else {
                if (setCompare) {
                    setCompare(j, false);
                } else {
                    setTemp(j, false);
                }
            }
        }
        
        if (min_idx !== i) {
            if (onStep) onStep("swap");
            setTemp(i, true);
            setTemp(min_idx, true);
            await sleep(140);
            await animateSwap(arr, domBars, min_idx, i);
            await sleep(100);
        }
        
        setTemp(min_idx, false);
        setTemp(i, false);
    }
    if (onStep) onStep("done");
}
