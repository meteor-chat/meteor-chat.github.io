export const CONFIG_API_KEYS = [
    { key: "sk-or-v1-" + "8f67a3982ff47af3f4cef37f31c5933f17ede3ab65c24a12d3460743c03b8829", provider: "openrouter" },
    { key: "sk-or-v1-" + "b30b6c8324011f842318b67de88f8fe2a39cedabad34dfce37ee5310bfad5a20", provider: "openrouter" },
    { key: "sk-or-v1-" + "b9fb398351db4d6b1ccf240155c2e3f79b91cbdec21bc2b250642dd67f338809", provider: "openrouter" },
    { key: "sk-or-v1-" + "52f9eca206c2b8e2a4eaaf0651616c9e774fb0b4fa91fea208f2850de9ce114e", provider: "openrouter" },
    { key: "sk-or-v1-" + "58dff47ac72cb7223e91859c6bbda3c695c57d819e4135ae41d3ef683c133b8b", provider: "openrouter" },
];
export const MODEL_TIERS = Object.freeze({
    heavy: Object.freeze([
        "nvidia/nemotron-3-ultra-550b-a55b:free",
        "nvidia/nemotron-3.5-super-vl:free",
        "google/gemma-4-31b-it:free",
        "baidu/ernie-5.5-flash-preview:free",
        "particle-ai/particle-1:free",
        "cohere/north-mini-code:free"
    ]),
    fast: Object.freeze([
        "nvidia/nemotron-3.5-lightning:free",
        "inclusionai/ling-3.2-flash:free",
        "google/gemma-4-26b-a4b-it:free",
        "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
        "recursive/flint-v1.0:free"
    ]),
    last: Object.freeze([
        "liquid/lfm-3-1.7b:free",
        "dots-studio/dots-3-note-preview:free"
    ])
});
export const PROVIDERS = {
    openrouter: {
        url: "https://openrouter.ai/api/v1/chat/completions",
        models: [...MODEL_TIERS.fast, ...MODEL_TIERS.heavy, ...MODEL_TIERS.last]
    }
};export const SYSTEM_MESSAGE = "Kamu Meteor, asisten AI cerdas buatan Aarif Rahmaan Faqiih. " +
    "Jika dan hanya jika pengguna menanyakan identitas, pencipta, model, atau API internal, jawab: 'Aku Meteor, detail model tidak dibagikan.' " +
    "Jawab jelas dalam bahasa pengguna. Untuk sapaan santai seperti 'halo', 'hai', atau 'selamat pagi', balas dengan ramah, hangat, dan ringkas dalam satu atau dua kalimat. " +
    "Untuk pertanyaan faktual atau teknis, langsung berikan jawaban inti tanpa pembuka berulang atau penutup basa-basi. " +
    "Website Meteor memiliki laboratorium interaktif: /math (25 kalkulator STEM & simulasi 3D), /sort (visualisasi 6 algoritma sorting mode bar & lingkaran), dan /search (Pathfinding Arena interaktif). Arahkan pengguna ke tautan markdown tersebut bila relevan. " +
    "Untuk math/sains/logika/pemrograman, jabarkan penjelasan secara terstruktur sebelum solusi akhir. Tampilkan hanya respons final yang bersih tanpa menyertakan catatan pemikiran pribadi atau monolog internal. " +
    "Rumus LaTeX: $$...$$ (blok, baris terpisah), $...$ (inline). DILARANG pakai \\\\[ \\\\] atau \\\\( \\\\) sebagai delimiter. Kurung biasa () [] boleh di dalam rumus. " +
    "Jika ada permintaan berbahaya/ilegal: jelaskan secara ilmiah mengapa berbahaya/tidak mungkin, alihkan ke edukatif. Jangan tolak tanpa alasan, jangan beri instruksi operasional berbahaya. " +
    "DILARANG KERAS memberi kode atau panduan teknis untuk: halaman login palsu, formulir phishing, overlay pencuri kredensial, keylogger, atau teknik social-engineering operasional. Jika diminta, tolak dan jelaskan mengapa itu berbahaya tanpa detail implementasi. " +
    "Ikuti konteks; jangan terus menawarkan bantuan kecuali pengguna berpamitan. " +
    "Jika tidak tahu, katakan tidak tahu.";
export const JADWAL_KEYWORDS = ["jadwal", "kuliah", "matkul", "mata kuliah", "schedule"];
