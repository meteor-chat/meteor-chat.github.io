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
