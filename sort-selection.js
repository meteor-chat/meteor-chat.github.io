import { animateSwap } from "./sort-animator.js?v=10";

export async function selectionSort(arr, domBars, updatePos, setTemp, sleep) {
    let n = arr.length;
    for (let i = 0; i < n - 1; i++) {
        let min_idx = i;
        setTemp(i, true);
        
        for (let j = i + 1; j < n; j++) {
            setTemp(j, true);
            await sleep(250);
            
            if (arr[j] < arr[min_idx]) {
                if (min_idx !== i) {
                    setTemp(min_idx, false);
                }
                min_idx = j;
            } else {
                setTemp(j, false);
            }
        }
        
        if (min_idx !== i) {
            setTemp(i, true);
            setTemp(min_idx, true);
            await sleep(200);
            await animateSwap(arr, domBars, min_idx, i);
            await sleep(150);
        }
        
        setTemp(min_idx, false);
        setTemp(i, false);
    }
}
