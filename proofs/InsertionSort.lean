import Mathlib.Data.List.Sort

open List

def orderedInsert (x : Nat) : List Nat → List Nat
  | [] => [x]
  | y :: ys => if x ≤ y then x :: y :: ys else y :: orderedInsert x ys

def insertionSort : List Nat → List Nat
  | [] => []
  | x :: xs => orderedInsert x (insertionSort xs)

theorem mathlib_insertionSort_sorted (l : List Nat) :
    (l.insertionSort (· ≤ ·)).Pairwise (· ≤ ·) :=
  pairwise_insertionSort (· ≤ ·) l

theorem mathlib_insertionSort_perm (l : List Nat) :
    (l.insertionSort (· ≤ ·)).Perm l :=
  perm_insertionSort (· ≤ ·) l

theorem insertionSort_nil : insertionSort [] = [] := rfl

theorem insertionSort_cons (x : Nat) (xs : List Nat) :
    insertionSort (x :: xs) = orderedInsert x (insertionSort xs) := rfl
