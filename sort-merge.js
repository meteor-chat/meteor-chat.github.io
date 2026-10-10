export async function mergeSort(arr, domBars, updatePos, setTemp, sleep) {
    await mergeSortHelper(arr, 0, arr.length - 1, domBars, updatePos, setTemp, sleep);
}

async function mergeSortHelper(arr, left, right, domBars, updatePos, setTemp, sleep) {
    if (left < right) {
        let mid = Math.floor((left + right) / 2);
        
        await mergeSortHelper(arr, left, mid, domBars, updatePos, setTemp, sleep);
        await mergeSortHelper(arr, mid + 1, right, domBars, updatePos, setTemp, sleep);
        
        await merge(arr, left, mid, right, domBars, updatePos, setTemp, sleep);
    }
}

async function merge(arr, left, mid, right, domBars, updatePos, setTemp, sleep) {
    let i = left;
    let j = mid + 1;
    
    while (i <= mid && j <= right) {
        setTemp(i, true);
        setTemp(j, true);
        await sleep(300);
        
        if (arr[i] <= arr[j]) {
            setTemp(i, false);
            setTemp(j, false);
            i++;
        } else {
            let temp = arr[j];
            let tempDom = domBars[j];
            
            for (let k = j; k > i; k--) {
                arr[k] = arr[k - 1];
                domBars[k] = domBars[k - 1];
                updatePos(k, k);
            }
            
            arr[i] = temp;
            domBars[i] = tempDom;
            updatePos(i, i);
            
            await sleep(300);
            
            setTemp(i, false);
            setTemp(i + 1, false);
            
            i++;
            mid++;
            j++;
        }
    }
}
