export const A1_GUIDE_ITEMS = [
    {
        title: "Apa itu Regresi Linier?",
        q: "Maksudnya apa?",
        a: "Metode untuk menarik satu garis lurus terbaik yang menghubungkan titik data masukan (X) dengan target (Y)."
    },
    {
        title: "Kemiringan Garis (Slope / w)",
        q: "Angka w artinya apa?",
        a: "Menunjukkan seberapa cepat nilai Y bertambah tiap X naik 1 angka. Contoh: Tiap belajar 1 jam lagi, nilai ujian naik rata-rata w poin."
    },
    {
        title: "Titik Potong (Intercept / b)",
        q: "Angka b artinya apa?",
        a: "Nilai awal Y jika nilai X sama dengan 0. Contoh: Jika tidak belajar sama sekali (0 jam), perkiraan nilai dasar adalah b poin."
    },
    {
        title: "Garis Residu & Kuadrat Galat (Least Squares)",
        q: "Mengapa garis harus pas?",
        a: "Garis terbaik adalah garis yang membuat jarak vertikal (residu) antara titik nyata dengan garis tebakan sekecil mungkin. Kotak merah adalah luas kuadrat galat yang diminimalkan oleh rumus OLS."
    },
    {
        title: "Skor Ketepatan Garis (R² Score)",
        q: "Nilai R² maksudnya apa?",
        a: "Berapa persen (%) pola data yang berhasil dijelaskan oleh garis lurus. Jika R² = 0.95, artinya 95% perubahan nilai Y dipengaruhi oleh X."
    },
    {
        title: "Gradient Descent (Pelatihan Bertahap)",
        q: "Bagaimana cara garis belajar?",
        a: "Komputer menggeser kemiringan w dan titik potong b sedikit demi sedikit ke arah lereng yang membuat nilai error (MSE) semakin mengecil."
    }
];

export function renderLinearGuide(container) {
    if (!container) return;
    const cardsHtml = A1_GUIDE_ITEMS.map((item) => `
        <div class="linear-guide-box">
            <div class="linear-guide-item-title">${item.title}</div>
            <div class="linear-guide-row">
                <span class="linear-guide-q">${item.q}</span>
                <span class="linear-guide-a">${item.a}</span>
            </div>
        </div>
    `).join("");

    container.innerHTML = `
        <div class="linear-guide-card">
            <div class="linear-guide-header">
                <span class="linear-guide-badge">Panduan Praktis Level A1</span>
                <h3 class="linear-guide-title">Penjelasan Konsep Dasar Regresi Linier</h3>
            </div>
            <div class="linear-guide-list">
                ${cardsHtml}
            </div>
        </div>
    `;
}
