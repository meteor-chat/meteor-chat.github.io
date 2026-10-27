def bubblePass : List Nat → List Nat
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
