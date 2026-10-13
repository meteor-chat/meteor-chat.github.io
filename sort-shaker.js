import { animateSwap } from "./sort-animator.js?v=10";

export async function shakerSort(arr, domBars, updatePos, setTemp, sleep) {
    let swapped = true;
    let start = 0;
    let end = arr.length - 1;
    
    while (swapped) {
        swapped = false;
        
        for (let i = start; i < end; i++) {
            setTemp(i, true);
            setTemp(i + 1, true);
            await sleep(250);
            
            if (arr[i] > arr[i + 1]) {
                await animateSwap(arr, domBars, i, i + 1);
                swapped = true;
                await sleep(150);
            }
            
            setTemp(i, false);
            setTemp(i + 1, false);
        }
        
        if (!swapped) break;
        
        swapped = false;
        end--;
        
        for (let i = end - 1; i >= start; i--) {
            setTemp(i, true);
            setTemp(i + 1, true);
            await sleep(250);
            
            if (arr[i] > arr[i + 1]) {
                await animateSwap(arr, domBars, i, i + 1);
                swapped = true;
                await sleep(150);
            }
            
            setTemp(i, false);
            setTemp(i + 1, false);
        }
        
        start++;
    }
}
