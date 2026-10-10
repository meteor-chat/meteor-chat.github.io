async function partition(arr, low, high, domBars, updatePos, setTemp, sleep) {
    let pivot = arr[high];
    setTemp(high, true);
    await sleep(300);
    
    let i = low - 1;
    
    for (let j = low; j < high; j++) {
        setTemp(j, true);
        await sleep(300);
        
        if (arr[j] < pivot) {
            i++;
            if (i !== j) {
                setTemp(i, true);
                await sleep(200);
                
                let temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
                
                let tempDom = domBars[i];
                domBars[i] = domBars[j];
                domBars[j] = tempDom;
                
                updatePos(i, i);
                updatePos(j, j);
                
                await sleep(300);
                setTemp(i, false);
            }
        }
        setTemp(j, false);
    }
    
    if (i + 1 !== high) {
        setTemp(i + 1, true);
        await sleep(200);
        
        let temp = arr[i + 1];
        arr[i + 1] = arr[high];
        arr[high] = temp;
        
        let tempDom = domBars[i + 1];
        domBars[i + 1] = domBars[high];
        domBars[high] = tempDom;
        
        updatePos(i + 1, i + 1);
        updatePos(high, high);
        
        await sleep(300);
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
