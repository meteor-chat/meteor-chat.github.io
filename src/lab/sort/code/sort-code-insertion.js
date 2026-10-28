export const insertionSortCode = {
    python: {
        code: `def insertion_sort(arr):
    n = len(arr)
    for i in range(1, n):
        temp = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > temp:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = temp
    return arr`,
        steps: {
            temp: [4, 5],
            compare: [6],
            shift: [7, 8],
            insert: [9],
            done: [10]
        }
    },
    javascript: {
        code: `function insertionSort(arr) {
    let n = arr.length;
    for (let i = 1; i < n; i++) {
        let temp = arr[i];
        let j = i - 1;
        while (j >= 0 && arr[j] > temp) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = temp;
    }
    return arr;
}`,
        steps: {
            temp: [4, 5],
            compare: [6],
            shift: [7, 8],
            insert: [10],
            done: [12]
        }
    },
    c: {
        code: `void insertionSort(int arr[], int n) {
    for (int i = 1; i < n; i++) {
        int temp = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > temp) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = temp;
    }
}`,
        steps: {
            temp: [3, 4],
            compare: [5],
            shift: [6, 7],
            insert: [9],
            done: [10]
        }
    },
    cpp: {
        code: `void insertionSort(std::vector<int>& arr) {
    int n = arr.size();
    for (int i = 1; i < n; i++) {
        int temp = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > temp) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = temp;
    }
}`,
        steps: {
            temp: [4, 5],
            compare: [6],
            shift: [7, 8],
            insert: [10],
            done: [11]
        }
    },
    java: {
        code: `public static void insertionSort(int[] arr) {
    int n = arr.length;
    for (int i = 1; i < n; i++) {
        int temp = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > temp) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = temp;
    }
}`,
        steps: {
            temp: [4, 5],
            compare: [6],
            shift: [7, 8],
            insert: [10],
            done: [11]
        }
    },
    golang: {
        code: `func insertionSort(arr []int) {
    n := len(arr)
    for i := 1; i < n; i++ {
        temp := arr[i]
        j := i - 1
        for j >= 0 && arr[j] > temp {
            arr[j+1] = arr[j]
            j--
        }
        arr[j+1] = temp
    }
}`,
        steps: {
            temp: [4, 5],
            compare: [6],
            shift: [7, 8],
            insert: [10],
            done: [11]
        }
    }
};
