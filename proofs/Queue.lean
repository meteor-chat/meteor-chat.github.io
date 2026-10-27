structure Queue (α : Type) where
  front : List α
  back : List α

def emptyQueue {α : Type} : Queue α :=
  ⟨[], []⟩

def Queue.checkf {α : Type} (q : Queue α) : Queue α :=
  match q.front with
  | [] => ⟨q.back.reverse, []⟩
  | _ => q

def enqueue {α : Type} (x : α) (q : Queue α) : Queue α :=
  (Queue.checkf ⟨q.front, x :: q.back⟩)

def dequeue {α : Type} (q : Queue α) : Option α × Queue α :=
  match q.front with
  | [] => (none, q)
  | x :: xs => (some x, Queue.checkf ⟨xs, q.back⟩)

def toList {α : Type} (q : Queue α) : List α :=
  q.front ++ q.back.reverse

theorem enqueue_empty_toList {α : Type} (x : α) :
    toList (enqueue x emptyQueue) = [x] := rfl

theorem dequeue_enqueue_single {α : Type} (x : α) :
    (dequeue (enqueue x emptyQueue)).1 = some x := rfl

#check enqueue_empty_toList
#check dequeue_enqueue_single
#eval (dequeue (enqueue 20 (enqueue 10 emptyQueue))).1
