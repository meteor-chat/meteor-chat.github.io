import { animateShiftInsert } from "./sort-animator.js?v=13";

export async function mergeSort(arr, domBars, updatePos, setTemp, sleep, setCompare, onStep) {
    await mergeSortHelper(arr, 0, arr.length - 1, domBars, updatePos, setTemp, sleep, onStep);
    if (onStep) onStep("done");
}

async function mergeSortHelper(arr, left, right, domBars, updatePos, setTemp, sleep, onStep) {
    if (left < right) {
        let mid = Math.floor((left + right) / 2);
        if (onStep) onStep("split");
        
        await mergeSortHelper(arr, left, mid, domBars, updatePos, setTemp, sleep, onStep);
        await mergeSortHelper(arr, mid + 1, right, domBars, updatePos, setTemp, sleep, onStep);
        
        await merge(arr, left, mid, right, domBars, updatePos, setTemp, sleep, onStep);
    }
}

async function merge(arr, left, mid, right, domBars, updatePos, setTemp, sleep, onStep) {
    let i = left;
    let j = mid + 1;
    
    while (i <= mid && j <= right) {
        if (onStep) onStep("compare");
        setTemp(i, true);
        setTemp(j, true);
        await sleep(170);
        
        if (arr[i] <= arr[j]) {
            setTemp(i, false);
            setTemp(j, false);
            i++;
        } else {
            if (onStep) onStep("insert");
            await animateShiftInsert(arr, domBars, j, i);
            await sleep(80);
            
            setTemp(i, false);
            setTemp(i + 1, false);
            
            i++;
            mid++;
            j++;
        }
    }
}
