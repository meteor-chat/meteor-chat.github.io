export const mergeSortCode = {
    python: {
        code: `def merge_sort(arr, l=0, r=None):
    if r is None:
        r = len(arr) - 1
    if l < r:
        m = int((l + r) / 2)
        merge_sort(arr, l, m)
        merge_sort(arr, m + 1, r)
        merge(arr, l, m, r)
    return arr

def merge(arr, l, m, r):
    i = l
    j = m + 1
    while i <= m and j <= r:
        if arr[i] <= arr[j]:
            i += 1
        else:
            val = arr[j]
            k = j
            while k > i:
                arr[k] = arr[k - 1]
                k -= 1
            arr[i] = val
            i += 1
            m += 1
            j += 1`,
        steps: {
            split: [5],
            compare: [15],
            insert: [18, 19, 20, 21, 22, 23],
            done: [9]
        }
    },
    javascript: {
        code: `function mergeSort(arr, l = 0, r = arr.length - 1) {
    if (l < r) {
        let m = Math.floor((l + r) / 2);
        mergeSort(arr, l, m);
        mergeSort(arr, m + 1, r);
        merge(arr, l, m, r);
    }
    return arr;
}

function merge(arr, l, m, r) {
    let i = l;
    let j = m + 1;
    while (i <= m && j <= r) {
        if (arr[i] <= arr[j]) {
            i++;
        } else {
            let val = arr[j];
            let k = j;
            while (k > i) {
                arr[k] = arr[k - 1];
                k--;
            }
            arr[i] = val;
            i++;
            m++;
            j++;
        }
    }
}`,
        steps: {
            split: [3],
            compare: [15],
            insert: [18, 19, 20, 21, 22, 23, 24],
            done: [8]
        }
    },
    c: {
        code: `void merge(int arr[], int l, int m, int r) {
    int i = l;
    int j = m + 1;
    while (i <= m && j <= r) {
        if (arr[i] <= arr[j]) {
            i++;
        } else {
            int val = arr[j];
            int k = j;
            while (k > i) {
                arr[k] = arr[k - 1];
                k--;
            }
            arr[i] = val;
            i++;
            m++;
            j++;
        }
    }
}

void mergeSort(int arr[], int l, int r) {
    if (l < r) {
        int m = l + (r - l) / 2;
        mergeSort(arr, l, m);
        mergeSort(arr, m + 1, r);
        merge(arr, l, m, r);
    }
}`,
        steps: {
            split: [24],
            compare: [5],
            insert: [8, 9, 10, 11, 12, 13, 14],
            done: [28]
        }
    },
    cpp: {
        code: `void merge(std::vector<int>& arr, int l, int m, int r) {
    int i = l;
    int j = m + 1;
    while (i <= m && j <= r) {
        if (arr[i] <= arr[j]) {
            i++;
        } else {
            int val = arr[j];
            int k = j;
            while (k > i) {
                arr[k] = arr[k - 1];
                k--;
            }
            arr[i] = val;
            i++;
            m++;
            j++;
        }
    }
}

void mergeSort(std::vector<int>& arr, int l, int r) {
    if (l < r) {
        int m = l + (r - l) / 2;
        mergeSort(arr, l, m);
        mergeSort(arr, m + 1, r);
        merge(arr, l, m, r);
    }
}`,
        steps: {
            split: [24],
            compare: [5],
            insert: [8, 9, 10, 11, 12, 13, 14],
            done: [28]
        }
    },
    java: {
        code: `public static void merge(int[] arr, int l, int m, int r) {
    int i = l;
    int j = m + 1;
    while (i <= m && j <= r) {
        if (arr[i] <= arr[j]) {
            i++;
        } else {
            int val = arr[j];
            int k = j;
            while (k > i) {
                arr[k] = arr[k - 1];
                k--;
            }
            arr[i] = val;
            i++;
            m++;
            j++;
        }
    }
}

public static void mergeSort(int[] arr, int l, int r) {
    if (l < r) {
        int m = l + (r - l) / 2;
        mergeSort(arr, l, m);
        mergeSort(arr, m + 1, r);
        merge(arr, l, m, r);
    }
}`,
        steps: {
            split: [24],
            compare: [5],
            insert: [8, 9, 10, 11, 12, 13, 14],
            done: [28]
        }
    },
    golang: {
        code: `func merge(arr []int, l, m, r int) {
    i := l
    j := m + 1
    for i <= m && j <= r {
        if arr[i] <= arr[j] {
            i++
        } else {
            val := arr[j]
            k := j
            for k > i {
                arr[k] = arr[k-1]
                k--
            }
            arr[i] = val
            i++
            m++
            j++
        }
    }
}

func mergeSort(arr []int, l, r int) {
    if l < r {
        m := l + (r-l)/2
        mergeSort(arr, l, m)
        mergeSort(arr, m+1, r)
        merge(arr, l, m, r)
    }
}`,
        steps: {
            split: [24],
            compare: [5],
            insert: [8, 9, 10, 11, 12, 13, 14],
            done: [28]
        }
    }
};
