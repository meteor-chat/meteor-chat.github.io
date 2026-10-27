def shiftChar (k : Nat) (c : Char) : Char :=
  let n := c.toNat
  if 65 ≤ n ∧ n ≤ 90 then
    Char.ofNat (65 + (n - 65 + k) % 26)
  else if 97 ≤ n ∧ n ≤ 122 then
    Char.ofNat (97 + (n - 97 + k) % 26)
  else
    c

def unshiftChar (k : Nat) (c : Char) : Char :=
  let n := c.toNat
  let invKey := (26 - (k % 26)) % 26
  if 65 ≤ n ∧ n ≤ 90 then
    Char.ofNat (65 + (n - 65 + invKey) % 26)
  else if 97 ≤ n ∧ n ≤ 122 then
    Char.ofNat (97 + (n - 97 + invKey) % 26)
  else
    c

def caesarEncrypt (k : Nat) (msg : String) : String :=
  ⟨msg.data.map (shiftChar k)⟩

def caesarDecrypt (k : Nat) (msg : String) : String :=
  ⟨msg.data.map (unshiftChar k)⟩

theorem shift_inv_mod (n k : Nat) (h : n < 26) :
    (n + k % 26 + (26 - k % 26) % 26) % 26 = n := by
  omega

#check shiftChar
#check caesarEncrypt
#check caesarDecrypt
#check shift_inv_mod
#eval caesarEncrypt 3 "HELLO WORLD"
#eval caesarDecrypt 3 "KHOOR ZRUOG"
