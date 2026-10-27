def selectMin : Nat → List Nat → Nat × List Nat
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
