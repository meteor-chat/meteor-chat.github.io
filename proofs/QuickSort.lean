def quickSortAux : Nat → List Nat → List Nat
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
