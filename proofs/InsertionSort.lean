import Mathlib.Data.List.Sort

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
