export const shakerSortCode = {
    python: {
        code: `def shaker_sort(arr):
    n = len(arr)
    swapped = True
    start = 0
    end = n - 1
    while swapped:
        swapped = False
        for i in range(start, end):
            if arr[i] > arr[i + 1]:
                temp = arr[i]
                arr[i] = arr[i + 1]
                arr[i + 1] = temp
                swapped = True
        if not swapped:
            break
        swapped = False
        end -= 1
        for i in range(end - 1, start - 1, -1):
            if arr[i] > arr[i + 1]:
                temp = arr[i]
                arr[i] = arr[i + 1]
                arr[i + 1] = temp
                swapped = True
        start += 1
    return arr`,
        steps: {
            fwd_compare: [9],
            fwd_swap: [10, 11, 12, 13],
            bwd_compare: [19],
            bwd_swap: [20, 21, 22, 23],
            done: [25]
        }
    },
    javascript: {
        code: `function shakerSort(arr) {
    let swapped = true;
    let start = 0;
    let end = arr.length - 1;
    while (swapped) {
        swapped = false;
        for (let i = start; i < end; i++) {
            if (arr[i] > arr[i + 1]) {
                let temp = arr[i];
                arr[i] = arr[i + 1];
                arr[i + 1] = temp;
                swapped = true;
            }
        }
        if (!swapped) break;
        swapped = false;
        end--;
        for (let i = end - 1; i >= start; i--) {
            if (arr[i] > arr[i + 1]) {
                let temp = arr[i];
                arr[i] = arr[i + 1];
                arr[i + 1] = temp;
                swapped = true;
            }
        }
        start++;
    }
    return arr;
}`,
        steps: {
            fwd_compare: [8],
            fwd_swap: [9, 10, 11, 12],
            bwd_compare: [19],
            bwd_swap: [20, 21, 22, 23],
            done: [28]
        }
    },
    c: {
        code: `void shakerSort(int arr[], int n) {
    int swapped = 1;
    int start = 0;
    int end = n - 1;
    while (swapped) {
        swapped = 0;
        for (int i = start; i < end; i++) {
            if (arr[i] > arr[i + 1]) {
                int temp = arr[i];
                arr[i] = arr[i + 1];
                arr[i + 1] = temp;
                swapped = 1;
            }
        }
        if (!swapped) break;
        swapped = 0;
        end--;
        for (int i = end - 1; i >= start; i--) {
            if (arr[i] > arr[i + 1]) {
                int temp = arr[i];
                arr[i] = arr[i + 1];
                arr[i + 1] = temp;
                swapped = 1;
            }
        }
        start++;
    }
}`,
        steps: {
            fwd_compare: [8],
            fwd_swap: [9, 10, 11, 12],
            bwd_compare: [19],
            bwd_swap: [20, 21, 22, 23],
            done: [27]
        }
    },
    cpp: {
        code: `void shakerSort(std::vector<int>& arr) {
    bool swapped = true;
    int start = 0;
    int end = arr.size() - 1;
    while (swapped) {
        swapped = false;
        for (int i = start; i < end; i++) {
            if (arr[i] > arr[i + 1]) {
                int temp = arr[i];
                arr[i] = arr[i + 1];
                arr[i + 1] = temp;
                swapped = true;
            }
        }
        if (!swapped) break;
        swapped = false;
        end--;
        for (int i = end - 1; i >= start; i--) {
            if (arr[i] > arr[i + 1]) {
                int temp = arr[i];
                arr[i] = arr[i + 1];
                arr[i + 1] = temp;
                swapped = true;
            }
        }
        start++;
    }
}`,
        steps: {
            fwd_compare: [8],
            fwd_swap: [9, 10, 11, 12],
            bwd_compare: [19],
            bwd_swap: [20, 21, 22, 23],
            done: [27]
        }
    },
    java: {
        code: `public static void shakerSort(int[] arr) {
    boolean swapped = true;
    int start = 0;
    int end = arr.length - 1;
    while (swapped) {
        swapped = false;
        for (int i = start; i < end; i++) {
            if (arr[i] > arr[i + 1]) {
                int temp = arr[i];
                arr[i] = arr[i + 1];
                arr[i + 1] = temp;
                swapped = true;
            }
        }
        if (!swapped) break;
        swapped = false;
        end--;
        for (int i = end - 1; i >= start; i--) {
            if (arr[i] > arr[i + 1]) {
                int temp = arr[i];
                arr[i] = arr[i + 1];
                arr[i + 1] = temp;
                swapped = true;
            }
        }
        start++;
    }
}`,
        steps: {
            fwd_compare: [8],
            fwd_swap: [9, 10, 11, 12],
            bwd_compare: [19],
            bwd_swap: [20, 21, 22, 23],
            done: [27]
        }
    },
    golang: {
        code: `func shakerSort(arr []int) {
    swapped := true
    start := 0
    end := len(arr) - 1
    for swapped {
        swapped = false
        for i := start; i < end; i++ {
            if arr[i] > arr[i+1] {
                temp := arr[i]
                arr[i] = arr[i+1]
                arr[i+1] = temp
                swapped = true
            }
        }
        if !swapped {
            break
        }
        swapped = false
        end--
        for i := end - 1; i >= start; i-- {
            if arr[i] > arr[i+1] {
                temp := arr[i]
                arr[i] = arr[i+1]
                arr[i+1] = temp
                swapped = true
            }
        }
        start++
    }
}`,
        steps: {
            fwd_compare: [8],
            fwd_swap: [9, 10, 11, 12],
            bwd_compare: [21],
            bwd_swap: [22, 23, 24, 25],
            done: [29]
        }
    }
};
