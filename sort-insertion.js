export async function insertionSort(arr, domBars, updatePos, setTemp, sleep) {
    let n = arr.length;
    for (let i = 1; i < n; i++) {
        let j = i;
        setTemp(j, true);
        await sleep(200);
        
        while (j > 0) {
            setTemp(j - 1, true);
            await sleep(300);
            
            if (arr[j - 1] > arr[j]) {
                let temp = arr[j];
                arr[j] = arr[j - 1];
                arr[j - 1] = temp;
                
                let tempDom = domBars[j];
                domBars[j] = domBars[j - 1];
                domBars[j - 1] = tempDom;
                
                updatePos(j, j);
                updatePos(j - 1, j - 1);
                
                await sleep(300);
                
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
