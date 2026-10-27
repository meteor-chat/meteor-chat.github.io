import {
  LEAN_BUBBLE_CODE,
  LEAN_SELECTION_CODE,
  LEAN_INSERTION_CODE,
  LEAN_QUICK_CODE,
  LEAN_MERGE_CODE,
  LEAN_SHAKER_CODE
} from "./sort-lean-sources.js?v=15";

export const LEAN_ALGORITHMS = [
  { id: "bubble", name: "Bubble Sort" },
  { id: "selection", name: "Selection Sort" },
  { id: "insertion", name: "Insertion Sort" },
  { id: "quick", name: "Quick Sort" },
  { id: "merge", name: "Merge Sort" },
  { id: "shaker", name: "Shaker Sort" }
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
  selection: {
    title: "Selection Sort",
    tier: "Tier 3: Verified Inductive Invariant Model",
    tierClass: "tier-3",
    framework: "Lean 4 Theorem Prover • Core",
    repoUrl: "https://github.com/meteor-chat/meteor-chat.github.io/blob/main/proofs/SelectionSort.lean",
    project: "lean",
    code: LEAN_SELECTION_CODE,
    guarantees: [
      {
        name: "Preservasi Ukuran Sisa Ekstraksi (selectMin_length)",
        desc: "Teorema induktif membuktikan ukuran remainder selalu presisi xs.length saat elemen minimum diekstraksi."
      },
      {
        name: "Terminasi & Basis Invarian",
        desc: "Batas fuel berkurang monoton pada setiap ekstraksi nilai, menjamin penyelesaian algoritma dalam kedalaman berhingga."
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
  quick: {
    title: "Quick Sort",
    tier: "Tier 2: Lean 4 Core Standard Library",
    tierClass: "tier-2",
    framework: "Lean 4 Theorem Prover • Init.Data.Array.QSort",
    repoUrl: "https://github.com/meteor-chat/meteor-chat.github.io/blob/main/proofs/QuickSort.lean",
    project: "lean",
    code: LEAN_QUICK_CODE,
    guarantees: [
      {
        name: "Standar Pustaka Resmi Lean 4 (Array.qsort)",
        desc: "Menggunakan implementasi bawaan compiler Lean 4 dengan optimasi mutasi in-place fungsional (FBIP) berkecepatan tinggi."
      },
      {
        name: "Model Partisi Fungsional Terpisah (Divide & Conquer)",
        desc: "Model fungsional membuktikan partisi deterministik antara sublist (· ≤ x) dan (· > x) di sekitar pivot x."
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
  },
  shaker: {
    title: "Shaker Sort",
    tier: "Tier 3: Verified Inductive Invariant Model",
    tierClass: "tier-3",
    framework: "Lean 4 Theorem Prover • Core",
    repoUrl: "https://github.com/meteor-chat/meteor-chat.github.io/blob/main/proofs/ShakerSort.lean",
    project: "lean",
    code: LEAN_SHAKER_CODE,
    guarantees: [
      {
        name: "Preservasi Ukuran Pass Maju (bubbleForward_length)",
        desc: "Teorema induktif membuktikan pass maju melestarikan jumlah elemen saat memindahkan nilai terbesar ke posisi akhir."
      },
      {
        name: "Konvergensi Dua Arah & Terminasi Fuel",
        desc: "Kombinasi siklus bubbleForward dan bubbleBackward dibatasi fuel hingga konvergen deterministik pada list terurut."
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
