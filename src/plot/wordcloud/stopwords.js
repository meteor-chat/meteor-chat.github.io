const ID_STOPWORDS = new Set([
    "ada", "adalah", "adanya", "agar", "akan", "akankah", "akhir", "akhiri", "akhirnya", "aku", "akan",
    "antara", "antaranya", "apa", "apaan", "apabila", "apakah", "apalagi", "artinya", "asal", "asalkan",
    "atas", "atau", "ataukah", "ataupun", "awal", "awalnya", "bagai", "bagaikan", "bagaimana", "bagaimanakah",
    "bagaimanapun", "bagi", "bagian", "bahkan", "bahwa", "bahwasanya", "baik", "bakal", "bakalan", "balik",
    "banyak", "bapak", "baru", "bawah", "beberapa", "begini", "beginian", "beginikah", "beginilah", "begitu",
    "begitukah", "begitulah", "begitupun", "bekerja", "belakang", "belakangan", "belum", "belumlah", "benar",
    "benarkah", "benarlah", "berada", "berakhir", "berakhirlah", "berakhirnya", "berapa", "berapakah",
    "berapalah", "berapapun", "berarti", "berawal", "berbagai", "berdatangan", "beri", "berikan", "berikut",
    "berikutnya", "berjumlah", "berkali", "berkata", "berkehendak", "berkeinginan", "berkenaan", "berlainan",
    "berlalu", "berlangsung", "berlebihan", "bermacam", "bermaksud", "bermula", "bersama", "bersiap",
    "bertanya", "berturut", "bertutur", "berujar", "berupa", "besar", "betul", "betulkah", "biasa",
    "biasanya", "bila", "bilakah", "bisa", "bisakah", "boleh", "bolehkah", "bolehlah", "buat", "bukan",
    "bukankah", "bukanlah", "bukannya", "cukup", "cukupkah", "cukuplah", "cuma", "dahulu", "dalam",
    "dan", "dapat", "dari", "daripada", "dekat", "demi", "demikian", "demikianlah", "dengan", "depan",
    "di", "dia", "diakhiri", "diakhirinya", "dialah", "diantara", "diantaranya", "diberi", "diberikan",
    "diberikannya", "dibuat", "dibuatnya", "didapat", "didatangkan", "digunakan", "diibaratkan", "diibaratkannya",
    "diingat", "diingatkan", "diinginkan", "dijawab", "dijelaskan", "dijelaskannya", "dikarenakan", "dikatakan",
    "dikatakannya", "dikerjakan", "diketahui", "diketahuinya", "dikira", "dilakukan", "dilalui", "dilihat",
    "dimaksud", "dimaksudkan", "dimaksudkannya", "dimaksudnya", "diminta", "dimintai", "dimisalkan", "dimulai",
    "dimulailah", "dimulainya", "dimungkinkan", "dini", "dipastikan", "diperbuat", "diperbuatnya", "dipergunakan",
    "diperkirakan", "diperlihatkan", "diperlukan", "diperlukannya", "dipersoalkan", "dipertanyakan", "dipunyai",
    "diri", "dirinya", "disampaikan", "disebut", "disebutkan", "disebutkannya", "disini", "disinilah",
    "ditambahkan", "ditandaskan", "ditanya", "ditanyai", "ditanyakan", "ditegaskan", "ditemukan", "ditentukan",
    "ditentukannya", "dituturkan", "dituturkannya", "diucapkan", "diucapkannya", "diungkapkan", "dong", "dua",
    "dulu", "empat", "enggak", "enggaknya", "entah", "entahlah", "hal", "hampir", "hanya", "hanyalah",
    "harus", "haruslah", "harusnya", "hendak", "hendaklah", "hendaknya", "hingga", "ia", "ialah", "ibarat",
    "ibaratkan", "ibaratnya", "ibu", "ikut", "ingat", "ingin", "inginkah", "inginkan", "ini", "inikah",
    "inilah", "itu", "itukah", "itulah", "jadi", "jadilah", "jadinya", "jangan", "jangankan", "janganlah",
    "jauh", "jawab", "jawaban", "jawabnya", "jelas", "jelaskan", "jelaslah", "jelasnya", "jika", "jikalau",
    "juga", "jumlah", "jumlahnya", "justru", "kala", "kalau", "kalaulah", "kalaupun", "kalian", "kami",
    "kamu", "kamulah", "kan", "kapan", "kapankah", "kapanpun", "karena", "karenanya", "kasus", "kata",
    "katakan", "katakanlah", "katanya", "ke", "keadaan", "kebetulan", "kecil", "kedua", "keduanya", "keinginan",
    "kelamaan", "kelihatan", "kelihatannya", "kelima", "keluar", "kembali", "kemudian", "kemungkinan", "kemungkinannya",
    "kenapa", "kepada", "kepadanya", "kesampaian", "keseluruhan", "keseluruhannya", "keterlaluan", "ketika",
    "khususnya", "kini", "kinilah", "kira", "kiranya", "kita", "kitalah", "kurang", "lagi", "lagian",
    "lah", "lain", "lainnya", "lalu", "lama", "lamanya", "lanjut", "lanjutnya", "lebih", "lewat",
    "lihat", "lima", "luar", "macam", "maka", "makanya", "makin", "malah", "malahan", "mampu",
    "mampukah", "mana", "manakala", "manalagi", "masih", "masihkah", "masing", "mau", "maupun", "melainkan",
    "melakukan", "melalui", "melihat", "melihatnya", "memang", "memastikan", "memberi", "memberikan", "membuat",
    "memerlukan", "memihak", "meminta", "memintakan", "memisalkan", "memperbuat", "mempergunakan", "memperkirakan",
    "memperlihatkan", "mempersiapkan", "mempersoalkan", "mempertanyakan", "mempunyai", "memulai", "memungkinkan",
    "menaiki", "menandaskan", "menanti", "menantikan", "menanya", "menanyai", "menanyakan", "mendapat",
    "mendapatkan", "mendatang", "mendatangi", "mendatangkan", "menegaskan", "mengakhiri", "mengapa", "mengatakan",
    "mengatakannya", "mengenai", "mengerjakan", "mengetahui", "menggunakan", "menghendaki", "mengibaratkan",
    "mengibaratkannya", "mengingat", "mengingatkan", "menginginkan", "mengira", "mengucapkan", "mengucapkannya",
    "mengungkapkan", "menjadi", "menjawab", "menjelaskan", "menuju", "menunjuk", "menunjuki", "menunjukkan",
    "menunjuknya", "menurut", "menurutnya", "menyampaikan", "menyangkut", "menyatakan", "menyebutkan", "menyeluruh",
    "menyiapkan", "merasa", "mereka", "merekalah", "merupakan", "meski", "meskipun", "meyakini", "meyakinkan",
    "minta", "mirip", "misal", "misalkan", "misalnya", "mula", "mulai", "mulailah", "mulanya", "mungkin",
    "mungkinkah", "nah", "naik", "namun", "nanti", "nantinya", "nyaris", "nyatanya", "olah", "oleh",
    "olehnya", "pada", "padahal", "padanya", "pak", "paling", "panjang", "pantas", "pantaskah", "pantaslah",
    "para", "pasti", "pastilah", "penting", "pentingnya", "per", "percuma", "perlu", "perlukah", "perlunya",
    "pernah", "persoalan", "pertama", "pertanyaan", "pertanyakan", "pihak", "pula", "pun", "punya", "rasa",
    "rasanya", "rata", "rupanya", "saat", "saatnya", "saja", "sajalah", "saling", "sama", "sambil",
    "sampai", "sana", "sangat", "sangatlah", "satu", "saya", "sayalah", "se", "sebab", "sebabnya",
    "sebagai", "sebagaimana", "sebagainya", "sebagian", "sebaik", "sebaiknya", "sebaliknya", "sebanyak",
    "sebegini", "sebegitu", "sebelum", "sebelumnya", "sebenarnya", "seberapa", "sebesar", "sebetulnya",
    "sebisanya", "sebuah", "secara", "secukupnya", "sedang", "sedangkan", "sedemikian", "sedikit", "sedikitnya",
    "seenaknya", "segala", "segalanya", "segera", "seharusnya", "sehingga", "seingat", "sejak", "sejauh",
    "sejenak", "sejumlah", "sekadar", "sekadarnya", "sekali", "sekalian", "sekaligus", "sekalipun", "sekarang",
    "sekecil", "seketika", "sekiranya", "sekitar", "sekitarnya", "sekurang", "sekurangnya", "sela", "selain",
    "selaku", "selalu", "selama", "selamanya", "selanjutnya", "seluruh", "seluruhnya", "semacam", "semakin",
    "semampu", "semampunya", "semasa", "semasih", "semata", "semaunya", "sementara", "semisal", "semisalnya",
    "sempat", "semua", "semuanya", "semula", "sendiri", "sendirian", "sendirinya", "seolah", "seorang",
    "sepanjang", "sepantasnya", "sepantasnyalah", "seperlunya", "seperti", "sepertinya", "sepihak", "sering",
    "seringnya", "serta", "serupa", "sesaat", "sesama", "sesampai", "sesegera", "sesekali", "seseorang",
    "sesuatu", "sesuatunya", "sesudah", "sesudahnya", "setelah", "setempat", "setengah", "seterusnya", "setiap",
    "setiba", "setibanya", "setidak", "setidaknya", "setinggi", "seusai", "sewaktu", "siap", "siapa",
    "siapakah", "siapapun", "sini", "sinilah", "suatu", "sudah", "sudahkah", "sudahlah", "supaya",
    "tadi", "tadinya", "tahu", "tahun", "tak", "tambah", "tambahnya", "tampak", "tampaknya", "tandas",
    "tandasnya", "tanpa", "tanya", "tanyakan", "tanyanya", "tapi", "tegas", "tegasnya", "telah", "tempat",
    "tengah", "tentang", "tentu", "tentulah", "tentunya", "tepat", "terakhir", "terasa", "terbanyak",
    "terdahulu", "terdapat", "terdiri", "terhadap", "terhadapnya", "teringat", "terjadilah", "terjadinya",
    "terkira", "terlalu", "terlebih", "terlihat", "termasuk", "ternyata", "tersampaikan", "tersebut",
    "tersebutlah", "tertentu", "tertuju", "terus", "terutama", "tetap", "tetapi", "tiap", "tiba",
    "tidak", "tidakkah", "tidaklah", "tidaknya", "tiga", "toh", "tunjuk", "turut", "tutur", "tuturnya",
    "ucap", "ucapnya", "ujar", "ujarnya", "umum", "umumnya", "ungkap", "ungkapnya", "untuk", "usah",
    "waduh", "wah", "wahai", "waktu", "waktunya", "walau", "walaupun", "wong", "yaitu", "yakin", "yakni", "yang"
]);

const EN_STOPWORDS = new Set([
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
    "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can",
    "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down",
    "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't",
    "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself",
    "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it",
    "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not",
    "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over",
    "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such",
    "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's",
    "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too",
    "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were",
    "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's",
    "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're",
    "you've", "your", "yours", "yourself", "yourselves"
]);

export function isStopword(word, mode = "all", customSet = null) {
    if (!word) return true;
    const lower = word.toLowerCase().trim();
    if (customSet && customSet.has(lower)) return true;
    if (mode === "none") return false;
    if (mode === "id") return ID_STOPWORDS.has(lower);
    if (mode === "en") return EN_STOPWORDS.has(lower);
    return ID_STOPWORDS.has(lower) || EN_STOPWORDS.has(lower);
}

export function parseCustomStopwords(text) {
    if (!text) return new Set();
    const tokens = text.toLowerCase().split(/[\s,;]+/);
    return new Set(tokens.filter((t) => t.length > 0));
}
