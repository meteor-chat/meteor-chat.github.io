import Mathlib.Data.List.Sort

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
