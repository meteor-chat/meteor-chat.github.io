function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

const KEYWORDS = {
    python: new Set(["def", "class", "if", "elif", "else", "for", "while", "break", "continue", "return", "in", "not", "and", "or", "is", "pass", "yield", "lambda", "from", "import", "as", "try", "except", "finally", "raise", "with", "global", "nonlocal"]),
    javascript: new Set(["function", "class", "const", "let", "var", "if", "else", "for", "while", "do", "break", "continue", "return", "switch", "case", "default", "typeof", "instanceof", "new", "this", "throw", "try", "catch", "finally", "async", "await", "yield", "import", "export", "from", "of", "in"]),
    c: new Set(["void", "int", "char", "float", "double", "bool", "short", "long", "unsigned", "signed", "struct", "union", "enum", "const", "static", "extern", "return", "if", "else", "for", "while", "do", "break", "continue", "switch", "case", "default", "sizeof", "typedef"]),
    cpp: new Set(["void", "int", "char", "float", "double", "bool", "short", "long", "unsigned", "signed", "struct", "class", "union", "enum", "const", "static", "extern", "return", "if", "else", "for", "while", "do", "break", "continue", "switch", "case", "default", "sizeof", "typedef", "namespace", "using", "public", "private", "protected", "virtual", "override", "new", "delete", "template", "typename"]),
    java: new Set(["public", "protected", "private", "static", "final", "abstract", "void", "int", "byte", "short", "long", "float", "double", "char", "boolean", "class", "interface", "enum", "extends", "implements", "return", "if", "else", "for", "while", "do", "break", "continue", "switch", "case", "default", "new", "this", "super", "throw", "throws", "try", "catch", "finally", "import", "package"]),
    golang: new Set(["func", "package", "import", "var", "const", "type", "struct", "interface", "return", "if", "else", "for", "range", "break", "continue", "switch", "case", "default", "go", "chan", "select", "defer", "fallthrough"])
};

const TYPES = {
    python: new Set(["int", "float", "str", "bool", "list", "dict", "set", "tuple", "range", "len", "print", "enumerate", "zip", "min", "max", "sum"]),
    javascript: new Set(["console", "document", "window", "Array", "Object", "String", "Number", "Boolean", "Math", "Date", "length"]),
    c: new Set(["size_t", "NULL"]),
    cpp: new Set(["std", "vector", "string", "cout", "cin", "endl", "size_t", "size"]),
    java: new Set(["String", "Integer", "System", "out", "println", "Arrays", "List", "ArrayList", "length"]),
    golang: new Set(["int", "int32", "int64", "float32", "float64", "string", "bool", "byte", "rune", "len", "cap", "append", "make", "copy", "new", "println"])
};

const LITERALS = new Set(["true", "false", "True", "False", "null", "undefined", "nil", "None"]);

export function highlightSortCode(lineText, lang = "javascript") {
    if (!lineText) return "";
    const kwSet = KEYWORDS[lang] || KEYWORDS.javascript;
    const typeSet = TYPES[lang] || TYPES.javascript;

    const tokenRegex = /(\/\/[^\n]*|#[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|(\b[a-zA-Z_$][a-zA-Z0-9_$]*\b)|(:=|==|!=|<=|>=|\+\+|--|\+=|-=|\*=|\/=|&&|\|\||=>|->|[+\-*/%=<>!&|^~])|([^\s\w])/g;

    let result = "";
    let lastIndex = 0;
    let match;

    while ((match = tokenRegex.exec(lineText)) !== null) {
        const [, comment, string, number, ident, op, punct] = match;
        const matchStart = match.index;

        if (matchStart > lastIndex) {
            result += escapeHtml(lineText.slice(lastIndex, matchStart));
        }
        lastIndex = tokenRegex.lastIndex;

        if (comment) {
            result += `<span class="sort-hl-comment hljs-comment">${escapeHtml(comment)}</span>`;
        } else if (string) {
            result += `<span class="sort-hl-str hljs-string">${escapeHtml(string)}</span>`;
        } else if (number) {
            result += `<span class="sort-hl-num hljs-number">${escapeHtml(number)}</span>`;
        } else if (ident) {
            if (kwSet.has(ident)) {
                result += `<span class="sort-hl-keyword hljs-keyword">${escapeHtml(ident)}</span>`;
            } else if (LITERALS.has(ident)) {
                result += `<span class="sort-hl-literal hljs-literal">${escapeHtml(ident)}</span>`;
            } else if (typeSet.has(ident)) {
                result += `<span class="sort-hl-type hljs-type hljs-built_in">${escapeHtml(ident)}</span>`;
            } else {
                const rest = lineText.slice(lastIndex);
                if (/^\s*\(/.test(rest)) {
                    result += `<span class="sort-hl-fn hljs-function hljs-title">${escapeHtml(ident)}</span>`;
                } else {
                    result += `<span class="sort-hl-var hljs-variable">${escapeHtml(ident)}</span>`;
                }
            }
        } else if (op) {
            result += `<span class="sort-hl-op hljs-operator">${escapeHtml(op)}</span>`;
        } else if (punct) {
            result += escapeHtml(punct);
        }
    }

    if (lastIndex < lineText.length) {
        result += escapeHtml(lineText.slice(lastIndex));
    }

    return result;
}
