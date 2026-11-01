import { PM_GUIDE_DATA } from "./math-calc-pm-guide-data.js";

export function getPmGuideHtml(formId) {
    const data = PM_GUIDE_DATA[formId];
    if (!data) return "";

    const inputsHtml = data.inputs.map((inp) => `
        <div class="pm-guide-qa-box">
            <div class="pm-guide-item-title">${inp.name}</div>
            <div class="pm-guide-qa-row">
                <span class="pm-guide-q">Maksudnya apa?</span>
                <span class="pm-guide-a">${inp.meaning}</span>
            </div>
            <div class="pm-guide-qa-row">
                <span class="pm-guide-q">Dapat dari mana?</span>
                <span class="pm-guide-a">${inp.source}</span>
            </div>
            <div class="pm-guide-qa-row">
                <span class="pm-guide-q">Fungsinya untuk apa?</span>
                <span class="pm-guide-a">${inp.purpose}</span>
            </div>
        </div>
    `).join("");

    const interpRows = data.outputs.interpretation.map((item) => `
        <tr>
            <td class="pm-guide-status-${item.status}">${item.label}</td>
            <td>${item.meaning}</td>
        </tr>
    `).join("");

    return `
        <div class="pm-guide-card">
            <div class="pm-guide-header">
                <span class="pm-guide-badge">Panduan Praktis Level A1</span>
                <h3 class="pm-guide-title">Penjelasan Detail ${data.title}</h3>
            </div>

            <div class="pm-guide-section">
                <h4 class="pm-guide-sect-title">1. Penjelasan Input Angka</h4>
                ${inputsHtml}
            </div>

            <div class="pm-guide-section">
                <h4 class="pm-guide-sect-title">2. Penjelasan Hasil Hitungan</h4>
                <div class="pm-guide-qa-box">
                    <div class="pm-guide-qa-row">
                        <span class="pm-guide-q">Maksud hasil rumus:</span>
                        <span class="pm-guide-a">${data.outputs.meaning}</span>
                    </div>
                    <table class="pm-guide-table">
                        <thead>
                            <tr>
                                <th>Kondisi Angka</th>
                                <th>Arti &amp; Status Proyek</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${interpRows}
                        </tbody>
                    </table>
                    <div class="pm-guide-action-box">
                        <span class="pm-guide-action-label">Tindakan Manajer:</span>
                        <span>${data.outputs.action}</span>
                    </div>
                </div>
            </div>

            <div class="pm-guide-section">
                <h4 class="pm-guide-sect-title">3. Contoh Kasus Riil Slide Kuliah</h4>
                <div class="pm-guide-case-box">
                    <div class="pm-guide-case-title">${data.example.title}</div>
                    <div class="pm-guide-a">${data.example.story}</div>
                    <div class="pm-guide-calc-badge">${data.example.calc}</div>
                    <div class="pm-guide-a">${data.example.meaning}</div>
                </div>
            </div>
        </div>
    `;
}

export function renderPmGuide(formId, targetContainer) {
    const container = targetContainer || document.getElementById(`pm-guide-container-${formId}`);
    if (!container) return;
    if (container.dataset.rendered === "true") return;
    const html = getPmGuideHtml(formId);
    if (!html) return;
    container.innerHTML = html;
    container.dataset.rendered = "true";
}
