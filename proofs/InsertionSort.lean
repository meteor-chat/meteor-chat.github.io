import Mathlib.Data.List.Sort

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
