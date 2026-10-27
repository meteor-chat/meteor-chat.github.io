structure Vec2 where
  x : Int
  y : Int

def Vec2.add (a b : Vec2) : Vec2 :=
  ⟨a.x + b.x, a.y + b.y⟩

def Vec2.sub (a b : Vec2) : Vec2 :=
  ⟨a.x - b.x, a.y - b.y⟩

def Vec2.distSq (a b : Vec2) : Nat :=
  ((a.x - b.x).natAbs * (a.x - b.x).natAbs) + ((a.y - b.y).natAbs * (a.y - b.y).natAbs)

def clampVal (val bound : Int) : Int :=
  if val > bound then bound
  else if val < -bound then -bound
  else val

def clampSpeed (v : Vec2) (maxSpeed : Int) : Vec2 :=
  ⟨clampVal v.x maxSpeed, clampVal v.y maxSpeed⟩

theorem clampVal_bounded (val bound : Int) (h : bound ≥ 0) :
    -bound ≤ clampVal val bound ∧ clampVal val bound ≤ bound := by
  dsimp [clampVal]
  split
  · omega
  · split
    · omega
    · omega

theorem clampSpeed_x_bounded (v : Vec2) (maxSpeed : Int) (h : maxSpeed ≥ 0) :
    -maxSpeed ≤ (clampSpeed v maxSpeed).x ∧ (clampSpeed v maxSpeed).x ≤ maxSpeed := by
  exact clampVal_bounded v.x maxSpeed h

theorem clampSpeed_y_bounded (v : Vec2) (maxSpeed : Int) (h : maxSpeed ≥ 0) :
    -maxSpeed ≤ (clampSpeed v maxSpeed).y ∧ (clampSpeed v maxSpeed).y ≤ maxSpeed := by
  exact clampVal_bounded v.y maxSpeed h

#check clampVal_bounded
#check clampSpeed_x_bounded
#check clampSpeed_y_bounded
#eval clampSpeed ⟨15, -20⟩ 10
