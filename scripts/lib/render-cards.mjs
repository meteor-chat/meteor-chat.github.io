const CARD = /(<button\b[^>]*\bid="math-card-(\d+)"[^>]*>)[\s\S]*?(<\/button>)/g;
const STATIC = /\sdata-static[\s>=]/;

export function renderCards(html, formulas, katex) {
    let count = 0;
    const output = html.replace(CARD, (match, open, num, close) => {
        const tex = formulas[Number(num)];
        if (!tex || STATIC.test(open)) return match;
        count += 1;
        const markup = katex.renderToString(tex, { output: "html", throwOnError: false });
        return open + markup + close;
    });
    return { output, count };
}
