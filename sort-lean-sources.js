export const LEAN_BUBBLE_CODE = `def bubblePass : List Nat → List Nat
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

theorem bubblePass_length : ∀ (l : List Nat), (bubblePass l).length = l.length
  | [] => rfl
  | [x] => rfl
  | x :: y :: ys => by
    dsimp [bubblePass]
    split
    · dsimp
      rw [bubblePass_length (y :: ys)]
    · dsimp
      rw [bubblePass_length (x :: ys)]

theorem bubbleSortAux_length : ∀ (n : Nat) (l : List Nat), (bubbleSortAux n l).length = l.length
  | 0, _ => rfl
  | n + 1, l => by
    dsimp [bubbleSortAux]
    rw [bubbleSortAux_length n (bubblePass l), bubblePass_length l]

theorem bubbleSort_length (l : List Nat) : (bubbleSort l).length = l.length := by
  exact bubbleSortAux_length l.length l

theorem bubbleSort_nil : bubbleSort [] = [] := rfl

#check bubbleSort
#check bubbleSort_length
#eval bubbleSort [9, 3, 7, 1, 5, 4]
`;

export const LEAN_SELECTION_CODE = `def selectMin : Nat → List Nat → Nat × List Nat
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

theorem selectMin_length : ∀ (m : Nat) (xs : List Nat), (selectMin m xs).2.length = xs.length
  | _, [] => rfl
  | m, x :: xs => by
    dsimp [selectMin]
    split
    · dsimp
      rw [selectMin_length x xs]
    · dsimp
      rw [selectMin_length m xs]

theorem selectMin_nil (m : Nat) : selectMin m [] = (m, []) := rfl

theorem selectionSort_nil : selectionSort [] = [] := rfl

#check selectionSort
#check selectMin_length
#eval selectionSort [9, 3, 7, 1, 5, 4]
`;

export const LEAN_INSERTION_CODE = `import Mathlib.Data.List.Sort

open List

def insertionSortNat (xs : List Nat) : List Nat :=
  xs.insertionSort (· ≤ ·)

theorem insertionSort_is_sorted (l : List Nat) :
    (insertionSortNat l).Pairwise (· ≤ ·) := by
  exact pairwise_insertionSort (· ≤ ·) l

theorem insertionSort_is_perm (l : List Nat) :
    (insertionSortNat l).Perm l := by
  exact perm_insertionSort (· ≤ ·) l

#check insertionSortNat
#check insertionSort_is_sorted
#check insertionSort_is_perm
#eval insertionSortNat [9, 3, 7, 1, 5, 4]
`;

export const LEAN_QUICK_CODE = `def quickSortAux : Nat → List Nat → List Nat
  | 0, _ => []
  | _, [] => []
  | fuel + 1, x :: xs =>
    let smaller := xs.filter (· ≤ x)
    let greater := xs.filter (· > x)
    quickSortAux fuel smaller ++ [x] ++ quickSortAux fuel greater

def quickSort (xs : List Nat) : List Nat :=
  quickSortAux xs.length xs

theorem quickSort_nil : quickSort [] = [] := rfl

def qsortCore (arr : Array Nat) : Array Nat :=
  arr.qsort

#check quickSort
#check qsortCore
#eval quickSort [9, 3, 7, 1, 5, 4]
#eval qsortCore #[9, 3, 7, 1, 5, 4]
`;

export const LEAN_MERGE_CODE = `import Mathlib.Data.List.Sort

open List

def mergeSortNat (xs : List Nat) : List Nat :=
  xs.mergeSort (· ≤ ·)

theorem mergeSort_is_sorted (l : List Nat) :
    (mergeSortNat l).Pairwise (· ≤ ·) := by
  exact pairwise_mergeSort' (· ≤ ·) l

theorem mergeSort_is_perm (l : List Nat) :
    (mergeSortNat l).Perm l := by
  exact mergeSort_perm l

#check mergeSortNat
#check mergeSort_is_sorted
#check mergeSort_is_perm
#eval mergeSortNat [9, 3, 7, 1, 5, 4]
`;

export const LEAN_SHAKER_CODE = `def bubbleForward : List Nat → List Nat
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

theorem bubbleForward_length : ∀ (l : List Nat), (bubbleForward l).length = l.length
  | [] => rfl
  | [x] => rfl
  | x :: y :: ys => by
    dsimp [bubbleForward]
    split
    · dsimp
      rw [bubbleForward_length (y :: ys)]
    · dsimp
      rw [bubbleForward_length (x :: ys)]

theorem shakerPass_nil : shakerPass [] = [] := rfl

theorem shakerSort_nil : shakerSort [] = [] := rfl

#check shakerSort
#check bubbleForward_length
#eval shakerSort [9, 3, 7, 1, 5, 4]
`;
