export const bubbleSortCode = {
    python: {
        code: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                temp = arr[j]
                arr[j] = arr[j + 1]
                arr[j + 1] = temp
                swapped = True
        if not swapped:
            break
    return arr`,
        steps: {
            pass: [3, 5],
            compare: [6],
            swap: [7, 8, 9, 10],
            done: [13]
        }
    },
    javascript: {
        code: `function bubbleSort(arr) {
    let n = arr.length;
    for (let i = 0; i < n; i++) {
        let swapped = false;
        for (let j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                let temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
                swapped = true;
            }
        }
        if (!swapped) break;
    }
    return arr;
}`,
        steps: {
            pass: [3, 5],
            compare: [6],
            swap: [7, 8, 9, 10],
            done: [15]
        }
    },
    c: {
        code: `void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        int swapped = 0;
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
                swapped = 1;
            }
        }
        if (swapped == 0) break;
    }
}`,
        steps: {
            pass: [2, 4],
            compare: [5],
            swap: [6, 7, 8, 9],
            done: [13]
        }
    },
    cpp: {
        code: `void bubbleSort(std::vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++) {
        bool swapped = false;
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
                swapped = true;
            }
        }
        if (!swapped) break;
    }
}`,
        steps: {
            pass: [3, 5],
            compare: [6],
            swap: [7, 8, 9, 10],
            done: [14]
        }
    },
    java: {
        code: `public static void bubbleSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        boolean swapped = false;
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
                swapped = true;
            }
        }
        if (!swapped) break;
    }
}`,
        steps: {
            pass: [3, 5],
            compare: [6],
            swap: [7, 8, 9, 10],
            done: [14]
        }
    },
    golang: {
        code: `func bubbleSort(arr []int) {
    n := len(arr)
    for i := 0; i < n-1; i++ {
        swapped := false
        for j := 0; j < n-i-1; j++ {
            if arr[j] > arr[j+1] {
                temp := arr[j]
                arr[j] = arr[j+1]
                arr[j+1] = temp
                swapped = true
            }
        }
        if !swapped {
            break
        }
    }
}`,
        steps: {
            pass: [3, 5],
            compare: [6],
            swap: [7, 8, 9, 10],
            done: [16]
        }
    }
};
