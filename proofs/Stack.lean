def Stack (α : Type) := List α

def emptyStack {α : Type} : Stack α := []

def push {α : Type} (x : α) (s : Stack α) : Stack α :=
  x :: s

def pop {α : Type} : Stack α → Option α × Stack α
  | [] => (none, [])
  | x :: xs => (some x, xs)

def peek {α : Type} : Stack α → Option α
  | [] => none
  | x :: _ => some x

theorem pop_push_identity {α : Type} (x : α) (s : Stack α) :
    pop (push x s) = (some x, s) := rfl

theorem peek_push_identity {α : Type} (x : α) (s : Stack α) :
    peek (push x s) = some x := rfl

theorem push_length {α : Type} (x : α) (s : Stack α) :
    (push x s).length = s.length + 1 := rfl

#check pop_push_identity
#check peek_push_identity
#check push_length
#eval (pop (push 42 (push 10 emptyStack))).1
