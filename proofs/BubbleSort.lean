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

theorem bubblePass_nil : bubblePass [] = [] := rfl

theorem bubbleSort_nil : bubbleSort [] = [] := rfl

#check bubbleSort
#eval bubbleSort [9, 3, 7, 1, 5, 4]
