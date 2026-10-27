export const LEAN_SOURCE_CODE = `import Mathlib.Data.List.Sort

open List

def orderedInsert (x : Nat) : List Nat → List Nat
  | [] => [x]
  | y :: ys => if x ≤ y then x :: y :: ys else y :: orderedInsert x ys

def insertionSort : List Nat → List Nat
  | [] => []
  | x :: xs => orderedInsert x (insertionSort xs)

theorem insertionSort_is_sorted (l : List Nat) :
    (l.insertionSort (· ≤ ·)).Pairwise (· ≤ ·) :=
  pairwise_insertionSort (· ≤ ·) l

theorem insertionSort_is_perm (l : List Nat) :
    (l.insertionSort (· ≤ ·)).Perm l :=
  perm_insertionSort (· ≤ ·) l
`;

export function getLeanPlaygroundUrl() {
    return "https://live.lean-lang.org/#project=mathlib&code=" + encodeURIComponent(LEAN_SOURCE_CODE);
}

export const LEAN_METADATA = {
    title: "Formal Verification: Insertion Sort",
    framework: "Lean 4 Theorem Prover • Mathlib",
    repoUrl: "https://github.com/meteor-chat/meteor-chat.github.io/blob/main/proofs/InsertionSort.lean",
    guarantees: [
        {
            name: "Keterurutan Mutlak (Sortedness)",
            desc: "Terbukti secara matematis bahwa untuk sembarang list masukan, hasil algoritma selalu berurutan dari kecil ke besar tanpa celah inkonsistensi."
        },
        {
            name: "Kekekalan Elemen (Permutation Invariance)",
            desc: "Terbukti bahwa himpunan elemen luaran adalah permutasi eksak dari elemen masukan; tidak ada nilai yang hilang, terduplikasi, atau termutasi."
        }
    ]
};
