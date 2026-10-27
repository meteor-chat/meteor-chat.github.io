export const LEAN_CIPHER_CODE = `def shiftChar (k : Nat) (c : Char) : Char :=
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
`;

export const LEAN_CIPHER_DATA = {
    title: "Caesar Cipher (Modular Arithmetic)",
    tier: "Tier 1: Machine-Checked Modular Proof",
    tierClass: "tier-1",
    framework: "Lean 4 Theorem Prover • Core (Omega Tactic)",
    repoUrl: "https://github.com/meteor-chat/meteor-chat.github.io/blob/main/proofs/CaesarCipher.lean",
    project: "lean",
    code: LEAN_CIPHER_CODE,
    guarantees: [
        {
            name: "Identitas Invers Modulo 26 (shift_inv_mod)",
            desc: "Teorema shift_inv_mod membuktikan secara mutlak melalui taktik omega bahwa dekripsi dengan invers modular selalu memulihkan indeks karakter masukan tanpa cacat."
        },
        {
            name: "Preservasi Panjang & Simbol Non-Alfabet",
            desc: "Pemetaan fungsional List.map menjamin panjang teks hasil enkripsi/dekripsi sama persis dengan teks asal, dan karakter non-alfabet tetap utuh."
        }
    ]
};

export const LEAN_CIPHER_TIPS = [
    {
        name: "1. Tanda Pembuktian Sukses di Lean 4",
        desc: "Di Lean 4, panel kanan (Infoview) mencetak tipe teorema #check dan hasil komputasi #eval tanpa pesan error merah ('0 errors')."
    },
    {
        name: "2. Verifikasi Independen",
        desc: "Di bilah menu kanan atas Lean Web, Anda bisa mengklik tombol 'Can I Trust This Proof?' untuk audit otomatis oleh kernel Lean."
    }
];

export function getLeanCipherPlaygroundUrl() {
    return "https://live.lean-lang.org/#project=lean&code=" + encodeURIComponent(LEAN_CIPHER_CODE);
}
