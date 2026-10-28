export function* bubbleSortGenerator(arr) {
    let n = arr.length;
    let swapped;
    do {
        swapped = false;
        for (let j = 0; j < n - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                const tmp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = tmp;
                swapped = true;
            }
            yield j;
        }
        n--;
    } while (swapped && n > 1);
}

export function* selectionSortGenerator(arr) {
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
        let minIdx = i;
        for (let j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
            yield j;
        }
        if (minIdx !== i) {
            const tmp = arr[i];
            arr[i] = arr[minIdx];
            arr[minIdx] = tmp;
        }
        yield i;
    }
}

export function* insertionSortGenerator(arr) {
    const n = arr.length;
    for (let i = 1; i < n; i++) {
        const key = arr[i];
        let j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
            yield j + 1;
        }
        arr[j + 1] = key;
        yield i;
    }
}

export function* shakerSortGenerator(arr) {
    let left = 0;
    let right = arr.length - 1;
    let swapped = true;
    while (swapped && left < right) {
        swapped = false;
        for (let i = left; i < right; i++) {
            if (arr[i] > arr[i + 1]) {
                const tmp = arr[i];
                arr[i] = arr[i + 1];
                arr[i + 1] = tmp;
                swapped = true;
            }
            yield i;
        }
        right--;
        for (let i = right; i > left; i--) {
            if (arr[i] < arr[i - 1]) {
                const tmp = arr[i];
                arr[i] = arr[i - 1];
                arr[i - 1] = tmp;
                swapped = true;
            }
            yield i;
        }
        left++;
    }
}

export function* quickSortGenerator(arr) {
    const stack = [[0, arr.length - 1]];
    while (stack.length > 0) {
        const [low, high] = stack.pop();
        if (low < high) {
            const pivot = arr[high];
            let i = low - 1;
            for (let j = low; j < high; j++) {
                if (arr[j] < pivot) {
                    i++;
                    const tmp = arr[i];
                    arr[i] = arr[j];
                    arr[j] = tmp;
                }
                yield j;
            }
            const tmp = arr[i + 1];
            arr[i + 1] = arr[high];
            arr[high] = tmp;
            const pi = i + 1;
            yield pi;
            stack.push([pi + 1, high]);
            stack.push([low, pi - 1]);
        }
    }
}

export function createSortGenerator(type, arr) {
    if (type === "bubble") return bubbleSortGenerator(arr);
    if (type === "selection") return selectionSortGenerator(arr);
    if (type === "insertion") return insertionSortGenerator(arr);
    if (type === "shaker") return shakerSortGenerator(arr);
    if (type === "quick") return quickSortGenerator(arr);
    return bubbleSortGenerator(arr);
}
