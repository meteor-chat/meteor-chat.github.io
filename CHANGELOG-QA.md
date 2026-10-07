# CHANGELOG QA

Laporan perbaikan dan hasil pengujian untuk Meteor Chat.

## Fase 1 - Bug Kritis
- [x] normalizeMath (math-plugin.js) merusak blok kode.
- [x] Edit pesan lalu request gagal/abort (chat-controller.js): riwayat terhapus.
- [x] Penanganan error API (api-client.js): taksonomi error dan rotasi key.
- [x] Pesan assistant kosong (chat-controller.js) memicu error "respons kosong".
- [x] Tombol copy hilang setelah error: renderChat() / loading state.
- [x] Teks user hilang di jalur abort.
- [x] Batas panjang pesan (input-controls.js vs config).
- [x] State UI input (sinkronisasi UI saat teks diubah).
- [x] clipboard.js menelan error.
- [x] Inisialisasi rapuh (main.js).
- [x] parseStream (api-stream.js): penanganan JSON error dan loop utama.

## Fase 2 - Rendering dan Keamanan
- [x] DOMPurify membuang atribut target pada tag a.
- [x] tpl-code-block.html tombol copy vs sanitize.js FORBID_TAGS.
- [x] markdown-setup.js renderer improvements.
- [x] stripThinkTags untuk streaming dan kasus penutup tanpa pembuka.

## Fase 3 - Performa dan Stress
- [x] Throttle update streaming & hljs.
- [x] Optimasi renderChat() untuk tidak selalu build ulang.
- [x] Timeout koneksi dan idle.
- [x] Penanganan stream terputus di tengah.
- [x] Konfigurasi model dan maxTokens pencocokan kata utuh.

## Fase 4 - Kebersihan Kode
- [x] Hapus dead code.
- [x] Refactor api-client.js ke modul lebih kecil.
- [x] Pindahkan jadwal context ke system message.
- [x] Escape ganda pada config.js SYSTEM_MESSAGE delimiter math.
- [x] Accessibility.

## Fase 5 - Testing
- [x] Vitest setup.
