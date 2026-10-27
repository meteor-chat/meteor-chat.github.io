def bubbleForward : List Nat → List Nat
  | [] => []
  | [x] => [x]
  | x :: y :: ys =>
    if x ≤ y then
      x :: bubbleForward (y :: ys)
    else
      y :: bubbleForward (x :: ys)

def bubbleBackward : List Nat → List Nat
  | [] => []
  | [x] => [x]
  | x :: xs =>
    match bubbleBackward xs with
    | [] => [x]
    | y :: ys =>
      if x ≤ y then
        x :: y :: ys
      else
        y :: x :: ys

def shakerPass (xs : List Nat) : List Nat :=
  bubbleBackward (bubbleForward xs)

def shakerSortAux : Nat → List Nat → List Nat
  | 0, xs => xs
  | fuel + 1, xs => shakerSortAux fuel (shakerPass xs)

def shakerSort (xs : List Nat) : List Nat :=
  shakerSortAux xs.length xs

theorem shakerPass_nil : shakerPass [] = [] := rfl

theorem shakerSort_nil : shakerSort [] = [] := rfl

#check shakerSort
#eval shakerSort [9, 3, 7, 1, 5, 4]
