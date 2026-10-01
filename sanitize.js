export function sanitize(html) {
    return DOMPurify.sanitize(html, {
        FORBID_TAGS: ["iframe", "object", "embed", "form", "input", "select", "textarea", "button", "style"],
        FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur", "onsubmit", "formaction"],
        ALLOW_DATA_ATTR: false
    });
}