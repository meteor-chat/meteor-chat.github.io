import { state } from "./app-state.js";
let templatePromise = null;
let jadwalPromise = null;
export function ensureTemplates() {
    if (!templatePromise) {
        const tpls = [
            "tpl-user-msg.html",
            "tpl-user-bubble.html",
            "tpl-user-actions.html",
            "tpl-assistant-msg.html",
            "tpl-typing.html",
            "tpl-thinking.html",
            "tpl-code-block.html"
        ];
        templatePromise = Promise.all(tpls.map(async (file) => {
            const res = await fetch(`templates/${file}`);
            if (!res.ok) throw new Error(`Gagal memuat template: ${file}`);
            const text = await res.text();
            state.templates[file.replace(".html", "")] = text;
        }));
    }
    return templatePromise;
}
export function ensureJadwal() {
    if (!jadwalPromise) {
        jadwalPromise = (async () => {
            try {
                const res = await fetch("assets/data/jadwal-kuliah.json");
                if (res.ok) {
                    const data = await res.json();
                    const validData = {};
                    for (const day in data) {
                        if (Array.isArray(data[day])) {
                            validData[day] = data[day].filter(item =>
                                item && typeof item.jam === 'string' && typeof item.nama_mata_kuliah === 'string' && typeof item.lokasi === 'string'
                            );
                        }
                    }
                    state.jadwalData = validData;
                }
            } catch(e) {
                console.warn("Gagal memuat jadwal kuliah", e);
            }
        })();
    }
    return jadwalPromise;
}
