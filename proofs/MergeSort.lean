import Mathlib.Data.List.Sort

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
