const CARD = /(<button\b[^>]*\bid="math-card-(\d+)"[^>]*>)[\s\S]*?(<\/button>)/g;
const STATIC = /\sdata-static[\s>=]/;

export function renderCards(html, formulas, katex, names = {}) {
    let count = 0;
    const output = html.replace(CARD, (match, open, num, close) => {
        const id = Number(num);
        const tex = formulas[id];
        if (!tex || STATIC.test(open)) return match;
        count += 1;
        const markup = katex.renderToString(tex, { output: "html", throwOnError: false });
        const name = names[id] || "";
        const catMatch = open.match(/data-category="([^"]+)"/);
        const cat = catMatch ? catMatch[1] : "";
        const padId = id < 10 ? `0${id}` : `${id}`;
        const inner = `<div class="math-card-top"><span class="math-card-cat-badge">${cat}</span><span class="math-card-idx">#${padId}</span></div><div class="math-card-body">${markup}</div><div class="math-card-bottom"><span class="math-card-title">${name}</span><svg class="math-card-arrow" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg></div>`;
        return open + inner + close;
    });
    return { output, count };
}
