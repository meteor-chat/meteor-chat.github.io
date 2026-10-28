import { animateSwap } from "./sort-animator.js?v=13";

export async function insertionSort(arr, domBars, updatePos, setTemp, sleep, setCompare, onStep) {
    let n = arr.length;
    for (let i = 1; i < n; i++) {
        let j = i;
        if (onStep) onStep("temp");
        setTemp(j, true);
        await sleep(130);
        
        while (j > 0) {
            if (onStep) onStep("compare");
            if (setCompare) {
                setCompare(j - 1, true);
            } else {
                setTemp(j - 1, true);
            }
            await sleep(160);
            
            if (arr[j - 1] > arr[j]) {
                if (onStep) onStep("shift");
                await animateSwap(arr, domBars, j, j - 1);
                await sleep(80);
                
                if (setCompare) {
                    setCompare(j, false);
                } else {
                    setTemp(j, false);
                }
                j--;
            } else {
                if (setCompare) {
                    setCompare(j - 1, false);
                } else {
                    setTemp(j - 1, false);
                }
                break;
            }
        }
        if (onStep) onStep("insert");
        setTemp(j, false);
    }
    if (onStep) onStep("done");
}
