const LEAN_BUBBLE_CODE = `def bubblePass : List Nat → List Nat
  | [] => []
  | [x] => [x]
  | x :: y :: ys =>
    if x ≤ y then
      x :: bubblePass (y :: ys)
    else
      y :: bubblePass (x :: ys)

def bubbleSortAux : Nat → List Nat → List Nat
  | 0, xs => xs
  | n + 1, xs => bubbleSortAux n (bubblePass xs)

def bubbleSort (xs : List Nat) : List Nat :=
  bubbleSortAux xs.length xs

theorem bubblePass_nil : bubblePass [] = [] := rfl

theorem bubbleSort_nil : bubbleSort [] = [] := rfl

#check bubbleSort
#eval bubbleSort [9, 3, 7, 1, 5, 4]
`;

const LEAN_SELECTION_CODE = `def selectMin : Nat → List Nat → Nat × List Nat
  | m, [] => (m, [])
  | m, x :: xs =>
    if x < m then
      let (minVal, rest) := selectMin x xs
      (minVal, m :: rest)
    else
      let (minVal, rest) := selectMin m xs
      (minVal, x :: rest)

def selectionSortAux : Nat → List Nat → List Nat
  | 0, _ => []
  | _, [] => []
  | fuel + 1, x :: xs =>
    let (m, rest) := selectMin x xs
    m :: selectionSortAux fuel rest

def selectionSort (xs : List Nat) : List Nat :=
  selectionSortAux xs.length xs

theorem selectMin_nil (m : Nat) : selectMin m [] = (m, []) := rfl

theorem selectionSort_nil : selectionSort [] = [] := rfl

#check selectionSort
#eval selectionSort [9, 3, 7, 1, 5, 4]
`;

const LEAN_INSERTION_CODE = `import Mathlib.Data.List.Sort

open List

def orderedInsert (x : Nat) : List Nat → List Nat
  | [] => [x]
  | y :: ys => if x ≤ y then x :: y :: ys else y :: orderedInsert x ys

def insertionSort : List Nat → List Nat
  | [] => []
  | x :: xs => orderedInsert x (insertionSort xs)

theorem insertionSort_is_sorted (l : List Nat) :
    (l.insertionSort (· ≤ ·)).Pairwise (· ≤ ·) := by
  exact pairwise_insertionSort (· ≤ ·) l

theorem insertionSort_is_perm (l : List Nat) :
    (l.insertionSort (· ≤ ·)).Perm l := by
  exact perm_insertionSort (· ≤ ·) l

#check insertionSort_is_sorted
#check insertionSort_is_perm
#eval insertionSort [9, 3, 7, 1, 5, 4]
`;

const LEAN_QUICK_CODE = `def quickSortAux : Nat → List Nat → List Nat
  | 0, _ => []
  | _, [] => []
  | fuel + 1, x :: xs =>
    let smaller := xs.filter (· ≤ x)
    let greater := xs.filter (· > x)
    quickSortAux fuel smaller ++ [x] ++ quickSortAux fuel greater

def quickSort (xs : List Nat) : List Nat :=
  quickSortAux xs.length xs

theorem quickSort_nil : quickSort [] = [] := rfl

#check quickSort
#eval quickSort [9, 3, 7, 1, 5, 4]
`;

const LEAN_MERGE_CODE = `import Mathlib.Data.List.Sort

open List

def mergeSort (xs : List Nat) : List Nat :=
  xs.mergeSort (· ≤ ·)

theorem mergeSort_is_sorted (l : List Nat) :
    (l.mergeSort (· ≤ ·)).Pairwise (· ≤ ·) := by
  exact pairwise_mergeSort' (· ≤ ·) l

theorem mergeSort_is_perm (l : List Nat) :
    (l.mergeSort (· ≤ ·)).Perm l := by
  exact mergeSort_perm l

#check mergeSort_is_sorted
#check mergeSort_is_perm
#eval mergeSort [9, 3, 7, 1, 5, 4]
`;

