import { animateSwap } from "./sort-animator.js?v=13";

async function partition(arr, low, high, domBars, updatePos, setTemp, sleep, onStep) {
    let pivot = arr[high];
    if (onStep) onStep("pivot");
    setTemp(high, true);
    await sleep(160);
    
    let i = low - 1;
    
    for (let j = low; j < high; j++) {
        if (onStep) onStep("compare");
        setTemp(j, true);
        await sleep(160);
        
        if (arr[j] < pivot) {
            i++;
            if (i !== j) {
                if (onStep) onStep("swap_small");
                setTemp(i, true);
                await sleep(100);
                await animateSwap(arr, domBars, i, j);
                await sleep(80);
                setTemp(i, false);
            }
        }
        setTemp(j, false);
    }
    
    if (i + 1 !== high) {
        if (onStep) onStep("swap_pivot");
        setTemp(i + 1, true);
        await sleep(100);
        await animateSwap(arr, domBars, i + 1, high);
        await sleep(80);
        setTemp(i + 1, false);
        setTemp(high, false);
    } else {
        setTemp(high, false);
    }
    
    return i + 1;
}

export async function quickSort(arr, domBars, updatePos, setTemp, sleep, setCompare, onStep) {
    await quickSortHelper(arr, 0, arr.length - 1, domBars, updatePos, setTemp, sleep, onStep);
    if (onStep) onStep("done");
}

async function quickSortHelper(arr, low, high, domBars, updatePos, setTemp, sleep, onStep) {
    if (low < high) {
        let pi = await partition(arr, low, high, domBars, updatePos, setTemp, sleep, onStep);
        await quickSortHelper(arr, low, pi - 1, domBars, updatePos, setTemp, sleep, onStep);
        await quickSortHelper(arr, pi + 1, high, domBars, updatePos, setTemp, sleep, onStep);
    }
}
