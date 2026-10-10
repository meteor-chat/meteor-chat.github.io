export async function bubbleSort(arr, domBars, updatePos, setTemp, sleep) {
    let n = arr.length;
    let swapped;
    
    do {
        swapped = false;
        for (let i = 0; i < n - 1; i++) {
            setTemp(i, true);
            setTemp(i + 1, true);
            await sleep(300);
            
            if (arr[i] > arr[i + 1]) {
                let temp = arr[i];
                arr[i] = arr[i + 1];
                arr[i + 1] = temp;
                
                let tempDom = domBars[i];
                domBars[i] = domBars[i + 1];
                domBars[i + 1] = tempDom;
                
                updatePos(i, i);
                updatePos(i + 1, i + 1);
                
                swapped = true;
                await sleep(300);
            }
            
            setTemp(i, false);
            setTemp(i + 1, false);
        }
        n--;
    } while (swapped);
}
