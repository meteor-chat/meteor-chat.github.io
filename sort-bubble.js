import { animateSwap } from "./sort-animator.js?v=11";

export async function bubbleSort(arr, domBars, updatePos, setTemp, sleep) {
    let n = arr.length;
    let swapped;
    
    do {
        swapped = false;
        for (let i = 0; i < n - 1; i++) {
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
        n--;
    } while (swapped);
}
