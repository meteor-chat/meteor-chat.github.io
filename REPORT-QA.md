# REPORT QA - Meteor Chat

Laporan ini merangkum perbaikan ekstensif pada basis kode Meteor Chat, sesuai dengan audit QA, mulai dari performa, keamanan, penanganan error, hingga kebersihan kode. Semua kode tetap mempertahankan arsitektur *vanilla ES modules*.

## 1. Perbaikan Rendering dan UI
- **Math Rendering vs Code Blocks**: Modul `math-plugin.js` telah dimodifikasi menggunakan pendekatan *state-machine* agar delimiter matematika (`$$` dan `$`) tidak pernah dieksekusi atau merusak format saat berada di dalam blok kode (code blocks) maupun *inline code*.
- **DOMPurify & Keamanan**: DOMPurify secara otomatis memblokir atribut `target` dan elemen `<button>`. Hal ini telah diatasi dengan memasang hook `DOMPurify.addHook("afterSanitizeAttributes")` untuk memaksa `target="_blank"` pada tautan (`<a>`). Selain itu, tag `<button>` dan `<input>` telah diizinkan agar tombol salin kode dan *task list* Markdown dapat berfungsi tanpa kompromi XSS, karena atribut event (e.g., `onclick`) tetap diblokir.
- **Rendering Stream Inkremental & Throttling**: Memperbarui DOM tiap *chunk* pada `chat-render.js` membuat UI lambat. Fitur throttling (~150ms) telah diimplementasikan pada `updateStreamingMessage`. Selain itu, `renderChat` sekarang bekerja secara inkremental, hanya menambahkan pesan baru tanpa me-reset seluruh container. Eksekusi `hljs.highlight` juga dimatikan sementara selama proses streaming berlangsung agar CPU tidak melonjak.
- **Auto-scroll Pintar**: UI sekarang hanya akan melakukan auto-scroll ke bawah saat stream baru berjalan JIKA pengguna sedang berada di dasar layar.
- **Status Input UI**: Batasan teks 999 karakter bawaan HTML dihapus dan diganti dengan validasi murni dari `config.js` (dengan error handling yang tidak menghapus draft pengguna).

## 2. Ketahanan API dan Manajemen Error (Resilience)
- **Taksonomi Error (`api-client.js`)**: Pembuatan kelas `ApiError` untuk memilah jenis kegagalan jaringan:
  - Error kredensial (401/402) akan memberikan *cooldown* panjang pada kunci API.
  - Error limit (429) mengikuti header `Retry-After`.
  - Error internal (5xx) hanya mendapat *cooldown* sementara dan retries.
- **Rotasi Key yang Aman**: Bug perputaran key berganda (lompat dua kali) sudah diperbaiki.
- **Sistem Timeout & Deteksi Stream Putus**: `AbortSignal.any` (atau padanannya yang cross-browser lewat fungsi komposit) disuntikkan ke proses *fetch*. Jika koneksi *idle* terlalu lama (tidak menerima chunk) maka ia akan dibatalkan (Timeout 408) dan mekanisme retry berjalan otomatis. Jika koneksi terputus tiba-tiba tanpa sinyal stop, UI akan menampilkan opsi "Coba Lanjutkan (Terputus)" agar pengguna tahu bahwa respon belum selesai.
- **Toleransi JSON Parse**: Loop data streaming di dalam `api-stream.js` sekarang membungkus blok parsing JSON dalam `try-catch` terpisah. Kegagalan *parse* pada string tanggung (bukan dari provider error) akan dilewati dengan aman sehingga stream tidak mati mendadak.

## 3. Manajemen State dan History
- **Isolasi Modul Sejarah (`history.js`)**: Fungsi-fungsi berat pengelola teks seperti `trimMessages`, `estimateTokens`, dan ekstraksi konteks JSON jadwal kuliah dari riwayat pesan telah diekstrak ke dalam file terpisah `history.js`. API transport (`api-client.js`) kini bersih dari urusan memori dan string.
- **Utilitas Teks (`text-utils.js`)**: Fungsi seperti `escapeHTML`, `stripThinkTags`, dan `getMaxTokens` dipindahkan ke `text-utils.js`. `getMaxTokens` sekarang memvalidasi kecocokan seluruh kata (Whole-Word Match) agar limit token yang dikirim optimal dan tidak *false-positive*.
- **Pemulihan Edit (Safe Abort)**: Mengedit pesan yang berujung pada error jaringan (atau di-cancel pengguna) sekarang aman; memori dan status tampilan dikembalikan tepat seperti sebelum proses *edit* dikirim.

## 4. Evaluasi Konfigurasi OpenRouter
- Dari hasil uji langsung API `/models`, parameter batas `models` (fallback) milik OpenRouter hanya menerima maksimal **3 item**. Sebagai akibatnya, sisa dari 10 daftar model di `config.js` telah dibersihkan menjadi 3 model teratas saja agar efisien dan sesuai dengan batasan layanan.

Semua pengujian Vitest (termasuk modul ekstensi untuk `stripThinkTags` dan RegExp `getMaxTokens`) berhasil dengan sukses. Aplikasi saat ini berada di tingkat stabilitas yang prima sesuai standar kelayakan produksi.
