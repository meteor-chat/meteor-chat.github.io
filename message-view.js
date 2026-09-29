import { state } from "./app-state.js";
import { formatContent } from "./markdown-render.js";
import { copyMessage } from "./message-actions.js";
import { startEdit } from "./edit-mode.js";

function parseTemplate(name) {
    const div = document.createElement('div');
    div.innerHTML = state.templates[name];
    return div.firstElementChild;
}

export function buildUserMsg(msg, index) {
    const el = parseTemplate("tpl-user-msg");
    if (Array.isArray(msg.content)) {
        const imgPart = msg.content.find(p => p.type === "image_url");
        if (imgPart) {
            const wrap = parseTemplate("tpl-img-wrap");
            wrap.querySelector("img").src = imgPart.image_url.url;
            el.appendChild(wrap);
        }
        const textPart = msg.content.find(p => p.type === "text");
        if (textPart && textPart.text.trim()) {
            const bubble = parseTemplate("tpl-user-bubble");
            bubble.innerHTML = formatContent(textPart.text, false);
            el.appendChild(bubble);
        }
    } else {
        const bubble = parseTemplate("tpl-user-bubble");
        bubble.innerHTML = formatContent(msg.content, false);
        el.appendChild(bubble);
    }
    const actions = parseTemplate("tpl-user-actions");
    actions.querySelector(".btn-copy").addEventListener("click", () => copyMessage(index));
    actions.querySelector(".btn-edit").addEventListener("click", () => startEdit(index));
    el.appendChild(actions);
    return el;
}

export function buildAssistantMsg(msg, index, isLast) {
    const el = parseTemplate("tpl-assistant-msg");
    const content = el.querySelector(".msg-assistant-content");
    if (isLast) content.id = "streaming-target";
    content.innerHTML = formatContent(msg.content, true);
    const btn = el.querySelector(".btn-copy");
    if (isLast && state.isLoading) {
        btn.style.display = "none";
    }
    btn.addEventListener("click", () => copyMessage(index));
    return el;
}

export function buildTyping() {
    return parseTemplate("tpl-typing");
}
