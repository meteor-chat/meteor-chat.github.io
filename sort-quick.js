import { animateSwap } from "./sort-animator.js";

async function partition(arr, low, high, domBars, updatePos, setTemp, sleep) {
    let pivot = arr[high];
    setTemp(high, true);
    await sleep(250);
    
    let i = low - 1;
    
    for (let j = low; j < high; j++) {
        setTemp(j, true);
        await sleep(250);
        
        if (arr[j] < pivot) {
            i++;
            if (i !== j) {
                setTemp(i, true);
                await sleep(150);
                await animateSwap(arr, domBars, i, j);
                await sleep(100);
                setTemp(i, false);
            }
        }
        setTemp(j, false);
    }
    
    if (i + 1 !== high) {
        setTemp(i + 1, true);
        await sleep(150);
        await animateSwap(arr, domBars, i + 1, high);
        await sleep(100);
        setTemp(i + 1, false);
        setTemp(high, false);
    } else {
        setTemp(high, false);
    }
    
    return i + 1;
}

export async function quickSort(arr, domBars, updatePos, setTemp, sleep) {
    await quickSortHelper(arr, 0, arr.length - 1, domBars, updatePos, setTemp, sleep);
}

async function quickSortHelper(arr, low, high, domBars, updatePos, setTemp, sleep) {
    if (low < high) {
        let pi = await partition(arr, low, high, domBars, updatePos, setTemp, sleep);
        await quickSortHelper(arr, low, pi - 1, domBars, updatePos, setTemp, sleep);
        await quickSortHelper(arr, pi + 1, high, domBars, updatePos, setTemp, sleep);
    }
}
