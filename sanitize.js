let hookAdded = false;
export function sanitize(html) {
    if (typeof DOMPurify === 'undefined') return html;
    if (!hookAdded) {
        DOMPurify.addHook('afterSanitizeAttributes', function(node) {
            if (node.tagName === 'A') {
                node.setAttribute('target', '_blank');
                node.setAttribute('rel', 'noopener noreferrer');
            }
            if (node.tagName === 'INPUT' && node.getAttribute('type') === 'checkbox') {
                node.setAttribute('disabled', 'true');
            }
        });
        hookAdded = true;
    }
    return DOMPurify.sanitize(html, {
        FORBID_TAGS: ["iframe", "object", "embed", "form", "select", "textarea", "style"],
        FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur", "onsubmit", "formaction"],
        ALLOW_DATA_ATTR: false
    });
}