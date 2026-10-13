import { animateSwap } from "./sort-animator.js?v=11";

export async function insertionSort(arr, domBars, updatePos, setTemp, sleep) {
    let n = arr.length;
    for (let i = 1; i < n; i++) {
        let j = i;
        setTemp(j, true);
        await sleep(200);
        
        while (j > 0) {
            setTemp(j - 1, true);
            await sleep(250);
            
            if (arr[j - 1] > arr[j]) {
                await animateSwap(arr, domBars, j, j - 1);
                await sleep(100);
                
                setTemp(j, false);
                j--;
            } else {
                setTemp(j - 1, false);
                break;
            }
        }
        setTemp(j, false);
    }
}
