import {
  LEAN_BUBBLE_CODE,
  LEAN_INSERTION_CODE,
  LEAN_MERGE_CODE
} from "./sort-lean-sources.js?v=15";

export const LEAN_ALGORITHMS = [
  { id: "bubble", name: "Bubble Sort" },
  { id: "insertion", name: "Insertion Sort" },
  { id: "merge", name: "Merge Sort" }
];

export const LEAN_SORT_DATA = {
  bubble: {
    title: "Bubble Sort",
    tier: "Tier 3: Verified Inductive Invariant Model",
    tierClass: "tier-3",
    framework: "Lean 4 Theorem Prover • Core",
    repoUrl: "https://github.com/meteor-chat/meteor-chat.github.io/blob/main/proofs/BubbleSort.lean",
    project: "lean",
    code: LEAN_BUBBLE_CODE,
    guarantees: [
      {
        name: "Preservasi Panjang List (bubbleSort_length)",
        desc: "Teorema induktif membuktikan panjang list kekal pada setiap pass komputasi; tidak ada elemen yang hilang atau ditambahkan secara tidak sah."
      },
      {
        name: "Terminasi Total Terjamin (Bounded Fuel)",
        desc: "Rekursi dibatasi secara ketat oleh panjang list masukan sehingga fungsi terbukti terminasi dan bebas infinite loop."
      }
    ]
  },
  insertion: {
    title: "Insertion Sort",
    tier: "Tier 1: Mathlib Certified End-to-End Proof",
    tierClass: "tier-1",
    framework: "Lean 4 Theorem Prover • Mathlib",
    repoUrl: "https://github.com/meteor-chat/meteor-chat.github.io/blob/main/proofs/InsertionSort.lean",
    project: "mathlib",
    code: LEAN_INSERTION_CODE,
    guarantees: [
      {
        name: "Keterurutan Mutlak (pairwise_insertionSort)",
        desc: "Teorema resmi Mathlib membuktikan hasil algoritma memenuhi relasi Pairwise (· ≤ ·) untuk sembarang list masukan."
      },
      {
        name: "Invariansi Permutasi (perm_insertionSort)",
        desc: "Teorema resmi Mathlib membuktikan hasil adalah permutasi eksak dari list masukan tanpa mutasi atau kehilangan elemen."
      }
    ]
  },
  merge: {
    title: "Merge Sort",
    tier: "Tier 1: Mathlib Certified End-to-End Proof",
    tierClass: "tier-1",
    framework: "Lean 4 Theorem Prover • Mathlib / Core",
    repoUrl: "https://github.com/meteor-chat/meteor-chat.github.io/blob/main/proofs/MergeSort.lean",
    project: "mathlib",
    code: LEAN_MERGE_CODE,
    guarantees: [
      {
        name: "Keterurutan Mutlak (pairwise_mergeSort')",
        desc: "Teorema resmi Mathlib membuktikan luaran terurut Pairwise (· ≤ ·) dengan kompleksitas waktu optimal O(n log n)."
      },
      {
        name: "Preservasi Multiset (mergeSort_perm)",
        desc: "Teorema membuktikan himpunan luaran adalah permutasi eksak dari himpunan masukan."
      }
    ]
  }
};

export const LEAN_SHARED_TIPS = [
  {
    name: "1. Tanda Pembuktian Sukses di Lean 4",
    desc: "Di Lean 4, panel kanan (Infoview) mencetak tipe teorema #check dan hasil komputasi #eval tanpa pesan error merah ('0 errors'). Jika kursor diklik pada kata 'by', Lean menampilkan 'Goals accomplished 🎉'."
  },
  {
    name: "2. Verifikasi Independen",
    desc: "Di bilah menu kanan atas Lean Web, Anda bisa mengklik tombol 'Can I Trust This Proof?' untuk audit otomatis oleh kernel Lean bahwa pembuktian bebas dari aksioma palsu atau jalan pintas."
  }
];

export function getLeanSortData(type) {
  return LEAN_SORT_DATA[type] || LEAN_SORT_DATA.bubble;
}

export function getLeanPlaygroundUrl(type) {
  const data = getLeanSortData(type);
  const proj = data.project || "lean";
  return "https://live.lean-lang.org/#project=" + proj + "&code=" + encodeURIComponent(data.code);
}

export const LEAN_SOURCE_CODE = LEAN_SORT_DATA.insertion.code;
export const LEAN_METADATA = LEAN_SORT_DATA.insertion;