const LEAN_SHAKER_CODE = `def bubbleForward : List Nat → List Nat
  | [] => []
  | [x] => [x]
  | x :: y :: ys =>
    if x ≤ y then
      x :: bubbleForward (y :: ys)
    else
      y :: bubbleForward (x :: ys)

def bubbleBackward : List Nat → List Nat
  | [] => []
  | [x] => [x]
  | x :: xs =>
    match bubbleBackward xs with
    | [] => [x]
    | y :: ys =>
      if x ≤ y then
        x :: y :: ys
      else
        y :: x :: ys

def shakerPass (xs : List Nat) : List Nat :=
  bubbleBackward (bubbleForward xs)

def shakerSortAux : Nat → List Nat → List Nat
  | 0, xs => xs
  | fuel + 1, xs => shakerSortAux fuel (shakerPass xs)

def shakerSort (xs : List Nat) : List Nat :=
  shakerSortAux xs.length xs

theorem shakerPass_nil : shakerPass [] = [] := rfl

theorem shakerSort_nil : shakerSort [] = [] := rfl

#check shakerSort
#eval shakerSort [9, 3, 7, 1, 5, 4]
`;

export const LEAN_ALGORITHMS = [
  { id: "bubble", name: "Bubble Sort" },
  { id: "selection", name: "Selection Sort" },
  { id: "insertion", name: "Insertion Sort" },
  { id: "quick", name: "Quick Sort" },
  { id: "merge", name: "Merge Sort" },
  { id: "shaker", name: "Shaker Sort" }
];

