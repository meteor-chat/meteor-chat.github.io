import { animateSwap } from "./sort-animator.js?v=13";

export async function shakerSort(arr, domBars, updatePos, setTemp, sleep, setCompare, onStep) {
    let swapped = true;
    let start = 0;
    let end = arr.length - 1;
    
    while (swapped) {
        swapped = false;
        
        for (let i = start; i < end; i++) {
            if (onStep) onStep("fwd_compare");
            setTemp(i, true);
            setTemp(i + 1, true);
            await sleep(170);
            
            if (arr[i] > arr[i + 1]) {
                if (onStep) onStep("fwd_swap");
                await animateSwap(arr, domBars, i, i + 1);
                swapped = true;
                await sleep(100);
            }
            
            setTemp(i, false);
            setTemp(i + 1, false);
        }
        
        if (!swapped) break;
        
        swapped = false;
        end--;
        
        for (let i = end - 1; i >= start; i--) {
            if (onStep) onStep("bwd_compare");
            setTemp(i, true);
            setTemp(i + 1, true);
            await sleep(170);
            
            if (arr[i] > arr[i + 1]) {
                if (onStep) onStep("bwd_swap");
                await animateSwap(arr, domBars, i, i + 1);
                swapped = true;
                await sleep(100);
            }
            
            setTemp(i, false);
            setTemp(i + 1, false);
        }
        
        start++;
    }
    if (onStep) onStep("done");
}
