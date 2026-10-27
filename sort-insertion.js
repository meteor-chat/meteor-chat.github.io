import { animateSwap } from "./sort-animator.js?v=13";

export async function insertionSort(arr, domBars, updatePos, setTemp, sleep, setCompare) {
    let n = arr.length;
    for (let i = 1; i < n; i++) {
        let j = i;
        setTemp(j, true);
        await sleep(130);
        
        while (j > 0) {
            if (setCompare) {
                setCompare(j - 1, true);
            } else {
                setTemp(j - 1, true);
            }
            await sleep(160);
            
            if (arr[j - 1] > arr[j]) {
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
        setTemp(j, false);
    }
}