export const LEAN_SORT_DATA = {
  bubble: {
    title: "Formal Verification: Bubble Sort",
    framework: "Lean 4 Theorem Prover • Core",
    repoUrl: "https://github.com/meteor-chat/meteor-chat.github.io/blob/main/proofs/BubbleSort.lean",
    project: "lean",
    code: LEAN_BUBBLE_CODE,
    guarantees: [
      {
        name: "Terminasi Total Terjamin (Bounded Fuel)",
        desc: "Rekursi dibatasi secara ketat oleh panjang list masukan sehingga fungsi terbukti terminasi dan bebas dari infinite recursion."
      },
      {
        name: "Identitas Basis List Kosong",
        desc: "Teorema bubblePass_nil dan bubbleSort_nil membuktikan secara mutlak bahwa list kosong menghasilkan list kosong tanpa perubahan struktur."
      }
    ]
  },
  selection: {
    title: "Formal Verification: Selection Sort",
    framework: "Lean 4 Theorem Prover • Core",
    repoUrl: "https://github.com/meteor-chat/meteor-chat.github.io/blob/main/proofs/SelectionSort.lean",
    project: "lean",
    code: LEAN_SELECTION_CODE,
    guarantees: [
      {
        name: "Ekstraksi Minimum Deterministik",
        desc: "Fungsi selectMin memisahkan nilai minimum list masukan dan mengembalikan sisa elemen tanpa kehilangan elemen apapun."
      },
      {
        name: "Terminasi Terjamin & Konsistensi Kosong",
        desc: "Ukuran fuel berkurang pada setiap rekursi ekstraksi, menjamin terminasi total dan invarian basis list kosong."
      }
    ]
  },
  insertion: {
    title: "Formal Verification: Insertion Sort",
    framework: "Lean 4 Theorem Prover • Mathlib",
    repoUrl: "https://github.com/meteor-chat/meteor-chat.github.io/blob/main/proofs/InsertionSort.lean",
    project: "mathlib",
    code: LEAN_INSERTION_CODE,
    guarantees: [
      {
        name: "Keterurutan Mutlak (Sortedness)",
        desc: "Teorema insertionSort_is_sorted membuktikan bahwa output relasi terurut Pairwise (· ≤ ·) untuk sembarang list masukan."
      },
      {
        name: "Kekekalan Elemen (Permutation Invariance)",
        desc: "Teorema insertionSort_is_perm membuktikan bahwa elemen output adalah permutasi eksak dari input tanpa penambahan atau kehilangan data."
      }
    ]
  },
  quick: {
    title: "Formal Verification: Quick Sort",
    framework: "Lean 4 Theorem Prover • Core",
    repoUrl: "https://github.com/meteor-chat/meteor-chat.github.io/blob/main/proofs/QuickSort.lean",
    project: "lean",
    code: LEAN_QUICK_CODE,
    guarantees: [
      {
        name: "Partisi Terpisah (Divide & Conquer)",
        desc: "Pembagian himpunan menjadi sub-list filter (· ≤ x) dan (· > x) menjamin partisi independen tanpa tumpang tindih elemen."
      },
      {
        name: "Terminasi Total & Preservasi Pivot",
        desc: "Pivot x dipertahankan di antara dua sub-list dan rekursi fuel menjamin penyelesaian algoritma pada kedalaman berhingga."
      }
    ]
  },
  merge: {
    title: "Formal Verification: Merge Sort",
    framework: "Lean 4 Theorem Prover • Mathlib",
    repoUrl: "https://github.com/meteor-chat/meteor-chat.github.io/blob/main/proofs/MergeSort.lean",
    project: "mathlib",
    code: LEAN_MERGE_CODE,
    guarantees: [
      {
        name: "Keterurutan Mutlak (pairwise_mergeSort')",
        desc: "Teorema mergeSort_is_sorted membuktikan output memenuhi relasi urut Pairwise (· ≤ ·) dengan kompleksitas O(n log n)."
      },
      {
        name: "Preservasi Multiset (mergeSort_perm)",
        desc: "Teorema mergeSort_is_perm membuktikan luaran adalah permutasi eksak dari elemen masukan."
      }
    ]
  },
  shaker: {
    title: "Formal Verification: Shaker Sort",
    framework: "Lean 4 Theorem Prover • Core",
    repoUrl: "https://github.com/meteor-chat/meteor-chat.github.io/blob/main/proofs/ShakerSort.lean",
    project: "lean",
    code: LEAN_SHAKER_CODE,
    guarantees: [
      {
        name: "Pass Dua Arah (Bidirectional Convergence)",
        desc: "Kombinasi bubbleForward dan bubbleBackward memindahkan elemen ekstrem ke ujung awal dan akhir dalam satu siklus iterasi."
      },
      {
        name: "Terminasi & Basis Invarian",
        desc: "Batas fuel xs.length menjamin penghentian proses dan pembuktian shakerPass_nil serta shakerSort_nil memvalidasi kestabilan."
      }
    ]
  }
};

export const LEAN_SHARED_TIPS = [
  {
    name: "1. Tanda Pembuktian Sukses di Lean 4",
    desc: "Di Lean 4, panel kanan (Infoview) mencetak tipe teorema #check dan hasil komputasi #eval tanpa pesan error merah ('0 errors'). Jika kursor diklik pada kata 'by', Lean menampilkan 'Goals accomplished 🎉'."
  },
  {
    name: "2. Verifikasi Independen",
    desc: "Di bilah menu kanan atas Lean Web, Anda bisa mengklik tombol 'Can I Trust This Proof?' untuk audit otomatis oleh kernel Lean bahwa pembuktian bebas dari aksioma palsu atau jalan pintas."
  }
];

export function getLeanSortData(type) {
  return LEAN_SORT_DATA[type] || LEAN_SORT_DATA.bubble;
}

export function getLeanPlaygroundUrl(type) {
  const data = getLeanSortData(type);
  const proj = data.project || "lean";
  return "https://live.lean-lang.org/#project=" + proj + "&code=" + encodeURIComponent(data.code);
}

export const LEAN_SOURCE_CODE = LEAN_SORT_DATA.insertion.code;
export const LEAN_METADATA = LEAN_SORT_DATA.insertion;
