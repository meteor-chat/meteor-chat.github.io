export const selectionSortCode = {
    python: {
        code: `def selection_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        if min_idx != i:
            temp = arr[i]
            arr[i] = arr[min_idx]
            arr[min_idx] = temp
    return arr`,
        steps: {
            min: [4],
            compare: [6],
            new_min: [7],
            swap: [9, 10, 11],
            done: [12]
        }
    },
    javascript: {
        code: `function selectionSort(arr) {
    let n = arr.length;
    for (let i = 0; i < n - 1; i++) {
        let minIdx = i;
        for (let j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        if (minIdx !== i) {
            let temp = arr[i];
            arr[i] = arr[minIdx];
            arr[minIdx] = temp;
        }
    }
    return arr;
}`,
        steps: {
            min: [4],
            compare: [6],
            new_min: [7],
            swap: [11, 12, 13],
            done: [16]
        }
    },
    c: {
        code: `void selectionSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        if (minIdx != i) {
            int temp = arr[i];
            arr[i] = arr[minIdx];
            arr[minIdx] = temp;
        }
    }
}`,
        steps: {
            min: [3],
            compare: [5],
            new_min: [6],
            swap: [10, 11, 12],
            done: [14]
        }
    },
    cpp: {
        code: `void selectionSort(std::vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        if (minIdx != i) {
            int temp = arr[i];
            arr[i] = arr[minIdx];
            arr[minIdx] = temp;
        }
    }
}`,
        steps: {
            min: [4],
            compare: [6],
            new_min: [7],
            swap: [11, 12, 13],
            done: [15]
        }
    },
    java: {
        code: `public static void selectionSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        if (minIdx != i) {
            int temp = arr[i];
            arr[i] = arr[minIdx];
            arr[minIdx] = temp;
        }
    }
}`,
        steps: {
            min: [4],
            compare: [6],
            new_min: [7],
            swap: [11, 12, 13],
            done: [15]
        }
    },
    golang: {
        code: `func selectionSort(arr []int) {
    n := len(arr)
    for i := 0; i < n-1; i++ {
        minIdx := i
        for j := i + 1; j < n; j++ {
            if arr[j] < arr[minIdx] {
                minIdx = j
            }
        }
        if minIdx != i {
            temp := arr[i]
            arr[i] = arr[minIdx]
            arr[minIdx] = temp
        }
    }
}`,
        steps: {
            min: [4],
            compare: [6],
            new_min: [7],
            swap: [11, 12, 13],
            done: [15]
        }
    }
};
