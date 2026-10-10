export async function selectionSort(arr, domBars, updatePos, setTemp, sleep) {
    let n = arr.length;
    for (let i = 0; i < n - 1; i++) {
        let min_idx = i;
        setTemp(i, true);
        
        for (let j = i + 1; j < n; j++) {
            setTemp(j, true);
            await sleep(300);
            
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
            await sleep(300);
            
            let temp = arr[i];
            arr[i] = arr[min_idx];
            arr[min_idx] = temp;
            
            let tempDom = domBars[i];
            domBars[i] = domBars[min_idx];
            domBars[min_idx] = tempDom;
            
            updatePos(i, i);
            updatePos(min_idx, min_idx);
            
            await sleep(300);
        }
        
        setTemp(min_idx, false);
        setTemp(i, false);
    }
}
