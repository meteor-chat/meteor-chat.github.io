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
